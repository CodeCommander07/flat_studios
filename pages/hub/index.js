'use server';

import { useEffect, useState } from 'react';
import axios from 'axios';
import AuthWrapper from '@/components/AuthWrapper';
import SplitText from "@/components/SplitText";
import CountUp from "@/components/CountUp";
import { Sparkles, Users, Clock, Info } from 'lucide-react';

const getStartOfWeek = () => {
  const now = new Date();
  const day = now.getDay(); // 0 (Sun) to 6 (Sat)
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  return new Date(now.setDate(diff));
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [staffCount, setStaffCount] = useState(0);
  const [user, setUser] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(true);
  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState({ hours: 0, minutes: 0 });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('User'));
    setUser(userData);

    const axiosInstance = axios.create({
      headers: {
        'x-user-id': userData?._id || '',
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

    const fetchStaffCount = async () => {
      try {
        const res = await axios.get('/api/admin/stats');
        setStaffCount(res.data.staffCount || 0);
      } catch (err) {
        console.error('Failed to fetch staff count:', err.message);
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
      }
    };

    const fetchLeaves = async () => {
      setLoadingLeaves(true);
      try {
        if (!userData?._id) return;
        const res = await axios.get(`/api/leave/history?userId=${userData._id}`);
        setLeaveRequests(res.data || []);
      } catch (err) {
        console.error('Failed to fetch leave requests:', err.message);
      } finally {
        setLoadingLeaves(false);
      }
    };

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

    fetchStats();
    fetchActivityLogs();
    fetchLeaderboard();
    fetchLeaves();
    fetchNotices();
    fetchStaffCount();

    const interval = setInterval(() => {
      fetchStats();
      fetchActivityLogs();
      fetchLeaderboard();
      fetchLeaves();
      fetchNotices();
      fetchStaffCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Calculate totals
  const startOfWeek = new Date();
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday start

  const logsThisWeek = activityLogs.filter((log) => {
    const logDate = new Date(log.date);
    return logDate >= startOfWeek;
  });

  const totalShifts = logsThisWeek.length;
  const totalTimeHours = logsThisWeek.reduce(
    (acc, log) => acc + parseFloat(log.duration || 0),
    0
  );

  // 🟢 Weekly summary calculation
useEffect(() => {
  const weekStart = getStartOfWeek();
  let totalMinutes = 0;

  for (const log of activityLogs) {
    const logDate = new Date(log.date);
    if (logDate >= weekStart && log.duration) {
      // Extract numbers from something like "2h 30m", "1h", or "45m"
      const hours = parseInt(log.duration.match(/(\d+)\s*h/)?.[1] ?? 0);
      const minutes = parseInt(log.duration.match(/(\d+)\s*m/)?.[1] ?? 0);
      totalMinutes += hours * 60 + minutes;
    }
  }

  setWeeklySummary({
    hours: Math.floor(totalMinutes / 60), // integer
    minutes: totalMinutes % 60            // integer
  });
}, [activityLogs]);


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
    <AuthWrapper requiredRole="hub">
      <main className="text-white px-6 py-2 flex flex-col items-center">
        <div className="max-w-6xl w-full space-y-8">
          {/* Notices */}
          <div className="flex flex-col gap-4 mt-4">
            <div>
              {loadingNotices ? (
                <p className="text-white/60">Loading notices...</p>
              ) : notices.length === 0 ? (
                <div className="border-l-4 border-r-4 rounded-md border-purple-500 p-4 bg-white/10">
                  <h5 className="flex items-center gap-2 font-semibold text-white text-lg">
                    <Info className="w-6 h-6 text-purple-500" /> No notices available
                  </h5>
                </div>
              ) : (
                <ul className="space-y-4 max-h-56 overflow-y-auto">
                  {notices.map((notice) => (
                    <li
                      key={notice._id}
                      className={`border-l-4 border-r-4 pl-4 py-3 rounded-md bg-white/10 ${noticeColorClass(notice.type)}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="flex items-center gap-2 font-semibold text-white text-lg">
                          <Info className={`w-6 h-6 ${iconColorClass(notice.type)}`} />
                          {notice.title}
                        </h5>
                        <span className="text-sm font-semibold text-white/70">
                          {new Date(notice.date).toLocaleDateString('en-UK')}
                        </span>
                      </div>
                      <p className="text-white/80 whitespace-pre-wrap">{notice.content}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="text-center bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl">
            <SplitText
              text={`Welcome, ${user?._id === "68829ddd4ebb8e8eff6fab38" ? "Daddy " : ""}${user?.username || 'Staff'}`}
              className="text-3xl font-bold text-center"
              delay={100}
              duration={0.6}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-100px"
              textAlign="center"
              // onLetterAnimationComplete={handleAnimationComplete}
            />
            {/* <h1 className="text-3xl font-bold">Welcome, {user?._id === "68829ddd4ebb8e8eff6fab38" ? "Daddy ": ""}{user?.username || 'Staff'}</h1> */}
            <p className="text-sm text-white/60">View your staff metrics below.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-3">
            {/* Live Players */}
            <div className="bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-md">
              <div className="flex items-center gap-4 mb-4">
                <a href="/hub/game"><Sparkles className="w-6 h-6 text-green-300" /></a>
                <h2 className="text-xl font-semibold">Live Players</h2>
              </div>
              <p className="text-4xl font-bold text-green-300"> <CountUp from={0} to={stats?.playing} duration={1.5} /></p>
              <p className="text-sm text-white/50">currently in game</p>
            </div>

            {/* Staff Online */}
            <div className="bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-md">
              <div className="flex items-center gap-4 mb-4">
                <Users className="w-6 h-6 text-cyan-300" />
                <h2 className="text-xl font-semibold">Staff Online</h2>
              </div>
              <p className="text-4xl font-bold text-cyan-300"> <CountUp from={0} to={staffCount} duration={1.5} /></p>
              <p className="text-sm text-white/50">verified accounts</p>
            </div>

            {/* Activity Summary + Weekly */}
            <div className="bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-md">
              <div className="flex items-center gap-4 mb-4">
                <Clock className="w-6 h-6 text-yellow-300" />
                <h2 className="text-xl font-semibold">Your Activity</h2>
              </div>
              <p className="text-2xl font-bold text-yellow-300">
                 <CountUp from={0} to={weeklySummary.hours} duration={1.5} />h  <CountUp from={0} to={weeklySummary.minutes} duration={1.5} />m
              </p>
              <p className="text-white/60 mt-1">
                <CountUp from={0} to={totalShifts} duration={1.5} /> {totalShifts === 1 ? 'shift' : 'shifts'} this week
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3 w-full">
            {/* Shift Activity */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg transition hover:shadow-2xl">
              <h2 className="text-xl font-bold mb-4 text-green-300">🕒 Your Shifts</h2>

              {loadingActivity ? (
                <p className="text-white/60">Loading activity...</p>
              ) : activityLogs.length === 0 ? (
                <p className="text-white/60">No shifts logged yet.</p>
              ) : (
                <ul className="space-y-3 text-white/90 text-sm max-h-28 overflow-y-auto">
                  {activityLogs
                    .slice() // clone array
                    .sort((a, b) => new Date(b.date) - new Date(a.date)) // newest first
                    .map((log) => (
                      <li key={log._id} className="flex justify-between items-center">
                        <span>
                          <span className="font-semibold">{new Date(log.date).toLocaleDateString('en-UK')}:</span>{' '}
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
                <ul className="space-y-3 text-white/90 text-sm max-h-28 overflow-y-auto">
                  {leaveRequests
                    .slice()
                    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
                    .map((leave) => (
                      <li key={leave._id} className="flex justify-between items-center">
                        <span>
                          <span className="font-semibold">
                            {new Date(leave.startDate).toLocaleDateString('en-UK')} –{' '}
                            {new Date(leave.endDate).toLocaleDateString('en-UK')}:
                          </span>{' '}
                          {leave.type}
                        </span>
                        {renderLeaveStatus(leave.status)}
                      </li>
                    ))}
                </ul>
              )}

              <div className="mt-4 text-right">
                <a href="/me/leave" className="text-blue-400 hover:underline text-sm">
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
