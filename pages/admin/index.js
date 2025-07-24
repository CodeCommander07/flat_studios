'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import AuthWrapper from '@/components/AuthWrapper';
import { Users, CalendarMinus, Clock, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    staffCount: 0,
    onLeave: 0,
    totalActivity: 0,
  });
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [announcement, setAnnouncement] = useState({
    title: '',
    type: '',
    content: '',
  });
  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const res = await axios.get('/api/admin/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch admin stats:', err.message);
      }
    };

    const userData = JSON.parse(localStorage.getItem('User'));
    setUser(userData);
    fetchAdminStats();
  }, []);

    const handleEditChange = (field, value) => {
    setAnnouncement((prev) => ({ ...prev, [field]: value }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault(); // stop form reload

    const { title, type, content } = announcement;

    if (!title || !type || !content) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    setErrorMsg('');
    setLoadingSubmit(true);

    try {
      const response = await axios.post('/api/admin/alerts/set', announcement);
      setSuccessMsg('Announcement posted successfully!');
      setAnnouncement({ title: '', type: '', content: '' });
      setShowModal(false);

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg('Failed to post announcement. Please try again.');
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <AuthWrapper requiredRole="admin">
      <main className="text-white px-6 py-12 flex flex-col items-center">
        <div className="max-w-6xl w-full space-y-10">
          {/* Page Header */}
          <div className="relative bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl text-center sm:text-left sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  Welcome, {user?.username || 'Staff'}
                </h1>
                <p className="text-sm text-white/60">
                  View system-wide staff metrics below.
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
              >
                Make Announcement
              </button>
            </div>
          </div>



          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cards */}
            <div className="bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl transition hover:shadow-2xl">
              <div className="flex items-center gap-4 mb-4">
                <a href='/admin/accounts'><Users className="w-6 h-6 text-blue-400" /></a>
                <h2 className="text-xl font-semibold">Current Staff</h2>
              </div>
              <p className="text-4xl font-bold text-blue-300">{stats.staffCount}</p>
              <p className="text-sm text-white/50">Active accounts with staff access</p>
            </div>

            <div className="bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl transition hover:shadow-2xl">
              <div className="flex items-center gap-4 mb-4">
                <a href='/admin/appeals'><CalendarMinus className="w-6 h-6 text-yellow-300" /></a>
                <h2 className="text-xl font-semibold">Appeals</h2>
              </div>
              <p className="text-4xl font-bold text-yellow-300">{stats?.appeals || 0}</p>
              <p className="text-sm text-white/50">Appeals to be read</p>
            </div>

            <div className="bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl transition hover:shadow-2xl">
              <div className="flex items-center gap-4 mb-4">
                <a href='/admin/leave'><Clock className="w-6 h-6 text-green-300" /></a>
                <h2 className="text-xl font-semibold">Leave Requests</h2>
              </div>
              <p className="text-4xl font-bold text-green-300">{stats?.requests || 0}</p>
              <p className="text-sm text-white/50">Requests to be read</p>
            </div>

            <div className="bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl transition hover:shadow-2xl">
              <div className="flex items-center gap-4 mb-4">
                <a href='/admin/appeals'><Sparkles className="w-6 h-6 text-red-300" /></a>
                <h2 className="text-xl font-semibold">Applications</h2>
              </div>
              <p className="text-4xl font-bold text-red-300">{stats?.applications || 0}</p>
              <p className="text-sm text-white/50">Applications to be read</p>
            </div>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
            <div className="bg-zinc-900 border border-white/20 rounded-2xl p-8 w-full max-w-lg space-y-6 shadow-2xl">
              <h2 className="text-2xl font-bold">New Announcement</h2>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <input
                    type="text"
                    name="title"
                    placeholder="Title"
                    value={announcement.title}
                    onChange={(e) =>     handleEditChange('title', e.target.value)
}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40"
                    disabled={loadingSubmit}
                  />
<select
  name="type"
  value={announcement.type}
  onChange={(e) => {
    handleEditChange('type', e.target.value)
    console.log('Selected type:', e.target.value);
  }}
  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
  disabled={loadingSubmit}
>
  <option value="" className="bg-white/10 text-black">Select Option</option>
  <option value="announcement" className="bg-white/10 text-black">Announcement</option>
  <option value="update" className="bg-white/10 text-black">Update</option>
  <option value="alert" className="bg-white/10 text-black">Alert</option>
</select>



                  <textarea
                    name="content"
                    rows={4}
                    placeholder="Write your announcement..."
                    value={announcement.content}
                    onChange={(e) =>     handleEditChange('content', e.target.value)
}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 resize-none"
                    disabled={loadingSubmit}
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg"
                    disabled={loadingSubmit}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loadingSubmit}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    {loadingSubmit ? 'Posting...' : 'Post Announcement'}
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
