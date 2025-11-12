'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';

export default function OperatorPage() {
  const router = useRouter();
  const { slug } = router.query;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [disruptions, setDisruptions] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [operators, setOperators] = useState([]);


  // 🧩 Load all operators
  useEffect(() => {
    async function loadOperators() {
      try {
        const res = await fetch('/api/ycc/operators/active');
        const json = await res.json();
        setOperators(json.submissions || json || []);
      } catch (e) {
        console.error('Failed to load operators', e);
      }
    }
    loadOperators();
  }, []);

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

  // 🚏 Load stops
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

  // ⚠️ Load disruptions
  useEffect(() => {
    async function loadDisruptions() {
      try {
        const res = await fetch('/api/ycc/travel');
        const json = await res.json();
        setDisruptions(json.disruptions || []);
      } catch (e) {
        console.error('Failed to load disruptions', e);
      }
    }
    loadDisruptions();
  }, []);

  useEffect(() => {
    if (!data?.operator?._id) return;
    const operatorId = data.operator._id;

    async function loadRoutesForOperator() {
      setRoutesLoading(true);
      try {
        const res = await fetch(`/api/ycc/routes`);
        const json = await res.json();
        const all = json.routes || [];

        const filtered = all.filter((r) => {
          const op = r.operator;
          if (Array.isArray(op)) return op.includes(operatorId);
          return op === operatorId;
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
  }, [data?.operator?._id]);

  const getStopName = (stopId) => {
    const s = stops.find((x) => x.stopId === stopId);
    return s ? `${s.name}${s.town ? ', ' + s.town : ''}` : stopId;
  };

  // 🚨 Disruptions affecting this route
  const getRouteDisruptions = (route) => {
    return disruptions.filter((d) => {
      if (d.affectedRoutes?.includes(route._id) || d.affectedRoutes?.includes(route.routeId)) return true;
      const allStops = [
        ...(route.stops?.forward || []),
        ...(route.stops?.backward || []),
        route.origin,
        route.destination,
      ].filter(Boolean);
      return d.affectedStops?.some((sid) => allStops.includes(sid));
    });
  };

  const isSharedRoute = (route, operatorId) => {
    const op = route.operator;
    if (!op) return false;
    if (Array.isArray(op))
      return op.length > 1 || (op.includes(operatorId) && op.some((o) => o !== operatorId));
    return false;
  };

  if (loading) return <p className="text-white p-6">Loading...</p>;
  if (!data) return <p className="text-white p-6">Operator not found.</p>;

  const { operator, robloxGroup } = data;

  return (
    <main className="max-w-10xl mx-auto p-6 text-white grid md:grid-cols-2 gap-6">
      {/* LEFT — Operator Info */}
      <div className="flex flex-col gap-6">
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

        {robloxGroup && (
          <div className="bg-[#283335] rounded-xl p-5">
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

      {/* RIGHT — Routes */}
      <div className="bg-[#283335] rounded-xl p-5 relative">
        <h2 className="text-xl font-semibold mb-3">
          Routes operated by {operator.operatorName}
        </h2>

        {routesLoading ? (
          <p className="text-white/70">Loading routes…</p>
        ) : routes.length === 0 ? (
          <p className="text-white/60">No routes found for this operator.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 relative">
            {routes.map((r) => {
              const forwardCount = r.stops?.forward?.length || 0;
              const backwardCount = r.stops?.backward?.length || 0;
              const hasDiversion = r.diversion?.active;
              const disruptionsForRoute = getRouteDisruptions(r);
              const affected = disruptionsForRoute.length > 0;
              const shared = isSharedRoute(r, operator._id);
              const operatorText = Array.isArray(r.operator)
                ? r.operator
                  .map((id) => operators.find((o) => o._id === id)?.operatorName || 'Unknown')
                  .join(', ')
                : operators.find((o) => o._id === r.operator)?.operatorName || 'Unknown';


              return (
                <div key={r._id} className="relative group">
                  <a
                    href={`/ycc/routes/${r._id}`}
                    className={`block backdrop-blur border border-white/20 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200 ${affected
                      ? 'bg-red-900/30 ring-2 ring-red-500/40'
                      : hasDiversion
                        ? 'bg-orange-900/30 ring-2 ring-orange-500/40'
                        : shared
                          ? 'bg-blue-900/30 ring-2 ring-blue-500/40'
                          : 'bg-white/5'
                      }`}
                  >
                    <h3 className="text-lg font-semibold mb-1 flex items-center justify-between">
                      <span>
                        {r.number}
                        {hasDiversion && (
                          <span className="ml-2 text-yellow-400 text-sm">⚠️ Diversion</span>
                        )}
                        {shared && (
                          <span className="ml-2 text-blue-400 text-sm">🤝 Shared Route</span>
                        )}
                      </span>
                      {affected && (
                        <span className="text-red-400 text-sm font-medium">
                          🚧 {disruptionsForRoute.length} Issue
                          {disruptionsForRoute.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </h3>

                    <p className="text-white/80">
                      {getStopName(r.origin)} → {getStopName(r.destination)}
                    </p>
                    <p className="text-white/50 text-sm mt-1">
                      Stops: {forwardCount} → {backwardCount}
                    </p>
                    <p className="text-white/60 text-xs mt-1 italic">
                      Operated by {operatorText}
                    </p>
                  </a>

                  {/* 🧠 Floating tooltip with clickable disruptions */}
                  {affected && (
                    <div className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto bg-black/90 border border-white/10 text-white text-sm p-3 rounded-lg w-64 backdrop-blur-md shadow-lg">
                      <p className="font-semibold mb-1 text-red-400">Disruptions:</p>
                      <ul className="list-disc list-inside text-white/80 space-y-1">
                        {disruptionsForRoute.map((d) => (
                          <li key={d._id}>
                            <Link
                              href={`/ycc/travel/${d._id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:text-yellow-300"
                            >
                              {d.incidentName || 'Unnamed incident'}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
