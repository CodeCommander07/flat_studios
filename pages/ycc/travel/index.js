'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, Clock, TrendingUpDown, RouteOff } from 'lucide-react';

export default function TravelUpdatesPage() {
  const [disruptions, setDisruptions] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🚏 Load disruptions + routes
  useEffect(() => {
    async function loadData() {
      try {
        const [disRes, routeRes] = await Promise.all([
          axios.get('/api/ycc/travel'),
          axios.get('/api/ycc/routes'),
        ]);

        setDisruptions(disRes.data.disruptions || []);
        setRoutes(routeRes.data.routes || []);
      } catch (err) {
        console.error('Failed to load travel updates:', err);
        setError('Failed to load travel updates.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Helper: get readable route names from IDs
  const getRouteNames = (affectedRoutes) => {
    if (!affectedRoutes?.length) return 'N/A';
    const names = affectedRoutes.map((id) => {
      const route = routes.find((r) => r.routeId === id || r._id === id);
      return route ? route.number || route.name || id : id;
    });
    return names.join(', ');
  };

  // 🧩 Choose icon + color for disruption type
  const getIconAndColor = (type) => {
    const lower = (type || '').toLowerCase();
    if (lower.includes('diversion'))
      return { Icon: TrendingUpDown, color: 'text-yellow-400' };
    if (lower.includes('stop closure'))
      return { Icon: RouteOff, color: 'text-red-500' };
    return { Icon: AlertTriangle, color: 'text-yellow-400' };
  };

  if (loading)
    return (
      <main className="flex items-center justify-center min-h-screen text-white">
        <p>Loading network disruptions...</p>
      </main>
    );

  if (error)
    return (
      <main className="flex items-center justify-center min-h-screen text-red-500">
        <p>{error}</p>
      </main>
    );

  return (
    <main className="text-white px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">
          Network Travel Updates
        </h1>

        {disruptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <CheckCircle className="text-green-500 mb-4" size={48} />
            <p className="text-lg text-white/70">
              No current disruptions reported across the network.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {disruptions.map((d) => {
              const { Icon, color } = getIconAndColor(d.incidentType);
              return (
                <Link
                  href={`/ycc/travel/${d._id}`}
                  key={d._id}
                  className="block bg-[#283335]/95 border border-white/20 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:border-yellow-400/50 hover:bg-white/15 transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <h2 className={`text-xl font-semibold flex items-center gap-2 ${color}`}>
                      <Icon size={22} /> {d.incidentName}
                    </h2>
                    <p className="text-sm text-gray-400 flex items-center gap-1">
                      <Clock size={14} /> Last updated:{' '}
                      {new Date(d.incidentUpdated).toLocaleString()}
                    </p>
                  </div>

                  <p className="mt-3 text-white/80 leading-relaxed">
                    {d.incidentDescription}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3 text-sm">
                    {d.affectedRoutes?.length > 0 && (
                      <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full border border-yellow-400/30">
                        <strong>Affected Routes:</strong> {getRouteNames(d.affectedRoutes)}
                      </span>
                    )}
                    {d.affectedStops?.length > 0 && (
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full border border-blue-400/30">
                        <strong>Affected Stops:</strong> {d.affectedStops.length}
                      </span>
                    )}
                    <span className="px-3 py-1 bg-white/10 text-white/70 rounded-full border border-white/20">
                      Type: {d.incidentType}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
