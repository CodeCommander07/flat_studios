'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function ReportViewer() {
  const router = useRouter();
  const { id } = router.query;

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function fetchReport() {
      try {
        const res = await fetch(`/api/reports/list`);
        const data = await res.json();
        const found = data.reports?.find((r) => r.id === id);
        setReport(found || null);
      } catch (err) {
        console.error('Error fetching report:', err);
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

  // 👇 Build Google Docs Viewer URL
  const baseUrl = process.env.BASE_URL || 'https://flat-studios.vercel.app';
  const fileUrl = `${baseUrl}/api/reports/view/${report.id}`;
  const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(
    fileUrl
  )}&embedded=true`;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="p-4 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          📊 Viewing: {report.filename}
        </h1>
        <div className="flex gap-2">
          <a
            href={report.downloadUrl}
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

      <main className="flex-1">
        <iframe
          src={googleViewerUrl}
          className="w-full h-[calc(100vh-4rem)] border-none"
          allowFullScreen
        />
      </main>
    </div>
  );
}
