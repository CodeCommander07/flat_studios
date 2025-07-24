'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import AuthWrapper from '@/components/AuthWrapper';
import { MapPin, Route  } from 'lucide-react'; // icons for style

export default function YCCIndex() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const res = await axios.get('/api/ycc/routes-summary');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch routes summary:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <p className="text-white/60 p-6 text-center">Loading routes summary...</p>;

  return (
    <AuthWrapper requiredRole="ycc">
      <main className="text-white px-6 py-6 flex flex-col items-center">
        <div className="max-w-6xl w-full space-y-8">

          <div className="text-center bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl relative">
            <h1 className="text-3xl font-bold">Yapton Community Council</h1>
            <p className="text-sm text-white/60 mt-2">Overview of total routes and routes per company</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Routes */}
            <div className="bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-md hover:shadow-xl transition">
              <div className="flex items-center gap-4 mb-4">
                <MapPin className="w-6 h-6 text-green-300" />
                <h2 className="text-xl font-semibold">Total Routes</h2>
              </div>
              <p className="text-4xl font-bold text-green-300">{stats?.total ?? '—'}</p>
              <p className="text-sm text-white/50">routes in total</p>
            </div>

            {/* Companies Count */}
            <div className="bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-md hover:shadow-xl transition col-span-2">
              <div className="flex items-center gap-4 mb-4">
                <Route  className="w-6 h-6 text-cyan-300" />
                <h2 className="text-xl font-semibold">Routes per Company</h2>
              </div>
              {stats && stats.byCompany && Object.keys(stats.byCompany).length > 0 ? (
                <ul className="text-white/90 text-sm max-h-64 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-transparent">
                  {Object.entries(stats.byCompany).map(([company, count]) => (
                    <li
                      key={company}
                      className="flex justify-between border-b border-white/20 pb-1 last:border-0"
                    >
                      <span>{company}</span>
                      <span className="font-semibold">{count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-white/60">No company route data available.</p>
              )}
            </div>
          </div>

        </div>
      </main>
    </AuthWrapper>
  );
}
