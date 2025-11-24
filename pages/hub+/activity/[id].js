'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB'); // date only
}

function getDurationMinutes(startTime, endTime) {
  if (!startTime || !endTime) return 0;

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  let start = startH * 60 + startM;
  let end = endH * 60 + endM;

  // If end < start, assume it passed midnight, add 24 hours
  if (end < start) end += 24 * 60;

  const diff = end - start;
  return diff > 0 ? diff : 0;
}

function formatDuration(startTime, endTime) {
  const diff = getDurationMinutes(startTime, endTime);
  if (!diff) return '-';

  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;

  return `${hours > 0 ? hours + 'h ' : ''}${minutes}m`;
}

export default function UserActivityLogs() {
  const router = useRouter();
  const { id } = router.query;

  const [logs, setLogs] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // modal + editing
  const [editLog, setEditLog] = useState(null);
  const [form, setForm] = useState({
    date: '',
    timeJoined: '',
    timeLeft: '',
    description: '',
    notable: 'No',
  });
  const [submitting, setSubmitting] = useState(false);

  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  useEffect(() => {
    if (!id) return;

    setLoading(true);

    // Fetch user info
    axios
      .get(`/api/admin/get-user/${id}`)
      .then((res) => setUser(res.data))
      .catch(() => {});

    // Fetch user's logs
    axios
      .get(`/api/admin/activity-logs/by-user/${id}`)
      .then((res) => setLogs(res.data || []))
      .catch(() => setError('Failed to load logs'))
      .finally(() => setLoading(false));
  }, [id]);

  // open edit modal + fill form
  function openEdit(log) {
    setEditLog(log);
    setForm({
      date: log.date ? new Date(log.date).toISOString().slice(0, 10) : '',
      timeJoined: log.timeJoined || '',
      timeLeft: log.timeLeft || '',
      description: log.description || '',
      notable: log.notable || 'No',
    });
  }

  function closeEdit() {
    setEditLog(null);
    setForm({
      date: '',
      timeJoined: '',
      timeLeft: '',
      description: '',
      notable: 'No',
    });
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!editLog) return;

    setSubmitting(true);
    try {
      const res = await axios.put(`/api/admin/activity-logs/${editLog._id}`, form);
      setLogs((prev) => prev.map((log) => (log._id === editLog._id ? res.data : log)));
      closeEdit();
    } catch {
      alert('Failed to update log.');
    }
    setSubmitting(false);
  }

  async function handleDelete(logId) {
    if (!confirm('Are you sure you want to delete this log?')) return;
    try {
      await axios.delete(`/api/admin/activity-logs/${logId}`);
      setLogs((prev) => prev.filter((log) => log._id !== logId));
    } catch {
      alert('Failed to delete log.');
    }
  }

  // sorting helpers
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

  const sortedLogs = [...logs].sort((a, b) => {
    const dir = sortConfig.direction === 'asc' ? 1 : -1;

    if (sortConfig.key === 'date') {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return da === db ? 0 : da < db ? -1 * dir : 1 * dir;
    }

    if (sortConfig.key === 'duration') {
      const da = getDurationMinutes(a.timeJoined, a.timeLeft);
      const db = getDurationMinutes(b.timeJoined, b.timeLeft);
      return da === db ? 0 : da < db ? -1 * dir : 1 * dir;
    }

    if (sortConfig.key === 'shift') {
      const va = (a.notable === 'Yes' || a.notable === 'yes') ? 1 : 0;
      const vb = (b.notable === 'Yes' || b.notable === 'yes') ? 1 : 0;
      return va === vb ? 0 : va < vb ? -1 * dir : 1 * dir;
    }

    return 0;
  });

  if (loading) return <p className="text-white p-6">Loading logs...</p>;
  if (error) return <p className="text-red-500 p-6">{error}</p>;
  if (!logs.length)
    return <p className="text-white p-6">No logs found for this user.</p>;

  return (
    <main className="p-8 min-h-[calc(100vh-165px)] text-white">
      {/* Header bar */}
      <div className="mb-6 flex items-center justify-between bg-[#283335] border border-white/10 rounded-xl p-4 shadow-md">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white text-sm font-medium transition"
        >
          Go Back
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-right flex-1 ml-4">
          Activity Logs for{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-emerald-400 to-indigo-400">
            {user?.username || id}
          </span>
        </h1>
      </div>

      {/* Table wrapper (same style as other pages) */}
      <div className="overflow-hidden border border-white/10 rounded-xl shadow-md">
        <div className="overflow-auto max-h-[calc(100vh-230px)]">
          <table className="min-w-full border-collapse">
            <thead className="sticky top-0 bg-[#1F2729] text-gray-300 uppercase text-sm shadow-md z-10">
              <tr>
                <th
                  className="p-4 text-left font-semibold cursor-pointer select-none"
                  onClick={() => handleSort('date')}
                >
                  Date {getSortIcon('date')}
                </th>
                <th className="p-4 text-left font-semibold">Time Joined</th>
                <th className="p-4 text-left font-semibold">Time Left</th>
                <th
                  className="p-4 text-left font-semibold cursor-pointer select-none"
                  onClick={() => handleSort('duration')}
                >
                  Duration {getSortIcon('duration')}
                </th>
                <th className="p-4 text-left font-semibold">Description</th>
                <th
                  className="p-4 text-left font-semibold cursor-pointer select-none"
                  onClick={() => handleSort('shift')}
                >
                  Shift {getSortIcon('shift')}
                </th>
                <th className="p-4 text-left font-semibold">Host</th>
                <th className="p-4 text-left font-semibold">Attendees</th>
                <th className="p-4 text-left font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {sortedLogs.map((log, index) => (
                <tr
                  key={log._id}
                  className={`transition-colors ${
                    index % 2 === 0 ? 'bg-[#232C2E]' : 'bg-[#2C3A3D]'
                  } hover:bg-[#324246]`}
                >
                  <td className="p-4 whitespace-nowrap">
                    {formatDate(log.date)}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    {log.timeJoined || '-'}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    {log.timeLeft || '-'}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-emerald-500 text-emerald-300 bg-emerald-500/10">
                      {formatDuration(log.timeJoined, log.timeLeft)}
                    </span>
                  </td>
                  <td
                    className="p-4 max-w-xs truncate"
                    title={log.description}
                  >
                    {log.description}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                        log.notable === 'Yes' || log.notable === 'yes'
                          ? 'border-yellow-500 text-yellow-300 bg-yellow-500/10'
                          : 'border-gray-500 text-gray-300 bg-gray-500/10'
                      }`}
                    >
                      {log.notable || 'No'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-blue-500 text-blue-300 bg-blue-500/10">
                      {log.host || 'No'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-purple-500 text-purple-300 bg-purple-500/10">
                      {log.participants || '0'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openEdit(log)}
                        className="px-3 py-1 rounded-full text-xs font-medium border border-blue-500 text-blue-300 hover:bg-blue-500/20 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(log._id)}
                        className="px-3 py-1 rounded-full text-xs font-medium border border-red-500 text-red-300 hover:bg-red-500/20 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editLog && (
        <div
          className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
          onClick={closeEdit}
        >
          <div
            className="bg-[#283335] border border-white/10 rounded-xl max-w-lg w-full p-6 shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-semibold mb-4">Edit Activity Log</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Date</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full rounded bg-[#1F2729] p-2 border border-white/10"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-medium">Time Joined</label>
                  <input
                    type="time"
                    name="timeJoined"
                    value={form.timeJoined}
                    onChange={handleChange}
                    className="w-full rounded bg-[#1F2729] p-2 border border-white/10"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Time Left</label>
                  <input
                    type="time"
                    name="timeLeft"
                    value={form.timeLeft}
                    onChange={handleChange}
                    className="w-full rounded bg-[#1F2729] p-2 border border-white/10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-medium">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="w-full rounded bg-[#1F2729] p-2 border border-white/10 resize-none"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Notable</label>
                <select
                  name="notable"
                  value={form.notable}
                  onChange={handleChange}
                  className="w-full rounded bg-[#1F2729] p-2 border border-white/10"
                >
                  <option className="text-white bg-black" value="No">
                    No
                  </option>
                  <option className="text-white bg-black" value="Yes">
                    Yes
                  </option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="px-4 py-2 rounded-full bg-gray-700 hover:bg-gray-600 transition text-sm font-medium"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700 transition text-sm font-medium"
                >
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
