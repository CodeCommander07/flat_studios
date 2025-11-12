'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import {
  AlertTriangle,
  MapPin,
  MapPinOff,
  MapPinX,
  Bus,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function RouteDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [route, setRoute] = useState(null);
  const [stops, setStops] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('/api/ycc/stops')
      .then((res) => setStops(res.data.stops || []))
      .catch((err) => console.error('Failed to fetch stops', err));
  }, []);

  useEffect(() => {
    axios.get('/api/ycc/operators/active')
      .then((res) => setOperators(res.data.submissions || []))
      .catch((err) => console.error('Failed to fetch operators', err));
  }, []);

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

  if (loading) return <p className="text-white text-center mt-12">Loading...</p>;
  if (error) return <p className="text-red-500 text-center mt-12">{error}</p>;
  if (!route) return <p className="text-white text-center mt-12">Route not found.</p>;

  const operator = getOperator();
  const forwardStops = route.stops?.forward || [];
  const backwardStops = route.stops?.backward || [];

  const originStop = getStop(route.origin);
  const destStop = getStop(route.destination);

  const isOriginClosed = originStop?.closed;
  const isDestClosed = destStop?.closed;
  const originAffected = route.diversion?.stops?.includes(route.origin);
  const destAffected = route.diversion?.stops?.includes(route.destination);

  const StopIcon = ({ stopId }) => {
    const stop = getStop(stopId);
    const isClosed = stop?.closed;
    const isAffected = route.diversion?.stops?.includes(stopId);
    if (isClosed) return <MapPinOff className="text-red-500 w-4 h-4" />;
    if (isAffected) return <MapPinX className="text-yellow-400 w-4 h-4" />;
    return <MapPin className="text-green-500 w-4 h-4" />;
  };

  const AnimatedBus = () => (
    <motion.div
      className="flex justify-center py-1"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: [0, 5, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Bus className="text-blue-400 opacity-80 w-5 h-5" />
    </motion.div>
  );

  const renderStops = (stopList = []) => (
    <ul className="space-y-2 text-sm relative">
      {stopList.length > 0 ? (
        stopList.map((stopId, idx) => {
          const stopData = getStop(stopId);
          const isLast = idx === stopList.length - 1;
          const showBus = Math.random() < 0.15 && !isLast;

          return (
            <div key={idx} className="relative">
              {!isLast && (
                <div className="absolute left-[9px] top-6 w-[2px] h-4 bg-white/15 z-0" />
              )}
              <li className="flex items-center gap-2 relative z-10">
                <StopIcon stopId={stopId} />
                <a
                  href={`/ycc/stops/${stopData?._id || stopId}`}
                  className="underline hover:text-blue-300 transition"
                >
                  {getStopName(stopId)}
                </a>
              </li>
              {showBus && !isLast && <AnimatedBus />}
            </div>
          );
        })
      ) : (
        <p className="text-gray-400 text-xs">No stops available</p>
      )}
    </ul>
  );

  return (
    <main className="text-white px-4 sm:px-6 py-8 flex flex-col items-center">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        {/* Forward Stops */}
        <div className="order-2 lg:order-1 bg-[#283335] border border-white/20 rounded-2xl p-4 backdrop-blur-md shadow-lg">
          <h2 className="text-lg font-semibold mb-2 text-green-400">
            Outbound
          </h2>
          {renderStops(forwardStops)}
        </div>

        {/* Route Info */}
        <div className="order-1 lg:order-2 col-span-1 lg:col-span-2 bg-[#283335] border border-white/20 rounded-2xl p-6 backdrop-blur-md shadow-lg">
          <h1 className="text-2xl font-bold mb-4">
            Route Details: <span className="text-blue-400">{route.number}</span>
          </h1>
          <p>
            <strong>Operator:</strong>{' '}
            {operator ? (
              <a
                href={`/ycc/operators/${operator.slug}`}
                className="underline text-blue-400 hover:text-blue-300"
              >
                {operator.operatorName}
              </a>
            ) : Array.isArray(route.operator)
              ? route.operator.join(', ')
              : route.operator || 'Unknown'}
          </p>
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

          {route.diversion?.active && (
            <div className="mt-6 bg-yellow-400/20 border border-yellow-500/50 text-yellow-300 px-4 py-3 rounded-lg flex gap-3 items-start">
              <AlertTriangle className="mt-0.5 flex-shrink-0" size={20} />
              <div>
                <p className="font-semibold text-yellow-200">
                  Diversion In Place:
                </p>
                <p className="text-sm mb-2">
                  {route.diversion.reason || 'Diversion active on this route.'}
                </p>
              </div>
            </div>
          )}

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

        {/* Return Stops */}
        <div className="order-3 bg-[#283335] border border-white/20 rounded-2xl p-4 backdrop-blur-md shadow-lg">
          <h2 className="text-lg font-semibold mb-2 text-blue-400">
            Inbound
          </h2>
          {renderStops(backwardStops)}
        </div>
      </div>
    </main>
  );
}
