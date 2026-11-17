import React from 'react';
import { ArrowRight, CheckCircle2, Clock, MapPin, Search } from 'lucide-react';
import type { LostFoundItem } from '../types/portal';
import { formatRelativeTime } from '../lib/formatters';
import { ItemMedia } from './ItemMedia';

interface ItemCardProps {
  item: LostFoundItem;
  onSelect: (id: string) => void;
}

export function ItemCard({ item, onSelect }: ItemCardProps) {
  const isLost = item.type === 'lost';
  const isRecovered = item.status === 'Recovered';
  const isPending = item.status === 'Claim Pending';

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-150 hover:border-slate-300 hover:shadow-sm"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <ItemMedia
          imageUrl={item.imageUrl}
          title={item.title}
          category={item.category}
          className="h-full w-full transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        {/* Zero-pill unboxed metadata row */}
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 truncate">
            <span
              className={`font-semibold ${
                isLost ? 'text-amber-700' : 'text-[#2563EB]'
              }`}
            >
              {isLost ? 'Lost' : 'Found'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{item.category}</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400 tabular-nums shrink-0">
            {item.trackingCode}
          </span>
        </div>

        <h3 className="mt-2 font-display text-base font-semibold text-[#14213D] leading-snug line-clamp-2">
          <button
            type="button"
            onClick={() => onSelect(item.id)}
            className="text-left hover:text-[#2563EB] transition-colors focus-visible:outline-none focus-visible:underline"
          >
            {item.title}
          </button>
        </h3>

        <p className="mt-2 text-sm text-slate-600 line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            <span className="truncate">{item.location}</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {isRecovered ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span className="font-medium text-emerald-700">Recovered</span>
                </>
              ) : isPending ? (
                <>
                  <Clock className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden="true" />
                  <span className="font-medium text-amber-700">Claim Pending</span>
                </>
              ) : (
                <>
                  <Search className="h-3.5 w-3.5 shrink-0 text-[#2563EB]" aria-hidden="true" />
                  <span className="font-medium text-[#14213D]">Active Report</span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{formatRelativeTime(item.createdAt)}</span>
            </div>

            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className="inline-flex items-center gap-1 font-semibold text-[#2563EB] hover:text-blue-700 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded"
            >
              <span>{item.type === 'found' && item.status !== 'Recovered' ? 'Claim' : 'Inspect'}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
