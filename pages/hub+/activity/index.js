'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Helper: start of current week (Monday)
const getStartOfWeek = () => {
  const now = new Date();
  const utcNow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = utcNow.getUTCDay(); // 0 (Sun) - 6 (Sat)
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  const monday = new Date(utcNow);
  monday.setUTCDate(utcNow.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
};

export default function ActivityUsersList() {
  const [users, setUsers] = useState([]);
  const [weeklySummary, setWeeklySummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'user', direction: 'asc' });
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get all users
        const usersRes = await axios.get('/api/admin/activity-users');
        const userList = usersRes.data || [];

        // Get all activity logs
        const logsRes = await axios.get('/api/activity/leaderboard');
        const logs = logsRes.data || [];

        const weekStart = getStartOfWeek();
        const summaryMap = {};

        // Group by user and calculate totals
        userList.forEach((user) => {
          const userLogs = logs.filter((log) => log.userId === user.userId);
          let totalMinutes = 0;
          let totalWeekMinutes = 0;
          let totalShifts = 0;

          userLogs.forEach((log) => {
            const match = log.duration?.match(/(\d+)h\s*(\d+)?m?/);
            if (match) {
              const hours = parseInt(match[1]) || 0;
              const minutes = parseInt(match[2]) || 0;
              const mins = hours * 60 + minutes;
              totalMinutes += mins;

              const logDate = new Date(log.date);
              if (logDate >= weekStart) {
                totalWeekMinutes += mins;
                totalShifts += 1;
              }
            }
          });

          summaryMap[user.userId] = {
            total: {
              hours: Math.floor(totalMinutes / 60),
              minutes: totalMinutes % 60,
            },
            week: {
              hours: Math.floor(totalWeekMinutes / 60),
              minutes: totalWeekMinutes % 60,
              shifts: totalShifts,
            },
          };
        });

        setUsers(userList);
        setWeeklySummary(summaryMap);
      } catch (err) {
        console.error('Error fetching users or leaderboard:', err);
        setError('Failed to load user data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <span className="opacity-40 ml-1">↕</span>;
    return (
      <span className="ml-1">
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  const getWeekMinutesForUser = (userId) => {
    const stats = weeklySummary[userId];
    if (!stats?.week) return 0;
    return stats.week.hours * 60 + stats.week.minutes;
  };

  const getShiftsForUser = (userId) => {
    const stats = weeklySummary[userId];
    return stats?.week?.shifts || 0;
  };

  // ✅ sort users based on sortConfig
  const sortedUsers = [...users].sort((a, b) => {
    if (sortConfig.key === 'user') {
      const nameA = (a.username || '').toLowerCase();
      const nameB = (b.username || '').toLowerCase();
      if (nameA < nameB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (nameA > nameB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    }

    if (sortConfig.key === 'time') {
      const minsA = getWeekMinutesForUser(a.userId);
      const minsB = getWeekMinutesForUser(b.userId);
      return sortConfig.direction === 'asc' ? minsA - minsB : minsB - minsA;
    }

    if (sortConfig.key === 'shifts') {
      const sA = getShiftsForUser(a.userId);
      const sB = getShiftsForUser(b.userId);
      return sortConfig.direction === 'asc' ? sA - sB : sB - sA;
    }

    return 0;
  });

  if (loading) return <p className="text-white p-6">Loading users...</p>;
  if (error) return <p className="text-red-500 p-6">{error}</p>;
  if (!users.length) return <p className="text-white p-6">No users found.</p>;

  return (
    <main className="p-8 min-h-[calc(100vh-165px)] text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-[#283335] border border-white/10 rounded-xl p-4 shadow-md">
        <h1 className="text-3xl font-bold">Weekly In-Game Activity Overview</h1>
        <button
          onClick={() => router.push('/hub+/activity/reports')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
        >
          View Reports
        </button>
      </div>

      {/* Table wrapper */}
      <div className="overflow-hidden border border-white/10 rounded-xl shadow-md">
        <div className="overflow-auto max-h-[calc(100vh-230px)]">
          <table className="min-w-full border-collapse">
            <thead className="sticky top-0 bg-[#1F2729] text-gray-300 uppercase text-sm shadow-md z-10">
              <tr>
                <th
                  className="p-4 text-left font-semibold cursor-pointer select-none"
                  onClick={() => handleSort('user')}
                >
                  User {getSortIcon('user')}
                </th>
                <th
                  className="p-4 text-left font-semibold cursor-pointer select-none"
                  onClick={() => handleSort('time')}
                >
                  Weekly In-Game Time {getSortIcon('time')}
                </th>
                <th
                  className="p-4 text-left font-semibold cursor-pointer select-none"
                  onClick={() => handleSort('shifts')}
                >
                  Weekly Shifts {getSortIcon('shifts')}
                </th>
              </tr>
            </thead>

            <tbody>
              {sortedUsers.map((user, index) => {
                const stats = weeklySummary[user.userId] || {
                  total: { hours: 0, minutes: 0 },
                  week: { hours: 0, minutes: 0, shifts: 0 },
                };

                return (
                  <tr
                    key={user.userId}
                    onClick={() => router.push(`/hub+/activity/${user.userId}`)}
                    className={`cursor-pointer transition-colors ${
                      index % 2 === 0 ? 'bg-[#232C2E]' : 'bg-[#2C3A3D]'
                    } hover:bg-[#324246]`}
                    title={`Click to view ${user.username}'s logs`}
                  >
                    {/* User + avatar */}
                    <td className="p-4 flex items-center gap-4">
                      <Image
                        src={user.profilePicture || '/default-avatar.png'}
                        alt={`${user.username} avatar`}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover border border-gray-600"
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {user.username}
                        </span>
                        <span className="text-xs text-gray-400">
                          {user.role}
                        </span>
                      </div>
                    </td>

                    {/* Weekly time */}
                    <td className="p-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-blue-500 text-blue-300 bg-blue-500/10">
                        {stats.week.hours}h {stats.week.minutes}m
                      </span>
                    </td>

                    {/* Weekly shifts */}
                    <td className="p-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-emerald-500 text-emerald-300 bg-emerald-500/10">
                        {stats.week.shifts || 0}{' '}
                        {stats.week.shifts === 1 ? 'shift' : 'shifts'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
