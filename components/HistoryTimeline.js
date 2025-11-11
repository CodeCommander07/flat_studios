'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';

/**
 * UnifiedHistoryBlock
 * - Displays all years as pills in a single block (all visible together)
 * - Center card below shows the currently active year details
 * - Auto-advances, click a year to jump
 * - Smooth animated transitions using Framer Motion
 *
 * Install framer-motion if you haven't:
 * npm install framer-motion
 */

export default function UnifiedHistoryBlock() {
  const historyData = [
    {
      year: '2020',
      title: 'The Beginning',
      status: 'Completed',
      desc: 'Yapton & District is conceived by Flatcar under Skyway Group. First public release of the game.',
    },
    {
      year: '2021',
      title: 'Expansion & Growth',
      status: 'Completed',
      desc: 'Major map and UI upgrades in Version 3. Community tripled in size and new operators launched.',
    },
    {
      year: '2022',
      title: 'Version 4 Development',
      status: 'Completed',
      desc: 'Full rebuild from the ground up with new tech stack and enhanced realism.',
    },
    {
      year: '2023',
      title: 'v4 Launch & Rebrand',
      status: 'Completed',
      desc: 'Public release of Version 4, rebranding, and reaching 300,000 total visits milestone.',
    },
    {
      year: '2024',
      title: 'Modern Era',
      status: 'Planned',
      desc: '1M visits milestone, preparation for Version 4.1 with new live tracking system.',
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  // auto-advance every 4.5s
  useEffect(() => {
    const t = setInterval(() => {
      setActiveIndex((s) => (s + 1) % historyData.length);
    }, 4500);
    return () => clearInterval(t);
  }, [historyData.length]);

  return (
    <section className="max-w-6xl mx-auto py-12 px-4 text-white">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
        History Timeline
      </h2>

      {/* Top row: all years displayed together as pills */}
      <div className="flex gap-3 justify-center flex-wrap mb-8">
        {historyData.map((h, i) => (
          <button
            key={h.year}
            onClick={() => setActiveIndex(i)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all
              ${i === activeIndex ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-black shadow-lg' : 'bg-white/6 text-white/80 hover:bg-white/12'}`}
            aria-current={i === activeIndex ? 'true' : 'false'}
          >
            {h.year}
          </button>
        ))}
      </div>

      {/* Single centered block that animates between years */}
      <div className="flex justify-center">
        <div className="w-full max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={historyData[activeIndex].year}
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.99 }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
              className="relative bg-[#0f1418] border border-white/8 rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-3 mb-1">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-black font-bold">
                      {historyData[activeIndex].year}
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold leading-tight">
                        {historyData[activeIndex].title}
                      </h3>
                      <p className="text-sm text-white/60 mt-1">Key milestone summary</p>
                    </div>
                  </div>

                  <div className="mt-4 text-white/80">
                    <p className="leading-relaxed">{historyData[activeIndex].desc}</p>
                  </div>
                </div>

                <div className="flex-shrink-0 text-right">
                  {historyData[activeIndex].status === 'Completed' ? (
                    <div className="inline-flex items-center gap-2 bg-white/6 px-3 py-1 rounded-full">
                      <CheckCircle2 size={16} className="text-green-400" />
                      <span className="text-sm text-green-300 font-medium">Completed</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 bg-white/6 px-3 py-1 rounded-full">
                      <Clock size={16} className="text-yellow-400" />
                      <span className="text-sm text-yellow-300 font-medium">Planned</span>
                    </div>
                  )}
                </div>
              </div>

              {/* small pagination dots centered under the card */}
              <div className="mt-6 flex justify-center gap-2">
                {historyData.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    aria-label={`Go to ${historyData[i].year}`}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${i === activeIndex ? 'bg-white' : 'bg-white/30'}`}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
