'use server';

import { useState, useEffect } from 'react';
import axios from 'axios';
import AuthWrapper from '@/components/AuthWrapper';
import ConfirmModal from '@/components/ConfirmModal'; // Your reusable confirm modal
import { Calendar, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StatusBadge = ({ status }) => {
  const colors = {
    Approved: 'bg-green-600 text-green-100',
    Pending: 'bg-yellow-500 text-yellow-100',
    Rejected: 'bg-red-600 text-red-100',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded ${colors[status] || 'bg-gray-500 text-white'}`}>
      {status}
    </span>
  );
};

export default function LeavePage() {
  // Form for new LOA
  const [form, setForm] = useState({
    userId: '',
    reason: '',
    startDate: '',
    endDate: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loaHistory, setLoaHistory] = useState([]);
  const [user, setUser] = useState(null);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    reason: '',
    startDate: '',
    endDate: '',
  });
  const [editId, setEditId] = useState(null);
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Confirm modal state
  const [confirmData, setConfirmData] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
  });

  // Fetch user and LOA history on mount
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('User'));
    if (userData) {
      setUser(userData);
      setForm((prev) => ({ ...prev, userId: userData._id }));
      fetchLoaHistory(userData._id);
    }
  }, []);

  // Fetch LOA history helper
  const fetchLoaHistory = async (userId) => {
    try {
      const response = await axios.get(`/api/leave/history?userId=${userId}`);
      setLoaHistory(response.data);
    } catch (err) {
      console.error('Failed to fetch LOA history:', err);
    }
  };

  // Handle input changes for new LOA form
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handle input changes for edit LOA form
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Open confirm modal helper
  const openConfirm = ({ title, message, onConfirm, onCancel, confirmText, cancelText }) => {
    setConfirmData({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        closeConfirm();
      },
      onCancel: () => {
        if (onCancel) onCancel();
        closeConfirm();
      },
      confirmText: confirmText || 'Confirm',
      cancelText: cancelText || 'Cancel',
    });
  };

  const closeConfirm = () => setConfirmData((prev) => ({ ...prev, isOpen: false }));

  // Submit new leave request
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const now = new Date();
    const start = new Date(form.startDate);
    const diff = (start - now) / (1000 * 60 * 60 * 24);

    const actuallySubmit = async () => {
      try {
        await axios.post('/api/leave/request', form);
        setSubmitted(true);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to submit request.');
      }
    };

    if (diff < 2) {
      openConfirm({
        title: '⚠️ Leave starts soon',
        message: 'Your leave start date is less than 2 days away. Are you sure you want to proceed?',
        onConfirm: actuallySubmit,
        onCancel: () => setError('Submission cancelled.'),
        confirmText: 'Yes, Submit',
        cancelText: 'Cancel',
      });
      return;
    }

    actuallySubmit();
  };

  // Delete LOA request
  const handleDelete = (id) => {
    openConfirm({
      title: 'Delete Leave Request',
      message: 'Are you sure you want to delete this leave request? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await axios.delete(`/api/leave?id=${id}`);
          setLoaHistory((prev) => prev.filter((e) => e._id !== id));
        } catch {
          alert('Failed to delete LOA.');
        }
      },
      onCancel: () => {},
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
  };

  // Open edit modal with LOA data
  const handleEdit = (loa) => {
    setEditId(loa._id);
    setEditForm({
      reason: loa.reason,
      startDate: loa.startDate.slice(0, 10),
      endDate: loa.endDate.slice(0, 10),
    });
    setEditError('');
    setShowEditModal(true);
  };

  // Submit edit with confirmation modal
  const handleEditSubmit = (e) => {
    e.preventDefault();
    setEditError('');

    const actuallyEdit = async () => {
      setEditSubmitting(true);
      try {
        await axios.put(`/api/leave?id=${editId}`, editForm);
        // Update LOA list locally or refetch:
        setLoaHistory((prev) =>
          prev.map((loa) =>
            loa._id === editId ? { ...loa, ...editForm } : loa
          )
        );
        setShowEditModal(false);
      } catch (err) {
        setEditError(err.response?.data?.error || 'Failed to update leave request.');
      } finally {
        setEditSubmitting(false);
      }
    };

    openConfirm({
      title: 'Confirm Edit',
      message: 'Are you sure you want to save these changes?',
      onConfirm: actuallyEdit,
      onCancel: () => {},
      confirmText: 'Yes, Save',
      cancelText: 'Cancel',
    });
  };

  if (submitted) {
    return (
      <AuthWrapper requiredRole="hub">
        <main className="min-h-[calc(100vh-160px)] flex items-center justify-center text-white px-4">
          <div className="bg-[#283335] p-8 backdrop-blur-lg rounded-2xl border border-white/20 text-center max-w-md shadow-xl">
            <h1 className="text-3xl font-bold">✅ Request Submitted</h1>
            <p className="mt-2 text-white/70">Thanks for submitting your leave request!</p>
          </div>
        </main>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper requiredRole="hub">
      <main className="px-6 py-10 max-w-7xl mx-auto text-white grid grid-cols-1 md:grid-cols-3 gap-8 min-h-[calc(100vh-165px)]">
        {/* LOA History */}
        <section className="md:col-span-1 bg-[#283335] border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl max-h-[75vh] overflow-y-auto">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Calendar className="text-yellow-300" /> Your LOA History
          </h2>

          {loaHistory === null ? (
            <p className="text-white/60">No leave requests found.</p>
          ) : (
            <AnimatePresence>
              <ul className="space-y-4">
                {[...loaHistory].reverse().map((entry, idx) => (
                  <motion.li
                    key={entry._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-sm text-sm text-white"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-semibold text-lg">{entry.reason}</div>
                      <StatusBadge status={entry.status} />
                    </div>
                    <div className="text-white/70">
                      {entry.startDate} → {entry.endDate}
                    </div>
                    <div className="flex gap-3 mt-3 text-xs">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="text-blue-400 hover:underline"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(entry._id)}
                        className="text-red-400 hover:underline"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </AnimatePresence>
          )}
        </section>

        {/* LOA Request Form */}
        <section className="md:col-span-2 bg-[#283335] border border-white/20 backdrop-blur-md p-8 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-semibold mb-6">📅 Submit Leave Request</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block font-medium mb-1">Staff ID</label>
              <input
                name="userId"
                value={form.userId}
                disabled
                className="w-full px-4 py-2 rounded bg-[#283335] border border-white/20 text-white placeholder-white/50"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Reason</label>
              <textarea
                name="reason"
                value={form.reason}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-4 py-2 rounded bg-[#283335] border border-white/20 text-white placeholder-white/50 resize-none"
                placeholder="Explain why you're taking leave..."
              />
            </div>

            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="block font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded bg-[#283335] border border-white/20 text-white"
                />
              </div>
              <div className="w-1/2">
                <label className="block font-medium mb-1">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded bg-[#283335] border border-white/20 text-white"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition shadow-lg w-full"
            >
              Submit Request
            </button>
          </form>
        </section>

        {/* Edit Modal */}
        <AnimatePresence>
          {showEditModal && (
            <motion.div
              className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
            >
              <motion.div
                className="bg-[#283335] border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl max-w-md w-full text-white"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Edit Leave Request</h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-white hover:text-red-400"
                    aria-label="Close edit modal"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div>
                    <label className="block mb-1 font-semibold" htmlFor="reason">
                      Reason
                    </label>
                    <textarea
                      id="reason"
                      name="reason"
                      rows={4}
                      value={editForm.reason}
                      onChange={handleEditChange}
                      className="w-full rounded bg-white/20 px-4 py-2 border border-white/30 text-white resize-none"
                      required
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <label className="block mb-1 font-semibold" htmlFor="startDate">
                        Start Date
                      </label>
                      <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={editForm.startDate}
                        onChange={handleEditChange}
                        required
                        className="w-full rounded bg-white/20 px-4 py-2 border border-white/30 text-white"
                      />
                    </div>
                    <div className="w-1/2">
                      <label className="block mb-1 font-semibold" htmlFor="endDate">
                        End Date
                      </label>
                      <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        value={editForm.endDate}
                        onChange={handleEditChange}
                        required
                        className="w-full rounded bg-white/20 px-4 py-2 border border-white/30 text-white"
                      />
                    </div>
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
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirm Modal */}
        <ConfirmModal
          isOpen={confirmData.isOpen}
          title={confirmData.title}
          message={confirmData.message}
          onConfirm={confirmData.onConfirm}
          onCancel={confirmData.onCancel}
          confirmText={confirmData.confirmText}
          cancelText={confirmData.cancelText}
        />
      </main>
    </AuthWrapper>
  );
}
