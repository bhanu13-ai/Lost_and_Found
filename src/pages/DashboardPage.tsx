import React, { useCallback, useEffect, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  Package,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import { formatRelativeTime } from '../lib/formatters';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type {
  ClaimStatus,
  LostFoundItem,
  OwnershipClaim,
  PortalNotification,
} from '../types/portal';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

type DashboardTab = 'verification' | 'all-items' | 'my-reports' | 'my-claims' | 'notifications';

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const isStaff = user?.role === 'Staff';
  const [activeTab, setActiveTab] = useState<DashboardTab>(isStaff ? 'verification' : 'my-reports');
  const [myItems, setMyItems] = useState<LostFoundItem[]>([]);
  const [allItems, setAllItems] = useState<LostFoundItem[]>([]);
  const [claims, setClaims] = useState<OwnershipClaim[]>([]);
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const [staffNoteByClaim, setStaffNoteByClaim] = useState<Record<string, string>>({});
  const [busyClaimId, setBusyClaimId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LostFoundItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setActiveTab(isStaff ? 'verification' : 'my-reports');
  }, [isStaff]);

  const loadWorkspace = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [mineRes, claimsRes, notifRes, allRes] = await Promise.all([
        api.items.list({ mine: true }),
        api.claims.list(),
        api.notifications.list(),
        isStaff ? api.items.list() : Promise.resolve({ items: [], stats: null }),
      ]);
      setMyItems(mineRes.items);
      setClaims(claimsRes.claims);
      setNotifications(notifRes.notifications);
      if (isStaff) setAllItems(allRes.items);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [user, isStaff, showToast]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-[#14213D]">
            Sign In to Access Your Campus Portal
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Manage your reported belongings, track ownership claims, or access the Campus Staff
            verification console.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/login?redirect=/dashboard')}
              className="rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/register')}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#14213D] hover:bg-slate-50"
            >
              Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleClaimAction = async (claimId: string, status: ClaimStatus) => {
    setBusyClaimId(claimId);
    try {
      const notes = staffNoteByClaim[claimId]?.trim();
      const res = await api.claims.update(claimId, { status, staffNotes: notes });
      showToast(res.message, 'success');
      await loadWorkspace();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setBusyClaimId(null);
    }
  };

  const handleMarkItemRecovered = async (itemId: string) => {
    try {
      await api.items.update(itemId, { status: 'Recovered' });
      showToast('Item marked as Recovered.', 'success');
      await loadWorkspace();
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.items.delete(deleteTarget.id);
      showToast('Item report deleted.', 'success');
      setDeleteTarget(null);
      await loadWorkspace();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleReadAllNotifications = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const pendingClaimsCount = claims.filter((c) => c.status === 'Pending Review').length;

  const sidebarLinks: Array<{ id: DashboardTab; label: string; count?: number; icon: any }> = isStaff
    ? [
        { id: 'verification', label: 'Verification Queue', count: pendingClaimsCount, icon: ClipboardCheck },
        { id: 'all-items', label: 'All Campus Reports', count: allItems.length, icon: Package },
        { id: 'my-reports', label: 'My Reports', count: myItems.length, icon: FileText },
        { id: 'notifications', label: 'Notifications', count: unreadCount, icon: Bell },
      ]
    : [
        { id: 'my-reports', label: 'My Reported Items', count: myItems.length, icon: FileText },
        { id: 'my-claims', label: 'My Ownership Claims', count: claims.length, icon: ClipboardCheck },
        { id: 'notifications', label: 'Notifications', count: unreadCount, icon: Bell },
      ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Contextual Workspace Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Sai University Portal / {isStaff ? 'Campus Staff Verification Console' : `${user.role} Dashboard`}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-[#14213D]">
            {user.fullName}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 font-mono tabular-nums">
            {user.studentId} · {user.email} · {user.role}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/report')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>New Report</span>
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
              onNavigate('/');
            }}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Workspace Split: Sidebar + Main Viewport */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <nav aria-label="Dashboard sections" className="space-y-1">
            {sidebarLinks.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#14213D] text-white'
                      : 'text-slate-700 hover:bg-white hover:text-[#14213D]'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{tab.label}</span>
                  </span>
                  {typeof tab.count === 'number' && (
                    <span
                      className={`font-mono text-xs tabular-nums ${
                        active ? 'text-slate-200' : 'text-slate-500'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="lg:col-span-9 min-w-0">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />
              ))}
            </div>
          ) : activeTab === 'verification' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-[#14213D]">
                  Ownership Claim Verification Queue
                </h2>
                <span className="text-xs text-slate-500 tabular-nums">
                  {claims.length} total claims
                </span>
              </div>

              {claims.length === 0 ? (
                <EmptyState
                  title="No ownership claims in queue"
                  description="Submitted claims from students and faculty will appear here for verification."
                />
              ) : (
                claims.map((claim) => (
                  <div
                    key={claim.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono font-semibold text-[#14213D]">{claim.claimCode}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{claim.itemTrackingCode}</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{formatRelativeTime(claim.createdAt)}</span>
                        </div>
                        <h3 className="mt-1 font-display text-base font-semibold text-[#14213D]">
                          <button
                            type="button"
                            onClick={() => onNavigate(`/item/${claim.itemId}`)}
                            className="hover:text-[#2563EB] text-left"
                          >
                            {claim.itemTitle}
                          </button>
                        </h3>
                        <p className="mt-1 text-xs text-slate-600">
                          Claimant: <span className="font-medium text-[#14213D]">{claim.claimantName}</span>{' '}
                          ({claim.claimantStudentId} · {claim.claimantRole})
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                          claim.status === 'Handed Over' || claim.status === 'Approved'
                            ? 'text-emerald-700'
                            : claim.status === 'Rejected'
                              ? 'text-red-600'
                              : 'text-amber-700'
                        }`}
                      >
                        {claim.status === 'Rejected' ? (
                          <XCircle className="h-4 w-4" aria-hidden="true" />
                        ) : claim.status === 'Pending Review' ? (
                          <Clock className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        )}
                        <span>{claim.status}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 rounded-lg bg-[#F8FAFC] p-4 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold text-slate-500">Proof of Ownership</p>
                        <p className="mt-1 text-slate-700 leading-relaxed">{claim.proofDescription}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500">Distinctive Marks / Contents</p>
                        <p className="mt-1 text-slate-700 leading-relaxed">{claim.distinctiveMarks}</p>
                      </div>
                    </div>

                    {claim.status !== 'Handed Over' && claim.status !== 'Rejected' && (
                      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
                        <input
                          type="text"
                          value={staffNoteByClaim[claim.id] || ''}
                          onChange={(e) =>
                            setStaffNoteByClaim((prev) => ({ ...prev, [claim.id]: e.target.value }))
                          }
                          placeholder="Add verification note or pickup instructions..."
                          className="flex-1 rounded-lg border border-slate-300 bg-[#F8FAFC] px-3 py-2 text-xs text-[#14213D] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                        />
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {claim.status === 'Pending Review' && (
                            <button
                              type="button"
                              disabled={busyClaimId === claim.id}
                              onClick={() => handleClaimAction(claim.id, 'Approved')}
                              className="rounded-lg bg-[#2563EB] px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                            >
                              Approve Claim
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={busyClaimId === claim.id}
                            onClick={() => handleClaimAction(claim.id, 'Handed Over')}
                            className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            Mark Handed Over
                          </button>
                          <button
                            type="button"
                            disabled={busyClaimId === claim.id}
                            onClick={() => handleClaimAction(claim.id, 'Rejected')}
                            className="rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'all-items' ? (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 className="font-display text-base font-semibold text-[#14213D]">
                  All Campus Reports
                </h2>
                <span className="text-xs text-slate-500 tabular-nums">{allItems.length} records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-[#F8FAFC] text-xs font-semibold text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Tracking ID</th>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allItems.map((it) => (
                      <tr key={it.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                          {it.trackingCode}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => onNavigate(`/item/${it.id}`)}
                            className="font-medium text-[#14213D] hover:text-[#2563EB] text-left"
                          >
                            {it.title}
                          </button>
                          <p className="text-xs text-slate-500">{it.location}</p>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold">
                          <span className={it.type === 'lost' ? 'text-amber-700' : 'text-[#2563EB]'}>
                            {it.type === 'lost' ? 'Lost' : 'Found'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-700 whitespace-nowrap">
                          {it.status}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            {it.status !== 'Recovered' && (
                              <button
                                type="button"
                                onClick={() => handleMarkItemRecovered(it.id)}
                                className="text-xs font-semibold text-emerald-700 hover:underline"
                              >
                                Mark Recovered
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(it)}
                              className="text-slate-400 hover:text-red-600 p-1"
                              aria-label={`Delete ${it.title}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'my-reports' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-[#14213D]">
                  My Reported Belongings
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('/report')}
                  className="text-xs font-semibold text-[#2563EB] hover:underline"
                >
                  + File New Report
                </button>
              </div>

              {myItems.length === 0 ? (
                <EmptyState
                  title="You have not filed any reports yet"
                  description="Lost something on campus or turned in a found item? Create a report to track recovery."
                  actionLabel="Report an Item"
                  onAction={() => onNavigate('/report')}
                />
              ) : (
                myItems.map((it) => (
                  <div
                    key={it.id}
                    className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className={it.type === 'lost' ? 'font-semibold text-amber-700' : 'font-semibold text-[#2563EB]'}>
                          {it.type === 'lost' ? 'Lost' : 'Found'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{it.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{it.trackingCode}</span>
                      </div>
                      <h3 className="mt-1 font-display text-base font-semibold text-[#14213D]">
                        <button
                          type="button"
                          onClick={() => onNavigate(`/item/${it.id}`)}
                          className="hover:text-[#2563EB] text-left"
                        >
                          {it.title}
                        </button>
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {it.location} · Status: <span className="font-medium text-[#14213D]">{it.status}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onNavigate(`/item/${it.id}`)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#14213D] hover:bg-slate-50"
                      >
                        View
                      </button>
                      {it.status !== 'Recovered' && (
                        <button
                          type="button"
                          onClick={() => handleMarkItemRecovered(it.id)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          Mark Recovered
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(it)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'my-claims' ? (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-semibold text-[#14213D]">
                My Ownership Claims
              </h2>

              {claims.length === 0 ? (
                <EmptyState
                  title="No ownership claims submitted"
                  description="Browse found campus items and submit proof of ownership if you spot your belonging."
                  actionLabel="Browse Campus Directory"
                  onAction={() => onNavigate('/browse')}
                />
              ) : (
                claims.map((claim) => (
                  <div
                    key={claim.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-semibold text-[#14213D]">{claim.claimCode}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{claim.itemTrackingCode}</span>
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          claim.status === 'Approved' || claim.status === 'Handed Over'
                            ? 'text-emerald-700'
                            : claim.status === 'Rejected'
                              ? 'text-red-600'
                              : 'text-amber-700'
                        }`}
                      >
                        {claim.status}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-semibold text-[#14213D]">
                      <button
                        type="button"
                        onClick={() => onNavigate(`/item/${claim.itemId}`)}
                        className="hover:text-[#2563EB] text-left"
                      >
                        {claim.itemTitle}
                      </button>
                    </h3>
                    <p className="text-sm text-slate-600">{claim.proofDescription}</p>
                    {claim.staffNotes && (
                      <p className="rounded-lg bg-[#F8FAFC] px-3 py-2 text-xs text-slate-700">
                        <span className="font-semibold">Security Desk Note:</span> {claim.staffNotes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-[#14213D]">
                  Portal Notifications
                </h2>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleReadAllNotifications}
                    className="text-xs font-semibold text-[#2563EB] hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <EmptyState
                  title="No notifications yet"
                  description="Smart Lost/Found matches and claim review updates will appear here."
                />
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-xl border p-4 transition-colors ${
                      n.read ? 'border-slate-200 bg-white' : 'border-blue-200 bg-blue-50/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#14213D]">{n.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{n.message}</p>
                      </div>
                      <span className="text-xs text-slate-400 tabular-nums shrink-0">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>
                    {n.relatedItemId && (
                      <button
                        type="button"
                        onClick={() => onNavigate(`/item/${n.relatedItemId}`)}
                        className="mt-2.5 text-xs font-semibold text-[#2563EB] hover:underline"
                      >
                        Inspect Related Item
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Item Report"
        description={
          deleteTarget
            ? `Are you sure you want to permanently remove "${deleteTarget.title}" (${deleteTarget.trackingCode})?`
            : ''
        }
        confirmLabel="Delete Report"
        busy={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
