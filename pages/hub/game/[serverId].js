'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from "framer-motion";
import axios from 'axios';
import {
  Loader2,
  Users,
  MessageSquare,
  Search,
  Link2,
  Ban,
  VolumeX,
  Volume2,
  LogOut,
  Copy,
  Clock,
  BrushCleaning,
} from 'lucide-react';
import AuthWrapper from '@/components/AuthWrapper';

export default function ServerDetailPage() {
  const router = useRouter();
  const { serverId } = router.query;

  const [serverMeta, setServerMeta] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [players, setPlayers] = useState([]);
  const [chatLogs, setChatLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState('');
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [logFilter, setLogFilter] = useState('all');
  const [logDate, setLogDate] = useState('');
  const [isStaff, setIsStaff] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [confirmData, setConfirmData] = useState(null);

  // moderation audit logs
  const [modLogs, setModLogs] = useState([]);

  // ban modal state
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banForm, setBanForm] = useState({
    scope: 'global',          // 'global' | 'server'
    banType: 'permanent',     // 'permanent' | 'temporary'
    durationValue: 24,        // number
    durationUnit: 'hours',    // 'minutes' | 'hours' | 'days'
    reason: '',
  });

  function confirmAction(title, message, onConfirm) {
    setConfirmData({ title, message, onConfirm });
  }

  const robloxCacheRef = useRef({});

  async function getRobloxInfo(userId) {
    const cache = robloxCacheRef.current;
    if (cache[userId]) return cache[userId];
    try {
      const info = await axios.get(`/api/roblox/${userId}`);
      const data = {
        username: info.data.username,
        icon: info.data.icon,
        rank: info.data.group.rank,
        role: info.data.group.role,
      };
      cache[userId] = data;
      return data;
    } catch {
      return {
        username: 'System',
        icon: 'https://yapton.flatstudios.net/cdn/image/black_logo.png',
        rank: 0,
        role: 'Automation',
      };
    }
  }

  // load server data
  useEffect(() => {
    if (!serverId) return;

    let isMounted = true;
    let isRefreshing = false;

    async function loadServerData(isBackground = false) {
      if (isRefreshing) return;
      isRefreshing = true;
      try {
        const [metaRes, playersRes, chatRes] = await Promise.all([
          axios.get(`/api/game/servers/${serverId}`),
          axios.get(`/api/game/servers/${serverId}/players`),
          axios.get(`/api/game/servers/${serverId}/chat`),
        ]);

        if (!isMounted) return;

        const playersData = await Promise.all(
          (playersRes.data || []).map(async (p) => {
            const info = await getRobloxInfo(p.playerId);
            return {
              playerId: p.playerId,
              username: info.username ?? p.username,
              icon: info.icon,
              role: info.role,
              rank: info.rank,
              joined: p.joined,
              left: p.left,
            };
          })
        );

        const chatData = await Promise.all(
          (chatRes.data || []).map(async (msg) => {
            const info = await getRobloxInfo(msg.playerId);
            return {
              playerId: msg.playerId,
              username: info.username,
              icon: info.icon,
              role: info.role,
              rank: info.rank,
              chatMessage: msg.chatMessage,
              time: msg.time,
              isModerationLog: msg.isModerationLog || false,
            };
          })
        );

        setServerMeta((prev) =>
          JSON.stringify(prev) === JSON.stringify(metaRes.data) ? prev : metaRes.data
        );
        setPlayers((prev) => {
          const sameLength = prev.length === playersData.length;
          const unchanged =
            sameLength &&
            prev.every(
              (p, i) =>
                p.playerId === playersData[i].playerId &&
                p.left === playersData[i].left
            );
          return unchanged ? prev : playersData;
        });
        setChatLogs((prev) =>
          JSON.stringify(prev) === JSON.stringify(chatData) ? prev : chatData
        );
      } catch (err) {
        console.error('Background update failed:', err);
      } finally {
        isRefreshing = false;
      }
    }

    (async () => {
      setLoading(true);
      await loadServerData();
      setLoading(false);
    })();

    const interval = setInterval(() => loadServerData(true), 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [serverId]);

  // load current user + staff check
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('User') || '{}');
    const allowed = ['Human-Resources', 'Owner', 'Community-Director'];
    setIsStaff(allowed.includes(user?.role));
    if (user?._id) setCurrentUser(user);
  }, []);

  // load moderation audit logs
  useEffect(() => {
    if (!serverId) return;
    const loadLogs = async () => {
      try {
        const res = await axios.get(`/api/moderation/log?serverId=${serverId}`);
        setModLogs(res.data.logs || []);
      } catch (e) {
        console.error('Failed to load moderation logs:', e);
      }
    };
    loadLogs();
    const interval = setInterval(loadLogs, 60000);
    return () => clearInterval(interval);
  }, [serverId]);

  const filteredChat = useMemo(() => {
    if (!filter.trim()) return chatLogs;
    const q = filter.toLowerCase();
    return chatLogs.filter(
      (msg) =>
        msg.username.toLowerCase().includes(q) ||
        msg.chatMessage.toLowerCase().includes(q)
    );
  }, [chatLogs, filter]);

  function groupByDate(list) {
    if (!list.length) return {};

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const formatDateLabel = (dateStr) => {
      const d = new Date(dateStr);
      if (d.toDateString() === today.toDateString()) return '🟩 Today';
      if (d.toDateString() === yesterday.toDateString()) return '🟨 Yesterday';
      return d.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    };

    return list.reduce((groups, p) => {
      const key = p.joined ? formatDateLabel(p.joined) : 'Unknown Date';
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
      return groups;
    }, {});
  }

  // convert banForm duration -> minutes
  function getBanDurationMinutes() {
    const v = Number(banForm.durationValue) || 0;
    if (banForm.banType === 'permanent') return null;
    if (banForm.durationUnit === 'minutes') return v;
    if (banForm.durationUnit === 'hours') return v * 60;
    if (banForm.durationUnit === 'days') return v * 60 * 24;
    return null;
  }

  // -------- moderation action helpers --------

  async function logModerationAction(payload) {
    try {
      const res = await axios.post('/api/moderation/log', payload);
      if (res.data?.log) {
        setModLogs((prev) => [res.data.log, ...prev]);
      }
    } catch (err) {
      console.error('Failed to log moderation action:', err);
    }
  }

  async function handleKick() {
    if (!selectedPlayer || !serverId) return;
    const moderatorName = currentUser?.username || 'Web Dashboard';

    await axios.post(`/api/game/servers/${serverId}/commands`, {
      type: 'kick',
      targetId: selectedPlayer.playerId,
      reason: 'Kicked by web admin',
      issuedBy: moderatorName,
    });

    await logModerationAction({
      action: 'kick',
      targetId: selectedPlayer.playerId,
      targetName: selectedPlayer.username,
      moderatorId: currentUser?._id,
      moderatorName,
      serverId,
      scope: 'server',
      reason: 'Kicked by web admin',
    });
  }

  async function handleMute() {
    if (!selectedPlayer || !serverId) return;
    const moderatorName = currentUser?.username || 'Web Dashboard';

    await axios.post(`/api/game/servers/${serverId}/commands`, {
      type: 'mute',
      targetId: selectedPlayer.playerId,
      reason: 'Muted by web admin',
      issuedBy: moderatorName,
    });

    await logModerationAction({
      action: 'mute',
      targetId: selectedPlayer.playerId,
      targetName: selectedPlayer.username,
      moderatorId: currentUser?._id,
      moderatorName,
      serverId,
      scope: 'server',
      reason: 'Muted by web admin',
    });
  }

  async function handleUnmute() {
    if (!selectedPlayer || !serverId) return;
    const moderatorName = currentUser?.username || 'Web Dashboard';

    await axios.post(`/api/game/servers/${serverId}/commands`, {
      type: 'unmute',
      targetId: selectedPlayer.playerId,
      reason: 'Unmuted by web admin',
      issuedBy: moderatorName,
    });

    await logModerationAction({
      action: 'unmute',
      targetId: selectedPlayer.playerId,
      targetName: selectedPlayer.username,
      moderatorId: currentUser?._id,
      moderatorName,
      serverId,
      scope: 'server',
      reason: 'Unmuted by web admin',
    });
  }

  async function handleServerBan(reason) {
    if (!selectedPlayer || !serverId) return;
    const moderatorName = currentUser?.username || 'Web Dashboard';

    // your own in-game /commands handler must treat this as local server ban
    await axios.post(`/api/game/servers/${serverId}/commands`, {
      type: 'ban',
      scope: 'server',
      targetId: selectedPlayer.playerId,
      reason,
      issuedBy: moderatorName,
    });

    await logModerationAction({
      action: 'ban',
      targetId: selectedPlayer.playerId,
      targetName: selectedPlayer.username,
      moderatorId: currentUser?._id,
      moderatorName,
      serverId,
      scope: 'server',
      reason,
      banType: 'server-only',
    });
  }

  async function handleGlobalBan(reason) {
    if (!selectedPlayer) return;
    const moderatorName = currentUser?.username || 'Web Dashboard';
    const durationMinutes = getBanDurationMinutes();

    const res = await axios.post('/api/moderation/ban', {
      robloxUserId: selectedPlayer.playerId,
      scope: 'global',
      type: banForm.banType, // 'permanent' | 'temporary'
      durationMinutes,
      reason,
      moderatorId: currentUser?._id,
      moderatorName,
      serverId,
    });

    if (res.data?.log) {
      setModLogs((prev) => [res.data.log, ...prev]);
    }
  }

  async function handleGlobalUnban() {
    if (!selectedPlayer) return;
    const moderatorName = currentUser?.username || 'Web Dashboard';

    const res = await axios.post('/api/moderation/unban', {
      robloxUserId: selectedPlayer.playerId,
      reason: 'Unbanned via web dashboard',
      moderatorId: currentUser?._id,
      moderatorName,
      serverId,
    });

    if (res.data?.log) {
      setModLogs((prev) => [res.data.log, ...prev]);
    }
  }

  // -------- render --------

  return (
    <AuthWrapper requiredRole="hub">
      <main className="text-white px-6 py-3 relative">
        <div className="relative bg-[#283335]/80 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 mb-3">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 relative z-10">
            <div>
              <p className="text-sm mt-1 font-mono flex items-center gap-2 flex-wrap">
                <a
                  href="/hub/game/"
                  className="text-gray-300 underline hover:text-blue-400 transition"
                >
                  View All Servers
                </a>
                <span className="text-white/40">|</span>
                <span>Join Server:</span>
                <a
                  href={`roblox://placeId=5883938795&launchData=${encodeURIComponent(
                    JSON.stringify({ jobId: serverId })
                  )}`}
                  className="text-gray-300 underline hover:text-blue-400 transition"
                >
                  {serverId}
                </a>
                <button
                  className="text-blue-300 hover:text-blue-400"
                  title="Shareable Join Link"
                  onClick={(e) => {
                    e.preventDefault();
                    const url = `${window.location.origin}/join?server=${serverId}`;
                    navigator.clipboard.writeText(url);
                  }}
                >
                  <Link2 className="inline-block w-4 h-4" />
                </button>
                <span className="text-white/40">|</span>
                <a
                  href="https://www.roblox.com/games/5883938795/UPDATE-Yapton-and-District"
                  className="text-gray-300 underline hover:text-blue-400 transition"
                >
                  Join The Game
                </a>
              </p>
              {serverMeta && (
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:gap-6 text-sm text-gray-400">
                  <p>
                    <span className="text-gray-500">🕒 Started:</span>{' '}
                    <span className="text-gray-300">
                      {new Date(serverMeta.createdAt).toLocaleString('en-GB', {
                        timeZone: 'Europe/London',
                      })}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-500">🔁 Updated:</span>{' '}
                    <span className="text-gray-300">
                      {new Date(serverMeta.updatedAt).toLocaleString('en-GB', {
                        timeZone: 'Europe/London',
                      })}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 items-end">
              <button
                onClick={async () => {
                  if (!window.confirm('Are you sure you want to flag this server?')) return;
                  try {
                    await axios.post(`/api/game/servers/${serverId}/flag`, {
                      flagged: true,
                    });
                    alert('Server flagged for review.');
                  } catch (err) {
                    console.error(err);
                    alert('Failed to flag server.');
                  }
                }}
                className="px-4 py-1.5 rounded-md bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-semibold text-sm shadow-md transition-all"
              >
                🚩 Flag Server
              </button>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  id="notification"
                  placeholder="Enter notification message..."
                  maxLength={100}
                  className="w-72 bg-[#283335] border border-white/10 text-sm text-gray-200 rounded-md px-3 py-[6px] focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400 transition"
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      const msg = e.target.value.trim();
                      if (!msg) return;
                      await axios.post(`/api/game/servers/${serverId}/post`, {
                        message: msg,
                        author: currentUser?.username || 'Admin Notice',
                        type: 'notification',
                      });
                      e.target.value = '';
                      alert('Notification sent!');
                    }
                  }}
                />
                <button
                  onClick={async () => {
                    const input = document.getElementById('notification');
                    const msg = input?.value?.trim();
                    if (!msg) return;
                    await axios.post(`/api/game/servers/${serverId}/post`, {
                      message: msg,
                      author: currentUser?.username || 'Admin Notice',
                      type: 'notification',
                    });
                    input.value = '';
                    alert('Notification sent!');
                  }}
                  className="px-3 py-[6px] rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-medium text-sm shadow-sm transition-all hover:shadow-md"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>

        {!loading && (
          <motion.div
            key="refreshing"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="absolute top-2 right-3 text-xs text-gray-400 flex items-center gap-1"
          >
            <Loader2 size={12} className="animate-spin text-blue-400" />
            Updating data…
          </motion.div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={32} className="animate-spin text-blue-400" />
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-8">
              {/* LEFT SIDE – Player console + player list */}
              <div className="flex flex-col min-h-[575px]">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Users size={20} /> Player Console (
                  {selectedPlayer?.username ? selectedPlayer.username : 'Select A Player'})
                </h2>

                <div className="mt-3 bg-[#283335]/80 backdrop-blur-md border border-white/10 rounded-lg p-4 flex flex-col justify-between flex-1 max-h-[250px]">
                  {selectedPlayer ? (
                    <>
                      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                        <div className="flex items-center gap-3">
                          <img
                            src={selectedPlayer.icon || '/logo.png'}
                            alt="avatar"
                            className="w-10 h-10 rounded-md"
                          />
                          <div>
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2 flex-wrap">
                              {selectedPlayer.username}
                              <span className="text-sm text-gray-400">
                                {selectedPlayer.role} ({selectedPlayer.rank})
                              </span>
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Joined:{' '}
                              {selectedPlayer.joined
                                ? new Date(selectedPlayer.joined).toLocaleString('en-GB', {
                                    timeZone: 'Europe/London',
                                  })
                                : '—'}
                              {selectedPlayer.left && (
                                <>
                                  {' '}
                                  • Left:{' '}
                                  {new Date(selectedPlayer.left).toLocaleString('en-GB', {
                                    timeZone: 'Europe/London',
                                  })}
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2 ml-auto">
                          {/* Kick */}
                          <button
                            onClick={() =>
                              confirmAction(
                                'Kick Player',
                                `Are you sure you want to kick ${selectedPlayer.username}?`,
                                handleKick
                              )
                            }
                            disabled={!isStaff}
                            className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm transition
                              bg-yellow-500/20 border border-yellow-500/40 hover:bg-yellow-500/30
                              ${
                                !isStaff
                                  ? 'opacity-40 cursor-not-allowed hover:bg-transparent hover:border-yellow-500/20'
                                  : ''
                              }`}
                            title="Kick Player"
                          >
                            <LogOut className="text-yellow-400" size={16} /> Kick
                          </button>

                          {/* Ban (opens modal) */}
                          <button
                            onClick={() => {
                              setBanForm({
                                scope: 'global',
                                banType: 'permanent',
                                durationValue: 24,
                                durationUnit: 'hours',
                                reason: '',
                              });
                              setBanModalOpen(true);
                            }}
                            disabled={!isStaff}
                            className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm transition
                              bg-red-500/20 border border-red-500/40 hover:bg-red-500/30
                              ${
                                !isStaff
                                  ? 'opacity-40 cursor-not-allowed hover:bg-transparent hover:border-red-500/20'
                                  : ''
                              }`}
                            title="Ban Player"
                          >
                            <Ban className="text-red-400" size={16} /> Ban
                          </button>

                          {/* Unban (global) */}
                          <button
                            onClick={() =>
                              confirmAction(
                                'Unban Player',
                                `Global unban ${selectedPlayer.username}?`,
                                handleGlobalUnban
                              )
                            }
                            disabled={!isStaff}
                            className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm transition
                              bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30
                              ${
                                !isStaff
                                  ? 'opacity-40 cursor-not-allowed hover:bg-transparent hover:border-emerald-500/20'
                                  : ''
                              }`}
                            title="Global Unban (Roblox API)"
                          >
                            <Ban className="text-emerald-300 rotate-180" size={16} /> Unban
                          </button>

                          {/* Mute */}
                          <button
                            onClick={() =>
                              confirmAction(
                                'Mute Player',
                                `Mute ${selectedPlayer.username}?`,
                                handleMute
                              )
                            }
                            className="flex items-center gap-1 px-3 py-1 rounded-md text-sm transition bg-orange-500/20 border border-orange-500/40 hover:bg-orange-500/30"
                            title="Mute Player"
                          >
                            <VolumeX className="text-orange-400" size={16} /> Mute
                          </button>

                          {/* Unmute */}
                          <button
                            onClick={() =>
                              confirmAction(
                                'Unmute Player',
                                `Unmute ${selectedPlayer.username}?`,
                                handleUnmute
                              )
                            }
                            className="flex items-center gap-1 px-3 py-1 rounded-md text-sm transition bg-green-500/20 border border-green-500/40 hover:bg-green-500/30"
                            title="Unmute Player"
                          >
                            <Volume2 className="text-green-400" size={16} /> Unmute
                          </button>

                          {/* Copy ID */}
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(selectedPlayer.playerId);
                            }}
                            title="Copy Player ID"
                            className="flex items-center gap-1 px-3 py-1 bg-gray-500/20 border border-gray-500/40 rounded-md hover:bg-gray-500/30 transition text-sm"
                          >
                            <Copy className="text-gray-300" size={16} /> Copy
                          </button>

                          {/* Deselect */}
                          <button
                            onClick={() => {
                              setSelectedPlayer(null);
                            }}
                            title="Deselect Player"
                            className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 border border-blue-500/40 rounded-md hover:bg-blue-500/30 transition text-sm"
                          >
                            <BrushCleaning className="text-gray-300" size={16} /> Deselect
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 mb-3">
                        <div className="flex items-center gap-2 text-gray-300 text-sm">
                          <MessageSquare size={16} className="text-blue-400" />
                          Messages:{' '}
                          {
                            chatLogs.filter(
                              (msg) => msg.playerId === selectedPlayer.playerId
                            ).length
                          }
                        </div>
                        <div className="flex items-center gap-2 text-gray-300 text-sm">
                          <Clock size={16} className="text-yellow-400" />
                          Last Active:{' '}
                          {(() => {
                            const lastMsg = chatLogs
                              .filter((m) => m.playerId === selectedPlayer.playerId)
                              .slice(-1)[0];
                            return lastMsg
                              ? new Date(lastMsg.time).toLocaleTimeString('en-GB', {
                                  timeZone: 'Europe/London',
                                })
                              : 'No messages';
                          })()}
                        </div>
                      </div>

                      <div className="border border-white/10 rounded-md p-2 bg-[#222a2e]/40 mb-3 min-h-30 max-h-32 overflow-y-auto no-scrollbar">
                        <p className="text-xs text-gray-400 uppercase mb-1">
                          Recent Messages
                        </p>
                        <div className="space-y-1 text-sm text-gray-300 font-mono">
                          {chatLogs
                            .filter((m) => m.playerId === selectedPlayer.playerId)
                            .slice(-5)
                            .reverse()
                            .map((m, idx) => (
                              <div key={idx}>
                                <span className="text-gray-500">
                                  [
                                  {new Date(m.time).toLocaleTimeString('en-GB', {
                                    timeZone: 'Europe/London',
                                  })}
                                  ]
                                </span>{' '}
                                {m.chatMessage}
                              </div>
                            ))}
                          {chatLogs.filter((m) => m.playerId === selectedPlayer.playerId)
                            .length === 0 && (
                            <p className="text-gray-500 text-sm">
                              No messages from this user.
                            </p>
                          )}
                        </div>
                      </div>

                      <style jsx global>{`
                        .no-scrollbar::-webkit-scrollbar {
                          display: none;
                        }
                        .no-scrollbar {
                          -ms-overflow-style: none;
                          scrollbar-width: none;
                        }
                      `}</style>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center flex-1 text-gray-500">
                      <Users size={32} className="mb-2 opacity-50" />
                      <p className="text-sm">
                        Select a player to view details and actions.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mb-3 mt-3">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Users size={20} /> Players (
                    {players.filter((p) => !p.left).length})
                  </h2>
                  <button
                    onClick={() => setShowLogsModal(true)}
                    className="px-3 py-1 rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-medium text-sm shadow-sm transition-all hover:shadow-md"
                  >
                    Player Logs
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-[#283335]/80 backdrop-blur-md border border-white/10 rounded-lg p-3 max-h-[250px]">
                  {players.filter((p) => !p.left).length === 0 ? (
                    <p className="text-gray-400 text-sm">No players online.</p>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      <ul className="space-y-2">
                        {players
                          .filter((p) => !p.left)
                          .map((player) => (
                            <motion.li
                              key={player.playerId}
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              onClick={() => setSelectedPlayer(player)}
                              className={`flex items-center justify-between border-b border-white/10 pb-2 cursor-pointer hover:bg-white/5 rounded-md transition ${
                                selectedPlayer?.playerId === player.playerId
                                  ? 'bg-[#283335]'
                                  : ''
                              }`}
                            >
                              <div className="m-2 flex items-center gap-3">
                                <img
                                  src={player.icon || '/logo.png'}
                                  alt="avatar"
                                  className="w-8 h-8 rounded-md"
                                />
                                <div>
                                  <p className="font-medium text-blue-400">
                                    {player.username}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {player.role} ({player.rank}) — {player.playerId}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    Joined:{' '}
                                    {player.joined
                                      ? new Date(player.joined).toLocaleTimeString()
                                      : '—'}
                                    {player.left && (
                                      <>
                                        {' '}
                                        • Left:{' '}
                                        {new Date(player.left).toLocaleTimeString()}
                                      </>
                                    )}
                                  </p>
                                </div>
                              </div>

                              <a
                                href={`https://www.roblox.com/users/${player.playerId}/profile`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-gray-400 hover:text-blue-400 transition m-2"
                                title="View Roblox Profile"
                              >
                                <Link2 size={18} />
                              </a>
                            </motion.li>
                          ))}
                      </ul>
                    </AnimatePresence>
                  )}
                </div>
              </div>

              {/* RIGHT SIDE – Chat logs */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <MessageSquare size={20} /> Chat Logs ({filteredChat.length})
                  </h2>
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-2 top-2.5 text-gray-400"
                    />
                    <input
                      type="text"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      placeholder="Filter messages..."
                      className="pl-8 pr-3 py-1 text-sm rounded-md bg-[#283335] border border-white/10 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div
                  className="bg-[#283335]/80 backdrop-blur-md border border-white/10 rounded-lg p-3 max-h-[575px] overflow-y-auto space-y-2 font-mono text-sm"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  <style jsx>{`
                    div::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                  {filteredChat.length === 0 ? (
                    <p className="text-gray-400">No chat messages found.</p>
                  ) : (
                    [...filteredChat].reverse().map((msg, idx) => {
                      const isModLog = msg.isModerationLog;
                      return (
                        <div
                          key={idx}
                          className={`flex items-start gap-3 border-b border-white/10 pb-3 ${
                            isModLog
                              ? 'bg-gradient-to-r from-blue-900/30 to-blue-800/10'
                              : ''
                          }`}
                        >
                          <img
                            src={msg.icon || '/logo.png'}
                            alt="avatar"
                            className="w-8 h-8 rounded-md mt-0.5 border border-white/10"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-blue-300 text-sm">
                                {msg.username}
                              </span>
                              {isModLog && (
                                <span className="text-gray-400 text-sm">
                                  {msg.chatMessage}
                                </span>
                              )}
                            </div>

                            {isModLog && (
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>{msg.role}</span>
                                <span>
                                  {msg.time
                                    ? new Date(msg.time).toLocaleTimeString('en-GB', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                        hour12: true,
                                        timeZone: 'Europe/London',
                                      })
                                    : ''}
                                </span>
                              </div>
                            )}
                            {!isModLog && (
                              <p className="text-gray-200 text-sm mt-1">
                                {msg.chatMessage}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Player logs modal */}
              <AnimatePresence mode="wait" initial={false}>
                {showLogsModal ? (
                  <motion.div
                    key="playerLogsModal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
                  >
                    <motion.div
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 50, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                      className="bg-[#283335]/95 border border-white/10 rounded-lg p-6 w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col shadow-xl shadow-black/40"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                          <Clock size={18} /> Player Join/Leave Logs
                        </h2>
                        <button
                          onClick={() => setShowLogsModal(false)}
                          className="text-gray-400 hover:text-white transition text-lg font-semibold"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <div className="flex items-center bg-[#283335] border border-white/10 rounded-md px-2 py-1 text-sm text-gray-300">
                          <label className="mr-2 text-gray-400">View:</label>
                          <select
                            value={logFilter}
                            onChange={(e) => setLogFilter(e.target.value)}
                            className="bg-transparent outline-none"
                          >
                            <option className="text-white bg-black" value="all">
                              All
                            </option>
                            <option className="text-white bg-black" value="online">
                              Online Only
                            </option>
                            <option className="text-white bg-black" value="date">
                              Specific Date
                            </option>
                          </select>
                        </div>

                        {logFilter === 'date' && (
                          <input
                            type="date"
                            value={logDate}
                            onChange={(e) => setLogDate(e.target.value)}
                            className="bg-[#283335] border border-white/10 rounded-md px-2 py-1 text-sm text-gray-200 focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        )}

                        <div className="relative flex-1 min-w-[200px]">
                          <Search
                            size={16}
                            className="absolute left-2 top-2.5 text-gray-400"
                          />
                          <input
                            type="text"
                            placeholder="Search by username or ID..."
                            value={logSearch}
                            onChange={(e) => setLogSearch(e.target.value)}
                            className="pl-8 pr-3 py-1.5 w-full text-sm rounded-md bg-[#283335] border border-white/10 focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-400"
                          />
                        </div>
                      </div>

                      <div className="overflow-y-auto flex-1 border border-white/10 rounded-md p-3 bg-[#222a2e]/40">
                        {Object.entries(
                          groupByDate(
                            players
                              .filter((p) => {
                                if (logFilter === 'online') return !p.left;
                                if (logFilter === 'date' && logDate)
                                  return (
                                    p.joined &&
                                    new Date(p.joined).toISOString().slice(0, 10) ===
                                      logDate
                                  );
                                return true;
                              })
                              .filter((p) =>
                                [p.username, p.playerId].some((val) =>
                                  val
                                    ?.toLowerCase()
                                    .includes(logSearch.toLowerCase())
                                )
                              )
                          )
                        ).map(([dateLabel, logs]) => (
                          <div key={dateLabel} className="mb-5">
                            <h3 className="text-sm font-semibold text-gray-400 border-b border-white/10 pb-1 mb-2">
                              {dateLabel}
                            </h3>
                            {logs.map((p, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-3 border-b border-white/5 py-2 text-sm text-gray-300"
                              >
                                <img
                                  src={p.icon || '/logo.png'}
                                  alt="avatar"
                                  className="w-10 h-10 rounded-md border border-white/10 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-center flex-wrap">
                                    <span className="text-blue-400 font-semibold truncate">
                                      {p.username}
                                    </span>
                                    <span className="text-xs text-gray-400 font-mono truncate">
                                      {p.playerId}
                                    </span>
                                  </div>
                                  <p className="text-xs mt-1">
                                    <span className="text-green-400 font-semibold">
                                      🟢 Joined:
                                    </span>{' '}
                                    {p.joined
                                      ? new Date(p.joined).toLocaleString('en-GB', {
                                          timeZone: 'Europe/London',
                                        })
                                      : '—'}
                                  </p>
                                  {p.left ? (
                                    <p className="text-xs text-red-400 font-semibold">
                                      🔴 Left:{' '}
                                      {new Date(p.left).toLocaleString('en-GB', {
                                        timeZone: 'Europe/London',
                                      })}
                                    </p>
                                  ) : (
                                    <p className="text-xs text-green-400">
                                      🟢 Still Online
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}

                        {Object.keys(
                          groupByDate(
                            players
                              .filter((p) => {
                                if (logFilter === 'online') return !p.left;
                                if (logFilter === 'date' && logDate)
                                  return (
                                    p.joined &&
                                    new Date(p.joined).toISOString().slice(0, 10) ===
                                      logDate
                                  );
                                return true;
                              })
                              .filter((p) =>
                                [p.username, p.playerId].some((val) =>
                                  val
                                    ?.toLowerCase()
                                    .includes(logSearch.toLowerCase())
                                )
                              )
                          )
                        ).length === 0 && (
                          <p className="text-gray-400 text-sm text-center mt-4">
                            No matching logs found.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* Moderation Audit Log panel */}
            <section className="mt-8 bg-[#283335]/90 border border-white/10 rounded-xl p-4 shadow-md">
              <h2 className="text-xl font-semibold mb-3">
                Moderation Audit Log (this server)
              </h2>
              {modLogs.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No moderation actions recorded for this server yet.
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto no-scrollbar text-sm">
                  <table className="w-full text-left text-xs md:text-sm border-collapse">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="p-2">Time</th>
                        <th className="p-2">Action</th>
                        <th className="p-2">Target</th>
                        <th className="p-2">Moderator</th>
                        <th className="p-2">Scope</th>
                        <th className="p-2">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modLogs.map((log) => (
                        <tr key={log._id} className="border-b border-white/10">
                          <td className="p-2 text-white/70">
                            {new Date(log.createdAt).toLocaleString('en-GB', {
                              timeZone: 'Europe/London',
                            })}
                          </td>
                          <td className="p-2 capitalize text-white">
                            {log.action}
                            {log.banType &&
                              log.action === 'ban' &&
                              ` (${log.banType})`}
                          </td>
                          <td className="p-2 text-blue-200">
                            {log.targetName || log.targetId}
                          </td>
                          <td className="p-2 text-emerald-200">
                            {log.moderatorName || log.moderatorId || 'Unknown'}
                          </td>
                          <td className="p-2 text-white/70">
                            {log.scope || '—'}
                          </td>
                          <td className="p-2 text-white/70">
                            {log.reason || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {/* Confirmation modal */}
        {confirmData && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] backdrop-blur">
            <div className="bg-[#1f2a2e] border border-white/10 rounded-xl p-6 w-full max-w-sm text-white shadow-xl">
              <h2 className="text-xl font-bold mb-2">{confirmData.title}</h2>
              <p className="text-white/70 mb-4">{confirmData.message}</p>

              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700"
                  onClick={() => setConfirmData(null)}
                >
                  Cancel
                </button>

                <button
                  className="px-4 py-2 rounded bg-red-600 hover:bg-red-700"
                  onClick={async () => {
                    try {
                      await confirmData.onConfirm();
                    } finally {
                      setConfirmData(null);
                    }
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ban configuration modal (Option A) */}
        {banModalOpen && selectedPlayer && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur flex items-center justify-center z-[998]">
            <div className="bg-[#1f2a2e] border border-white/10 rounded-xl p-6 w-full max-w-md text-white shadow-xl">
              <h2 className="text-xl font-bold mb-3">
                Ban {selectedPlayer.username}
              </h2>
              <p className="text-sm text-white/70 mb-4">
                Configure the ban below. Global bans use the official Roblox Ban
                API. Server-only bans are enforced by your own game scripts for
                this server only.
              </p>

              {/* Scope */}
              <div className="mb-4">
                <p className="text-xs uppercase text-white/50 mb-1">Scope</p>
                <div className="flex gap-2">
                  <button
                    className={`flex-1 px-3 py-2 rounded-md text-sm border ${
                      banForm.scope === 'global'
                        ? 'bg-red-600 border-red-500'
                        : 'bg-white/5 border-white/20'
                    }`}
                    onClick={() =>
                      setBanForm((f) => ({ ...f, scope: 'global' }))
                    }
                  >
                    Global (All servers)
                  </button>
                  <button
                    className={`flex-1 px-3 py-2 rounded-md text-sm border ${
                      banForm.scope === 'server'
                        ? 'bg-blue-600 border-blue-500'
                        : 'bg-white/5 border-white/20'
                    }`}
                    onClick={() =>
                      setBanForm((f) => ({ ...f, scope: 'server' }))
                    }
                  >
                    This server only
                  </button>
                </div>
              </div>

              {/* Ban type (only relevant for global) */}
              {banForm.scope === 'global' && (
                <div className="mb-4">
                  <p className="text-xs uppercase text-white/50 mb-1">
                    Global ban type
                  </p>
                  <div className="flex gap-2">
                    <button
                      className={`flex-1 px-3 py-2 rounded-md text-sm border ${
                        banForm.banType === 'permanent'
                          ? 'bg-red-700 border-red-500'
                          : 'bg-white/5 border-white/20'
                      }`}
                      onClick={() =>
                        setBanForm((f) => ({ ...f, banType: 'permanent' }))
                      }
                    >
                      Permanent
                    </button>
                    <button
                      className={`flex-1 px-3 py-2 rounded-md text-sm border ${
                        banForm.banType === 'temporary'
                          ? 'bg-amber-600 border-amber-500'
                          : 'bg-white/5 border-white/20'
                      }`}
                      onClick={() =>
                        setBanForm((f) => ({ ...f, banType: 'temporary' }))
                      }
                    >
                      Temporary
                    </button>
                  </div>

                  {banForm.banType === 'temporary' && (
                    <div className="flex items-center gap-2 mt-3">
                      <input
                        type="number"
                        min={1}
                        value={banForm.durationValue}
                        onChange={(e) =>
                          setBanForm((f) => ({
                            ...f,
                            durationValue: e.target.value,
                          }))
                        }
                        className="w-20 px-2 py-1 rounded bg-[#283335] border border-white/30 text-sm"
                      />
                      <select
                        value={banForm.durationUnit}
                        onChange={(e) =>
                          setBanForm((f) => ({
                            ...f,
                            durationUnit: e.target.value,
                          }))
                        }
                        className="px-2 py-1 rounded bg-[#283335] border border-white/30 text-sm"
                      >
                        <option className="bg-black" value="minutes">
                          minutes
                        </option>
                        <option className="bg-black" value="hours">
                          hours
                        </option>
                        <option className="bg-black" value="days">
                          days
                        </option>
                      </select>
                      <span className="text-xs text-white/60">
                        (Roblox Ban API expiry)
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Reason */}
              <div className="mb-4">
                <p className="text-xs uppercase text-white/50 mb-1">Reason</p>
                <textarea
                  rows={3}
                  maxLength={250}
                  value={banForm.reason}
                  onChange={(e) =>
                    setBanForm((f) => ({ ...f, reason: e.target.value }))
                  }
                  placeholder="Required. This will be stored in the audit log and (for global bans) in the Roblox restriction metadata."
                  className="w-full bg-[#283335] border border-white/30 rounded-md px-3 py-2 text-sm resize-none"
                />
                <p className="text-[11px] text-white/40 mt-1">
                  {banForm.reason.length}/250 characters
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700 text-sm"
                  onClick={() => setBanModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-sm font-semibold"
                  disabled={!banForm.reason.trim()}
                  onClick={async () => {
                    if (!banForm.reason.trim()) return;

                    try {
                      if (banForm.scope === 'server') {
                        await handleServerBan(banForm.reason.trim());
                      } else {
                        await handleGlobalBan(banForm.reason.trim());
                      }
                      setBanModalOpen(false);
                    } catch (err) {
                      console.error('Ban failed:', err);
                      alert('Failed to apply ban. Check server logs.');
                    }
                  }}
                >
                  Apply Ban
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AuthWrapper>
  );
}
