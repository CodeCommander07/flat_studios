'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';

export default function ViewApplication() {
    const params = useParams();

    if (!params || !params.appId) {
        return <p className="text-center text-white">Loading...</p>;
    }

    const { appId } = params;
  const [app, setApp] = useState(null);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appId) return;


    const fetchData = async () => {
      try {
        const appRes = await axios.get(`/api/careers/applications/${appId}`);
        const subsRes = await axios.get('/api/careers/submissions');

        setApp(appRes.data);
        setSubs(subsRes.data.filter((s) => s.applicationId?._id === appId));
      } catch (err) {
        console.error('Error fetching application:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [appId]);

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
      < Breadcrumb />
      <div className={`p-6 rounded-bl-2xl rounded-tr-2xl hover:rounded-2xl focus:rounded-2xl transition-all duration-300 ease-in-out shadow-lg border border-white/10 bg-gradient-to-br ${bgColor}`}>
  <div className="flex flex-wrap justify-between items-center mb-2">
    <h1 className="text-3xl font-bold">{app.title}</h1>

    <button
      onClick={() => router.push(`/admin/hiring/${app._id}`)} 
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-bl-lg rounded-tr-lg hover:rounded-lg focus:rounded-lg transition-all duration-300 ease-in-out text-sm font-semibold transition"
    >
      Manage Application
    </button>
  </div>

  <p className="text-white/70 mb-2">{app.description || 'No description provided.'}</p>
  <p className="text-white/70 mb-4">
    Reminder: Please give all applications a 5-minute window after being submitted to allow for the automation to work.
  </p>

  <div className="flex items-center gap-3">
    <span
      className={`text-sm font-semibold px-3 py-1 rounded-bl-2xl rounded-tr-2xl hover:rounded-2xl focus:rounded-2xl transition-all duration-300 ease-in-out ${
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
                  className={`rounded-bl-2xl rounded-tr-2xl hover:rounded-2xl focus:rounded-2xl transition-all duration-300 ease-in-out shadow-lg p-5 border backdrop-blur-md bg-gradient-to-br ${colorClasses}`}
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
                    href={`/admin/hiring/review/${appId}/${s._id}`}
                    className="block text-center bg-[#283335] hover:bg-white/20 transition text-sm font-medium py-2 rounded-bl-md rounded-tr-md hover:rounded-md focus:rounded-md transition-all duration-300 ease-in-out"
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
