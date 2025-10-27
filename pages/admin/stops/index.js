'use client';
import { useEffect, useState } from 'react';

export default function AdminStopsPage() {
  const [stops, setStops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // 🚌 Load Stops
  async function loadStops() {
    setLoading(true);
    try {
      const res = await fetch(`/api/ycc/stops${query ? `?q=${encodeURIComponent(query)}` : ''}`);
      const data = await res.json();
      setStops(data.stops || []);
    } catch (e) {
      console.error('Failed to load stops:', e);
    } finally {
      setLoading(false);
    }
  }

  // 🚏 Load Routes (to show route numbers)
  async function loadRoutes() {
    try {
      const res = await fetch('/api/ycc/routes');
      const data = await res.json();
      setRoutes(data.routes || []);
    } catch (e) {
      console.error('Failed to load routes:', e);
    }
  }

  useEffect(() => {
    loadStops();
    loadRoutes();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadStops(), 300);
    return () => clearTimeout(t);
  }, [query]);

  const emptyStop = {
    stopId: '',
    name: '',
    town: '',
    postcode: '',
    location: '',
    routes: [],
  };

  function generateStopId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  const openCreate = () => {
    setSelected({
      stopId: generateStopId(),
      name: '',
      town: '',
      postcode: '',
      location: '',
      routes: [],
    });
    setCreating(true);
  };

  const openEdit = (s) => {
    setSelected(s);
    setCreating(false);
  };

  const closeModal = () => {
    setSelected(null);
    setSaving(false);
  };

  async function saveStop() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(
        creating ? '/api/ycc/stops' : `/api/ycc/stops/${selected._id}`,
        {
          method: creating ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(selected),
        }
      );
      const data = await res.json();
      if (creating) setStops((prev) => [data.stop, ...prev]);
      else setStops((prev) => prev.map((r) => (r._id === data.stop._id ? data.stop : r)));
      closeModal();
    } catch (e) {
      console.error('Error saving stop:', e);
      setSaving(false);
    }
  }

  async function deleteStop(id) {
    if (!confirm('Delete this stop?')) return;
    try {
      await fetch(`/api/ycc/stops/${id}`, { method: 'DELETE' });
      setStops((prev) => prev.filter((s) => s._id !== id));
    } catch (e) {
      console.error('Error deleting stop:', e);
    }
  }

  // 🧮 Convert route IDs → route numbers
  const getRouteNumbers = (routeIds) => {
    if (!Array.isArray(routeIds) || routeIds.length === 0) return '—';
    const numbers = routeIds
      .map((id) => {
        const match = routes.find((r) => r.routeId === id || r._id === id);
        return match ? match.number : null;
      })
      .filter(Boolean);
    return numbers.length ? numbers.join(', ') : '—';
  };

  return (
    <div className="min-h-screen text-neutral-100">
      <div className="mx-auto max-w-7xl p-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Admin · Bus Stops</h1>
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stop name or town..."
              className="rounded-xl bg-neutral-900 px-4 py-2 outline-none ring-1 ring-neutral-800 focus:ring-neutral-600"
            />
            <button
              onClick={openCreate}
              className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold hover:bg-emerald-500"
            >
              Add Stop
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl ring-1 ring-neutral-800">
          <table className="min-w-full divide-y divide-neutral-800">
            <thead className="bg-neutral-900">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Stop ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Town</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Routes</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Updated</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 bg-neutral-950">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-neutral-400">
                    Loading stops…
                  </td>
                </tr>
              ) : stops.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-neutral-400">
                    No stops found.
                  </td>
                </tr>
              ) : (
                stops.map((s) => (
                  <tr key={s._id} className="hover:bg-neutral-900/50">
                    <td className="px-4 py-3 text-sm font-bold">{s.stopId}</td>
                    <td className="px-4 py-3 text-sm">{s.name}</td>
                    <td className="px-4 py-3 text-sm">{s.town}</td>
                    <td className="px-4 py-3 text-sm max-w-[16rem] truncate">
                      {getRouteNumbers(s.routes)}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-400">
                      {new Date(s.updatedAt || s.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(s)}
                          className="rounded-lg bg-neutral-800 px-3 py-1.5 text-sm hover:bg-neutral-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteStop(s._id)}
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
          <div className="w-full max-w-2xl rounded-2xl bg-neutral-950 ring-1 ring-neutral-800 p-4">
            <h2 className="text-xl font-semibold mb-3">
              {creating ? 'Create Stop' : `Edit Stop ${selected.stopId}`}
            </h2>

            <div className="grid gap-4">
              <label className="grid gap-1">
                <span className="text-sm text-neutral-300">Stop ID</span>
                <input
                  readOnly
                  className="rounded-xl bg-neutral-900 px-3 py-2 outline-none ring-1 ring-neutral-800 text-neutral-400"
                  value={selected.stopId}
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm text-neutral-300">Name</span>
                <input
                  className="rounded-xl bg-neutral-900 px-3 py-2 outline-none ring-1 ring-neutral-800 focus:ring-neutral-600"
                  value={selected.name}
                  onChange={(e) =>
                    setSelected((s) => ({ ...s, name: e.target.value }))
                  }
                  placeholder="Stop name"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm text-neutral-300">Town</span>
                <input
                  className="rounded-xl bg-neutral-900 px-3 py-2 outline-none ring-1 ring-neutral-800 focus:ring-neutral-600"
                  value={selected.town}
                  onChange={(e) =>
                    setSelected((s) => ({ ...s, town: e.target.value }))
                  }
                  placeholder="e.g. Yapton"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm text-neutral-300">Postcode</span>
                <input
                  className="rounded-xl bg-neutral-900 px-3 py-2 outline-none ring-1 ring-neutral-800 focus:ring-neutral-600"
                  value={selected.postcode}
                  onChange={(e) =>
                    setSelected((s) => ({ ...s, postcode: e.target.value }))
                  }
                  placeholder="Optional"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm text-neutral-300">Location (coords or desc)</span>
                <input
                  className="rounded-xl bg-neutral-900 px-3 py-2 outline-none ring-1 ring-neutral-800 focus:ring-neutral-600"
                  value={selected.location}
                  onChange={(e) =>
                    setSelected((s) => ({ ...s, location: e.target.value }))
                  }
                  placeholder="e.g. near Yapton Green"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-neutral-800 mt-5 pt-3">
              <button
                onClick={closeModal}
                className="rounded-xl bg-neutral-800 px-4 py-2 text-sm font-semibold hover:bg-neutral-700"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                onClick={saveStop}
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
