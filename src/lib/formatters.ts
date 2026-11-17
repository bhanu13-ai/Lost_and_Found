import type { ItemCategory } from '../types/portal';

export const ITEM_CATEGORIES: ItemCategory[] = [
  'Electronics',
  'ID Cards & Keys',
  'Bags & Wallets',
  'Books & Stationery',
  'Accessories',
  'Clothing',
  'Other',
];

export const CAMPUS_LOCATIONS: string[] = [
  'Central Library — 1st Floor Commons',
  'Central Library — 2nd Floor Quiet Zone',
  'Academic Block A — Lecture Halls',
  'Academic Block B — Courtyard & Lobby',
  'Student Commons & Cafe Lounge',
  'Computer Lab 3 — Tech Wing',
  'Main Auditorium & Amphitheater',
  'Sports Complex & Gymnasium',
  'Campus Main Gate Security Post',
  'Hostel Quadrangle & Dining Hall',
];

export function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDisplayDate(dateString: string): string {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
