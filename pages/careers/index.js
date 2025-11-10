'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import LogoLoop from '@/components/LogoLoop';

export default function CareersPage() {
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🧩 Fetch open roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await axios.get('/api/careers/open');
        setRoles(res.data || []);
      } catch (err) {
        console.error('Failed to fetch careers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, []);

  // 🌀 Fetch Discord staff
  useEffect(() => {
    async function fetchDiscordData() {
      try {
        const res = await fetch('/api/discord/staff');
        const data = await res.json();
        setUsers(data || []);
      } catch (error) {
        console.error('Failed to fetch Discord data:', error);
      }
    }
    fetchDiscordData();
  }, []);

  // 🎡 Build LogoLoop data (convert staff into { node } objects)
  const logos = useMemo(
    () =>
      users.map((user, i) => ({
        node: (
          <div
            key={i}
            className="flex items-center bg-[#324041] px-5 py-3 rounded-xl shadow-lg border border-white/10 hover:scale-[1.05] transition-transform duration-300"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-12 h-12 rounded-full mr-4 border border-white/10"
              />
            ) : (
              <div className="w-12 h-12 rounded-full mr-4 bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 text-xs">
                No Avatar
              </div>
            )}
            <div>
              <div className="font-semibold text-white text-lg">{user.username}</div>
              <div className="text-sm text-blue-400">{user.highestRole}</div>
            </div>
          </div>
        ),
      })),
    [users]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-white">
      {/* 🏷️ Header */}
      <h1 className="text-4xl font-bold mb-10 text-center">Join Our Wonderful Team</h1>

      {/* 🌀 Discord Staff Scroller */}
      <div className="bg-[#283335] rounded-2xl p-6 shadow-lg border border-white/10 mb-16">
        {logos.length > 0 ? (
          <LogoLoop
            logos={logos} // ✅ correct prop name + shape
            speed={120}
            direction="left"
            fadeOut
            fadeOutColor="rgb(15,23,42)"
            scaleOnHover
            className="max-w-6xl mx-auto rounded-2xl"
          />
        ) : (
          <p className="text-center text-white/50">Loading Discord members...</p>
        )}
      </div>

      {/* 🧩 Open Roles Section */}
      <section className="mt-12">
        {loading ? (
          <p className="text-center text-white/70">Loading open positions...</p>
        ) : roles.length === 0 ? (
          <p className="text-center text-white/70">
            No roles are currently open. Please check back later.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div
                key={role._id}
                className="bg-[#324041] p-6 rounded-xl border border-white/10 hover:shadow-lg transition hover:scale-[1.02]"
              >
                <h2 className="text-xl font-semibold mb-2">{role.title}</h2>
                <p className="text-sm text-white/70 line-clamp-3">
                  {role.description || 'No description provided.'}
                </p>
                <div className="mt-4">
                  <Link
                    href={`/careers/apply/${role._id}`}
                    className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold"
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
