'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';

const StatusBadge = ({ status }) => {
  const colors = {
    accepted: 'bg-green-600',
    denied: 'bg-red-600',
    flagged: 'bg-yellow-600',
    pending: 'bg-gray-500',
  };
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold text-white ${
        colors[status.toLowerCase()] || 'bg-gray-500'
      }`}
    >
      {label}
    </span>
  );
};

export default function ReviewApp() {
  const params = useParams();

  if (!params || !params.id) {
    return <p className="text-center text-white">Loading...</p>;
  }

  const { id } = params;
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`/api/careers/submissions/${id}`)
      .then((r) => setSub(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (st) => {
    if (!confirm(`Are you sure you want to mark this application as "${st}"?`)) return;
    try {
      setUpdating(true);
      const res = await axios.put(`/api/careers/submissions/${id}`, { status: st });
      setSub(res.data);
    } catch (err) {
      alert('Failed to update status');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <p className="text-center text-white py-10">Loading...</p>;
  if (!sub) return <p className="text-center text-white py-10">Submission not found.</p>;

  return (
    <main className="max-w-2xl mx-auto p-6 text-white glass rounded-2xl shadow-lg space-y-6">
      <h1 className="text-3xl font-bold">{sub.applicationId?.title || 'Untitled Application'}</h1>

      <p>
        Status: <StatusBadge status={sub.status || 'pending'} />
      </p>

      <section className="space-y-6">
        {sub.answers.map((a) => (
          <div key={a.questionLabel} className="bg-white/10 p-4 rounded-md">
            <h3 className="font-semibold mb-1">{a.questionLabel}</h3>
            <p className="whitespace-pre-wrap">{a.answer || '-'}</p>
          </div>
        ))}
      </section>

      <div className="flex gap-4">
        <button
          onClick={() => updateStatus('accepted')}
          disabled={updating}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded font-semibold transition"
        >
          Accept
        </button>
        <button
          onClick={() => updateStatus('denied')}
          disabled={updating}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded font-semibold transition"
        >
          Deny
        </button>
        <button
          onClick={() => updateStatus('flagged')}
          disabled={updating}
          className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded font-semibold transition"
        >
          Flag
        </button>
      </div>

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
