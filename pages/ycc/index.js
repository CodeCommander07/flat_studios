'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import AuthWrapper from '@/components/AuthWrapper';
import { MapPin, Route, Bus, AlertTriangle } from 'lucide-react';
import CountUp from '@/components/CountUp';
import RotatingText from '@/components/RotatingText';

export default function YCCIndex() {
  const [stats, setStats] = useState(null);
  const [stats2, setStats2] = useState(null);
  const [stats3, setStats3] = useState(null);
  const [disruptions, setDisruptions] = useState([]);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [res1, res2, res3, res4] = await Promise.all([
          axios.get('/api/ycc/routes'),
          axios.get('/api/ycc/stops'),
          axios.get('/api/ycc/operators/active'),
          axios.get('/api/ycc/travel'),
        ]);
        setStats(res1.data.routes);
        setStats2(res2.data.stops);
        setStats3(res3.data.submissions);
        setStops(res2.data.stops || []);
        setDisruptions(res4.data.disruptions || []);
      } catch (err) {
        console.error('Failed to fetch YCC data:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading)
    return (
      <p className="text-white/60 p-6 text-center">
        Loading routes summary...
      </p>
    );

  // 🧩 Active disruptions
  const activeAlerts = disruptions.filter(
    (d) => !d.resolved && d.active !== false
  );

  // 🚏 Stop closures
  const stopClosures = activeAlerts.filter((d) =>
    d.incidentType?.toLowerCase().includes('stop')
  );

  // 🟧 Diversions
  const diversions = activeAlerts.filter((d) =>
    d.incidentType?.toLowerCase().includes('diversion')
  );

  const getStopData = (stopId) => {
    const s = stops.find((x) => x.stopId === stopId);
    if (!s) return { name: stopId, id: stopId };
    return {
      name: `${s.name}${s.town ? ` (${s.town})` : ''}`,
      id: s._id, // ✅ Use _id for href
    };
  };

  // 🛑 Closed stops (store display name + MongoDB _id)
  const closedStopNames = Array.from(
    new Set(
      stopClosures.flatMap((c) =>
        (c.affectedStops || []).map((sid) => getStopData(sid))
      )
    )
  ).filter((s) => s && s.name);

  // 🧩 Affected routes (store name + ID)
  const affectedRoutes = Array.from(
    new Set(
      stats
        ?.filter((route) => {
          const directDiversion = diversions.some(
            (d) =>
              (d.affectedRoutes || []).includes(route._id) ||
              (d.affectedRoutes || []).includes(route.routeId)
          );

          const allStops = [
            ...(route.stops?.forward || []),
            ...(route.stops?.backward || []),
            route.origin,
            route.destination,
          ].filter(Boolean);

          const stopAffected = activeAlerts.some((d) =>
            (d.affectedStops || []).some((stopId) => allStops.includes(stopId))
          );

          return directDiversion || stopAffected;
        })
        .map((route) => ({
          id: route._id,
          name: route.number
            ? `Route ${route.number}`
            : route.name || route._id,
        })) || []
    )
  ).filter((r) => r && r.name);


  return (
    <main className="text-white px-6 py-6 flex flex-col items-center">
      <div className="max-w-6xl w-full space-y-8">

        <div className="text-center bg-[#283335]/95 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl relative">
          <h1 className="text-3xl font-bold">Yapton County Council</h1>
          <p className="text-sm text-white/60 mt-2">
            Overview of total routes and routes per company
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative bg-[#283335]/95 backdrop-blur-md rounded-2xl shadow-lg flex flex-col justify-center p-5 overflow-hidden text-left">
            <div className="absolute left-0 top-0 h-full w-[6px] bg-gradient-to-b from-red-500 to-red-700 rounded-l-2xl" />

            <div className="pl-4 flex flex-col items-start text-left">
              <h2 className="text-xl font-semibold text-red-300 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Closed Stops
              </h2>
              <p className="text-sm text-white/70 mb-3">
                The following stops are currently closed across the network:
              </p>

              <div className="text-lg font-semibold text-white">
                <RotatingText
                  texts={closedStopNames.map(
                    (s) => `<a href="/ycc/stops/${s.id}" class='text-red-300 hover:underline'>${s.name}</a>`
                  )}
                  splitBy="lines"
                  staggerFrom="last"
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '-120%' }}
                  staggerDuration={0.025}
                  splitLevelClassName="overflow-hidden pb-1"
                  transition={{
                    type: 'spring',
                    damping: 30,
                    stiffness: 400,
                  }}
                  rotationInterval={5000}
                />
              </div>
            </div>
          </div>

          <div
            className="
    relative bg-[#283335]/95 backdrop-blur-md rounded-2xl shadow-lg 
    flex flex-col justify-center p-5 overflow-hidden
    text-left md:text-right
  "
          >
            <div
              className="
      absolute top-0 h-full w-[6px] 
      bg-gradient-to-b from-orange-400 to-orange-600
      rounded-l-2xl md:rounded-r-2xl md:rounded-l-none
      left-0 md:left-auto md:right-0
      transition-all duration-300
    "
            />

            <div className="pl-4 md:pr-4 flex flex-col items-start md:items-end text-left md:text-right">
              <h2 className="text-xl font-semibold text-orange-300 mb-2 flex items-center gap-2 md:justify-end">
                Routes with Disruptions
                <AlertTriangle className="w-5 h-5 text-orange-400" />
              </h2>

              <p className="text-sm text-white/70 mb-3">
                These routes are affected by diversions or temporary changes:
              </p>

              <div className="text-lg font-semibold text-white">
                <RotatingText
                  texts={affectedRoutes.map(
                    (r) =>
                      `<a href="/ycc/routes/${r.id}" class='text-orange-300 hover:underline'>${r.name}</a>`
                  )}
                  splitBy="lines"
                  staggerFrom="last"
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '-120%' }}
                  staggerDuration={0.025}
                  splitLevelClassName="overflow-hidden pb-1"
                  transition={{
                    type: 'spring',
                    damping: 30,
                    stiffness: 400,
                  }}
                  rotationInterval={5000}
                />
              </div>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
