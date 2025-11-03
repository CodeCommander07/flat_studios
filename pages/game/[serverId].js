'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { Loader2, Users, MessageSquare, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';

export default function ServerDetailPage() {
  const router = useRouter();
  const { serverId } = router.query;
  const [players, setPlayers] = useState([]);
  const [chatLogs, setChatLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  // 🧩 Fetch Roblox info for a user
  async function getRobloxInfo(userId) {
    try {
      const info = await axios.get(`/api/roblox/${userId}`);
      return {
        username: info.data.username,
        icon: info.data.icon,
        rank: info.data.group.rank,
        role: info.data.group.role,
      };
    } catch {
      return { username: 'System', icon: 'https://yapton.vercel.app/cdn/image/black_logo.png', rank: 0, role: 'Automation' };
    }
  }

  useEffect(() => {
    if (!serverId) return;

    async function loadServerData() {
      setLoading(true);
      try {
        const [playersRes, chatRes] = await Promise.all([
          axios.get(`/api/game/servers/${serverId}/players`),
          axios.get(`/api/game/servers/${serverId}/chat`),
        ]);

        // 🎮 Enhance player data
        const playersData = await Promise.all(
          (playersRes.data || []).map(async (p) => {
            const info = await getRobloxInfo(p.playerId);
            return {
              userId: p.playerId,
              ...info,
            };
          })
        );

        // 💬 Enhance chat messages
        const chatData = await Promise.all(
          (chatRes.data || []).map(async (msg) => {
            const info = await getRobloxInfo(msg.playerId);
            return {
              userId: msg.playerId,
              username: info.username,
              icon: info.icon,
              role: info.role,
              rank: info.rank,
              chatMessage: msg.chatMessage,
              time: msg.time,
            };
          })
        );

        setPlayers(playersData);
        setChatLogs(chatData);
      } catch (err) {
        console.error('Failed to load server data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadServerData();
    const interval = setInterval(loadServerData, 30000);
    return () => clearInterval(interval);
  }, [serverId]);

  // 🔍 Filter chat messages
  const filteredChat = useMemo(() => {
    if (!filter.trim()) return chatLogs;
    const q = filter.toLowerCase();
    return chatLogs.filter(
      (msg) =>
        msg.username.toLowerCase().includes(q) ||
        msg.chatMessage.toLowerCase().includes(q)
    );
  }, [chatLogs, filter]);

  return (
    <main className="text-white px-6 py-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        {/* Left: Title */}
        <h1 className="text-2xl font-bold">Server ID: {serverId}</h1>

        {/* Right: Button row */}
        <div className="flex flex-wrap gap-3 items-center">
          <Link
            href="/game"
            className="text-sm text-gray-300 hover:text-blue-400 flex items-center gap-1 transition"
          >
            <ArrowLeft size={16} /> Back to Servers
          </Link>

          <a
            href={`roblox://placeId=112732882456453&launchData={"jobId":"${serverId}"}`}
            className="bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-md text-sm font-medium transition"
          >
            Join Server
          </a>

          <button
            onClick={async () => {
              const msg = prompt('Enter notification message to send:');
              if (!msg) return;
              await axios.post(`/api/game/servers/${serverId}/post`, {
                message: msg,
                author: 'Admin Notice',
                type: 'notification',
              });
              alert('Notification sent!');
            }}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md text-sm font-medium transition"
          >
            Send Notification
          </button>
        </div>
      </div>


      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={32} className="animate-spin text-blue-400" />
        </div>
      ) : (

        <div className="grid md:grid-cols-2 gap-8">
          {/* 🧍 Players */}
          <div>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Users size={20} /> Players ({players.length})
            </h2>
            <div className="bg-[#283335]/80 backdrop-blur-md border border-white/10 rounded-lg p-3 max-h-96 overflow-y-auto">
              {players.length === 0 ? (
                <p className="text-gray-400 text-sm">No players online.</p>
              ) : (
                <ul className="space-y-2">
                  {players.map((player) => (
                    <li
                      key={player.userId}
                      className="flex items-center gap-3 border-b border-white/10 pb-2"
                    >
                      <img
                        src={player.icon || '/logo.png'}
                        alt="avatar"
                        className="w-8 h-8 rounded-md"
                      />
                      <div>
                        <p className="font-medium"><a href={`https://www.roblox.com/users/${player.userId}/profile`}>{player.username}</a></p>
                        <p className="text-xs text-gray-400">
                          {player.role} ({player.rank}) — {player.userId}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* 💬 Chat Logs */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <MessageSquare size={20} /> Chat Logs ({filteredChat.length})
              </h2>

              {/* 🔍 Search Filter */}
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

            <div className="bg-[#283335]/80 backdrop-blur-md border border-white/10 rounded-lg p-3 max-h-96 overflow-y-auto space-y-2 font-mono text-sm">
              {filteredChat.length === 0 ? (
                <p className="text-gray-400">No chat messages found.</p>
              ) : (
                filteredChat.map((msg, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 border-b border-white/10 pb-2"
                  >
                    <img
                      src={msg.icon || '/logo.png'}
                      alt="avatar"
                      className="w-7 h-7 rounded-md mt-0.5"
                    />
                    <div className="flex flex-1 gap-3">
                      {/* Left column: username + role stacked */}
                      <div className="flex flex-col w-32 shrink-0 leading-tight">
                        <span className="font-semibold text-blue-400"><a href={`https://www.roblox.com/users/${msg.userId}/profile`}>{msg.username}</a></span>
                        <span className="text-xs text-gray-400">{msg.role}</span>
                      </div>

                      {/* Right column: message spans both lines */}
                      <div className="flex-1">
                        <p className="text-gray-200">{msg.chatMessage}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
