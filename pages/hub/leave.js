'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import AuthWrapper from '@/components/AuthWrapper';

export default function LeavePage() {
  const [form, setForm] = useState({
    userId: '',  // <-- staff id here
    reason: '',
    startDate: '',
    endDate: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  // Fetch user info on mount
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('User'));
    if (userData) {
      setUser(userData);
      setForm((prev) => ({ ...prev, userId: userData._id })); // Set staff ID from local storage
    }

    async function fetchUser() {
      try {
        // Replace this with your actual API call to get user info / staff ID
        const res = await axios.get('/api/user/me');
        // Assuming res.data = { userId: 'staff123', name: 'Bob', role: 'Admin' }
        setForm((prev) => ({ ...prev, userId: res.data.userId }));
      } catch (err) {
        setError('Failed to load user info');
      }
    }
    fetchUser();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/api/leave/request', form);
      if (res.status === 200) setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    }
  };

  if (submitted) {
    return (
      <AuthWrapper requiredRole="hub">
        <main className="flex items-center py-50 justify-center text-white px-4">
          <div className="bg-white/10 backdrop-blur-md p-10 rounded-2xl shadow-lg border border-white/20 text-center max-w-md">
            <h1 className="text-2xl font-bold">✅ Request Submitted</h1>
            <p className="mt-2 text-white/70">We’ve received your LOA request. Thank you!</p>
          </div>
        </main>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper requiredRole="hub">
      <main className="flex items-center justify-center py-10 text-white px-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white/10 backdrop-blur-md p-10 rounded-2xl shadow-lg border border-white/20 max-w-xl w-full space-y-6"
        >
          <h1 className="text-3xl font-bold">📅 Leave of Absence Request</h1>

          <div>
            <label className="block mb-1 font-medium">Staff ID</label>
            <input
              name="userId"
              value={form.userId}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 placeholder-white/50"
              placeholder="Your staff id"
              disabled
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Reason</label>
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 placeholder-white/50"
              placeholder="Why are you requesting leave?"
            ></textarea>
          </div>

          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block mb-1 font-medium">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded bg-white/10 border border-white/20"
              />
            </div>
            <div className="w-1/2">
              <label className="block mb-1 font-medium">End Date</label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded bg-white/10 border border-white/20"
              />
            </div>
          </div>

          {error && <p className="text-red-500">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold transition"
          >
            Submit Request
          </button>
        </form>
      </main>
    </AuthWrapper>
  );
}
