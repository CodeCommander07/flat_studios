'use client';

import { useEffect, useState } from 'react';

export default function RoutesView() {
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
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
        setFilteredRoutes(routesData.routes || []);
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
    return stop ? stop.name : stopId;
  };

  useEffect(() => {
    const term = searchTerm.toLowerCase();

    const filtered = routes.filter((route) => {
      const originName = getStopName(route.origin)?.toLowerCase() || '';
      const destName = getStopName(route.destination)?.toLowerCase() || '';
      const routeNumber = route.number?.toLowerCase() || '';
      const stopNames = route.stops
        ?.map((id) => getStopName(id)?.toLowerCase() || '')
        .join(' ') || '';

      return (
        routeNumber.includes(term) ||
        originName.includes(term) ||
        destName.includes(term) ||
        stopNames.includes(term)
      );
    });

    setFilteredRoutes(filtered);
  }, [searchTerm, routes, stops]);

  return (
    <main className="p-6 text-white bg-gradient-to-b from-gray-900 via-black to-gray-900 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold">Operator Routes</h1>
        <input
          type="text"
          placeholder="Search by route, stop, origin, or destination..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-white/10 border border-white/20 backdrop-blur-md text-white placeholder-white/50 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-80"
        />
      </div>

      {loading && <p className="text-white/60">Loading routes...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!loading && filteredRoutes.length === 0 && (
        <p className="text-white/60">No routes found for this operator.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRoutes.map((route, index) => (
          <div
            key={index}
            className="bg-black/50 backdrop-blur border border-white/20 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <a href={`/ycc/routes/${route.routeId}`}>
              <h2 className="text-xl font-semibold">
                {route.number || `Route ${index + 1}`}
              </h2>
              <p className="text-white/70">
                Origin: {route.origin ? getStopName(route.origin) : " "}
              </p>
              <p className="text-white/70">
                Destination: {route.destination ? getStopName(route.destination) : " "}
              </p>
              <p className="text-white/50 text-sm mt-2">
                Stops: {route.stops? route.stops.length : 0}
              </p>
            </a>
          </div>
        ))}
      </div>
    </main>
  );
}
