'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Image from 'next/image';

export default function OperatorPage() {
  const router = useRouter();
  const { slug } = router.query;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [stops, setStops] = useState([]);

  // 🧩 Load operator
  useEffect(() => {
    if (!slug) return;
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

  // 🚏 Load stops for origin/destination names
  useEffect(() => {
    async function loadStops() {
      try {
        const res = await fetch('/api/ycc/stops');
        const json = await res.json();
        setStops(json.stops || []);
      } catch (e) {
        console.error('Failed to load stops', e);
      }
    }
    loadStops();
  }, []);

  // 🚌 Load routes for this operator
  useEffect(() => {
    if (!data?.operator?.operatorName) return;
    const name = data.operator.operatorName;

    async function loadRoutesForOperator() {
      setRoutesLoading(true);
      try {
        const res = await fetch(`/api/ycc/routes?q=${encodeURIComponent(name)}`);
        const json = await res.json();
        const all = json.routes || [];

        // Filter whether operator is array or string
        const filtered = all.filter((r) => {
          const op = r.operator;
          if (Array.isArray(op)) return op.includes(name);
          return op === name;
        });

        setRoutes(filtered);
      } catch (e) {
        console.error('Failed to load routes for operator', e);
        setRoutes([]);
      } finally {
        setRoutesLoading(false);
      }
    }

    loadRoutesForOperator();
  }, [data?.operator?.operatorName]);

  if (loading) return <p className="text-white p-6">Loading...</p>;
  if (!data) return <p className="text-white p-6">Operator not found.</p>;

  const { operator, robloxGroup } = data;

  const getStopName = (stopId) => {
    const s = stops.find((x) => x.stopId === stopId);
    return s ? `${s.name}${s.town ? ', ' + s.town : ''}` : stopId;
  };

  return (
    <main className="max-w-10xl mx-auto p-6 text-white grid md:grid-cols-2 gap-6 max-h-[7">
      {/* LEFT — Operator Info + Roblox Group */}
      <div className="flex flex-col gap-6">
        {/* Operator Info */}
        <div className="bg-[#283335] p-5 rounded-xl flex flex-col md:flex-row items-center md:items-start gap-6">
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
              <p>
                <strong>Roblox:</strong> {operator.robloxUsername || 'Unknown'}
              </p>
              <p>
                <strong>Discord:</strong> {operator.discordTag || 'Unknown'}
              </p>
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
          <div className="bg-[#283335] rounded-xl p-5">
            <h2 className="text-xl font-semibold mb-3">Roblox Group</h2>
            <p>
              <strong>Name:</strong> {robloxGroup.name}
            </p>
            <p>
              <strong>Members:</strong> {robloxGroup.memberCount}
            </p>
            <p>
              <strong>Description:</strong>{' '}
              {robloxGroup.description || 'No description'}
            </p>
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

      {/* RIGHT — Routes operated by this operator */}
      <div className="bg-[#283335] rounded-xl p-5">
        <h2 className="text-xl font-semibold mb-3">
          Routes operated by {operator.operatorName}
        </h2>

        {routesLoading ? (
          <p className="text-white/70">Loading routes…</p>
        ) : routes.length === 0 ? (
          <p className="text-white/60">No routes found for this operator.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {routes.map((r) => {
              const forwardCount = r.stops?.forward?.length || 0;
              const backwardCount = r.stops?.backward?.length || 0;
              const hasDiversion = r.diversion?.active;

              return (
                <a
                  key={r._id}
                  href={`/ycc/routes/${r._id}`}
                  className={`relative backdrop-blur border border-white/20 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200 ${
                    hasDiversion
                      ? 'bg-orange-900/30 ring-2 ring-orange-500/40'
                      : 'bg-white/5'
                  }`}
                >
                  <h3 className="text-lg font-semibold mb-1">
                    {r.number}
                    {hasDiversion && (
                      <span className="ml-2 text-yellow-400 text-sm">
                        ⚠️ Diversion
                      </span>
                    )}
                  </h3>
                  <p className="text-white/80">
                    {getStopName(r.origin)} → {getStopName(r.destination)}
                  </p>
                  <p className="text-white/50 text-sm mt-1">
                    Stops: {forwardCount} → {backwardCount}
                  </p>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
