import React, { useEffect, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { CAMPUS_LOCATIONS, ITEM_CATEGORIES } from '../lib/formatters';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { ItemCategory, ItemType } from '../types/portal';

interface ReportItemPageProps {
  initialType?: ItemType;
  onNavigate: (path: string) => void;
}

export function ReportItemPage({ initialType = 'lost', onNavigate }: ReportItemPageProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [type, setType] = useState<ItemType>(initialType);

  useEffect(() => {
    setType(initialType);
  }, [initialType]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Electronics');
  const [locationPreset, setLocationPreset] = useState(CAMPUS_LOCATIONS[0]);
  const [customLocation, setCustomLocation] = useState('');
  const [dateOccurred, setDateOccurred] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [identifyingNote, setIdentifyingNote] = useState('');
  const [contactPreference, setContactPreference] = useState('Campus Security Desk (Room 104) & Email');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-[#14213D]">
            Sign In to Report a Belonging
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Sai University students, faculty, and staff sign in before publishing Lost or Found
            reports so Campus Security can track ownership claims reliably.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate(`/login?redirect=${encodeURIComponent(`/report?type=${type}`)}`)}
              className="rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Sign In to Continue
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/register')}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#14213D] hover:bg-slate-50"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await api.upload.image(file);
      setImageUrl(res.imageUrl);
      showToast('Item photograph uploaded.', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalLocation = locationPreset === 'Other Campus Area' ? customLocation.trim() : locationPreset;
    if (!finalLocation) {
      showToast('Please specify the campus location.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.items.create({
        type,
        title,
        category,
        description,
        location: finalLocation,
        dateOccurred,
        imageUrl: imageUrl || undefined,
        contactPreference,
        identifyingNote: identifyingNote || undefined,
      });
      showToast(res.message, 'success');
      onNavigate(`/item/${res.item.id}`);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#14213D]">
          Report a Lost or Found Belonging
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Provide clear details so Campus Security and the Sai University community can identify and
          return the item promptly.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-7 rounded-xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6"
      >
        {/* Reusable Report Type Switch */}
        <div>
          <span className="block text-xs font-semibold text-[#14213D]">Report Type</span>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('lost')}
              className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                type === 'lost'
                  ? 'border-[#2563EB] bg-blue-50/60 text-[#14213D]'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <span className="block text-sm font-semibold">I Lost an Item</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Alert finders and Campus Security
              </span>
            </button>
            <button
              type="button"
              onClick={() => setType('found')}
              className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                type === 'found'
                  ? 'border-[#2563EB] bg-blue-50/60 text-[#14213D]'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <span className="block text-sm font-semibold">I Found an Item</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Help return it to its owner
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="item-title" className="block text-xs font-semibold text-[#14213D]">
              Item Name
            </label>
            <input
              id="item-title"
              type="text"
              required
              minLength={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Space Gray MacBook Air 13-inch, Student ID Card, Black Umbrella"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#14213D] focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>

          <div>
            <label htmlFor="item-category" className="block text-xs font-semibold text-[#14213D]">
              Item Category
            </label>
            <select
              id="item-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ItemCategory)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-[#14213D] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            >
              {ITEM_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="item-date" className="block text-xs font-semibold text-[#14213D]">
              {type === 'lost' ? 'Date Lost' : 'Date Found'}
            </label>
            <input
              id="item-date"
              type="date"
              required
              value={dateOccurred}
              onChange={(e) => setDateOccurred(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#14213D] focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="item-location" className="block text-xs font-semibold text-[#14213D]">
              Campus Location
            </label>
            <select
              id="item-location"
              value={locationPreset}
              onChange={(e) => setLocationPreset(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-[#14213D] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            >
              {CAMPUS_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
              <option value="Other Campus Area">Other Campus Area (Specify)</option>
            </select>
            {locationPreset === 'Other Campus Area' && (
              <input
                type="text"
                required
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="Enter exact building, room number, or outdoor walkway"
                className="mt-2.5 w-full rounded-lg border border-slate-300 bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#14213D] focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              />
            )}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="item-description" className="block text-xs font-semibold text-[#14213D]">
              Description
            </label>
            <textarea
              id="item-description"
              rows={4}
              required
              minLength={10}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe color, brand, size, accessories, and circumstances..."
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#14213D] focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="item-note" className="block text-xs font-semibold text-[#14213D]">
              Verification Detail (Optional)
            </label>
            <input
              id="item-note"
              type="text"
              value={identifyingNote}
              onChange={(e) => setIdentifyingNote(e.target.value)}
              placeholder="e.g., Custom wallpaper, engraving, or items stored inside"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#14213D] focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="item-contact" className="block text-xs font-semibold text-[#14213D]">
              Preferred Contact / Handover Channel
            </label>
            <input
              id="item-contact"
              type="text"
              required
              value={contactPreference}
              onChange={(e) => setContactPreference(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#14213D] focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>

          {/* Image Upload */}
          <div className="sm:col-span-2">
            <span className="block text-xs font-semibold text-[#14213D]">
              Item Photograph (Optional, JPG/PNG/WebP up to 5MB)
            </span>
            {imageUrl ? (
              <div className="mt-2 relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <img
                  src={imageUrl}
                  alt="Uploaded item preview"
                  referrerPolicy="no-referrer"
                  className="h-56 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm hover:bg-white"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Remove</span>
                </button>
              </div>
            ) : (
              <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-[#F8FAFC] px-6 py-8 text-center hover:border-[#2563EB] hover:bg-blue-50/30 transition-colors">
                <ImagePlus className="h-7 w-7 text-slate-400" aria-hidden="true" />
                <span className="mt-2 text-sm font-medium text-[#14213D]">
                  {uploadingImage ? 'Uploading photograph...' : 'Click to upload item photo'}
                </span>
                <span className="mt-1 text-xs text-slate-500">
                  Clear lighting helps owners recognize belongings faster
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  disabled={uploadingImage}
                  className="sr-only"
                />
              </label>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={() => onNavigate('/browse')}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || uploadingImage}
            className="rounded-lg bg-[#2563EB] px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {submitting
              ? 'Publishing Report...'
              : type === 'lost'
                ? 'Publish Lost Report'
                : 'Publish Found Report'}
          </button>
        </div>
      </form>
    </div>
  );
}
