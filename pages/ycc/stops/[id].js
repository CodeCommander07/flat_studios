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

/* ------------------- STOP LOOKUP HELPERS ------------------- */

// Build lookup maps once so we don't keep linear-searching `stops`
function buildStopLookup(stops) {
  const byStopId = new Map();
  const byMongoId = new Map();

  (stops || []).forEach((s) => {
    if (s.stopId) byStopId.set(String(s.stopId), s);
    if (s._id) byMongoId.set(String(s._id), s);
  });

  return { byStopId, byMongoId };
}

// Given "whatever ID" (stopId or _id), get the stop
function getStopByAnyId(lookup, sid) {
  if (!lookup || sid == null) return null;
  const key = String(sid);
  return lookup.byStopId.get(key) || lookup.byMongoId.get(key) || null;
}

// Canonicalise any stop reference to its stopId string
function canonicalStopId(lookup, sid) {
  if (!sid) return null;

  const key = String(sid);

  // DIRECT: stopId or mongoId
  const found =
    lookup.byStopId.get(key) || lookup.byMongoId.get(key);

  if (found) return String(found.stopId);

  // 🔥 FIX: if sid is something weird (ObjectId, object, or mixed type)
  // try resolving by ANY field
  for (const s of lookup.byStopId.values()) {
    if (
      String(s._id) === key ||
      String(s.stopId) === key ||
      String(s.tempStopId) === key
    ) {
      return String(s.stopId);
    }
  }

  // fallback to raw
  return key;
}
/* ------------------- CLOSED FLAG NORMALISER ------------------- */

function isClosedFlag(raw) {
  // raw can be the whole stop doc or just the value
  const value = raw && typeof raw === 'object' ? raw.closed : raw;

  if (typeof value === 'boolean') return value;

  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'closed'].includes(v)) return true;
    if (['false', '0', 'no', 'n', 'open'].includes(v)) return false;
    // unknown string → treat as open by default
    return false;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  // undefined / null / anything else → open
  return false;
}

/* ------------------- DIVERSION BLOCK PIECES ------------------- */

function DiversionBlockStart({ label, tempLabel, isFirst }) {
  return (
    <>
      {!isFirst && (
        <tr className="p-0 m-0 h-[0px] leading-none">
          <td className="relative w-[40px] p-0 m-0">
            {/* Top yellow horizontal */}
            <div className="absolute left-[10px] top-0 w-[22px] h-[3px] bg-yellow-300" />
            {/* Continue main route line */}
            <div className="absolute left-[10px] top-0 bottom-0 w-[2px] bg-green-400/40" />
          </td>
          <td />
        </tr>
      )}

      {/* MAIN ROW FOR FIRST CLOSED / DIVERTED STOP */}
      <tr className="p-0 m-0 h-[38px] leading-none">
        <td className="relative w-[40px] p-0 m-0">
          {/* Red main line */}
          <div className="absolute left-[10px] top-0 bottom-0 w-[2px] bg-red-400" />
          {/* Yellow diversion vertical */}
          <div className="absolute left-[30px] top-0 bottom-0 w-[2px] bg-yellow-300" />

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
        <div className="absolute left-[10px] top-0 bottom-0 w-[2px] bg-red-400" />
        <div className="absolute left-[30px] top-0 bottom-0 w-[2px] bg-yellow-300" />

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
        <div className="absolute left-[10px] bottom-0 w-[22px] h-[3px] bg-yellow-300" />
        {/* Restore main route line */}
        <div className="absolute left-[10px] top-0 bottom-0 w-[2px] bg-green-400/40" />
      </td>
      <td />
    </tr>
  );
}

/* ------------------- STOPS LIST WITH DIVERSION ------------------- */
/**
 * disruptionForRoute shape:
 * {
 *   affectedStops: [stopKey, ...], // canonical stopIds
 *   tempStops: [{ closed, temp }, ...] // closed & temp = canonical stopIds
 * }
 */
function StopsListWithDiversion({ stopList, disruptionForRoute, stops, stopLookup }) {
  const lookup = stopLookup || buildStopLookup(stops);
  const closedId = disruptionForRoute?.affectedStops?.[0] || null;
  const tempId = disruptionForRoute?.tempStops?.[0]?.temp || null;

  return (
    <table className="w-full">
      <tbody>
        {stopList.map((sid, i) => {
          const cid = canonicalStopId(lookup, sid);
          const stop = lookup.byStopId.get(cid);
          const label = stop ? `${stop.name}, ${stop.town}` : cid;

          const isClosed = cid === closedId;
          const replacement = tempId
            ? lookup.byStopId.get(tempId)
            : null;

          const icon = isClosed
            ? <MapPinOff className="w-5 h-5 text-red-400" />
            : <MapPin className="w-5 h-5 text-green-300" />;

          return (
            <tr key={i} className="h-[38px]">
              <td className="relative w-[40px] p-0">
                {/* Line */}
                {i > 0 && <div className="absolute top-0 bottom-[18px] w-[2px] bg-green-400 left-[10px]" />}
                {i < stopList.length - 1 && <div className="absolute top-[26px] bottom-0 w-[2px] bg-green-400 left-[10px]" />}

                {/* Icon bubble */}
                <div className="absolute top-1/2 -translate-y-1/2 w-[22px] h-[22px] bg-[#1f2729] rounded-full flex items-center justify-center left-0">
                  {icon}
                </div>
              </td>

              <td className="pl-2 stop-text">
                <Link
                  href={stop ? `/ycc/stops/${stop._id}` : '#'}
                  className={`text-sm hover:underline underline-offset-2 ${isClosed ? 'text-red-300' : 'text-white'}`}
                >
                  {label}
                </Link>

                {isClosed && replacement && (
                  <p className="text-yellow-300 text-xs mt-1">
                    Closed — temporary stop: {replacement.name}, {replacement.town}
                  </p>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ------------------- HELPERS ------------------- */

function routeIsAffectedByTravel(route, disruption) {
  if (!route || !disruption) return false;

  const routeIds = [route._id, route.routeId].filter(Boolean).map(String);

  const byRoute = (disruption.affectedRoutes || []).some((rid) =>
    routeIds.includes(String(rid))
  );
  if (byRoute) return true;

  // If disruption is by stop-only, the detail panel handles that via blocks.
  return (disruption.affectedStops || []).length > 0;
}

/**
 * Build per-route disruption info (travel + route.diversion)
 * Returns { affectedStops, tempStops } with canonical stopIds.
 */
function buildRouteDisruptionForRoute(route, disruption, stopLookup) {
  if (!disruption) return null;

  // Only ONE affected closed stop (from the stop itself)
  const closedCid = canonicalStopId(stopLookup, disruption.closedStopId);

  // Only ONE temp stop
  const tempCid = disruption.tempStopId
    ? canonicalStopId(stopLookup, disruption.tempStopId)
    : null;

  // Only treat stops THAT ARE ON THIS ROUTE as affected
  const seq = [
    route.origin,
    ...(route.stops?.forward || []),
    route.destination,
    route.destination,
    ...(route.stops?.backward || []),
    route.origin,
  ]
    .filter(Boolean)
    .map((sid) => canonicalStopId(stopLookup, sid));

  if (!seq.includes(closedCid)) return null;

  const affectedStops = [closedCid];
  const tempStops = tempCid ? [{ closed: closedCid, temp: tempCid }] : [];

  return {
    affectedStops,
    tempStops,
  };
}

/* ------------------- RIGHT PANEL: LIVE IMPACT (PER-ROUTE) ------------------- */

function AffectedRoutesPanel({
  disruption,
  routes,
  stops,
  inferredRoutes,
  lastUpdate,
  selectedRouteId,
  selectedDirection,
}) {
  const [activeId, setActiveId] = useState(null);
  const stopLookup = useMemo(() => buildStopLookup(stops), [stops]);

  const routeDirections = useMemo(() => {
    if (!routes?.length || !inferredRoutes?.length) return [];

    const dirs = [];

    inferredRoutes.forEach((rid) => {
      const route =
        routes.find((r) => String(r._id) === String(rid)) ||
        routes.find((r) => String(r.routeId) === String(rid));
      if (!route) return;

      const addDir = (direction, label) => {
        const key = `${route._id}-${direction}`;

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

        if (!seq.length) return;

        const routeDisruptionForUI = buildRouteDisruptionForRoute(
          route,
          disruption,
          stopLookup
        );

        dirs.push({
          id: key,
          route,
          direction,
          label,
          stopList: seq,
          routeDisruptionForUI,
        });
      };

      addDir('forward', 'Outbound');
      addDir('backward', 'Inbound');
    });

    return dirs;
  }, [inferredRoutes, routes, disruption, stopLookup]);

  // Sync active tab with clicked route/direction
  useEffect(() => {
    if (!routeDirections.length || !selectedRouteId) return;
    const dir = selectedDirection || 'forward';
    const targetId = `${selectedRouteId}-${dir}`;
    const exists = routeDirections.some((rd) => rd.id === targetId);
    if (exists) setActiveId(targetId);
  }, [routeDirections, selectedRouteId, selectedDirection]);

  // Ensure active tab stays valid
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
      {!disruption && !active.route.diversion?.active ? (
        <p className="text-xs text-white/50 mb-3">
          No live disruptions reported – showing normal routes serving this stop.
        </p>
      ) : (
        <p className="text-xs text-yellow-200 mb-3 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          One or more routes serving this stop are currently affected by a
          disruption.
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
              {rd.route.number || rd.route.routeId || 'Route'}{' '}
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
            disruptionForRoute={active.routeDisruptionForUI}
            stops={stops}
            stopLookup={stopLookup}
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

/* ------------------- MAIN STOP DETAIL PAGE ------------------- */

export default function StopDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [stop, setStop] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [operators, setOperators] = useState([]);
  const [disruptions, setDisruptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liveUpdatedAt, setLiveUpdatedAt] = useState(new Date());
  const [openRouteId, setOpenRouteId] = useState(null); // which route is expanded
  const [openDirection, setOpenDirection] = useState('forward'); // outbound/inbound for expanded + live panel

  // fetch stop + routes list + stops + disruptions + operators
  useEffect(() => {
    if (!id) return;

    async function loadData() {
      try {
        const [stopRes, routesRes, stopListRes, disRes, opRes] =
          await Promise.all([
            axios.get(`/api/ycc/stops/${id}`),
            axios.get('/api/ycc/routes'),
            axios.get('/api/ycc/stops'),
            axios.get('/api/ycc/travel'),
            axios.get('/api/ycc/operators/active'),
          ]);

        setStop(stopRes.data.stop);
        setRoutes(routesRes.data.routes || []);
        setStops(stopListRes.data.stops || []);
        setDisruptions(disRes.data.disruptions || []);
        setOperators(opRes.data.submissions || []);
      } catch (err) {
        console.error('Error loading stop details:', err);
        setError('Failed to load stop details.');
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

  const stopLookup = useMemo(() => buildStopLookup(stops), [stops]);

  // Routes that serve this stop
  const routesAtStop = useMemo(() => {
    if (!stop || !routes.length) return [];
    const idVal = String(stop.stopId);

    return routes.filter((r) => {
      const seq = [
        r.origin,
        ...(r.stops?.forward || []),
        r.destination,
        r.destination,
        ...(r.stops?.backward || []),
        r.origin,
      ]
        .filter(Boolean)
        .map((sid) => canonicalStopId(stopLookup, sid));

      return seq.includes(idVal);
    });
  }, [routes, stop, stopLookup]);

  // Operators that serve this stop
  const operatorsAtStop = useMemo(() => {
    if (!routesAtStop.length || !operators.length) return [];

    const opIds = new Set();
    routesAtStop.forEach((r) => {
      const ids = Array.isArray(r.operator) ? r.operator : [r.operator];
      ids.filter(Boolean).forEach((id) => opIds.add(String(id)));
    });

    return operators.filter((op) => opIds.has(String(op._id)));
  }, [routesAtStop, operators]);

  // pick the "current" travel disruption affecting this stop (if any)
const disruption = useMemo(() => {
  if (!stop) return null;

  if (!stop.closed) return null;

  return {
    closedStopId: stop.stopId,
    tempStopId: stop.tempStopId || null,
  };
}, [stop]);

  // stopId → Set(routeId)
  const stopToRoutesMap = useMemo(() => {
    const map = {};
    routes.forEach((r) => {
      const allStops = [
        r.origin,
        ...(r.stops?.forward || []),
        r.destination,
        r.destination,
        ...(r.stops?.backward || []),
        r.origin,
      ].filter(Boolean);

      allStops.forEach((sid) => {
        const cid = canonicalStopId(stopLookup, sid);
        const key = String(cid);
        if (!map[key]) map[key] = new Set();
        map[key].add(String(r._id));
      });
    });
    return map;
  }, [routes, stopLookup]);

  // Inferred routes to feed the right-hand panel
  const inferredRoutes = useMemo(() => {
    if (!disruption) {
      return routesAtStop.map((r) => String(r._id));
    }

    const routeIds = new Set();

    const normalize = (rid) => {
      const r = routes.find(
        (x) =>
          String(x._id) === String(rid) ||
          String(x.routeId) === String(rid)
      );
      return r ? String(r._id) : null;
    };

    // 1. Add manually defined affectedRoutes
    (disruption.affectedRoutes || []).forEach((rid) => {
      const nid = normalize(rid);
      if (nid) routeIds.add(nid);
    });

    // 2. Add routes based on affectedStops
    (disruption.affectedStops || []).forEach((sid) => {
      const cid = canonicalStopId(stopLookup, sid);
      const usedBy = stopToRoutesMap[String(cid)];
      if (usedBy) {
        usedBy.forEach((rid) => {
          const nid = normalize(rid);
          if (nid) routeIds.add(nid);
        });
      }
    });

    // 3. Keep only routes that actually call at this stop
    const final = [...routeIds].filter((rid) =>
      routesAtStop.some((r) => String(r._id) === String(rid))
    );

    return final.length ? final : routesAtStop.map((r) => String(r._id));
  }, [routesAtStop, disruption, stopToRoutesMap, routes, stopLookup]);

  const getStopDiversions = (stopId, routesList) =>
    routesList
      .filter(
        (r) =>
          r.diversion?.active &&
          Array.isArray(r.diversion?.stops) &&
          r.diversion.stops
            .map((sid) => canonicalStopId(stopLookup, sid))
            .includes(String(stopId))
      )
      .map((r) => ({
        routeId: r._id,
        routeNumber: r.number || r.routeId,
        reason: r.diversion?.reason || '',
        tempStops: r.diversion?.tempStops || [],
      }));

  const diversions = useMemo(() => {
    if (!stop || !routes.length) return [];
    return getStopDiversions(stop.stopId, routes);
  }, [stop, routes, stopLookup]);

  if (loading) {
    return (
      <p className="text-white text-center mt-12">
        Loading stop details…
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

  if (!stop) {
    return (
      <p className="text-white text-center mt-12">
        Stop not found.
      </p>
    );
  }

  // ✅ Use normaliser here too so the header pill matches icons
  const isClosed = isClosedFlag(stop);

  return (
        <AuthWrapper requiredRole="devPhase">
    <main className="text-white px-4 md:px-6 py-8 md:py-12 flex flex-col items-center">
      <div className="w-full max-w-7xl bg-[#1f2729] border border-white/15 rounded-2xl shadow-xl backdrop-blur-xl overflow-hidden">
        {/* HEADER / SUMMARY BAR */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-5 py-4 border-b border-white/10 bg-black/20">
          <div>
            <div className="mb-2">
              <Link
                href="/ycc/stops"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
              >
                <ArrowLeft size={16} />
                Back to all stops
              </Link>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {stop.name}
            </h1>

            <p className="text-sm text-white/60">
              {stop.town || 'Town unknown'} •{' '}
              <span className="font-mono text-xs">
                Stop ID: {stop.stopId}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-[#283335] border border-white/20">
              {routesAtStop.length} route
              {routesAtStop.length === 1 ? '' : 's'} serving
            </span>
            <span className="px-3 py-1 rounded-full bg-[#283335] border border-white/20">
              {operatorsAtStop.length} operator
              {operatorsAtStop.length === 1 ? '' : 's'}
            </span>
            {isClosed && (
              <span className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/60 text-red-200 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Stop closed
              </span>
            )}
            {(disruption || diversions.length > 0) && (
              <span className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/60 text-red-200 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Live disruption
              </span>
            )}
          </div>
        </div>

        {/* BODY: left stop info / routes, right live impact panel */}
        <div className="p-5 grid lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-8">
          {/* LEFT: Stop summary + operators + routes */}
          <div className="space-y-6">
            {/* Stop info card */}
            <div className="bg-white/5 border border-white/15 rounded-xl p-4 text-sm space-y-2">
              <p>
                <strong>Branding:</strong>{' '}
                {stop.branding || 'N/A'}
              </p>
              <p>
                <strong>Postcode:</strong>{' '}
                {stop.postcode || 'N/A'}
              </p>
              <p>
                <strong>Location:</strong>{' '}
                {stop.location || 'N/A'}
              </p>
              {Array.isArray(stop.facilities) && stop.facilities.length > 0 && (
                <p>
                  <strong>Facilities:</strong>{' '}
                  {stop.facilities.join(', ')}
                </p>
              )}
              <p>
                <strong>Notes:</strong>{' '}
                {stop.notes || 'N/A'}
              </p>
            </div>

            {/* Operators block */}
            {operatorsAtStop.length > 0 && (
              <div className="bg-[#283335] border border-white/20 rounded-xl p-4 text-sm space-y-3">
                <p className="font-semibold text-white/70">
                  Operators serving this stop
                </p>
                <div className="flex flex-wrap gap-3">
                  {operatorsAtStop.map((op) => (
                    <div
                      key={op._id}
                      className="flex items-center gap-3 px-4 py-2 rounded-2xl border border-white/20 bg-[#1f2729] backdrop-blur shadow-sm hover:bg-white/10 transition cursor-default"
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
              </div>
            )}

            {/* Routes list with expandable panels */}
            <div className="bg-[#283335] border border-white/20 rounded-xl p-4 text-sm space-y-3">
              <p className="font-semibold text-white/70 flex items-center gap-2">
                <RouteIcon className="w-4 h-4" />
                Routes serving this stop
              </p>
              {routesAtStop.length === 0 ? (
                <p className="text-xs text-white/60">
                  No routes currently serve this stop.
                </p>
              ) : (
                <div className="space-y-2">
                  {routesAtStop.map((r) => {
                    const impactedByTravel = disruption
                      ? routeIsAffectedByTravel(r, disruption)
                      : false;
                    const impactedByRouteDiversion = !!r.diversion?.active;
                    const impacted = impactedByTravel || impactedByRouteDiversion;

                    const origin =
                      getStopByAnyId(stopLookup, r.origin);
                    const destination =
                      getStopByAnyId(stopLookup, r.destination);

                    const originLabel = origin
                      ? `${origin.name}${origin.town ? ', ' + origin.town : ''}`
                      : r.origin || 'Origin';
                    const destLabel = destination
                      ? `${destination.name}${destination.town ? ', ' + destination.town : ''}`
                      : r.destination || 'Destination';

                    const isOpen = openRouteId === r._id;

                    const forwardStopList = [
                      r.origin,
                      ...(r.stops?.forward || []),
                      r.destination,
                    ].filter(Boolean);

                    const backwardStopList = [
                      r.destination,
                      ...(r.stops?.backward || []),
                      r.origin,
                    ].filter(Boolean);

                    const activeStopList =
                      openDirection === 'forward'
                        ? forwardStopList
                        : backwardStopList;

                    const routeDisruptionForUI = buildRouteDisruptionForRoute(
                      r,
                      disruption,
                      stopLookup
                    );

                    return (
                      <div key={r._id} className="rounded-lg border border-white/15 bg-black/20">
                        <button
                          type="button"
                          onClick={() => {
                            if (isOpen) {
                              setOpenRouteId(null);
                            } else {
                              setOpenRouteId(r._id);
                              setOpenDirection('forward'); // default to outbound
                            }
                          }}
                          className={`w-full px-3 py-2 flex items-center justify-between text-left text-xs rounded-lg transition ${
                            isOpen
                              ? 'bg-white/5'
                              : 'bg-transparent hover:bg-white/5'
                          }`}
                        >
                          <div>
                            <p className="font-semibold flex items-center gap-1">
                              {r.number || r.routeId || 'Route'}
                              {impacted && (
                                <span className="ml-2 px-2 py-0.5 rounded-full bg-red-500/30 text-[10px] text-red-100 flex items-center gap-1 border border-red-500/60">
                                  <AlertTriangle className="w-3 h-3" />
                                  Affected
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-white/70">
                              {originLabel} → {destLabel}
                            </p>
                          </div>

                          <span className="text-[11px] text-white/60">
                            {isOpen ? 'Hide' : 'View'} route
                          </span>
                        </button>

                        {isOpen && (
                          <div className="mt-1 mb-2 ml-4 mr-2 rounded-lg border border-white/15 bg-black/30 p-3 text-xs">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[11px] text-white/70">
                                Detailed view for{' '}
                                <span className="font-semibold">
                                  {r.number || r.routeId || 'Route'}
                                </span>
                              </p>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => setOpenDirection('forward')}
                                  className={`px-2 py-1 rounded-full border text-[11px] ${
                                    openDirection === 'forward'
                                      ? 'bg-white text-black border-white'
                                      : 'bg-white/5 border-white/20 text-white/70'
                                  }`}
                                >
                                  Outbound
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setOpenDirection('backward')}
                                  className={`px-2 py-1 rounded-full border text-[11px] ${
                                    openDirection === 'backward'
                                      ? 'bg-white text-black border-white'
                                      : 'bg-white/5 border-white/20 text-white/70'
                                  }`}
                                >
                                  Inbound
                                </button>
                              </div>
                            </div>

                            {activeStopList.length === 0 ? (
                              <p className="text-[11px] text-white/60">
                                No stop sequence available for this direction.
                              </p>
                            ) : (
                              <div className="relative max-h-[260px] overflow-y-auto rounded-xl pr-2 bg-[#283335] border border-white/10 p-3">
                                <StopsListWithDiversion
                                  stopList={activeStopList}
                                  disruptionForRoute={routeDisruptionForUI}
                                  stops={stops}
                                  stopLookup={stopLookup}
                                  direction={openDirection}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Live route impact panel */}
          <div className="hidden lg:block sticky top-8 self-start">
            <AffectedRoutesPanel
              disruption={disruption}
              routes={routesAtStop}
              stops={stops}
              inferredRoutes={inferredRoutes}
              lastUpdate={liveUpdatedAt}
              selectedRouteId={openRouteId}
              selectedDirection={openDirection}
            />
          </div>
        </div>
      </div>

      {/* Mobile: panel below content */}
      <div className="w-full max-w-7xl mt-6 lg:hidden">
        <AffectedRoutesPanel
          disruption={disruption}
          routes={routesAtStop}
          stops={stops}
          inferredRoutes={inferredRoutes}
          lastUpdate={liveUpdatedAt}
          selectedRouteId={openRouteId}
          selectedDirection={openDirection}
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
