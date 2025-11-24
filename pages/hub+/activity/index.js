'use server';

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


// Helper: format float hours into h/m
const formatTime = (hoursFloat) => {
  const hours = Math.floor(hoursFloat);
  const minutes = Math.round((hoursFloat - hours) * 60);
  return `${hours}h ${minutes}m`;
};

export default function ActivityUsersList() {
  const [users, setUsers] = useState([]);
  const [weeklySummary, setWeeklySummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
                totalShifts += 1; // ✅ count shift
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

  if (loading) return <p className="text-white p-6">Loading users...</p>;
  if (error) return <p className="text-red-500 p-6">{error}</p>;
  if (!users.length) return <p className="text-white p-6">No users found.</p>;

  return (
    <main className="p-8 min-h-[calc(100vh-165px)] text-white">
      <div className="flex items-center justify-between mb-6 bg-gray-800 rounded-xl p-4">
        <h1 className="text-3xl font-bold">Weekly In-Game Activity Overview</h1>
        <button
          onClick={() => router.push('/hub+/activity/reports')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
        >
          View Reports
        </button>
      </div>

      <table className="bg-[#283335] min-w-full rounded-xl overflow-hidden">
        <thead>
          <tr className="text-left text-gray-400 uppercase text-sm">
            <th className="p-4">User</th>
            <th className="p-4">Total In-Game Time</th>
            <th className="p-4">Total Shifts</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const stats = weeklySummary[user.userId] || {
              total: { hours: 0, minutes: 0 },
              week: { hours: 0, minutes: 0, shifts: 0 },
            };

            return (
              <tr
                key={user.userId}
                onClick={() => router.push(`/hub+/activity/${user.userId}`)}
                className="cursor-pointer border-b border-gray-700 hover:bg-gray-700 transition"
                title={`Click to view ${user.username}'s logs`}
              >
                <td className="p-4 flex items-center gap-4">
                  <Image
                    src={user.profilePicture || '/default-avatar.png'}
                    alt={`${user.username} avatar`}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover border border-gray-600"
                  />
                  <span className="font-semibold">
                    {user.username} - {user.role}
                  </span>
                </td>

                {/* Total In-Game Time */}
                <td className="p-4 text-blue-300">
                  {stats.week.hours}h {stats.week.minutes}m
                </td>

                {/* ✅ Total Shifts (count) */}
                <td className="p-4 text-green-400">
                  {stats.week.shifts ? stats.week.shifts : 0} {stats.week.shifts === 1 ? 'shift' : 'shifts'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
