'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch('/api/reports/list')
      .then((res) => res.json())
      .then((data) => setReports(data.reports || []));
  }, []);

const deleteReport = async (id) => {
  if (!confirm("Are you sure you want to delete this report?")) return;

  try {
    const res = await fetch(`/api/reports/delete/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Delete failed");

    // ✅ triggers exit animation
    setReports(prev => prev.filter(r => r.id !== id));
  } catch (err) {
    console.error("Delete error:", err);
    alert("Failed to delete report.");
  }
};

  return (
    <div className="text-white p-8">
      <h1 className="text-3xl font-bold mb-6">📊 Weekly Reports</h1>

      {reports.length === 0 ? (
        <p>No reports generated yet.</p>
      ) : (
        <div className="overflow-hidden border border-white/10 rounded-xl">
          <table className="min-w-full border-collapse">
            <thead className="sticky top-0 bg-[#1F2729] text-gray-300 uppercase text-sm shadow-md z-10">
              <tr>
                <th className="p-3 text-left font-semibold">Filename</th>
                <th className="p-3 text-left font-semibold">Date</th>
                <th className="p-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>

            <AnimatePresence>
              {reports.map((r, i) => {
                const isSelected = selected === r.id;
                return (
                  <motion.tbody
                    key={r.id}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    layout
                  >
                    <>
                      <tr
                        onClick={() => setSelected(isSelected ? null : r.id)}
                        className={`transition-colors cursor-pointer ${isSelected
                            ? 'bg-[#3A474B]'
                            : i % 2 === 0
                              ? 'bg-[#232C2E]'
                              : 'bg-[#2C3A3D]'
                          } hover:bg-[#324246]`}
                      >
                        <td className="p-3 whitespace-nowrap">{r.filename}</td>
                        <td className="p-3 whitespace-nowrap">
                          {new Date(r.date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-3">
                          <div
                            className="flex justify-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <a
                              href={`/hub+/activity/reports/${r.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 rounded-full text-xs font-medium border border-blue-500 text-blue-300 hover:bg-blue-500/20"
                            >
                              View
                            </a>
                            <a
                              href={r.downloadUrl}
                              className="px-3 py-1 rounded-full text-xs font-medium border border-emerald-500 text-emerald-300 hover:bg-emerald-500/20"
                            >
                              Download
                            </a>
                            <button
                              onClick={() => deleteReport(r.id)}
                              className="px-3 py-1 rounded-full text-xs font-medium border border-red-500 text-red-300 hover:bg-red-500/20"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isSelected && (
                        <tr className="bg-[#1F2729]">
                          <td colSpan={3} className="p-4">
                            <div className="text-gray-200 text-sm space-y-2">
                              <div>
                                <span className="text-gray-400 text-xs uppercase">
                                  Full Filename
                                </span>
                                <div className="mt-1">{r.filename}</div>
                              </div>

                              <div>
                                <span className="text-gray-400 text-xs uppercase">
                                  Created
                                </span>
                                <div className="mt-1">
                                  {new Date(r.date).toLocaleString('en-GB')}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  </motion.tbody>
                );
              })}
            </AnimatePresence>
          </table>
        </div>
      )}
    </div>
  );
}
