'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function SetTaskPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    taskName: '',
    taskDescription: '',
    userId: '',
    dueDate: '',
    priority: '',
  });
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔍 Developer search
  useEffect(() => {
    if (!search || search.length < 2) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/developers/search?q=${encodeURIComponent(search)}`);
        setResults(res.data || []);
      } catch (err) {
        console.error('Search failed:', err.message);
      } finally {
        setLoading(false);
      }
    };

    const delay = setTimeout(fetchResults, 400);
    return () => clearTimeout(delay);
  }, [search]);

  const handleSelectUser = (user) => {
    setForm({ ...form, userId: user._id });
    setSearch(`${user.username}`);
    setResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/developers/tasks/set', form);
      setMessage('✅ Task created successfully!');
      setForm({ taskName: '', taskDescription: '', userId: '', dueDate: '', priority: '' });
      setSearch('');
    } catch (err) {
      console.error('Error creating task:', err.message);
      setMessage('❌ Failed to create task.');
    }
  };

  return (
    <div className="p-4 sm:p-8 text-white max-w-3xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center sm:text-left">
        Set New Developer Task
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 bg-white/10 border border-white/20 p-6 rounded-2xl backdrop-blur-md"
      >
        {/* 🧾 Task Name */}
        <div>
          <label className="block mb-2 font-medium">Task Name</label>
          <input
            type="text"
            name="taskName"
            value={form.taskName}
            onChange={handleChange}
            required
            className="w-full p-2 rounded bg-white/20 border border-white/30 text-white placeholder-gray-300"
            placeholder="Enter task title..."
          />
        </div>

        {/* 📄 Description */}
        <div>
          <label className="block mb-2 font-medium">Description</label>
          <textarea
            name="taskDescription"
            value={form.taskDescription}
            onChange={handleChange}
            required
            rows={3}
            className="w-full p-2 rounded bg-white/20 border border-white/30 text-white placeholder-gray-300"
            placeholder="Describe the task in detail..."
          />
        </div>

        {/* 👤 Assign To */}
        <div className="relative">
          <label className="block mb-2 font-medium">Assign To</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search developer..."
            className="w-full p-2 rounded bg-white/20 border border-white/30 text-white placeholder-gray-300"
          />

          {loading && (
            <div className="absolute bg-black/70 p-2 rounded-b-lg w-full text-center text-sm text-gray-300">
              Searching...
            </div>
          )}

          {results.length > 0 && (
            <ul className="absolute bg-black/90 border border-white/20 w-full mt-1 rounded-lg max-h-64 overflow-y-auto z-50">
              {results.map((user) => (
                <li
                  key={user._id}
                  onClick={() => handleSelectUser(user)}
                  className="flex items-center gap-3 p-3 hover:bg-white/10 cursor-pointer transition"
                >
                  <Image
                    src={user.defaultAvatar || '/default-avatar.png'}
                    alt={user.username}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex flex-col truncate">
                    <span className="font-semibold truncate">{user.username}</span>
                    <span className="text-sm text-gray-400 truncate">
                      {user.robloxUsername || '—'} / {user.discordUsername || '—'}
                    </span>
                    <span className="text-xs text-gray-500 truncate">{user._id}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ⚠️ Priority */}
        <div>
          <label className="block mb-2 font-medium">Task Priority</label>
          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
            required
            className="w-full p-2 rounded bg-white/20 border border-white/30 text-white"
          >
            <option value="">Select Priority</option>
            <option className="bg-black" value="low">🟢 Low</option>
            <option className="bg-black" value="medium">🟡 Medium</option>
            <option className="bg-black" value="high">🟠 High</option>
            <option className="bg-black" value="urgent">🔴 Urgent</option>
          </select>
        </div>

        {/* 📅 Due Date */}
        <div>
          <label className="block mb-2 font-medium">Due Date</label>
          <input
            type="date"
            name="dueDate"
            value={form.dueDate}
            onChange={handleChange}
            required
            className="w-full p-2 rounded bg-white/20 border border-white/30 text-white"
          />
        </div>

        {/* ✅ Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold transition w-full sm:w-auto"
          >
            Create Task
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/dev')}
            className="bg-gray-700 hover:bg-gray-800 px-6 py-2 rounded-lg font-semibold transition w-full sm:w-auto"
          >
            Cancel
          </button>
        </div>
      </form>

      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
