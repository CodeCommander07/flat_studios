'use client';

import { useEffect, useState } from 'react';

export default function StopsView() {
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStops = async () => {
      try {
        const res = await fetch('/api/ycc/stops');
        if (!res.ok) throw new Error('Failed to fetch stop data');
        const data = await res.json();
        setStops(data.stops || []);
      } catch (err) {
        console.error('Error fetching stops:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStops();
  }, []);

  return (
    <main className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">Bus Stops</h1>

      {loading && <p className="text-white/60">Loading Stops...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!loading && stops.length === 0 && (
        <p className="text-white/60">No stops found.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stops.map((stop, index) => (
          <a
            href={`/ycc/stops/${stop.stopId}`}
            key={stop.stopId}
            className="bg-black/50 backdrop-blur border border-white/20 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200 block"
          >
            <h2 className="text-xl font-semibold mb-1">
              {stop.name || `Stop ${index + 1}`}
            </h2>
            {stop.town && (
              <p className="text-white/70 mb-1">{stop.town}</p>
            )}
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
