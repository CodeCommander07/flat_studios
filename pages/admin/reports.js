'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function ReportsPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/admin/report-list')
      .then(res => setFiles(res.data))
      .catch(() => setError('Failed to fetch reports'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="p-8 min-h-screen bg-[#0f1117] text-white">
      <h1 className="text-3xl font-bold mb-6">📁 Weekly Activity Reports</h1>

      {error && <p className="text-red-500">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className="space-y-4">
          {files.map(file => (
            <li key={file} className="bg-gray-800 p-4 rounded flex items-center justify-between">
              <span>{file}</span>
              <a
                href={`/api/reports/${file}`}
                className="text-blue-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
