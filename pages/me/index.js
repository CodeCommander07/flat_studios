'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';

export default function ProfilePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const localUser = JSON.parse(localStorage.getItem('User'));
    if (!localUser?._id) return;

    axios
      .get(`/api/user/me?id=${localUser._id}`)
      .then((res) => setUser(res.data))
      .catch((err) => console.error('Failed to fetch user:', err.message));
  }, []);

  const handleDiscordConnect = () => {
  const user = JSON.parse(localStorage.getItem('User'));
  const userId = user?._id;

  const DISCORD_CLIENT_ID = DISCORD_CLIENT_ID
  const REDIRECT_URI = DISCORD_REDIRECT_URI
  const scopes = encodeURIComponent('identify');

  // Redirect to Discord OAuth
  window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scopes}&state=${userId}`;
};

  if (!user) {
    return <div className="text-white text-center py-12">Loading profile...</div>;
  }

  return (
    <main className=" text-white py-12 flex justify-center">
      <div className="w-full max-w-6xl space-y-6">

        {/* Large User Info Box */}
        <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4">User Profile</h2>
          <div className="space-y-4 text-white/90">
            <div><span className="font-semibold">Username:</span> {user.username}</div>
            <div><span className="font-semibold">Email:</span> {user.email}</div>
            <div><span className="font-semibold">Role:</span> {user.role}</div>
            <div><span className="font-semibold">Roblox ID:</span> {user.robloxId || 'Not linked'}</div>
            <div><span className="font-semibold">Discord ID:</span> {user.discordId || 'Not linked'}</div>
            <div><span className="font-semibold">Joined:</span> {new Date(user.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Row of 2 medium boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Discord Box */}
          <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl p-6 shadow-xl flex flex-col items-center text-center">
            <h2 className="text-xl font-bold mb-3">Discord</h2>
            <Image
              src={user.discordAvatar || '/0.png'}
              alt="Discord Avatar"
              width={64}
              height={64}
              className="rounded-full mb-2"
            />
            <p className="text-white/80">{user.discordTag || 'Not connected'}</p>
            <button onClick={handleDiscordConnect} className="bg-blue-600 text-white px-4 py-2 rounded">
  Connect Discord
</button>
          </div>

          {/* Roblox Box */}
          <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl p-6 shadow-xl flex flex-col items-center text-center">
            <h2 className="text-xl font-bold mb-3">Roblox</h2>
            <Image
              src={user.robloxAvatar || '/roblox.png'}
              alt="Roblox Avatar"
              width={64}
              height={64}
              className="rounded-full mb-2"
            />
            <p className="text-white/80">{user.robloxUsername || 'Not connected'}</p>
            <a
              href="/me/roblox"
              className="mt-4 px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition text-sm"
            >
              {user.robloxId ? 'Reconnect' : 'Connect'}
            </a>
          </div>

        </div>
      </div>
    </main>
  );
}
