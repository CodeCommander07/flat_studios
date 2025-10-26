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

  useEffect(() => {
    if (!id) return;

    async function fetchReport() {
      try {
        // Get report metadata
        const res = await fetch(`/api/reports/list`);
        const data = await res.json();
        const found = data.reports?.find((r) => r.id === id);
        setReport(found || null);

        if (!found) {
          setLoading(false);
          return;
        }

        // Fetch the Excel file binary
        const fileRes = await fetch(`/api/reports/view/${id}`);
        if (!fileRes.ok) throw new Error('Failed to download report file.');

        const arrayBuffer = await fileRes.arrayBuffer();

        // Read workbook
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);
        const worksheet = workbook.worksheets[0]; // Show first sheet

        const parsedRows = [];
        worksheet.eachRow((row) => {
          parsedRows.push(row.values.slice(1)); // Remove empty index 0
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
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
        <p>Loading report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
        <p>Report not found.</p>
      </div>
    );
  }

  return (
    <div className="max-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="p-4 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          📊 Viewing: {report.filename}
        </h1>
        <div className="flex gap-2">
          <a
            href={`/api/reports/view/${id}`}
            className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-md text-sm font-semibold"
          >
            Download
          </a>
          <a
            href="/reports"
            className="bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded-md text-sm font-semibold"
          >
            Back
          </a>
        </div>
      </header>

      {/* Table */}
      <main className="flex-1 overflow-x-auto p-6">
        {rows.length > 0 ? (
          <table className="min-w-full text-left border-collapse">
            <thead className="bg-gray-800 text-gray-300 uppercase text-sm">
              <tr>
                {rows[0].map((header, i) => (
                  <th key={i} className="p-3 border-b border-gray-700">
                    {header ?? ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-gray-800 hover:bg-gray-800/60"
                >
                  {row.map((cell, colIndex) => (
                    <td key={colIndex} className="p-3 text-sm text-gray-200">
                      {cell ?? ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-400">No data found in this report.</p>
        )}
      </main>
    </div>
  );
}
