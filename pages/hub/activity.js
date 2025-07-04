'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import AuthWrapper from '@/components/AuthWrapper';
import { Clock, PlusCircle, Pencil, Trash2, X } from 'lucide-react';

export default function ActivityPage() {
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Form state for new activity log
  const [form, setForm] = useState({
    date: '',
    duration: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLog, setEditLog] = useState(null); // the log being edited
  const [editForm, setEditForm] = useState({
    date: '',
    duration: '',
    description: '',
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  // Axios instance with user ID header (auth)
  const axiosInstance = axios.create({
    headers: {
      'x-user-id': user?._id || '',
    },
  });

  // Fetch stats and user info
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('User'));
    setUser(userData);

    const fetchStats = async () => {
      try {
        const res = await axiosInstance.get('/api/roblox/stats');
        setStats(res.data || {});
      } catch (err) {
        console.error('Failed to fetch stats:', err.message);
      }
    };

    const fetchLogs = async () => {
      setLoadingLogs(true);
      try {
        const res = await axiosInstance.get('/api/activity/logs');
        setLogs(res.data || []);
      } catch (err) {
        console.error('Failed to fetch logs:', err.message);
      } finally {
        setLoadingLogs(false);
      }
    };

    fetchStats();
    fetchLogs();

    const interval = setInterval(() => {
      fetchStats();
      fetchLogs();
    }, 30000);

    return () => clearInterval(interval);
  }, [user?._id]);

  // Handle new activity input changes
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Handle new activity form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    if (!form.date || !form.duration || !form.description) {
      setError('Please fill all fields.');
      setSubmitting(false);
      return;
    }

    try {
      await axiosInstance.post('/api/activity/logs', form);
      setSuccessMsg('Activity logged successfully!');
      setForm({ date: '', duration: '', description: '' });

      const res = await axiosInstance.get('/api/activity/logs');
      setLogs(res.data || []);
    } catch {
      setError('Failed to submit activity.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete a log by ID
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this activity log?')) return;

    try {
      await axiosInstance.delete(`/api/activity/logs/${id}`);
      setLogs(logs.filter((log) => log._id !== id));
    } catch {
      alert('Failed to delete activity log.');
    }
  };

  // Open edit modal with log data
  const openEditModal = (log) => {
    setEditLog(log);
    setEditForm({
      date: new Date(log.date).toISOString().slice(0, 10),
      duration: log.duration.toString(),
      description: log.description,
    });
    setEditError('');
    setShowEditModal(true);
  };

  // Handle edit form input changes
  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  // Submit edit form
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    setEditError('');

    if (!editForm.date || !editForm.duration || !editForm.description) {
      setEditError('Please fill all fields.');
      setEditSubmitting(false);
      return;
    }

    try {
      await axiosInstance.put(`/api/activity/logs/${editLog._id}`, {
        date: editForm.date,
        duration: parseFloat(editForm.duration),
        description: editForm.description,
      });

      // Update log in UI
      setLogs((prev) =>
        prev.map((log) =>
          log._id === editLog._id
            ? { ...log, date: editForm.date, duration: parseFloat(editForm.duration), description: editForm.description }
            : log
        )
      );
      setShowEditModal(false);
      setEditLog(null);
    } catch {
      setEditError('Failed to update activity log.');
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <AuthWrapper requiredRole="hub">
      <main className="text-white px-6 py-6 max-w-7xl mx-auto">
        <div className="text-center bg-white/10 border mb-6 border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl">
          <h1 className="text-3xl font-bold">Activity Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left side: Activity logs summary (1/3) */}
          <section className="md:col-span-1 bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl overflow-y-auto max-h-[70vh]">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-yellow-300" /> Your Activity Logs
            </h2>

            {loadingLogs ? (
              <p className="text-white/60">Loading logs...</p>
            ) : logs.length === 0 ? (
              <p className="text-white/60">No activity logs found.</p>
            ) : (
              <ul className="space-y-4 text-white/90 text-sm">
                {logs.map((log) => (
                  <li
                    key={log._id}
                    className="bg-white/5 p-3 rounded border border-white/10 flex flex-col gap-1"
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-semibold">{new Date(log.date).toLocaleDateString()}</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(log)}
                          className="text-blue-400 hover:underline flex items-center gap-1"
                          aria-label="Edit activity log"
                          type="button"
                        >
                          <Pencil size={16} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(log._id)}
                          className="text-red-400 hover:underline flex items-center gap-1"
                          aria-label="Delete activity log"
                          type="button"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </div>
                    <div>{log.duration} hour long shift</div>
                    <div className="italic text-white/70">{log.description}</div>
                  </li>
                ))}
              </ul>
            )}

            {/* Summary stats */}
            <div className="mt-8 border-t border-white/20 pt-6 text-white/70 text-sm">
              <p>
                Total Shifts: <span className="font-semibold">{logs.length}</span>
              </p>
              <p>
                Total Time:{' '}
                <span className="font-semibold">
                  {logs.reduce((acc, log) => acc + parseFloat(log.duration || 0), 0)}h
                </span>
              </p>
            </div>
          </section>

          {/* Right side: Form to add new activity (2/3) */}
          <section className="md:col-span-2 bg-white/10 border border-white/20 backdrop-blur-md p-8 rounded-2xl shadow-xl">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <PlusCircle className="w-6 h-6 text-green-400" /> Log New Activity
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6 text-white">
              <div>
                <label htmlFor="date" className="block mb-1 text-white/80 font-semibold">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={form.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="w-full rounded bg-white/20 px-4 py-2 border border-white/30 text-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="duration" className="block mb-1 text-white/80 font-semibold">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  id="duration"
                  min="0"
                  step="0.25"
                  value={form.duration}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  className="w-full rounded bg-white/20 px-4 py-2 border border-white/30 text-white"
                  placeholder="e.g. 2 or 1.5"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block mb-1 text-white/80 font-semibold">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full rounded bg-white/20 px-4 py-2 border border-white/30 text-white resize-none"
                  placeholder="Brief description of the activity"
                  required
                />
              </div>

              {error && <p className="text-red-500">{error}</p>}
              {successMsg && <p className="text-green-400">{successMsg}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-6 py-3 rounded font-semibold transition"
              >
                {submitting ? 'Submitting...' : 'Log Activity'}
              </button>
            </form>
          </section>
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
            onClick={() => setShowEditModal(false)}
          >
            <div
              className="bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl max-w-md w-full text-white"
              onClick={(e) => e.stopPropagation()} // prevent closing modal on inner click
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Edit Activity Log</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-white hover:text-red-400"
                  aria-label="Close edit modal"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label htmlFor="edit-date" className="block mb-1 text-white/80 font-semibold">
                    Date
                  </label>
                  <input
                    type="date"
                    id="edit-date"
                    value={editForm.date}
                    onChange={(e) => handleEditChange('date', e.target.value)}
                    className="w-full rounded bg-white/20 px-4 py-2 border border-white/30 text-white"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-duration" className="block mb-1 text-white/80 font-semibold">
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    id="edit-duration"
                    min="0"
                    step="0.25"
                    value={editForm.duration}
                    onChange={(e) => handleEditChange('duration', e.target.value)}
                    className="w-full rounded bg-white/20 px-4 py-2 border border-white/30 text-white"
                    placeholder="e.g. 2 or 1.5"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-description" className="block mb-1 text-white/80 font-semibold">
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    rows={4}
                    value={editForm.description}
                    onChange={(e) => handleEditChange('description', e.target.value)}
                    className="w-full rounded bg-white/20 px-4 py-2 border border-white/30 text-white resize-none"
                    placeholder="Brief description of the activity"
                    required
                  />
                </div>

                {editError && <p className="text-red-500">{editError}</p>}

                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-3 rounded font-semibold transition"
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </AuthWrapper>
  );
}
