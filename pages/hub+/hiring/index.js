'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

const StatusBadge = ({ status }) => {
  const colors = {
    pending: 'bg-yellow-500',
    approved: 'bg-green-600',
    denied: 'bg-red-600',
  };
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white ${
        colors[status] || 'bg-gray-500'
      }`}
    >
      {status}
    </span>
  );
};

export default function AdminApps() {
  const [subs, setSubs] = useState([]);

  useEffect(() => {
    axios.get('/api/careers/submissions').then((r) => setSubs(r.data));
  }, []);

  return (
    <main className="max-w-6xl mx-auto p-6 text-white">
      <div className="glass p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold mb-6">Submissions</h1>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-white/10">
            <thead>
              <tr className="bg-white/10 text-left text-sm uppercase tracking-wide">
                <th className="p-3 border border-white/20">Application</th>
                <th className="p-3 border border-white/20">Email</th>
                <th className="p-3 border border-white/20">Status</th>
                <th className="p-3 border border-white/20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subs.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center p-6 text-white/70 italic"
                  >
                    No submissions found.
                  </td>
                </tr>
              )}
              {subs.map((s) => (
                <tr
                  key={s._id}
                  className="hover:bg-white/10 transition-colors cursor-default"
                >
                  <td className="p-3 border border-white/20">{s.applicationId?.title || 'N/A'}</td>
                  <td className="p-3 border border-white/20 break-all">{s.applicantEmail || 'N/A'}</td>
                  <td className="p-3 border border-white/20">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="p-3 border border-white/20">
                    <Link
                      href={`/hub+/hiring/${s._id}`}
                      className="text-blue-400 hover:text-blue-600 font-semibold"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Glassmorphism styling */}
      <style jsx>{`
        .glass {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </main>
  );
}
