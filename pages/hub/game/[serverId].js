'use server';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from "framer-motion";
import axios from 'axios';
import { Loader2, Users, MessageSquare, Search, Link2, Ban, VolumeX, Volume2, LogOut, Copy, Clock, ArrowLeftIcon, BrushCleaning } from 'lucide-react';
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
        icon: 'https://yapton.vercel.app/cdn/image/black_logo.png',
        rank: 0,
        role: 'Automation',
      };
    }
  }

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
            };
          })
        );

        setServerMeta((prev) =>
          JSON.stringify(prev) === JSON.stringify(metaRes.data) ? prev : metaRes.data
        );
        setPlayers((prev) => {
          const sameLength = prev.length === playersData.length;
          const unchanged = sameLength && prev.every((p, i) => p.playerId === playersData[i].playerId && p.left === playersData[i].left);
          return unchanged ? prev : playersData;
        });
        setChatLogs((prev) =>
          JSON.stringify(prev) === JSON.stringify(chatData) ? prev : chatData
        );
      } catch (err) {
        console.error("Background update failed:", err);
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


  return (
    <AuthWrapper requiredRole="hub">
      <main className="text-white px-6 py-3">
        <div className="relative bg-[#283335]/80 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 mb-3">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 relative z-10">
            <div>
              <p className="text-sm mt-1 font-mono">
                <a href="/hub/game/" className='text-gray-300 underline hover:text-blue-400 transition'>View All Servers</a>
                {" "}
                |{" "}Join The Server:{" "}
                <a
                  href={`roblox://placeId=112732882456453&launchData={"jobId":"${serverId}"}`}
                  className="text-gray-300 underline hover:text-blue-400 transition"
                >
                  {serverId}
                </a>{" "}
                |{" "}
                <a
                  href={`https://www.roblox.com/games/5883938795/UPDATE-Yapton-and-District`}
                  className="text-gray-300 underline hover:text-blue-400 transition"
                >
                  Join The Game
                </a>
              </p>

              {serverMeta && (
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:gap-6 text-sm text-gray-400">
                  <p>
                    <span className="text-gray-500">🕒 Started:</span>{" "}
                    <span className="text-gray-300">
                      {new Date(serverMeta.createdAt).toLocaleString("en-GB", {
                        timeZone: "Europe/London",
                      })}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-500">🔁 Updated:</span>{" "}
                    <span className="text-gray-300">
                      {new Date(serverMeta.updatedAt).toLocaleString("en-GB", {
                        timeZone: "Europe/London",
                      })}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 items-end">
              <button
                onClick={async () => {
                  if (!confirm("Are you sure you want to flag this server?")) return;
                  try {
                    await axios.post(`/api/game/servers/${serverId}/flag`, {
                      flagged: true,
                    });
                    alert("Server flagged for review.");
                  } catch (err) {
                    console.error(err);
                    alert("Failed to flag server.");
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
                  className="w-72 bg-white/10 border border-white/10 text-sm text-gray-200 rounded-md px-3 py-[6px] focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400 transition"
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      const msg = e.target.value.trim();
                      if (!msg) return;
                      await axios.post(`/api/game/servers/${serverId}/post`, {
                        message: msg,
                        author: "Admin Notice",
                        type: "notification",
                      });
                      e.target.value = "";
                      alert("Notification sent!");
                    }
                  }}
                />
                <button
                  onClick={async () => {
                    const input = document.getElementById("notification");
                    const msg = input?.value?.trim();
                    if (!msg) return;
                    await axios.post(`/api/game/servers/${serverId}/post`, {
                      message: msg,
                      author: "Admin Notice",
                      type: "notification",
                    });
                    input.value = "";
                    alert("Notification sent!");
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
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex flex-col min-h-[575px]">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Users size={20} /> Player Console (
                {selectedPlayer?.username ? selectedPlayer.username : "Select A Player"})
              </h2>

              <div className="mt-3 bg-[#283335]/80 backdrop-blur-md border border-white/10 rounded-lg p-4 flex flex-col justify-between flex-1 max-h-[250px]">
                {selectedPlayer ? (
                  <>
                    <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedPlayer.icon || "/logo.png"}
                          alt="avatar"
                          className="w-10 h-10 rounded-md"
                        />
                        <div>
                          <h3 className="text-lg font-semibold text-white flex items-center gap-2 flex-wrap">
                            {selectedPlayer.username}
                            <span className="text-sm text-gray-400">
                              {selectedPlayer.role} ({selectedPlayer.rank}) • Team: {selectedPlayer.team}
                            </span>
                            <span
                              className="text-blue-400 cursor-pointer text-xs"
                              onClick={() =>
                                navigator.clipboard.writeText(selectedPlayer.playerId)
                              }
                            >
                              {selectedPlayer.playerId}
                            </span>
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Joined:{" "}
                            {selectedPlayer.joined
                              ? new Date(selectedPlayer.joined).toLocaleString("en-GB", {
                                timeZone: "Europe/London",
                              })
                              : "—"}
                            {selectedPlayer.left && (
                              <>
                                {" "}• Left:{" "}
                                {new Date(selectedPlayer.left).toLocaleString("en-GB", {
                                  timeZone: "Europe/London",
                                })}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2 ml-auto">
                        <button
                          onClick={async () => {
                            await axios.post(`/api/game/servers/${serverId}/commands`, {
                              type: "kick",
                              targetId: selectedPlayer.playerId,
                              reason: "Kicked by web admin",
                              issuedBy: "Web Dashboard",
                            });
                          }}
                          title="Kick Player"
                          className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-md hover:bg-yellow-500/30 transition text-sm"
                        >
                          <LogOut className="text-yellow-400" size={16} /> Kick
                        </button>

                        <button
                          onClick={async () => {
                            await axios.post(`/api/game/servers/${serverId}/commands`, {
                              type: "ban",
                              targetId: selectedPlayer.playerId,
                              reason: "Banned by web admin",
                              issuedBy: "Web Dashboard",
                            });
                          }}
                          title="Ban Player"
                          className="flex items-center gap-1 px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-md hover:bg-red-500/30 transition text-sm"
                        >
                          <Ban className="text-red-400" size={16} /> Ban
                        </button>

                        <button
                          onClick={async () => {
                            await axios.post(`/api/game/servers/${serverId}/commands`, {
                              type: "mute",
                              targetId: selectedPlayer.playerId,
                              reason: "Muted by web admin",
                              issuedBy: "Web Dashboard",
                            });
                          }}
                          title="Mute Player"
                          className="flex items-center gap-1 px-3 py-1 bg-orange-500/20 border border-orange-500/40 rounded-md hover:bg-orange-500/30 transition text-sm"
                        >
                          <VolumeX className="text-orange-400" size={16} /> Mute
                        </button>

                        <button
                          onClick={async () => {
                            await axios.post(`/api/game/servers/${serverId}/commands`, {
                              type: "unmute",
                              targetId: selectedPlayer.playerId,
                              reason: "Unmuted by web admin",
                              issuedBy: "Web Dashboard",
                            });
                          }}
                          title="Unmute Player"
                          className="flex items-center gap-1 px-3 py-1 bg-green-500/20 border border-green-500/40 rounded-md hover:bg-green-500/30 transition text-sm"
                        >
                          <Volume2 className="text-green-400" size={16} /> Unmute
                        </button>

                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedPlayer.playerId);
                          }}
                          title="Copy Player ID"
                          className="flex items-center gap-1 px-3 py-1 bg-gray-500/20 border border-gray-500/40 rounded-md hover:bg-gray-500/30 transition text-sm"
                        >
                          <Copy className="text-gray-300" size={16} /> Copy
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPlayer(null)
                          }}
                          title="Deselect Player"
                          className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 border border-blue-500/40 rounded-md hover:bg-blue-500/30 transition text-sm"
                        >
                          <BrushCleaning  className="text-gray-300" size={16} /> Deselect
                        </button>
                      </div>
                    </div>


                    <div className="flex flex-wrap gap-4 mb-3">
                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <MessageSquare size={16} className="text-blue-400" />
                        Messages:{" "}
                        {
                          chatLogs.filter(
                            (msg) => msg.playerId === selectedPlayer.playerId
                          ).length
                        }
                      </div>
                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <Clock size={16} className="text-yellow-400" />
                        Last Active:{" "}
                        {
                          (() => {
                            const lastMsg = chatLogs
                              .filter((m) => m.playerId === selectedPlayer.playerId)
                              .slice(-1)[0];
                            return lastMsg
                              ? new Date(lastMsg.time).toLocaleTimeString("en-GB", {
                                timeZone: "Europe/London",
                              })
                              : "No messages";
                          })()
                        }
                      </div>
                    </div>
                    <div
                      className="border border-white/10 rounded-md p-2 bg-[#222a2e]/40 mb-3 min-h-30 max-h-32 overflow-y-auto no-scrollbar"
                    >
                      <p className="text-xs text-gray-400 uppercase mb-1">Recent Messages</p>
                      <div className="space-y-1 text-sm text-gray-300 font-mono">
                        {chatLogs
                          .filter((m) => m.playerId === selectedPlayer.playerId)
                          .slice(-5)
                          .reverse()
                          .map((m, idx) => (
                            <div key={idx}>
                              <span className="text-gray-500">
                                [{new Date(m.time).toLocaleTimeString("en-GB", {
                                  timeZone: "Europe/London",
                                })}]
                              </span>{" "}
                              {m.chatMessage}
                            </div>
                          ))}
                        {chatLogs.filter((m) => m.playerId === selectedPlayer.playerId).length === 0 && (
                          <p className="text-gray-500 text-sm">No messages from this user.</p>
                        )}
                      </div>
                    </div>

                    <style jsx global>{`
  /* Hide scrollbar everywhere */
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none; /* IE 10+ */
    scrollbar-width: none; /* Firefox */
  }
`}</style>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 text-gray-500">
                    <Users size={32} className="mb-2 opacity-50" />
                    <p className="text-sm">Select a player to view details and actions.</p>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center mb-3 mt-3">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Users size={20} /> Players ({players.filter((p) => !p.left).length})
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
                      {players.filter((p) => !p.left).map((player) => (
                        <motion.li
                          key={player.playerId}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          onClick={() => setSelectedPlayer(player)}
                          className={`flex items-center justify-between border-b border-white/10 pb-2 cursor-pointer hover:bg-white/5 rounded-md transition ${selectedPlayer?.playerId === player.playerId ? "bg-white/10" : ""}`}
                        >
                          <div className="m-2 flex items-center gap-3">
                            <img
                              src={player.icon || "/logo.png"}
                              alt="avatar"
                              className="w-8 h-8 rounded-md"
                            />
                            <div>
                              <p className="font-medium text-blue-400">{player.username}</p>
                              <p className="text-xs text-gray-400">
                                {player.role} ({player.rank}) — {player.playerId}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Joined:{" "}
                                {player.joined
                                  ? new Date(player.joined).toLocaleTimeString()
                                  : "—"}
                                {player.left && (
                                  <>
                                    {" "}• Left:{" "}
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
                    className="pl-8 pr-3 py-1 text-sm rounded-md bg-white/10 border border-white/10 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="bg-[#283335]/80 backdrop-blur-md border border-white/10 rounded-lg p-3 max-h-[575px] overflow-y-auto space-y-2 font-mono text-sm"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}>
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
                        className={`flex items-start gap-3 border-b border-white/10 pb-3 ${isModLog ? "bg-gradient-to-r from-blue-900/30 to-blue-800/10" : ""
                          }`}
                      >
                        <img
                          src={msg.icon || "/logo.png"}
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
                                  ? new Date(msg.time).toLocaleTimeString("en-GB", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                    hour12: true,
                                    timeZone: "Europe/London",
                                  })
                                  : ""}
                              </span>
                            </div>
                          )}
                          {!isModLog && (
                            <p className="text-gray-200 text-sm mt-1">{msg.chatMessage}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

              </div>
            </div>
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
                      <div className="flex items-center bg-white/10 border border-white/10 rounded-md px-2 py-1 text-sm text-gray-300">
                        <label className="mr-2 text-gray-400">View:</label>
                        <select
                          value={logFilter}
                          onChange={(e) => setLogFilter(e.target.value)}
                          className="bg-transparent outline-none"
                        >
                          <option className="text-white bg-black" value="all">All</option>
                          <option className="text-white bg-black" value="online">Online Only</option>
                          <option className="text-white bg-black" value="date">Specific Date</option>
                        </select>
                      </div>

                      {logFilter === 'date' && (
                        <input
                          type="date"
                          value={logDate}
                          onChange={(e) => setLogDate(e.target.value)}
                          className="bg-white/10 border border-white/10 rounded-md px-2 py-1 text-sm text-gray-200 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      )}

                      <div className="relative flex-1 min-w-[200px]">
                        <Search size={16} className="absolute left-2 top-2.5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by username or ID..."
                          value={logSearch}
                          onChange={(e) => setLogSearch(e.target.value)}
                          className="pl-8 pr-3 py-1.5 w-full text-sm rounded-md bg-white/10 border border-white/10 focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-400"
                        />
                      </div>
                    </div>

                    <div className="overflow-y-auto flex-1 border border-white/10 rounded-md p-3 bg-[#222a2e]/40">
                      <style jsx global>{` `}</style>
                      {Object.entries(
                        groupByDate(
                          players
                            .filter((p) => {
                              if (logFilter === 'online') return !p.left;
                              if (logFilter === 'date' && logDate)
                                return p.joined && new Date(p.joined).toISOString().slice(0, 10) === logDate;
                              return true;
                            })
                            .filter((p) =>
                              [p.username, p.playerId].some((val) =>
                                val?.toLowerCase().includes(logSearch.toLowerCase())
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
                                  <span className="text-blue-400 font-semibold truncate">{p.username}</span>
                                  <span className="text-xs text-gray-400 font-mono truncate">{p.playerId}</span>
                                </div>
                                <p className="text-xs mt-1">
                                  <span className="text-green-400 font-semibold">🟢 Joined:</span>{' '}
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
                                  <p className="text-xs text-green-400">🟢 Still Online</p>
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
                                return p.joined && new Date(p.joined).toISOString().slice(0, 10) === logDate;
                              return true;
                            })
                            .filter((p) =>
                              [p.username, p.playerId].some((val) =>
                                val?.toLowerCase().includes(logSearch.toLowerCase())
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
        )}
      </main>
    </AuthWrapper>
  );
}
