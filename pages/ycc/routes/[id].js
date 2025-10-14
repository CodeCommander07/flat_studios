import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import AuthWrapper from '@/components/AuthWrapper';

export default function RouteDetailPage() {
  const router = useRouter();
  const { id } = router.query; // stopId from URL
  const [route, setRoute] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch stops
  const fetchStops = async () => {
    try {
      const res = await axios.get('/api/ycc/stops');
      setStops(res.data.stops || []);
    } catch (err) {
      console.error('Failed to fetch stops', err);
    }
  };

  // Fetch route
  const fetchRoute = async () => {
    if (!id) return;
    try {
      const res = await axios.get(`/api/ycc/routes/${id}`);
      setRoute(res.data.route);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch route.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStops();
  }, []);

  useEffect(() => {
    fetchRoute();
  }, [id]);

  const getStopName = (stopId) => {
    const stop = stops.find((s) => s.stopId === stopId);
    return stop ? `${stop.name}${stop.town ? ', ' + stop.town : ''}` : stopId;
  };

  if (loading) return <p className="text-white">Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!route) return <p className="text-white">Route not found.</p>;

  return (
    <AuthWrapper requiredRole="admin">
      <main className="text-white px-6 py-12 flex flex-col items-center">
        <div className="max-w-5xl w-full bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl">
          <h1 className="text-2xl font-bold mb-4">
            Route Details: <span className="text-blue-400">{route.number}</span>
          </h1>

          <p><strong>Origin:</strong> {getStopName(route.origin)}</p>
          <p><strong>Destination:</strong> {getStopName(route.destination)}</p>

          <div className="grid gap-8 md:grid-cols-2 mt-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Stops (Forward):</h2>
              <ul className="list-disc list-inside ml-4 space-y-1">
                {route.stops.map((stopId, idx) => (
                  <li key={idx}>{getStopName(stopId)}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Stops (In Reverse):</h2>
              <ul className="list-disc list-inside ml-4 space-y-1">
                {[...route.stops].reverse().map((stopId, idx) => (
                  <li key={idx}>{getStopName(stopId)}</li>
                ))}
              </ul>
            </div>
          </div>

          {route.map?.filename && (
            <p className="mt-6">
              <strong>Map:</strong>{' '}
              <a
                href={`/api/ycc/routes/file?id=${route._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-400"
              >
                {route.map.filename}
              </a>
            </p>
          )}
        </div>
      </main>
    </AuthWrapper>
  );
}
