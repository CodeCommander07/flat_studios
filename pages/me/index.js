'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import {
  Bell,
  CheckCircle,
  XCircle,
  Mail,
  Smartphone,
  ShieldAlert,
  Wrench,
  Megaphone,
} from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState(null);

  // editing / account
  const [editMode, setEditMode] = useState(false);
  const [editedUser, setEditedUser] = useState({});

  // password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');

  // modals / ui
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [disconnectService, setDisconnectService] = useState(null);
  const [toast, setToast] = useState(null);

  // tabs
  const [activeTab, setActiveTab] = useState('account');

  // notifications
  const [notifications, setNotifications] = useState([]);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const visibleNotifications = useMemo(() => {
    return showUnreadOnly ? notifications.filter((n) => !n.read) : notifications;
  }, [notifications, showUnreadOnly]);

  const groupedNotifications = useMemo(() => {
    const today = [];
    const earlier = [];

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    visibleNotifications.forEach((n) => {
      const created = new Date(n.createdAt);
      if (created >= startOfToday) today.push(n);
      else earlier.push(n);
    });

    return { today, earlier };
  }, [visibleNotifications]);

  // notification preferences
  const [prefs, setPrefs] = useState({
    email: true,
    push: false,
    taskUpdates: true,
    systemAlerts: true,
    marketing: false,
  });
  const [prefsSaving, setPrefsSaving] = useState(false);

  const searchParams = useSearchParams();

  const showToastFn = (text) => {
    setToast(text);
    setTimeout(() => setToast(null), 2200);
  };

  const unreadCount = useMemo(
    () => (notifications || []).filter((n) => !n.read).length,
    [notifications]
  );

  const TABS = useMemo(
    () => [
      { id: 'account', label: 'Account' },
      { id: 'stats', label: 'Stats' },
      { id: 'presence', label: 'Presence & Subscriptions' },
      { id: 'notifications', label: 'Notifications' },
    ],
    []
  );

  useEffect(() => {
    const saved = localStorage.getItem('profileTab');
    if (saved) setActiveTab(saved);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key.toLowerCase() === 'r' && unreadCount > 0) {
        e.preventDefault();
        markAllNotifsRead();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [unreadCount]);

  // ✅ NEW: set active tab from query (?account / ?connections / ?notifications)
  useEffect(() => {
    if (searchParams.has('account')) setActiveTab('account');
    else if (searchParams.has('stats')) setActiveTab('stats');
    else if (searchParams.has('notifications')) setActiveTab('notifications');
    else if (searchParams.has('presence')) setActiveTab('presence');
  }, [searchParams]);

  // ---- load user + handle ?subscribe / ?unsubscribe ----
  useEffect(() => {
    const localUser = JSON.parse(localStorage.getItem('User') || '{}');
    if (!localUser?._id) return;

    const doWork = async () => {
      try {
        // 1) fetch user
        const res = await axios.get(`/api/user/me?id=${localUser._id}`);
        setUser(res.data);
        setEditedUser(res.data);
        localStorage.setItem('User', JSON.stringify(res.data));

        // hydrate preferences from user if present
        const serverPrefs = res.data?.notificationPrefs;
        if (serverPrefs && typeof serverPrefs === 'object') {
          setPrefs((p) => ({
            ...p,
            ...serverPrefs,
          }));
        }

        // 2) handle newsletter query actions
        const subscribe = searchParams.get('subscribe');
        const unsubscribe = searchParams.get('unsubscribe');

        if (subscribe !== null || unsubscribe !== null) {
          const newsletter = subscribe !== null;

          await axios.put(`/api/user/me?id=${localUser._id}&status=edit`, {
            newsletter,
          });

          const updated = await axios.get(`/api/user/me?id=${localUser._id}`);
          setUser(updated.data);
          setEditedUser(updated.data);
          localStorage.setItem('User', JSON.stringify(updated.data));

          showToastFn(
            newsletter
              ? 'Subscribed to newsletter'
              : 'Unsubscribed from newsletter'
          );

          // clean URL
          window.history.replaceState({}, '', '/me');
        }

        // 3) fetch notifications for badge
        setNotifsLoading(true);
        try {
          const nres = await axios.get(
            `/api/user/notifications?userId=${localUser._id}`
          );
          setNotifications(nres.data || []);
        } finally {
          setNotifsLoading(false);
        }
      } catch (err) {
        console.error(err);
        showToastFn('Failed to load profile');
      }
    };

    doWork();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ---- actions ----
  const handleDiscordConnect = () => {
    const localUser = JSON.parse(localStorage.getItem('User') || '{}');
    const userId = localUser?._id;
    const scopes = encodeURIComponent('identify');
    const redirect = encodeURIComponent(
      'https://yapton.flatstudios.net/api/user/discord/callback'
    );

    window.location.href =
      `https://discord.com/oauth2/authorize?client_id=874668646616694824` +
      `&redirect_uri=${redirect}&response_type=code&scope=${scopes}&state=${userId}`;
  };

  const handleRobloxConnect = () => {
    const localUser = JSON.parse(localStorage.getItem('User') || '{}');
    const userId = localUser?._id;
    const redirectUri = encodeURIComponent(
      `https://yapton.flatstudios.net/api/user/roblox/callback`
    );

    window.location.href =
      `https://apis.roblox.com/oauth/v1/authorize?client_id=3955231950419357724` +
      `&response_type=code&redirect_uri=${redirectUri}` +
      `&scope=openid+profile+group:read&state=${userId}` +
      `&nonce=R7KqddEXQHMXfizjoDADm66PrIWdPis0fCphXd205aU`;
  };

  const handleProfileSave = async () => {
    const localUser = JSON.parse(localStorage.getItem('User') || '{}');
    const userId = localUser?._id;

    try {
      const res = await axios.put(`/api/user/me?id=${userId}&status=edit`, {
        ...editedUser,
      });

      setUser(res.data.user);
      setEditedUser(res.data.user);
      localStorage.setItem('User', JSON.stringify(res.data.user));
      setEditMode(false);
      showToastFn('Profile updated');
    } catch (err) {
      console.error('Update failed:', err);
      showToastFn('Update failed');
    }
  };

  const handleSetDefaultAvatar = async (avatarUrl) => {
    const localUser = JSON.parse(localStorage.getItem('User') || '{}');
    const userId = localUser?._id;

    try {
      const res = await axios.put(`/api/user/me?id=${userId}&status=avatar`, {
        defaultAvatar: avatarUrl,
      });

      setUser(res.data.user);
      localStorage.setItem('User', JSON.stringify(res.data.user));
      showToastFn('Default avatar set');
    } catch {
      showToastFn('Avatar update failed');
    }
  };

  const disconnectServiceFromAPI = async (service) => {
    try {
      const localUser = JSON.parse(localStorage.getItem('User') || '{}');
      const userId = localUser._id;

      const endpoint =
        service === 'Discord' ? 'disconnectDiscord' : 'disconnectRoblox';

      const res = await axios.put(`/api/user/me?id=${userId}&status=${endpoint}`);

      setUser(res.data.user);
      localStorage.setItem('User', JSON.stringify(res.data.user));
      showToastFn(`${service} disconnected`);
    } catch {
      showToastFn('Failed to disconnect');
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
      showToastFn('Password updated');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordStatus('❌ Failed to reset password.');
      showToastFn('Password update failed');
    }
  };

  const markNotifRead = async (notifId) => {
    try {
      const localUser = JSON.parse(localStorage.getItem('User') || '{}');
      await axios.patch(`/api/user/notifications/?userId=${localUser._id}`, {
        notifId,
      });

      setNotifications((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read:', err?.message || err);
      showToastFn('Failed to mark read');
    }
  };

  // ✅ NEW: mark all notifications read
  const markAllNotifsRead = async () => {
    try {
      const localUser = JSON.parse(localStorage.getItem('User') || '{}');
      if (!localUser?._id) return;

      await axios.patch(`/api/user/notifications?userId=${localUser._id}`, {
        markAll: true,
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

      showToastFn('All notifications marked as read');
    } catch (err) {
      console.error('Mark all failed:', err);
      showToastFn('Failed to mark all notifications');
    }
  };

  const savePreferences = async (nextPrefs) => {
    const localUser = JSON.parse(localStorage.getItem('User') || '{}');
    const userId = localUser?._id;
    if (!userId) return;

    setPrefsSaving(true);
    try {
      const res = await axios.put(`/api/user/me?id=${userId}&status=edit`, {
        notificationPrefs: nextPrefs,
      });

      if (res?.data?.user) {
        setUser(res.data.user);
        setEditedUser(res.data.user);
        localStorage.setItem('User', JSON.stringify(res.data.user));
      }

      showToastFn('Notification preferences saved');
    } catch (err) {
      console.error('Prefs save failed:', err);
      showToastFn('Failed to save preferences');
    } finally {
      setPrefsSaving(false);
    }
  };

  const togglePref = async (key) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    await savePreferences(next);
  };

  if (!user) {
    return <div className="text-white text-center py-12">Loading profile...</div>;
  }

  return (
    <main className="text-white py-10 px-4 md:px-8 flex justify-center relative min-h-[calc(100vh-5rem)]">
      {/* Toast */}
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

      <div className="w-full max-w-full flex flex-col md:grid md:grid-cols-6 gap-8 md:h-[calc(100vh-7rem)]">
                {/* Header + Tabs (Top on mobile, Right sidebar on md+) */}
        <div
          className={`
            order-1 md:order-2
    col-span-1
    bg-[#283335] border border-white/10 rounded-2xl shadow-xl
    flex flex-col
    md:flex-col
    md:h-[calc(100vh-7rem)]
  `}
        >
          {/* ===== PROFILE HEADER ===== */}
          <div
            className={`
      p-6 flex flex-col items-center gap-4
      md:w-[280px]
      md:border-l md:border-white/10
      md:items-start
    `}
          >
            <Image
              src={user.defaultAvatar || '/black_logo.png'}
              width={96}
              height={96}
              className="rounded-full border border-white/20 shadow-lg"
              alt="Avatar"
            />

            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold">{user.username}</h1>
              <p className="text-white/60 text-sm">
                Joined {new Date(user.createdAt).toLocaleDateString('en-UK')}
              </p>
              <p className="text-white/80 text-sm mt-1">
                <span className="font-semibold">Role:</span> {user.role}
              </p>
            </div>

            {/* Edit / Save */}
            <div className="w-full flex flex-col gap-2 mt-2">
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 text-sm w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#283335]"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleProfileSave}
                    className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700 text-sm flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#283335]"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditedUser(user);
                      setEditMode(false);
                    }}
                    className="bg-gray-600 px-4 py-2 rounded-lg hover:bg-gray-700 text-sm flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#283335]"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowDeleteModal(true)}
                className="text-red-300 hover:text-red-400 text-xs mt-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#283335] rounded"
              >
                Delete Account
              </button>
            </div>
          </div>

          {/* ===== TABS ===== */}
          <div
            className={`
      flex md:flex-col
      border-t md:border-t-0 md:border-r
      border-white/10
    `}
            role="tablist"
          >
            {TABS.map((tab, index) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => {
                    setActiveTab(tab.id);
                    localStorage.setItem('profileTab', tab.id);
                    window.history.replaceState({}, '', `/me?${tab.id}`);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                      const next = TABS[index + 1]?.id;
                      if (next) setActiveTab(next);
                    }
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                      const prev = TABS[index - 1]?.id;
                      if (prev) setActiveTab(prev);
                    }
                  }}
                  className={`
            relative px-5 py-3 text-sm font-medium transition
            flex items-center gap-2
            ${isActive ? 'text-white' : 'text-white/55 hover:text-white'}
            focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
            focus-visible:ring-offset-2 focus-visible:ring-offset-[#283335]
          `}
                >
                  {tab.icon}
                  {tab.label}

                  {tab.id === 'notifications' && unreadCount > 0 && (
                    <span className="ml-auto text-[11px] px-2 py-[2px] rounded-full bg-blue-500/30 border border-blue-400/40 text-blue-200">
                      {unreadCount}
                    </span>
                  )}

                  {/* Mobile underline */}
                  {isActive && (
                    <motion.div
                      layoutId="tab-underline"
                      className="absolute left-3 right-3 bottom-0 h-[3px] md:hidden
                bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 rounded-full"
                    />
                  )}

                  {/* Desktop side indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="hidden md:block absolute left-0 top-2 bottom-2 w-[4px]
                bg-gradient-to-b from-blue-400 via-cyan-300 to-blue-500 rounded-r-full"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        {/* Tab contents */}
        <div className="order-2 md:order-1 col-span-1 md:col-span-5 h-full overflow-y-auto no-scrollbar">
          <AnimatePresence mode="wait">
            {/* ✅ FIXED: this block must be valid JSX - no `{...}` inside parentheses */}
            {!user ? (
              <TabSkeleton key="tab-skeleton" />
            ) : (
              <>
                {activeTab === 'account' && (
                  <motion.div
                    key="account"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22 }}
                    className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 w-full"
                  >
                    {/* Account Information */}
                    <div className="bg-[#283335] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">
                          Account Information
                        </h2>

                        <div className="flex gap-2 text-xs text-white/60">
                          <span className="px-2 py-[2px] rounded-full bg-white/5 border border-white/10">
                            Role: {user.role}
                          </span>
                          <span className="px-2 py-[2px] rounded-full bg-white/5 border border-white/10">
                            ID: {user._id.slice(0, 8)}…
                          </span>
                        </div>
                      </div>

                      {/* Fields */}
                      <div className="grid grid-cols-1 gap-4">
                        {/* Username */}
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase tracking-wide text-white/50 mb-1">
                            Username
                          </p>

                          {!editMode ? (
                            <p className="text-lg font-medium text-white">
                              {user.username}
                            </p>
                          ) : (
                            <input
                              type="text"
                              value={editedUser.username || ''}
                              onChange={(e) =>
                                setEditedUser({
                                  ...editedUser,
                                  username: e.target.value,
                                })
                              }
                              className="w-full bg-[#1f2a2e] px-4 py-2 rounded-lg border border-white/20 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        </div>

                        {/* Email */}
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase tracking-wide text-white/50 mb-1">
                            Email Address
                          </p>

                          {!editMode ? (
                            <p className="text-white font-medium break-all">
                              {user.email}
                            </p>
                          ) : (
                            <input
                              type="text"
                              value={editedUser.email || ''}
                              onChange={(e) =>
                                setEditedUser({
                                  ...editedUser,
                                  email: e.target.value,
                                })
                              }
                              className="w-full bg-[#1f2a2e] px-4 py-2 rounded-lg border border-white/20 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        </div>

                        {/* Linked IDs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Roblox */}
                          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs uppercase tracking-wide text-white/50 mb-2">
                              Roblox
                            </p>

                            {user.robloxId || user.robloxUsername ? (
                              <div className="flex flex-col gap-1">
                                {user.robloxUsername && (
                                  <span className="text-white font-medium">
                                    {user.robloxUsername}
                                  </span>
                                )}

                                {user.robloxId && (
                                  <span className="text-xs text-white/60 font-mono">
                                    ID: {user.robloxId}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-white/40 italic">
                                Not linked
                              </span>
                            )}
                          </div>

                          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs uppercase tracking-wide text-white/50 mb-2">
                              Discord
                            </p>

                            {user.discordId || user.discordUsername ? (
                              <div className="flex flex-col gap-1">
                                {user.discordUsername && (
                                  <span className="text-white font-medium">
                                    {user.discordUsername}
                                  </span>
                                )}

                                {user.discordId && (
                                  <span className="text-xs text-white/60 font-mono">
                                    ID: {user.discordId}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-white/40 italic">
                                Not linked
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Password */}
                    <div className="bg-[#283335] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                          🔐 Change Password
                        </h2>

                        <span className="text-xs px-2 py-[2px] rounded-full bg-yellow-500/10 border border-yellow-400/20 text-yellow-300">
                          Sensitive
                        </span>
                      </div>

                      <p className="text-sm text-white/55">
                        Choose a strong password you haven’t used before. For
                        security, this will log you out of other active sessions.
                      </p>

                      {/* Inputs */}
                      <div className="flex flex-col gap-4">
                        {/* New Password */}
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase tracking-wide text-white/50 mb-2">
                            New Password
                          </p>
                          <input
                            type="password"
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-[#1f2a2e] px-4 py-2 rounded-lg border border-white/20 outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Confirm Password */}
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase tracking-wide text-white/50 mb-2">
                            Confirm Password
                          </p>
                          <input
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) =>
                              setConfirmPassword(e.target.value)
                            }
                            className="w-full bg-[#1f2a2e] px-4 py-2 rounded-lg border border-white/20 outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Status */}
                        {passwordStatus && (
                          <div className="rounded-lg border border-yellow-400/20 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-300">
                            {passwordStatus}
                          </div>
                        )}

                        {/* Action */}
                        <button
                          onClick={handlePasswordReset}
                          className="mt-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition w-full py-2.5 rounded-lg text-white font-semibold shadow-md"
                        >
                          Update Password
                        </button>
                      </div>

                      {/* Footer hint */}
                      <div className="text-xs text-white/40 border-t border-white/10 pt-4">
                        Last changed:{' '}
                        {user.passwordUpdatedAt
                          ? new Date(user.passwordUpdatedAt).toLocaleDateString(
                            'en-UK'
                          )
                          : 'Never'}
                      </div>
                    </div>

                    <div className='bg-[#283335] p-6 text-white sm:grid-cols-2 lg:col-span-3 rounded-2xl border border-white/10'>
                      <h2 className="text-xl font-semibold pb-6">
                        Connections
                      </h2>
                      <div className="grid grid-cols-1 gap-6 lg:col-span-2">
                        {[
                          {
                            name: 'Discord',
                            avatar: user.discordAvatar || '/black_logo.png',
                            username: user.discordUsername || 'Discord',
                            id: user.discordId,
                            onConnect: handleDiscordConnect,
                            isDefault: user.defaultAvatar === user.discordAvatar,
                            onDefault: () =>
                              handleSetDefaultAvatar(user.discordAvatar),
                          },
                          {
                            name: 'Roblox',
                            avatar: user.robloxAvatar || '/black_logo.png',
                            username: user.robloxUsername || 'Roblox',
                            id: user.robloxId,
                            onConnect: handleRobloxConnect,
                            isDefault: user.defaultAvatar === user.robloxAvatar,
                            onDefault: () =>
                              handleSetDefaultAvatar(user.robloxAvatar),
                          },
                        ].map((svc, i) => {
                          const connected = !!svc.id;

                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.06, duration: 0.22 }}
                              className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl flex gap-5 items-start"
                            >
                              {/* Avatar */}
                              <Image
                                src={svc.avatar}
                                width={64}
                                height={64}
                                className="rounded-full border border-white/20 shadow-md"
                                alt={`${svc.name} Avatar`}
                              />

                              {/* Content */}
                              <div className="flex flex-col flex-1 min-w-0 gap-3">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0">
                                    <p className="text-lg font-semibold truncate">
                                      {svc.username}
                                    </p>
                                    <p className="text-xs text-white/50 truncate">
                                      {connected
                                        ? `ID: ${svc.id}`
                                        : 'Not connected'}
                                    </p>
                                  </div>

                                  {/* Status badge */}
                                  <span
                                    className={`text-xs px-2 py-[2px] rounded-full border
                  ${connected
                                        ? 'bg-green-500/10 border-green-400/30 text-green-300'
                                        : 'bg-white/5 border-white/10 text-white/40'
                                      }
                `}
                                  >
                                    {connected ? 'Connected' : 'Not linked'}
                                  </span>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap gap-2 pt-1">
                                  <button
                                    onClick={svc.onConnect}
                                    className="bg-blue-600 px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition"
                                  >
                                    {connected ? 'Reconnect' : 'Connect'}
                                  </button>

                                  <button
                                    onClick={svc.onDefault}
                                    disabled={svc.isDefault || !connected}
                                    className={`px-4 py-1.5 rounded-lg text-sm border transition
                  ${svc.isDefault
                                        ? 'bg-green-600 border-green-500 text-white'
                                        : connected
                                          ? 'border-white/20 hover:bg-white/10'
                                          : 'border-white/10 text-white/40 cursor-not-allowed'
                                      }
                `}
                                  >
                                    {svc.isDefault
                                      ? '✔ Default Avatar'
                                      : 'Set as Default'}
                                  </button>

                                  {connected && (
                                    <button
                                      onClick={() =>
                                        setDisconnectService(svc.name)
                                      }
                                      className="px-4 py-1.5 rounded-lg text-sm bg-red-600/60 hover:bg-red-700 transition"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                  </motion.div>
                )}

                {activeTab === 'stats' && (
                  <motion.div
                    key="stats"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22 }}
                    className="flex flex-col gap-8"
                  >
                    {/* Header */}
                    <div className="bg-[#283335] border border-white/10 rounded-2xl p-6 shadow-xl">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-semibold">User Statistics</h2>
                          <p className="text-white/55 text-sm mt-1">
                            Your activity, gameplay and development statistics
                          </p>
                        </div>

                        <span className="text-xs px-3 py-[3px] rounded-full bg-yellow-500/10 border border-yellow-400/30 text-yellow-300">
                          🚧 In Development
                        </span>
                      </div>

                      <div className="h-[3px] w-32 bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 rounded-full mt-4" />
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {/* Activity */}
                      <StatCard
                        title="Leaves Taken"
                        value="—"
                        hint="Approved leave requests"
                        icon={<ShieldAlert className="w-5 h-5" />}
                      />

                      <StatCard
                        title="Shifts Completed"
                        value="—"
                        hint="Total in-game shifts"
                        icon={<Wrench className="w-5 h-5" />}
                      />

                      {/* Development */}
                      <StatCard
                        title="Dev Tasks Completed"
                        value="—"
                        hint="Tasks marked as completed"
                        icon={<CheckCircle className="w-5 h-5" />}
                      />

                      <StatCard
                        title="Routes Completed"
                        value="—"
                        hint="Total routes driven"
                        icon={<Megaphone className="w-5 h-5" />}
                      />

                      {/* Transport */}
                      <StatCard
                        title="Stops Visited"
                        value="—"
                        hint="Unique stops stopped at"
                        icon={<Smartphone className="w-5 h-5" />}
                      />

                      <StatCard
                        title="Favourite Bus"
                        value="—"
                        hint="Most driven vehicle"
                        icon={<Wrench className="w-5 h-5" />}
                      />

                      <StatCard
                        title="Most Driven Route"
                        value="—"
                        hint="Highest usage route"
                        icon={<Megaphone className="w-5 h-5" />}
                      />

                      {/* Recent */}
                      <StatCard
                        title="Most Recent Bus"
                        value="—"
                        hint="Last vehicle used"
                        icon={<Smartphone className="w-5 h-5" />}
                      />

                      <StatCard
                        title="Most Recent Route"
                        value="—"
                        hint="Last route driven"
                        icon={<Megaphone className="w-5 h-5" />}
                      />
                    </div>

                    {/* Footer note */}
                    <div className="text-xs text-white/40 border-t border-white/10 pt-4">
                      These statistics will populate automatically as you use the platform.
                      Some values may remain unavailable until enough data is collected.
                    </div>
                  </motion.div>
                )}

                {activeTab === 'presence' && (
                  <motion.div
                    key="presence"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22 }}
                    className="flex flex-col gap-8"
                  >
                    {/* Section header */}
                    <div className="bg-[#283335] p-5 rounded-2xl border border-white/10">
                      <h2 className="text-2xl font-semibold">
                        Presence & Subscriptions
                      </h2>
                      <p className="text-white/55 text-sm mt-1 max-w-2xl">
                        Control how and where we contact you. These settings
                        affect alerts, system messages, and announcements.
                      </p>
                    </div>

                    {/* Presence methods */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Discord Presence */}
                      <PresenceCard
                        icon={<Bell className="w-5 h-5 text-indigo-300" />}
                        title="Discord Presence"
                        desc="Receive notifications directly via Discord DM"
                        checked={!!editedUser?.notificationPrefs?.discord}
                        onToggle={(v) =>
                          setEditedUser({
                            ...editedUser,
                            notificationPrefs: {
                              ...editedUser.notificationPrefs,
                              discord: v,
                            },
                          })
                        }
                        badge={user.discordId ? 'Connected' : 'Not linked'}
                        badgeType={user.discordId ? 'ok' : 'warn'}
                      />

                      {/* Email Presence */}
                      <PresenceCard
                        icon={<Mail className="w-5 h-5 text-blue-300" />}
                        title="Email Presence"
                        desc="Important alerts and security notices via email"
                        checked={!!editedUser?.notificationPrefs?.email}
                        onToggle={(v) =>
                          setEditedUser({
                            ...editedUser,
                            notificationPrefs: {
                              ...editedUser.notificationPrefs,
                              email: v,
                            },
                          })
                        }
                        badge="Primary"
                        badgeType="info"
                      />
                    </div>

                    <PresenceCard
                      icon={<Megaphone className="w-5 h-5 text-green-300" />}
                      title="Newsletter Subscription"
                      desc="Occasional announcements, platform updates, and news"
                      checked={!!editedUser.newsletter}
                      onToggle={(v) => setEditedUser({ ...editedUser, newsletter: v })}
                      subtle
                    />
                  </motion.div>
                )}

                {activeTab === 'notifications' && (
                  <motion.div
                    key="notifications"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22 }}
                    className="flex flex-col gap-8"
                  >
                    {/* Header */}
                    <div className="bg-[#283335] border border-white/10 rounded-2xl p-6 shadow-xl">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-semibold flex items-center gap-2">
                            <Bell className="w-6 h-6 text-blue-300" />
                            Notifications
                          </h2>
                          <p className="text-white/55 text-sm mt-1">
                            Updates, alerts and activity related to your account
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <div className="text-sm text-white/60">
                            Unread{' '}
                            <span className="ml-1 px-2 py-[2px] rounded-full bg-blue-500/20 border border-blue-400/30 text-white font-semibold">
                              {unreadCount}
                            </span>
                          </div>

                          {/* Unread only */}
                          <button
                            onClick={() => setShowUnreadOnly((v) => !v)}
                            className={`px-3 py-2 rounded-lg text-sm border transition
              ${showUnreadOnly
                                ? 'bg-yellow-500/20 border-yellow-400/40 text-yellow-300'
                                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                              }
            `}
                          >
                            Unread only
                          </button>

                          {/* Mark all */}
                          <button
                            onClick={markAllNotifsRead}
                            disabled={unreadCount === 0}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition border
              ${unreadCount === 0
                                ? 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                                : 'bg-blue-600/30 border-blue-400/30 text-white hover:bg-blue-600/45'
                              }
            `}
                            title={
                              unreadCount === 0
                                ? 'Nothing unread'
                                : 'Mark all as read'
                            }
                          >
                            Mark all read
                          </button>
                        </div>
                      </div>

                      <div className="h-[3px] w-28 bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 rounded-full mt-4" />
                    </div>

                    {/* List */}
                    <div className="bg-[#283335] border border-white/10 rounded-2xl p-6 shadow-xl">
                      {notifsLoading ? (
                        <div className="flex justify-center items-center py-20 text-white/60">
                          Loading notifications…
                        </div>
                      ) : visibleNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-white/50">
                          <Bell className="w-10 h-10 mb-3 opacity-40" />
                          {showUnreadOnly
                            ? 'No unread notifications'
                            : 'No notifications yet'}
                        </div>
                      ) : (
                        <div className="space-y-8 max-h-[620px] overflow-y-auto no-scrollbar pr-1">
                          {['today', 'earlier'].map((group) => {
                            const items = groupedNotifications[group];
                            if (!items.length) return null;

                            return (
                              <div key={group}>
                                <p className="text-xs uppercase tracking-wider text-white/40 mb-3">
                                  {group === 'today' ? 'Today' : 'Earlier'}
                                </p>

                                <div className="space-y-4">
                                  {items.map((n, i) => (
                                    <motion.div
                                      key={n._id}
                                      initial={{ opacity: 0, y: 8 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{
                                        delay: i * 0.04,
                                        duration: 0.22,
                                      }}
                                      className={`relative rounded-xl p-5 border transition-all
                        ${n.read
                                          ? 'bg-[#283335] border-white/10 hover:bg-[#2f3b3e]'
                                          : 'bg-[#283335]/40 border-blue-500/40 hover:bg-[#283335]/60'
                                        }
                      `}
                                    >
                                      {!n.read && (
                                        <span className="absolute top-4 right-4 w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-[0_0_10px_2px_rgba(96,165,250,0.6)]" />
                                      )}

                                      <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                          <p className="text-lg font-semibold text-white/90 mb-1">
                                            {n.title}
                                          </p>
                                          <p className="text-sm text-white/70 leading-relaxed">
                                            {n.notification}
                                          </p>

                                          {n.link && (
                                            <Link
                                              href={n.link}
                                              className="inline-block mt-3 text-sm text-blue-300 hover:text-blue-400 underline underline-offset-2 transition"
                                            >
                                              View more →
                                            </Link>
                                          )}
                                        </div>

                                        <button
                                          onClick={() => markNotifRead(n._id)}
                                          disabled={n.read}
                                          title={
                                            n.read
                                              ? 'Already read'
                                              : 'Mark as read'
                                          }
                                          className={`relative p-2 rounded-full transition
                            ${n.read
                                              ? 'bg-green-700/30 text-green-400 cursor-default'
                                              : 'bg-blue-600/40 hover:bg-blue-600/60 text-yellow-300'
                                            }
                          `}
                                        >
                                          {n.read ? (
                                            <CheckCircle className="w-6 h-6" />
                                          ) : (
                                            <>
                                              <XCircle className="w-6 h-6 relative z-10" />
                                              <span className="absolute inset-0 rounded-full bg-blue-400 opacity-40 animate-ping" />
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>
        {/* Disconnect modal */}
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
                <h2 className="text-xl font-bold mb-2">
                  Remove {disconnectService} Connection
                </h2>
                <p className="text-white/70 text-sm mb-6">
                  Are you sure you want to disconnect your {disconnectService}{' '}
                  account?
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

        {/* Delete modal */}
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
                <h2 className="text-xl font-bold text-white mb-2">
                  Delete Account
                </h2>
                <p className="text-white/70 text-sm mb-4">
                  This action is permanent. Type{' '}
                  <span className="font-semibold text-red-400">
                    {user.username}
                  </span>{' '}
                  to confirm.
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
                      localStorage.removeItem('User');
                      window.location.href = '/';
                    } catch {
                      showToastFn('Delete failed');
                    }

                    setDeleteLoading(false);
                  }}
                  className={`w-full mt-4 py-2 rounded-lg font-semibold transition ${deleteInput === user.username
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-red-900/40 cursor-not-allowed'
                    }`}
                >
                  {deleteLoading ? 'Deleting…' : 'Confirm Delete'}
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

        <style jsx global>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
        `}</style>
      </div>
    </main>
  );
}

function PresenceCard({
  icon,
  title,
  desc,
  checked,
  onToggle,
  badge,
  badgeType = 'default',
  subtle = false,
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-xl flex items-center gap-4 transition
        ${subtle ? 'bg-[#283335]' : 'bg-[#283335]'}
        ${checked ? 'border-blue-400/30' : 'border-white/10'}
      `}
    >
      {/* Icon */}
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center border
          ${checked
            ? 'bg-blue-500/10 border-blue-400/30 text-blue-200'
            : 'bg-white/5 border-white/10 text-white/70'
          }
        `}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <p className="font-semibold text-lg">{title}</p>

          {badge && (
            <span
              className={`text-xs px-2 py-[2px] rounded-full border
                ${badgeType === 'ok'
                  ? 'bg-green-500/10 border-green-400/30 text-green-300'
                  : badgeType === 'warn'
                    ? 'bg-yellow-500/10 border-yellow-400/30 text-yellow-300'
                    : badgeType === 'info'
                      ? 'bg-blue-500/10 border-blue-400/30 text-blue-300'
                      : 'bg-white/5 border-white/10 text-white/50'
                }
              `}
            >
              {badge}
            </span>
          )}
        </div>

        <p className="text-sm text-white/60 mt-1">{desc}</p>
      </div>

      {/* Toggle */}
      <button
        onClick={() => onToggle(!checked)}
        className={`relative w-12 h-6 rounded-full border transition
          ${checked
            ? 'bg-blue-500/40 border-blue-400/40'
            : 'bg-white/10 border-white/10'
          }
        `}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`absolute top-[3px] w-4 h-4 rounded-full
            ${checked ? 'left-[26px] bg-blue-200' : 'left-[4px] bg-white/60'}
          `}
        />
      </button>
    </div>
  );
}

function TabSkeleton() {
  return (
    <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-40 rounded-2xl bg-white/5 border border-white/10"
        />
      ))}
    </div>
  );
}

function StatCard({ title, value, hint, icon }) {
  return (
    <div className="bg-[#283335] border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/60">{title}</p>
        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70">
          {icon}
        </div>
      </div>

      <div className="text-3xl font-bold text-white/80">
        {value}
      </div>

      <p className="text-xs text-white/45">
        {hint}
      </p>

      <span className="mt-auto text-[11px] px-2 py-[2px] rounded-full w-fit
        bg-yellow-500/10 border border-yellow-400/30 text-yellow-300">
        In Development
      </span>
    </div>
  );
}
