'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [disconnectService, setDisconnectService] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (text) => {
    setToast(text);
    setTimeout(() => setToast(null), 2200);
  };

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
  }, []);

  const handleDiscordConnect = () => {
    const localUser = JSON.parse(localStorage.getItem('User'));
    const userId = localUser?._id;
    const scopes = encodeURIComponent('identify');
    const redirect = encodeURIComponent('https://yapton.flatstudios.net/api/user/discord/callback');

    window.location.href =
      `https://discord.com/oauth2/authorize?client_id=874668646616694824` +
      `&redirect_uri=${redirect}&response_type=code&scope=${scopes}&state=${userId}`;
  };

  const handleRobloxConnect = () => {
    const localUser = JSON.parse(localStorage.getItem('User'));
    const userId = localUser?._id;
    const redirectUri = encodeURIComponent(`https://yapton.flatstudios.net/api/user/roblox/callback`);

    window.location.href =
      `https://apis.roblox.com/oauth/v1/authorize?client_id=3955231950419357724` +
      `&response_type=code&redirect_uri=${redirectUri}` +
      `&scope=openid+profile+group:read&state=${userId}` +
      `&nonce=R7KqddEXQHMXfizjoDADm66PrIWdPis0fCphXd205aU`;
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
      setEditMode(false);
      showToast("Profile updated");
    } catch (err) {
      console.error('Update failed:', err);
      showToast("Update failed");
    }
  };

  const handleSetDefaultAvatar = async (avatarUrl) => {
    const localUser = JSON.parse(localStorage.getItem('User'));
    const userId = localUser?._id;

    try {
      const res = await axios.put(`/api/user/me?id=${userId}&status=avatar`, {
        defaultAvatar: avatarUrl,
      });

      setUser(res.data.user);
      localStorage.setItem("User", JSON.stringify(res.data.user));

      showToast("Default avatar set");
    } catch (err) {
      showToast("Avatar update failed");
    }
  };

  const disconnectServiceFromAPI = async (service) => {
    try {
      const localUser = JSON.parse(localStorage.getItem("User"));
      const userId = localUser._id;

      const endpoint =
        service === "Discord"
          ? `disconnectDiscord`
          : `disconnectRoblox`;

      const res = await axios.put(`/api/user/me?id=${userId}&status=${endpoint}`);

      setUser(res.data.user);
      localStorage.setItem("User", JSON.stringify(res.data.user));
      showToast(`${service} disconnected`);
    } catch (err) {
      showToast("Failed to disconnect");
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
      showToast("Password updated");
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordStatus('❌ Failed to reset password.');
      showToast("Password update failed");
    }
  };

  if (!user) {
    return <div className="text-white text-center py-12">Loading profile...</div>;
  }

  return (
    <main className="text-white py-10 px-4 md:px-8 flex justify-center relative">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -25 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 bg-[#1e2a2d] border border-white/20 px-5 py-2 rounded-xl shadow-xl z-50"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="w-full max-w-6xl flex flex-col gap-10">

        <div className="bg-[#283335]/70 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-xl flex flex-col lg:flex-row items-center gap-8">

          <Image
            src={user.defaultAvatar || '/black_logo.png'}
            width={128}
            height={128}
            className="rounded-full border border-white/20 shadow-lg"
            alt="Avatar"
          />

          <div className="flex-1 flex flex-col gap-3">

            <div className="flex justify-between items-start w-full">
              <div>
                <h1 className="text-3xl font-bold">{user.username}</h1>
                <p className="text-white/70">
                  Joined {new Date(user.createdAt).toLocaleDateString('en-UK')}
                </p>

                <p className="text-white/80 mt-1">
                  <span className="font-semibold">Role:</span> {user.role}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">

                {!editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleProfileSave}
                      className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditedUser(user);
                        setEditMode(false);
                      }}
                      className="bg-gray-600 px-4 py-2 rounded-lg hover:bg-gray-700 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="text-red-300 hover:text-red-400 text-sm"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
          <div className="bg-[#283335]/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl flex flex-col gap-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              Account Information
            </h2>

            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm text-white/60">Username</p>
                {!editMode ? (
                  <p className="text-white">{user.username}</p>
                ) : (
                  <input
                    type="text"
                    value={editedUser.username || ''}
                    onChange={(e) =>
                      setEditedUser({ ...editedUser, username: e.target.value })
                    }
                    className="w-full mt-1 bg-[#1f2a2e] px-3 py-2 rounded border border-white/20 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              <div>
                <p className="text-sm text-white/60">Email</p>
                {!editMode ? (
                  <p className="text-white">{user.email}</p>
                ) : (
                  <input
                    type="text"
                    value={editedUser.email || ''}
                    onChange={(e) =>
                      setEditedUser({ ...editedUser, email: e.target.value })
                    }
                    className="w-full mt-1 bg-[#1f2a2e] px-3 py-2 rounded border border-white/20 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              <div>
                <p className="text-sm text-white/60">Roblox ID</p>
                <p className="text-white">{user.robloxId || "Not linked"}</p>
              </div>

              <div>
                <p className="text-sm text-white/60">Discord ID</p>
                <p className="text-white">{user.discordId || "Not linked"}</p>
              </div>

              <div>
                <p className="text-sm text-white/60">Newsletter</p>

                {!editMode ? (
                  <p className="text-white">
                    {user.newsletter ? "Subscribed" : "Not subscribed"}
                  </p>
                ) : (
                  <label className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      checked={editedUser.newsletter}
                      onChange={(e) =>
                        setEditedUser({ ...editedUser, newsletter: e.target.checked })
                      }
                      className="accent-blue-600 w-5 h-5"
                    />
                    <span className="text-white">
                      {editedUser.newsletter ? "Subscribed" : "Not subscribed"}
                    </span>
                  </label>
                )}
              </div>

            </div>
          </div>

          <div className="bg-[#283335]/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl">

            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              Change Password
            </h2>

            <div className="flex flex-col gap-4">

              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-[#1f2a2e] px-4 py-2 rounded border border-white/20 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-[#1f2a2e] px-4 py-2 rounded border border-white/20 outline-none focus:ring-2 focus:ring-blue-500"
              />

              {passwordStatus && (
                <p className="text-yellow-300 text-sm">{passwordStatus}</p>
              )}

              <button
                onClick={handlePasswordReset}
                className="bg-blue-600 hover:bg-blue-700 transition w-full py-2 rounded text-white font-medium"
              >
                Update Password
              </button>

            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            {
              name: 'Discord',
              avatar: user.discordAvatar || '/black_logo.png',
              username: user.discordUsername || 'Discord',
              id: user.discordId,
              onConnect: handleDiscordConnect,
              isDefault: user.defaultAvatar === user.discordAvatar,
              onDefault: () => handleSetDefaultAvatar(user.discordAvatar)
            },
            {
              name: 'Roblox',
              avatar: user.robloxAvatar || '/black_logo.png',
              username: user.robloxUsername || 'Roblox',
              id: user.robloxId,
              onConnect: handleRobloxConnect,
              isDefault: user.defaultAvatar === user.robloxAvatar,
              onDefault: () => handleSetDefaultAvatar(user.robloxAvatar)
            },
          ].map((svc, i) => (
            <AnimatePresence key={i}>
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#283335]/60 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-xl flex gap-4 items-center"
              >
                <Image
                  src={svc.avatar}
                  width={60}
                  height={60}
                  className="rounded-full border border-white/20"
                  alt={`${svc.name} Avatar`}
                />

                <div className="flex flex-col flex-1 min-w-0">
                  <p className="font-semibold truncate">{svc.username}</p>
                  <p className="text-white/60 text-sm truncate">{svc.id || "Not connected"}</p>

                  <button
                    onClick={svc.onConnect}
                    className="mt-3 bg-blue-600 px-4 py-1 rounded hover:bg-blue-700 w-fit"
                  >
                    {svc.id ? "Reconnect" : "Connect"}
                  </button>

                  <button
                    onClick={svc.onDefault}
                    disabled={svc.isDefault || !svc.id}
                    className={`mt-2 px-4 py-1 rounded border border-white/30 w-fit ${svc.isDefault ? "bg-green-600" : "hover:bg-white/10"
                      }`}
                  >
                    {svc.isDefault ? "✔ Default Avatar" : "Set as Default"}
                  </button>

                  {svc.id && (
                    <button
                      onClick={() => setDisconnectService(svc.name)}
                      className="mt-3 bg-red-600/60 hover:bg-red-700 px-4 py-1 rounded text-sm w-fit transition"
                    >
                      Remove Connection
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {disconnectService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-[#1e2a2d] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-xl font-bold mb-2">Remove {disconnectService} Connection</h2>
              <p className="text-white/70 text-sm mb-6">
                Are you sure you want to disconnect your {disconnectService} account?
              </p>

              <div className="flex gap-4">
                <button
                  onClick={async () => {
                    const service = disconnectService;
                    setDisconnectService(null);
                    await disconnectServiceFromAPI(service);
                  }}
                  className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg flex-1"
                >
                  Confirm
                </button>

                <button
                  onClick={() => setDisconnectService(null)}
                  className="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded-lg flex-1"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-[#1e2a2d] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-xl"
            >
              <h2 className="text-xl font-bold text-white mb-2">Delete Account</h2>
              <p className="text-white/70 text-sm mb-4">
                This action is permanent.
                Type <span className="font-semibold text-red-400">{user.username}</span> to confirm.
              </p>

              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                className="w-full bg-[#283335] border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 outline-none"
              />

              <button
                disabled={deleteInput !== user.username || deleteLoading}
                onClick={async () => {
                  setDeleteLoading(true);

                  try {
                    await axios.delete(`/api/user/delete?id=${user._id}`);
                    localStorage.removeItem("User");
                    window.location.href = '/';
                  } catch {
                    showToast("Delete failed");
                  }

                  setDeleteLoading(false);
                }}
                className={`w-full mt-4 py-2 rounded-lg font-semibold transition ${deleteInput === user.username
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-red-900/40 cursor-not-allowed"
                  }`}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
