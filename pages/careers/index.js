'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

export default function CareersPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 text-white">
      <h1 className="text-4xl font-bold mb-8 text-center">Join Our Team</h1>

      {loading ? (
        <p className="text-center text-white/70">Loading open positions...</p>
      ) : roles.length === 0 ? (
        <p className="text-center text-white/70">No roles are currently open. Please check back later.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div key={role._id} className="bg-white/10 p-6 rounded-xl border border-white/10 hover:shadow-lg transition">
              <h2 className="text-xl font-semibold mb-2">{role.title}</h2>
              <p className="text-sm text-white/70 line-clamp-3">{role.description || 'No description provided.'}</p>

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
  );
}
