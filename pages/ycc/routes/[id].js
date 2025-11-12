'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { AlertTriangle } from 'lucide-react';

export default function RouteDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [route, setRoute] = useState(null);
  const [stops, setStops] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 📦 Fetch stops
  useEffect(() => {
    axios.get('/api/ycc/stops')
      .then((res) => setStops(res.data.stops || []))
      .catch((err) => console.error('Failed to fetch stops', err));
  }, []);

  // 🏢 Fetch all operators
  useEffect(() => {
    axios.get('/api/ycc/operators/active')
      .then((res) => setOperators(res.data.submissions || []))
      .catch((err) => console.error('Failed to fetch operators', err));
  }, []);

  // 🚌 Fetch route
  useEffect(() => {
    if (!id) return;
    axios.get(`/api/ycc/routes/${id}`)
      .then((res) => setRoute(res.data.route))
      .catch(() => setError('Failed to fetch route.'))
      .finally(() => setLoading(false));
  }, [id]);

  const getStop = (stopId) => stops.find((s) => s.stopId === stopId);
  const getStopName = (stopId) => {
    const stop = getStop(stopId);
    return stop ? `${stop.name}${stop.town ? ', ' + stop.town : ''}` : stopId;
  };

  // 🎯 Find operator
  const getOperator = () => {
    if (!route?.operator || operators.length === 0) return null;
    const routeOps = Array.isArray(route.operator)
      ? route.operator.map((o) => o.toLowerCase())
      : [route.operator.toLowerCase()];

    return (
      operators.find((op) =>
        routeOps.some(
          (rOp) =>
            op.operatorName?.toLowerCase() === rOp ||
            op.slug?.toLowerCase() === rOp ||
            op.operatorName?.toLowerCase().includes(rOp) ||
            rOp.includes(op.operatorName?.toLowerCase() || '')
        )
      ) || null
    );
  };

  if (loading)
    return <p className="text-white text-center mt-12">Loading...</p>;
  if (error)
    return <p className="text-red-500 text-center mt-12">{error}</p>;
  if (!route)
    return <p className="text-white text-center mt-12">Route not found.</p>;

  const operator = getOperator();
  const forwardStops = route.stops?.forward || [];
  const backwardStops = route.stops?.backward || [];

  const originStop = getStop(route.origin);
  const destStop = getStop(route.destination);

  const isOriginClosed = originStop?.closed;
  const isDestClosed = destStop?.closed;
  const originAffected = route.diversion?.stops?.includes(route.origin);
  const destAffected = route.diversion?.stops?.includes(route.destination);

  return (
    <main className="text-white px-6 py-12 flex flex-col items-center">
      <div className="max-w-5xl w-full bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold mb-4">
          Route Details: <span className="text-blue-400">{route.number}</span>
        </h1>

        {/* 🏢 Operator */}
        <p>
          <strong>Operator:</strong>{' '}
          {operator ? (
            <a
              href={`/ycc/operators/${operator.slug}`}
              className="underline text-blue-400 hover:text-blue-300"
            >
              {operator.operatorName}
            </a>
          ) : (
            Array.isArray(route.operator)
              ? route.operator.join(', ')
              : route.operator || 'Unknown'
          )}
        </p>

        {/* 🚏 Origin + Destination */}
        <p>
          <strong>Origin:</strong>{' '}
          <a
            href={`/ycc/stops/${originStop?._id || route.origin}`}
            className={`underline ${
              isOriginClosed
                ? 'text-red-400'
                : originAffected
                ? 'text-yellow-400'
                : 'hover:text-blue-300'
            }`}
          >
            {getStopName(route.origin)}
          </a>
        </p>

        <p>
          <strong>Destination:</strong>{' '}
          <a
            href={`/ycc/stops/${destStop?._id || route.destination}`}
            className={`underline ${
              isDestClosed
                ? 'text-red-400'
                : destAffected
                ? 'text-yellow-400'
                : 'hover:text-blue-300'
            }`}
          >
            {getStopName(route.destination)}
          </a>
        </p>

        {/* 🚨 Start/End Warnings */}
        {(isOriginClosed || isDestClosed || originAffected || destAffected) && (
          <div className="mt-6 bg-yellow-400/20 border border-yellow-500/50 text-yellow-300 px-4 py-3 rounded-lg flex gap-3 items-start">
            <AlertTriangle className="mt-0.5 flex-shrink-0" size={20} />
            <div className="text-sm leading-snug">
              <p className="font-semibold text-yellow-200">
                Route Start/End Disruptions:
              </p>
              <ul className="list-disc list-inside">
                {isOriginClosed && (
                  <li>
                    <span className="text-red-400 font-semibold">
                      Origin Stop Closed:
                    </span>{' '}
                    {originStop?.closureReason ||
                      'This stop is currently closed until further notice.'}
                  </li>
                )}
                {originAffected && !isOriginClosed && (
                  <li>⚠️ Origin stop affected by diversion.</li>
                )}
                {isDestClosed && (
                  <li>
                    <span className="text-red-400 font-semibold">
                      Destination Stop Closed:
                    </span>{' '}
                    {destStop?.closureReason ||
                      'This stop is currently closed until further notice.'}
                  </li>
                )}
                {destAffected && !isDestClosed && (
                  <li>⚠️ Destination stop affected by diversion.</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* ⚠️ Diversion warning */}
        {route.diversion?.active && (
          <div className="mt-6 bg-yellow-400/20 border border-yellow-500/50 text-yellow-300 px-4 py-3 rounded-lg flex gap-3 items-start">
            <AlertTriangle className="mt-0.5 flex-shrink-0" size={20} />
            <div>
              <p className="font-semibold text-yellow-200">Diversion In Place:</p>
              <p className="text-sm mb-2">
                {route.diversion.reason || 'Diversion active on this route.'}
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

        {/* 🚌 Stop lists */}
        <div className="grid gap-8 md:grid-cols-2 mt-6">
          {/* Forward */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Stops (Forward):</h2>
            <ul className="list-disc list-inside ml-4 space-y-1">
              {forwardStops.map((stopId, idx) => {
                const stopData = getStop(stopId);
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

          {/* Return */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Stops (Return):</h2>
            <ul className="list-disc list-inside ml-4 space-y-1">
              {backwardStops.map((stopId, idx) => {
                const stopData = getStop(stopId);
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
  );
}
