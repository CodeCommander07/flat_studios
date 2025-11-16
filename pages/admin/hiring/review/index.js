'use server';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';

export default function AdminApps() {
  const [apps, setApps] = useState([]);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [appsRes, subsRes] = await Promise.all([
          axios.get('/api/careers/applications'),
          axios.get('/api/careers/submissions'),
        ]);

        setApps(appsRes.data);
        setSubs(subsRes.data);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const getApplicantCount = (appId) =>
    subs.filter((s) => s.applicationId?._id === appId).length;

  return (
    <main className="max-w-6xl mx-auto p-6 text-white">
      <Breadcrumb />
      <h1 className="rounded-bl-2xl rounded-tr-2xl hover:rounded-2xl focus:rounded-2xl transition-all duration-300 ease-in-out shadow-lg p-4 text-3xl font-bold mb-6 border border-white/20 backdrop-blur-md">Applications Overview</h1>

      {loading ? (
        <p className="text-white/70">Loading...</p>
      ) : apps.length === 0 ? (
        <p className="text-white/70 italic">No applications found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => {
            const isOpen = app.status === 'open' || app.open;
            const bgColor = isOpen
              ? 'from-green-600/40 to-green-800/30 border-green-500/20'
              : 'from-red-600/40 to-red-800/30 border-red-500/20';

            return (
              <div
                key={app._id}
                className={`shadow-lg p-6 border glassy bg-gradient-to-br ${bgColor} rounded-bl-2xl rounded-tr-2xl hover:rounded-2xl focus:rounded-2xl transition-all duration-300 ease-in-out`}
              >
                <h2 className="text-2xl font-bold mb-3">{app.title || 'Untitled Role'}</h2>

                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium">
                    Applicants: {getApplicantCount(app._id)}
                  </span>

                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      isOpen ? 'bg-green-700' : 'bg-red-700'
                    }`}
                  >
                    {isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>

                <Link
                  href={`/admin/hiring/review/${app._id}`}
                  className="block text-center bg-white/10 hover:bg-white/20 transition text-sm font-medium py-2 rounded-md"
                >
                  Manage
                </Link>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .glassy {
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
      `}</style>
    </main>
  );
}
