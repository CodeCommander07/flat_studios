'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';

export default function SetTaskPage() {
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

    // 🔍 Search for developers
    useEffect(() => {
        if (!search || search.length < 2) {
            setResults([]);
            return;
        }

        const fetchResults = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`/api/developers/search?q=${encodeURIComponent(search)}`);
                console.log('Search results:', res.data); // 👈 add this
                setResults(res.data);
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
        setSearch(`${user.discordUsername}`);
        setResults([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/developers/tasks/set', form);
            setMessage('✅ Task created successfully!');
            setForm({ taskName: '', taskDescription: '', userId: '', dueDate: '' });
            setSearch('');
        } catch (err) {
            console.error('Error creating task:', err.message);
            setMessage('❌ Failed to create task.');
        }
    };

    return (
        <div className="p-8 text-white max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Set New Developer Task</h1>

            <form onSubmit={handleSubmit} className="space-y-4 bg-white/10 border border-white/20 p-6 rounded-2xl backdrop-blur-md">
                <div>
                    <label className="block mb-2">Task Name</label>
                    <input
                        type="text"
                        name="taskName"
                        value={form.taskName}
                        onChange={handleChange}
                        required
                        className="w-full p-2 rounded bg-white/20 border border-white/30 text-white"
                    />
                </div>

                <div>
                    <label className="block mb-2">Description</label>
                    <textarea
                        name="taskDescription"
                        value={form.taskDescription}
                        onChange={handleChange}
                        required
                        rows={3}
                        className="w-full p-2 rounded bg-white/20 border border-white/30 text-white"
                    />
                </div>

                <div className="relative">
                    <label className="block mb-2">Assign To</label>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search developer..."
                        className="w-full p-2 rounded bg-white/20 border border-white/30 text-white"
                    />

                    {loading && (
                        <div className="absolute bg-black/70 p-2 rounded-b-lg w-full text-center text-sm text-gray-300">
                            Searching...
                        </div>
                    )}

                    {results.length > 0 && (
                        <ul className="absolute bg-black/80 border border-white/20 w-full mt-1 rounded-lg max-h-64 overflow-y-auto z-50">
                            {results.map((user) => (
                                <li
                                    key={user._id}
                                    onClick={() => handleSelectUser(user)}
                                    className="flex items-center gap-3 p-3 hover:bg-white/10 cursor-pointer"
                                >
                                    <Image width={10} height={10}
                                        src={user.defaultAvatar || '/default-avatar.png'}
                                        alt={user.username}
                                        className="w-10 h-10 rounded-full"
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-semibold">{user.username}</span>
                                        <span className="text-sm text-gray-400">{user.robloxUsername} / {user.DiscordUsername}</span>
                                        <span className="text-xs text-gray-500">- {user.id}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div>
                    <label className="block mb-2">Task Priority</label>
                    <select
                        name="priority"
                        value={form.priority}
                        onChange={handleChange}
                        required
                        className="w-full p-2 rounded bg-white/20 border border-white/30 text-inherit"
                    >
                        <option className='bg-black text-blue-300 hover:text-blue-700' value="low">Low</option>
                        <option className='bg-black text-yellow-300 hover:text-yellow-700' value="medium">Medium</option>
                        <option className='bg-black text-orange-300 hover:text-orange-700' value="high">High</option>
                        <option className='bg-black text-red-300 hover:text-red-700' value="urgent">Urgent</option>
                    </select>
                </div>

                <div>
                    <label className="block mb-2">Due Date</label>
                    <input
                        type="date"
                        name="dueDate"
                        value={form.dueDate}
                        onChange={handleChange}
                        required
                        className="w-full p-2 rounded bg-white/20 border border-white/30 text-white"
                    />
                </div>

                <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold"
                >
                    Create Task
                </button>
            </form>

            {message && <p className="mt-4 text-center">{message}</p>}
        </div>
    );
}
