// pages/admin/operator-requests/[id].js
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
    <span className={`px-2 py-0.5 text-xs rounded border ${map[status] || 'bg-[#283335]'}`}>
      {status || 'Pending'}
    </span>
  );
};

export default function OperatorRequestDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [reqData, setReqData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/ycc/operators/request/${id}`);
      const data = await res.json();
      if (data.success) setReqData(data.request);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const updateStatus = async (status) => {
    try {
      const res = await fetch(`/api/ycc/operators/request/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) setReqData((p) => ({ ...p, status: data.request.status, updatedAt: data.request.updatedAt }));
      else alert(data.error || 'Failed to update status');
    } catch (e) {
      console.error(e);
      alert('Error updating status');
    }
  };

  const deleteRequest = async () => {
    if (!confirm('Delete this application?')) return;
    try {
      const res = await fetch(`/api/ycc/operators/request/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Deleted.');
        router.push('/admin/ycc/operators');
      } else {
        const data = await res.json();
        alert(data.error || 'Delete failed');
      }
    } catch (e) {
      console.error(e);
      alert('Delete failed');
    }
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(reqData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OperatorApplication-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen text-white">
      <p>Loading application...</p>
    </div>
  );

  if (!reqData) return (
    <div className="flex items-center justify-center min-h-screen text-white">
      <p>Application not found.</p>
    </div>
  );

  const {
    email,
    robloxUsername,
    discordUsername,
    discordId,
    robloxId,
    operatorName,
    operatorFleet,
    operatorDiscord,
    operatorRoblox,
    reason,
    createdAt,
    updatedAt,
    status,
  } = reqData;

  return (
    <AuthWrapper requiredRole="admin">
      <main className="max-w-4xl mx-auto mt-10 p-8 bg-[#283335] border border-white/20 rounded-2xl text-white backdrop-blur-lg shadow-lg">
        <div className="flex justify-between items-center">
          <Link href="/admin/ycc/operators" className="text-sm text-gray-400 hover:text-white">
            ← Back to all applications
          </Link>
          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
            <span className="text-xs text-gray-400">Updated {new Date(updatedAt || createdAt).toLocaleString('en-GB')}</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold mt-3 mb-6">Operator Application — {operatorName || 'Unknown Operator'}</h1>

        {/* Status Controls */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-8">
          <p className="text-sm text-gray-300 mb-3">Set status:</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => updateStatus('Approved')} className="px-3 py-1 bg-green-500/20 text-green-300 border border-green-500/30 rounded hover:bg-green-500/30">
              Approved
            </button>
            <button onClick={() => updateStatus('Rejected')} className="px-3 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded hover:bg-red-500/30">
              Rejected
            </button>
            <button onClick={() => updateStatus('Implemented')} className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded hover:bg-blue-500/30">
              Implemented
            </button>
            <button onClick={deleteRequest} className="ml-auto px-3 py-1 bg-red-600/20 text-red-200 border border-red-600/30 rounded hover:bg-red-600/30">
              Delete
            </button>
          </div>
        </div>

        {/* Applicant */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-5 mb-6">
          <h2 className="text-lg font-semibold mb-3 text-orange-400">Applicant</h2>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-400">Email</span><div className="font-medium">{email}</div></div>
            <div><span className="text-gray-400">Discord Username</span><div className="font-medium">{discordUsername}</div></div>
            <div><span className="text-gray-400">Discord ID</span><div className="font-medium">{discordId}</div></div>
            <div><span className="text-gray-400">Roblox Username</span><div className="font-medium">{robloxUsername}</div></div>
            <div><span className="text-gray-400">Roblox ID</span><div className="font-medium">{robloxId}</div></div>
          </div>
        </div>

        {/* Operator */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-3 text-orange-400">Operator Details</h2>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-400">Operator Name</span><div className="font-medium">{operatorName}</div></div>
            <div><span className="text-gray-400">Operator Discord</span><div className="font-medium break-words">{operatorDiscord}</div></div>
            <div><span className="text-gray-400">Operator Roblox</span><div className="font-medium break-words">{operatorRoblox}</div></div>
          </div>
          <div className="mt-4">
            <span className="text-gray-400 text-sm">Operator Fleet</span>
            <p className="mt-1 text-white/90 whitespace-pre-wrap">{operatorFleet}</p>
          </div>
          <div className="mt-4">
            <span className="text-gray-400 text-sm">Reason</span>
            <p className="mt-1 text-white/90 whitespace-pre-wrap">{reason}</p>
          </div>
        </div>
      </main>
    </AuthWrapper>
  );
}
