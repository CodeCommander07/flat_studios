'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Loader2, Users, MessageSquare, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function ServerDetailPage() {
const router = useRouter();
const { serverId } = router.query;
  const [players, setPlayers] = useState([]);
  const [chatLogs, setChatLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadServerData() {
      setLoading(true);
      try {
        const [playersRes, chatRes] = await Promise.all([
          axios.get(`/api/game/servers/${serverId}/players`),
          axios.get(`/api/game/servers/${serverId}/chat`),
        ]);
        setPlayers(playersRes.data || []);
        setChatLogs(chatRes.data || []);
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

  return (
    <main className="text-white px-6 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Server ID: {serverId}</h1>
        <Link
          href="/game"
          className="text-sm text-gray-300 hover:text-blue-400 flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Back to Servers
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={32} className="animate-spin text-blue-400" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Players */}
          <div>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Users size={20} /> Players
            </h2>
            <div className="bg-[#283335]/80 backdrop-blur-md border border-white/10 rounded-lg p-3 max-h-80 overflow-y-auto">
              {players.length === 0 ? (
                <p className="text-gray-400 text-sm">No players online.</p>
              ) : (
                <ul className="space-y-1">
                  {players.map((player) => (
                    <li key={player.userId} className="text-gray-200 border-b border-white/10 pb-1">
                      <span className="font-medium">{player.username}</span>{' '}
                      <span className="text-xs text-gray-400">({player.userId})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Chat Logs */}
          <div>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <MessageSquare size={20} /> Chat Logs
            </h2>
            <div className="bg-[#283335]/80 backdrop-blur-md border border-white/10 rounded-lg p-3 max-h-80 overflow-y-auto font-mono text-sm">
              {chatLogs.length === 0 ? (
                <p className="text-gray-400">No chat messages yet.</p>
              ) : (
                chatLogs.map((msg, idx) => (
                  <p key={idx}>
                    <span className="text-blue-400">{msg.username}:</span>{' '}
                    <span className="text-gray-200">{msg.message}</span>
                  </p>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
