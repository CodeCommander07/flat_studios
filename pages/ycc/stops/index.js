'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function StopsView() {
  const [stops, setStops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [filteredStops, setFilteredStops] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 🧭 Fetch stops + routes
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

  // ⌛ Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // 🔍 Filter
  useEffect(() => {
    const term = debouncedTerm.toLowerCase();
    const results = stops.filter(
      (stop) =>
        stop.name?.toLowerCase().includes(term) ||
        stop.town?.toLowerCase().includes(term) ||
        stop.routes?.some((route) => route.toLowerCase().includes(term))
    );
    setFilteredStops(results);
  }, [debouncedTerm, stops]);

  // 🚨 Helper: find diversions for this stop
  const getStopDiversions = (stopId) => {
    return routes
      .filter(
        (r) =>
          r.diversion?.active &&
          Array.isArray(r.stops) &&
          r.stops.includes(stopId)
      )
      .map((r) => ({
        route: r.routeNumber,
        message: r.diversion?.message || '',
      }));
  };

  return (
    <main className="p-6 text-white">
      {/* 🔍 Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold">Bus Stops</h1>
        <input
          type="text"
          placeholder="Search by stop name, town, or route..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-white/10 border border-white/20 backdrop-blur-md text-white placeholder-white/50 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-80"
        />
      </div>

      {/* 🌀 Loading / Error */}
      {loading && <p className="text-white/60">Loading Stops...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {/* 🚏 Stops List */}
      {!loading && filteredStops.length === 0 && (
        <p className="text-white/60">No stops found.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredStops.map((stop, index) => {
          const diversions = getStopDiversions(stop.stopId);
          const hasDiversion = diversions.length > 0;

          return (
            <a
              href={`/ycc/stops/${stop._id}`}
              key={stop.stopId}
              className={`relative bg-black/50 backdrop-blur border border-white/20 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200 ${
                hasDiversion
                  ? 'ring-2 ring-yellow-500/60'
                  : index % 2 === 0
                  ? 'bg-gradient-to-tr from-blue-900/30 to-purple-900/30'
                  : 'bg-gradient-to-tr from-purple-900/30 to-blue-900/30'
              }`}
            >
              <h2 className="text-xl font-semibold mb-1">{stop.name}</h2>
              {stop.town && <p className="text-white/70 mb-1">{stop.town}</p>}
              {stop.routes?.length > 0 && (
                <p className="text-white/50 text-sm mb-2">
                  Routes: {stop.routes.join(', ')}
                </p>
              )}

              {/* ⚠️ Diversion Warning */}
              {hasDiversion && (
                <div className="mt-3 bg-yellow-400/20 border border-yellow-500/40 text-yellow-300 px-3 py-2 rounded-lg flex items-start gap-2 animate-pulse">
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
            </a>
          );
        })}
      </div>
    </main>
  );
}
