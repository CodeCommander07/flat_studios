'use server';
import { useEffect, useState } from 'react';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetch('/api/reports/list')
      .then((res) => res.json())
      .then((data) => setReports(data.reports || []));
  }, []);

  return (
    <div className="text-white p-8">
      <h1 className="text-3xl font-bold mb-6">📊 Weekly Reports</h1>

      {reports.length === 0 ? (
        <p>No reports generated yet.</p>
      ) : (
        <table className="min-w-full border border-gray-700 rounded-lg overflow-hidden">
          <thead className="bg-gray-800 text-gray-200">
            <tr>
              <th className="p-3 text-left">Filename</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr
                key={r.id}
                className="border-t border-gray-800 hover:bg-gray-900 transition"
              >
                <td className="p-3">{r.filename}</td>
                <td className="p-3">
                  {new Date(r.date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="p-3 text-center flex justify-center gap-2">
                  <a
                    href={`/hub+/activity/reports/${r.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-semibold text-white"
                  >
                    View
                  </a>
                  <a
                    href={r.downloadUrl}
                    className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-md text-sm font-semibold text-white"
                  >
                    Download
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
