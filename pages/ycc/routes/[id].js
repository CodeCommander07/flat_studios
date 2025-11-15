'use client';

import { Fragment, useEffect, useState, useMemo } from 'react';
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
    axios.get('/api/ycc/stops')
      .then((res) => setStops(res.data.stops || []));
  }, []);

  useEffect(() => {
    axios.get('/api/ycc/operators/active')
      .then((res) => setOperators(res.data.submissions || []));
  }, []);

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/ycc/routes/${id}`)
      .then((res) => setRoute(res.data.route))
      .catch(() => setError('Failed to fetch route.'))
      .finally(() => setLoading(false));
  }, [id]);


  // ⬇ helper functions
  const getStop = (stopId) => stops.find((s) => s.stopId === stopId);

  const getStopName = (stopId) => {
    const stop = getStop(stopId);
    return stop ? `${stop.name}${stop.town ? ', ' + stop.town : ''}` : stopId;
  };

  const getOperator = () => {
    if (!route?.operator || operators.length === 0) return null;

    const routeOps = Array.isArray(route.operator) ? route.operator : [route.operator];

    return (
      operators.find((op) =>
        routeOps.some((rOp) =>
          rOp === op._id.toString() ||
          op.operatorName?.toLowerCase() === rOp?.toLowerCase() ||
          op.slug?.toLowerCase() === rOp?.toLowerCase()
        )
      ) || null
    );
  };

  if (loading) return <p className="text-white text-center mt-12">Loading...</p>;
  if (error) return <p className="text-red-500 text-center mt-12">{error}</p>;
  if (!route) return <p className="text-white text-center mt-12">Route not found.</p>;

  const operator = getOperator();
  const forwardList = [route.origin, ...(route.stops?.forward || []), route.destination];
  const backwardList = [route.destination, ...(route.stops?.backward || []), route.origin];

  const originStop = getStop(route.origin);
  const destStop = getStop(route.destination);

  const isOriginClosed = originStop?.closed;
  const isDestClosed = destStop?.closed;
  const originAffected = route.diversion?.stops?.includes(route.origin);
  const destAffected = route.diversion?.stops?.includes(route.destination);

  function DiversionBlock({ closedLabel, tempLabel, isFirst, isLast, direction }) {
    const baseColor = direction === 'forward' ? 'green' : 'red';

    // forward = green-400/40
    // backward = red-400/40
    const faintBase = baseColor === 'green'
      ? 'bg-green-400/40'
      : 'bg-red-400/40';

    return (
      <>
        {/* TOP CONNECTOR – only if not the first stop */}
        {!isFirst && (
          <tr className="p-0 m-0" style={{ height: "0px", lineHeight: 0 }}>
            <td className="relative w-[40px] p-0 m-0">
              {/* Yellow turn-out */}
              <div className="absolute left-[10px] top-[0px] w-[22px] h-[3px] bg-yellow-300"></div>

              {/* Base faint vertical line */}
              <div className={`absolute left-[10px] top-0 bottom-0 w-[2px] ${faintBase}`}></div>
            </td>
          </tr>
        )}

        {/* MAIN CLOSED BLOCK */}
        <tr className="p-0 m-0" style={{ height: "36px", lineHeight: 0 }}>
          <td className="relative w-[40px] p-0 m-0">
            {/* Blocked main line = ALWAYS red */}
            <div className="absolute left-[10px] top-0 bottom-0 w-[2px] bg-red-400"></div>

            {/* Temp stop vertical connector */}
            <div className="absolute left-[30px] top-0 bottom-0 w-[2px] bg-yellow-300"></div>

            {/* Icons */}
            <MapPinOff
              className="bg-[#283335] absolute left-[1px] top-1/2 -translate-y-1/2 w-5 h-5 text-red-400"
            />
            <MapPinPlus
              className="bg-[#283335] absolute left-[20px] top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-400"
            />
          </td>

          <td className="p-0 pl-2">
            <div className="flex items-center gap-3 leading-none">
              <span className="text-gray-500 text-sm line-through opacity-60">
                {closedLabel}
              </span>
              <span className="inline-flex items-center gap-1 text-yellow-300 text-sm font-semibold">
                {tempLabel}
              </span>
            </div>
          </td>
        </tr>

        {/* BOTTOM CONNECTOR – only if not last stop */}
        {!isLast && (
          <tr className="p-0 m-0" style={{ height: "0px", lineHeight: 0 }}>
            <td className="relative w-[40px] p-0 m-0">
              {/* Yellow turn-out */}
              <div className="absolute left-[10px] bottom-[0px] w-[22px] h-[3px] bg-yellow-300"></div>

              {/* Faint base connector */}
              <div className={`absolute left-[10px] top-0 bottom-0 w-[2px] ${faintBase}`}></div>
            </td>
          </tr>
        )}
      </>
    );
  }


  function StopsListWithDiversion({ stopList, route, stops, direction }) {
    const color = direction === "forward" ? "green" : "red";
    const baseLineClass = direction === "forward" ? "bg-green-400" : "bg-red-400";

    const affectedStops = route?.diversion?.stops || [];
    const affectedSet = new Set(affectedStops);

    // helpers
    const findStop = (sid) =>
      stops.find((s) => String(s.stopId) === String(sid)) ||
      stops.find((s) => String(s._id) === String(sid));

    // mark closed/affected
    const isBlocked = stopList.map((sid) => {
      const s = findStop(sid);
      return s?.closed || affectedSet.has(sid);
    });

    // detect contiguous diversion blocks
    const blocks = [];
    let i = 0;
    while (i < stopList.length) {
      if (!isBlocked[i]) {
        i++;
        continue;
      }
      const start = i;
      while (i < stopList.length && isBlocked[i]) i++;
      blocks.push({ start, end: i - 1 });
    }

    const blockMap = new Map(blocks.map((b) => [b.start, b]));

    const rows = [];
    let idx = 0;

    while (idx < stopList.length) {
      const sid = stopList[idx];
      const s = findStop(sid);
      const closed = !!s?.closed;
      const affected = affectedSet.has(sid);

      const label = s
        ? `${s.name}${s.town ? ", " + s.town : ""}`
        : sid;

      const block = blockMap.get(idx);

      // render diversion block once for start
      if (block && idx !== stopList.length - 1) {
        rows.push(
          <DiversionBlock
            key={`div-${idx}`}
            closedLabel={label}
            tempLabel={s?.tempStopName || "Continue to next stop"}
            isFirst={idx === 0}
            isLast={block.end === stopList.length - 1}
            direction={direction}
          />
        );
        idx = block.end + 1;
        continue;
      }

      // NORMAL STOP
      const icon = closed ? (
        <MapPinOff className="w-5 h-5 text-red-400" />
      ) : affected ? (
        <MapPinX className="w-5 h-5 text-yellow-300" />
      ) : (
        <MapPin className={`w-5 h-5 text-${color}-300`} />
      );

      rows.push(
        <tr key={idx} className="h-[38px]">
          <td className="relative w-[40px]">
            {idx > 0 && (
              <div className={`absolute top-0 bottom-[18px] w-[2px] ${baseLineClass} left-[10px]`} />
            )}

            <div className="absolute top-1/2 -translate-y-1/2 w-[22px] h-[22px] bg-[#283335] rounded-full flex items-center justify-center left-0">
              {icon}
            </div>

            {idx < stopList.length - 1 && (
              <div className={`absolute top-[26px] bottom-0 w-[2px] ${baseLineClass} left-[10px]`} />
            )}
          </td>

          <td className="pl-1">
            <Link
              href={`/ycc/stops/${s?._id}`}
              className={
                closed
                  ? "text-gray-500 text-sm line-through opacity-60"
                  : affected
                    ? "text-yellow-200 text-sm hover:underline"
                    : "text-white text-sm hover:underline"
              }
            >
              {label}
            </Link>
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


  return (
    <main className="text-white px-4 sm:px-6 py-8 flex flex-col items-center">

      {/* ---------- ROUTE HEADER ---------- */}
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
                <Link href={`/ycc/operators/${operator.slug}`}>
                  {operator.operatorName}
                </Link>
              ) : (
                <span className="text-gray-300">{route.operator}</span>
              )}
            </p>
          </div>

          {/* Origin / Destination */}
          <div className="flex flex-col gap-1 text-sm text-white/90">
            <p>
              <span className="font-semibold">Origin:</span>{' '}
              <Link
                href={`/ycc/stops/${originStop?._id || route.origin}`}
                className={
                  isOriginClosed
                    ? "text-red-400"
                    : originAffected
                      ? "text-yellow-400"
                      : "text-white"
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
                    ? "text-red-400"
                    : destAffected
                      ? "text-yellow-400"
                      : "text-white"
                }
              >
                {getStopName(route.destination)}
              </Link>
            </p>
          </div>
        </div>


        {/* ACTIVE DIVERSION ALERT */}
        {route.diversion?.active && (
          <div className="mt-6 bg-yellow-400/10 border border-yellow-500/40 text-yellow-200 px-4 py-3 rounded-lg flex gap-3 items-start">
            <AlertTriangle size={20} />
            <div>
              <p className="font-semibold text-yellow-100 mb-1">
                Diversion In Place
              </p>
              <p className="text-sm">{route.diversion.reason}</p>
            </div>
          </div>
        )}

      </div>


      {/* ---------- STOP LISTS ---------- */}
      <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">

        {/* OUTBOUND */}
        <div className="bg-[#283335] border border-white/20 rounded-b-2xl rounded-r-2xl p-4 backdrop-blur-md shadow-lg">
          <h2 className="flex items-center gap-2 text-lg font-semibold mb-3 text-green-400">
            Outbound
            <ArrowRight className="w-5 h-5" />
            <span className="text-xs font-normal text-white/70">
              {forwardList.length} stops
            </span>
          </h2>

          <div className="route-container max-h-[550px] overflow-y-auto scroll-smooth pr-2">
<StopsListWithDiversion
  stopList={forwardList}
  route={route}
  stops={stops}
  direction="forward"
/>
          </div>
        </div>

        {/* INBOUND */}
        <div className="bg-[#283335] border border-white/20 rounded-b-2xl rounded-r-2xl p-4 backdrop-blur-md shadow-lg">
          <h2 className="flex items-center gap-2 text-lg font-semibold mb-3 text-red-400">
            Inbound
            <ArrowRight className="w-5 h-5" />
            <span className="text-xs font-normal text-white/70">
              {backwardList.length} stops
            </span>
          </h2>

          <div className="route-container max-h-[550px] overflow-y-auto scroll-smooth pl-2">
<StopsListWithDiversion
  stopList={backwardList}
  route={route}
  stops={stops}
  direction="backward"
/>
          </div>
        </div>

      </div>


      {/* scrollbar hide */}
      <style jsx global>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

    </main>
  );
}
