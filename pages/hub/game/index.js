'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Users, Database, Clock, Flag } from 'lucide-react';
import { motion } from 'framer-motion';
import AuthWrapper from '@/components/AuthWrapper';

export default function GameListPage() {
  const [activeServers, setActiveServers] = useState([]);
  const [savedServers, setSavedServers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadServers() {
      try {
        // 🔹 Live (Roblox API)
        const liveRes = await axios.get('/api/game/servers');
        setActiveServers(liveRes.data || []);

        // 🔹 Saved (MongoDB)
        const savedRes = await axios.get('/api/game/saved');
        setSavedServers(savedRes.data || []);
      } catch (err) {
        console.error('Failed to fetch servers:', err);
      } finally {
        setLoading(false);
      }
    }

    loadServers();
    const interval = setInterval(loadServers, 60000);
    return () => clearInterval(interval);
  }, []);

  // 🧮 Calculate expiry date in days
  function getExpiryInfo(server) {
    const updated = new Date(server.updatedAt);
    const now = new Date();
    const daysPassed = (now - updated) / (1000 * 60 * 60 * 24);
    const expiryDays = server.flagged ? 90 : 14;
    const daysLeft = Math.max(0, Math.round(expiryDays - daysPassed));

    return {
      daysLeft,
      expiryDays,
    };
  }

  return (
    <AuthWrapper requiredRole="hub">
      <main className="text-white px-6 py-10 space-y-10">
        <h1 className="text-3xl font-bold mb-6 text-center">Game Server Overview</h1>

        {loading ? (
          <p className="text-center text-gray-400">Loading servers...</p>
        ) : (
          <>
            {/* 🟢 ACTIVE SERVERS */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Users size={22} className="text-green-400" /> Active Servers
              </h2>
              {activeServers.length === 0 ? (
                <p className="text-gray-500 text-sm">No servers currently active.</p>
              ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {activeServers.map((server) => (
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
                        className="block mt-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-md py-2 text-center text-sm font-medium transition"
                      >
                        View Live Data
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            {/* 📦 SAVED SERVERS */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Database size={22} className="text-blue-400" /> Saved Data Servers
              </h2>
              {savedServers.length === 0 ? (
                <p className="text-gray-500 text-sm">No saved server data available.</p>
              ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {savedServers.map((server) => {
                    const { daysLeft, expiryDays } = getExpiryInfo(server);
                    return (
                      <motion.div
                        key={server.serverId}
                        whileHover={{ scale: 1.02 }}
                        className={`bg-[#283335]/80 backdrop-blur-md border border-white/10 rounded-xl shadow-md p-5 transition relative`}
                      >
                        {/* 🔹 Flag status badge */}
                        <div className="absolute top-3 right-3">
                          {server.flagged ? (
                            <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-md">
                              <Flag size={12} /> Flagged — {daysLeft} days left
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-gray-300 bg-[#283335] border border-white/20 px-2 py-1 rounded-md">
                              <Clock size={12} /> Expires in {daysLeft} days
                            </span>
                          )}
                        </div>

                        <h2 className="text-lg font-semibold mb-1">
                          {server.serverId}
                        </h2>
                        <p className="text-sm text-gray-400 mb-1">
                          Players: {server.players?.length ?? 0}
                        </p>
                        <p className="text-xs text-gray-500 mb-2">
                          Saved on:{' '}
                          {new Date(server.updatedAt).toLocaleString('en-GB', {
                            timeZone: 'Europe/London',
                          })}
                        </p>

                        <Link
                          href={`/hub/game/review/${server.serverId}`}
                          className="block mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-md py-2 text-center text-sm font-medium transition"
                        >
                          Review Data
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </AuthWrapper>
  );
}
