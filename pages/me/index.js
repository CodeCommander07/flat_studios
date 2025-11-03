'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');

  useEffect(() => {
    const localUser = JSON.parse(localStorage.getItem('User'));
    if (!localUser?._id) return;

    axios
      .get(`/api/user/me?id=${localUser._id}`)
      .then((res) => {
        setUser(res.data);
        setEditedUser(res.data);
      })
      .catch((err) => console.error('Failed to fetch user:', err.message));
  }, []);

  const handleDiscordConnect = () => {
    const localUser = JSON.parse(localStorage.getItem('User'));
    const userId = localUser?._id;

    const scopes = encodeURIComponent('identify');

    window.location.href = `https://discord.com/oauth2/authorize?client_id=874668646616694824&redirect_uri=http://localhost:3000/api/user/discord/callback&response_type=code&scope=${scopes}&state=${userId}`;
  };

const handleRobloxConnect = () => {
  const localUser = JSON.parse(localStorage.getItem('User'));
  const userId = localUser?._id;
  const base = process.env.BASE_URL; // Make sure you define NEXT_PUBLIC_BASE_URL in .env.local

  // URL-encode redirect_uri
  const redirectUri = encodeURIComponent(`${base}/api/user/roblox/callback`);

  const url = `https://authorize.roblox.com/?client_id=4368704140483715858` +
    `&response_type=code` +
    `&redirect_uri=${redirectUri}` +
    `&scope=openid+profile+group:read` +
    `&state=${userId}` +  // dynamically passing userId as state
    `&nonce=R7KqddEXQHMXfizjoDADm66PrIWdPis0fCphXd205aU`;

  window.location.href = url;
};



  const handleProfileSave = async () => {
    const localUser = JSON.parse(localStorage.getItem('User'));
    const userId = localUser?._id;
    try {
      const res = await axios.put(`/api/user/me?id=${userId}&status=edit`, {
        ...editedUser,
      });
      setUser(res.data.user); // assuming API returns updated user in `user` field
      setEditMode(false);
    } catch (err) {
      console.error('Update failed:', err);
    }
  };
  const handleSetDefaultAvatar = async (avatarUrl) => {
    const localUser = JSON.parse(localStorage.getItem('User'));
    const userId = localUser?._id;

    try {
      const res = await axios.put(`/api/user/me?id=${userId}&status=avatar`, {
        defaultAvatar: avatarUrl,
      });
      setUser((prev) => ({ ...prev, defaultAvatar: avatarUrl }));
    } catch (err) {
      console.error('Failed to set default avatar:', err);
    }
  };


  const handlePasswordReset = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordStatus('❌ Passwords do not match.');
      return;
    }

    try {
      await axios.post('/api/auth/passwordResUser', {
        id: user._id,
        newPassword,
      });
      setPasswordStatus('✅ Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setPasswordStatus('❌ Failed to reset password.');
    }
  };

  if (!user) {
    return <div className="text-white text-center py-12">Loading profile...</div>;
  }

  return (
    <main className="text-white py-12 flex justify-center">
      <div className="w-full max-w-7xl flex flex-col gap-8">
        {/* Top section: Profile and Password Reset side by side */}
        <div className="flex gap-8">
          {/* User Profile Box */}
          <div className="flex-1 grid grid-cols-2 gap-6 bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center col-span-2 mb-4">
              <h2 className="text-2xl font-bold">User Profile</h2>
              {!editMode ? (
                <button
                  className="text-sm bg-blue-600 px-4 py-1 rounded hover:bg-blue-700"
                  onClick={() => setEditMode(true)}
                >
                  Edit
                </button>
              ) : (
                <div className="space-x-2">
                  <button
                    onClick={handleProfileSave}
                    className="bg-green-600 px-4 py-1 rounded hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditedUser(user);
                      setEditMode(false);
                    }}
                    className="bg-gray-600 px-4 py-1 rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {['username', 'email'].map((field) => (
              <div key={field} className="text-white/90">
                <span className="font-semibold capitalize">{field}:</span>{' '}
                {!editMode ? (
                  user[field]
                ) : (
                  <input
                    type="text"
                    value={editedUser[field] || ''}
                    onChange={(e) =>
                      setEditedUser({ ...editedUser, [field]: e.target.value })
                    }
                    className="bg-white/10 px-2 py-1 rounded border border-white/30 text-white w-full mt-1"
                  />
                )}
              </div>
            ))}
            <div className="text-white/90">
              <span className="font-semibold">Roblox ID:</span>{' '}
              {user.robloxId || 'Not linked'}
            </div>
            <div className="text-white/90">
              <span className="font-semibold">Discord ID:</span>{' '}
              {user.discordId || 'Not linked'}
            </div>
            <div className="text-white/90">
              <span className="font-semibold">Joined:</span>{' '}
              {new Date(user.createdAt).toLocaleDateString('en-UK')}
            </div>
            <div className="text-white/90">
              <span className="font-semibold">Newsletter:</span>{' '}
              {!editMode ? (
                user.newsletter ? 'Subscribed' : 'Not Subscribed'
              ) : (
                <label className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    checked={editedUser.newsletter || false}
                    onChange={(e) =>
                      setEditedUser({ ...editedUser, newsletter: e.target.checked })
                    }
                    className="accent-blue-600 w-4 h-4"
                  />
                  <span className="text-sm text-white/80">Subscribed</span>
                </label>
              )}
            </div>
          </div>

          {/* Password Reset Section */}
          <div className="flex-1 bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">🔐 Update Password</h2>
            <div className="flex flex-col gap-4 mb-4">
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-white/10 px-4 py-2 rounded border border-white/30 text-white"
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-white/10 px-4 py-2 rounded border border-white/30 text-white"
              />
            </div>
            <button
              onClick={handlePasswordReset}
              className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 w-full"
            >
              Update Password
            </button>
            {passwordStatus && (
              <p className="text-sm text-yellow-300 mt-2">{passwordStatus}</p>
            )}
          </div>
        </div>

        {/* Bottom section: Connection Boxes horizontally */}
        {/* Bottom section: Connection Boxes horizontally */}
        <div className="flex gap-6">
          {/* Discord */}
          <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl p-4 shadow-xl flex items-center flex-1 hover:bg-white/20 transition">
            <Image
              src={user.discordAvatar || '/0.png'}
              alt="Discord Avatar"
              width={48}
              height={48}
              className="rounded-full"
            />
            <div className="ml-4 flex flex-col justify-center flex-1 min-w-0">
              <p className="text-white font-semibold truncate">{user.discordUsername || 'Not connected'}</p>
              <p className="text-white/70 text-sm truncate">{user.discordId || ''}</p>
              <button
                onClick={handleDiscordConnect}
                className="mt-2 self-start bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
              >
                {user.discordId ? 'Reconnect' : 'Connect'}

              </button>
              <button
                onClick={() => handleSetDefaultAvatar(user.discordAvatar)}
                disabled={user.defaultAvatar === user.discordAvatar}

                className="mt-2 self-start bg-white/10 border border-white/30 text-white px-3 py-1 rounded text-sm hover:bg-white/20 transition"
              >
                {user.defaultAvatar === user.discordAvatar ? '✔️ Default Avatar' : 'Set as Default'}
              </button>

            </div>
          </div>

          {/* Roblox */}
          <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl p-4 shadow-xl flex items-center flex-1 hover:bg-white/20 transition">
            <Image
              src={user.robloxAvatar || '/roblox.png'}
              alt="Roblox Avatar"
              width={48}
              height={48}
              className="rounded-full"
            />
            <div className="ml-4 flex flex-col justify-center flex-1 min-w-0">
              <p className="text-white font-semibold truncate">{user.robloxUsername || 'Not connected'}</p>
              <p className="text-white/70 text-sm truncate">{user.robloxId || ''}</p>
              <button
                onClick={handleRobloxConnect}
                className="mt-2 self-start bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
              >
                {user.robloxId ? 'Reconnect' : 'Connect'}

              </button>
              <button
                onClick={() => handleSetDefaultAvatar(user.robloxAvatar)}
                disabled={user.defaultAvatar === user.discordAvatar}

                className="mt-2 self-start bg-white/10 border border-white/30 text-white px-3 py-1 rounded text-sm hover:bg-white/20 transition"
              >
                {user.defaultAvatar === user.robloxAvatar ? '✔️ Default Avatar' : 'Set as Default'}
              </button>

            </div>
          </div>

          {/* Third Service */}
          <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl p-4 shadow-xl flex items-center flex-1 hover:bg-white/20 transition">
            <Image
              src="/colour_logo.png"
              alt="Third Service Avatar"
              width={48}
              height={48}
              className="rounded-full"
            />
            <div className="ml-4 flex flex-col justify-center flex-1 min-w-0">
              <p className="text-white font-semibold truncate">Third Service</p>
              <p className="text-white/70 text-sm truncate">Not connected</p>
              <button
                className="mt-2 self-start bg-gray-600 text-white px-3 py-1 rounded text-sm cursor-not-allowed opacity-50"
                disabled
              >
                Connect
              </button>
              <button
                onClick={() => handleSetDefaultAvatar('/colour_logo.png')}
                disabled={user.defaultAvatar === user.discordAvatar}
                className="mt-2 self-start bg-white/10 border border-white/30 text-white px-3 py-1 rounded text-sm hover:bg-white/20 transition"
              >
                {user.defaultAvatar === '/colour_logo.png' ? '✔️ Default Avatar' : 'Set as Default'}
              </button>

            </div>
          </div>
        </div>
        {/* End of Connection Boxes */}
        {/* Bottom section: User Metadata */}
        <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4">User Metadata</h2>
          <p className="text-white/90">
            <span className="font-semibold">Role:</span> {user.role}
          </p>
          <p className="text-white/90">
            <span className="font-semibold">Total Shifts Hosted:</span> 0
          </p>
          <p className="text-white/90">
            <span className="font-semibold">Total Time In Game:</span> 0
          </p>
        </div>


      </div>
    </main>
  );
}
