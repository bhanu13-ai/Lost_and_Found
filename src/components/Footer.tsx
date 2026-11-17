import React from 'react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="border-t border-slate-200 bg-[#14213D] text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-5 space-y-3">
            <h2 className="font-display text-lg font-bold text-white tracking-tight">
              Sai University — Campus Lost &amp; Found Portal
            </h2>
            <p className="text-sm text-slate-300/90 leading-relaxed max-w-md">
              Managed by the Office of Campus Security &amp; Student Affairs to ensure prompt,
              transparent recovery of personal belongings across academic blocks, libraries, and student commons.
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Portal Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/browse')}
                  className="hover:text-white transition-colors"
                >
                  Browse Lost &amp; Found
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/report?type=lost')}
                  className="hover:text-white transition-colors"
                >
                  Report Lost Belonging
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/report?type=found')}
                  className="hover:text-white transition-colors"
                >
                  Report Found Belonging
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/dashboard')}
                  className="hover:text-white transition-colors"
                >
                  Verification Dashboard
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Campus Recovery Desk
            </h3>
            <div className="space-y-1.5 text-sm text-slate-300/90">
              <p>Main Academic Block, Ground Floor, Room 104</p>
              <p>Monday – Saturday · 08:30 AM – 06:30 PM</p>
              <p>Email: lostandfound@saiuniversity.edu.in</p>
              <p className="font-mono text-xs text-slate-400 pt-1">Security Desk: +91 (044) 2498-5104</p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Sai University. Office of Student Affairs &amp; Campus Security.</p>
          <p>Official Campus Recovery Registry</p>
        </div>
      </div>
    </footer>
  );
}
