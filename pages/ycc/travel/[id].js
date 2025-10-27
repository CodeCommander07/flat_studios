'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import { AlertTriangle, Clock, ArrowLeft, MapPin } from 'lucide-react';

export default function DisruptionDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [disruption, setDisruption] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch disruption, routes & stops
  useEffect(() => {
    if (!id) return;
    async function loadData() {
      try {
        const [disRes, routeRes, stopRes] = await Promise.all([
          axios.get(`/api/ycc/travel/${id}`),
          axios.get('/api/ycc/routes'),
          axios.get('/api/ycc/stops'),
        ]);
        setDisruption(disRes.data.disruption);
        setRoutes(routeRes.data.routes || []);
        setStops(stopRes.data.stops || []);
      } catch (err) {
        console.error('Error loading disruption details:', err);
        setError('Failed to load disruption details.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const findRoute = (rid) =>
    routes.find((r) => r.routeId === rid || r._id === rid);

  const findStop = (sid) =>
    stops.find((s) => s.stopId === sid || s._id === sid);

  if (loading)
    return (
      <main className="flex items-center justify-center min-h-screen text-white">
        <p>Loading disruption details...</p>
      </main>
    );

  if (error)
    return (
      <main className="flex items-center justify-center min-h-screen text-red-500">
        <p>{error}</p>
      </main>
    );

  if (!disruption)
    return (
      <main className="flex items-center justify-center min-h-screen text-white">
        <p>Disruption not found.</p>
      </main>
    );

  return (
    <main className="text-white px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {/* 🔙 Back button */}
        <Link
          href="/ycc/travel"
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6"
        >
          <ArrowLeft size={18} /> Back to all updates
        </Link>

        {/* ⚠️ Disruption card */}
        <div className="bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
            <h1 className="text-2xl font-bold flex items-center gap-2 text-yellow-400">
              <AlertTriangle size={24} /> {disruption.incidentName}
            </h1>
            <p className="text-sm text-gray-400 flex items-center gap-1">
              <Clock size={14} /> Last updated:{' '}
              {new Date(disruption.incidentUpdated).toLocaleString()}
            </p>
          </div>

          <p className="text-white/80 leading-relaxed mb-5">
            {disruption.incidentDescription}
          </p>

          <div className="space-y-3 text-sm">
            <p>
              <span className="font-semibold text-white/70">Incident Type:</span>{' '}
              <span className="text-yellow-300">{disruption.incidentType}</span>
            </p>

            {/* 🚌 Affected Routes */}
            <div>
              <p className="font-semibold text-white/70 mb-1">Affected Routes:</p>
              {disruption.affectedRoutes?.length ? (
                <ul className="list-disc list-inside text-white/80 text-sm ml-2 space-y-1">
                  {disruption.affectedRoutes.map((rid) => {
                    const route = findRoute(rid);
                    return (
                      <li key={rid}>
                        {route ? (
                          <Link
                            href={`/ycc/routes/${route._id}`}
                            className="underline text-blue-400 hover:text-blue-300"
                          >
                            {route.number || route.name || route.routeId}
                          </Link>
                        ) : (
                          rid
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-white/60 ml-2">N/A</p>
              )}
            </div>

            {/* 🚏 Affected Stops */}
            <div>
              <p className="font-semibold text-white/70 mb-1 flex items-center gap-1">
                <MapPin size={14} /> Affected Stops:
              </p>
              {disruption.affectedStops?.length ? (
                <ul className="list-disc list-inside text-white/80 text-sm ml-2 space-y-1">
                  {disruption.affectedStops.map((sid) => {
                    const stop = findStop(sid);
                    return (
                      <li key={sid}>
                        {stop ? (
                          <Link
                            href={`/ycc/stops/${stop._id}`}
                            className="underline text-blue-400 hover:text-blue-300"
                          >
                            {stop.name}
                            {stop.town && ` (${stop.town})`}
                          </Link>
                        ) : (
                          sid
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-white/60 ml-2">N/A</p>
              )}
            </div>

            <p className="text-gray-400 mt-3">
              Reported on:{' '}
              {new Date(disruption.incidentDate).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
