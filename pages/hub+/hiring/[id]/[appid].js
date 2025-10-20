'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';

const StatusBadge = ({ status }) => {
  const colors = {
    accepted: 'bg-green-600',
    denied: 'bg-red-600',
    flagged: 'bg-yellow-600',
    pending: 'bg-orange-500',
    onboarded: 'bg-blue-600',
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

    if (!params || !params.appid) {
        return <p className="text-center text-white">Loading...</p>;
    }

    const { appid } = params;
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!appid) return;

    setLoading(true);
    axios
      .get(`/api/careers/submissions/${appid}`)
      .then((r) => setSub(r.data))
      .finally(() => setLoading(false));
  }, [appid]);

  const updateStatus = async (st) => {
    if (!confirm(`Are you sure you want to mark this application as "${st}"?`)) return;
    try {
      setUpdating(true);
      const res = await axios.put(`/api/careers/submissions/${appid}`, { status: st });
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

  // Split questions into left and right columns (alternating pattern)
  const leftColumnQuestions = [];
  const rightColumnQuestions = [];
  
  sub.answers?.forEach((answer, index) => {
    if (index % 2 === 0) {
      // Even indices go to left column
      leftColumnQuestions.push(answer);
    } else {
      // Odd indices go to right column
      rightColumnQuestions.push(answer);
    }
  });

      const getColorClasses = (status) => {
    switch (status) {
      case 'approved':
        return 'from-green-600/40 to-green-800/30 border-green-500/20';
      case 'denied':
        return 'from-red-600/40 to-red-800/30 border-red-500/20';
      case 'flagged':
        return 'from-yellow-600/40 to-yellow-800/30 border-yellow-500/20';
      case 'onboarded':
        return 'from-blue-600/40 to-blue-800/30 border-blue-500/20';
      case 'pending':
        return 'from-orange-600/40 to-orange-800/30 border-orange-500/20';
    }
  };

  const colorClasses = getColorClasses(sub.status);

  return (
    <main className="max-w-6xl mx-auto p-6 text-white space-y-6">
      {/* Header Card */}
      <div className={`rounded-2xl shadow-lg p-5 border glassy bg-gradient-to-br ${colorClasses} backdrop-blur-md transition hover:scale-[1.02] hover:shadow-xl`}>
        <h1 className="text-3xl font-bold mb-2">{sub.applicationId?.title || 'Untitled Application'}</h1>
        <div className="flex items-center gap-4">
          <span>
            Status: <StatusBadge status={sub.status || 'pending'} />
          </span>
          <span className="text-white/70">
            {sub.answers?.length || 0} {sub.answers?.length === 1 ? 'Question' : 'Questions'}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-6">
        <button
          onClick={() => updateStatus('accepted')}
          disabled={updating}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-2xl font-semibold transition"
        >
          Accept
        </button>
        <button
          onClick={() => updateStatus('denied')}
          disabled={updating}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-2xl font-semibold transition"
        >
          Deny
        </button>
        <button
          onClick={() => updateStatus('flagged')}
          disabled={updating}
          className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-2xl font-semibold transition"
        >
          Flag
        </button>
        <button
          onClick={() => updateStatus('onboarded')}
          disabled={updating}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-2xl font-semibold transition"
        >
          Onboard
        </button>
      </div>

      {/* Questions in Two Columns */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {leftColumnQuestions.map((a, i) => (
            <div
              key={i * 2} // Using even indices for left column
              className="glass bg-black/30 backdrop-blur-md bg-blured-md p-5 rounded-2xl shadow-lg border border-white/10 transition hover:scale-[1.02] hover:shadow-xl "
            >
              <h3 className="font-semibold text-lg mb-2">{a.questionLabel}</h3>
              <p className="whitespace-pre-wrap text-white/90">{a.answer || '-'}</p>
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {rightColumnQuestions.map((a, i) => (
            <div
              key={i * 2 + 1} // Using odd indices for right column
              className="glass p-5 backdrop-blur-md bg-black/30 rounded-2xl shadow-lg border border-white/10 transition hover:scale-[1.02] hover:shadow-xl"
            >
              <h3 className="font-semibold text-lg mb-2">{a.questionLabel}</h3>
              <p className="whitespace-pre-wrap text-white/90">{a.answer || '-'}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Status Controls */}
      <style jsx>{`
        .glassy {
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
      `}</style>
    </main>
  );
}