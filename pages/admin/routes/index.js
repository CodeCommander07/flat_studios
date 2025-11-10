'use client';
import { useEffect, useState } from 'react';
import { Save, Loader2, X } from 'lucide-react';

export default function AdminRoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({
    number: '',
    operator: '',
    origin: '',
    destination: '',
    description: '',
    stops: [],
  });

  // 🧩 Load Routes
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

  const getStopName = (id) => {
    const s = stops.find((x) => x.stopId === id);
    return s ? `${s.name}${s.town ? ', ' + s.town : ''}` : id;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const toggleStop = (stopId) => {
    setForm((s) => {
      const updated = s.stops.includes(stopId)
        ? s.stops.filter((x) => x !== stopId)
        : [...s.stops, stopId];
      return { ...s, stops: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      number: form.number.trim(),
      operator: form.operator.trim(),
      description: form.description.trim(),
    };

    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/ycc/routes/${editing}` : '/api/ycc/routes';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    setEditing(null);
    resetForm();
    await loadRoutes();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this route?')) return;
    await fetch(`/api/ycc/routes/${id}`, { method: 'DELETE' });
    await loadRoutes();
  };

  const handleEdit = (r) => {
    setEditing(r._id);
    setForm({
      number: r.number || '',
      operator: r.operator || '',
      origin: r.origin || '',
      destination: r.destination || '',
      description: r.description || '',
      stops: r.stops || [],
    });
  };

  const resetForm = () => {
    setEditing(null);
    setForm({
      number: '',
      operator: '',
      origin: '',
      destination: '',
      description: '',
      stops: [],
    });
  };

  return (
    <main className="max-w-10xl mx-auto px-8 mt-8 text-white">
      <div className="grid md:grid-cols-5 gap-8">
        {/* LEFT — Add/Edit Route Form */}
        <div className="col-span-2 bg-[#283335] p-6 rounded-2xl border border-white/10 backdrop-blur-lg max-h-[666px] overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">{editing ? 'Edit Route' : 'Add Route'}</h1>
            {editing && (
              <button onClick={resetForm} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto max-h-[590px] pr-2 scrollbar-thin scrollbar-thumb-white/10">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Route Number</label>
                <input
                  type="text"
                  name="number"
                  value={form.number}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500"
                  placeholder="e.g. 42A"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Operator</label>
                <input
                  type="text"
                  name="operator"
                  value={form.operator}
                  onChange={handleChange}
                  placeholder="e.g. Yapton Buses"
                  className="w-full p-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Origin / Destination */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Origin</label>
                <select
                  name="origin"
                  value={form.origin}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select origin</option>
                  {stops.map((stop) => (
                    <option key={stop.stopId} value={stop.stopId}>
                      {getStopName(stop.stopId)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Destination</label>
                <select
                  name="destination"
                  value={form.destination}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select destination</option>
                  {stops.map((stop) => (
                    <option key={stop.stopId} value={stop.stopId}>
                      {getStopName(stop.stopId)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm mb-1">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="3"
                className="w-full p-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>

            {/* Stops */}
            <div>
              <label className="block text-sm mb-1">Route Stops</label>
              <div className="max-h-32 overflow-y-auto bg-white/5 border border-white/10 rounded-lg p-2">
                {stops.map((stop) => (
                  <div
                    key={stop.stopId}
                    onClick={() => toggleStop(stop.stopId)}
                    className={`cursor-pointer px-2 py-1 rounded text-sm hover:bg-white/10 ${
                      form.stops.includes(stop.stopId)
                        ? 'bg-green-600/40 border border-green-500/20'
                        : ''
                    }`}
                  >
                    {getStopName(stop.stopId)}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-green-500 hover:bg-green-600 text-black w-full py-2 rounded-lg font-semibold flex justify-center items-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? 'Saving...' : editing ? 'Update Route' : 'Add Route'}
            </button>
          </form>
        </div>

        {/* RIGHT — Routes List */}
        <div className="col-span-3 bg-[#283335] p-6 rounded-2xl border border-white/10 backdrop-blur-lg max-h-[666px] overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">All Routes</h2>
            <input
              type="text"
              placeholder="Search routes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="p-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="overflow-y-auto max-h-[590px] pr-2 scrollbar-thin scrollbar-thumb-white/10">
            {loading ? (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="animate-spin w-4 h-4" /> Loading routes...
              </div>
            ) : routes.length === 0 ? (
              <p className="text-gray-400 text-sm">No routes found.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {routes.map((r) => (
                  <div
                    key={r._id}
                    className="bg-white/5 p-4 rounded-xl border border-white/10 hover:border-white/20 transition"
                  >
                    <h3 className="text-xl font-bold text-green-400">{r.number}</h3>
                    <p className="text-sm text-gray-300">
                      {getStopName(r.origin)} → {getStopName(r.destination)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{r.description}</p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleEdit(r)}
                        className="bg-yellow-500 hover:bg-yellow-400 text-black px-3 py-1 rounded text-sm font-medium flex-1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(r._id)}
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

      {/* 🧩 Custom Scrollbar */}
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
