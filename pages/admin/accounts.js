'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import AuthWrapper from '@/components/AuthWrapper';
import { Users, Pencil, Trash2, PlusCircle, X } from 'lucide-react';
import Image from 'next/image';

export default function AccountsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState({
    email: '',
    username: '',
    role: 'staff',
    createdBy: ''
  });
  const [inviteLink, setInviteLink] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState({
    email: '',
    username: '',
    role: 'staff',
    discordId: '',
    robloxId: '',
  });

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users');
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`/api/admin/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
    } catch (err) {
      alert('Failed to delete user.');
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('User'));
      form.createdBy = user.username
      const res = await axios.post('/api/admin/invite', form);
      setInviteLink(res.data.inviteUrl || '');
      setForm({ email: '', username: '', role: 'staff', createdBy });
      fetchUsers();
    } catch (err) {
      console.log(err)
      alert('Failed to create user.');
    }
  };

  // Open Edit modal and prefill form with user data
  const openEditModal = (user) => {
    setEditingUserId(user._id);
    setEditForm({
      email: user.email || '',
      username: user.username || '',
      role: user.role || 'staff',
      discordId: user.discordId || '',
      robloxId: user.robloxId || '',
    });
    setShowEditModal(true);
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/admin/users/${editingUserId}`, {
        email: editForm.email,
        username: editForm.username,
        role: editForm.role,
      });
      setShowEditModal(false);
      setEditingUserId(null);
      fetchUsers();
    } catch (err) {
      alert('Failed to update user.');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <AuthWrapper requiredRole="admin">
      <main className="text-white px-6 py-12 flex flex-col items-center">
        <div className="max-w-7xl w-full space-y-10">
          <div className="bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <Users className="text-blue-300" />
              <h1 className="text-2xl font-bold">Account Management</h1>
            </div>

            {loading ? (
              <p className="text-white/60">Loading accounts...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto text-sm text-white/90 border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-white/60 border-b border-white/10">
                      <th className="text-left p-2">User</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Role</th>
                      <th className="text-left p-2">Discord ID</th>
                      <th className="text-left p-2">Roblox ID</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-b border-white/10 hover:bg-white/5">
                        <td className="p-2 font-medium">
                          <div className="flex items-center gap-2">
                            <Image
                              src={user.defaultAvatar || '/colour_logo.png'}
                              alt="User Avatar"
                              width={20}
                              height={20}
                              className="rounded-full"
                            />
                            {user.username}
                          </div>
                        </td>
                        <td className="p-2">{user.email}</td>
                        <td className="p-2">{user.role}</td>
                        <td className="p-2">{user.discordId || '—'}</td>
                        <td className="p-2">{user.robloxId || '—'}</td>
                        <td className="p-2 flex gap-3">
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <Pencil size={16} /> Edit
                          </button>
                          <button
                            onClick={() => deleteUser(user._id)}
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

            <div className="mt-6 text-right">
              <button
                onClick={() => setShowInviteModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition flex items-center gap-2"
              >
                <PlusCircle size={18} /> Create Staff Account
              </button>
            </div>
          </div>
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white/10 border border-white/20 p-6 rounded-2xl shadow-xl w-full max-w-md space-y-4 text-white relative">
              <button
                className="absolute top-4 right-4 text-white hover:text-red-400"
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteLink('');
                }}
              >
                <X />
              </button>
              <h2 className="text-2xl font-bold mb-4">New Staff Invite</h2>
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 rounded bg-white/20 text-white border border-white/30"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Username</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded bg-white/20 text-white border border-white/30"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Role</label>
                  <select
                    className="w-full px-4 py-2 rounded bg-white/20 text-white border border-white/30"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    required
                  >
                    <option className="bg-black text-white" value="Staff">Staff</option>
                    <option className="bg-black text-white" value="User">User</option>
                    <option className="bg-black text-white" value="Community-Director">Community Director</option>
                    <option className="bg-black text-white" value="Human-Resources">Human Resources</option>
                    <option className="bg-black text-white" value="Operations-Manager">Operations Manager</option>
                    <option className="bg-black text-white" value="Developer">Developer</option>
                    <option className="bg-black text-white" value="Web-Developer">Web Developer</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded text-white font-semibold"
                >
                  Generate Invite
                </button>
              </form>

              {inviteLink && (
                <div className="mt-4 bg-white/10 p-3 rounded text-sm border border-white/20">
                  <strong>Invite Link:</strong>
                  <p className="break-words text-blue-300 mt-1">{inviteLink}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white/10 border border-white/20 p-6 rounded-2xl shadow-xl w-full max-w-md space-y-4 text-white relative">
              <button
                className="absolute top-4 right-4 text-white hover:text-red-400"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUserId(null);
                }}
              >
                <X />
              </button>
              <h2 className="text-2xl font-bold mb-4">Edit User</h2>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 rounded bg-white/20 text-white border border-white/30"
                    value={editForm.email}
                    onChange={(e) => handleEditChange('email', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Username</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded bg-white/20 text-white border border-white/30"
                    value={editForm.username}
                    onChange={(e) => handleEditChange('username', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Role</label>
                  <select
                    className="w-full px-4 py-2 rounded bg-white/20 text-white border border-white/30"
                    value={editForm.role}
                    onChange={(e) => handleEditChange('role', e.target.value)}
                    required
                  >
                    <option className="bg-black text-white" value="Staff">Staff</option>
                    <option className="bg-black text-white" value="User">User</option>
                    <option className="bg-black text-white" value="Community-Director">Community Director</option>
                    <option className="bg-black text-white" value="Human-Resources">Human Resources</option>
                    <option className="bg-black text-white" value="Operations-Manager">Operations Manager</option>
                    <option className="bg-black text-white" value="Developer">Developer</option>
                    <option className="bg-black text-white" value="Web-Developer">Web Developer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Discord ID (readonly)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded bg-white/20 text-white border border-white/30 cursor-not-allowed"
                    value={editForm.discordId}
                    disabled
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Roblox ID (readonly)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded bg-white/20 text-white border border-white/30 cursor-not-allowed"
                    value={editForm.robloxId}
                    disabled
                    readOnly
                  />
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:justify-between mt-6">
                  <button
                    type="submit"
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded text-white font-semibold"
                  >
                    Save Changes
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const confirmed = confirm(`Reset password for ${editForm.username}?`);
                      if (!confirmed) return;
                      try {
                        const res = await axios.post(`/api/admin/users/${editingUserId}?action=resetPas`);
                        alert(res.data.message || 'Password reset successfully.');
                      } catch (err) {
                        alert('Failed to reset password.');
                      }
                    }}
                    className="w-full md:w-auto bg-yellow-600 hover:bg-yellow-700 py-2 px-4 rounded text-white font-semibold"
                  >
                    Reset Password
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}
      </main>
    </AuthWrapper>
  );
}
