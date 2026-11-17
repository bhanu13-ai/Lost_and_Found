import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  Trash2,
  User,
} from 'lucide-react';
import { api } from '../lib/api';
import { formatDisplayDate, formatRelativeTime } from '../lib/formatters';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { LostFoundItem, OwnershipClaim } from '../types/portal';
import { ItemMedia } from '../components/ItemMedia';
import { ItemCard } from '../components/ItemCard';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface ItemDetailPageProps {
  itemId: string;
  onNavigate: (path: string) => void;
}

export function ItemDetailPage({ itemId, onNavigate }: ItemDetailPageProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [item, setItem] = useState<LostFoundItem | null>(null);
  const [claims, setClaims] = useState<OwnershipClaim[]>([]);
  const [claimCount, setClaimCount] = useState(0);
  const [matches, setMatches] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Claim form state
  const [proofDescription, setProofDescription] = useState('');
  const [distinctiveMarks, setDistinctiveMarks] = useState('');
  const [lostDateApprox, setLostDateApprox] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // Confirm delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadItem = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.items.get(itemId);
      setItem(res.item);
      setClaims(res.claims);
      setClaimCount(res.claimCount);
      setMatches(res.potentialMatches);
      setLostDateApprox(res.item.dateOccurred);
    } catch (err) {
      setError((err as Error).message || 'Unable to load item details.');
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onNavigate(`/login?redirect=${encodeURIComponent(`/item/${itemId}`)}`);
      return;
    }
    if (!item) return;

    setSubmittingClaim(true);
    try {
      const res = await api.claims.create({
        itemId: item.id,
        proofDescription,
        distinctiveMarks,
        lostDateApprox,
      });
      showToast(res.message, 'success');
      setProofDescription('');
      setDistinctiveMarks('');
      await loadItem();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleMarkRecovered = async () => {
    if (!item) return;
    try {
      await api.items.update(item.id, { status: 'Recovered' });
      showToast('Item marked as Recovered.', 'success');
      await loadItem();
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    setDeleting(true);
    try {
      await api.items.delete(item.id);
      showToast('Item report deleted.', 'success');
      onNavigate('/browse');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-96 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-[#14213D]">Report Not Found</h1>
        <p className="mt-2 text-sm text-slate-600">{error || 'This item report may have been removed.'}</p>
        <button
          type="button"
          onClick={() => onNavigate('/browse')}
          className="mt-6 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  const isOwnerOrStaff = Boolean(user && (user.role === 'Staff' || user.id === item.reportedBy.userId));
  const userHasActiveClaim = Boolean(
    user && claims.some((c) => c.claimantId === user.id && (c.status === 'Pending Review' || c.status === 'Approved'))
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => onNavigate('/browse')}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#14213D] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>Back to Directory</span>
      </button>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Media + Details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="aspect-[4/3] w-full bg-slate-100">
              <ItemMedia imageUrl={item.imageUrl} title={item.title} category={item.category} />
            </div>

            <div className="p-6 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${item.type === 'lost' ? 'text-amber-700' : 'text-[#2563EB]'}`}>
                    {item.type === 'lost' ? 'Lost Belonging' : 'Found Belonging'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{item.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{formatRelativeTime(item.createdAt)}</span>
                </div>
                <span className="font-mono text-xs text-slate-500 tabular-nums">{item.trackingCode}</span>
              </div>

              <h1 className="mt-3 font-display text-2xl sm:text-3xl font-bold text-[#14213D] leading-tight">
                {item.title}
              </h1>

              <p className="mt-4 text-base text-slate-700 leading-relaxed">{item.description}</p>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-slate-100 pt-5 text-sm">
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-medium text-slate-500">Campus Location</p>
                    <p className="font-medium text-[#14213D]">{item.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Calendar className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      {item.type === 'lost' ? 'Date Lost' : 'Date Found'}
                    </p>
                    <p className="font-medium text-[#14213D] tabular-nums">
                      {formatDisplayDate(item.dateOccurred)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <User className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-medium text-slate-500">Reported By</p>
                    <p className="font-medium text-[#14213D]">
                      {item.reportedBy.fullName} ({item.reportedBy.role})
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-medium text-slate-500">Handover Channel</p>
                    <p className="font-medium text-[#14213D]">{item.contactPreference}</p>
                  </div>
                </div>
              </div>

              {isOwnerOrStaff && (
                <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
                  {item.status !== 'Recovered' && (
                    <button
                      type="button"
                      onClick={handleMarkRecovered}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      <span>Mark as Recovered</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    <span>Delete Report</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Status & Claim Panel */}
        <div className="lg:col-span-5 space-y-6">
          {/* Recovery Status Progress */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-[#14213D]">
                Recovery Progress
              </h2>
              <span className="text-xs font-medium text-slate-500 tabular-nums">
                {claimCount} {claimCount === 1 ? 'claim' : 'claims'} logged
              </span>
            </div>

            <ol className="mt-5 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                <div>
                  <p className="font-medium text-[#14213D]">01. Report Registered</p>
                  <p className="text-xs text-slate-500">Logged in Sai University registry</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                {item.status === 'Claim Pending' || item.status === 'Recovered' ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                ) : (
                  <Clock className="h-5 w-5 shrink-0 text-slate-300" aria-hidden="true" />
                )}
                <div>
                  <p className="font-medium text-[#14213D]">02. Ownership Verification</p>
                  <p className="text-xs text-slate-500">
                    {item.status === 'Claim Pending'
                      ? 'Claim under review by Campus Staff'
                      : item.status === 'Recovered'
                        ? 'Ownership verified'
                        : 'Awaiting claimant proof'}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                {item.status === 'Recovered' ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                ) : (
                  <Clock className="h-5 w-5 shrink-0 text-slate-300" aria-hidden="true" />
                )}
                <div>
                  <p className="font-medium text-[#14213D]">03. Campus Handover Complete</p>
                  <p className="text-xs text-slate-500">
                    {item.status === 'Recovered'
                      ? 'Belonging returned to rightful owner'
                      : 'Pending ID verification at Security Desk'}
                  </p>
                </div>
              </li>
            </ol>
          </div>

          {/* Submit Claim Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-display text-lg font-semibold text-[#14213D]">
              {item.type === 'found' ? 'Claim This Belonging' : 'Report Match or Ownership'}
            </h2>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Provide accurate identifying details. Campus Security Staff verify all claims before
              releasing belongings.
            </p>

            {item.status === 'Recovered' ? (
              <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                This item has already been verified and returned to its owner.
              </div>
            ) : !user ? (
              <div className="mt-5 space-y-3 rounded-lg border border-slate-200 bg-[#F8FAFC] p-4">
                <p className="text-sm text-slate-700">
                  Sign in with your Sai University credentials to submit an ownership claim.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate(`/login?redirect=${encodeURIComponent(`/item/${item.id}`)}`)}
                  className="w-full rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  Sign In to Claim Item
                </button>
              </div>
            ) : userHasActiveClaim ? (
              <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-[#14213D]">
                You already have an active ownership claim submitted for this item. Track its review
                progress in your portal dashboard.
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="claim-proof" className="block text-xs font-semibold text-[#14213D]">
                    Proof of Ownership
                  </label>
                  <textarea
                    id="claim-proof"
                    rows={3}
                    required
                    minLength={10}
                    value={proofDescription}
                    onChange={(e) => setProofDescription(e.target.value)}
                    placeholder="Explain when and where you lost this item, or how you can unlock/verify it..."
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-[#F8FAFC] px-3 py-2 text-sm text-[#14213D] focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                  />
                </div>

                <div>
                  <label htmlFor="claim-marks" className="block text-xs font-semibold text-[#14213D]">
                    Distinctive Marks / Contents / Serial Info
                  </label>
                  <input
                    id="claim-marks"
                    type="text"
                    required
                    minLength={3}
                    value={distinctiveMarks}
                    onChange={(e) => setDistinctiveMarks(e.target.value)}
                    placeholder="Stickers, engraving, case color, items inside..."
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-[#F8FAFC] px-3 py-2 text-sm text-[#14213D] focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                  />
                </div>

                <div>
                  <label htmlFor="claim-date" className="block text-xs font-semibold text-[#14213D]">
                    Approximate Date Lost / Seen
                  </label>
                  <input
                    id="claim-date"
                    type="date"
                    required
                    value={lostDateApprox}
                    onChange={(e) => setLostDateApprox(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-[#F8FAFC] px-3 py-2 text-sm text-[#14213D] focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingClaim}
                  className="w-full rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  {submittingClaim ? 'Submitting Claim...' : 'Submit Ownership Claim'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Potential Campus Matches */}
      {matches.length > 0 && (
        <section className="mt-12 border-t border-slate-200 pt-10">
          <h2 className="font-display text-xl font-bold text-[#14213D]">
            Potential {item.type === 'lost' ? 'Found' : 'Lost'} Matches on Campus
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Related {item.category} reports that may correspond to this belonging.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((m) => (
              <ItemCard key={m.id} item={m} onSelect={(id) => onNavigate(`/item/${id}`)} />
            ))}
          </div>
        </section>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Item Report"
        description={`Are you sure you want to remove "${item.title}" (${item.trackingCode})? This also removes associated pending claims.`}
        confirmLabel="Delete Report"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
}
