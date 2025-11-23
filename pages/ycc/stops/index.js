'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Filter } from 'lucide-react';

export default function StopsView() {
  const [stops, setStops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [filteredStops, setFilteredStops] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('a-z');

  const formatTimeAgo = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (days < 2) return 'yesterday';
    if (days < 30) return `${days} days ago`;
    if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
    return `${years} year${years !== 1 ? 's' : ''} ago`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stopsRes, routesRes] = await Promise.all([
          fetch('/api/ycc/stops'),
          fetch('/api/ycc/routes'),
        ]);

        if (!stopsRes.ok || !routesRes.ok)
          throw new Error('Failed to fetch stops or routes');

        const stopsData = await stopsRes.json();
        const routesData = await routesRes.json();

        setStops(stopsData.stops || []);
        setFilteredStops(stopsData.stops || []);
        setRoutes(routesData.routes || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedTerm(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Filter + sort
  useEffect(() => {
    const term = debouncedTerm.toLowerCase();

    let results = stops.filter((stop) => {
      const primaryName = stop.name || '';
      const primaryTown = stop.town || '';

      const stopRoutes = stop.routes
        ?.map((rid) => routes.find((r) => r._id === rid || r.routeId === rid))
        .filter(Boolean);
      const routeNumbers = stopRoutes.map((r) => (r.number || '').toLowerCase());

      return (
        primaryName.toLowerCase().includes(term) ||
        primaryTown.toLowerCase().includes(term) ||
        routeNumbers.some((num) => num.includes(term))
      );
    });

    results = [...results].sort((a, b) => {
      const aName = a.name;
      const bName = b.name;

      switch (sortBy) {
        case 'a-z':
          return aName.localeCompare(bName);
        case 'z-a':
          return bName.localeCompare(aName);
        case 'route-asc': {
          const aRoute = routes.find((r) => a.routes?.includes(r._id))?.number || '';
          const bRoute = routes.find((r) => b.routes?.includes(r._id))?.number || '';
          return aRoute.localeCompare(bRoute);
        }
        case 'route-desc': {
          const aRoute = routes.find((r) => a.routes?.includes(r._id))?.number || '';
          const bRoute = routes.find((r) => b.routes?.includes(r._id))?.number || '';
          return bRoute.localeCompare(aRoute);
        }
        case 'updated':
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        case 'new':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'old':
          return new Date(a.createdAt) - new Date(b.createdAt);
        default:
          return 0;
      }
    });

    setFilteredStops(results);
  }, [debouncedTerm, stops, routes, sortBy]);

  const getStopDiversions = (stopId) =>
    routes
      .filter(
        (r) =>
          r.diversion?.active &&
          Array.isArray(r.diversion?.stops) &&
          r.diversion.stops.includes(stopId)
      )
      .map((r) => ({
        route: r.number || r.routeId,
        message: r.diversion?.reason || r.diversion?.message || '',
      }));

  return (
    <main className="px-6 py-10 text-white max-w-10xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Bus Stops</h1>
          <p className="text-white/60 text-sm">
            Browse stops by name, town, or route — filter by sorting options below.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search by stop name, town, or route..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white/10 border border-white/20 backdrop-blur-md text-white placeholder-white/50 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-72"
          />

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#283335] border border-white/20 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500 appearance-none pr-10"
            >
              <option className="bg-[#283335]" value="a-z">
                A–Z
              </option>
              <option className="bg-[#283335]" value="z-a">
                Z–A
              </option>
              <option className="bg-[#283335]" value="route-asc">
                Route Number ↑
              </option>
              <option className="bg-[#283335]" value="route-desc">
                Route Number ↓
              </option>
              <option className="bg-[#283335]" value="updated">
                Last Updated
              </option>
              <option className="bg-[#283335]" value="new">
                Newest
              </option>
              <option className="bg-[#283335]" value="old">
                Oldest
              </option>
            </select>
            <Filter className="absolute right-3 top-2.5 w-4 h-4 text-white/50 pointer-events-none" />
          </div>
        </div>
      </div>

      {loading && <p className="text-white/60 animate-pulse">Loading Stops...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && filteredStops.length === 0 && (
        <p className="text-white/60">No stops found.</p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {filteredStops.map((stop) => {
          const diversions = getStopDiversions(stop.stopId);
          const hasDiversion = diversions.length > 0;
          const isClosed = stop.closed;

          return (
            <a
              href={`/ycc/stops/${stop._id}`}
              key={stop._id}
              className={`relative bg-[#283335] border border-white/10 backdrop-blur-xl rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1
                ${
                  isClosed
                    ? 'ring-2 ring-red-500/50 border-red-600/30'
                    : hasDiversion
                    ? 'ring-2 ring-yellow-500/50 border-yellow-600/30'
                    : 'hover:ring-2 hover:ring-blue-500/40'
                }`}
            >
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xl font-semibold text-green-400">
                    {stop.name}
                  </p>

                  <div className="text-right">
                    <p className="text-[10px] text-white/40 mb-0.5">
                      Updated {formatTimeAgo(stop.updatedAt)}
                    </p>

                    <p className="text-xs text-gray-400">
                      {stop.stopId}
                    </p>
                  </div>
                </div>

                {stop.town && (
                  <p className="text-white/70 mb-1 text-sm">{stop.town}</p>
                )}

                {stop.branding && (
                  <p className="text-xs text-gray-400">{stop.branding}</p>
                )}

                {routes && (
                  <div className="text-white/60 text-sm mt-1 flex flex-wrap gap-1">
                    {routes
                      .filter((r) => {
                        const stopsInRoute = [
                          ...(r.stops?.forward || []),
                          ...(r.stops?.backward || []),
                          r.origin,
                          r.destination,
                        ].filter(Boolean);

                        return stopsInRoute.includes(stop.stopId);
                      })
                      .sort((a, b) => {
                        const A = a.number || a.routeId || '';
                        const B = b.number || b.routeId || '';

                        const numA = parseInt(A);
                        const numB = parseInt(B);

                        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;

                        return A.localeCompare(B, undefined, { numeric: true });
                      })
                      .map((r) => (
                        <span
                          key={r._id}
                          className="px-2 py-0.5 text-xs rounded-md bg.white/10 border border-white/20"
                        >
                          {r.number || r.routeId}
                        </span>
                      ))}
                  </div>
                )}

                {isClosed && (
                  <div className="mt-auto bg-red-500/20 border border-red-600/50 text-red-300 px-3 py-2 rounded-lg flex items-start gap-2 animate-pulse">
                    <AlertTriangle className="mt-0.5 flex-shrink-0 text-red-400" size={18} />
                    <div className="text-sm leading-snug">
                      <strong>Stop Closed:</strong>{' '}
                      {stop.closureReason || 'This stop is currently closed.'}
                    </div>
                  </div>
                )}

                {!isClosed && hasDiversion && (
                  <div className="mt-auto bg-yellow-400/20 border border-yellow-500/40 text-yellow-300 px-3 py-2 rounded-lg flex items-start gap-2 animate-pulse">
                    <AlertTriangle className="mt-0.5 flex-shrink-0" size={18} />
                    <div className="text-sm leading-snug">
                      <strong>Route Diversion Active:</strong>{' '}
                      {diversions.map((d, i) => (
                        <span key={i}>
                          {d.route}
                          {d.message ? ` – ${d.message}` : ''}
                          {i < diversions.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </main>
  );
}
