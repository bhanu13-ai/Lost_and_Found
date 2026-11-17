import { Router } from 'express';
import { dbRepo } from '../config/db.ts';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.ts';
import type { ClaimStatus } from '../../src/types/portal.ts';

const router = Router();

const VALID_CLAIM_STATUSES: ClaimStatus[] = ['Pending Review', 'Approved', 'Rejected', 'Handed Over'];

router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const isStaff = req.user!.role === 'Staff';
    const claims = await dbRepo.listClaims({
      userId: req.user!.userId,
      includeAll: isStaff,
    });
    res.json({ claims });
  } catch (err) {
    console.error('List claims error:', err);
    res.status(500).json({ error: 'Failed to load ownership claims.' });
  }
});

router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { itemId, proofDescription, distinctiveMarks, lostDateApprox } = req.body as {
      itemId?: string;
      proofDescription?: string;
      distinctiveMarks?: string;
      lostDateApprox?: string;
    };

    if (!itemId) {
      res.status(400).json({ error: 'Item ID is required to submit a claim.' });
      return;
    }
    if (!proofDescription || proofDescription.trim().length < 10) {
      res.status(400).json({ error: 'Please describe how you can verify ownership (at least 10 characters).' });
      return;
    }
    if (!distinctiveMarks || distinctiveMarks.trim().length < 3) {
      res.status(400).json({ error: 'Please mention any distinctive marks, serial numbers, or contents.' });
      return;
    }

    const item = await dbRepo.findItemById(itemId);
    if (!item) {
      res.status(404).json({ error: 'Referenced item was not found.' });
      return;
    }

    if (item.status === 'Recovered' || item.status === 'Archived') {
      res.status(400).json({ error: 'This item has already been recovered or archived.' });
      return;
    }

    const existingClaims = await dbRepo.listClaims({ itemId: item.id, includeAll: true });
    const duplicate = existingClaims.find(
      (c) => c.claimantId === req.user!.userId && (c.status === 'Pending Review' || c.status === 'Approved')
    );
    if (duplicate) {
      res.status(409).json({ error: `You already have an active claim (${duplicate.claimCode}) for this item.` });
      return;
    }

    const createdClaim = await dbRepo.createClaim({
      itemId: item.id,
      itemTitle: item.title,
      itemTrackingCode: item.trackingCode,
      itemType: item.type,
      claimantId: req.user!.userId,
      claimantName: req.user!.fullName,
      claimantEmail: req.user!.email,
      claimantStudentId: req.user!.studentId,
      claimantRole: req.user!.role,
      proofDescription: proofDescription.trim(),
      distinctiveMarks: distinctiveMarks.trim(),
      lostDateApprox: lostDateApprox || item.dateOccurred,
    });

    if (item.status === 'Active') {
      await dbRepo.updateItem(item.id, { status: 'Claim Pending' });
    }

    // Notify item reporter & staff reviewers
    if (item.reportedBy.userId !== req.user!.userId) {
      await dbRepo.createNotification({
        userId: item.reportedBy.userId,
        title: 'New Ownership Claim Received',
        message: `${req.user!.fullName} submitted claim ${createdClaim.claimCode} for "${item.title}".`,
        type: 'claim',
        relatedItemId: item.id,
      });
    }

    const staffMembers = await dbRepo.listStaffUsers();
    for (const staff of staffMembers) {
      if (staff.id !== req.user!.userId && staff.id !== item.reportedBy.userId) {
        await dbRepo.createNotification({
          userId: staff.id,
          title: 'Claim Verification Required',
          message: `Claim ${createdClaim.claimCode} on ${item.trackingCode} (${item.title}) is awaiting staff review.`,
          type: 'claim',
          relatedItemId: item.id,
        });
      }
    }

    res.status(201).json({
      message: `Ownership claim ${createdClaim.claimCode} submitted for verification.`,
      claim: createdClaim,
    });
  } catch (err) {
    console.error('Create claim error:', err);
    res.status(500).json({ error: 'Failed to submit ownership claim.' });
  }
});

router.patch('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const claim = await dbRepo.findClaimById(req.params.id);
    if (!claim) {
      res.status(404).json({ error: 'Claim record not found.' });
      return;
    }

    const item = await dbRepo.findItemById(claim.itemId);
    const isStaff = req.user!.role === 'Staff';
    const isItemReporter = item && item.reportedBy.userId === req.user!.userId;

    if (!isStaff && !isItemReporter) {
      res.status(403).json({ error: 'Only Campus Staff or the item reporter can verify this claim.' });
      return;
    }

    const { status, staffNotes } = req.body as {
      status?: ClaimStatus;
      staffNotes?: string;
    };

    if (!status || !VALID_CLAIM_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Invalid claim verification status.' });
      return;
    }

    const updatedClaim = await dbRepo.updateClaim(claim.id, {
      status,
      staffReviewerName: req.user!.fullName,
      staffNotes: staffNotes?.trim() || claim.staffNotes,
    });

    if (item) {
      if (status === 'Handed Over') {
        await dbRepo.updateItem(item.id, { status: 'Recovered' });
      } else if (status === 'Approved') {
        await dbRepo.updateItem(item.id, { status: 'Claim Pending' });
      } else if (status === 'Rejected') {
        const allItemClaims = await dbRepo.listClaims({ itemId: item.id, includeAll: true });
        const hasOtherActive = allItemClaims.some(
          (c) => c.id !== claim.id && (c.status === 'Pending Review' || c.status === 'Approved')
        );
        if (!hasOtherActive && item.status !== 'Recovered') {
          await dbRepo.updateItem(item.id, { status: 'Active' });
        }
      }
    }

    await dbRepo.createNotification({
      userId: claim.claimantId,
      title: `Claim ${claim.claimCode} ${status}`,
      message:
        status === 'Approved'
          ? `Your claim on "${claim.itemTitle}" was approved. Bring your Sai University ID to Security Desk Room 104 for pickup.`
          : status === 'Handed Over'
            ? `Item "${claim.itemTitle}" has been handed over and marked Recovered.`
            : `Your claim on "${claim.itemTitle}" was updated to ${status}.${staffNotes ? ` Note: ${staffNotes}` : ''}`,
      type: 'status',
      relatedItemId: claim.itemId,
    });

    res.json({
      message: `Claim ${claim.claimCode} updated to ${status}.`,
      claim: updatedClaim,
    });
  } catch (err) {
    console.error('Update claim error:', err);
    res.status(500).json({ error: 'Failed to update claim status.' });
  }
});

export default router;
