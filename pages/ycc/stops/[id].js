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

  // 🧠 Helper — find route number by ID
  const getRouteNumber = (routeId) => {
    const route = routes.find((r) => r.routeId === routeId);
    return route ? route.number : routeId;
  };

  // 🚨 Check if any linked routes are on diversion
  const diversionRoutes = stop?.routes
    ?.map((routeId) => routes.find((r) => r.routeId === routeId))
    .filter((r) => r && r.diversion) || [];

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

          {/* ⚠️ Diversion Banner */}
          {diversionRoutes.length > 0 && (
            <div className="mt-6 bg-yellow-400/20 border border-yellow-500/50 text-yellow-300 px-4 py-3 rounded-lg flex gap-3 items-start">
              <AlertTriangle className="mt-0.5 flex-shrink-0" size={20} />
              <div>
                <p className="font-semibold">Route Diversion Active:</p>
                <ul className="list-disc list-inside text-sm">
                  {diversionRoutes.map((r, idx) => (
                    <li key={idx}>
                      <span className="font-medium text-yellow-200">
                        {r.number || r.routeId}
                      </span>
                      {r.diversionMessage && ` – ${r.diversionMessage}`}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* 🚌 Routes serving this stop */}
          {stop.routes && stop.routes.length > 0 ? (
            <>
              <h2 className="mt-6 mb-2 text-lg font-semibold">Routes that stop here:</h2>
              <ul className="list-disc list-inside ml-4">
                {stop.routes.map((id, idx) => (
                  <li key={idx}>
                    <a
                      href={`/ycc/routes/${id}`}
                      className="underline text-blue-400 hover:text-blue-300"
                    >
                      {getRouteNumber(id)}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-4">No routes currently assigned.</p>
          )}
        </div>
      </main>
    </AuthWrapper>
  );
}
