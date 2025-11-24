// pages/admin/operator-requests/index.js
'use client';
import { useEffect, useState } from 'react';
import AuthWrapper from '@/components/AuthWrapper';
import Link from 'next/link';

const StatusBadge = ({ status }) => {
  const map = {
    Pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    Approved: 'bg-green-500/20 text-green-300 border-green-500/30',
    Rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
    Implemented: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  };
  return (
    <span className={`px-2 py-0.5 text-xs rounded border ${map[status] || 'bg-[#283335]'}`}>
      {status || 'Pending'}
    </span>
  );
};

export default function OperatorRequestList() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/ycc/operators/request/list');
        const data = await res.json();
        if (data.success) setRequests(data.requests);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <p>Loading operator requests...</p>
      </div>
    );
  }

  return (
    <AuthWrapper requiredRole="admin">
      <main className="max-w-6xl mx-auto mt-10 p-8 bg-[#283335] border border-white/20 rounded-2xl text-white backdrop-blur-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6">Operator Applications</h1>

        {requests.length === 0 ? (
          <p className="text-center text-gray-400">No applications yet.</p>
        ) : (
          <div className="divide-y divide-white/10">
            {requests.map((req) => (
              <Link
                key={req._id}
                href={`/admin/ycc/operators/${req._id}`}
                className="block p-4 hover:bg-[#283335] transition rounded-lg"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-lg">
                      {req.meta?.operatorName || 'Unknown Operator'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {req.meta?.submitter || 'Unknown User'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={req.status} />
                    <p className="text-sm text-gray-400">
                      {new Date(req.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </AuthWrapper>
  );
}
