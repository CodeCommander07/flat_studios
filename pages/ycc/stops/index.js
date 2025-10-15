'use client';

import { useEffect, useState } from 'react';

export default function StopsView() {
  const [stops, setStops] = useState([]);
  const [filteredStops, setFilteredStops] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch stops
  useEffect(() => {
    const fetchStops = async () => {
      try {
        const res = await fetch('/api/ycc/stops');
        if (!res.ok) throw new Error('Failed to fetch stop data');
        const data = await res.json();
        setStops(data.stops || []);
        setFilteredStops(data.stops || []);
      } catch (err) {
        console.error('Error fetching stops:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStops();
  }, []);

  // Debounce search term (wait 300ms after user stops typing)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Filter results when debouncedTerm changes
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

  return (
    <main className="p-6 text-white bg-gradient-to-b from-gray-900 via-black to-gray-900 min-h-screen">
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

      {loading && <p className="text-white/60">Loading Stops...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!loading && filteredStops.length === 0 && (
        <p className="text-white/60">No stops found.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredStops.map((stop, index) => (
          <a
            href={`/ycc/stops/${stop.stopId}`}
            key={stop.stopId}
            className="bg-black/50 backdrop-blur border border-white/20 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200 block"
          >
            <h2 className="text-xl font-semibold mb-1">
              {stop.name || `Stop ${index + 1}`}
            </h2>
            {stop.town && <p className="text-white/70 mb-1">{stop.town}</p>}
            {stop.routes?.length > 0 && (
              <p className="text-white/50 text-sm">
                Routes: {stop.routes.join(', ')}
              </p>
            )}
          </a>
        ))}
      </div>
    </main>
  );
}
