import React, { useEffect, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { api } from '../lib/api';
import { ITEM_CATEGORIES } from '../lib/formatters';
import type { ItemCategory, ItemStatus, ItemType, LostFoundItem } from '../types/portal';
import { ItemCard } from '../components/ItemCard';
import { EmptyState } from '../components/EmptyState';

interface BrowsePageProps {
  initialSearch?: string;
  onNavigate: (path: string) => void;
}

export function BrowsePage({ initialSearch = '', onNavigate }: BrowsePageProps) {
  const [search, setSearch] = useState(initialSearch);
  const [typeFilter, setTypeFilter] = useState<ItemType | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ItemCategory | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | 'All'>('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      api.items
        .list({
          type: typeFilter,
          category: categoryFilter,
          status: statusFilter,
          search,
          sort: sortOrder,
        })
        .then((res) => {
          if (!cancelled) setItems(res.items);
        })
        .catch(() => {
          if (!cancelled) setItems([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [typeFilter, categoryFilter, statusFilter, search, sortOrder]);

  const resetAll = () => {
    setSearch('');
    setTypeFilter('all');
    setCategoryFilter('All');
    setStatusFilter('All');
    setSortOrder('newest');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#14213D]">
            Campus Lost &amp; Found Directory
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Search across every active and recovered item reported at Sai University.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('/report')}
          className="rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          Submit New Report
        </button>
      </div>

      {/* Filter Bar */}
      <div className="mt-7 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="relative lg:col-span-5">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search item name, description, location, or tracking code..."
              aria-label="Search directory"
              className="w-full rounded-lg border border-slate-300 bg-[#F8FAFC] py-2.5 pl-10 pr-4 text-sm text-[#14213D] focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>

          <div className="lg:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as ItemCategory | 'All')}
              aria-label="Filter by category"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#14213D] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            >
              <option value="All">All Categories</option>
              {ITEM_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ItemStatus | 'All')}
              aria-label="Filter by status"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#14213D] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Claim Pending">Claim Pending</option>
              <option value="Recovered">Recovered</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              aria-label="Sort items"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#14213D] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div role="group" aria-label="Filter by type" className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            {(['all', 'lost', 'found'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  typeFilter === t
                    ? 'bg-white text-[#14213D] shadow-xs'
                    : 'text-slate-600 hover:text-[#14213D]'
                }`}
              >
                {t === 'all' ? 'All Reports' : t === 'lost' ? 'Lost Only' : 'Found Only'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              {items.length} {items.length === 1 ? 'result' : 'results'}
            </span>
            {(search || typeFilter !== 'all' || categoryFilter !== 'All' || statusFilter !== 'All') && (
              <button
                type="button"
                onClick={resetAll}
                className="font-semibold text-[#2563EB] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mt-7">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-96 animate-pulse rounded-xl border border-slate-200 bg-white" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No items found matching your criteria"
            description="Try broadening your search terms, clearing active filters, or filing a new lost item report so campus finders can alert you."
            actionLabel="Reset Search & Filters"
            onAction={resetAll}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onSelect={(id) => onNavigate(`/item/${id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
