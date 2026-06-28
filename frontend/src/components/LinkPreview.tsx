'use client';

import { useEffect, useState } from 'react';

interface LinkPreviewData {
  title: string;
  description: string;
  image: string;
  url: string;
}

function extractUrl(text: string): string | null {
  const re = /https?:\/\/[^\s]+/;
  const m = text.match(re);
  return m ? m[0] : null;
}

function stripQuery(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}${u.pathname}`;
  } catch {
    return url;
  }
}

export function useLinkPreview(text: string) {
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const url = extractUrl(text);
    if (!url) { setPreview(null); return; }

    const stripped = stripQuery(url);
    let cancelled = false;
    setLoading(true);

    fetch(`/api/preview?url=${encodeURIComponent(stripped)}`)
      .then((r) => r.json().catch(() => null))
      .then((data) => {
        if (!cancelled && data) setPreview(data);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [text]);

  return { preview, loading };
}

export function LinkPreviewCard({ preview }: { preview: LinkPreviewData }) {
  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1.5 flex overflow-hidden rounded-lg border border-white/10 bg-white/5"
    >
      {preview.image && (
        <img src={preview.image} alt="" className="h-20 w-20 shrink-0 object-cover" />
      )}
      <div className="flex min-w-0 flex-col justify-center px-3 py-2">
        <p className="truncate text-xs font-semibold text-foreground">{preview.title || preview.url}</p>
        {preview.description && (
          <p className="mt-0.5 line-clamp-2 text-[11px] text-foreground/50">{preview.description}</p>
        )}
      </div>
    </a>
  );
}
