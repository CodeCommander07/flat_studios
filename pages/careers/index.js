'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

export default function CareersPage() {
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch open roles
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

  // Fetch Discord users for scroller
  useEffect(() => {
    async function fetchDiscordData() {
      try {
        const serverId = '733620693392162866'; // Replace with your server ID
        const res = await fetch(`https://api.yapton-and-district.flatstudios.net/server/${serverId}`);
        const data = await res.json();
        // Duplicate users multiple times to allow seamless loop
        setUsers([...data, ...data, ...data, ...data]);
      } catch (error) {
        console.error('Failed to fetch Discord data:', error);
      }
    }
    fetchDiscordData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 text-white">
      <h1 className="text-4xl font-bold mb-8 text-center">Join Our Wonderful Team</h1>

      {/* 🌀 Discord User Scroller */}
      <div className="relative w-full overflow-hidden flex items-center h-[120px]">
        <div
          className="flex gap-5 whitespace-nowrap animate-scroll-smooth"
          style={{
            animationDuration: `${users.length * 1.5}s`, // Adjust speed dynamically
          }}
        >
          {users.map((user, i) => (
            <div
              key={i}
              className="flex items-center bg-[#283335] px-5 py-2 rounded-xl shadow-lg flex-shrink-0"
            >
              <img
                src={user.avatar}
                alt={user.username}
                className="w-12 h-12 rounded-full mr-4"
              />
              <div>
                <div className="font-semibold text-white text-lg">{user.username}</div>
                <div className="text-sm text-blue-400">{user.highestRole}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ✨ Keyframes for smooth infinite scroll */}
      <style jsx>{`
        @keyframes scroll-smooth {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll-smooth {
          animation: scroll-smooth linear infinite;
        }
      `}</style>

      {/* 🧩 Open Roles Section */}
      <div className="mt-12">
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
                className="bg-white/10 p-6 rounded-xl border border-white/10 hover:shadow-lg transition"
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
      </div>
    </div>
  );
}
