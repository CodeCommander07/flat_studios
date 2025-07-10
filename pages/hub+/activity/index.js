'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function ActivityUsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    axios.get('/api/admin/activity-users')
      .then(res => setUsers(res.data))
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-white p-6">Loading users...</p>;
  if (error) return <p className="text-red-500 p-6">{error}</p>;
  if (!users.length) return <p className="text-white p-6">No users found.</p>;

  return (
    <main className="p-8 min-h-[calc(100vh-165px)] text-white">
      <h1 className="text-3xl mb-6 font-bold bg-gray-800 rounded-xl p-4">Users With Activity Logs</h1>
      <table className="min-w-full bg-gray-800 rounded-xl overflow-hidden">
        <thead>
          <tr className="text-left text-gray-400 uppercase text-sm">
            <th className="p-4">User</th>
            <th className="p-4">Total Activity In-Game</th>
            <th className="p-4">Total Shifts</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr
              key={user.userId}
              onClick={() => router.push(`/hub+/activity/${user.userId}`)}
              className="cursor-pointer border-b border-gray-700 hover:bg-gray-700 transition"
              title={`Click to view ${user.username}'s logs`}
            >
              <td className="p-4 flex items-center gap-4">
                <img
                  src={user.profilePicture || '/default-avatar.png'}
                  alt={`${user.username} avatar`}
                  className="w-12 h-12 rounded-full object-cover border border-gray-600"
                  loading="lazy"
                />
                <span className="font-semibold">{user.username} - {user.role}</span>
              </td>
              <td className="p-4">{user.totalActivity ?? 0}</td>
              <td className="p-4">{user.totalShifts ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
