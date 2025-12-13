'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const formatDateForInput = (dateInput) => {
  const date = new Date(dateInput);
  const year = date.getFullYear();
  const month = (`0${date.getMonth() + 1}`).slice(-2);
  const day = (`0${date.getDate()}`).slice(-2);
  return `${year}-${month}-${day}`;
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

const getStartOfWeek = () => {
  const now = new Date();
  const day = now.getDay(); // 0 (Sun) to 6 (Sat)
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust if Sunday is 0
  return new Date(now.setDate(diff));
};

// Previous Sunday (always the one before the current week)
// For Monday: yesterday, for Tuesday: 2 days ago, for Sunday: 7 days ago
const getLastSunday = (base = new Date()) => {
  const today = new Date(base);
  const day = today.getDay(); // Sunday = 0
  const diff = day === 0 ? 7 : day; // Sunday -> 7, Mon -> 1, Tue -> 2, ...
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - diff);
  sunday.setHours(0, 0, 0, 0);
  return sunday;
};

// True if it's *this* Sunday after 20:00
const isPastSunday8PM = (now = new Date()) => {
  if (now.getDay() !== 0) return false; // not Sunday
  const eightPM = new Date(now);
  eightPM.setHours(20, 0, 0, 0);
  return now >= eightPM;
};

export default function ActivityPage() {
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [weeklySummary, setWeeklySummary] = useState({ hours: 0, minutes: 0 });
  const [form, setForm] = useState({
    date: formatDateForInput(new Date()),
    timeJoined: '',
    timeLeft: '',
    extraNotes: '',
    notable: 'No',
    host: 'No',
    participants: '',
    robloxUsername: '',
  });
  const [totalTime, setTotalTime] = useState(null);
  const [editingLog, setEditingLog] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [fallbackDuration, setFallbackDuration] = useState('');

  // Compute date boundaries for the picker
  const today = new Date();
  const lastSunday = getLastSunday(today);
  const allowedSunday = isPastSunday8PM(today) ? today : lastSunday;
  const minDate = formatDateForInput(allowedSunday);
  const maxDate = formatDateForInput(today);

  useEffect(() => {
    if (form.timeJoined && form.timeLeft) {
      setTotalTime(calculateDuration(form.timeJoined, form.timeLeft));
      setFallbackDuration('');
    } else {
      setTotalTime(null);
    }
  }, [form.timeJoined, form.timeLeft]);

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

  // (duplicate effect kept, as in your original file)
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

  // UPDATED: time validation for last Sunday after 20:00
  const handleChange = (field, value) => {
    if (field === 'timeJoined' || field === 'timeLeft') {
      const selectedDate = new Date(form.date);
      const strictLastSunday = getLastSunday(); // previous Sunday relative to "now"
      const isLastSundaySelected =
        formatDateForInput(selectedDate) === formatDateForInput(strictLastSunday);

      if (isLastSundaySelected && value < '20:00') {
        setError('Last Sunday activities must be after 20:00 (8pm).');
        return;
      }
    }

    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const resetForm = () => {
    setEditingLog(null);
    setForm({
      date: formatDateForInput(new Date()),
      timeJoined: '',
      timeLeft: '',
      extraNotes: '',
      notable: 'No',
      host: 'No',
      participants: '',
      robloxUsername: user?.robloxUsername || '',
    });
    setTotalTime(null);
    setError('');
    setSuccessMsg('');
    setFallbackDuration('');
  };

  const startEditing = (log) => {
    const calculatedDuration = calculateDuration(log.timeJoined, log.timeLeft);
    setEditingLog(log);
    setForm({
      date: formatDateForInput(log.date),
      timeJoined: log.timeJoined,
      timeLeft: log.timeLeft,
      extraNotes: log.description || log.extraNotes || '',
      notable: log.notable || 'No',
      host: log.host || '',
      participants: log.participants || '',
      robloxUsername: user?.robloxUsername || '',
    });
    setFallbackDuration(log.duration || '');
    setError('');
    setSuccessMsg('');
    console.log('Editing log:', log);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (
      isInvalid('date') || isInvalid('timeJoined') || isInvalid('timeLeft') ||
      (form.notable === 'Yes' && (isInvalid('host'))) || (form.host === 'Yes' && (isInvalid('participants')))
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
      description: form.extraNotes || "N/A",
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

  useEffect(() => {
    if (logs.length > 0) {
      const weekStart = getStartOfWeek();
      let totalMinutes = 0;

      logs.forEach(log => {
        const logDate = new Date(log.date);
        if (logDate >= weekStart) {
          const [h, m] = log.duration.split('h').map(s => s.replace('m', '').trim());
          totalMinutes += parseInt(h) * 60 + parseInt(m);
        }
      });

      setWeeklySummary({
        hours: Math.floor(totalMinutes / 60),
        minutes: totalMinutes % 60,
      });
    }
  }, [logs]);

  return (
    <main className="p-6 text-white">
      <div className="flex justify-between mb-4 bg-[#283335] border border-white/20 backdrop-blur-md p-3 rounded-2xl shadow-xl">
        <h2 className="text-xl font-semibold">{editingLog ? 'Edit Activity Log' : 'Activity Logs'}</h2>
        <button
          onClick={resetForm}
          className="text-md border border-white/20 px-3 py-1 rounded hover:bg-white/20"
        >
          {editingLog ? 'Reset' : 'New Entry'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        {/* Logs */}
        <div className="order-2 lg:order-none">
          <ul className="md:col-span-1 bg-[#283335] border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl max-h-[75vh] overflow-y-auto">
            <div className="p-4 mb-2 bg-black/95 hover:bg-black/90 border border-white/20 rounded-2xl shadow transition">
              <p className="text-lg font-medium">
                🗓️ Your Weekly Activity: <span className="text-green-400">{weeklySummary.hours}h {weeklySummary.minutes}m</span>
              </p>
            </div>
            {logs.map(log => (
              <li key={log._id} className="p-4 mb-2 bg-black/55 hover:bg-black/75 border border-white/20 rounded-2xl shadow transition">
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
        <div className="lg:col-span-2 order-1 lg:order-none bg-[#283335] border border-white/20 backdrop-blur-md p-8 rounded-2xl shadow-xl">
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
              <input
                type="date"
                value={form.date}
                onChange={(e) => handleChange('date', e.target.value)}
                min={minDate}
                max={maxDate}
                className="w-full p-2 rounded-xl bg-[#283335] border border-white/30 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Time Joined <span className="text-red-500">*</span></label>
                <input
                  type="time"
                  value={form.timeJoined}
                  onChange={(e) => handleChange('timeJoined', e.target.value)}
                  className="w-full p-2 rounded-xl bg-[#283335] border border-white/30 text:white"
                />
              </div>
              <div>
                <label>Time Left <span className="text-red-500">*</span></label>
                <input
                  type="time"
                  value={form.timeLeft}
                  onChange={(e) => handleChange('timeLeft', e.target.value)}
                  className="w-full p-2 rounded-xl bg-[#283335] border border-white/30 text-white"
                />
              </div>
            </div>

            {(totalTime || fallbackDuration) && (
              <p className="text-sm text-white/60">
                ⏱ Total: <span className='text-green-600'>
                  {totalTime
                    ? `${totalTime.hours}h ${totalTime.minutes}m`
                    : fallbackDuration}
                </span>
              </p>
            )}

            <div>
              <label>Notes</label>
              <textarea
                rows={3}
                value={form.extraNotes}
                onChange={(e) => handleChange('extraNotes', e.target.value)}
                className={`w-full p-3 rounded-xl bg-[#283335] border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition`}
                placeholder="Write anything notable..."
              />
            </div>

            <div>
              <label>Was this a shift?<span className="text-red-500">*</span></label>
              <select
                value={form.notable}
                onChange={(e) => handleChange('notable', e.target.value)}
                className="w-full p-2 rounded-xl bg-[#283335] border border-white/30 text-white"
              >
                required
                <option value="No" className="text-white">No</option>
                <option value="Yes" className="text-white">Yes</option>
              </select>
            </div>

            {form.notable === 'Yes' && (
              <>
                <div>
                  <label>Did you host? <span className="text-red-500">*</span></label>
                  <select
                    value={form.host}
                    onChange={(e) => handleChange('host', e.target.value)}
                    className={`w-full p-2 rounded-xl bg-[#283335] border text-white`}
                  >
                    <option value="">Select</option>
                    <option value="Yes" className="text-white">Yes</option>
                    <option value="No" className="text-white">No</option>
                  </select>
                </div>
                {form.host === 'Yes' && (
                  <div>
                    <label>Estimated Participants <span className="text-red-500">*</span></label>
                    <p className="text-sm text-white/60 mb-2">Hosting refers to leading or organizing the activity.</p>
                    <input
                      type="text"
                      value={form.participants}
                      onChange={(e) => handleChange('participants', e.target.value)}
                      className={`w-full p-2 rounded-xl bg-[#283335] border text-white`}
                    />
                  </div>
                )}
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
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-900 font-semibold"
                >
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
