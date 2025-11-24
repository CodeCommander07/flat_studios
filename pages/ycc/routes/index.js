'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function RoutesView() {
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 🧩 Load routes + stops
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const [resRoutes, resStops] = await Promise.all([
          fetch('/api/ycc/routes'),
          fetch('/api/ycc/stops'),
        ]);
        if (!resRoutes.ok || !resStops.ok)
          throw new Error('Failed to fetch route or stop data');

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
    const stop = stops.find((s) => s.stopId === stopId);
    return stop ? stop.name : stopId;
  };

  // 🚧 Get ALL closed stops (forward + backward + origin + destination + unique)
  const getClosedStops = (route) => {
    const allStops = [
      ...(route.stops?.forward || []),
      ...(route.stops?.backward || []),
      route.origin,
      route.destination,
    ].filter(Boolean);

    const closed = stops.filter((s) => s.closed && allStops.includes(s.stopId));

    // Remove duplicates (forward/backward/origin/destination)
    const uniqueClosed = Array.from(
      new Map(closed.map((s) => [s.stopId, s])).values()
    );

    return uniqueClosed;
  };

  // 🔍 Search filter
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = routes.filter((route) => {
      const originName = getStopName(route.origin)?.toLowerCase() || '';
      const destName = getStopName(route.destination)?.toLowerCase() || '';
      const routeNumber = route.number?.toLowerCase() || '';
      const operator =
        typeof route.operator === 'string'
          ? route.operator.toLowerCase()
          : Array.isArray(route.operator)
          ? route.operator.join(' ').toLowerCase()
          : route.operator?.name?.toLowerCase?.() || '';
      const allStops = [
        ...(route.stops?.forward || []),
        ...(route.stops?.backward || []),
        route.origin,
        route.destination,
      ];
      const stopNames = allStops
        .map((id) => getStopName(id)?.toLowerCase() || '')
        .join(' ');
      return (
        routeNumber.includes(term) ||
        originName.includes(term) ||
        destName.includes(term) ||
        stopNames.includes(term) ||
        operator.includes(term)
      );
    });
    setFilteredRoutes(filtered);
  }, [searchTerm, routes, stops]);

  return (
    <main className="p-6 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold">Operator Routes</h1>
        <input
          type="text"
          placeholder="Search by route, stop, origin, or destination..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-[#283335] border border-white/20 backdrop-blur-md text-white placeholder-white/50 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-80"
        />
      </div>

      {/* Loading / Error */}
      {loading && <p className="text-white/60">Loading routes...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && filteredRoutes.length === 0 && (
        <p className="text-white/60">No routes found for this operator.</p>
      )}

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRoutes.map((route, index) => {
          const closedStops = getClosedStops(route);
          const hasDiversion = route.diversion?.active;
          const stopCount =
            (route.stops?.forward?.length || 0) +
            (route.stops?.backward?.length || 0);

          const bgColor = closedStops.length
            ? 'bg-red-900/30 ring-2 ring-red-500/40'
            : hasDiversion
            ? 'bg-orange-900/30 ring-2 ring-orange-500/40'
            : "bg-[#283335]";

          const showTooltip = closedStops.length > 0 || hasDiversion;

          return (
            <a
              key={route._id}
              href={`/ycc/routes/${route._id}`}
              className={`relative group block overflow-visible backdrop-blur border border-white/20 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200 ${bgColor}`}
            >
              <h2 className="text-xl font-semibold mb-1">
                {route.number || `Route ${index + 1}`}
              </h2>

              <p className="text-white/70">
                {getStopName(route.origin)} → {getStopName(route.destination)}
              </p>

              <p className="text-white/50 text-sm mt-1">
                Operator:{' '}
                {Array.isArray(route.operator)
                  ? route.operator.join(', ')
                  : route.operator || '—'}
              </p>

              <p className="text-white/50 text-sm mt-1">Stops: {stopCount}</p>

              {closedStops.length > 0 && (
                <div className="mt-2 text-xs text-red-300 flex gap-1 items-center">
                  <AlertTriangle size={14} /> {closedStops.length} stop(s) closed
                </div>
              )}

              {hasDiversion && (
                <div className="mt-2 text-xs text-yellow-300">
                  ⚠️ Diversion in place
                </div>
              )}

              {/* Tooltip */}
              {showTooltip && (
                <div
                  className="pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-200
                    absolute left-1/2 -translate-x-1/2 bottom-full mb-2
                    bg-black/90 border border-white/10 text-white text-sm p-3 rounded-lg w-64
                    backdrop-blur-md shadow-lg"
                >
                  {closedStops.length > 0 && (
                    <>
                      <p className="font-semibold mb-1 text-red-400">Closed Stops</p>
                      <ul className="list-disc list-inside text-white/80 space-y-1 max-h-40 overflow-y-auto pr-2">
                        {closedStops.map((s, i) => (
                          <li key={i}>
                            {s.name}
                            {s.town && ` (${s.town})`}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {hasDiversion && route.diversion?.reason && (
                    <div className="mt-2">
                      <p className="font-semibold text-yellow-400">Diversion</p>
                      <p className="text-white/70 text-sm mt-1 leading-snug">
                        {route.diversion.reason}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </a>
          );
        })}
      </div>
    </main>
  );
}
