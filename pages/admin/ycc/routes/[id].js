'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AuthWrapper from '@/components/AuthWrapper';

const StatusBadge = ({ status }) => {
  const map = {
    Pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    Approved: 'bg-green-500/20 text-green-300 border-green-500/30',
    Rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
    Implemented: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  };
  return (
    <span
      className={`px-2 py-0.5 text-xs rounded border ${
        map[status] || 'bg-white/10 text-white/70 border-white/20'
      }`}
    >
      {status || 'Pending'}
    </span>
  );
};

export default function RouteRequestDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/ycc/admin/requests/${id}`);
      const data = await res.json();
      if (data.success) setRequest(data.request);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const updateStatus = async (status) => {
    try {
      const res = await fetch(`/api/ycc/admin/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success)
        setRequest((prev) => ({ ...prev, status: data.request.status }));
      else alert(data.error || 'Failed to update status');
    } catch (e) {
      console.error(e);
      alert('Error updating status');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(request, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RouteRequest-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <p>Loading request...</p>
      </div>
    );

  if (!request)
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <p>Request not found.</p>
      </div>
    );

  const grouped = request.structured || {};
  const email =
    Object.values(request.formData || {}).find(
      (v) => typeof v === 'string' && /@/.test(v)
    ) || 'unknown@flatstudios.net';
  const discordTag =
    Object.values(request.formData || {}).find(
      (v) => typeof v === 'string' && /^[A-Za-z0-9#]+$/.test(v)
    ) || 'Unknown User';
  const selectedCompany =
    Object.values(request.formData || {}).find(
      (v) => typeof v === 'string' && /(buses|transport|company)/i.test(v)
    ) || 'Unknown Company';

  return (
    <AuthWrapper requiredRole="admin">
      <main className="max-w-10xl mx-auto mt-10 px-6 text-white grid md:grid-cols-2 gap-8">
        {/* LEFT COLUMN — Details */}
        <div className="glass bg-[#283335] p-6 rounded-2xl space-y-6 flex flex-col max-h-[70vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center">
            <Link
              href="/admin/ycc/routes"
              className="text-sm text-gray-400 hover:text-white"
            >
              ← Back to all requests
            </Link>
            <div className="flex items-center gap-3">
              <StatusBadge status={request.status} />
              <span className="text-xs text-gray-400">
                Updated{' '}
                {new Date(
                  request.updatedAt || request.createdAt
                ).toLocaleString('en-GB')}
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold">
              Route Request —{' '}
              <span className="text-orange-400">{selectedCompany}</span>
            </h1>
            <p className="text-sm text-gray-400">
              Submitted {new Date(request.createdAt).toLocaleString('en-GB')}
            </p>
          </div>

          {/* Summary */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400">Submitted By</p>
                <p className="font-medium">{discordTag}</p>
              </div>
              <div>
                <p className="text-gray-400">Email</p>
                <p className="font-medium">{email}</p>
              </div>
              <div>
                <p className="text-gray-400">Company</p>
                <p className="font-medium">{selectedCompany}</p>
              </div>
              <div>
                <p className="text-gray-400">Request ID</p>
                <p className="font-medium text-xs break-all">{id}</p>
              </div>
            </div>
          </div>

          {/* Status Controls */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm text-gray-300">Set status:</p>
              <button
                onClick={handleDownload}
                className="text-xs text-gray-300 hover:text-white border border-white/10 px-3 py-1 rounded-md"
              >
                ⬇ Download JSON
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateStatus('Approved')}
                className="px-3 py-1 bg-green-500/20 text-green-300 border border-green-500/30 rounded hover:bg-green-500/30"
              >
                Approved
              </button>
              <button
                onClick={() => updateStatus('Rejected')}
                className="px-3 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded hover:bg-red-500/30"
              >
                Rejected
              </button>
              <button
                onClick={() => updateStatus('Implemented')}
                className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded hover:bg-blue-500/30"
              >
                Implemented
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Questions */}
        <div className="glass bg-[#283335] p-6 rounded-2xl flex flex-col max-h-[75vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Propposed Route</h2>
          {Object.values(grouped).length > 0 ? (
            Object.values(grouped).map((pg, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-xl mb-5 overflow-hidden"
              >
                <div className="bg-white/10 p-3 border-b border-white/10">
                  <h3 className="text-lg font-semibold text-orange-400">
                    {pg.title}
                  </h3>
                </div>
                <div className="divide-y divide-white/10">
                  {pg.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between px-4 py-2 text-sm"
                    >
                      <span className="text-gray-300">{item.label}</span>
                      <span className="text-white max-w-[60%] text-right break-words">
                        {item.answer || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3">Raw Data</h3>
              <pre className="text-xs bg-black/30 p-4 rounded overflow-x-auto">
                {JSON.stringify(request.formData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <style jsx>{`
          .glass {
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          ::-webkit-scrollbar {
            width: 6px;
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.4);
          }
        `}</style>
      </main>
    </AuthWrapper>
  );
}
