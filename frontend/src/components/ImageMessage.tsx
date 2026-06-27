"use client";

import { useState } from "react";

export default function ImageMessage({ url, alt }: { url: string; alt: string }) {
  const [open, setOpen] = useState(false);

  const resolvedUrl = url.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? "http://localhost:8000"}${url}` : url;

  return (
    <>
      <button onClick={() => setOpen(true)} className="block max-w-[280px] overflow-hidden rounded-lg">
        <img src={resolvedUrl} alt={alt} className="h-auto w-full object-cover" loading="lazy" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setOpen(false)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white/80 transition-colors hover:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <a
            href={resolvedUrl}
            download
            onClick={(e) => e.stopPropagation()}
            className="absolute right-14 top-4 z-10 rounded-full bg-black/50 p-2 text-white/80 transition-colors hover:text-white"
            title="Download"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </a>
          <img
            src={resolvedUrl}
            alt={alt}
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
