'use client';
import { useEffect, useMemo, useState } from 'react';

export default function AdminRoutesPage() {
    const [routes, setRoutes] = useState([]);
    const [stops, setStops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState(null);
    const [saving, setSaving] = useState(false);
    const [creating, setCreating] = useState(false);

    // 🧭 Load Routes
    async function loadRoutes() {
        setLoading(true);
        try {
            const res = await fetch(`/api/ycc/routes${query ? `?q=${encodeURIComponent(query)}` : ''}`);
            const data = await res.json();
            setRoutes(data.routes || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    // 🚏 Load Stops
    async function loadStops() {
        try {
            const res = await fetch('/api/ycc/stops');
            const data = await res.json();
            setStops(data.stops || []);
        } catch (e) {
            console.error('Failed to load stops:', e);
        }
    }

    useEffect(() => {
        loadRoutes();
        loadStops();
    }, []);

    useEffect(() => {
        const t = setTimeout(() => loadRoutes(), 300);
        return () => clearTimeout(t);
    }, [query]);

    const emptyRoute = useMemo(
        () => ({
            number: '',
            operator: '',
            origin: '',
            destination: '',
            stops: [],
            description: '',
            diversion: {
                active: false,
                reason: '',
                stops: [],
            },
        }),
        []
    );

    const getStopName = (id) => {
        const s = stops.find((x) => x.stopId === id);
        return s ? `${s.name}${s.town ? ', ' + s.town : ''}` : id;
    };

    function openCreate() {
        setSelected({ ...emptyRoute });
        setCreating(true);
    }

    function openEdit(r) {
        setSelected({
            ...r,
            diversion: r.diversion || { active: false, reason: '', stops: [] },
        });
        setCreating(false);
    }

    function closeModal() {
        setSelected(null);
        setSaving(false);
    }

    async function saveRoute() {
        if (!selected) return;
        setSaving(true);

        const payload = {
            number: selected.number?.trim(),
            operator: selected.operator?.trim(),
            origin: selected.origin?.trim(),
            destination: selected.destination?.trim(),
            description: selected.description?.trim(),
            stops: selected.stops || [],
            diversion: {
                active: !!selected.diversion?.active,
                reason: selected.diversion?.reason || '',
                stops: selected.diversion?.stops || [],
            },
        };

        try {
            const res = await fetch(
                creating ? '/api/ycc/routes' : `/api/ycc/routes/${selected._id}`,
                {
                    method: creating ? 'POST' : 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }
            );
            const data = await res.json();
            if (creating) setRoutes((prev) => [data.route, ...prev]);
            else setRoutes((prev) => prev.map((r) => (r._id === data.route._id ? data.route : r)));
            closeModal();
        } catch (e) {
            console.error(e);
            setSaving(false);
        }
    }

    async function deleteRoute(id) {
        if (!confirm('Delete this route?')) return;
        try {
            await fetch(`/api/ycc/routes/${id}`, { method: 'DELETE' });
            setRoutes((prev) => prev.filter((r) => r._id !== id));
        } catch (e) {
            console.error(e);
        }
    }

    // 🔍 Filter stops by name or town
    const filterStops = (input) =>
        stops.filter(
            (s) =>
                s.name.toLowerCase().includes(input.toLowerCase()) ||
                (s.town || '').toLowerCase().includes(input.toLowerCase())
        );

    // 🧱 Add or remove stop
    const toggleStop = (stopId, isDiversion = false) => {
        setSelected((s) => {
            const list = isDiversion ? s.diversion.stops : s.stops;
            const updated = list.includes(stopId)
                ? list.filter((x) => x !== stopId)
                : [...list, stopId];
            if (isDiversion)
                return { ...s, diversion: { ...s.diversion, stops: updated } };
            return { ...s, stops: updated };
        });
    };

    // 💬 Stop Search Inputs
    const [originSearch, setOriginSearch] = useState('');
    const [destinationSearch, setDestinationSearch] = useState('');
    const [stopsSearch, setStopsSearch] = useState('');
    const [diversionStopsSearch, setDiversionStopsSearch] = useState('');

    return (
        <div className="min-h-screen text-neutral-100">
            <style jsx global>{`
        @keyframes flash {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 0px rgba(255,0,0,0.5)); }
          50% { opacity: 0.35; filter: drop-shadow(0 0 8px rgba(255,0,0,0.9)); }
        }
        .flash-box { animation: flash 1.2s infinite; }
        .stop-item.removed { text-decoration: line-through; color: #f87171; }
      `}</style>

            <div className="mx-auto max-w-7xl p-6">
                <div className="flex items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold">Admin · Routes</h1>
                    <div className="flex items-center gap-2">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search operator, number, start/end..."
                            className="rounded-xl bg-neutral-900 px-4 py-2 outline-none ring-1 ring-neutral-800 focus:ring-neutral-600"
                        />
                        <button
                            onClick={openCreate}
                            className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold hover:bg-emerald-500"
                        >
                            Add Route
                        </button>
                    </div>
                </div>

                <div className="mt-6 overflow-x-auto rounded-2xl ring-1 ring-neutral-800">
                    <table className="min-w-full divide-y divide-neutral-800">
                        <thead className="bg-neutral-900">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Operator</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Start → End</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Stops</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Updated</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800 bg-neutral-950">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-neutral-400">
                                        Loading routes…
                                    </td>
                                </tr>
                            ) : routes.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-neutral-400">
                                        No routes found.
                                    </td>
                                </tr>
                            ) : (
                                routes.map((r) => (
                                    <tr key={r._id} className="hover:bg-neutral-900/50">
                                        <td className="px-4 py-3 text-sm font-bold">{r.number}</td>
                                        <td className="px-4 py-3 text-sm">{r.operator}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span>{getStopName(r.origin)}</span>
                                                <span className="text-neutral-500">→</span>
                                                <span>{getStopName(r.destination)}</span>
                                                {r.diversion?.active && (
                                                    <span className="flash-box ml-3 rounded-lg bg-red-600/20 px-2 py-0.5 text-xs font-semibold text-red-400 ring-1 ring-red-700">
                                                        DIVERSION
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm max-w-[28rem] truncate">
                                            {(r.stops || []).slice(0, 6).map(getStopName).join(', ')}
                                            {(r.stops || []).length > 6 ? '…' : ''}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-neutral-400">
                                            {new Date(r.updatedAt || r.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEdit(r)}
                                                    className="rounded-lg bg-neutral-800 px-3 py-1.5 text-sm hover:bg-neutral-700"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => deleteRoute(r._id)}
                                                    className="rounded-lg bg-red-700 px-3 py-1.5 text-sm hover:bg-red-600"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 🪟 Modal */}
            {selected && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 overflow-y-auto">
                    <div className="w-full max-w-3xl rounded-2xl bg-neutral-950 ring-1 ring-neutral-800 p-4">
                        <h2 className="text-xl font-semibold mb-3">
                            {creating ? 'Create Route' : `Edit Route ${selected.number}`}
                        </h2>

                        <div className="grid gap-4">
                            {/* 🧾 Route Details */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <label className="grid gap-1">
                                    <span className="text-sm text-neutral-300">Route Number</span>
                                    <input
                                        className="rounded-xl bg-neutral-900 px-3 py-2 outline-none ring-1 ring-neutral-800 focus:ring-neutral-600"
                                        value={selected.number}
                                        onChange={(e) => setSelected((s) => ({ ...s, number: e.target.value }))}
                                        placeholder="e.g. 42A"
                                    />
                                </label>
                                <label className="grid gap-1">
                                    <span className="text-sm text-neutral-300">Operator</span>
                                    <input
                                        className="rounded-xl bg-neutral-900 px-3 py-2 outline-none ring-1 ring-neutral-800 focus:ring-neutral-600"
                                        value={selected.operator}
                                        onChange={(e) => setSelected((s) => ({ ...s, operator: e.target.value }))}
                                        placeholder="e.g. Yapton Buses"
                                    />
                                </label>
                            </div>

                            {/* ✏️ Description */}
                            <label className="grid gap-1">
                                <span className="text-sm text-neutral-300">Description</span>
                                <textarea
                                    className="rounded-xl bg-neutral-900 px-3 py-2 outline-none ring-1 ring-neutral-800 focus:ring-neutral-600"
                                    rows={3}
                                    value={selected.description || ''}
                                    onChange={(e) => setSelected((s) => ({ ...s, description: e.target.value }))}
                                    placeholder="Optional notes or route details..."
                                />
                            </label>

                            {/* 🚏 Start Stop (Searchable) */}
                            <div className="grid md:grid-cols-2 gap-4">

                                <div>
                                    <span className="text-sm text-neutral-300">Start Stop</span>
                                    <input
                                        className="mt-1 w-full rounded-xl bg-neutral-900 px-3 py-2 outline-none ring-1 ring-neutral-800 focus:ring-neutral-600"
                                        placeholder="Search start stop..."
                                        value={originSearch}
                                        onChange={(e) => setOriginSearch(e.target.value)}
                                    />
                                    <div className="max-h-40 overflow-y-auto mt-1">
                                        {filterStops(originSearch).map((stop) => (
                                            <div
                                                key={stop.stopId}
                                                onClick={() => setSelected((s) => ({ ...s, origin: stop.stopId }))}
                                                className={`px-3 py-1.5 rounded-md cursor-pointer hover:bg-neutral-800 ${selected.origin === stop.stopId ? 'bg-emerald-700/40' : ''
                                                    }`}
                                            >
                                                {stop.name}
                                                {stop.town ? `, ${stop.town}` : ''}
                                            </div>
                                        ))}
                                    </div>
                                    {selected.origin && (
                                        <p className="mt-1 text-xs text-neutral-400">
                                            Selected: {getStopName(selected.origin)}
                                        </p>
                                    )}
                                </div>

                                {/* 🏁 End Stop (Searchable) */}
                                <div>
                                    <span className="text-sm text-neutral-300">End Stop</span>
                                    <input
                                        className="mt-1 w-full rounded-xl bg-neutral-900 px-3 py-2 outline-none ring-1 ring-neutral-800 focus:ring-neutral-600"
                                        placeholder="Search destination stop..."
                                        value={destinationSearch}
                                        onChange={(e) => setDestinationSearch(e.target.value)}
                                    />
                                    <div className="max-h-40 overflow-y-auto mt-1">
                                        {filterStops(destinationSearch).map((stop) => (
                                            <div
                                                key={stop.stopId}
                                                onClick={() => setSelected((s) => ({ ...s, destination: stop.stopId }))}
                                                className={`px-3 py-1.5 rounded-md cursor-pointer hover:bg-neutral-800 ${selected.destination === stop.stopId ? 'bg-red-700/40' : ''
                                                    }`}
                                            >
                                                {stop.name}
                                                {stop.town ? `, ${stop.town}` : ''}
                                            </div>
                                        ))}
                                    </div>
                                    {selected.destination && (
                                        <p className="mt-1 text-xs text-neutral-400">
                                            Selected: {getStopName(selected.destination)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* 🚍 Route Stops */}
                            {/* 🚍 Route Stops */}
                            <div>
                                <span className="text-sm text-neutral-300">Route Stops</span>
                                <input
                                    className="mt-1 w-full rounded-xl bg-neutral-900 px-3 py-2 outline-none ring-1 ring-neutral-800 focus:ring-neutral-600"
                                    placeholder="Search and add stops..."
                                    value={stopsSearch}
                                    onChange={(e) => setStopsSearch(e.target.value)}
                                />

                                {/* 🟢 Selected stops visual list */}
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {selected.stops.map((stopId) => (
                                        <div
                                            key={stopId}
                                            onClick={() => toggleStop(stopId)}
                                            className={`stop-item cursor-pointer rounded-lg px-3 py-1.5 text-sm ${stopId === selected.origin
                                                    ? 'bg-emerald-700 text-white'
                                                    : stopId === selected.destination
                                                        ? 'bg-blue-700 text-white'
                                                        : 'bg-neutral-800 hover:bg-neutral-700'
                                                }`}
                                        >
                                            {getStopName(stopId)}
                                        </div>
                                    ))}
                                </div>

                                {/* 🔍 Search dropdown */}
                                <div className="max-h-40 overflow-y-auto mt-2">
                                    {filterStops(stopsSearch).map((stop) => {
                                        const isSelected = selected.stops.includes(stop.stopId);
                                        const isStart = selected.origin === stop.stopId;
                                        const isEnd = selected.destination === stop.stopId;

                                        return (
                                            <div
                                                key={stop.stopId}
                                                onClick={() => toggleStop(stop.stopId)}
                                                className={`${isStart ? "bg-emerald-700/40":""} ${isEnd ? "bg-red-700/40":""} px-3 py-1.5 rounded-md cursor-pointer flex justify-between items-center hover:bg-neutral-800  ${isSelected ? 'stop-item removed' : ''
                                                    }`}
                                            >
                                                <span>
                                                    {stop.name}
                                                    {stop.town ? `, ${stop.town}` : ''}
                                                </span>
                                                {isStart && (
                                                    <span className="text-xs font-semibold text-emerald-300">Start</span>
                                                )}
                                                {isEnd && (
                                                    <span className="text-xs font-semibold text-red-300">End</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ⚠️ Diversion Section */}
                            <div className="bg-white/5 border border-white/10 p-4 rounded-lg mt-3">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-semibold">Diversion Settings</h3>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={selected.diversion?.active || false}
                                            onChange={(e) =>
                                                setSelected((s) => ({
                                                    ...s,
                                                    diversion: { ...s.diversion, active: e.target.checked },
                                                }))
                                            }
                                        />
                                        Active
                                    </label>
                                </div>

                                <label className="block mb-3">
                                    <span className="block text-sm mb-1">Reason</span>
                                    <input
                                        value={selected.diversion?.reason || ''}
                                        onChange={(e) =>
                                            setSelected((s) => ({
                                                ...s,
                                                diversion: { ...s.diversion, reason: e.target.value },
                                            }))
                                        }
                                        className="w-full bg-gray-900 border border-white/10 rounded p-2"
                                        placeholder="e.g. Road closed at Main Street"
                                    />
                                </label>

                                {/* 🚧 Diversion Stops */}
                                <span className="text-sm text-neutral-300">Diversion Stops</span>
                                <input
                                    className="mt-1 w-full rounded-xl bg-neutral-900 px-3 py-2 outline-none ring-1 ring-neutral-800 focus:ring-neutral-600"
                                    placeholder="Search and add diversion stops..."
                                    value={diversionStopsSearch}
                                    onChange={(e) => setDiversionStopsSearch(e.target.value)}
                                />

                                {/* 🟡 Only show stops from selected route */}
                                <div className="max-h-40 overflow-y-auto mt-2">
                                    {filterStops(diversionStopsSearch)
                                        .filter((stop) => selected.stops.includes(stop.stopId)) // ✅ only route stops
                                        .map((stop) => (
                                            <div
                                                key={stop.stopId}
                                                onClick={() => toggleStop(stop.stopId, true)}
                                                className={`px-3 py-1.5 rounded-md cursor-pointer hover:bg-neutral-800 ${selected.diversion?.stops.includes(stop.stopId)
                                                        ? 'stop-item removed'
                                                        : ''
                                                    }`}
                                            >
                                                {stop.name}
                                                {stop.town ? `, ${stop.town}` : ''}
                                            </div>
                                        ))}
                                </div>

                                <div className="flex flex-wrap gap-2 mt-3">
                                    {selected.diversion?.stops.map((stopId) => (
                                        <div
                                            key={stopId}
                                            onClick={() => toggleStop(stopId, true)}
                                            className="stop-item cursor-pointer rounded-lg bg-neutral-800 px-3 py-1.5 text-sm hover:bg-neutral-700"
                                        >
                                            {getStopName(stopId)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-2 border-t border-neutral-800 mt-5 pt-3">
                            <button
                                onClick={closeModal}
                                className="rounded-xl bg-neutral-800 px-4 py-2 text-sm font-semibold hover:bg-neutral-700"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={saving}
                                onClick={saveRoute}
                                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50"
                            >
                                {saving ? 'Saving…' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
