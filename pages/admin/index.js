'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import AuthWrapper from '@/components/AuthWrapper';
import { Users, CalendarMinus, Clock, Sparkles, Info } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    staffCount: 0,
    onLeave: 0,
    totalActivity: 0,
  });
  const [user, setUser] = useState(null);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [notices, setNotices] = useState([]);


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

    const fetchNotices = async () => {
      setLoadingNotices(true);
      try {
        const res = await axios.get('/api/admin/alerts/fetch');
        setNotices(res.data.notices || []);
      } catch (err) {
        console.error('Failed to fetch staff notices:', err.message);
      } finally {
        setLoadingNotices(false);
      }
    };

    fetchAdminStats();
    fetchNotices();

    const interval = setInterval(() => {
      fetchAdminStats();
      fetchNotices();
    }, 30000);

    return () => clearInterval(interval);
  }, []);
  const noticeColorClass = (type) => {
    switch (type.toLowerCase()) {
      case 'announcement':
        return 'border-blue-500 text-blue-300';
      case 'update':
        return 'border-yellow-500 text-yellow-300';
      case 'alert':
        return 'border-red-500 text-red-300';
      default:
        return 'border-gray-500 text-gray-300';
    }
  };

  const iconColorClass = (type) => {
    switch (type) {
      case 'announcement':
        return 'text-blue-500';
      case 'update':
        return 'text-yellow-500';
      case 'alert':
        return 'text-red-500';
      default:
        return 'text-blue-400';
    }
  };

  return (
    <AuthWrapper requiredRole="admin">
      <main className="text-white px-6 py-12 flex flex-col items-center">
        <div className="max-w-6xl w-full space-y-10">
          <div className="flex flex-col gap-4">
            <div>
              {loadingNotices ? (
                <p className="text-white/60">Loading notices...</p>
              ) : notices.length === 0 ? (
                <div className="border-l-4 border-r-4 rounded-md border-purple-500 space-y-4 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-transparent">
                  <div className='bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors duration-300 p-4'>
                    <h5 className="flex items-center gap-2 font-semibold text-white text-lg">
                      <Info
                        className={`w-6 h-6 text-purple-500`}
                        aria-hidden="true"
                      />
                      No notices available
                    </h5>
                  </div>
                </div>
              ) : (
                <ul className="space-y-4 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-transparent">
                  {notices.map((notice) => (
                    <li
                      key={notice._id}
                      className={`border-l-4 border-r-4 pl-4 py-3 rounded-md bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors duration-300 ${noticeColorClass(notice.type)}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="flex items-center gap-2 font-semibold text-white text-lg">
                          <Info
                            className={`w-6 h-6 ${iconColorClass(notice.type)} ${notice.type === "alert" ? "animate-flash" : ""}`}
                            aria-hidden="true"
                          />
                          {notice.title}
                        </h5>
                        <span className={`text-sm font-semibold ${iconColorClass(notice.type)} px-2 py-0.5 rounded-md select-none animate-flash`}>
                          <strong>{new Date(notice.date).toLocaleDateString('en-UK')}</strong>
                        </span>
                      </div>
                      <p className="text-white/80 whitespace-pre-wrap">{notice.content}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {/* Page Header */}
          <div className="relative bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl text-center sm:text-left sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  Welcome, {user?.username || 'Staff'}
                </h1>
                <p className="text-sm text-white/60">
                  View system-wide staff metrics below.
                </p>
              </div>
              <a
                href="/admin/announcements"
                className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
              >
                Manage Announcements
              </a>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cards */}
            <div className="bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl transition hover:shadow-2xl">
              <div className="flex items-center gap-4 mb-4">
                <a href='/admin/accounts'><Users className="w-6 h-6 text-blue-400" /></a>
                <h2 className="text-xl font-semibold">Current Staff</h2>
              </div>
              <p className="text-4xl font-bold text-blue-300">{stats.staffCount}</p>
              <p className="text-sm text-white/50">Active accounts with staff access</p>
            </div>

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
                <a href='/admin/hiring'><Sparkles className="w-6 h-6 text-red-300" /></a>
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
