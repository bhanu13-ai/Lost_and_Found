import { Router } from 'express';
import { dbRepo } from '../config/db.ts';
import { optionalAuth, requireAuth, type AuthenticatedRequest } from '../middleware/auth.ts';
import type { ItemCategory, ItemStatus, ItemType } from '../../src/types/portal.ts';

const router = Router();

const VALID_CATEGORIES: ItemCategory[] = [
  'Electronics',
  'ID Cards & Keys',
  'Bags & Wallets',
  'Books & Stationery',
  'Accessories',
  'Clothing',
  'Other',
];

const VALID_STATUSES: ItemStatus[] = ['Active', 'Claim Pending', 'Recovered', 'Archived'];

router.get('/', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const typeParam = (req.query.type as string) || 'all';
    const categoryParam = (req.query.category as string) || 'All';
    const statusParam = (req.query.status as string) || 'All';
    const search = (req.query.search as string) || '';
    const sort = req.query.sort === 'oldest' ? 'oldest' : 'newest';
    const mine = req.query.mine === 'true';

    const items = await dbRepo.listItems({
      type: typeParam === 'lost' || typeParam === 'found' ? (typeParam as ItemType) : 'all',
      category: categoryParam !== 'All' ? (categoryParam as ItemCategory) : 'All',
      status: statusParam !== 'All' ? (statusParam as ItemStatus) : 'All',
      search,
      sort,
      reportedByUserId: mine && req.user ? req.user.userId : undefined,
    });

    const stats = await dbRepo.getStats();
    res.json({ items, stats });
  } catch (err) {
    console.error('List items error:', err);
    res.status(500).json({ error: 'Failed to retrieve items.' });
  }
});

router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const item = await dbRepo.findItemById(req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Item report not found.' });
      return;
    }

    const allItems = await dbRepo.listItems();
    const oppositeType: ItemType = item.type === 'lost' ? 'found' : 'lost';
    const titleWords = item.title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);

    const potentialMatches = allItems
      .filter((candidate) => candidate.id !== item.id && candidate.type === oppositeType && candidate.status !== 'Recovered')
      .filter((candidate) => {
        if (candidate.category === item.category) return true;
        const text = `${candidate.title} ${candidate.description}`.toLowerCase();
        return titleWords.some((w) => text.includes(w));
      })
      .slice(0, 3);

    let claims = await dbRepo.listClaims({ itemId: item.id, includeAll: true });
    const viewer = req.user;
    const isStaffOrOwner = viewer && (viewer.role === 'Staff' || viewer.userId === item.reportedBy.userId);

    if (!isStaffOrOwner) {
      claims = claims
        .filter((c) => viewer && c.claimantId === viewer.userId)
        .map((c) => c);
    }

    res.json({
      item,
      claims,
      claimCount: (await dbRepo.listClaims({ itemId: item.id, includeAll: true })).length,
      potentialMatches,
    });
  } catch (err) {
    console.error('Get item detail error:', err);
    res.status(500).json({ error: 'Failed to load item details.' });
  }
});

router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      type,
      title,
      category,
      description,
      location,
      dateOccurred,
      imageUrl,
      contactPreference,
      identifyingNote,
    } = req.body as {
      type?: ItemType;
      title?: string;
      category?: ItemCategory;
      description?: string;
      location?: string;
      dateOccurred?: string;
      imageUrl?: string;
      contactPreference?: string;
      identifyingNote?: string;
    };

    if (type !== 'lost' && type !== 'found') {
      res.status(400).json({ error: 'Report type must be either "lost" or "found".' });
      return;
    }
    if (!title || title.trim().length < 3) {
      res.status(400).json({ error: 'Please provide an item name (at least 3 characters).' });
      return;
    }
    if (!category || !VALID_CATEGORIES.includes(category)) {
      res.status(400).json({ error: 'Please select a valid item category.' });
      return;
    }
    if (!description || description.trim().length < 10) {
      res.status(400).json({ error: 'Please provide a clear description (at least 10 characters).' });
      return;
    }
    if (!location || location.trim().length < 2) {
      res.status(400).json({ error: 'Please specify the campus location.' });
      return;
    }

    const created = await dbRepo.createItem({
      type,
      title: title.trim(),
      category,
      description: description.trim(),
      location: location.trim(),
      dateOccurred: dateOccurred || new Date().toISOString().slice(0, 10),
      imageUrl: imageUrl?.trim() || undefined,
      contactPreference: contactPreference?.trim() || 'Campus Security Desk & University Email',
      identifyingNote: identifyingNote?.trim() || undefined,
      reportedBy: {
        userId: req.user!.userId,
        fullName: req.user!.fullName,
        email: req.user!.email,
        studentId: req.user!.studentId,
        role: req.user!.role,
      },
    });

    // Notify users with matching opposite reports in the same category
    const oppositeType: ItemType = type === 'lost' ? 'found' : 'lost';
    const candidates = await dbRepo.listItems({ type: oppositeType, category, status: 'Active' });
    for (const match of candidates.slice(0, 3)) {
      if (match.reportedBy.userId !== req.user!.userId) {
        await dbRepo.createNotification({
          userId: match.reportedBy.userId,
          title: 'Potential Campus Match Found',
          message: `A newly reported ${type} item "${created.title}" in ${category} may match your report (${match.trackingCode}).`,
          type: 'match',
          relatedItemId: created.id,
        });
      }
    }

    res.status(201).json({
      message: `${type === 'lost' ? 'Lost' : 'Found'} item report published (${created.trackingCode}).`,
      item: created,
    });
  } catch (err) {
    console.error('Create item error:', err);
    res.status(500).json({ error: 'Failed to publish item report.' });
  }
});

router.patch('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const existing = await dbRepo.findItemById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Item report not found.' });
      return;
    }

    const isOwner = existing.reportedBy.userId === req.user!.userId;
    const isStaff = req.user!.role === 'Staff';
    if (!isOwner && !isStaff) {
      res.status(403).json({ error: 'You do not have permission to update this item.' });
      return;
    }

    const { status, title, description, location } = req.body as {
      status?: ItemStatus;
      title?: string;
      description?: string;
      location?: string;
    };

    const patch: Record<string, unknown> = {};
    if (status && VALID_STATUSES.includes(status)) patch.status = status;
    if (title && title.trim().length >= 3) patch.title = title.trim();
    if (description && description.trim().length >= 10) patch.description = description.trim();
    if (location && location.trim().length >= 2) patch.location = location.trim();

    const updated = await dbRepo.updateItem(existing.id, patch);
    res.json({ message: 'Item report updated.', item: updated });
  } catch (err) {
    console.error('Update item error:', err);
    res.status(500).json({ error: 'Failed to update item.' });
  }
});

router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const existing = await dbRepo.findItemById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Item report not found.' });
      return;
    }

    const isOwner = existing.reportedBy.userId === req.user!.userId;
    const isStaff = req.user!.role === 'Staff';
    if (!isOwner && !isStaff) {
      res.status(403).json({ error: 'You do not have permission to delete this report.' });
      return;
    }

    await dbRepo.deleteItem(existing.id);
    res.json({ message: 'Item report deleted successfully.' });
  } catch (err) {
    console.error('Delete item error:', err);
    res.status(500).json({ error: 'Failed to delete item.' });
  }
});

export default router;
