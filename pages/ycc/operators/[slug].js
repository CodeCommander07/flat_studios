'use client'; // not required but for clarity
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Image from 'next/image';

export default function OperatorPage() {
  const router = useRouter();
  const { slug } = router.query;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return; // Wait until slug is available
    async function loadOperator() {
      try {
        const res = await axios.get(`/api/ycc/operators/${slug}`);
        setData(res.data);
      } catch (err) {
        console.error('Failed to load operator:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOperator();
  }, [slug]);

  if (loading) return <p className="text-white p-6">Loading...</p>;
  if (!data) return <p className="text-white p-6">Operator not found.</p>;

  const { operator, robloxGroup } = data;

  return (
    <div className="max-w-7xl mx-auto p-6 text-white">
      {/* Header */}
      <div className=" bg-[#283335] p-5 rounded-xl flex flex-col md:flex-row items-center md:items-start gap-6 mb-10">
        {operator.logo && (
          <Image
            src={operator.logo}
            alt={`${operator.operatorName} logo`}
            width={120}
            height={120}
            className="rounded-xl shadow-lg"
          />
        )}
        <div>
          <h1 className="text-3xl font-bold">{operator.operatorName}</h1>
          <p className="text-gray-300 mt-2 max-w-lg">{operator.description}</p>
          <div className="mt-4 text-sm text-gray-400 space-y-1">
            <p><strong>Roblox:</strong> {operator.robloxUsername || 'Unknown'}</p>
            <p><strong>Discord:</strong> {operator.discordTag || 'Unknown'}</p>
            {operator.discordInvite && (
              <a
                href={operator.discordInvite}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline block"
              >
                Join Discord Server
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Roblox Group */}
      {robloxGroup && (
        <div className="bg-[#283335] rounded-xl p-5 mb-8">
          <h2 className="text-xl font-semibold mb-3">Roblox Group</h2>
          <p><strong>Name:</strong> {robloxGroup.name}</p>
          <p><strong>Members:</strong> {robloxGroup.memberCount}</p>
          <p><strong>Description:</strong> {robloxGroup.description || 'No description'}</p>
          <a
            href={`https://www.roblox.com/groups/${operator.robloxGroup}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
          >
            Visit Roblox Group
          </a>
        </div>
      )}
    </div>
  );
}
