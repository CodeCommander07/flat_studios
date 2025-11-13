'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CircleCheckBig,
  TriangleAlert,
  Megaphone,
  Info,
  OctagonAlert,
  TreePine,
  CalendarDays,
} from 'lucide-react';

const ICONS = {
  'circle-check-big': CircleCheckBig,
  'triangle-alert': TriangleAlert,
  'megaphone': Megaphone,
  'info': Info,
  'octagon-alert': OctagonAlert,
  'tree-pine': TreePine,
  'calendar-days': CalendarDays,
};

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
    const interval = setInterval(loadBanner, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!banner || !banner.active) return null;

  const IconComponent = ICONS[banner.icon] || TriangleAlert;

  return (
    <div
      className="w-full text-center py-2 px-3 shadow-md z-[50]"
      style={{
        background:
          banner.bgColor ||
          'linear-gradient(90deg, #b5121b 0%, #c41e25 100%)',
        color: banner.textColor || '#ffffff',
      }}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 text-sm sm:text-base font-semibold">
        <div className="flex items-center gap-2">
          <IconComponent className="w-5 h-5 flex-shrink-0" />
          <span>{banner.message}</span>
        </div>
        {banner.linkUrl && (
          <Link
            href={banner.linkUrl}
            className="underline underline-offset-4 hover:opacity-80 font-medium"
            style={{ color: banner.textColor || '#ffffff' }}
          >
            {banner.linkText || 'View updates'}
          </Link>
        )}
      </div>
    </div>
  );
}
