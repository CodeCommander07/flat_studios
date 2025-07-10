'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

export default function ReportsPage() {
  const router = useRouter();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('User'));
    if (!userData?._id) {
      setError('User not logged in');
      setLoading(false);
      return;
    }
    setUser(userData);

    // Fetch reports after user is set
    axios.get('/api/admin/report-list', {
      headers: {
        'x-user-id': userData._id,
      },
    })
    .then(res => {
      setFiles(res.data);
      setError('');
    })
    .catch(() => {
      setError('Failed to fetch reports');
    })
    .finally(() => {
      setLoading(false);
    });
  }, []); // only run once on mount

  return (
    <main className="p-8 min-h-[calc(100vh-165px)] text-white">
      <div className="mb-6 flex items-center justify-between bg-gray-900 rounded-xl p-4">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition"
        >
          Go Back
        </button>
        <h1 className="text-3xl font-bold text-right flex-1">
          Weekly Activity Reports
        </h1>
      </div>

      {error && <p className="text-red-500">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
<ul className="space-y-4">
  {files.map(file => {
    const fileUrl = `/files/reports/${file}`;

    return (
      <li key={file} className="bg-gray-800 p-4 rounded flex items-center justify-between">
        <span>{file}</span>
        <div className="flex gap-4">
          <a
            href={fileUrl}
            className="text-blue-400 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download
          </a>
          <a
            href={`/fileview/excel?file=${encodeURIComponent(file)}`}
            className="text-green-400 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View
          </a>
        </div>
      </li>
    );
  })}
</ul>

      )}
    </main>
  );
}
