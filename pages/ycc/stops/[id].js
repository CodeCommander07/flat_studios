'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import AuthWrapper from '@/components/AuthWrapper';

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

  const getRouteNumber = (routeId) => {
    const route = routes.find((r) => r.routeId === routeId);
    return route ? route.number : routeId;
  };

  if (loading)
    return (
      <p className="text-white text-center mt-12">Loading stop details...</p>
    );
  if (error)
    return (
      <p className="text-red-500 text-center mt-12">{error}</p>
    );
  if (!stop)
    return (
      <p className="text-white text-center mt-12">Stop not found.</p>
    );

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

          {stop.routes && stop.routes.length > 0 ? (
            <>
              <h2 className="mt-6 mb-2 text-lg font-semibold">Routes that stop here:</h2>
              <ul className="list-disc list-inside ml-4">
                {stop.routes.map((routeId, idx) => (
                  <li key={idx}>
                    <a
                      href={`/ycc/routes/${routeId}`}
                      className="underline text-blue-400 hover:text-blue-300"
                    >
                      {getRouteNumber(routeId)}
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
