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
  const [statusMessage, setStatusMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const localUser = JSON.parse(localStorage.getItem('User'));
    if (!localUser?._id) return;

    const fetchUser = async () => {
      try {
        const res = await axios.get(`/api/user/me?id=${localUser._id}`);
        setUser(res.data);
        setEditedUser(res.data);
        localStorage.setItem('User', JSON.stringify(res.data));
      } catch (err) {
        console.error('Failed to fetch user:', err.message);
      }
    };

    fetchUser();

    // 🔹 Handle newsletter unsubscribe link: /me?newsletter=false
    const params = new URLSearchParams(window.location.search);
    if (params.has("newsletter")) {
      const value = params.get("newsletter") === "true";

      axios.put(`/api/user/me?id=${localUser._id}&status=edit`, {
        newsletter: value
      })
        .then(() => fetchUser())
        .finally(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    }

    // Detect OAuth params
    const hasOAuthParams =
      params.has('code') || params.has('state') || params.has('refresh');

    if (hasOAuthParams) {
      fetchUser();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);


  const handleDiscordConnect = () => {
    const localUser = JSON.parse(localStorage.getItem('User'));
    const userId = localUser?._id;
    const scopes = encodeURIComponent('identify');
    const redirect = encodeURIComponent('https://yapton.flatstudios.net/api/user/discord/callback');

    window.location.href = `https://discord.com/oauth2/authorize?client_id=874668646616694824&redirect_uri=${redirect}&response_type=code&scope=${scopes}&state=${userId}`;
  };

  const handleRobloxConnect = () => {
    const localUser = JSON.parse(localStorage.getItem('User'));
    const userId = localUser?._id;
    const base = process.env.BASE_URL;
    const redirectUri = encodeURIComponent(`https://yapton.flatstudios.net/api/user/roblox/callback`);
    const url = `https://authorize.roblox.com/?client_id=3955231950419357724` +
      `&response_type=code` +
      `&redirect_uri=${redirectUri}` +
      `&scope=openid+profile+group:read` +
      `&state=${userId}` +
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
      setUser(res.data.user);
      setEditedUser(res.data.user);
      localStorage.setItem('User', JSON.stringify(res.data.user));
      setEditMode(false)
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleSetDefaultAvatar = async (avatarUrl) => {
    const localUser = JSON.parse(localStorage.getItem('User'));
    const userId = localUser?._id;
    try {
      await axios.put(`/api/user/me?id=${userId}&status=avatar`, {
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
    <main className="text-white py-8 px-4 md:px-8 flex justify-center">
      <div className="w-full max-w-7xl flex flex-col gap-8">

        {/* 🔹 Top Section - Stack on mobile, side by side on desktop */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* User Profile Box */}
          <div className="flex-1 bg-[#283335] border border-white/20 backdrop-blur-md rounded-2xl p-6 shadow-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2 flex justify-between items-center mb-2">
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
              <div key={field}>
                <p className="font-semibold">{field}</p>
                {!editMode ? (
                  <p className="text-white/90">{user[field]}</p>
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

            <div><span className="font-semibold">Roblox ID:</span> {user.robloxId || 'Not linked'}</div>
            <div><span className="font-semibold">Discord ID:</span> {user.discordId || 'Not linked'}</div>
            <div><span className="font-semibold">Joined:</span> {new Date(user.createdAt).toLocaleDateString('en-UK')}</div>
            <div>
              <span className="font-semibold">Newsletter:</span>{' '}
              {!editMode ? (
                user.newsletter ? "Subscribed" : "Not Subscribed"
              ) : (
                <label className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    checked={editedUser.newsletter}
                    onChange={(e) =>
                      setEditedUser({ ...editedUser, newsletter: e.target.checked })
                    }
                    className="accent-blue-600 w-4 h-4"
                  />
                  <span className="text-sm text-white/80">
                    {editedUser.newsletter ? "Subscribed" : "Not Subscribed"}
                  </span>
                </label>
              )}
            </div>

          </div>

          {/* Password Reset */}
          <div className="flex-1 bg-[#283335] border border-white/20 backdrop-blur-md rounded-2xl p-6 shadow-xl">
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

        {/* 🔹 Connection Boxes — stack on mobile, 3-column grid on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              name: 'Discord',
              avatar: user.discordAvatar || '/black_logo.png',
              username: user.discordUsername || 'Discord',
              id: user.discordId,
              onConnect: handleDiscordConnect,
              onDefault: () => handleSetDefaultAvatar(user.discordAvatar),
              isDefault: user.defaultAvatar === user.discordAvatar,
            },
            {
              name: 'Roblox',
              avatar: user.robloxAvatar || '/black_logo.png',
              username: user.robloxUsername || 'Roblox',
              id: user.robloxId,
              onConnect: handleRobloxConnect,
              onDefault: () => handleSetDefaultAvatar(user.robloxAvatar),
              isDefault: user.defaultAvatar === user.robloxAvatar,
            },
            {
              name: 'Google',
              avatar: '/black_logo.png',
              username: 'Google (Not Setup)',
              id: 'Not connected',
              disabled: true,
              onDefault: () => handleSetDefaultAvatar('/black_logo.png'),
              isDefault: user.defaultAvatar === '/black_logo.png',
            },
          ].map((svc, i) => (
            <div
              key={i}
              className="bg-[#283335] border border-white/20 backdrop-blur-md rounded-2xl p-4 shadow-xl flex items-center hover:bg-[#283335]/80 transition"
            >
              <Image
                src={svc.avatar}
                alt={`${svc.name} Avatar`}
                width={48}
                height={48}
                className="rounded-full flex-shrink-0"
              />
              <div className="ml-4 flex flex-col justify-center flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{svc.username}</p>
                <p className="text-white/70 text-sm truncate">{svc.id}</p>
                {!svc.disabled && (
                  <button
                    onClick={svc.onConnect}
                    className="mt-2 self-start bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
                  >
                    {svc.id ? 'Reconnect' : 'Connect'}
                  </button>
                )}
                <button
                  onClick={svc.onDefault}
                  disabled={svc.isDefault}
                  className={`mt-2 self-start px-3 py-1 rounded text-sm border border-white/30 transition ${svc.isDefault
                    ? 'bg-green-600 text-white'
                    : 'bg-[#283335]/10 hover:bg-white/20 text-white'
                    }`}
                >
                  {svc.isDefault ? '✔️ Default Avatar' : 'Set as Default'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 🔹 Metadata Section */}
        <div className="bg-[#283335] border border-white/20 backdrop-blur-md rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold">User Metadata</h2>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-red-300 hover:text-red-400 font-semibold"
            >
              Delete Account
            </button>
          </div>

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
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-[#1e2a2d] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl relative animate-[fadeIn_0.25s_ease]">

            <h2 className="text-xl font-bold text-white mb-2">Delete Account</h2>
            <p className="text-white/70 text-sm mb-4">
              This action is permanent and cannot be undone.
              To confirm, type <span className="font-semibold text-red-400">{user.username}</span> below.
            </p>

            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={`Type "${user.username}"`}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:ring-2 focus:ring-red-400 outline-none"
            />

            <button
              className={`w-full mt-4 py-2 rounded-lg font-semibold transition
          ${deleteInput === user.username
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-red-900/40 cursor-not-allowed'
                }`}
              disabled={deleteInput !== user.username || deleteLoading}
              onClick={async () => {
                setDeleteLoading(true);

                try {
                  await axios.delete(`/api/user/delete?id=${user._id}`);
                  localStorage.removeItem("User");
                  window.location.href = '/';
                } catch (err) {
                  console.error(err);
                  alert('Failed to delete account.');
                } finally {
                  setDeleteLoading(false);
                }
              }}
            >
              {deleteLoading ? "Deleting…" : "Confirm Delete"}
            </button>

            <button
              className="mt-3 w-full text-center text-white/50 text-sm hover:text-white"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteInput('');
              }}
            >
              Cancel
            </button>

          </div>
        </div>
      )}

    </main>
  );
}
