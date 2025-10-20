'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import AuthWrapper from '@/components/AuthWrapper';
import { MapPin, Route, Bus } from 'lucide-react'; // icons for style

export default function YCCIndex() {
  const [stats, setStats] = useState(null);
  const [stats2, setStats2] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const res = await axios.get('/api/ycc/routes');
        const res2 = await axios.get('/api/ycc/stops');
        setStats(res.data.routes);
        setStats2(res2.data.stops);
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
                <a href='/ycc/routes'><Route className="w-6 h-6 text-green-300" /></a>
                <h2 className="text-xl font-semibold">Total Routes</h2>
              </div>
              <p className="text-4xl font-bold text-green-300">{stats?.length ?? '—'}</p>
              <p className="text-sm text-white/50">routes in total</p>
            </div>

            <div className="bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-md hover:shadow-xl transition">
              <div className="flex items-center gap-4 mb-4">
                <a href='/ycc/operators'><Bus className="w-6 h-6 text-purple-300" /></a>
                <h2 className="text-xl font-semibold">Total Operators</h2>
              </div>
              <p className="text-4xl font-bold text-purple-300">4</p>
              <p className="text-sm text-white/50">Operators in total</p>
            </div>

            {/* Total Stops */}
            <div className="bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-md hover:shadow-xl transition">
              <div className="flex items-center gap-4 mb-4">
                <a href='/ycc/stops'><MapPin className="w-6 h-6 text-cyan-300" /></a>
                <h2 className="text-xl font-semibold">Total Stops</h2>
              </div>
              <p className="text-4xl font-bold text-cyan-300">{stats2?.length ?? '—'}</p>
              <p className="text-sm text-white/50">stops in total</p>
            </div>

          </div>

          <div className="text-center bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl relative">
            <h1 className="text-3xl font-bold">Want to be an operator?</h1>
            <p className="text-sm text-white/60 mt-2 mb-5">Apply to be an operator</p>
             <a href="/ycc/operators/request" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full font-semibold transition"
              >
                Submit Operator
              </a>
          </div>
        </div>
      </main>
    </AuthWrapper>
  );
}
