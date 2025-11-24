'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function RobloxConnectPage() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('User'));
    if (storedUser?._id) {
      setUserId(storedUser._id);
    }
  }, []);

  const handleConnect = async () => {
    try {
      const res = await axios.post('/api/user/roblox/update', {
        userId,
        robloxUsername: username,
      });
      setMessage('✅ Roblox account connected!');
      localStorage.setItem('User', JSON.stringify(res.data.user));
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to connect Roblox');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center text-white px-4">
      <div className="bg-[#283335] backdrop-blur-md p-8 rounded-2xl border border-white/20 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Link Roblox Account</h1>
        <input
          type="text"
          placeholder="Roblox Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 mb-4 rounded bg-[#283335] border border-white/20 text-white"
        />
        <button
          onClick={handleConnect}
          className="w-full py-2 bg-red-600 hover:bg-red-700 rounded font-semibold"
          disabled={!userId}
        >
          Connect
        </button>
        {message && <p className="mt-4 text-center text-white/80">{message}</p>}
      </div>
    </main>
  );
}
