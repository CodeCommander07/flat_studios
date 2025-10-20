'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

export default function ViewApplication() {
    const params = useParams();

    if (!params || !params.id) {
        return <p className="text-center text-white">Loading...</p>;
    }

    const { id } = params;
  const [app, setApp] = useState(null);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;


    const fetchData = async () => {
      try {
        const appRes = await axios.get(`/api/careers/applications/?id=${id}`);
        const subsRes = await axios.get('/api/careers/submissions');

        setApp(appRes.data);
        setSubs(subsRes.data.filter((s) => s.applicationId?._id === id));
      } catch (err) {
        console.error('Error fetching application:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

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

  if (loading) {
    return (
      <main className="text-center py-10 text-white">
        <p>Loading application...</p>
      </main>
    );
  }

  if (!app) {
    return (
      <main className="text-center py-10 text-white">
        <p>Application not found.</p>
      </main>
    );
  }

  const isOpen = app.status === 'open' || app.open;
            const bgColor = isOpen
              ? 'from-green-600/40 to-green-800/30 border-green-500/20'
              : 'from-red-600/40 to-red-800/30 border-red-500/20';

  return (
    <main className="max-w-6xl mx-auto p-6 text-white space-y-6">
      {/* Application header */}
      <div className={`glassy p-6 rounded-2xl shadow-lg border border-white/10 bg-gradient-to-br ${bgColor}`}>
        <h1 className="text-3xl font-bold mb-2">{app.title}</h1>
        <p className="text-white/70 mb-4">{app.description || 'No description provided.'}</p>

        <div className="flex items-center gap-3">
          <span
            className={`text-sm font-semibold px-3 py-1 rounded-full ${
              app.open ? 'bg-green-700' : 'bg-red-700'
            }`}
          >
            {app.open ? 'Open' : 'Closed'}
          </span>
          <span className="text-sm text-white/70">
            {subs.length} {subs.length === 1 ? 'Applicant' : 'Applicants'}
          </span>
        </div>
      </div>

      {/* Applicants section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Applicants</h2>

        {subs.length === 0 ? (
          <p className="text-white/70 italic">No applicants for this role yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {subs.map((s) => {
              const colorClasses = getColorClasses(s.status);

              return (
                <div
                  key={s._id}
                  className={`rounded-2xl shadow-lg p-5 border glassy backdrop-blur-md bg-gradient-to-br ${colorClasses} transition hover:scale-[1.02] hover:shadow-xl`}
                >
                  <h3 className="font-semibold text-lg break-all mb-2">
                    {s.applicantEmail || 'Unknown Email'}
                  </h3>

                  <span
                    className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 ${
                      s.status === 'approved'
                        ? 'bg-green-700'
                        : s.status === 'denied'
                        ? 'bg-red-700'
                        : s.status === 'onboarded'
                        ? 'bg-blue-700'
                        : 'bg-yellow-700'
                    }`}
                  >
                    {s.status || 'pending'}
                  </span>

                  <Link
                    href={`/hub+/hiring/${id}/${s._id}`}
                    className="block text-center bg-white/10 hover:bg-white/20 transition text-sm font-medium py-2 rounded-md"
                  >
                    Manage
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .glassy {
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
      `}</style>
    </main>
  );
}
