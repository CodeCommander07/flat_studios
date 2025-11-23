'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import {
  AlertTriangle,
  MapPin,
  MapPinOff,
  MapPinX,
  Route as RouteIcon,
} from 'lucide-react';

function StopsListWithDiversion({
  stopList,
  disruption,
  stops,
  highlightStopId,
  operatorBrandColorForStop
}) {
  const affectedStops = new Set(disruption?.affectedStops || []);

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

  const rows = [];

  for (let idx = 0; idx < stopList.length; idx++) {
    const stopId = stopList[idx];
    const s = findStop(stopId);
    const label = getStopLabel(stopId);
    const tempStopId = tempMap[stopId];
    const tempLabel = tempStopId ? getStopLabel(tempStopId) : null;

    const isClosed = s?.closed;
    const isExplicitAffected = affectedStops.has(stopId);
    const isHighlighted = highlightStopId && String(stopId) === String(highlightStopId);

    const icon = isClosed ? (
      <MapPinOff className="w-5 h-5 text-red-400" />
    ) : isExplicitAffected ? (
      <MapPinX className="w-5 h-5 text-yellow-300" />
    ) : (
      <MapPin className="w-5 h-5 text-green-300" />
    );

    rows.push(
      <tr
        key={`stop-${idx}`}
        className={`h-[38px]`}
      >
        <td className="relative w-[40px] p-0">
          {idx > 0 && (
            <div className="absolute top-0 bottom-[18px] w-[2px] bg-green-400 left-[10px]" />
          )}

          <div
            className="absolute top-1/2 -translate-y-1/2 w-[22px] h-[22px] rounded-full flex items-center justify-center"
            style={{
              background: operatorBrandColorForStop(s?.stopId) || '#283335'
            }}
          >

            {icon}
          </div>

          {idx < stopList.length - 1 && (
            <div className="absolute top-[26px] bottom-0 w-[2px] bg-green-400 left-[10px]" />
          )}
        </td>

        <td className={`pl-2 stop-text  ${isHighlighted ? 'bg-blue-400/10 rounded-xl' : ''}`}>
          {s ? (
            <Link
              href={`/ycc/stops/${s._id}`}
              className={`text-sm underline-offset-2 ${isClosed
                ? 'text-gray-500 line-through opacity-60 hover:opacity-80 hover:line-through'
                : isExplicitAffected
                  ? 'text-yellow-200 hover:underline'
                  : 'text-white hover:underline'
                }`}
            >
              {label}
            </Link>
          ) : (
            <span className="text-sm text-white/80">{label}</span>
          )}

          {tempLabel && (() => {
            const tempStop = findStop(tempStopId);
            return (
              <p className="text-yellow-300 text-xs mt-1">
                Temporary stop:{' '}
                {tempStop ? (
                  <Link
                    href={`/ycc/stops/${tempStop._id}`}
                    className="hover:text-yellow-200 hover:underline underline-offset-2"
                  >
                    {tempLabel}
                  </Link>
                ) : (
                  tempLabel
                )}
              </p>
            );
          })()}
        </td>
      </tr>
    );
  }

  return (
    <table className="w-full">
      <tbody>{rows}</tbody>
    </table>
  );
}

const formatTimeAgo = (date) => {
  if (!date) return 'Unknown';

  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};


export default function StopDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [stop, setStop] = useState(null);
  const [mergeGroup, setMergeGroup] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [allStops, setAllStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mergeMeta, setMergeMeta] = useState(null);
  const [allOperators, setAllOperators] = useState([]);
  const [operatorSort, setOperatorSort] = useState('az');
  const [activeOperator, setActiveOperator] = useState(null);
  const [selectedStopId, setSelectedStopId] = useState(null); // physical stopId
  const [activeRouteId, setActiveRouteId] = useState(null);   // route _id
  const [activeDirection, setActiveDirection] = useState('forward'); // outbound / inbound
  const [activeTab, setActiveTab] = useState('routes');

  // 🧩 Fetch stop + merge group
  const fetchStop = async () => {
    if (!id) return;
    try {
      const res = await axios.get(`/api/ycc/stops/${id}`);
      const stopData = res.data.stop;
      const group = res.data.mergeGroup || [];
      const meta = res.data.mergeMeta || null;

      setStop(stopData);
      setMergeGroup(group);
      setMergeMeta(meta);
      setSelectedStopId(stopData.stopId);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch stop.');
    } finally {
      setLoading(false);
    }
  };

  // 🚌 Fetch routes
  const fetchRoutes = async () => {
    try {
      const res = await axios.get('/api/ycc/routes');
      setRoutes(res.data.routes || []);
    } catch (err) {
      console.error('Failed to fetch routes', err);
    }
  };

  // 🚏 Fetch ALL stops (for labels in diagram)
  const fetchAllStops = async () => {
    try {
      const res = await axios.get('/api/ycc/stops');
      setAllStops(res.data.stops || []);
    } catch (err) {
      console.error('Failed to fetch stops list', err);
    }
  };

  const fetchOperators = async () => {
    try {
      const res = await axios.get('/api/ycc/operators/active');
      setAllOperators(res.data.submissions || []);
    } catch { }
  };

  useEffect(() => {
    fetchRoutes();
    fetchAllStops();
    fetchOperators();
  }, []);

  useEffect(() => {
    fetchStop();
  }, [id]);

  // 🔗 Cluster members (main + merged)
  const clusterMembers = useMemo(
    () => (stop ? [stop, ...mergeGroup] : []),
    [stop, mergeGroup]
  );

  // Ensure we always have a selected stop once data arrives
  useEffect(() => {
    if (clusterMembers.length && !selectedStopId) {
      setSelectedStopId(clusterMembers[0].stopId);
    }
  }, [clusterMembers, selectedStopId]);

  const clusterStopIds = useMemo(
    () => clusterMembers.map((s) => s.stopId),
    [clusterMembers]
  );

  const operatorBrandColorForStop = (stopId) => {
    const route = routes.find((r) =>
      [
        r.origin,
        ...(r.stops?.forward || []),
        r.destination,
        r.destination,
        ...(r.stops?.backward || []),
        r.origin,
      ].includes(stopId)
    );

    if (!route) return null;

    const op = allOperators?.find((o) =>
      (Array.isArray(route.operator) ? route.operator : [route.operator])
        .includes(o._id)
    );

    return op?.brandingColor || null;
  };

  const exportOperatorRoutes = (op) => {
    const csv = [
      'Route,Direction,Stops',
      ...op.routes.map((r) =>
        `${r.number},Outbound,"${r.stops.forward.join(' > ')}"`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${op.id}-timetable.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };



  // All routes serving ANY stop in the group
  const servingRoutes = useMemo(() => {
    if (!clusterStopIds.length || !routes.length) return [];
    return routes.filter((r) => {
      const allStopsInRoute = [
        ...(r.stops?.forward || []),
        ...(r.stops?.backward || []),
        r.origin,
        r.destination,
      ].filter(Boolean);
      return allStopsInRoute.some((sid) => clusterStopIds.includes(sid));
    });
  }, [routes, clusterStopIds]);

  const operatorMap = {};

  servingRoutes.forEach((route) => {
    const opIds = Array.isArray(route.operator)
      ? route.operator
      : [route.operator];

    opIds.forEach((id) => {
      if (!operatorMap[id]) operatorMap[id] = { id, routes: [] };
      operatorMap[id].routes.push(route);
    });
  });

  let sortedOperators = Object.values(operatorMap);

  sortedOperators.sort((a, b) => {
    switch (operatorSort) {
      case 'az':
        return (allOperators?.find(o => o._id === a.id)?.operatorName || '')
          .localeCompare(allOperators?.find(o => o._id === b.id)?.operatorName || '');
      case 'za':
        return (allOperators?.find(o => o._id === b.id)?.operatorName || '')
          .localeCompare(allOperators?.find(o => o._id === a.id)?.operatorName || '');
      case 'routesAsc':
        return a.routes.length - b.routes.length;
      case 'routesDesc':
        return b.routes.length - a.routes.length;
      default:
        return 0;
    }
  });

  // All routes that serve the *selected physical stop*
  const routesAtSelectedStop = useMemo(() => {
    if (!selectedStopId || !servingRoutes.length) return [];

    let r = servingRoutes.filter((route) => {
      const seq = [
        route.origin,
        ...(route.stops?.forward || []),
        route.destination,
        route.destination,
        ...(route.stops?.backward || []),
        route.origin,
      ].filter(Boolean);

      return seq.some((sid) => String(sid) === String(selectedStopId));
    });

    if (activeOperator) {
      r = r.filter((route) =>
        (Array.isArray(route.operator) ? route.operator : [route.operator])
          .includes(activeOperator)
      );
    }

    return r;
  }, [selectedStopId, servingRoutes, activeOperator]);


  // Default active route – prefer one that actually stops at the selected physical stop
  useEffect(() => {
    if (routesAtSelectedStop.length) {
      if (!activeRouteId || !routesAtSelectedStop.some((r) => r._id === activeRouteId)) {
        setActiveRouteId(routesAtSelectedStop[0]._id);
      }
    } else if (servingRoutes.length && !activeRouteId) {
      setActiveRouteId(servingRoutes[0]._id);
    }
  }, [routesAtSelectedStop, servingRoutes, activeRouteId]);

  const displayName = mergeMeta?.name || stop?.name;
  const displayId = mergeMeta?.mergeId || stop?.stopId;

  // Synthesised disruption data for closures/temp stops
  const clusterDisruption = useMemo(() => {
    const affectedStops = clusterMembers
      .filter((s) => s.closed)
      .map((s) => s.stopId);

    const tempStops = clusterMembers
      .filter((s) => s.tempStopId)
      .map((s) => ({
        closed: s.stopId,
        temp: s.tempStopId,
      }));

    return { affectedStops, tempStops };
  }, [clusterMembers]);

  // Selected physical stop object
  const selectedStop = useMemo(() => {
    if (!selectedStopId) return null;
    return clusterMembers.find((s) => s.stopId === selectedStopId) || null;
  }, [selectedStopId, clusterMembers]);

  const activeRoute =
    servingRoutes.find((r) => r._id === activeRouteId) || null;

  const forwardStopList = activeRoute
    ? [
      activeRoute.origin,
      ...(activeRoute.stops?.forward || []),
      activeRoute.destination,
    ].filter(Boolean)
    : [];

  const backwardStopList = activeRoute
    ? [
      activeRoute.destination,
      ...(activeRoute.stops?.backward || []),
      activeRoute.origin,
    ].filter(Boolean)
    : [];

  const activeStopList =
    activeDirection === 'forward' ? forwardStopList : backwardStopList;

  // For diagram labels
  const stopLookupForDiagram = allStops.length ? allStops : clusterMembers;

  const clusterClosed = clusterDisruption.affectedStops?.length > 0;

  // Position label: "Stop X of Y • Outbound/Inbound"
  const selectedIndexInActive = selectedStopId
    ? activeStopList.findIndex((sid) => String(sid) === String(selectedStopId))
    : -1;

  const positionLabel =
    selectedIndexInActive >= 0 && activeStopList.length > 0
      ? `Stop ${selectedIndexInActive + 1} of ${activeStopList.length}`
      : null;

  const directionLabel =
    activeDirection === 'forward' ? 'Outbound' : 'Inbound';

  const groupLatestUpdate = useMemo(() => {
    if (!clusterMembers.length) return null;

    const timestamps = clusterMembers
      .map((s) => new Date(s.updatedAt || s.createdAt || 0))
      .filter((d) => !isNaN(d));

    if (!timestamps.length) return null;

    return new Date(Math.max(...timestamps));
  }, [clusterMembers]);


  if (loading) {
    return <p className="text-white text-center mt-12">Loading stop details...</p>;
  }

  if (error) {
    return <p className="text-red-500 text-center mt-12">{error}</p>;
  }

  if (!stop) {
    return <p className="text-white text-center mt-12">Stop not found.</p>;
  }


  const tabs = [
    { id: 'routes', label: 'Routes', type: "Both" },
    { id: 'closures', label: 'Closures', type: "Both" },
    { id: 'stops', label: 'Physical Stops', type: "Group" },
  ];

  // Helper: when clicking a stop anywhere, always jump to routes tab
  const handleSelectStop = (stopId) => {
    setSelectedStopId(stopId);
    setActiveTab('routes');
  };

  // Helper: direction badges per route at selected stop
  const getRouteDirectionBadges = (route) => {
    const appearsForward = [
      route.origin,
      ...(route.stops?.forward || []),
      route.destination,
    ]
      .filter(Boolean)
      .some((sid) => String(sid) === String(selectedStopId));

    const appearsBackward = [
      route.destination,
      ...(route.stops?.backward || []),
      route.origin,
    ]
      .filter(Boolean)
      .some((sid) => String(sid) === String(selectedStopId));

    const badges = [];
    if (appearsForward) badges.push('Outbound');
    if (appearsBackward) badges.push('Inbound');
    if (!badges.length) badges.push('Via other direction');

    return badges;
  };

  return (
    <main className="text-white px-4 md:px-6 py-8 md:py-12 flex flex-col items-center">
      <div className="w-full max-w-7xl bg-[#1f2729] border border-white/15 rounded-2xl shadow-xl backdrop-blur-xl overflow-hidden">
        {/* Header / summary bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-5 py-4 border-b border-white/10 bg-black/20">
          <div>
            <div className="mb-2">
              <Link
                href="/ycc/stops"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to all stops
              </Link>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {displayName}
            </h1>
            <p className="text-sm text-white/60">
              {stop.town || 'Town unknown'} •{' '}
              <span className="font-mono text-xs">
                Stop ID: {displayId}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {clusterMembers.length > 1 && <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 font-mono">
              {clusterMembers.length} stop{clusterMembers.length !== 1 ? 's' : ''} in group
            </span>}
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20">
              {servingRoutes.length} route{servingRoutes.length !== 1 ? 's' : ''} serving
            </span>
            {clusterClosed && (
              <span className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/60 text-red-200 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Some stops closed
              </span>
            )}{groupLatestUpdate && (
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 font-mono">
                Updated: <span className="text-white/70">{formatTimeAgo(groupLatestUpdate)}</span></span>
            )}

          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-2 pb-2 border-b border-white/10 bg-black/30">
          <div className="flex flex-wrap gap-2">
            {tabs
              .filter((tab) => {
                if (!tab.type) return true;
                if (tab.type === 'Group') return clusterMembers.length > 1;
                return true;
              })
              .map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${isActive
                      ? 'bg-white text-black border-white'
                      : 'bg-white/5 text-white/70 border-white/20 hover:bg-white/10'
                      }`}
                  >
                    {tab.label}
                  </button>
                );
              })}

          </div>
        </div>

        {/* Tab content */}
        <div className="p-5">
          {/* ROUTES TAB */}
          {activeTab === 'routes' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column 1: Summary + physical stops */}
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/15 rounded-xl p-4 text-sm space-y-1">
                  <p>
                    <strong>Branding:</strong> {stop.branding || 'N/A'}
                  </p>
                  <p>
                    <strong>Postcode:</strong> {stop.postcode || 'N/A'}
                  </p>
                  <p>
                    <strong>Location:</strong> {stop.location || 'N/A'}
                  </p>
                  {clusterMembers.some((s) => s.facilities?.length) && (
                    <p className="mt-2">
                      <strong>Facilities (cluster):</strong>{' '}
                      <span className="text-xs text-white/70">
                        {Array.from(
                          new Set(
                            clusterMembers.flatMap((s) => s.facilities || [])
                          )
                        ).join(', ') || 'N/A'}
                      </span>
                    </p>
                  )}
                  <p>
                    <strong>Notes:</strong> {stop.notes || 'N/A'}
                  </p>
                </div>

                <div>
                  <p className="font-semibold mb-2 text-sm">
                    Operators who serve this stop
                  </p>

                  {/* SORT + FILTER */}
                  <div className="flex gap-2 mb-3 text-xs">
                    <select
                      value={operatorSort}
                      onChange={(e) => setOperatorSort(e.target.value)}
                      className="bg-white/10 border border-white/20 px-2 py-1 rounded"
                    >
                      <option className="text-white bg-[#283335]" value="az">Name (A–Z)</option>
                      <option className="text-white bg-[#283335]" value="za">Name (Z–A)</option>
                      <option className="text-white bg-[#283335]" value="routesDesc">Most Routes</option>
                      <option className="text-white bg-[#283335]" value="routesAsc">Fewest Routes</option>
                    </select>

                    {activeOperator && (
                      <button
                        onClick={() => {
                          setActiveOperator(null);
                          setActiveRouteId(null);
                        }}
                        className="px-2 py-1 bg-red-600 hover:bg-red-500 rounded"
                      >
                        Clear Filter
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {sortedOperators.map((op) => {
                      const isSelected = activeOperator === op.id;
                      const submission = allOperators?.find((o) => o._id === op.id);

                      return (
                        <button
                          key={op.id}
                          type="button"
                          onClick={() => {
                            setActiveOperator(op.id);
                            // filter activeRouteId to only that operator
                            const r = op.routes[0];
                            if (r) setActiveRouteId(r._id);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-xs sm:text-sm transition
                            ${isSelected
                              ? 'bg-blue-500/20 border-blue-400'
                              : 'bg-white/5 border-white/15 hover:bg-white/10'
                            }`}
                        >
                          {/* LOGO */}
                          <div
                            className="w-10 h-10 rounded bg-black/30 border border-white/10 overflow-hidden flex items-center justify-center"
                            style={{
                              background: submission?.operatorColour || '#00000030'
                            }}
                          >
                            {submission?.logo ? (
                              <img
                                src={submission.logo}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <span className="text-white/40 text-[10px]">Logo</span>
                            )}
                          </div>

                          {/* TEXT */}
                          <div className="flex-1 text-left">
                            <p className="font-semibold"
                              style={{
                                color: submission?.operatorColour || '#00000030'
                              }}>
                              {submission?.operatorName || 'Unknown Operator'}
                            </p>
                            <p className="text-[10px] text-white/60">
                              Updated {formatTimeAgo(submission?.updatedAt)}
                            </p>
                            <p className="text-[10px] text-white/70 mt-1">
                              Routes: {op.routes.map((r) => r.number).join(', ')}
                            </p>
                            <Link
                              href={`/ycc/operators/${op.slug}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-300 hover:text-blue-200 underline text-[10px]"
                            >
                              View Operator
                            </Link>

                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      exportOperatorRoutes(op);
                    }}
                    className="text-[10px] text-green-300 hover:text-green-200 underline"
                  >
                    Download Timetable
                  </button>
                </div>
              </div>

              {/* Column 2: routes serving selected stop */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold mb-2">
                  Routes at this stop
                </h2>

                {!selectedStop ? (
                  <p className="text-sm text-white/60">
                    Select a stop on the left to see which routes serve it.
                  </p>
                ) : routesAtSelectedStop.length === 0 ? (
                  <p className="text-sm text-white/60">
                    No routes currently stop at this stop.
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-white/60 mb-1">
                      These routes serve{' '}
                      <span className="font-semibold">
                        {selectedStop.name}
                        {selectedStop.town ? `, ${selectedStop.town}` : ''}
                      </span>
                      .
                    </p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {routesAtSelectedStop.map((route) => {
                        const isActive = activeRouteId === route._id;
                        const badges = getRouteDirectionBadges(route);

                        return (
                          <button
                            key={route._id}
                            type="button"
                            onClick={() => setActiveRouteId(route._id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-2 transition-all
                              ${isActive
                                ? 'bg-white text-black border-white/80'
                                : 'bg-white/5 text-white/70 border-white/20 hover:bg-white/10'
                              }`}
                          >
                            <span>{route.number || route.routeId}</span>
                            <span className="flex gap-1">
                              {badges.map((b) => (
                                <span
                                  key={b}
                                  className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 border border-white/20"
                                >
                                  {b}
                                </span>
                              ))}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {selectedStop && (
                      <div className="bg-black/20 border border-white/10 rounded-lg p-3 text-xs space-y-1">
                        <p className="font-semibold">
                          Selected physical stop:
                        </p>
                        <p>
                          {selectedStop.name}
                          {selectedStop.town ? `, ${selectedStop.town}` : ''}
                        </p>
                        <p className="font-mono text-white/70 text-[11px]">
                          {selectedStop.stopId}
                        </p>
                        {positionLabel && activeRoute && (
                          <p className="mt-1 text-[11px] text-white/70">
                            {positionLabel} •{' '}
                            <span className="font-semibold">{directionLabel}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Column 3: route diagram */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <RouteIcon className="w-5 h-5" /> Route view
                </h2>

                {!activeRoute || routesAtSelectedStop.length === 0 ? (
                  <p className="text-sm text-white/60">
                    Select a route to see its stop sequence and any closures / temp stops.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2 text-xs">
                      <p className="text-white/60">
                        Showing{' '}
                        <span className="font-semibold">
                          {activeRoute.number || activeRoute.routeId}
                        </span>
                      </p>
                      <div className="flex gap-1 ml-auto">
                        <button
                          type="button"
                          onClick={() => setActiveDirection('forward')}
                          className={`px-2 py-1 rounded-full border text-[11px] ${activeDirection === 'forward'
                            ? 'bg-white text-black border-white'
                            : 'bg-white/5 border-white/20 text-white/70'
                            }`}
                        >
                          Outbound
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveDirection('backward')}
                          className={`px-2 py-1 rounded-full border text-[11px] ${activeDirection === 'backward'
                            ? 'bg-white text-black border-white'
                            : 'bg-white/5 border-white/20 text-white/70'
                            }`}
                        >
                          Inbound
                        </button>
                      </div>
                    </div>

                    {positionLabel && selectedStop && (
                      <p className="text-[11px] text-white/60 mb-2">
                        For{' '}
                        <span className="font-semibold">
                          {selectedStop.name}
                          {selectedStop.town ? `, ${selectedStop.town}` : ''}
                        </span>
                        : {positionLabel} •{' '}
                        <span className="font-semibold">{directionLabel}</span>
                      </p>
                    )}

                    <div className="relative max-h-[420px] overflow-y-auto rounded-xl pr-2 bg-[#283335] border border-white/10 p-3">
                      <StopsListWithDiversion
                        stopList={activeStopList}
                        disruption={clusterDisruption}
                        stops={stopLookupForDiagram}
                        highlightStopId={selectedStopId}
                        operatorBrandColorForStop={operatorBrandColorForStop}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* CLOSURES TAB */}
          {activeTab === 'closures' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-300" />
                Closures and temporary stops
              </h2>

              {clusterDisruption.affectedStops?.length === 0 ? (
                <p className="text-sm text-white/60">
                  There are currently no recorded closures for stops in this group.
                </p>
              ) : (
                <div className="space-y-3">
                  {clusterMembers
                    .filter((s) => s.closed || s.tempStopId)
                    .map((s) => {
                      const temp = s.tempStopId
                        ? stopLookupForDiagram.find((x) => x.stopId === s.tempStopId)
                        : null;

                      return (
                        <div
                          key={s.stopId}
                          className="bg-red-500/15 border border-red-500/50 rounded-xl p-3 text-sm"
                        >
                          <button
                            type="button"
                            onClick={() => handleSelectStop(s.stopId)}
                            className="text-left w-full"
                          >
                            <p className="font-semibold text-red-200">
                              {s.name}
                              {s.town ? `, ${s.town}` : ''}{' '}
                              <span className="font-mono text-[11px] text-red-200/70">
                                ({s.stopId})
                              </span>
                            </p>
                            <p className="text-xs text-red-100 mt-1">
                              {s.closureReason || 'This stop is currently closed.'}
                            </p>
                            {temp && (
                              <p className="text-xs text-yellow-200 mt-2">
                                Temporary stop:{' '}
                                {temp.name}
                                {temp.town ? `, ${temp.town}` : ''}{' '}
                                <span className="font-mono text-[11px] text-yellow-200/80">
                                  ({temp.stopId})
                                </span>
                              </p>
                            )}
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
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
