'use client';

import { useEffect, useState } from 'react';

export default function RoutesView() {
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const [resRoutes, resStops] = await Promise.all([
          fetch('/api/ycc/routes'),
          fetch('/api/ycc/stops'),
        ]);

        if (!resRoutes.ok) throw new Error('Failed to fetch route data');
        if (!resStops.ok) throw new Error('Failed to fetch stop data');

        const routesData = await resRoutes.json();
        const stopsData = await resStops.json();

        setStops(stopsData.stops || []);
        setRoutes(routesData.routes || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  const getStopName = (stopId) => {
    const stop = stops.find((s) => s.stopId === stopId || s.id === stopId);
    return stop ? stop.name : stopId; // fallback to ID if not found
  };

  return (
    <main className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">Operator Routes</h1>

      {loading && <p className="text-white/60">Loading routes...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!loading && routes.length === 0 && (
        <p className="text-white/60">No routes found for this operator.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {routes.map((route, index) => (
          <div
            key={index}
            className="bg-black/50 backdrop-blur border border-white/20 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <a href={`/ycc/routes/${route.routeId}`}>
              <h2 className="text-xl font-semibold">
                {route.number || `Route ${index + 1}`}
              </h2>
              <p className="text-white/70">
                Origin: {getStopName(route.origin)}
              </p>
              <p className="text-white/70">
                Destination: {getStopName(route.destination)}
              </p>
              <p className="text-white/50 text-sm mt-2">
                Stops: {route.stops?.length ?? 0}
              </p>
            </a>
          </div>
        ))}
      </div>
    </main>
  );
}
