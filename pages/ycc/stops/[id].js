'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import AuthWrapper from '@/components/AuthWrapper';
import { AlertTriangle } from 'lucide-react';

export default function StopDetailPage() {
  const router = useRouter();
  const { id } = router.query; // stopId from URL
  const [stop, setStop] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🧩 Fetch stop details
  const fetchStop = async () => {
    if (!id) return;
    try {
      const res = await axios.get(`/api/ycc/stops/${id}`);
      setStop(res.data.stop);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch stop.');
    }
  };

  // 🚌 Fetch all routes
  const fetchRoutes = async () => {
    try {
      const res = await axios.get('/api/ycc/routes');
      setRoutes(res.data.routes || []);
    } catch (err) {
      console.error('Failed to fetch routes', err);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  useEffect(() => {
    fetchStop();
  }, [id]);

  // 🧠 Find route object
  const findRoute = (routeId) =>
    routes.find((r) => r.routeId === routeId || r._id === routeId);

  // 🧠 Get route number
  const getRouteNumber = (routeId) => {
    const route = findRoute(routeId);
    return route ? route.number : routeId;
  };

  // 🚨 Routes currently diverted that serve this stop
  const diversionRoutes =
    stop?.routes
      ?.map((routeId) => findRoute(routeId))
      .filter((r) => r && r.diversion?.active) || [];

  if (loading)
    return <p className="text-white text-center mt-12">Loading stop details...</p>;
  if (error)
    return <p className="text-red-500 text-center mt-12">{error}</p>;
  if (!stop)
    return <p className="text-white text-center mt-12">Stop not found.</p>;

  return (
    <AuthWrapper requiredRole="admin">
      <main className="text-white px-6 py-12 flex flex-col items-center">
        <div className="max-w-4xl w-full bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl">
          <h1 className="text-2xl font-bold mb-4">
            Stop Details:{' '}
            <span className="text-blue-400">
              {stop.name}
              {stop.town ? `, ${stop.town}` : ''}
            </span>
          </h1>

          <p><strong>Stop ID:</strong> {stop.stopId}</p>
          <p><strong>Town:</strong> {stop.town || 'N/A'}</p>
          <p><strong>Postcode:</strong> {stop.postcode || 'N/A'}</p>
          <p><strong>Location:</strong> {stop.location || 'N/A'}</p>

          {/* 🚧 STOP CLOSURE ALERT */}
          {stop.closed && (
            <div className="mt-6 bg-red-500/20 border border-red-600/50 text-red-300 px-4 py-3 rounded-lg flex gap-3 items-start">
              <AlertTriangle className="mt-0.5 flex-shrink-0 text-red-400" size={20} />
              <div>
                <p className="font-semibold">Stop Closed / Out of Action</p>
                <p className="text-sm">
                  {stop.closureReason
                    ? stop.closureReason
                    : `This stop is currently closed until further notice.`}
                </p>
              </div>
            </div>
          )}

          {/* ⚠️ ROUTE DIVERSIONS */}
          {diversionRoutes.length > 0 && (
            <div className="mt-6 bg-yellow-400/20 border border-yellow-500/50 text-yellow-300 px-4 py-3 rounded-lg flex gap-3 items-start">
              <AlertTriangle className="mt-0.5 flex-shrink-0" size={20} />
              <div>
                <p className="font-semibold">Active Diversions Affecting This Stop:</p>
                <ul className="list-disc list-inside text-sm">
                  {diversionRoutes.map((r, idx) => (
                    <li key={idx}>
                      <span className="font-medium text-yellow-200">
                        {r.number || r.routeId}
                      </span>
                      {r.diversion?.message && ` – ${r.diversion.message}`}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* 🚌 ROUTES SERVING THIS STOP */}
          {stop.routes && stop.routes.length > 0 ? (
            <>
              <h2 className="mt-6 mb-2 text-lg font-semibold">
                Routes that stop here:
              </h2>
              <ul className="list-disc list-inside ml-4">
                {stop.routes.map((routeId, idx) => {
                  const route = findRoute(routeId);
                  return (
                    <li key={idx}>
                      {route ? (
                        <a
                          href={`/ycc/routes/${route._id}`}
                          className="underline text-blue-400 hover:text-blue-300"
                        >
                          {route.number || route.routeId}
                        </a>
                      ) : (
                        <span className="text-gray-400">
                          {routeId} (not found)
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="mt-4 text-gray-400">No routes currently assigned.</p>
          )}
        </div>
      </main>
    </AuthWrapper>
  );
}
