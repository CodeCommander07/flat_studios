'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import AuthWrapper from '@/components/AuthWrapper';
import { AlertTriangle } from 'lucide-react';

export default function RouteDetailPage() {
  const router = useRouter();
  const { id } = router.query;
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

  const getStopData = (stopId) => stops.find((s) => s.stopId === stopId);

  if (loading) return <p className="text-white text-center mt-12">Loading...</p>;
  if (error) return <p className="text-red-500 text-center mt-12">{error}</p>;
  if (!route) return <p className="text-white text-center mt-12">Route not found.</p>;

  const stopsReverse = [...(route.stops || [])].reverse();

  return (
    <AuthWrapper requiredRole="admin">
      <main className="text-white px-6 py-12 flex flex-col items-center">
        <div className="max-w-5xl w-full bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl">
          <h1 className="text-2xl font-bold mb-4">
            Route Details:{' '}
            <span className="text-blue-400">{route.number}</span>
          </h1>

          <p><strong>Operator:</strong> {route.operator || 'Unknown'}</p>
          <p><strong>Origin:</strong> {getStopName(route.origin)}</p>
          <p><strong>Destination:</strong> {getStopName(route.destination)}</p>

          {/* ⚠️ Diversion Warning */}
          {route.diversion?.active && (
            <div className="mt-6 bg-yellow-400/20 border border-yellow-500/50 text-yellow-300 px-4 py-3 rounded-lg flex gap-3 items-start">
              <AlertTriangle className="mt-0.5 flex-shrink-0" size={20} />
              <div>
                <p className="font-semibold text-yellow-200">
                  Diversion in Place:
                </p>
                <p className="text-sm mb-2">
                  {route.diversion.message ||
                    route.diversion.reason ||
                    'Diversion active on this route.'}
                </p>
                {route.diversion.stops?.length > 0 && (
                  <ul className="list-disc list-inside text-sm">
                    {route.diversion.stops.map((stopId, idx) => (
                      <li key={idx}>{getStopName(stopId)}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* 🚌 Stops */}
          <div className="grid gap-8 md:grid-cols-2 mt-6">
            {/* Forward */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Stops (Forward):</h2>
              <ul className="list-disc list-inside ml-4 space-y-1">
                {route.stops.map((stopId, idx) => {
                  const stopData = getStopData(stopId);
                  const isAffected = route.diversion?.stops?.includes(stopId);
                  const isClosed = stopData?.closed;

                  return (
                    <li
                      key={idx}
                      className={`transition-all ${
                        isClosed
                          ? 'text-red-400 font-semibold'
                          : isAffected
                          ? 'text-yellow-400 font-semibold'
                          : ''
                      }`}
                    >
                      {isClosed ? '🚧 ' : isAffected ? '⚠️ ' : ''}
                      <a
                        href={`/ycc/stops/${stopData?._id || stopId}`}
                        className="underline hover:text-blue-300"
                      >
                        {getStopName(stopId)}
                      </a>
                      {isClosed && stopData?.closureReason && (
                        <span className="block text-xs text-red-300 ml-5">
                          {stopData.closureReason}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Reverse */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Stops (In Reverse):</h2>
              <ul className="list-disc list-inside ml-4 space-y-1">
                {stopsReverse.map((stopId, idx) => {
                  const stopData = getStopData(stopId);
                  const isAffected = route.diversion?.stops?.includes(stopId);
                  const isClosed = stopData?.closed;

                  return (
                    <li
                      key={idx}
                      className={`transition-all ${
                        isClosed
                          ? 'text-red-400 font-semibold'
                          : isAffected
                          ? 'text-yellow-400 font-semibold'
                          : ''
                      }`}
                    >
                      {isClosed ? '🚧 ' : isAffected ? '⚠️ ' : ''}
                      <a
                        href={`/ycc/stops/${stopData?._id || stopId}`}
                        className="underline hover:text-blue-300"
                      >
                        {getStopName(stopId)}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* 🗺️ Map */}
          {route.map?.filename && (
            <p className="mt-6">
              <strong>Map:</strong>{' '}
              <a
                href={`/api/ycc/routes/file?id=${route._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-400 hover:text-blue-300"
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
