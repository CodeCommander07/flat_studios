'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import AuthWrapper from '@/components/AuthWrapper';
import { Sparkles, Users, Clock, Info, Trophy } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(true);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('User'));
    setUser(userData);

      const axiosInstance = axios.create({
    headers: {
      'x-user-id': user?._id || '',
    },
  });

    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/roblox/stats');
        setStats(res.data || {});
      } catch (err) {
        console.error('Failed to fetch stats:', err.message);
      }
    };

    const fetchActivityLogs = async () => {
      setLoadingActivity(true);
      try {
        const res = await axiosInstance.get('/api/activity/logs');
        setActivityLogs(res.data || []);
      } catch (err) {
        console.error('Failed to fetch activity logs:', err.message);
      } finally {
        setLoadingActivity(false);
      }
    };

    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get('/api/activity/leaderboard');
        setLeaderboard(res.data || []);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err.message);
        // fallback to static if you want
      }
    };

    const fetchLeaves = async () => {
      setLoadingLeaves(true);
      try {
        if (!userData?._id) return;
        const res = await axios.get(`/api/leave/${userData._id}`);
        setLeaveRequests(res.data || []);
      } catch (err) {
        console.error('Failed to fetch leave requests:', err.message);
      } finally {
        setLoadingLeaves(false);
      }
    };

    fetchStats();
    fetchActivityLogs();
    fetchLeaderboard();
    fetchLeaves();

    const interval = setInterval(() => {
      fetchStats();
      fetchActivityLogs();
      fetchLeaderboard();
      fetchLeaves();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Compute total shifts and total time in hours from activityLogs
  const totalShifts = activityLogs.length;
  const totalTimeHours = activityLogs.reduce((acc, log) => acc + parseFloat(log.duration || 0), 0);

  // Format totalTimeHours into "Xh Ym" string
  const formatTime = (hoursFloat) => {
    const hours = Math.floor(hoursFloat);
    const minutes = Math.round((hoursFloat - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  // Helper to render leave status with icon and color
  const renderLeaveStatus = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <span className="text-green-400 text-xs flex items-center gap-1">🟢 Approved</span>;
      case 'pending':
        return <span className="text-yellow-300 text-xs flex items-center gap-1">⌛ Pending</span>;
      case 'rejected':
        return <span className="text-red-400 text-xs flex items-center gap-1">❌ Rejected</span>;
      default:
        return <span className="text-white/70 text-xs">{status}</span>;
    }
  };

  return (
    <AuthWrapper requiredRole="hub">
      <main className="text-white px-6 py-2 flex flex-col items-center">
        <div className="max-w-6xl w-full space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 backdrop-blur-mdmd:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Player Count */}
            <div className="bg-white/10 border backdrop-blur-md border-white/20 p-6 rounded-2xl shadow-md hover:shadow-xl transition">
              <div className="flex items-center gap-4 mb-4">
                <Sparkles className="w-6 h-6 text-green-300" />
                <h2 className="text-xl font-semibold">Live Players</h2>
              </div>
              <p className="text-4xl font-bold text-green-300">{stats?.playing || '—'}</p>
              <p className="text-sm text-white/50">currently in game</p>
            </div>

            {/* Staff Online */}
            <div className="bg-white/10 border backdrop-blur-md border-white/20 p-6 rounded-2xl shadow-md hover:shadow-xl transition">
              <div className="flex items-center gap-4 mb-4">
                <Users className="w-6 h-6 text-cyan-300" />
                <h2 className="text-xl font-semibold">Staff Online</h2>
              </div>
              <p className="text-4xl font-bold text-cyan-300">3</p>
              <p className="text-sm text-white/50">verified accounts</p>
            </div>

            {/* Activity Summary */}
            <div className="bg-white/10 border backdrop-blur-md border-white/20 p-6 rounded-2xl shadow-md hover:shadow-xl transition">
              <div className="flex items-center gap-4 mb-4">
                <Clock className="w-6 h-6 text-yellow-300" />
                <h2 className="text-xl font-semibold">Your Activity</h2>
              </div>
              <p className="text-2xl font-bold text-yellow-300">{totalShifts} Shift{totalShifts !== 1 ? 's' : ''}</p>
              <p className="text-white/70">
                Time in Game: <span className="font-mono">{formatTime(totalTimeHours)}</span>
              </p>
            </div>
          </div>

          {/* Notices Box */}
          <div className="bg-white/10 border backdrop-blur-md border-white/20 p-6 rounded-2xl shadow-md flex items-start gap-4">
            <Info className="w-6 h-6 text-blue-400 mt-1" />
            <div>
              <h3 className="text-xl font-semibold mb-1">Staff Notice</h3>
              <p className="text-white/70">
                Make sure to log all activity and check for updates to the moderation guide.
                Leave requests will now require approval via the <span className="underline">Community Team</span>.
              </p>
            </div>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 w-full">
            {/* Shift Activity */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg transition hover:shadow-2xl">
              <h2 className="text-xl font-bold mb-4 text-green-300">🕒 Your Shifts</h2>

              {loadingActivity ? (
                <p className="text-white/60">Loading activity...</p>
              ) : activityLogs.length === 0 ? (
                <p className="text-white/60">No shifts logged yet.</p>
              ) : (
                <ul className="space-y-3 text-white/90 text-sm max-h-64 overflow-y-auto">
                  {activityLogs
                    .slice() // clone array
                    .sort((a, b) => new Date(b.date) - new Date(a.date)) // newest first
                    .map((log) => (
                      <li key={log._id} className="flex justify-between items-center">
                        <span>
                          <span className="font-semibold">{new Date(log.date).toLocaleDateString()}:</span>{' '}
                          {log.duration}h Shift ({log.description})
                        </span>
                        <span className="text-green-400 text-xs">✅ Logged</span>
                      </li>
                    ))}
                </ul>
              )}

              <div className="mt-4 text-right">
                <a href="/hub/activity" className="text-blue-400 hover:underline text-sm">
                  View All Activity →
                </a>
              </div>
            </div>

            {/* Leave Requests */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg transition hover:shadow-2xl">
              <h2 className="text-xl font-bold mb-4 text-yellow-300">📅 Leave Requests</h2>

              {loadingLeaves ? (
                <p className="text-white/60">Loading leave requests...</p>
              ) : leaveRequests.length === 0 ? (
                <p className="text-white/60">No leave requests found.</p>
              ) : (
                <ul className="space-y-3 text-white/90 text-sm max-h-64 overflow-y-auto">
                  {leaveRequests
                    .slice()
                    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
                    .map((leave) => (
                      <li key={leave._id} className="flex justify-between items-center">
                        <span>
                          <span className="font-semibold">
                            {new Date(leave.startDate).toLocaleDateString()} –{' '}
                            {new Date(leave.endDate).toLocaleDateString()}:
                          </span>{' '}
                          {leave.type}
                        </span>
                        {renderLeaveStatus(leave.status)}
                      </li>
                    ))}
                </ul>
              )}

              <div className="mt-4 text-right">
                <a href="/hub/leave" className="text-blue-400 hover:underline text-sm">
                  Manage Leave →
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AuthWrapper>
  );
}
