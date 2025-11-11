'use client';
import { useEffect, useState } from 'react';
import AuthWrapper from '@/components/AuthWrapper';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const map = {
    Pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    Approved: 'bg-green-500/20 text-green-300 border-green-500/30',
    Rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
    Implemented: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  };
  return (
    <span
      className={`px-2 py-0.5 text-xs font-medium rounded border ${
        map[status] || 'bg-white/10 text-gray-300 border-white/20'
      }`}
    >
      {status || 'Pending'}
    </span>
  );
};

export default function RouteRequestList() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/ycc/admin/requests');
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

  const filtered = requests.filter(
    (r) =>
      r.meta?.company?.toLowerCase().includes(query.toLowerCase()) ||
      r.meta?.submitter?.toLowerCase().includes(query.toLowerCase()) ||
      r.status?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AuthWrapper requiredRole="admin">
      <main className="max-w-10xl mx-auto px-8 mt-8 text-white">
        <div className="grid md:grid-cols-5 gap-8">
          {/* LEFT PANEL — Overview / Stats */}
          <div className="col-span-2 bg-[#283335]/80 border border-white/10 rounded-2xl p-6 backdrop-blur-lg max-h-[666px] overflow-hidden flex flex-col">
            <h2 className="text-2xl font-bold mb-6">Overview</h2>

            {loading ? (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="animate-spin w-4 h-4" /> Loading overview...
              </div>
            ) : requests.length === 0 ? (
              <p className="text-gray-400 text-sm">No route requests yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4 text-sm flex-grow">
                {/* Total */}
                <div className="col-span-2 bg-white/10 border border-white/10 rounded-xl p-4">
                  <p className="text-white/60">Total Requests</p>
                  <p className="text-3xl font-bold">{requests.length}</p>
                </div>

                {/* Pending */}
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4">
                  <p className="text-yellow-200">Pending</p>
                  <p className="text-2xl font-bold text-yellow-300">
                    {requests.filter((r) => r.status === 'Pending').length}
                  </p>
                </div>

                {/* Approved */}
                <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4">
                  <p className="text-green-200">Approved</p>
                  <p className="text-2xl font-bold text-green-300">
                    {requests.filter((r) => r.status === 'Approved').length}
                  </p>
                </div>

                {/* Rejected */}
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                  <p className="text-red-200">Rejected</p>
                  <p className="text-2xl font-bold text-red-300">
                    {requests.filter((r) => r.status === 'Rejected').length}
                  </p>
                </div>

                {/* Implemented */}
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
                  <p className="text-blue-200">Implemented</p>
                  <p className="text-2xl font-bold text-blue-300">
                    {requests.filter((r) => r.status === 'Implemented').length}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL — Route Request List */}
          <div className="col-span-3 bg-[#283335]/80 border border-white/10 rounded-2xl p-6 backdrop-blur-lg max-h-[666px] overflow-hidden flex flex-col">
            <h1 className="text-2xl font-bold mb-4">Route Requests</h1>

            <input
              type="text"
              placeholder="Search by company, user, or status..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full p-2 mb-4 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500"
            />

            <p className="text-sm text-white/60 mb-2">
              Showing {filtered.length} of {requests.length} requests
            </p>

            <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 flex-grow pr-2">
              {loading ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="animate-spin w-4 h-4" /> Loading requests...
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-gray-400 text-sm">No matching requests.</p>
              ) : (
                filtered
                  .slice()
                  .reverse()
                  .map((req) => (
                    <Link
                      key={req._id}
                      href={`/admin/ycc/routes/${req._id}`}
                      className="block p-3 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all mb-2"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-green-400">
                            {req.meta?.company || 'Unknown Company'}
                          </p>
                          <p className="text-xs text-white/60">
                            {req.meta?.submitter || 'Unknown User'}
                            {req.meta?.submissionType && (
                              <span className="ml-2 text-gray-400">
                                • {req.meta.submissionType}
                              </span>
                            )}
                          </p>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(req.createdAt).toLocaleString()}
                      </p>
                    </Link>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Scrollbar styling */}
        <style jsx global>{`
          .scrollbar-thin::-webkit-scrollbar {
            width: 8px;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background-color: rgba(255, 255, 255, 0.15);
            border-radius: 8px;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb:hover {
            background-color: rgba(255, 255, 255, 0.25);
          }
        `}</style>
      </main>
    </AuthWrapper>
  );
}
