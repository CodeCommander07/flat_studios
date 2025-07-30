'use client';

import { useEffect, useState } from 'react';

export default function RoutesView() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await fetch('/api/ycc/routes-summary');
        if (!res.ok) throw new Error('Failed to fetch route data');
        const data = await res.json();
        setRoutes(data.routes || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

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
            className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <h2 className="text-xl font-semibold">{route.name || `Route ${index + 1}`}</h2>
            <p className="text-white/70">Origin: {route.origin}</p>
            <p className="text-white/70">Destination: {route.destination}</p>
            <p className="text-white/50 text-sm mt-2">
              Stops: {route.stops?.length ?? 0}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
