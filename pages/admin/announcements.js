'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import AuthWrapper from '@/components/AuthWrapper';
import { Users, CalendarMinus, Clock, Sparkles, Info } from 'lucide-react';

const types = [
    { label: 'Announcement', value: 'announcement', color: 'bg-blue-600' },
    { label: 'Update', value: 'update', color: 'bg-yellow-500' },
    { label: 'Alert', value: 'alert', color: 'bg-red-600' },
];

const typeStyles = {
    announcement: {
        color: 'text-blue-500',
        border: 'border-blue-500 text-blue-300',
    },
    update: {
        color: 'text-yellow-500',
        border: 'border-yellow-500 text-yellow-300',
    },
    alert: {
        color: 'text-red-500',
        border: 'border-red-500 text-red-300',
    },
};

export default function AnnouncementsPage() {
    const [alerts, setAlerts] = useState([]);
    const [announcement, setAnnouncement] = useState({ title: '', type: 'announcement', content: '' });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [selectedType, setSelectedType] = useState('announcement');
    const [loadingNotices, setLoadingNotices] = useState(true);
    const [notices, setNotices] = useState([]);

    useEffect(() => {
        setAnnouncement((prev) => ({ ...prev, type: selectedType }));
    }, [selectedType]);

        const handleSubmit = async (e) => {
            e.preventDefault();
            const { title, type, content } = announcement;
            if (!title || !type || !content) return;
            setLoading(true);

            try {
                if (editingId) {
                    await axios.put('/api/admin/alerts/update', { id: editingId, ...announcement });
                } else {
                    await axios.post('/api/admin/alerts/set', announcement);
                }
                setEditingId(null);
                setAnnouncement({ title: '', type: selectedType, content: '' });
                setShowForm(false);
                fetchAlerts();
            } catch (err) {
                console.error('Submit failed:', err.message);
            } finally {
                setLoading(false);
            }
        };

        const handleDelete = async (id) => {
            if (!confirm('Delete this announcement?')) return;
            try {
                await axios.delete('/api/admin/alerts/delete', { data: { id } });
                fetchAlerts();
            } catch (err) {
                alert('Failed to delete.');
            }
        };

        const handleEdit = (alert) => {
            setEditingId(alert._id);
            setAnnouncement({ title: alert.title, type: alert.type, content: alert.content });
            setSelectedType(alert.type);
            setShowForm(true);
        };

    useEffect(() => {

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

        const fetchAlerts = async () => {
            try {
                const res = await axios.get('/api/admin/alerts/all');
                setAlerts(res.data.notices || []);
            } catch (err) {
                console.error('Failed to fetch alerts:', err.message);
            }
        };

        fetchAlerts();
        fetchNotices();
        const interval = setInterval(fetchNotices, 30000);
        return () => clearInterval(interval);

    }, []);

    return (
        <AuthWrapper requiredRole="admin">
            <main className="text-white px-6 py-12 max-w-4xl mx-auto">
                <div className="space-y-10 bg-black/90 p-6 rounded-lg shadow-lg mb-4">
                    <h1 className="text-3xl font-bold mb-6">Current Announcement</h1>

                    <div className="mb-8">
                        {loadingNotices ? (
                            <p className="text-white/60">Loading notices...</p>
                        ) : notices.length === 0 ? (
                            <div className="border-l-4 border-r-4 rounded-md border-purple-500 space-y-4 max-h-56 overflow-y-auto">
                                <div className="bg-white/10 p-4 backdrop-blur-sm">
                                    <h5 className="flex items-center gap-2 font-semibold text-white text-lg">
                                        <Info className="w-6 h-6 text-purple-500" />
                                        No notices available
                                    </h5>
                                </div>
                            </div>
                        ) : (
                            <ul className="space-y-4 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-transparent">
                                {notices.map((notice) => (
                                    <li
                                        key={notice._id}
                                        className={`border-l-4 border-r-4 pl-4 py-3 rounded-md bg-white/10 backdrop-blur-sm hover:bg-white/20 transition ${typeStyles[notice.type]?.border}`}
                                    >
                                        <div className="flex justify-between mb-1">
                                            <h5 className="flex items-center gap-2 font-semibold text-white text-lg">
                                                <Info className={`w-6 h-6 ${typeStyles[notice.type]?.color}`} />
                                                {notice.title}
                                            </h5>
                                            <span className={`text-sm font-semibold ${typeStyles[notice.type]?.color}`}>
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
                <div className="space-y-10 bg-black/90 p-6 rounded-lg shadow-lg mb-4">

                <h1 className="text-3xl font-bold mb-6">Manage Announcements</h1>

                <button
                    onClick={() => {
                        setEditingId(null);
                        setAnnouncement({ title: '', type: selectedType, content: '' });
                        setShowForm(true);
                    }}
                    className="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                    {editingId ? 'Edit Announcement' : 'Add New Announcement'}
                </button>

                {showForm && (
                    <form onSubmit={handleSubmit} className="space-y-4 mb-8 bg-black/90 p-6 rounded-lg">
                        <input
                            type="text"
                            placeholder="Title"
                            value={announcement.title}
                            onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded text-white"
                            disabled={loading}
                        />

                        <div className="relative flex bg-white/10 rounded-full p-1 w-full">
                            {types.map((type) => (
                                <button
                                    key={type.value}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setSelectedType(type.value);
                                    }}
                                    className={`relative z-10 px-4 py-2 w-full rounded-full font-medium transition ${selectedType === type.value ? 'text-black' : 'text-white'
                                        }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                            <motion.div
                                layout
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                className={`absolute z-0 top-1 bottom-1 rounded-full ${types.find((t) => t.value === selectedType).color
                                    }`}
                                style={{
                                    width: `calc(100% / ${types.length})`,
                                    left: `calc(${types.findIndex((t) => t.value === selectedType)} * (100% / ${types.length}))`,
                                }}
                            />
                        </div>

                        <textarea
                            rows={4}
                            placeholder="Write your announcement..."
                            value={announcement.content}
                            onChange={(e) => setAnnouncement({ ...announcement, content: e.target.value })}
                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded text-white"
                            disabled={loading}
                        />

                        <div className="flex gap-4">
                            <button
                                type="submit"
                                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
                                disabled={loading}
                            >
                                {editingId ? 'Update' : 'Post'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-lg"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                <div className="space-y-4">
                    {alerts.map((alert) => (
                        <div
                            key={alert._id}
                            className={`bg-white/10 border border-white/20 p-4 rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center ${typeStyles[alert.type]?.border}`}
                        >
                            <div>
                                <h3 className="text-lg font-semibold">{alert.title}</h3>
                                <p className="text-white/70 text-sm">{alert.content}</p>
                                <span className="text-xs text-white/40 italic">{alert.type}</span>
                            </div>
                            <div className="flex gap-3 mt-3 sm:mt-0">
                                <button onClick={() => handleEdit(alert)} className="text-blue-400 hover:underline text-sm">
                                    Edit
                                </button>
                                <button onClick={() => handleDelete(alert._id)} className="text-red-400 hover:underline text-sm">
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                    {alerts.length === 0 && (
                        <p className="text-white/40">No announcements available.</p>
                    )}
                </div>
                </div>
            </main>
        </AuthWrapper>
    );
}
