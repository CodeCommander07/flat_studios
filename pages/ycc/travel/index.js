'use client';

import { useEffect, useState, useMemo, Fragment } from 'react';
import axios from 'axios';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUpDown,
  RouteOff,
  MapPinOff,
  MapPin,
  MapPinPlus,
  MapPinX,
} from 'lucide-react';
import AuthWrapper from '@/components/AuthWrapper';

// 🔍 Helper: what impact does a disruption have on this route's directions?
function getRouteDirectionImpact(route, disruption) {
  if (!route || !disruption?.affectedStops?.length) return null;

  const affectedStops = disruption.affectedStops;

  const outboundSeq = [
    route.origin,
    ...(route.stops?.forward || []),
    route.destination,
  ].filter(Boolean);

  const inboundSeq = [
    route.destination,
    ...(route.stops?.backward || []),
    route.origin,
  ].filter(Boolean);

  const outboundAffected = outboundSeq.some((id) =>
    affectedStops.includes(id)
  );
  const inboundAffected = inboundSeq.some((id) =>
    affectedStops.includes(id)
  );

  if (outboundAffected && inboundAffected) return 'Both';
  if (outboundAffected) return 'Outbound';
  if (inboundAffected) return 'Inbound';
  return null;
}

function DiversionBlockStart({ label, tempLabel, isFirst }) {
  return (
    <>
      {!isFirst && (
        <tr className="p-0 m-0 h-[0px] leading-none">
          <td className="relative w-[40px] p-0 m-0">
            {/* Top yellow horizontal */}
            <div className="absolute left-[10px] top-0 w-[22px] h-[3px] bg-yellow-300" />
            {/* Faded main line */}
            <div className="absolute left-[10px] top-0 bottom-0 w-[2px] bg-green-400/40" />
          </td>
          <td />
        </tr>
      )}

      <tr className="p-0 m-0 h-[38px] leading-none">
        <td className="relative w-[40px] p-0 m-0">
          {/* Red closed vertical + yellow diversion vertical */}
          <div className="absolute left-[10px] top-0 bottom-0 w-[2px] bg-red-400" />
          <div className="absolute left-[30px] top-0 bottom-0 w-[2px] bg-yellow-300" />

          {/* Icons */}
          <MapPinOff className="absolute left-[1px] bg-[#283335] top-1/2 -translate-y-1/2 w-5 h-5 text-red-400" />
          <MapPinPlus className="absolute left-[20px] bg-[#283335] top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-400" />
        </td>

        <td className="p-0 pl-2">
          <span className="text-gray-500 text-sm line-through opacity-60">
            {label}
          </span>
          <span className="ml-2 text-yellow-300 text-sm font-semibold">
            {tempLabel}
          </span>
        </td>
      </tr>
    </>
  );
}

function DiversionBlockMiddle({ label, tempLabel }) {
  return (
    <tr className="p-0 m-0 h-[32px] leading-none">
      <td className="relative w-[40px] p-0 m-0">
        <div className="absolute left-[10px] top-0 bottom-0 w-[2px] bg-red-400" />
        <div className="absolute left-[30px] top-0 bottom-0 w-[2px] bg-yellow-300" />
        <MapPinOff className="absolute left-[1px] bg-[#283335] top-1/2 -translate-y-1/2 w-5 h-5 text-red-400" />
        <MapPinPlus className="absolute left-[21px] bg-[#283335] top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-400" />
      </td>

      <td className="p-0 pl-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm line-through opacity-60">
            {label}
          </span>
          <span className="text-yellow-300 text-sm font-semibold">
            {tempLabel}
          </span>
        </div>
      </td>
    </tr>
  );
}

function DiversionBlockEnd({ isLast }) {
  if (isLast) return null;

  return (
    <tr className="p-0 m-0 h-[0px] leading-none">
      <td className="relative w-[40px] p-0 m-0">
        {/* Bottom yellow horizontal */}
        <div className="absolute left-[10px] bottom-0 w-[22px] h-[3px] bg-yellow-300" />
        {/* Restore main line */}
        <div className="absolute left-[10px] top-0 bottom-0 w-[2px] bg-green-400/40" />
      </td>
      <td />
    </tr>
  );
}

function StopsListWithDiversion({ stopList, disruption, stops, direction }) {
  const affectedStops = new Set(disruption?.affectedStops || []);

  // 🆕 Convert [{closed,temp}] → { closedId : tempId }
  const tempMap = {};
  (disruption?.tempStops || []).forEach((pair) => {
    if (pair?.closed && pair?.temp) {
      tempMap[pair.closed] = pair.temp;
    }
  });

  const findStop = (sid) =>
    stops.find((s) => String(s.stopId) === String(sid)) ||
    stops.find((s) => String(s._id) === String(sid));

  const getStopLabel = (sid) => {
    const s = findStop(sid);
    if (!s) return sid;
    return `${s.name}${s.town ? ", " + s.town : ""}`;
  };

  // Determine blocked stops
  const isBlocked = stopList.map((sid) => {
    const s = findStop(sid);
    return s?.closed || affectedStops.has(sid);
  });

  // Build blocks
  const blocks = [];
  let i = 0;
  while (i < stopList.length) {
    if (!isBlocked[i]) {
      i++;
      continue;
    }
    const start = i;
    while (i < stopList.length && isBlocked[i]) i++;
    const end = i - 1;
    blocks.push({ start, end });
  }

  const blockStarts = new Set(blocks.map((b) => b.start));
  const blockMap = new Map(blocks.map((b) => [b.start, b]));

  const rows = [];
  let idx = 0;

  while (idx < stopList.length) {
    const stopId = stopList[idx];
    const s = findStop(stopId);
    const originalLabel = getStopLabel(stopId);
    const tempStopId = tempMap[stopId];
    const tempLabel = tempStopId ? getStopLabel(tempStopId) : null;

    // DIVERSION BLOCK
    if (blockStarts.has(idx)) {
      const block = blockMap.get(idx);
      const lastIndex = stopList.length - 1;
      const lastIsClosed = isBlocked[lastIndex];

      for (let j = block.start; j <= block.end; j++) {
        const stopIdJ = stopList[j];
        const originalJ = getStopLabel(stopIdJ);
        const tempStopIdJ = tempMap[stopIdJ];
        const replacementJ = tempStopIdJ ? getStopLabel(tempStopIdJ) : null;

        const isLastRouteStop = j === lastIndex;
        const isPenultimateWithClosedLast =
          j === lastIndex - 1 && lastIsClosed;

        const isTerminate =
          isLastRouteStop || isPenultimateWithClosedLast;

        let tLabel;
        if (replacementJ) {
          tLabel = replacementJ;
        } else if (isTerminate) {
          tLabel = "Terminate at previous stop";
        } else {
          tLabel = "Continue to next stop";
        }

        if (j === block.start) {
          rows.push(
            <DiversionBlockStart
              key={`block-start-${j}`}
              label={originalJ}
              tempLabel={tLabel}
              isFirst={j === 0}
            />
          );
        } else {
          rows.push(
            <DiversionBlockMiddle
              key={`block-mid-${j}`}
              label={originalJ}
              tempLabel={tLabel}
            />
          );
        }
      }

      rows.push(
        <DiversionBlockEnd
          key={`block-end-${block.end}`}
          isLast={block.end === lastIndex}
        />
      );

      idx = block.end + 1;
      continue;
    }

    // NORMAL STOP
    const isClosed = s?.closed;
    const isExplicitAffected = affectedStops.has(stopId);

    const icon = isClosed ? (
      <MapPinOff className="w-5 h-5 text-red-400" />
    ) : isExplicitAffected ? (
      <MapPinX className="w-5 h-5 text-yellow-300" />
    ) : (
      <MapPin className="w-5 h-5 text-green-300" />
    );

    rows.push(
      <tr key={`stop-${idx}`} className="h-[38px]">
        <td className="relative w-[40px] p-0">
          {idx > 0 && (
            <div className="absolute top-0 bottom-[18px] w-[2px] bg-green-400 left-[10px]" />
          )}

          <div className="absolute top-1/2 -translate-y-1/2 w-[22px] h-[22px] bg-[#283335] rounded-full flex items-center justify-center left-0">
            {icon}
          </div>

          {idx < stopList.length - 1 && (
            <div className="absolute top-[26px] bottom-0 w-[2px] bg-green-400 left-[10px]" />
          )}
        </td>

        <td className="pl-2 stop-text">
          <Link
            href={`/ycc/stops/${s?._id}`}
            className={`text-sm hover:underline underline-offset-2 ${isClosed
              ? "text-gray-500 line-through opacity-60"
              : isExplicitAffected
                ? "text-yellow-200"
                : "text-white"
              }`}
          >
            {originalLabel}
          </Link>

          {tempLabel && (
            <p className="text-yellow-300 text-xs mt-1">
              Replaced by: {tempLabel}
            </p>
          )}
        </td>
      </tr>
    );

    idx++;
  }

  return (
    <table className="w-full">
      <tbody>{rows}</tbody>
    </table>
  );
}

function LiveRouteImpactPanel({ liveRoutes, stops, lastUpdated }) {
  const [activeId, setActiveId] = useState(
    liveRoutes[0]?.id || null
  );

  // Ensure activeId is always valid when liveRoutes changes
  useEffect(() => {
    if (!liveRoutes.length) return;
    if (!activeId || !liveRoutes.some((r) => r.id === activeId)) {
      setActiveId(liveRoutes[0].id);
    }
  }, [liveRoutes, activeId]);

  if (!liveRoutes.length || !stops.length) {
    return (
      <div className="bg-[#283335] border border-white/20 rounded-b-2xl rounded-r-2xl p-4 backdrop-blur-md shadow-lg">
        <h2 className="text-lg font-semibold mb-2">
          Live route impact
        </h2>
        <p className="text-sm text-white/70">
          No specific routes are currently matched to live disruptions.
        </p>
      </div>
    );
  }

  const active =
    liveRoutes.find((r) => r.id === activeId) || liveRoutes[0];

  return (
    <div className="w-full h-full flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h2 className="text-lg font-semibold">Live route impact</h2>
        <p className="text-xs text-white/50">
          Updated: {lastUpdated?.toLocaleTimeString()}
        </p>
      </div>

      {/* Horizontal scrollable route tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-custom pb-2 mb-3 flex-shrink-0">
        {liveRoutes.map((rd) => {
          const isActive = rd.id === active.id;
          return (
            <button
              key={rd.id}
              onClick={() => setActiveId(rd.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-all
              ${isActive
                  ? 'bg-white text-black border-white/80'
                  : 'bg-white/5 text-white/70 border-white/20 hover:bg-[#283335]'
                }`}
            >
              {rd.route.number || rd.route.routeId}{' '}
              <span className="opacity-70">({rd.label})</span>
            </button>
          );
        })}
      </div>

      {/* This whole area takes remaining height */}
      <div className="flex-1 flex flex-col overflow-hidden">

        <p className="text-xs text-white/60 mb-2 flex-shrink-0">
          Showing{' '}
          <span className="font-semibold">
            {active.route.number || active.route.routeId}
          </span>{' '}
          – {active.label}
        </p>

        {/* Vertical scroll for stops */}
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-custom">

          {/* Horizontal scroll for route layout */}
          <div className="overflow-x-auto">
            <StopsListWithDiversion
              stopList={active.stopList}
              disruption={active.disruption}
              stops={stops}
              direction={active.direction}
            />
          </div>
        </div>
      </div>
    </div>
  );

}


export default function TravelUpdatesPage() {
  const [disruptions, setDisruptions] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liveUpdatedAt, setLiveUpdatedAt] = useState(new Date());

  // 🚏 Load disruptions + routes + stops
  useEffect(() => {
    async function loadData() {
      try {
        const [disRes, routeRes, stopRes] = await Promise.all([
          axios.get('/api/ycc/travel'),
          axios.get('/api/ycc/routes'),
          axios.get('/api/ycc/stops'),
        ]);

        setDisruptions(disRes.data.disruptions || []);
        setRoutes(routeRes.data.routes || []);
        setStops(stopRes.data.stops || []);
      } catch (err) {
        console.error('Failed to load travel updates:', err);
        setError('Failed to load travel updates.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [disRes, routeRes, stopRes] = await Promise.all([
          axios.get('/api/ycc/travel'),
          axios.get('/api/ycc/routes'),
          axios.get('/api/ycc/stops'),
        ]);

        setDisruptions(disRes.data.disruptions || []);
        setRoutes(routeRes.data.routes || []);
        setStops(stopRes.data.stops || []);

        setLiveUpdatedAt(new Date());
      } catch (err) {
        console.error("Auto-refresh failed:", err);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);


  // 🔍 Build a fast stopId → routes lookup map (including origin/destination)
  const stopToRoutesMap = useMemo(() => {
    const map = {};
    routes.forEach((r) => {
      const allStops = [
        ...(r.stops?.forward || []),
        ...(r.stops?.backward || []),
        r.origin,
        r.destination,
      ].filter(Boolean);

      allStops.forEach((sid) => {
        if (!map[sid]) map[sid] = new Set();
        map[sid].add(String(r._id));
      });
    });
    return map;
  }, [routes]);

  const getIconAndColor = (type, hasStops) => {
    if (hasStops) {
      return { Icon: MapPinOff, color: 'text-red-500' };
    }

    const lower = (type || '').toLowerCase();

    if (lower.includes('diversion')) {
      return { Icon: TrendingUpDown, color: 'text-yellow-400' };
    }

    if (lower.includes('stop closure') || lower.includes('suspended')) {
      return { Icon: RouteOff, color: 'text-red-500' };
    }

    return { Icon: AlertTriangle, color: 'text-yellow-400' };
  };

  // 🚦 Expand affectedRoutes automatically per disruption
  const enrichDisruptions = useMemo(() => {
    return disruptions.map((d) => {
      if (!routes.length) return { ...d, inferredRoutes: [] };

      const affectedRouteIds = new Set();

      const normalise = (rid) => String(rid).trim().toLowerCase();

      // Add manual affectedRoutes
      (d.affectedRoutes || []).forEach((rid) => {
        affectedRouteIds.add(normalise(rid));
      });

      // Add routes via affected stops
      (d.affectedStops || []).forEach((sid) => {
        const routesUsingStop = stopToRoutesMap[sid];
        if (routesUsingStop) {
          routesUsingStop.forEach((rid) => {
            affectedRouteIds.add(normalise(rid));
          });
        }
      });

      return {
        ...d,
        inferredRoutes: Array.from(affectedRouteIds)
      };
    });
  }, [disruptions, stopToRoutesMap, routes]);

  // 🌐 Build combined "live route impact" across ALL disruptions
  const liveRouteDirections = useMemo(() => {
    if (!enrichDisruptions.length || !routes.length) return [];

    const map = new Map();

    enrichDisruptions.forEach((d) => {
      (d.inferredRoutes || []).forEach((rid) => {
        const route =
          routes.find(
            (r) =>
              String(r._id) === String(rid) ||
              String(r.routeId) === String(rid)
          ) || null;
        if (!route) return;

        const impact = getRouteDirectionImpact(route, d);
        const directions = [];

        if (!impact || impact === "Both") {
          directions.push("forward", "backward");
        } else if (impact === "Outbound") {
          directions.push("forward");
        } else if (impact === "Inbound") {
          directions.push("backward");
        }

        directions.forEach((direction) => {
          const key = `${String(route._id)}-${direction}`;

          if (!map.has(key)) {
            const stopList =
              direction === "forward"
                ? [
                  route.origin,
                  ...(route.stops?.forward || []),
                  route.destination,
                ].filter(Boolean)
                : [
                  route.destination,
                  ...(route.stops?.backward || []),
                  route.origin,
                ].filter(Boolean);

            map.set(key, {
              id: key,
              route,
              direction,
              label: direction === "forward" ? "Outbound" : "Inbound",
              stopList,
              disruption: {
                affectedStops: new Set(d.affectedStops || []),
                tempStops: d.tempStops ? [...d.tempStops] : [],
              },
            });
          } else {
            const entry = map.get(key);

            (d.affectedStops || []).forEach((sid) =>
              entry.disruption.affectedStops.add(sid)
            );

            if (d.tempStops?.length) {
              entry.disruption.tempStops.push(...d.tempStops);
            }
          }
        });
      });
    });

    return Array.from(map.values()).map((entry) => ({
      ...entry,
      disruption: {
        ...entry.disruption,
        affectedStops: Array.from(entry.disruption.affectedStops),
      },
    }));
  }, [enrichDisruptions, routes]);

  // 🌀 Loading/Error
  if (loading)
    return (
      <main className="flex items-center justify-center min-h-screen text-white">
        <p>Loading network disruptions...</p>
      </main>
    );

  if (error)
    return (
      <main className="flex items-center justify-center min-h-screen text-red-500">
        <p>{error}</p>
      </main>
    );

  // 🧭 Render
  return (
    <AuthWrapper requiredRole="devPhase">
    <main className="text-white px-6 py-12">
      <div className="max-w-10xl mx-auto">

        {/* HEADER — now above BOTH columns */}
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">
          Network Travel Updates{" "}
          <span className="text-yellow-300 text-2xl">
            ({enrichDisruptions.length})
          </span>
        </h1>

        <div className="grid lg:grid-cols-[minmax(0,2.2fr)_minmax(400px,1fr)] gap-8">

          {/* LEFT: Scrollable list of disruptions */}
          <div className="p-4 max-h-[78vh] overflow-y-auto scrollbar-hidden">
            {enrichDisruptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <CheckCircle className="text-green-500 mb-4" size={48} />
                <p className="text-lg text-white/70">
                  No current disruptions reported across the network.
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {enrichDisruptions.map((d) => {
                  const { Icon, color } = getIconAndColor(
                    d.incidentType,
                    (d.affectedStops?.length || 0) > 0
                  );

                  return (
                    <Link
                      href={`/ycc/travel/${d._id}`}
                      key={d._id}
                      className="bg-[#283335] border border-white/20 rounded-b-2xl rounded-r-2xl p-6 backdrop-blur-md shadow-lg hover:scale-[1.03] transition-all duration-300 ease-[cubic-bezier(.2,1,.22,1)]"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <h2
                          className={`text-xl font-semibold flex items-center gap-2 ${color}`}
                        >
                          <Icon size={22} /> {d.incidentName}
                        </h2>
                        <p className="text-sm text-gray-400 flex items-center gap-1">
                          <Clock size={14} /> Last updated:{" "}
                          {new Date(d.incidentUpdated).toLocaleString()}
                        </p>
                      </div>

                      <p className="mt-3 text-white/80 leading-relaxed">
                        {d.incidentDescription}
                      </p>

                      <div>
                        <p className="font-semibold text-white/70 mb-2">Affected Routes</p>

                        {d.inferredRoutes?.length > 0 ? (
                          <div className="flex flex-wrap gap-2 mb-2">

                            {[...new Set(d.inferredRoutes.map(String))].map((rid) => {

                              // REAL route
                              const route = routes.find(
                                (r) =>
                                  String(r._id) === rid ||
                                  String(r.routeId) === rid
                              );
                              if (!route) return null;

                              const impact = getRouteDirectionImpact(route, d);

                              let impactLabel = "";
                              let impactColor = "text-white/70";

                              if (impact === "Both") {
                                impactLabel = "Both";
                                impactColor = "text-green-300";
                              } else if (impact === "Outbound") {
                                impactLabel = "Outbound";
                                impactColor = "text-blue-300";
                              } else if (impact === "Inbound") {
                                impactLabel = "Inbound";
                                impactColor = "text-red-300";
                              }

                              return (
                                <Link
                                  key={rid}
                                  href={`/ycc/routes/${route._id}`}
                                  className="px-3 py-1 rounded-full bg-yellow-500/20 border 
                     border-yellow-500/40 text-yellow-200 text-sm 
                     flex items-center gap-2"
                                >
                                  <span>{route.number || route.routeId}</span>
                                  {impactLabel && (
                                    <span className={`${impactColor} text-xs font-semibold`}>
                                      ({impactLabel})
                                    </span>
                                  )}
                                </Link>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-white/60">N/A</p>
                        )}

                        {d.affectedStops?.length > 0 && (
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full border border-blue-400/30">
                            <strong>Affected Stops:</strong>{" "}
                            {d.affectedStops.length}
                          </span>
                        )}
                        <span className="ml-2 px-3 py-1 bg-[#283335] text-white/70 rounded-full border border-white/20">
                          Type: {d.incidentType}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="hidden lg:block sticky top-8 self-start">
            <div className="h-[60vh] rounded-b-2xl rounded-r-2xl overflow-hidden bg-[#283335] border border-white/20 p-4">
              <LiveRouteImpactPanel
                liveRoutes={liveRouteDirections}
                stops={stops}
                lastUpdated={liveUpdatedAt}
              />
            </div>
          </div>
        </div>

        <div className="lg:hidden mt-8 rounded-b-2xl rounded-r-2xl p-4 max-h-[60vh] min-h-[60vh] overflow-y-auto no-scrollbar">
          <LiveRouteImpactPanel
            liveRoutes={liveRouteDirections}
            stops={stops}
            lastUpdated={liveUpdatedAt}
          />
        </div>
      </div>

      <style jsx global>{`
  /* Completely hidden scrollbar */
  .scrollbar-hidden {
    -ms-overflow-style: none;  /* IE & Edge */
    scrollbar-width: none;     /* Firefox */
  }
  .scrollbar-hidden::-webkit-scrollbar {
    display: none;             /* Chrome, Safari, Opera */
  }
  /* Nice custom scrollbar */
  .scrollbar-custom {
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.4) rgba(40, 51, 53, 1);
  }
  .scrollbar-custom::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .scrollbar-custom::-webkit-scrollbar-track {
    background: rgba(7,10,12,0.9);
    border-radius: 999px;
  }
  .scrollbar-custom::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.35);
    border-radius: 999px;
  }
  .scrollbar-custom::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.55);
  }
`}</style>

    </main>
    </AuthWrapper>
  );
}
