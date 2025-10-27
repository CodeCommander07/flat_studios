// pages/admin/route-requests/[id].js
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
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
    <span className={`px-2 py-0.5 text-xs rounded border ${map[status] || 'bg-white/10'}`}>
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

  useEffect(() => { load(); }, [id]);

  const updateStatus = async (status) => {
    try {
      const res = await fetch(`/api/ycc/admin/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) setRequest((prev) => ({ ...prev, status: data.request.status }));
      else alert(data.error || 'Failed to update status');
    } catch (e) {
      console.error(e);
      alert('Error updating status');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(request, null, 2)], { type: 'application/json' });
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
    Object.values(request.formData || {}).find((v) => typeof v === 'string' && /@/.test(v)) ||
    'unknown@flatstudios.net';
  const discordTag =
    Object.values(request.formData || {}).find((v) => typeof v === 'string' && /^[A-Za-z0-9#]+$/.test(v)) ||
    'Unknown User';
  const selectedCompany =
    Object.values(request.formData || {}).find((v) =>
      typeof v === 'string' && /(buses|transport|company)/i.test(v)
    ) || 'Unknown Company';

  return (
    <AuthWrapper requiredRole="admin">
      <main className="max-w-4xl mx-auto mt-10 p-8 bg-white/10 border border-white/20 rounded-2xl text-white backdrop-blur-lg shadow-lg">
        <div className="flex justify-between items-center">
          <Link href="/admin/ycc/routes" className="text-sm text-gray-400 hover:text-white">
            ← Back to all requests
          </Link>
          <div className="flex items-center gap-2">
            <StatusBadge status={request.status} />
            <span className="text-xs text-gray-400">
              Updated {new Date(request.updatedAt || request.createdAt).toLocaleString('en-GB')}
            </span>
          </div>
        </div>

        <h1 className="text-2xl font-bold mt-3 mb-6">
          Route Request — {selectedCompany}
        </h1>

        {/* Summary */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-5 mb-6">
          <div className="grid md:grid-cols-2 gap-3 text-sm">
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
              <p className="text-gray-400">Date Submitted</p>
              <p className="font-medium">{new Date(request.createdAt).toLocaleString('en-GB')}</p>
            </div>
          </div>
        </div>

        {/* Status Controls */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-8">
          <p className="text-sm text-gray-300 mb-3">Set status:</p>
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

        {/* Sections */}
        <div className="space-y-8">
          {Object.values(grouped).length > 0 ? (
            Object.values(grouped).map((pg, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="bg-white/10 p-3 border-b border-white/10">
                  <h2 className="text-lg font-semibold text-orange-400">{pg.title}</h2>
                </div>
                <div className="divide-y divide-white/10">
                  {pg.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between px-4 py-2 text-sm">
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
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <h2 className="text-lg font-semibold mb-3">Raw Data</h2>
              <pre className="text-xs bg-black/30 p-4 rounded">
                {JSON.stringify(request.formData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </main>
    </AuthWrapper>
  );
}
