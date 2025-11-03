'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { motion } from 'framer-motion';
import AuthWrapper from '@/components/AuthWrapper';

export default function GameListPage() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadServers() {
      try {
        const res = await axios.get('/api/game/servers');
        setServers(res.data || []);
      } catch (err) {
        console.error('Failed to fetch servers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadServers();
    const interval = setInterval(loadServers, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthWrapper requiredRole="hub">
    <main className="text-white px-6 py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">Active Game Servers</h1>

      {loading ? (
        <p className="text-center text-gray-400">Loading servers...</p>
      ) : servers.length === 0 ? (
        <p className="text-center text-gray-400">No servers available.</p>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {servers.map((server) => (
            <motion.div
              key={server.serverId}
              whileHover={{ scale: 1.02 }}
              className="bg-[#283335]/80 backdrop-blur-md border border-white/10 rounded-xl shadow-md p-5 transition"
            >
              <h2 className="text-lg font-semibold mb-1">
                Server {server.serverId}
              </h2>
              <p className="text-sm text-gray-400 mb-3">
                Region: {server.region || 'Unknown'}
              </p>
              <p className="text-sm flex items-center gap-1 text-gray-300">
                <Users size={16} /> {server.players ?? 0} players
              </p>
              <Link
                href={`/hub/game/${server.serverId}`}
                className="block mt-3 bg-blue-600 hover:bg-blue-700 rounded-md py-2 text-center text-sm font-medium transition"
              >
                View Server
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </main>
    </AuthWrapper>
  );
}
