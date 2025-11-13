'use client';
import { useEffect, useState } from 'react';
import { Save, X, Loader2, AlertTriangle } from 'lucide-react';

export default function AdminStopsPage() {
  const [stops, setStops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({
    stopId: generateStopId(),
    name: '',
    town: '',
    postcode: '',
    location: '',
    routes: [],
    closed: false,
    closureReason: '',
  });

  // 🧭 Load Stops
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

  // 🚍 Load Routes
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

  function generateStopId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  const resetForm = () => {
    setEditing(null);
    setForm({
      stopId: generateStopId(),
      name: '',
      town: '',
      postcode: '',
      location: '',
      routes: [],
      closed: false,
      closureReason: '',
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const toggleRoute = (routeId) => {
    setForm((f) => {
      const updated = f.routes.includes(routeId)
        ? f.routes.filter((r) => r !== routeId)
        : [...f.routes, routeId];
      return { ...f, routes: updated };
    });
  };

  // 💾 Save Stop
  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form };

    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/ycc/stops/${editing}` : '/api/ycc/stops';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (editing)
        setStops((prev) => prev.map((s) => (s._id === data.stop._id ? data.stop : s)));
      else setStops((prev) => [data.stop, ...prev]);

      resetForm();
    } catch (e) {
      console.error('Error saving stop:', e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirmed(id) {
    setConfirmDelete(null);
    await fetch(`/api/ycc/stops/${id}`, { method: 'DELETE' });
    await loadStops();
  }

  async function handleEdit(stop) {
    setEditing(stop._id);
    setForm({
      stopId: stop.stopId,
      name: stop.name,
      town: stop.town,
      postcode: stop.postcode,
      location: stop.location,
      routes: stop.routes || [],
      closed: stop.closed || false,
      closureReason: stop.closureReason || '',
    });
  }

  async function handleDisruptionSave() {
    if (!editing) return;
    setSaving(true);
    await fetch(`/api/ycc/stops/${editing}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        closed: form.closed,
        closureReason: form.closureReason,
      }),
    });
    setSaving(false);
    alert('Disruption updated successfully.');
    await loadStops();
  }

  const getRouteNumbers = (routeIds) => {
    if (!Array.isArray(routeIds) || routeIds.length === 0) return '—';
    const numbers = routeIds
      .map((id) => {
        const match = routes.find((r) => r.routeId === id || r._id === id);
        return match ? match.number : id;
      })
      .filter(Boolean);
    return numbers.length ? numbers.join(', ') : '—';
  };

  return (
    <main className="max-w-10xl mx-auto px-8 mt-8 text-white">
      <div className="grid md:grid-cols-5 gap-8">
        {/* LEFT — Add/Edit Stop Form */}
        <div className="col-span-2 bg-[#283335] p-6 rounded-2xl border border-white/10 backdrop-blur-lg max-h-[666px] overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">{editing ? 'Edit Stop' : 'Add Stop'}</h1>
            {editing && (
              <button onClick={resetForm} className="text-gray-400 hover:text-white transition">
                <X size={18} />
              </button>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 overflow-y-auto max-h-[590px] pr-2 scrollbar-thin scrollbar-thumb-white/10"
          >
            {/* Stop ID */}
            <div>
              <label className="block text-sm mb-1 text-white">Stop ID</label>
              <input
                readOnly
                name="stopId"
                value={form.stopId}
                className="w-full p-2 rounded bg-white/5 border border-white/20 text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                This is an uneditable box — Stop IDs are generated automatically.
              </p>
            </div>


            {/* Name + Town */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Yapton Green"
                  className="w-full p-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Town</label>
                <input
                  name="town"
                  value={form.town}
                  onChange={handleChange}
                  placeholder="e.g. Yapton"
                  className="w-full p-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Postcode */}
            <div>
              <label className="block text-sm mb-1">Postcode</label>
              <input
                name="postcode"
                value={form.postcode}
                onChange={handleChange}
                placeholder="Optional"
                className="w-full p-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm mb-1">Location / Description</label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. near Yapton Green"
                className="w-full p-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Routes */}
            <div>
              <label className="block text-sm mb-1">Routes Serving This Stop</label>
              <div className="max-h-32 overflow-y-auto bg-white/5 border border-white/10 rounded-lg p-2">
                {routes.map((r) => (
                  <div
                    key={r._id}
                    onClick={() => toggleRoute(r._id)}
                    className={`cursor-pointer px-2 py-1 rounded text-sm hover:bg-white/10 ${form.routes.includes(r._id)
                      ? 'bg-green-600/40 border border-green-500/20'
                      : ''
                      }`}
                  >
                    {r.number} — {r.operator}
                  </div>
                ))}
              </div>
            </div>

            {editing && (
              <div className="mt-6 border-t border-white/10 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="text-yellow-400" size={18} />
                  <h2 className="text-lg font-semibold">Manage Stop Disruption</h2>
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="closed"
                    checked={form.closed}
                    onChange={handleChange}
                  />
                  Stop Closed / Out of Action
                </label>

                {form.closed && (
                  <div className="mt-3 space-y-3">
                    <textarea
                      placeholder="Closure reason..."
                      name="closureReason"
                      value={form.closureReason}
                      onChange={handleChange}
                      className="w-full p-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-yellow-400 text-sm"
                      rows="3"
                    />
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleDisruptionSave}
                      className="bg-yellow-500 hover:bg-yellow-400 text-black w-full py-2 rounded-lg font-semibold flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                      <Save size={18} />
                      {saving ? 'Saving...' : 'Save Closure'}
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="bg-green-500 hover:bg-green-600 text-black w-full py-2 rounded-lg font-semibold flex justify-center items-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? 'Saving...' : editing ? 'Update Stop' : 'Add Stop'}
            </button>
          </form>
        </div>

        <div className="col-span-3 bg-[#283335] p-6 rounded-2xl border border-white/10 backdrop-blur-lg max-h-[666px] overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">All Stops</h2>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stops..."
              className="p-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="overflow-y-auto max-h-[550px] pr-2 scrollbar-thin scrollbar-thumb-white/10">
            {loading ? (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="animate-spin w-4 h-4" /> Loading stops...
              </div>
            ) : stops.length === 0 ? (
              <p className="text-gray-400 text-sm">No stops found.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stops.map((s) => (
                  <div
                    key={s._id}
                    className="bg-white/5 p-4 rounded-xl border border-white/10 hover:border-white/20 transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-green-400">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.stopId}</p>
                    </div>
                    <p className="text-sm text-gray-300">{s.town}</p>
                    {s.closed && (
                      <p className="text-xs text-yellow-400 mt-1">⚠️ Stop Closed</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Routes: {getRouteNumbers(s.routes)}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleEdit(s)}
                        className="bg-yellow-500 hover:bg-yellow-400 text-black px-3 py-1 rounded text-sm font-medium flex-1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete(s)}
                        className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-sm font-medium flex-1"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#283335] border border-white/10 rounded-xl p-6 w-[90%] sm:w-[400px] shadow-xl">
            <h3 className="text-lg font-semibold text-red-400 mb-2">
              Confirm Deletion
            </h3>
            <p className="text-white/70 text-sm mb-4">
              Are you sure you want to permanently delete the stop{" "}
              <span className="font-semibold text-white">
                {confirmDelete.name || "Unnamed Stop"}
              </span>
              ?
              <br />
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConfirmed(confirmDelete._id)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition"
              >
                Delete Stop
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.15);
          border-radius: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.25);
        }
      `}</style>
    </main>
  );
}
