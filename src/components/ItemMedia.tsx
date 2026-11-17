import React, { useState } from 'react';
import { BookOpen, Briefcase, KeyRound, Laptop, Package, Shirt, Watch } from 'lucide-react';
import type { ItemCategory } from '../types/portal';

interface ItemMediaProps {
  imageUrl?: string;
  title: string;
  category: ItemCategory;
  className?: string;
}

function getCategoryIcon(category: ItemCategory) {
  switch (category) {
    case 'Electronics':
      return Laptop;
    case 'ID Cards & Keys':
      return KeyRound;
    case 'Bags & Wallets':
      return Briefcase;
    case 'Books & Stationery':
      return BookOpen;
    case 'Accessories':
      return Watch;
    case 'Clothing':
      return Shirt;
    default:
      return Package;
  }
}

export function ItemMedia({ imageUrl, title, category, className = '' }: ItemMediaProps) {
  const [failed, setFailed] = useState(false);
  const Icon = getCategoryIcon(category);

  if (!imageUrl || failed) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/60 text-slate-500 p-6 ${className}`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-[#14213D] shadow-xs">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <span className="mt-3 text-xs font-medium text-slate-600 text-center line-clamp-1 max-w-[85%]">
          {category}
        </span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={title}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
