'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function YaptonHistory() {
  const [openYear, setOpenYear] = useState(null);

  const history = [
    {
      year: '2020',
      events: [
        ['August', 'Yapton v1 created in mid 2020 with V2 being released in beta in August with operators Go Ahead London, Transdev, Stagecoach Southdowns & Tower Transit.'],
        ['September', 'Yapton officially becomes a Subsidiary of Skyway Group.'],
        ['December', 'V2.6 released.'],
      ],
    },
    {
      year: '2021',
      events: [
        ['January', 'Yapton hits 500 visits.'],
        ['March', 'Yapton hits 1,000 visits.'],
        ['April', 'Yapton’s first major operator Stagecoach (Initially Stagecoach Southdowns which merges into STUK) joins & sees the game’s first spike in activity. Yapton hits 1,500 visits.'],
        ['May', "V2.6.7 released - 'The Olton Update'. Yapton has its first total monthly visits surpassing 1,000. Yapton suffers its first major leak."],
        ['July', 'Yapton hits 3,000 visits.'],
        ['August', 'Yapton Version 3 released with operators Foxstar (previously Tower Transit), VisionBus, EnsignBus & Sullivan Buses. Ends the month on 3,500 visits.'],
        ['October', 'Yapton hits 4,000 visits.'],
        ['November', 'V3.3 released. Yapton hits 5,000 visits.'],
        ['December', 'V3.4 released. Yapton hits 6,000 visits.'],
      ],
    },
    {
      year: '2022',
      events: [
        ['January', "The word 'Yapton' becomes blocked by Roblox for a month."],
        ['February', 'Stagecoach & Vision Bus emergency contracts end; replaced by Blue Arrow Buses. V3.5 released. Yapton hits 7,000 visits.'],
        ['March', 'Go Whippet replaces Stagecoach Southdowns.'],
        ['April', 'South West Buses joins, replacing Sullivans. Foxstar announces closure.'],
        ['May', 'Yapton hits 9,000 visits. NCT added.'],
        ['June', 'Yapton hits 10,000 visits.'],
        ['August', 'Yapton Version 4 development starts.'],
        ['September', 'IRVING Coaches added.'],
        ['December', "Yapton sees its second major spike from operator investments, regularly filling 30-player servers. Version 4 publicly announced & enters Alpha testing. Yapton hits 20,000 visits."],
      ],
    },
    {
      year: '2023',
      events: [
        ['January', 'NCT removed. V3 enters dormant state while V4 development continues. V4 confirmed operators: IC & SWB.'],
        ['April', 'First joins Yapton as a confirmed operator for V4.'],
        ['July', 'West Coast Motors (Yapton Countrybus) joins as a confirmed operator for V4.'],
        ['August', 'V3 becomes a legacy version in preparation for V4. Version 4 releases on August 25, almost one year after development started.'],
        ['September', 'Yapton hits 30,000 visits and over 3,000 visits in a single day.'],
        ['October', 'Yapton hits 200k visits in 17 days, then 250k and 300k just two days later.'],
        ['November', 'Yapton hits 500k visits, then 600k within 20 days.'],
        ['December', 'Yapton hits 750k visits, finishing the year on 809.3k. V4.1 announced.'],
      ],
    },
    {
      year: '2024',
      events: [
        ['February 23rd', 'Yapton hits 1,000,000 visits.'],
        ['May', 'First removed.'],
      ],
    },
  ];

  return (
    <section className="max-w-7xl mx-auto text-white">
      <div className="bg-[#283335] border border-white/10 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-white/10 bg-[#283335] text-center">
          <h2 className="text-3xl font-bold">Yapton & District — Historical Timeline</h2>
          <p className="text-white/60 mt-1">
            Explore the evolution of Yapton & District from 2020 to 2024.
          </p>
        </div>

        {/* Inner dropdowns */}
        <div className="divide-y divide-white/10">
          {history.map((item, i) => {
            const isOpen = openYear === i;
            return (
              <div key={i}>
                <button
                  onClick={() => setOpenYear(isOpen ? null : i)}
                  className="w-full flex justify-between items-center p-5 text-left hover:bg-[#283335] transition-all"
                >
                  <h3 className="text-lg font-semibold">
                    {item.year}
                  </h3>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                      className="overflow-hidden bg-[#283335] border-t border-white/10"
                    >
                      <div className="p-5">
                        {item.events.map(([month, desc], idx) => (
                          <div key={idx} className="mb-3">
                            <h4 className="text-green-400 font-semibold">{month}</h4>
                            <p className="text-white/80">{desc}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
