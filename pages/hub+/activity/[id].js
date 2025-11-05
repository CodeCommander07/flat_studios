'use server';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-UK'); // date only
}

function formatDuration(startTime, endTime) {
  if (!startTime || !endTime) return '-';

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  let start = startH * 60 + startM;
  let end = endH * 60 + endM;

  // If end < start, assume it passed midnight, add 24 hours
  if (end < start) end += 24 * 60;

  const diff = end - start;
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

  // For modal & editing
  const [editLog, setEditLog] = useState(null);
  const [form, setForm] = useState({
    date: '',
    timeJoined: '',
    timeLeft: '',
    description: '',
    notable: 'No',
  });
  const [submitting, setSubmitting] = useState(false);

  

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    // Fetch user info
    axios.get(`/api/admin/get-user/${id}`).then(res => setUser(res.data)).catch(() => {});

    // Fetch user's logs
    axios.get(`/api/admin/activity-logs/by-user/${id}`)
      .then(res => setLogs(res.data))
      .catch(() => setError('Failed to load logs'))
      .finally(() => setLoading(false));
  }, [id]);

  // Open edit modal and autofill form
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

  // Close modal & reset form
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

  // Handle form input changes
  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  // Submit updated log
  async function handleSubmit(e) {
    e.preventDefault();
    if (!editLog) return;

    setSubmitting(true);
    try {
      const res = await axios.put(`/api/admin/activity-logs/${editLog._id}`, form);
      // Update logs locally without refetch
      setLogs(prev =>
        prev.map(log => (log._id === editLog._id ? res.data : log))
      );
      closeEdit();
    } catch {
      alert('Failed to update log.');
    }
    setSubmitting(false);
  }

  // Delete a log
  async function handleDelete(logId) {
    if (!confirm('Are you sure you want to delete this log?')) return;
    try {
      await axios.delete(`/api/admin/activity-logs/${logId}`);
      setLogs(prev => prev.filter(log => log._id !== logId));
    } catch {
      alert('Failed to delete log.');
    }
  }

  if (loading) return <p className="text-white p-6">Loading logs...</p>;
  if (error) return <p className="text-red-500 p-6">{error}</p>;
  if (!logs.length) return <p className="text-white p-6">No logs found for this user.</p>;

  return (
    <main className="p-8 min-h-[calc(100vh-165px)] text-white">
<div className="mb-6 flex items-center justify-between bg-gray-900 rounded-xl p-4">
  <button
    onClick={() => router.back()}
    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition"
  >
    Go Back
  </button>
  <h1 className="text-3xl font-bold text-right flex-1">
    Activity Logs for <span className='text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400'>{user?.username || id}</span>
  </h1>
</div>


      <table className="min-w-full bg-gray-800 rounded-xl overflow-hidden">
        <thead>
          <tr className="text-left text-gray-400 uppercase text-sm">
            <th className="p-4">Date</th>
            <th className="p-4">Time Joined</th>
            <th className="p-4">Time Left</th>
            <th className="p-4">Duration</th>
            <th className="p-4">Description</th>
            <th className="p-4">Shift</th>
            <th className="p-4">Host</th>
            <th className="p-4">Attendees</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>
<tbody>
  {logs.map(log => (
    <tr key={log._id} className="border-b border-gray-700 hover:bg-gray-700 transition">
      <td className="p-4">{formatDate(log.date)}</td>
      <td className="p-4">{log.timeJoined || '-'}</td>
      <td className="p-4">{log.timeLeft || '-'}</td>
      <td className="p-4 text-green-700">{formatDuration(log.timeJoined, log.timeLeft)}</td>
      <td className="p-4 max-w-xs truncate" title={log.description}>{log.description}</td>
      <td className="p-4">{log.notable || 'No'}</td>
      <td className="p-4">{log.host || 'No'}</td>
      <td className="p-4">{log.participants || '0'}</td>
      <td className="p-4 space-x-2">
        <button
          onClick={() => openEdit(log)}
          className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 transition"
        >
          Edit
        </button>
        <button
          onClick={() => handleDelete(log._id)}
          className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 transition"
        >
          Delete
        </button>
      </td>
    </tr>
  ))}
</tbody>

      </table>

      {/* Edit Modal */}
      {editLog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
          onClick={closeEdit}
        >
          <div
            className="bg-gray-900 rounded-lg max-w-lg w-full p-6 shadow-lg text-white"
            onClick={e => e.stopPropagation()}
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
                  className="w-full rounded bg-gray-800 p-2"
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
                    className="w-full rounded bg-gray-800 p-2"
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
                    className="w-full rounded bg-gray-800 p-2"
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
                  className="w-full rounded bg-gray-800 p-2 resize-none"
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
                  className="w-full rounded bg-gray-800 p-2"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-700 transition"
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
