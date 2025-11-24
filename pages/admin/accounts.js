'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import AuthWrapper from '@/components/AuthWrapper';
import { Users, Pencil, Trash2, PlusCircle, SortAsc, SortDesc, Search, X } from 'lucide-react';
import Image from 'next/image';

export default function AccountsPage() {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedRole, setSelectedRole] = useState("All");
    const [sortAsc, setSortAsc] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [form, setForm] = useState({
        email: '',
        username: '',
        role: 'Staff',
    });
    const [inviteLink, setInviteLink] = useState('');
    const [editingUserId, setEditingUserId] = useState(null);
    const [editForm, setEditForm] = useState({
        email: '',
        username: '',
        role: 'Staff',
        discordId: '',
        robloxId: '',
    });

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/admin/users');
            setUsers(res.data || []);
            setFilteredUsers(res.data || []);
        } catch (err) {
            console.error('Failed to fetch users:', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        let list = [...users];

        if (search.trim() !== "") {
            const s = search.toLowerCase();
            list = list.filter(
                u =>
                    u.username.toLowerCase().includes(s) ||
                    u.email.toLowerCase().includes(s) ||
                    u.role.toLowerCase().includes(s)
            );
        }

        if (selectedRole !== "All") {
            list = list.filter(u => u.role === selectedRole);
        }

        list.sort((a, b) =>
            sortAsc
                ? a.username.localeCompare(b.username)
                : b.username.localeCompare(a.username)
        );

        setFilteredUsers(list);
    }, [search, selectedRole, sortAsc, users]);

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
            const res = await axios.post('/api/admin/invite', form);
            setInviteLink(res.data.inviteUrl || '');
            setForm({ email: '', username: '', role: 'Staff' });
            fetchUsers();
        } catch (err) {
            alert('Failed to create user.');
        }
    };

    const openEditModal = (user) => {
        setEditingUserId(user._id);
        setEditForm({
            email: user.email,
            username: user.username,
            role: user.role,
            discordId: user.discordId || '',
            robloxId: user.robloxId || '',
        });
        setShowEditModal(true);
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
            fetchUsers();
        } catch (err) {
            alert('Failed to update user.');
        }
    };

    return (
        <AuthWrapper requiredRole="admin">
            <main className="text-white px-6 py-12 max-w-10xl mx-auto bg-[#283335]">

                <h1 className="text-3xl font-bold mb-8 p-5 bg-[#283335] border-b flex items-center gap-3">
                    <Users /> Account Management
                </h1>

                <div className="flex flex-col lg:flex-row gap-10">
                    <aside className="lg:w-64 flex-shrink-0 space-y-5 pr-5 border-r">

                        <div className="bg-[#283335] p-4 rounded-xl border border-white/10 space-y-3">
                            <p className="font-semibold text-white/80 text-sm">Search</p>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-white/40" size={16} />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-[#283335] rounded-lg text-sm border border-white/20 focus:outline-none"
                                    placeholder="Search users..."
                                />
                            </div>
                        </div>

                        <div className="bg-[#283335] p-4 rounded-xl border border-white/10 space-y-2 max-h-[300px] overflow-y-auto">
                            <p className="font-semibold text-white/80 text-sm mb-2">Filter by Role</p>

                            {[
                                "All",
                                "Staff",
                                "Operator",
                                "Community-Director",
                                "Human-Resources",
                                "Operations-Manager",
                                "Developer",
                                "Web-Developer",
                            ].map((role) => (
                                <button
                                    key={role}
                                    onClick={() => setSelectedRole(role)}
                                    className={`w-full px-4 py-2 rounded-lg text-left text-sm transition ${selectedRole === role
                                            ? "bg-blue-600"
                                            : "bg-[#283335] hover:bg-white/20"
                                        }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setSortAsc(!sortAsc)}
                            className="w-full flex items-center gap-2 bg-[#283335] border border-white/10 px-4 py-3 rounded-lg hover:bg-[#283335] transition"
                        >
                            {sortAsc ? <SortAsc size={18} /> : <SortDesc size={18} />}
                            Sort Alphabetically
                        </button>

                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg text-white font-semibold"
                        >
                            <PlusCircle size={18} /> Create Staff Account
                        </button>
                    </aside>

                    <section className="flex-1">
                        {loading ? (
                            <p>Loading...</p>
                        ) : filteredUsers.length === 0 ? (
                            <p className="text-white/60">No users found.</p>
                        ) : (
                            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
                                {filteredUsers.map((user) => {
                                    const inEdit = editingUserId === user._id;

                                    return (
                                        <div
                                            key={user._id}
                                            className="bg-[#283335] border border-white/10 p-5 rounded-bl-xl rounded-tr-xl hover:rounded-xl transition-all duration-300 space-y-3 h-[260px] flex flex-col"
                                        >
                                            {/* HEADER */}
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2">
                                                    <Image
                                                        src={user.defaultAvatar || '/colour_logo.png'}
                                                        alt="Avatar"
                                                        width={32}
                                                        height={32}
                                                        className="rounded-full"
                                                    />
                                                    <p className="font-semibold">{user.username}</p>
                                                </div>

                                                <span className="text-xs px-2 py-1 bg-[#283335] rounded-lg border border-white/20">
                                                    {user.role}
                                                </span>
                                            </div>

                                            {/* SCROLLABLE CONTENT */}
                                            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                                                {!inEdit ? (
                                                    <>
                                                        <p className="text-sm text-white/70">
                                                            <strong>Email:</strong> {user.email}
                                                        </p>
                                                        <p className="text-sm text-white/70">
                                                            <strong>Discord:</strong> {user.discordId || '—'}
                                                        </p>
                                                        <p className="text-sm text-white/70">
                                                            <strong>Roblox:</strong> {user.robloxId || '—'}
                                                        </p>
                                                        <p className="text-sm text-white/70">
                                                            <strong>Joined:</strong>{' '}
                                                            {new Date(user.createdAt).toLocaleDateString('en-GB')}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div>
                                                            <label className="text-xs text-white/50">Email</label>
                                                            <input
                                                                type="email"
                                                                value={editForm.email}
                                                                onChange={(e) =>
                                                                    setEditForm({ ...editForm, email: e.target.value })
                                                                }
                                                                className="w-full bg-[#283335] p-2 rounded-lg border border-white/20 text-sm"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="text-xs text-white/50">Username</label>
                                                            <input
                                                                type="text"
                                                                value={editForm.username}
                                                                onChange={(e) =>
                                                                    setEditForm({ ...editForm, username: e.target.value })
                                                                }
                                                                className="w-full bg-[#283335] p-2 rounded-lg border border-white/20 text-sm"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="text-xs text-white/50">Role</label>
                                                            <select
                                                                value={editForm.role}
                                                                onChange={(e) =>
                                                                    setEditForm({ ...editForm, role: e.target.value })
                                                                }
                                                                className="w-full bg-[#283335] p-2 rounded-lg border border-white/20 text-sm"
                                                            >
                                                                <option className="bg-[#283335]" value="Staff">Staff</option>
                                                                <option className="bg-[#283335]" value="Operator">Operator</option>
                                                                <option className="bg-[#283335]" value="Community-Director">Community Director</option>
                                                                <option className="bg-[#283335]" value="Human-Resources">Human Resources</option>
                                                                <option className="bg-[#283335]" value="Operations-Manager">Operations Manager</option>
                                                                <option className="bg-[#283335]" value="Developer">Developer</option>
                                                                <option className="bg-[#283335]" value="Web-Developer">Web Developer</option>
                                                            </select>
                                                        </div>

                                                        <p className="text-xs text-white/60">
                                                            Discord ID: <span className="text-white">{editForm.discordId || '—'}</span>
                                                        </p>

                                                        <p className="text-xs text-white/60">
                                                            Roblox ID: <span className="text-white">{editForm.robloxId || '—'}</span>
                                                        </p>
                                                    </>
                                                )}
                                            </div>

                                            {/* BUTTONS */}
                                            {!inEdit ? (
                                                <div className="flex gap-2 pt-1">
                                                    <button
                                                        onClick={() => {
                                                            setEditingUserId(user._id);
                                                            setEditForm({
                                                                email: user.email,
                                                                username: user.username,
                                                                role: user.role,
                                                                discordId: user.discordId || '',
                                                                robloxId: user.robloxId || '',
                                                            });
                                                        }}
                                                        className="flex-1 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg flex items-center justify-center gap-1 text-sm font-semibold"
                                                    >
                                                        <Pencil size={16} /> Edit
                                                    </button>

                                                    <button
                                                        onClick={() => deleteUser(user._id)}
                                                        className="flex-1 bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg flex items-center justify-center gap-1 text-sm font-semibold"
                                                    >
                                                        <Trash2 size={16} /> Delete
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2 pt-1">
                                                    <button
                                                        onClick={handleEditSubmit}
                                                        className="flex-1 bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-sm font-semibold"
                                                    >
                                                        Save
                                                    </button>

                                                    <button
                                                        onClick={() => setEditingUserId(null)}
                                                        className="flex-1 bg-[#283335] hover:bg-white/20 px-3 py-2 rounded-lg text-sm font-semibold"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                </div>

                {showInviteModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur flex justify-center items-center z-50">
                        <div className="bg-[#283335] border border-white/20 p-6 rounded-xl max-w-md w-full text-white relative">
                            <button
                                onClick={() => {
                                    setShowInviteModal(false);
                                    setInviteLink('');
                                }}
                                className="absolute top-4 right-4 hover:text-red-400"
                            >
                                <X />
                            </button>

                            <h2 className="text-xl font-bold mb-3">Create Staff Account</h2>

                            <form onSubmit={handleInviteSubmit} className="space-y-4">
                                <div>
                                    <label className="text-sm text-white/60">Email</label>
                                    <input
                                        type="email"
                                        className="w-full bg-[#283335] p-2 rounded-lg mt-1 border border-white/20"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-white/60">Username</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[#283335] p-2 rounded-lg mt-1 border border-white/20"
                                        value={form.username}
                                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-white/60">Role</label>
                                    <select
                                        className="w-full bg-[#283335] p-2 rounded-lg mt-1 border border-white/20"
                                        value={form.role}
                                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                                    >
                                        <option className="bg-[#283335]" value="Staff">Staff</option>
                                        <option className="bg-[#283335]" value="Operator">Operator</option>
                                        <option className="bg-[#283335]" value="Community-Director">Community Director</option>
                                        <option className="bg-[#283335]" value="Human-Resources">Human Resources</option>
                                        <option className="bg-[#283335]" value="Operations-Manager">Operations Manager</option>
                                        <option className="bg-[#283335]" value="Developer">Developer</option>
                                        <option className="bg-[#283335]" value="Web-Developer">Web Developer</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg mt-3"
                                >
                                    Generate Invite
                                </button>
                            </form>

                            {inviteLink && (
                                <div className="bg-[#283335] p-3 border border-white/20 rounded-lg mt-4 text-sm">
                                    <p className="font-semibold">Invite Link:</p>
                                    <p className="break-words text-blue-300 mt-1">{inviteLink}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {showEditModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur flex justify-center items-center z-50">
                        <div className="bg-[#283335] border border-white/20 p-6 rounded-xl max-w-md w-full text-white relative">
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingUserId(null);
                                }}
                                className="absolute top-4 right-4 hover:text-red-400"
                            >
                                <X />
                            </button>

                            <h2 className="text-xl font-bold mb-3">Edit User</h2>

                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                <div>
                                    <label className="text-sm text-white/60">Email</label>
                                    <input
                                        type="email"
                                        className="w-full bg-[#283335] p-2 rounded-lg mt-1 border border-white/20"
                                        value={editForm.email}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, email: e.target.value })
                                        }
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-white/60">Username</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[#283335] p-2 rounded-lg mt-1 border border-white/20"
                                        value={editForm.username}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, username: e.target.value })
                                        }
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-white/60">Role</label>
                                    <select
                                        className="w-full bg-[#283335] p-2 rounded-lg mt-1 border border-white/20"
                                        value={editForm.role}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, role: e.target.value })
                                        }
                                    >
                                        <option className="bg-[#283335]" value="Staff">Staff</option>
                                        <option className="bg-[#283335]" value="Operator">Operator</option>
                                        <option className="bg-[#283335]" value="Community-Director">Community Director</option>
                                        <option className="bg-[#283335]" value="Human-Resources">Human Resources</option>
                                        <option className="bg-[#283335]" value="Operations-Manager">Operations Manager</option>
                                        <option className="bg-[#283335]" value="Developer">Developer</option>
                                        <option className="bg-[#283335]" value="Web-Developer">Web Developer</option>
                                    </select>
                                </div>

                                <p className="text-sm text-white/60">Discord ID: <span className="text-white">{editForm.discordId || "—"}</span></p>
                                <p className="text-sm text-white/60">Roblox ID: <span className="text-white">{editForm.robloxId || "—"}</span></p>

                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg mt-4"
                                >
                                    Save Changes
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </AuthWrapper>
    );
}
