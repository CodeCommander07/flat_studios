'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Banner() {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    const loadBanner = async () => {
      try {
        const res = await fetch('/api/banner');
        const data = await res.json();
        setBanner(data);
      } catch {
        setBanner(null);
      }
    };
    loadBanner();
    const interval = setInterval(loadBanner, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  if (!banner || !banner.active) return null;

  return (
    <div
      className="w-full text-center py-2 px-3 shadow-md z-[50]"
      style={{
        background:
          banner.style?.bgColor ||
          'linear-gradient(90deg, #b5121b 0%, #c41e25 100%)',
        color: banner.style?.textColor || '#ffffff',
      }}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 text-sm sm:text-base font-semibold">
        <span>{banner.message}</span>
        {banner.linkUrl && (
          <Link
            href={banner.linkUrl}
            className="underline underline-offset-4 hover:opacity-80 font-medium"
            style={{ color: banner.style?.textColor || '#ffffff' }}
          >
            {banner.linkText || 'View updates'}
          </Link>
        )}
      </div>
    </div>
  );
}
