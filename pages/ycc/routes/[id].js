'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import {
  AlertTriangle,
  MapPin,
  MapPinOff,
  MapPinX,
  MapPinPlus,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

export default function RouteDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [route, setRoute] = useState(null);
  const [stops, setStops] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get('/api/ycc/stops')
      .then((res) => setStops(res.data.stops || []))
      .catch((err) => console.error('Failed to fetch stops', err));
  }, []);

  useEffect(() => {
    axios
      .get('/api/ycc/operators/active')
      .then((res) => setOperators(res.data.submissions || []))
      .catch((err) => console.error('Failed to fetch operators', err));
  }, []);

  useEffect(() => {
    if (!id) return;
    axios
      .get(`/api/ycc/routes/${id}`)
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

    const routeOperators = Array.isArray(route.operator)
      ? route.operator
      : [route.operator];

    const found = operators.find((op) =>
      routeOperators.some(
        (rOp) =>
          rOp === op._id.toString() ||
          op.operatorName?.toLowerCase() === rOp?.toLowerCase() ||
          op.slug?.toLowerCase() === rOp?.toLowerCase()
      )
    );

    return found || null;
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

  function StopsList({ stopList, direction, route, getStop, getStopName }) {
    const isForward = direction === "forward";
    const color = isForward ? "green" : "red";

    const bubblePos = "left-0";
    const dividerPos = "left-[10px]";
    const textPos = "text-left pl-1";

    let firstOpen = -1;
    let lastOpen = -1;
    for (let i = 0; i < stopList.length; i++) {
      const s = getStop(stopList[i]);
      if (!s?.closed) {
        if (firstOpen === -1) firstOpen = i;
        lastOpen = i;
      }
    }

    return (
      <table className="w-full">
        <tbody>
          {stopList.map((stopId, idx) => {
            const s = getStop(stopId);
            const closed = !!s?.closed;
            const affected = route?.diversion?.stops?.includes(stopId);

            const isTempStart = idx === firstOpen && firstOpen > 0;
            const isTempEnd = idx === lastOpen && lastOpen !== stopList.length - 1;

            let finalIcon;
            if (isTempStart || isTempEnd) {
              finalIcon = <MapPinPlus className="w-5 h-5 text-yellow-400" />;
            } else if (closed) {
              finalIcon = <MapPinOff className="w-5 h-5 text-red-400" />;
            } else if (affected) {
              finalIcon = <MapPinX className="w-5 h-5 text-orange-400" />;
            } else {
              finalIcon = <MapPin className={`w-5 h-5 text-${color}-300`} />;
            }
            const lineColors = {
              forward: "bg-green-400",
              backward: "bg-red-400",
            };

            return (
              <tr
                key={`stop-${idx}`}
                className={`h-[38px] ${idx === stopList.length - 1 ? "pb-0" : "pb-2 sm:pb-3"}`}
              >
                <td className="relative w-[40px]">

                  {idx > 0 && (
                    <div
                      className={`absolute top-0 bottom-[18px] w-[2px] ${lineColors[direction]}
 ${dividerPos}`}
                      style={{ zIndex: 1 }}
                    />
                  )}
                  <div
                    className={`
        absolute top-1/2 -translate-y-1/2
        w-[22px] h-[22px] bg-[#283335] rounded-full
        flex items-center justify-center
        ${bubblePos}
      `}
                    style={{ zIndex: 10 }}
                  >
                    {finalIcon}
                  </div>
                  {idx < stopList.length - 1 && (
                    <div
                      className={`absolute top-[26px] bottom-0 w-[2px] ${lineColors[direction]}
 ${dividerPos}`}
                      style={{ zIndex: 1 }}
                    />
                  )}
                </td>
                <td className={`${textPos}`}>
                  {isTempStart && (
                    <>
                      <div className="animate-pulse">
                        {getStopName(stopId)}
                      </div>
                      <div className="text-yellow-400 text-xs">
                        Temporary Departure Point
                      </div>
                    </>
                  )}

                  {isTempEnd && (
                    <>
                      <div className="animate-pulse">
                        {getStopName(stopId)}
                      </div>
                      <div className="text-yellow-400 text-xs">
                        Temporary Terminus Point
                      </div>
                    </>
                  )}

                  {!isTempStart && !isTempEnd && (
                    <>
                      {closed ? (
                        <>
                          <Link
                            href={`/ycc/stops/${s?._id}`}
                            className="text-gray-500 text-sm line-through opacity-60"
                          >
                            {getStopName(stopId)}
                          </Link>
                        </>
                      ) : (
                        <Link href={`/ycc/stops/${s?._id}`} className="text-white">
                          {getStopName(stopId)}
                        </Link>
                      )}
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }



  return (
    <main className="text-white px-4 sm:px-6 py-8 flex flex-col items-center">
      <div className="bg-[#283335] border border-white/20 rounded-b-2xl rounded-r-2xl p-6 mb-6 w-full max-w-7xl backdrop-blur-md shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              Route Details:{' '}
              <span className="inline-flex items-center rounded-full text-blue-400">
                {route.number}
              </span>
            </h1>
            <p className="text-sm text-white/80">
              <span className="font-semibold">Operator:</span>{' '}
              {operator ? (
                <Link
                  href={`/ycc/operators/${operator.slug}`}
                >
                  {operator.operatorName}
                </Link>
              ) : (
                <span className="text-gray-300">
                  {Array.isArray(route.operator)
                    ? route.operator.join(', ')
                    : route.operator || 'Unknown'}
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-col gap-1 text-sm text-white/90">
            <p>
              <span className="font-semibold">Origin:</span>{' '}
              <Link
                href={`/ycc/stops/${originStop?._id || route.origin}`}
                className={
                  isOriginClosed
                    ? 'text-red-400'
                    : originAffected
                      ? 'text-yellow-400'
                      : 'text-white'
                }
              >
                {getStopName(route.origin)}
              </Link>
            </p>
            <p>
              <span className="font-semibold">Destination:</span>{' '}
              <Link
                href={`/ycc/stops/${destStop?._id || route.destination}`}
                className={
                  isDestClosed
                    ? 'text-red-400'
                    : destAffected
                      ? 'text-yellow-400'
                      : 'text-white'
                }
              >
                {getStopName(route.destination)}
              </Link>
            </p>
          </div>
        </div>

        {route.diversion?.active && (
          <div className="mt-6 bg-yellow-400/10 border border-yellow-500/40 text-yellow-200 px-4 py-3 rounded-lg flex gap-3 items-start">
            <AlertTriangle className="mt-0.5 flex-shrink-0" size={20} />
            <div>
              <p className="font-semibold text-yellow-100 mb-1">
                Diversion In Place
              </p>
              <p className="text-sm">
                {route.diversion.reason || 'Diversion active on this route.'}
              </p>
            </div>
          </div>
        )}

        {(() => {
          if (!route || !stops?.length) return null;

          const routeStopIds = new Set([
            route.origin,
            route.destination,
            ...(route.stops?.forward || []),
            ...(route.stops?.backward || []),
          ]);

          const closedRouteStops = stops.filter(
            (s) => s.closed && routeStopIds.has(s.stopId)
          );

          if (closedRouteStops.length === 0) return null;

          return (
            <div className="mt-4 bg-red-400/10 border border-red-500/40 text-red-300 px-4 py-3 rounded-lg flex flex-col gap-2 backdrop-blur-md shadow-md">
              <div className="flex items-start gap-3">
                <MapPinOff
                  className="mt-0.5 flex-shrink-0 text-red-400"
                  size={20}
                />
                <div>
                  <p className="font-semibold text-red-300">
                    Stops Temporarily Out of Use
                  </p>
                  <p className="text-sm text-white/80">
                    Some stops along this route are currently closed or suspended.
                  </p>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {closedRouteStops.map((stop) => (
                  <Link
                    key={stop.stopId}
                    href={`/ycc/stops/${stop._id}`}
                    className="text-xs px-2 py-1 rounded-md bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 hover:text-red-100 transition-colors flex items-center gap-1"
                  >
                    <MapPinOff size={12} className="text-red-400" />
                    {stop.name}
                  </Link>
                ))}
              </div>

              <div className="mt-3 w-full h-[3px] bg-gradient-to-r from-red-500/40 via-red-400/60 to-red-500/40 rounded-full"></div>
            </div>
          );
        })()}

        {route.map?.filename && (
          <p className="mt-6 text-sm">
            <span className="font-semibold">Map:</span>{' '}
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

      <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        <div className="bg-[#283335] border border-white/20 rounded-b-2xl rounded-r-2xl p-4 backdrop-blur-md shadow-lg">
          <h2 className="flex items-center gap-2 text-lg font-semibold mb-3 text-green-400">
            Outbound
            <ArrowRight className="w-5 h-5" />
            <span className="text-xs font-normal text-white/70">
              {forwardStops.length + 2} stops
            </span>
          </h2>
          <div className="route-container relative max-h-[550px] overflow-y-auto rounded-xl scrollbar-none scroll-smooth pr-2">
            <StopsList
              stopList={[route.origin, ...forwardStops, route.destination]}
              direction="forward"
              route={route}
              getStop={getStop}
              getStopName={getStopName}
            />
          </div>
        </div>

        <div className="bg-[#283335] border border-white/20 rounded-b-2xl rounded-r-2xl p-4 backdrop-blur-md shadow-lg">
          <h2 className="flex items-center gap-2 text-lg font-semibold mb-3 text-red-400 text-left">
            Inbound
            <ArrowRight className="w-5 h-5" />
            <span className="text-xs font-normal text-white/70">
              {backwardStops.length + 2} stops
            </span>

          </h2>
          <div className="route-container relative max-h-[550px] overflow-y-auto rounded-xl scrollbar-none scroll-smooth pl-2">
            <StopsList
              stopList={[route.destination, ...backwardStops, route.origin]}
              direction="backward"
              route={route}
              getStop={getStop}
              getStopName={getStopName}
            />
          </div>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  );
}
