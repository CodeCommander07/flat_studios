'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import AuthWrapper from '@/components/AuthWrapper';
import { Sparkles, Users, Clock, Info, Trophy } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [developer, setDeveloper] = useState(null);
  const [tasksCount, setTasksCount] = useState(0);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(true);
  const [staffCount, setStaffCount] = useState(0);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [notices, setNotices] = useState([]);

  const fetchStaffCount = async () => {
    try {
      const res = await axios.get('/api/admin/stats');
      setStaffCount(res.data.staffCount || 0);
    } catch (err) {
      console.error('Failed to fetch staff count:', err.message);
    }
  }


  useEffect(() => {
    const stored = localStorage.getItem('User');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (!user?._id) return;

    const fetchTasks = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/developers/tasks/${user._id}`);
        setTasks(res.data.tasks || []);
        setDeveloper(res.data.user || null);
        setTasksCount(res.data.tasks.length || 0)
      } catch (err) {
        console.error('Failed to fetch tasks:', err.message);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

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
    fetchStaffCount();
    fetchNotices();


    const interval = setInterval(() => {
      fetchStats();
      fetchActivityLogs();
      fetchLeaderboard();
      fetchLeaves();
      fetchStaffCount();
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
          <div className="flex flex-col gap-4 mt-2">
            <div>
              {loadingNotices ? (
                <p className="text-white/60">Loading notices...</p>
              ) : notices.length === 0 ? (
                <div className="border-l-4 border-r-4 rounded-md border-purple-500 space-y-4 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-transparent">
                  <div className='bg-[#283335] backdrop-blur-sm hover:bg-white/20 transition-colors duration-300 p-4'>
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
                      className={`border-l-4 border-r-4 pl-4 py-3 rounded-md bg-[#283335] backdrop-blur-sm hover:bg-[#283335]/80 transition-colors duration-300 ${noticeColorClass(notice.type)}`}
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 backdrop-blur-mdmd:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Player Count */}
            <div className="bg-[#283335] border backdrop-blur-md border-white/20 p-6 rounded-2xl shadow-md hover:shadow-xl transition">
              <div className="flex items-center gap-4 mb-4">
                <Sparkles className="w-6 h-6 text-green-300" />
                <h2 className="text-xl font-semibold">Live Players</h2>
              </div>
              <p className="text-4xl font-bold text-green-300">{stats?.playing || '—'}</p>
              <p className="text-sm text-white/50">currently in game</p>
            </div>

            {/* Staff Online */}
            <div className="bg-[#283335] border backdrop-blur-md border-white/20 p-6 rounded-2xl shadow-md hover:shadow-xl transition">
              <div className="flex items-center gap-4 mb-4">
                <Users className="w-6 h-6 text-cyan-300" />
                <h2 className="text-xl font-semibold">Staff Online</h2>
              </div>
              <p className="text-4xl font-bold text-cyan-300">{staffCount}</p>
              <p className="text-sm text-white/50">verified accounts</p>
            </div>

            {/* Activity Summary */}
            <div className="bg-[#283335] border backdrop-blur-md border-white/20 p-6 rounded-2xl shadow-md hover:shadow-xl transition">
              <div className="flex items-center gap-4 mb-4">
                <Link href={`/dev/tasks`} > <Trophy className="w-6 h-6 text-red-300" /></Link>
                <h2 className="text-xl font-semibold">Tasks Outstanding</h2>
              </div>
              <p className="text-4xl font-bold text-red-300">
                {tasksCount ?? '—'} {tasksCount > 1 || tasksCount === 0 ? 'tasks' : 'task'}
              </p>
              <p className="text-sm text-white/50">need your attention</p>
            </div>

            {/* Notices Box */}
            <div className="bg-[#283335] border backdrop-blur-md border-white/20 p-6 col-span-2 rounded-2xl shadow-md">
              <h3 className="text-xl font-semibold mb-4">Your Tasks</h3>

              {loading ? (
                <p className="text-white/60 text-sm">Loading tasks...</p>
              ) : tasks.length === 0 ? (
                <p className="text-white/60 text-sm">You currently have no tasks assigned.</p>
              ) : (
                <div className="overflow-y-auto max-h-[260px] scrollbar-hidden">
                  <table className="min-w-full text-sm border-collapse">
                    <thead>
                      <tr className="text-white/70 border-b border-white/10">
                        <th className="text-left py-2 px-2">Task</th>
                        <th className="text-left py-2 px-2">Status</th>
                        <th className="text-left py-2 px-2">Due Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {[...tasks]
                        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                        .map((task) => (
                          <tr
                            key={task.taskId}
                            className="border-b border-white/5 hover:bg-white/5 transition"
                          >
                            {/* Task Name */}
                            <td className="py-2 px-2 text-white">
                              <Link
                                href={`/dev/tasks/${task.taskId}`}
                                className="hover:underline underline-offset-2"
                              >
                                {task.taskName || "Untitled Task"}
                              </Link>
                            </td>

                            {/* STATUS with new colours */}
                            <td className="py-2 px-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold tracking-wide
                      ${task.taskStatus === "completed"
                                    ? "bg-green-500/20 text-green-300 border border-green-400/20"
                                    : task.taskStatus === "in-progress"
                                      ? "bg-blue-500/20 text-blue-300 border border-blue-400/20"
                                      : task.taskStatus === "review"
                                        ? "bg-purple-500/20 text-purple-300 border border-purple-400/20"
                                        : task.taskStatus === "not-started"
                                          ? "bg-gray-500/20 text-gray-300 border border-gray-400/20"
                                          : "bg-purple-500/20 text-purple-300 border border-purple-400/20"
                                  }
                    `}
                              >
                                {task.taskStatus.replace("-", " ")}
                              </span>
                            </td>

                            {/* Due Date */}
                            <td className="py-2 px-2 text-white/80">
                              {task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString()
                                : "No due date"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Leave Requests */}
            <div className="bg-[#283335] backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg transition hover:shadow-2xl">
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
                <a href="/hub/leave" className="text-blue-400 hover:underline text-sm">
                  Manage Leave →
                </a>
              </div>
            </div>
          </div>

        </div>
        <style jsx global>{`
  .scrollbar-hidden {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hidden::-webkit-scrollbar {
    display: none;
  }
`}</style>
      </main>
    </AuthWrapper>
  );
}