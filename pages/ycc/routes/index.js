'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import AuthWrapper from '@/components/AuthWrapper';

export default function RoutesView() {
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [operators, setOperators] = useState([]);
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [operatorFilter, setOperatorFilter] = useState('all');
  const [sortType, setSortType] = useState('number-asc');
  const [showOps, setShowOps] = useState(false);
  const [showSort, setShowSort] = useState(false);

  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest(".dropdown")) {
        setShowOps(false);
        setShowSort(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  // ✅ Filter + Sort
  useEffect(() => {
    let filtered = [...routes];

    const term = searchTerm.toLowerCase();

    // 🔍 search
    if (term.trim() !== '') {
      filtered = filtered.filter((route) => {
        const originName = getStopName(route.origin)?.toLowerCase() || '';
        const destName = getStopName(route.destination)?.toLowerCase() || '';
        const routeNumber = route.number?.toLowerCase() || '';

        const opNames = (Array.isArray(route.operator) ? route.operator : [route.operator])
          .map(id => {
            const op = operators.find(o =>
              o._id === id ||
              o.slug === id ||
              o.operatorName?.toLowerCase() === id?.toLowerCase()
            );
            return op?.operatorName?.toLowerCase();
          })
          .filter(Boolean)
          .join(' ');

        const stopNames = [
          ...(route.stops?.forward || []),
          ...(route.stops?.backward || []),
          route.origin,
          route.destination,
        ]
          .map((id) => getStopName(id)?.toLowerCase() || '')
          .join(' ');

        return (
          routeNumber.includes(term) ||
          originName.includes(term) ||
          destName.includes(term) ||
          stopNames.includes(term) ||
          opNames.includes(term)
        );
      });
    }

    // 🎯 operator filter
    if (operatorFilter !== 'all') {
      filtered = filtered.filter(route => {
        const ids = Array.isArray(route.operator)
          ? route.operator
          : [route.operator];

        return ids.some(id => {
          const op = operators.find(o =>
            o._id === id ||
            o.slug === id ||
            o.operatorName?.toLowerCase() === id?.toLowerCase()
          );
          return op?.operatorName === operatorFilter;
        });
      });
    }

    // 🔢 sorting
    filtered.sort((a, b) => {
      const numA = parseInt(a.number) || 0;
      const numB = parseInt(b.number) || 0;

      const stopsA =
        (a.stops?.forward?.length || 0) +
        (a.stops?.backward?.length || 0);

      const stopsB =
        (b.stops?.forward?.length || 0) +
        (b.stops?.backward?.length || 0);

      switch (sortType) {
        case 'number-asc':
          return numA - numB;
        case 'number-desc':
          return numB - numA;
        case 'stops-asc':
          return stopsA - stopsB;
        case 'stops-desc':
          return stopsB - stopsA;
        default:
          return 0;
      }
    });

    setFilteredRoutes(filtered);
  }, [searchTerm, operatorFilter, sortType, routes, operators]);

  // ✅ Load data
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const [resRoutes, resStops, resOperators] = await Promise.all([
          fetch('/api/ycc/routes'),
          fetch('/api/ycc/stops'),
          fetch('/api/ycc/operators/active'),
        ]);

        if (!resRoutes.ok || !resStops.ok || !resOperators.ok)
          throw new Error('Failed to fetch data');

        const routesData = await resRoutes.json();
        const stopsData = await resStops.json();
        const operatorsData = await resOperators.json();

        setStops(stopsData.stops || []);
        setRoutes(routesData.routes || []);
        setOperators(operatorsData.submissions || []);
        setFilteredRoutes(routesData.routes || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  const getStopName = (stopId) => {
    const stop = stops.find((s) => s.stopId === stopId);
    return stop ? stop.name : stopId;
  };

  const getClosedStops = (route) => {
    const allStops = [
      ...(route.stops?.forward || []),
      ...(route.stops?.backward || []),
      route.origin,
      route.destination,
    ].filter(Boolean);

    const closed = stops.filter((s) => s.closed && allStops.includes(s.stopId));

    return Array.from(
      new Map(closed.map((s) => [s.stopId, s])).values()
    );
  };

  return (
        <AuthWrapper requiredRole="devPhase">
    <main className="p-6 text-white">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold">Operator Routes</h1>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative dropdown">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowOps(!showOps);
                setShowSort(false);
              }}
              className="bg-[#283335] border border-white/20 text-white px-3 py-2 rounded-lg flex items-center gap-2"
            >
              {operatorFilter === "all" ? (
                <div
                  className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `#002B6D20`,
                    border: `1px solid #002B6D`,
                  }}
                >
                  <img src="/logo.png" className="w-5 h-5 rounded-full object-cover" />
                  All Operators
                </div>
              ) : (
                (() => {
                  const op = operators.find(o => o.operatorName === operatorFilter);
                  return (
                    <div
                      className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: `${op.operatorColour}20`,
                        border: `1px solid ${op.operatorColour}`,
                      }}
                    >
                      <img src={op.logo} className="w-5 h-5 rounded-full object-cover" />
                      {op.operatorName}
                    </div>
                  );
                })()
              )}
            </button>

            <AnimatePresence>
              {showOps && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="absolute z-50 mt-2 bg-[#283335] border border-white/20 rounded-lg p-2 w-56 max-h-64 overflow-y-auto"
                >
                  <div
                    className="cursor-pointer mb-1"
                    onClick={() => {
                      setOperatorFilter("all");
                      setShowOps(false);
                    }}
                  >
                    <div
                      className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm font-medium w-full"
                      style={{
                        backgroundColor: `#002B6D20`,
                        border: `1px solid #002B6D`,
                      }}
                    >
                      <img src="/logo.png" className="w-5 h-5 rounded-full object-cover" />
                      All Operators
                    </div>
                  </div>

                  {operators.map(op => (
                    <div
                      key={op._id}
                      className="cursor-pointer mb-1"
                      onClick={() => {
                        setOperatorFilter(op.operatorName);
                        setShowOps(false);
                      }}
                    >
                      <div
                        className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm font-medium w-full"
                        style={{
                          backgroundColor: `${op.operatorColour}20`,
                          border: `1px solid ${op.operatorColour}`,
                        }}
                      >
                        <img src={op.logo} className="w-5 h-5 rounded-full object-cover" />
                        {op.operatorName}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative dropdown">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSort(!showSort);
                setShowOps(false);
              }}
              className="bg-[#283335] border border-white/20 text-white px-3 py-2 rounded-lg flex items-center gap-2"
            >
              {(() => {
                const styles = {
                  "number-asc": { label: "Route Number ↑", color: "#16A34A" },
                  "number-desc": { label: "Route Number ↓", color: "#DC2626" },
                  "stops-asc": { label: "Stops: Small → Big", color: "#2563EB" },
                  "stops-desc": { label: "Stops: Big → Small", color: "#D97706" },
                };
                const s = styles[sortType];

                return (
                  <div
                    className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: `${s.color}20`,
                      border: `1px solid ${s.color}`,
                    }}
                  >
                    {s.label}
                  </div>
                );
              })()}
            </button>

            <AnimatePresence>
              {showSort && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="absolute z-50 mt-2 bg-[#283335] border border-white/20 rounded-lg p-2 w-64"
                >
                  {[
                    { value: "number-asc", label: "Route Number ↑", color: "#16A34A" },
                    { value: "number-desc", label: "Route Number ↓", color: "#DC2626" },
                    { value: "stops-asc", label: "Stops: Small → Big", color: "#2563EB" },
                    { value: "stops-desc", label: "Stops: Big → Small", color: "#D97706" }
                  ].map(opt => (
                    <div
                      key={opt.value}
                      className="cursor-pointer mb-1"
                      onClick={() => {
                        setSortType(opt.value);
                        setShowSort(false);
                      }}
                    >
                      <div
                        className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm font-medium w-full"
                        style={{
                          backgroundColor: `${opt.color}20`,
                          border: `1px solid ${opt.color}`,
                        }}
                      >
                        {opt.label}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <input
            type="text"
            placeholder="Search routes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#283335] border border-white/20 backdrop-blur-md text-white placeholder-white/50 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-80"
          />
        </div>

      </div>

      {loading && <p className="text-white/60">Loading routes...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && filteredRoutes.length === 0 && (
        <p className="text-white/60">No routes found for this operator.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRoutes.map((route, index) => {
          const closedStops = getClosedStops(route);
          const hasDiversion = route.diversion?.active;
          const stopCount =
            (route.stops?.forward?.length || 0) +
            (route.stops?.backward?.length || 0);

          const names = (Array.isArray(route.operator) ? route.operator : [route.operator])
            .map(id => {
              const op = operators.find(o =>
                o._id === id ||
                o.slug === id ||
                o.operatorName?.toLowerCase() === id?.toLowerCase()
              );
              return op;
            })
            .filter(Boolean);

          const op = names[0];

          return (
            <a
              key={route._id}
              href={`/ycc/routes/${route._id}`}
              className={`relative group block overflow-visible backdrop-blur border border-white/20 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200 bg-[#283335]`}
            >
              <h2 className="text-xl font-semibold mb-1">
                {route.number || `Route ${index + 1}`}
              </h2>

              {/* ✅ Operator Chip */}

              <p className="text-white/70">
                {getStopName(route.origin)} → {getStopName(route.destination)}
              </p>

              {op && (
                <a
                  className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm font-medium mt-1"
                  style={{
                    backgroundColor: `${op.operatorColour}20`,
                    border: `1px solid ${op.operatorColour}`,
                  }}
                  href={`/ycc/operators/${op.slug}`}
                >
                  <img
                    src={op.logo}
                    alt={op.operatorName}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  {op.operatorName}
                </a>
              )}
              <p className="text-white/50 text-sm mt-1">Stops: {stopCount}</p>

              {closedStops.length > 0 && (
                <div className="mt-2 text-xs text-red-300 flex gap-1 items-center">
                  <AlertTriangle size={14} /> {closedStops.length} stop(s) closed
                </div>
              )}

              {hasDiversion && (
                <div className="mt-2 text-xs text-yellow-300">
                  ⚠️ Diversion in place
                </div>
              )}
            </a>
          );
        })}
      </div>
    </main>
        </AuthWrapper>
  );
}
