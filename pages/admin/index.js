'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import AuthWrapper from '@/components/AuthWrapper';
import { Users, CalendarMinus, Clock, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    staffCount: 0,
    onLeave: 0,
    totalActivity: 0,
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const res = await axios.get('/api/admin/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch admin stats:', err.message);
      }
    };

    const userData = JSON.parse(localStorage.getItem('User'));
  setUser(userData);
    fetchAdminStats();
  }, []);

  return (
    <AuthWrapper requiredRole="admin">
      <main className="text-white px-6 py-12 flex flex-col items-center">
        <div className="max-w-6xl w-full space-y-10">

          {/* Page Header */}
          <div className="text-center bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl">
            <h1 className="text-3xl font-bold"> 
                         Welcome, {user?.username || 'Staff'}</h1>
            <p className="text-sm text-white/60">View system-wide staff metrics below.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Staff Count */}
            <div className="bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl transition hover:shadow-2xl">
              <div className="flex items-center gap-4 mb-4">
                <a href='/admin/accounts'><Users className="w-6 h-6 text-blue-400" /></a>
                <h2 className="text-xl font-semibold">Current Staff</h2>
              </div>
              <p className="text-4xl font-bold text-blue-300">{stats.staffCount}</p>
              <p className="text-sm text-white/50">Active accounts with staff access</p>
            </div>

            {/* On Leave */}
            <div className="bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl transition hover:shadow-2xl">
              <div className="flex items-center gap-4 mb-4">
                <a href='/admin/appeals'><CalendarMinus className="w-6 h-6 text-yellow-300" /></a>
                <h2 className="text-xl font-semibold">Appeals</h2>
              </div>
              <p className="text-4xl font-bold text-yellow-300">{stats?.appeals || 0}</p>
              <p className="text-sm text-white/50">Appeals to be read</p>
            </div>
            <div className="bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl transition hover:shadow-2xl">
              <div className="flex items-center gap-4 mb-4">
                <a href='/admin/leave'><Clock className="w-6 h-6 text-green-300" /></a>
                <h2 className="text-xl font-semibold">Leave Requests</h2>
              </div>
              <p className="text-4xl font-bold text-green-300">{stats?.requests || 0}</p>
              <p className="text-sm text-white/50">Requests to be read</p>
            </div>
            <div className="bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl transition hover:shadow-2xl">
              <div className="flex items-center gap-4 mb-4">
                <a href='/admin/appeals'><Sparkles className="w-6 h-6 text-red-300" /></a>
                <h2 className="text-xl font-semibold">Applications</h2>
              </div>
              <p className="text-4xl font-bold text-red-300">{stats?.applications || 0}</p>
              <p className="text-sm text-white/50">Applications to be read</p>
            </div>

          </div>

        </div>
      </main>
    </AuthWrapper>
  );
}
