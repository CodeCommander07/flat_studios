'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';


const formatDateForInput = (dateStr) => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = (`0${date.getMonth() + 1}`).slice(-2);
  const day = (`0${date.getDate()}`).slice(-2);
  return `${year}-${month}-${day}`;
};

const formatTimeForInput = (timeStr) => {
  const date = new Date(timeStr);
  const h = `${date.getHours()}`.padStart(2, '0');
  const m = `${date.getMinutes()}`.padStart(2, '0');
  return `${h}:${m}`;
};

const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return '';

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  const start = new Date();
  start.setHours(startH, startM, 0);

  const end = new Date();
  end.setHours(endH, endM, 0);

  let diffMs = end - start;
  if (diffMs < 0) {
    end.setDate(end.getDate() + 1);
    diffMs = end - start;
  }

  const diffMins = Math.floor(diffMs / 60000);
  return {
    hours: Math.floor(diffMins / 60),
    minutes: diffMins % 60,
  };
};

export default function ActivityPage() {
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({
    date: '', timeJoined: '', timeLeft: '',
    extraNotes: '', notable: 'No',
    host: '', participants: '', robloxUsername: '',
  });
  const [totalTime, setTotalTime] = useState(null);
  const [editingLog, setEditingLog] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('User');
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed);
      setForm(prev => ({ ...prev, robloxUsername: parsed.robloxUsername || '' }));
    }
  }, []);

  useEffect(() => {
    if (user?._id) fetchLogs();
  }, [user?._id]);

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/activity/logs', {
        headers: { 'x-user-id': user?._id || '' },
      });
      setLogs(res.data || []);
    } catch {
      console.error('Failed to load logs');
    }
  };

  useEffect(() => {
    if (form.timeJoined && form.timeLeft) {
      setTotalTime(calculateDuration(form.timeJoined, form.timeLeft));
    } else {
      setTotalTime(null);
    }
  }, [form.timeJoined, form.timeLeft]);

  const isInvalid = (field) => {
    if (field === 'notable') return false;
    return !form[field] && form[field] !== 'No' && form[field] !== 'Yes';
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setEditingLog(null);
    setForm({
      date: '', timeJoined: '', timeLeft: '',
      extraNotes: '', notable: 'No',
      host: '', participants: '', robloxUsername: user?.robloxUsername || '',
    });
    setTotalTime(null);
    setError('');
    setSuccessMsg('');
  };

  const startEditing = (log) => {
    setEditingLog(log);
    setForm({
      date: formatDateForInput(log.date),
      timeJoined: log.timeJoined,
      timeLeft: log.timeLeft,
      duration: `${totalTime.hours}h ${totalTime.minutes}m`,
      extraNotes: log.description || log.extraNotes || '',
      notable: log.notable || 'No',
      host: log.host || '',
      participants: log.participants || '',
      robloxUsername: user?.robloxUsername || '',
    });
    setError('');
    setSuccessMsg('');
    console.log('Editing log:', log);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (
      isInvalid('date') || isInvalid('timeJoined') || isInvalid('timeLeft') || isInvalid('extraNotes') ||
      (form.notable === 'Yes' && (isInvalid('host') || isInvalid('participants')))
    ) {
      setError('Please fill all required fields.');
      return;
    }

    if (!totalTime || totalTime.hours < 0 || totalTime.minutes < 0) {
      setError('Invalid time range.');
      return;
    }

    const payload = {
      date: form.date,
      timeJoined: form.timeJoined,
      timeLeft: form.timeLeft,
      description: form.extraNotes,
      notable: form.notable,
      host: form.host,
      participants: form.participants,
      duration: `${totalTime.hours}h ${totalTime.minutes}m`,
      userId: user?._id,
    };

    setSubmitting(true);

    try {
      if (editingLog) {
        await axios.put(`/api/activity/logs/${editingLog._id}`, payload, {
          headers: { 'x-user-id': user?._id || '' },
        });
        setSuccessMsg('Log updated!');
      } else {
        await axios.post('/api/activity/logs', payload, {
          headers: { 'x-user-id': user?._id || '' },
        });
        setSuccessMsg('Log created!');
      }
      fetchLogs();
      resetForm();
    } catch {
      setError('Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="p-6 text-white">
      <div className="flex justify-between mb-4 bg-white/10 border border-white/20 backdrop-blur-md p-3 rounded-2xl shadow-xl">
        <h2 className="text-xl font-semibold">{editingLog ? 'Edit Activity Log' : 'Activity Logs'}</h2>
        <button
          onClick={resetForm}
          className="text-md border border-white/20 px-3 py-1 rounded hover:bg-white/20"
        >
          {editingLog ? 'New Entry' : 'Reset'}
        </button>
      </div>

     <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        {/* Logs */}
        <div className="order-2 lg:order-none">
          <ul className="md:col-span-1 bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl max-h-[75vh] overflow-y-auto">
            {logs.map(log => (
              <li key={log._id} className="p-4 mb-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-2xl shadow transition">
                <div>
                  <p className="font-semibold">{log.date}: {log.timeJoined} - {log.timeLeft}</p>
                  <p className="text-white/60">{log.duration} hrs</p>
                  <p className="italic text-white/50">{log.description}</p>
                </div>
                <div className="text-right space-y-1">
                  <button onClick={() => startEditing(log)} className="text-white hover:bg-blue-800 text-sm mx-4 p-2 bg-blue-600 rounded">Edit</button>
                  <button
                    onClick={async () => {
                      if (confirm('Delete this log?')) {
                        await axios.delete(`/api/activity/logs/${log._id}`, {
                          headers: { 'x-user-id': user?._id || '' },
                        });
                        fetchLogs();
                        if (editingLog?._id === log._id) resetForm();
                      }
                    }}
                    className="text-white hover:bg-red-800 text-sm p-2 bg-red-600 rounded"
                  >Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Form */}
        <div className="lg:col-span-2 order-1 lg:order-none bg-white/10 border border-white/20 backdrop-blur-md p-8 rounded-2xl shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Email</label>
                <input value={user?.email || ''} disabled className="w-full p-2 rounded-xl bg-gray-500/5 text-white" />
              </div>
              <div>
                <label>Roblox Username</label>
                <input value={form.robloxUsername} disabled className="w-full p-2 rounded-xl bg-gray-500/5 text-white" />
              </div>
            </div>

            <div>
              <label>Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.date} onChange={(e) => handleChange('date', e.target.value)}
                className={`w-full p-2 rounded-xl bg-white/10 border border-white/30 text-white`} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Time Joined <span className="text-red-500">*</span></label>
                <input type="time" value={form.timeJoined} onChange={(e) => handleChange('timeJoined', e.target.value)}
                  className={`w-full p-2 rounded-xl bg-white/10 border border-white/30 text-white`} />
              </div>
              <div>
                <label>Time Left <span className="text-red-500">*</span></label>
                <input type="time" value={form.timeLeft} onChange={(e) => handleChange('timeLeft', e.target.value)}
                  className={`w-full p-2 rounded-xl bg-white/10 border border-white/30 text-white`} />
              </div>
            </div>

            {totalTime && (
              <p className="text-sm text-white/60">
                ⏱ Total: <span className='text-green-600'>{totalTime.hours}h {totalTime.minutes}m</span>
              </p>
            )}

            <div>
              <label>Notes<span className="text-red-500">*</span></label>
              <textarea
                rows={3}
                value={form.extraNotes}
                required
                onChange={(e) => handleChange('extraNotes', e.target.value)}
                className={`w-full p-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition`}
                placeholder="Write anything notable..."
              />
            </div>

            <div>
              <label>Was this a shift?<span className="text-red-500">*</span></label>
              <select value={form.notable} onChange={(e) => handleChange('notable', e.target.value)}
                className="w-full p-2 rounded-xl bg-white/10 border border-white/30 text-white">
                  required
                <option value="No" className="text-black">No</option>
                <option value="Yes" className="text-black">Yes</option>
              </select>
            </div>

            {form.notable === 'Yes' && (
              <>
                <div>
                  <label>Did you host? <span className="text-red-500">*</span></label>
                  <select value={form.host} onChange={(e) => handleChange('host', e.target.value)}
                    className={`w-full p-2 rounded-xl bg-white/10 border text-white`}>
                    <option value="">Select</option>
                    <option value="Yes" className="text-black">Yes</option>
                    <option value="No" className="text-black">No</option>
                  </select>
                </div>
                <div>
                  <label>Estimated Participants <span className="text-red-500">*</span></label>
                  <input type="text" value={form.participants} onChange={(e) => handleChange('participants', e.target.value)}
                    className={`w-full p-2 rounded-xl bg-white/10 border text-white`} />
                </div>
              </>
            )}

            {error && <p className="text-red-400">{error}</p>}
            {successMsg && <p className="text-green-400">{successMsg}</p>}

            <div className="flex gap-4">
              {editingLog ? (
                <>
                  <div className="flex w-full">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-3 bg-green-600 hover:bg-green-900 font-semibold text-white rounded-l-xl transition duration-200 shadow-md"
                    >
                      {submitting ? 'Saving...' : 'Edit'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={submitting}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-900 font-semibold text-white rounded-r-xl transition duration-200 shadow-md"
                    >
                      Discard
                    </button>
                  </div>

                </>
              ) : (
                <button type="submit" disabled={submitting}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-900 font-semibold">
                  {submitting ? 'Submitting...' : 'Submit Activity'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
