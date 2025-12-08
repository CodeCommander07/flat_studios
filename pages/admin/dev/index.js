'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import AuthWrapper from '@/components/AuthWrapper';
import { ClipboardList, RotateCcw, CheckCircle2 } from 'lucide-react';

export default function AdminDevTasks() {
  const [stats, setStats] = useState({
    totalSet: 0,
    totalReturned: 0,
    totalReviewed: 0,
  });
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('User'));
    setUser(userData);

    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/developers/admin/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch developer task stats:', err.message);
      }
    };

    const fetchTasks = async () => {
      try {
        const res = await axios.get('/api/developers/admin/all-tasks');
        setTasks(res.data.tasks || []);
      } catch (err) {
        console.error('Failed to fetch all tasks:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    fetchTasks();
    const interval = setInterval(() => {
      fetchStats();
      fetchTasks();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'in-progress':
        return 'text-blue-400';
      case 'pending':
        return 'text-yellow-400';
      case 'returned':
        return 'text-red-400';
      default:
        return 'text-white/60';
    }
  };

  return (
    <AuthWrapper requiredRole="admin">
      <main className="text-white px-6 py-12 flex flex-col items-center">
        <div className="max-w-6xl w-full space-y-10">
          {/* Page Header */}
          <div className="relative bg-[#283335] rounded-b-2xl rounded-r-2xl border border-white/20 backdrop-blur-md p-6 shadow-xl text-center sm:text-left sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  Developer Task Management
                </h1>
                <p className="text-sm text-white/60">
                  View and manage all developer task activity.
                </p>
              </div>
              <a
                href="/admin/dev/set"
                className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
              >
                Set New Task
              </a>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a
              href="/admin/dev/tasks"
              className="bg-[#283335] rounded-bl-2xl rounded-tr-2xl border border-white/20 backdrop-blur-md p-6 shadow-xl transition hover:shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-4">
                <ClipboardList className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-semibold">Set Tasks</h2>
              </div>
              <p className="text-4xl font-bold text-blue-300">
                {stats.totalSet ?? 0}
              </p>
              <p className="text-sm text-white/50">Tasks currently assigned</p>
            </a>

            <a
              href="/admin/dev/review"
              className="bg-[#283335] rounded-bl-2xl rounded-tr-2xl border border-white/20 backdrop-blur-md p-6 shadow-xl transition hover:shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-4">
                <RotateCcw className="w-6 h-6 text-yellow-400" />
                <h2 className="text-xl font-semibold">Returned Tasks</h2>
              </div>
              <p className="text-4xl font-bold text-yellow-300">
                {stats.totalReturned ?? 0}
              </p>
              <p className="text-sm text-white/50">Tasks awaiting review</p>
            </a>

            <a
              href="/admin/dev/assets"
              className="bg-[#283335] rounded-bl-2xl rounded-tr-2xl border border-white/20 backdrop-blur-md p-6 shadow-xl transition hover:shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-4">
                <CheckCircle2 className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-semibold">Assets</h2>
              </div>
              <p className="text-4xl font-bold text-purple-300">
                {stats.totalReviewed ?? 0}
              </p>
              <p className="text-sm text-white/50">Total Assets</p>
            </a>
          </div>

          <div className="border border-white/20 backdrop-blur-md rounded-b-2xl rounded-r-2xl shadow-xl overflow-hidden">
            {loading ? (
              <div className="p-6 text-center text-white/60">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="p-6 text-center text-white/60">No tasks found.</div>
            ) : (
              <div className="max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                <table className="w-full text-left">
                  <thead className="sticky bg-[#283335] top-0 backdrop-blur-md text-white/70 text-sm uppercase tracking-wide z-10">
                    <tr>
                      <th className="py-3 px-6">Due Date</th>
                      <th className="py-3 px-6">Task Name</th>
                      <th className="py-3 px-6">Developer</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks
                      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                      .map((task) => (
                        <tr
                          key={task.taskId}
                          className="bg-[#283335] transition"
                        >
                          <td className="py-3 px-6">
                            {new Date(task.dueDate).toLocaleDateString('en-UK')}
                          </td>
                          <td className="py-3 px-6 font-medium">
                            <a
                              href={`/dev/tasks/${task.taskId}`}
                              className="hover:underline"
                            >
                              {task.taskName}
                            </a>
                          </td>
                          <td className="py-3 px-6">{task.userName}</td>
                          <td
                            className={`py-3 px-6 font-semibold ${getStatusColor(
                              task.taskStatus
                            )}`}
                          >
                            {task.taskStatus}
                          </td>
                          <td className="py-3 px-6 text-white/60">
                            {new Date(task.updatedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>
    </AuthWrapper>
  );
}
