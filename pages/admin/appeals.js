'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import AuthWrapper from '@/components/AuthWrapper';
import { Users, Trash2 } from 'lucide-react';

export default function AppealsPage() {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppeals = async () => {
    try {
      const res = await axios.get('/api/appeals/fetch');
      setAppeals(res.data || []);
    } catch (err) {
      console.error('Failed to fetch appeals:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAppeal = async (id) => {
    if (!confirm('Are you sure you want to delete this appeal?')) return;
    try {
      await axios.delete(`/api/appeals/${id}`);
      setAppeals(appeals.filter((a) => a._id !== id));
    } catch (err) {
      alert('Failed to delete appeal.');
    }
  };

  useEffect(() => {
    fetchAppeals();
  }, []);

  return (
    <AuthWrapper requiredRole="admin">
      <main className="text-white px-6 py-12 flex flex-col items-center">
        <div className="max-w-7xl w-full space-y-10">
          <div className="bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <Users className="text-yellow-300" />
              <h1 className="text-2xl font-bold">Ban Appeal Management</h1>
            </div>

            {loading ? (
              <p className="text-white/60">Loading appeals...</p>
            ) : appeals.length === 0 ? (
              <p className="text-white/60">No appeals found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto text-sm text-white/90 border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-white/60 border-b border-white/10">
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Discord</th>
                      <th className="text-left p-2">Roblox</th>
                      <th className="text-left p-2">Ban Date</th>
                      <th className="text-left p-2">Reason</th>
                      <th className="text-left p-2">Unban Justification</th>
                      <th className="text-left p-2">Staff</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appeals.map((a) => (
                      <tr key={a._id} className="border-b border-white/10 hover:bg-white/5">
                        <td className="p-2">{a.email}</td>
                        <td className="p-2">
                          {a.DiscordUsername}
                          <br />
                          <span className="text-white/50 text-xs">{a.DiscordId}</span>
                        </td>
                        <td className="p-2">{a.RobloxUsername}</td>
                        <td className="p-2">
                          {new Date(a.banDate).toLocaleDateString()}
                        </td>
                        <td className="p-2 max-w-xs">{a.banReason}</td>
                        <td className="p-2 max-w-xs text-green-300">{a.unbanReason}</td>
                        <td className="p-2">{a.staffMember}</td>
                        <td className="p-2">
                          <button
                            onClick={() => deleteAppeal(a._id)}
                            className="text-red-400 hover:underline flex items-center gap-1"
                          >
                            <Trash2 size={16} /> Delete
                          </button>
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
