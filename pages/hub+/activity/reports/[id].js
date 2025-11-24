'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ExcelJS from 'exceljs';

export default function ReportViewer() {
  const router = useRouter();
  const { id } = router.query;

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    if (!id) return;

    async function fetchReport() {
      try {
        const res = await fetch(`/api/reports/list`);
        const data = await res.json();
        const found = data.reports?.find((r) => r.id === id);
        setReport(found || null);

        if (!found) {
          setLoading(false);
          return;
        }

        const fileRes = await fetch(`/api/reports/view/${id}`);
        if (!fileRes.ok) throw new Error('Failed to download report file.');

        const arrayBuffer = await fileRes.arrayBuffer();

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);
        const worksheet = workbook.worksheets[0];

        const parsedRows = [];
        worksheet.eachRow((row) => {
          parsedRows.push(row.values.slice(1));
        });

        setRows(parsedRows);
      } catch (err) {
        console.error('Error loading report:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center text-white h-screen">
        <p className="text-lg animate-pulse">Loading report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center text-white h-screen">
        <p>Report not found.</p>
      </div>
    );
  }

  const filtered =
    search.trim() === ''
      ? rows
      : rows.filter((r) =>
        r.some((c) => String(c ?? '').toLowerCase().includes(search.toLowerCase()))
      );

  return (
    <div className="flex flex-col text-white">
      <header className="p-4 bg-[#283335] border-b border-gray-800 flex items-center justify-between shadow-lg">
        <h1 className="text-xl font-semibold">
          📊 Viewing: {report.filename}
        </h1>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#1f2a30] border border-white/20 px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <a
            href={`/api/reports/view/${id}`}
            className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-md text-sm font-semibold"
          >
            Download
          </a>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-6">
        <div className="overflow-auto border border-white/10 rounded-xl">
          <table className="min-w-full border-collapse">
            <thead className="sticky top-0 bg-[#283335] text-gray-300 uppercase text-sm shadow-md z-10">
              <tr>
                {rows[0].map((header, i) => (
                  <th
                    key={i}
                    className="p-3 border-b border-gray-700 font-semibold text-left whitespace-nowrap"
                  >
                    {header ?? ''}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.slice(1).map((row, rowIndex) => {
                const isSelected = selectedRow === rowIndex;
                return (
                  <>
                    <tr
                      key={rowIndex}
                      onClick={() => setSelectedRow(isSelected ? null : rowIndex)}
                      className={`transition-colors cursor-pointer ${isSelected
                          ? 'bg-[#3A474B]'
                          : rowIndex % 2 === 0
                            ? 'bg-[#232C2E]'
                            : 'bg-[#2C3A3D]'
                        } hover:bg-[#324246]`}
                    >
                      {row.map((cell, colIndex) => (
                        <td
                          key={colIndex}
                          className="p-3 text-sm text-gray-200 max-w-[250px] overflow-hidden text-ellipsis whitespace-nowrap"
                          title={String(cell ?? '')}
                        >
                          {cell ?? ''}
                        </td>
                      ))}
                    </tr>

                    {isSelected && (
                      <tr className="bg-[#1F2729]">
                        <td colSpan={row.length} className="p-4">
                          <div className="text-gray-200 text-sm space-y-2 max-h-48 overflow-auto">
                            {row.map((cell, i) => (
                              <div key={i} className="border-b border-white/10 pb-2">
                                <span className="text-gray-400 text-xs uppercase">
                                  {rows[0][i] ?? 'Column'}
                                </span>
                                <div className="mt-1 whitespace-pre-wrap">
                                  {String(cell ?? '')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
