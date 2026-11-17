import React, { useEffect, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { api } from '../lib/api';
import { ITEM_CATEGORIES } from '../lib/formatters';
import type { ItemCategory, ItemType, LostFoundItem, PortalStats } from '../types/portal';
import { ItemCard } from '../components/ItemCard';
import { EmptyState } from '../components/EmptyState';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

const HERO_IMAGE = '/src/assets/images/hero_sai_campus_1794891976413.jpg';

export function HomePage({ onNavigate }: HomePageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<ItemType | 'all'>('all');
  const [activeCategory, setActiveCategory] = useState<ItemCategory | 'All'>('All');
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [stats, setStats] = useState<PortalStats>({
    totalReported: 0,
    itemsRecovered: 0,
    activeLost: 0,
    activeFound: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.items
      .list({ type: activeType, category: activeCategory })
      .then((res) => {
        if (cancelled) return;
        setItems(res.items.slice(0, 6));
        setStats(res.stats);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeType, activeCategory]);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    onNavigate(q ? `/browse?search=${encodeURIComponent(q)}` : '/browse');
  };

  return (
    <div>
      {/* Hero Split */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-stretch">
            {/* Left Column */}
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
                Sai University · Campus Recovery Registry
              </p>
              <h1
                className="mt-3 font-display font-bold tracking-tight text-[#14213D] leading-[1.12]"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.25rem)', textWrap: 'balance' }}
              >
                Lost Something on Campus? Let&apos;s Find It!
              </h1>
              <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-xl">
                Report misplaced belongings, browse verified campus finds, and submit ownership claims
                directly with Sai University Security &amp; Student Affairs.
              </p>

              {/* Keyword Search Bar */}
              <form onSubmit={handleHeroSearch} className="mt-7 flex flex-col sm:flex-row gap-2.5 max-w-xl">
                <div className="relative flex-1">
                  <Search
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search laptop, ID card, library, SU-2026..."
                    aria-label="Search lost or found items"
                    className="w-full rounded-lg border border-slate-300 bg-[#F8FAFC] py-3 pl-10 pr-4 text-sm text-[#14213D] placeholder:text-slate-400 focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-[#14213D] px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14213D] focus-visible:ring-offset-2"
                >
                  Search Items
                </button>
              </form>

              {/* Quick Action Buttons */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('/report?type=lost')}
                  className="rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
                >
                  Report Lost Item
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/report?type=found')}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#14213D] hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
                >
                  Report Found Item
                </button>
              </div>
            </div>

            {/* Right Column: Campus Visual */}
            <div className="lg:col-span-6">
              <div className="relative h-72 sm:h-88 lg:h-full min-h-[340px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                <img
                  src={HERO_IMAGE}
                  alt="Sai University campus courtyard and academic library"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#14213D]/85 via-[#14213D]/25 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <p className="text-xs font-medium text-amber-300">
                    Main Academic Block · Room 104
                  </p>
                  <p className="mt-1 font-display text-base font-semibold leading-snug">
                    Centralized Campus Security Desk &amp; Digital Verification
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Full-width 4-Column Statistics Strip below Hero */}
          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 border-t border-slate-200 pt-8">
            <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-5 py-4">
              <p className="text-xs font-medium text-slate-500">Total Items Reported</p>
              <p className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-[#14213D] tabular-nums">
                {stats.totalReported}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-5 py-4">
              <p className="text-xs font-medium text-slate-500">Items Recovered</p>
              <p className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-emerald-700 tabular-nums">
                {stats.itemsRecovered}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-5 py-4">
              <p className="text-xs font-medium text-slate-500">Active Lost Items</p>
              <p className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-amber-700 tabular-nums">
                {stats.activeLost}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-5 py-4">
              <p className="text-xs font-medium text-slate-500">Active Found Items</p>
              <p className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-[#2563EB] tabular-nums">
                {stats.activeFound}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recently Reported Items + Category Filters */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#14213D]">
              Recently Reported Items
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              Filter live campus reports by status or category to locate missing belongings quickly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Interactive segmented control */}
            <div
              role="group"
              aria-label="Filter by report type"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1"
            >
              {(['all', 'lost', 'found'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveType(t)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    activeType === t
                      ? 'bg-[#14213D] text-white'
                      : 'text-slate-600 hover:text-[#14213D]'
                  }`}
                >
                  {t === 'all' ? 'All Items' : t === 'lost' ? 'Lost Items' : 'Found Items'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onNavigate('/browse')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:text-blue-700 whitespace-nowrap shrink-0"
            >
              <span>View Full Directory</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Category Filter Buttons */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2">
          {(['All', ...ITEM_CATEGORIES] as const).map((cat) => {
            const selected = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  selected
                    ? 'border-[#2563EB] bg-[#2563EB] text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-[#14213D]'
                }`}
              >
                {cat === 'All' ? 'All Categories' : cat}
              </button>
            );
          })}
        </div>

        {/* Item Grid */}
        <div className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-96 animate-pulse rounded-xl border border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="No matching campus reports"
              description="No items match the selected category right now. Try switching categories or publish a new report."
              actionLabel="Reset Filters"
              onAction={() => {
                setActiveType('all');
                setActiveCategory('All');
              }}
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
      </section>

      {/* How It Works Section */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#14213D]">
              How Campus Recovery Works
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              A structured four-step workflow keeps every misplaced belonging traceable from initial
              report to verified handover at Sai University.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: '01. Report Belonging',
                desc: 'Log lost or found items with campus building location, date, photos, and unique tracking ID.',
              },
              {
                step: '02. Search & Smart Match',
                desc: 'Search by keyword or category; the portal automatically flags matching Lost and Found reports.',
              },
              {
                step: '03. Submit Ownership Claim',
                desc: 'Claimants provide proof of ownership and distinctive marks for Campus Staff or finder review.',
              },
              {
                step: '04. Verified Pickup',
                desc: 'Once approved, collect your belonging from Security Desk Room 104 using your University ID.',
              },
            ].map((entry) => (
              <div
                key={entry.step}
                className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-6"
              >
                <h3 className="font-display text-base font-semibold text-[#14213D]">
                  {entry.step}
                </h3>
                <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">{entry.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
