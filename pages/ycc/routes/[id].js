'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import {
  AlertTriangle,
  MapPinOff,
  MapPin,
  MapPinPlus,
  MapPinX,
  Route as RouteIcon,
  ArrowLeft,
} from 'lucide-react';
import AuthWrapper from '@/components/AuthWrapper';

/* ------------------- HELPER: impact per direction ------------------- */
function getRouteDirectionImpact(route, disruption) {
  if (!route || !disruption?.affectedStops?.length) return null;

  const affectedStops = (disruption.affectedStops || []).map(String);

  const outboundSeq = [
    route.origin,
    ...(route.stops?.forward || []),
    route.destination,
  ]
    .filter(Boolean)
    .map(String);

  const inboundSeq = [
    route.destination,
    ...(route.stops?.backward || []),
    route.origin,
  ]
    .filter(Boolean)
    .map(String);

  const outboundAffected = outboundSeq.some((id) =>
    affectedStops.includes(String(id))
  );
  const inboundAffected = inboundSeq.some((id) =>
    affectedStops.includes(String(id))
  );

  if (outboundAffected && inboundAffected) return 'Both';
  if (outboundAffected) return 'Outbound';
  if (inboundAffected) return 'Inbound';
  return null;
}

/* ------------------- DIVERSION BLOCK PIECES ------------------- */
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

          {/* Closed + temp icons – bg matches panel */}
          <MapPinOff className="absolute left-[1px] bg-[#1f2729] top-1/2 -translate-y-1/2 w-5 h-5 text-red-400 rounded-md" />
          <MapPinPlus className="absolute left-[20px] bg-[#1f2729] top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-400 rounded-md" />
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

        <MapPinOff className="absolute left-[1px] bg-[#1f2729] top-1/2 -translate-y-1/2 w-5 h-5 text-red-400 rounded-md" />
        <MapPinPlus className="absolute left-[21px] bg-[#1f2729] top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-400 rounded-md" />
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

/* ------------------- STOPS LIST WITH DIVERSION ------------------- */
function StopsListWithDiversion({ stopList, disruption, stops, direction }) {
  const affectedStops = new Set(
    (disruption?.affectedStops || []).map((x) => String(x))
  );

  // closedStopId → tempStopId
  const tempMap = {};
  (disruption?.tempStops || []).forEach((pair) => {
    if (pair?.closed && pair?.temp) {
      tempMap[String(pair.closed)] = pair.temp;
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
    return s?.closed || affectedStops.has(String(sid));
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
    const tempStopId = tempMap[String(stopId)];
    const tempLabel = tempStopId ? getStopLabel(tempStopId) : null;

    // --- Diversion block section ---
    if (blockStarts.has(idx)) {
      const block = blockMap.get(idx);
      const lastIndex = stopList.length - 1;
      const lastIsClosed = isBlocked[lastIndex];

      for (let j = block.start; j <= block.end; j++) {
        const stopIdJ = stopList[j];
        const originalJ = getStopLabel(stopIdJ);
        const tempStopIdJ = tempMap[String(stopIdJ)];
        const replacementJ = tempStopIdJ ? getStopLabel(tempStopIdJ) : null;

        const isLastRouteStop = j === lastIndex;
        const isPenultimateWithClosedLast =
          j === lastIndex - 1 && lastIsClosed;

        const isTerminate = isLastRouteStop || isPenultimateWithClosedLast;

        let tLabel;
        if (replacementJ) {
          tLabel = `${replacementJ}`;
        } else if (isTerminate) {
          tLabel = 'Terminate at previous stop';
        } else {
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
    const isExplicitAffected = affectedStops.has(String(stopId));

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

          {/* icon background now matches panel bg */}
          <div className="absolute top-1/2 -translate-y-1/2 w-[22px] h-[22px] bg-[#1f2729] rounded-full flex items-center justify-center left-0">
            {icon}
          </div>

          {idx < stopList.length - 1 && (
            <div className="absolute top-[26px] bottom-0 w-[2px] bg-green-400 left-[10px]" />
          )}
        </td>

        <td className="pl-2 stop-text">
          <Link
            href={s ? `/ycc/stops/${s._id}` : '#'}
            className={`text-sm hover:underline underline-offset-2 ${
              isClosed
                ? 'text-gray-500 line-through opacity-60'
                : isExplicitAffected
                ? 'text-yellow-200'
                : 'text-white'
            }`}
          >
            {originalLabel}
          </Link>

          {tempLabel && (
            <p className="text-yellow-300 text-xs mt-1">{tempLabel}</p>
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

/* ------------------- RIGHT PANEL: LIVE IMPACT (PER-ROUTE) ------------------- */
function AffectedRoutesPanel({
  disruption,
  routes,
  stops,
  inferredRoutes,
  lastUpdate,
}) {
  const [activeId, setActiveId] = useState(null);

  const routeDirections = useMemo(() => {
    if (!routes?.length || !inferredRoutes?.length) return [];

    const dirs = [];
    const added = new Set();

    inferredRoutes.forEach((rid) => {
      const route =
        routes.find((r) => String(r._id) === String(rid)) ||
        routes.find((r) => String(r.routeId) === String(rid));
      if (!route) return;

      const addDir = (direction, label) => {
        const key = `${route._id}-${direction}`;
        if (added.has(key)) return;
        added.add(key);

        const seq =
          direction === 'forward'
            ? [
                route.origin,
                ...(route.stops?.forward || []),
                route.destination,
              ]
            : [
                route.destination,
                ...(route.stops?.backward || []),
                route.origin,
              ];

        const stopList = seq.filter(Boolean);
        if (!stopList.length) return;

        dirs.push({
          id: key,
          route,
          direction,
          label,
          stopList,
        });
      };

      // If we have a disruption, only show impacted directions
      if (disruption) {
        const impact = getRouteDirectionImpact(route, disruption);

        if (!impact) {
          // route not actually impacted – you might still want to show it
          // but we'll still show both directions to keep UX consistent
          addDir('forward', 'Outbound');
          addDir('backward', 'Inbound');
        } else if (impact === 'Both') {
          addDir('forward', 'Outbound');
          addDir('backward', 'Inbound');
        } else if (impact === 'Outbound') {
          addDir('forward', 'Outbound');
        } else if (impact === 'Inbound') {
          addDir('backward', 'Inbound');
        }
      } else {
        // No disruption: always show both directions
        addDir('forward', 'Outbound');
        addDir('backward', 'Inbound');
      }
    });

    return dirs;
  }, [inferredRoutes, routes, disruption]);

  // ensure active tab always valid
  useEffect(() => {
    if (routeDirections.length && !activeId) {
      setActiveId(routeDirections[0].id);
    }
    if (
      routeDirections.length &&
      activeId &&
      !routeDirections.some((r) => r.id === activeId)
    ) {
      setActiveId(routeDirections[0].id);
    }
  }, [routeDirections, activeId]);

  if (!routeDirections.length) return null;

  const active =
    routeDirections.find((r) => r.id === activeId) || routeDirections[0];

  return (
    <div className="bg-[#283335] border border-white/20 rounded-b-2xl rounded-r-2xl p-4 backdrop-blur-md shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Live route impact</h2>
        <p className="text-xs text-white/50">
          Updated: {lastUpdate?.toLocaleTimeString()}
        </p>
      </div>

      {/* Info line */}
      {!disruption ? (
        <p className="text-xs text-white/50 mb-3">
          No live disruptions reported – showing normal route.
        </p>
      ) : (
        <p className="text-xs text-yellow-200 mb-3 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          This route is currently affected by a disruption.
        </p>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {routeDirections.map((rd) => {
          const isActive = rd.id === active.id;
          return (
            <button
              key={rd.id}
              onClick={() => setActiveId(rd.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                isActive
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

      {/* Stops list */}
      <div className="mt-2">
        <p className="text-xs text-white/60 mb-2">
          Showing{' '}
          <span className="font-semibold">
            {active.route.number || active.route.routeId}
          </span>{' '}
          – {active.label}
        </p>

        <div className="relative max-h-[460px] overflow-y-auto rounded-xl scrollbar-none scroll-smooth pr-2 bg-black/20 border border-white/10 p-3">
          <StopsListWithDiversion
            stopList={active.stopList}
            disruption={disruption || {}} // safe empty – no diversion blocks if no disruption
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

/* ------------------- MAIN ROUTE DETAIL PAGE ------------------- */
export default function RouteDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [route, setRoute] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [operators, setOperators] = useState([]);
  const [disruptions, setDisruptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liveUpdatedAt, setLiveUpdatedAt] = useState(new Date());

  // helper to resolve stop name from ID
  const resolveStopLabel = (sid) => {
    if (!sid) return null;
    const s =
      stops.find((x) => String(x.stopId) === String(sid)) ||
      stops.find((x) => String(x._id) === String(sid));
    if (!s) return sid;
    return `${s.name}${s.town ? ', ' + s.town : ''}`;
  };

  // fetch route + routes list + stops + disruptions + operators
  useEffect(() => {
    if (!id) return;

    async function loadData() {
      try {
        const [routeRes, routesRes, stopRes, disRes, opRes] =
          await Promise.all([
            axios.get(`/api/ycc/routes/${id}`),
            axios.get('/api/ycc/routes'),
            axios.get('/api/ycc/stops'),
            axios.get('/api/ycc/travel'),
            axios.get('/api/ycc/operators/active'),
          ]);

        setRoute(routeRes.data.route);
        setRoutes(routesRes.data.routes || []);
        setStops(stopRes.data.stops || []);
        setDisruptions(disRes.data.disruptions || []);
        setOperators(opRes.data.submissions || []);
      } catch (err) {
        console.error('Error loading route details:', err);
        setError('Failed to load route details.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  // auto-refresh disruptions every 60s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get('/api/ycc/travel');
        setDisruptions(res.data.disruptions || []);
        setLiveUpdatedAt(new Date());
      } catch (err) {
        console.error('Auto-refresh failed:', err);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // stop list sequences
  const forwardStopList = useMemo(() => {
    if (!route) return [];
    return [
      route.origin,
      ...(route.stops?.forward || []),
      route.destination,
    ].filter(Boolean);
  }, [route]);

  const backwardStopList = useMemo(() => {
    if (!route) return [];
    return [
      route.destination,
      ...(route.stops?.backward || []),
      route.origin,
    ].filter(Boolean);
  }, [route]);

  const routeStopIds = useMemo(
    () =>
      [...forwardStopList, ...backwardStopList].map((sid) => String(sid)),
    [forwardStopList, backwardStopList]
  );

  // pick the "current" disruption for this route (if any)
  const disruption = useMemo(() => {
    if (!route) return null;

    return (
      disruptions.find((d) =>
        (d.affectedRoutes || []).some(
          (rid) =>
            String(rid) === String(route._id) ||
            String(rid) === String(route.routeId)
        )
      ) ||
      disruptions.find((d) =>
        (d.affectedStops || []).some((sid) =>
          routeStopIds.includes(String(sid))
        )
      ) ||
      null
    );
  }, [disruptions, route, routeStopIds]);

  // inferred routes for the panel — ALWAYS this route, even if no disruption
  const inferredRoutes = useMemo(() => {
    if (!route) return [];
    return [route._id];
  }, [route]);

  const originLabel = useMemo(
    () =>
      route
        ? resolveStopLabel(route.origin) || 'Origin unknown'
        : 'Origin unknown',
    [route, stops]
  );

  const destinationLabel = useMemo(
    () =>
      route
        ? resolveStopLabel(route.destination) || 'Destination unknown'
        : 'Destination unknown',
    [route, stops]
  );

  if (loading) {
    return (
      <p className="text-white text-center mt-12">
        Loading route details…
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-red-500 text-center mt-12">
        {error}
      </p>
    );
  }

  if (!route) {
    return (
      <p className="text-white text-center mt-12">
        Route not found.
      </p>
    );
  }

  return (
        <AuthWrapper requiredRole="devPhase">
    <main className="text-white px-4 md:px-6 py-8 md:py-12 flex flex-col items-center">
      <div className="w-full max-w-7xl bg-[#1f2729] border border-white/15 rounded-2xl shadow-xl backdrop-blur-xl overflow-hidden">
        {/* HEADER / SUMMARY BAR */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-5 py-4 border-b border-white/10 bg-black/20">
          <div>
            <div className="mb-2">
              <Link
                href="/ycc/routes"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
              >
                <ArrowLeft size={16} />
                Back to all routes
              </Link>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <RouteIcon className="w-6 h-6" />
              {route.number || route.routeId || 'Route'}
            </h1>

            <p className="text-sm text-white/60">
              {originLabel} → {destinationLabel}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-[#283335] border border-white/20">
              {forwardStopList.length} outbound stop
              {forwardStopList.length === 1 ? '' : 's'}
            </span>
            <span className="px-3 py-1 rounded-full bg-[#283335] border border-white/20">
              {backwardStopList.length} inbound stop
              {backwardStopList.length === 1 ? '' : 's'}
            </span>
            {disruption && (
              <span className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/60 text-red-200 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Live disruption
              </span>
            )}
          </div>
        </div>

        {/* BODY: left summary / operators, right live impact panel */}
        <div className="p-5 grid lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-8">
          {/* LEFT: Route summary + operators */}
          <div className="space-y-6">
            {/* Route info card */}
            <div className="bg-white/5 border border-white/15 rounded-xl p-4 text-sm space-y-2">
              <p>
                <strong>Description:</strong>{' '}
                {route.description || 'No description provided.'}
              </p>
              {route.notes && (
                <p>
                  <strong>Notes:</strong> {route.notes}
                </p>
              )}
              <p>
                <strong>Last updated:</strong>{' '}
                {route.updatedAt
                  ? new Date(route.updatedAt).toLocaleString()
                  : 'Unknown'}
              </p>
            </div>

            {/* Operators block */}
            {Array.isArray(route.operator) && route.operator.length > 0 && (
              <div className="bg-[#283335] border border-white/20 rounded-xl p-4 text-sm space-y-3">
                <p className="font-semibold text-white/70">Operator(s)</p>
                <div className="flex flex-wrap gap-3">
                  {route.operator.map((opId) => {
                    const op = operators.find(
                      (o) => String(o._id) === String(opId)
                    );
                    if (!op) return null;

                    return (
                      <div
                        key={op._id}
                        className="flex items-center gap-3 px-4 py-2 rounded-2xl border border-white/20 bg-[#1f2729] backdrop-blur shadow-sm hover:bg-white/10 transition cursor-default"
                        style={{
                          borderLeft: `6px solid ${
                            op.operatorColour || '#ffffff'
                          }`,
                        }}
                      >
                        {op.logo && (
                          <div
                            className="w-7 h-7 rounded-md flex items-center justify-center overflow-hidden"
                            style={{
                              backgroundColor:
                                (op.operatorColour || '#ffffff') + '40',
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
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Live route impact panel */}
          <div className="hidden lg:block sticky top-8 self-start">
            <AffectedRoutesPanel
              disruption={disruption}
              routes={route ? [route] : []}
              stops={stops}
              inferredRoutes={inferredRoutes}
              lastUpdate={liveUpdatedAt}
            />
          </div>
        </div>
      </div>

      {/* Mobile: panel below content */}
      <div className="w-full max-w-7xl mt-6 lg:hidden">
        <AffectedRoutesPanel
          disruption={disruption}
          routes={route ? [route] : []}
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
        </AuthWrapper>
  );
}
