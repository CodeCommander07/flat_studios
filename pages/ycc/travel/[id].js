'use client';

import { Fragment, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  TrendingUpDown,
  RouteOff,
  MapPinOff,
  MapPin,
  MapPinPlus,
  MapPinX,
  ArrowLeft,
} from 'lucide-react';

// Helper: what impact does disruption have on this route's directions?
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
            <div className="absolute left-[10px] top-0 w-[22px] h-[3px] bg-yellow-300"></div>

            {/* Continue main route line */}
            <div className="absolute left-[10px] top-0 bottom-0 w-[2px] bg-green-400/40"></div>
          </td>
          <td />
        </tr>
      )}

      {/* MAIN ROW FOR FIRST CLOSED STOP */}
      <tr className="p-0 m-0 h-[38px] leading-none">
        <td className="relative w-[40px] p-0 m-0">

          {/* Yellow diversion vertical */}
          <div className="absolute left-[10px] top-0 bottom-0 w-[2px] bg-red-400"></div>
          <div className="absolute left-[30px] top-0 bottom-0 w-[2px] bg-yellow-300"></div>

          {/* Closed + temp icons */}
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

        <div className="absolute left-[10px] top-0 bottom-0 w-[2px] bg-red-400"></div>
        <div className="absolute left-[30px] top-0 bottom-0 w-[2px] bg-yellow-300"></div>

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
        <div className="absolute left-[10px] bottom-0 w-[22px] h-[3px] bg-yellow-300"></div>

        {/* Restore main route line */}
        <div className="absolute left-[10px] top-0 bottom-0 w-[2px] bg-green-400/40"></div>

      </td>
      <td />
    </tr>
  );
}

function StopsListWithDiversion({ stopList, disruption, stops, direction }) {
  const affectedStops = new Set(disruption?.affectedStops || []);

  // 🆕 Lookup map: closedStopId → tempStopId
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
    return `${s.name}${s.town ? ', ' + s.town : ''}`;
  };

  // Determine which stops are blocked
  const isBlocked = stopList.map((sid) => {
    const s = findStop(sid);
    return s?.closed || affectedStops.has(sid);
  });

  // Build blocks of consecutive blocked stops
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

    // --- Diversion block section ---
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
          tLabel = `${replacementJ}`;
        }
        else if (isTerminate) {
          tLabel = 'Terminate at previous stop';
        }
        else {
          tLabel = 'Continue to next stop';
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

    // --- NORMAL STOP ---
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
              ? 'text-gray-500 line-through opacity-60'
              : isExplicitAffected
                ? 'text-yellow-200'
                : 'text-white'
              }`}
          >
            {originalLabel}
          </Link>

          {tempLabel && (
            <p className="text-yellow-300 text-xs mt-1">
              {tempLabel}
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

function AffectedRoutesPanel({
  disruption,
  routes,
  stops,
  inferredRoutes,
  lastUpdate
}) {
  const routeDirections = useMemo(() => {
    if (!disruption) return [];

    const dirs = [];
    const addedDirections = new Set(); // <-- HERE (global)

    inferredRoutes.forEach((rid) => {
      const route =
        routes.find((r) => String(r._id) === String(rid)) ||
        routes.find((r) => String(r.routeId) === String(rid));
      if (!route) return;

      const impact = getRouteDirectionImpact(route, disruption);

      const addDir = (direction, label) => {
        const key = `${route._id}-${direction}`;

        // 🔥 Prevent duplicates
        if (addedDirections.has(key)) return;
        addedDirections.add(key);

        const seq = direction === "forward"
          ? [route.origin, ...(route.stops?.forward || []), route.destination]
          : [route.destination, ...(route.stops?.backward || []), route.origin];

        if (!seq.length) return;

        dirs.push({
          id: key,
          route,
          direction,
          label,
          stopList: seq,
        });
      };

      if (!impact || impact === "Both") {
        addDir("forward", "Outbound");
        addDir("backward", "Inbound");
      } else if (impact === "Outbound") {
        addDir("forward", "Outbound");
      } else if (impact === "Inbound") {
        addDir("backward", "Inbound");
      }
    });

    return dirs;
  }, [inferredRoutes, routes, disruption]);

  if (!routeDirections.length) {
    return (
      <div className="bg-[#283335] border border-white/20 rounded-b-2xl rounded-r-2xl p-4 backdrop-blur-md shadow-lg overflox-x-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Live route impact</h2>
          <p className="text-xs text-white/50">
            Updated: {lastUpdate?.toLocaleTimeString()}
          </p>
        </div>
        <p className="text-sm text-white/70">
          No specific routes have been matched to affected stops for this incident yet.
        </p>
      </div>
    );
  }

  const [activeId, setActiveId] = useState(routeDirections[0]?.id);

  const active =
    routeDirections.find((r) => r.id === activeId) ||
    routeDirections[0];

  return (
    <div className="bg-[#283335] border border-white/20 rounded-b-2xl rounded-r-2xl p-4 backdrop-blur-md shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Live route impact</h2>
        <p className="text-xs text-white/50">
          Updated: {lastUpdate?.toLocaleTimeString()}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {routeDirections.map((rd) => {
          const isActive = rd.id === active.id;
          return (
            <button
              key={rd.id}
              onClick={() => setActiveId(rd.id)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium
                border transition-all
                ${isActive
                  ? "bg-white text-black border-white/80"
                  : "bg-white/5 text-white/70 border-white/20 hover:bg-[#283335]"
                }
              `}
            >
              {rd.route.number || rd.route.routeId || "Route"}{" "}
              <span className="opacity-70">({rd.label})</span>
            </button>
          );
        })}
      </div>

      {/* Active stops list */}
      <div className="mt-2">
        <p className="text-xs text-white/60 mb-2">
          Showing{" "}
          <span className="font-semibold">
            {active.route.number || active.route.routeId}
          </span>{" "}
          – {active.label}
        </p>

        <div className="route-container relative max-h-[460px] overflow-y-auto rounded-xl scrollbar-none scroll-smooth pr-2">
          <StopsListWithDiversion
            stopList={active.stopList}
            disruption={disruption}
            stops={stops}
            direction={active.direction}
          />
        </div>
      </div>

      <style jsx>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}


export default function DisruptionDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [disruption, setDisruption] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liveUpdatedAt, setLiveUpdatedAt] = useState(new Date());


  // 🧩 Fetch disruption, routes, stops, operators
  useEffect(() => {
    if (!id) return;

    async function loadData() {
      try {
        const [disRes, routeRes, stopRes, operRes] = await Promise.all([
          axios.get(`/api/ycc/travel/${id}`),
          axios.get('/api/ycc/routes'),
          axios.get('/api/ycc/stops'),
          axios.get('/api/ycc/operators/active'),
        ]);

        setDisruption(disRes.data.disruption);
        setRoutes(routeRes.data.routes || []);
        setStops(stopRes.data.stops || []);
        setOperators(operRes.data.submissions || []);
      } catch (err) {
        console.error('Error loading disruption details:', err);
        setError('Failed to load disruption details.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  // Auto-refresh this disruption every 60 seconds
  useEffect(() => {
    if (!id) return;

    const interval = setInterval(async () => {
      try {
        const [disRes, routeRes, stopRes, operRes] = await Promise.all([
          axios.get(`/api/ycc/travel/${id}`),
          axios.get('/api/ycc/routes'),
          axios.get('/api/ycc/stops'),
          axios.get('/api/ycc/operators/active'),
        ]);

        setDisruption(disRes.data.disruption);
        setRoutes(routeRes.data.routes || []);
        setStops(stopRes.data.stops || []);
        setOperators(operRes.data.submissions || []);

        setLiveUpdatedAt(new Date());
      } catch (err) {
        console.error("Auto-refresh failed:", err);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [id]);


  // 🔍 Helpers
  const findRoute = (rid) =>
    routes.find(
      (r) => String(r._id) === String(rid) || String(r.routeId) === String(rid)
    );

  const findStop = (sid) =>
    stops.find(
      (s) => String(s._id) === String(sid) || String(s.stopId) === String(sid)
    );

  // 🧠 stopId → Set(routeId)
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
        map[sid].add(r._id);
      });
    });
    return map;
  }, [routes]);

  // 🧠 All affected routes (manual + via affected stops)
  const inferredRoutes = useMemo(() => {
    if (!disruption) return [];

    const routeIds = new Set();

    // Convert any stored route references → always convert to _id form
    const normalize = (rid) => {
      const r = routes.find(
        (x) =>
          String(x._id) === String(rid) ||
          String(x.routeId) === String(rid)
      );
      return r ? String(r._id) : null;
    };

    // 1. Add manually-defined affected routes
    (disruption.affectedRoutes || []).forEach((rid) => {
      const nid = normalize(rid);
      if (nid) routeIds.add(nid);
    });

    // 2. Add routes using affected stops
    (disruption.affectedStops || []).forEach((sid) => {
      const usedBy = stopToRoutesMap[sid];
      if (usedBy) {
        usedBy.forEach((rid) => {
          const nid = normalize(rid);
          if (nid) routeIds.add(nid);
        });
      }
    });

    return [...routeIds]; // all unique by _id
  }, [disruption, stopToRoutesMap, routes]);

  // 🧠 All affected operators (deduped by _id)
  const affectedOperators = useMemo(() => {
    const map = {};

    inferredRoutes.forEach((rid) => {
      const r = findRoute(rid);
      if (!r?.operator) return;

      const routeOperators = Array.isArray(r.operator)
        ? r.operator
        : [r.operator];

      routeOperators.forEach((rOp) => {
        const match = operators.find((op) =>
          String(op._id) === String(rOp) ||
          (op.slug || '').toLowerCase() === String(rOp).toLowerCase() ||
          (op.operatorName || '').toLowerCase() === String(rOp).toLowerCase()
        );
        if (match) {
          map[match._id] = match;
        }
      });
    });

    return Object.values(map);
  }, [inferredRoutes, operators, routes]);

  // 🎨 Icon + color
  const getIconAndColor = (type, hasStops) => {
    if (hasStops) {
      return { Icon: MapPinOff, color: 'text-red-500' };
    }

    const lower = (type || '').toLowerCase();

    if (lower.includes('diversion')) {
      return { Icon: TrendingUpDown, color: 'text-yellow-400' };
    }

    if (lower.includes('closure') || lower.includes('suspended')) {
      return { Icon: RouteOff, color: 'text-red-500' };
    }

    return { Icon: AlertTriangle, color: 'text-yellow-400' };
  };

  // 🌀 States
  if (loading)
    return (
      <p className="text-white text-center mt-12">
        Loading disruption details…
      </p>
    );

  if (error)
    return (
      <p className="text-red-500 text-center mt-12">
        {error}
      </p>
    );

  if (!disruption)
    return (
      <p className="text-white text-center mt-12">
        Disruption not found.
      </p>
    );

  const { Icon, color } = getIconAndColor(
    disruption.incidentType,
    (disruption.affectedStops || []).length > 0
  );

  return (
    <main className="text-white px-4 sm:px-6 py-8 flex flex-col items-center">
      <div className="w-full max-w-10xl grid lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-8">
        {/* LEFT: Disruption content */}
        <div>
          {/* 🧊 Main card */}
          <div className="bg-[#283335] border border-white/20 rounded-b-2xl rounded-r-2xl p-6 backdrop-blur-md shadow-lg mb-8">

            {/* Header Row: Back button + Reported on */}
            <div className="flex items-center justify-between mb-6">

              {/* Back button */}
              <Link
                href="/ycc/travel"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
              >
                <ArrowLeft size={18} /> Back to all updates
              </Link>

              {/* Reported on */}
              <p className="text-sm text-white/70 flex items-center gap-1">
                <Clock size={14} /> Reported on:{' '}
                {new Date(disruption.incidentDate).toLocaleString()}
              </p>
            </div>

            {/* Title + Updated time */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className={`text-2xl font-bold flex items-center gap-2 ${color}`}>
                <Icon size={26} /> {disruption.incidentName}
              </h1>

              <p className="text-sm text-white/70 flex items-center gap-1">
                <Clock size={14} /> Last updated:{' '}
                {new Date(disruption.incidentUpdated).toLocaleString()}
              </p>
            </div>
            {/* Details grid */}
            <div className="mt-6 space-y-6 text-sm">
              {/* Incident type */}
              <div>
                <p className="font-semibold text-white/70 mb-1">Incident Type</p>
                <span className={`${color} font-medium`}>
                  {disruption.incidentType}
                </span>
              </div>
              {Array.isArray(disruption.tempStops) && disruption.tempStops.length > 0 && (
                <div>
                  <p className="font-semibold text-white/70 mb-1">Temporary Stop</p>

                  <span className="text-orange-400 font-medium">
                    {(() => {
                      const t = disruption.tempStops[0]; // only one per stop
                      if (!t) return "—";

                      const temp = stops.find(
                        s => String(s.stopId) === String(t.temp)
                      );
                      if (!temp) return t.temp;

                      return `${temp.name}${temp.town ? ", " + temp.town : ""}`;
                    })()}
                  </span>
                </div>
              )}



              {/* Affected routes */}
              <div>
                <p className="font-semibold text-white/70 mb-2">Affected Routes</p>
                {inferredRoutes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {[...new Set(inferredRoutes)].map((rid) => {
                      const route = findRoute(rid);
                      if (!route) return null;

                      const impact = getRouteDirectionImpact(route, disruption);

                      let impactLabel = '';
                      let impactColor = 'text-white/70';

                      if (impact === 'Both') {
                        impactLabel = 'Both';
                        impactColor = 'text-green-300';
                      } else if (impact === 'Outbound') {
                        impactLabel = 'Outbound';
                        impactColor = 'text-blue-300';
                      } else if (impact === 'Inbound') {
                        impactLabel = 'Inbound';
                        impactColor = 'text-red-300';
                      }

                      return (
                        <Link
                          key={rid}
                          href={`/ycc/routes/${route._id}`}
                          className="px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-200 text-sm flex items-center gap-2"
                        >
                          <span>{route.number}</span>
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
              </div>

              {/* Affected operators */}
              <div>
                <p className="font-semibold text-white/70 mb-2">Affected Operators</p>
                {affectedOperators.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {affectedOperators.map((op) => (
                      <div
                        key={op._id}
                        className="flex items-center gap-3 px-4 py-2 rounded-2xl border border-white/20 bg-[#283335] backdrop-blur shadow-sm hover:bg-white/20 transition cursor-default"
                        style={{
                          borderLeft: `6px solid ${op.operatorColour || '#ffffff'}`,
                        }}
                      >
                        {op.logo && (
                          <div
                            className="w-7 h-7 rounded-md flex items-center justify-center overflow-hidden"
                            style={{
                              backgroundColor: (op.operatorColour || '#ffffff') + '40',
                            }}
                          >
                            <img
                              src={op.logo}
                              alt={op.operatorName}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}

                        <span
                          className="font-semibold"
                          style={{ color: op.operatorColour || '#ffffff' }}
                        >
                          {op.operatorName}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/60">N/A</p>
                )}
              </div>

              {/* Affected stops */}
              <div>
                <p className="font-semibold text-white/70 mb-2">Affected Stops</p>
                {disruption.affectedStops?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {disruption.affectedStops.map((sid) => {
                      const stop = findStop(sid);
                      const label = stop
                        ? `${stop.name}${stop.town ? ', ' + stop.town : ''}`
                        : sid;
                      return (
                        <Link
                          key={sid}
                          href={`/ycc/stops/${stop?._id || sid}`}
                          className="px-3 py-1 rounded-md bg-[#283335] border border-white/20 hover:bg-white/20 transition text-sm"
                        >
                          {label}
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-white/60">N/A</p>
                )}
              </div>

              {/* Dates */}
              <p className="text-sm text-white/70">
                Reported on:{' '}
                {new Date(disruption.incidentDate).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT — desktop sidebar */}
        <div className="hidden lg:block sticky top-8 self-start">
          <AffectedRoutesPanel
            disruption={disruption}
            routes={routes}
            stops={stops}
            inferredRoutes={inferredRoutes}
            lastUpdate={liveUpdatedAt}
          />
        </div>
      </div>

      {/* Mobile: panel below content */}
      <div className="w-full max-w-7xl mt-6 lg:hidden">
        <AffectedRoutesPanel
          disruption={disruption}
          routes={routes}
          stops={stops}
          inferredRoutes={inferredRoutes}
          lastUpdate={liveUpdatedAt}
        />
      </div>
      <style jsx global>{`
  .stop-text span,
  .stop-text a {
    display: inline-block;
    line-height: 1rem;
  }
`}</style>
    </main>
  );
}
