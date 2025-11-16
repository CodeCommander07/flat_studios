'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
  "circle-check-big": CircleCheckBig,
  "triangle-alert": TriangleAlert,
  "megaphone": Megaphone,
  "info": Info,
  "octagon-alert": OctagonAlert,
  "tree-pine": TreePine,
  "calendar-days": CalendarDays,
};

export default function Banner() {
  const [config, setConfig] = useState(null);
  const [index, setIndex] = useState(0);

  // Load banner config from API
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/banner');
        const data = await res.json();
        setConfig(data);
      } catch {
        setConfig(null);
      }
    };

    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  // Compute active banners safely
  const active = config?.banners?.filter((b) => b.active) || [];
  const mode = config?.displayMode || "rotate";

  // Rotation hook — ALWAYS declared
  useEffect(() => {
    if (!active.length) return;
    if (mode !== "rotate") return;
    if (active.length <= 1) return;

    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % active.length);
    }, 30000);

    return () => clearInterval(interval);
  }, [active.length, mode]);

  // SAFE return checks AFTER hooks
  if (!active.length) return null;

  const renderBanner = (b, key) => {
    const Icon = ICONS[b.icon];
    return (
      <div
        key={key}
        className="w-full text-center py-2 px-3 shadow-md z-[50]"
        style={{ background: b.bgColor, color: b.textColor }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
          {Icon && <Icon className="w-5 h-5" />}
          <span className="font-semibold">{b.message}</span>
          {b.linkUrl && (
            <Link
              href={b.linkUrl}
              className="underline underline-offset-4 font-medium"
              style={{ color: b.textColor }}
            >
              {b.linkText}
            </Link>
          )}
        </div>
      </div>
    );
  };

  // STACK MODE
  if (mode === "stack") {
    return <div className="w-full space-y-1">{active.map(renderBanner)}</div>;
  }

  // ROTATE MODE
  const current = active[index];

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
        >
          {renderBanner(current, index)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
