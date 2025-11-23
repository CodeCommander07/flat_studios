'use client';
import { useEffect, useState } from 'react';
import { Save, X, Loader2 } from 'lucide-react';

export default function AdminStopsPage() {
  const [stops, setStops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [sortType, setSortType] = useState('az');
  const [showAlerts, setShowAlerts] = useState(false);
  const [operators, setOperators] = useState([]);
  const [tempStopSearch, setTempStopSearch] = useState('');

  const [form, setForm] = useState({
    stopId: generateStopId(),
    name: '',
    town: '',
    facilities: [],
    branding: '',
    notes: '',
    postcode: '',
    routes: [],
    closed: false,
    closureReason: '',
    tempStopId: '',
  });

  function generateStopId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  // ---------- DATA LOADERS ----------

  async function loadOperators() {
    try {
      const res = await fetch('/api/ycc/operators/active');
      const data = await res.json();
      setOperators(data.submissions || data || []);
    } catch (err) {
      console.error('Failed to load operators:', err);
    }
  }

  async function loadStops() {
    setLoading(true);
    try {
      const res = await fetch(`/api/ycc/stops${query ? `?q=${encodeURIComponent(query)}` : ''}`);
      const data = await res.json();
      const rawStops = Array.isArray(data?.stops) ? data.stops : Array.isArray(data) ? data : [];
      setStops(rawStops);
    } catch (e) {
      console.error('Failed to load stops:', e);
    } finally {
      setLoading(false);
    }
  }

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
    loadOperators();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadStops(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // ---------- FORM / STATE HELPERS ----------

  const resetForm = () => {
    setEditing(null);
    setForm({
      stopId: generateStopId(),
      name: '',
      town: '',
      facilities: [],
      branding: '',
      notes: '',
      postcode: '',
      routes: [],
      closed: false,
      closureReason: '',
      tempStopId: '',
    });
    setTempStopSearch('');
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

  // ---------- CRUD ----------

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

      if (!data || !data.stop) {
        console.error('Invalid response from API:', data);
        return;
      }

      const s = data.stop;

      if (editing) {
        setStops((prev) => prev.map((st) => (st._id === s._id ? s : st)));
      } else {
        setStops((prev) => [s, ...prev]);
      }

      resetForm();
      await loadStops();
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
      facilities: stop.facilities || [],
      branding: stop.branding || '',
      notes: stop.notes || '',
      postcode: stop.postcode || '',
      routes: stop.routes || [],
      closed: stop.closed || false,
      closureReason: stop.closureReason || '',
      tempStopId: stop.tempStopId || '',
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
        tempStopId: form.tempStopId,
      }),
    });
    setSaving(false);
    alert('Disruption updated successfully.');
    await loadStops();
  }

  // ---------- ROUTE LABELS / SORTING ----------

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

  const sortedStops = [...stops]
    .filter((s) => {
      if (showAlerts) return s.closed === true;
      return true;
    })
    .sort((a, b) => {
      switch (sortType) {
        case 'az':
          return a.name.localeCompare(b.name);
        case 'za':
          return b.name.localeCompare(a.name);
        case 'routesAsc':
          return (a.routes?.length || 0) - (b.routes?.length || 0);
        case 'routesDesc':
          return (b.routes?.length || 0) - (a.routes?.length || 0);
        case 'closed':
          return (b.closed ? 1 : 0) - (a.closed ? 1 : 0);
        case 'active':
          return (a.closed ? 1 : 0) - (b.closed ? 1 : 0);
        default:
          return 0;
      }
    });

  // ---------- RENDER ----------

  return (
    <main className="max-w-10xl mx-auto px-8 mt-8 text-white">
      <div className="grid md:grid-cols-5 gap-8">
        {/* LEFT PANE: FORM */}
        <div className="col-span-2 bg-[#283335] p-6 rounded-2xl border border-white/10 backdrop-blur-lg max-h-[666px] overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">
                {editing ? 'Edit Stop' : 'Add Stop'}
              </h1>

              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    setForm((f) => ({
                      ...f,
                      closed: !f.closed,
                      ...(f.closed ? { closureReason: '', tempStopId: '' } : {}),
                    }));

                    setTimeout(() => {
                      document
                        .getElementById('disruptionSection')
                        ?.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                  }}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs border transition
                    ${
                      form.closed
                        ? 'bg-red-500/20 border-red-500/40 text-red-300'
                        : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                    }`}
                >
                  {form.closed ? 'Closed / Disrupted' : 'Manage Closure'}
                </button>
              )}
            </div>
            {editing && (
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-white transition"
                title="Cancel editing"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 overflow-y-auto max-h-[590px] pr-2 scrollbar-thin scrollbar-thumb-white/10"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1 text-white">Stop ID</label>
                <input
                  readOnly
                  disabled
                  name="stopId"
                  value={form.stopId}
                  className="w-full p-2 rounded bg-white/5 border border-white/20 text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Stop Name</label>
                <input
                  name="name"
                  value={form.name}
                  required
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-white/10 border border-white/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Town</label>
                <input
                  name="town"
                  value={form.town}
                  required
                  onChange={handleChange}
                  placeholder="e.g. Yapton"
                  className="w-full p-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500"
                />
              </div>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Branding</label>
                <input
                  name="branding"
                  value={form.branding}
                  onChange={handleChange}
                  placeholder="e.g. Yapton & District"
                  className="w-full p-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">
                  Facilities (comma separated)
                </label>
                <input
                  name="facilities"
                  value={form.facilities.join(', ')}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      facilities: e.target.value
                        .split(',')
                        .map((x) => x.trim())
                        .filter(Boolean),
                    }))
                  }
                  placeholder="e.g. Shelter, Seating, Info Screen"
                  className="w-full p-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Optional notes…"
                className="w-full p-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Routes Serving This Stop</label>
              <div className="max-h-32 overflow-y-auto bg-white/5 border border-white/10 rounded-lg p-2">
                {routes.map((r) => {
                  const operatorNames = Array.isArray(r.operator)
                    ? r.operator
                        .map((id) => operators.find((op) => op._id === id)?.operatorName)
                        .filter(Boolean)
                        .join(', ')
                    : operators.find((op) => op._id === r.operator)?.operatorName ||
                      'Unknown Operator';

                  return (
                    <div
                      key={r._id}
                      onClick={() => toggleRoute(r._id)}
                      className={`cursor-pointer px-2 py-1 rounded text-sm hover:bg-white/10 ${
                        form.routes.includes(r._id)
                          ? 'bg-green-600/40 border border-green-500/20'
                          : ''
                      }`}
                    >
                      {r.number} — {operatorNames}
                    </div>
                  );
                })}
              </div>
            </div>

            {editing && (
              <div
                className="mt-6 border-t border-white/10 pt-4"
                id="disruptionSection"
              >
                {form.closed && (
                  <div className="mt-3 space-y-3">
                    <textarea
                      placeholder="Closure reason..."
                      name="closureReason"
                      value={form.closureReason}
                      onChange={handleChange}
                      className="w-full p-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-yellow-400 text-sm"
                      rows={3}
                    />

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">
                        Temporary Replacement Stop
                      </label>

                      <input
                        type="text"
                        placeholder="Search for a temporary stop..."
                        value={tempStopSearch}
                        onChange={(e) => setTempStopSearch(e.target.value)}
                        className="w-full p-3 rounded-lg bg-black/30 border border-white/15 focus:ring-2 focus:ring-yellow-400 outline-none text-sm placeholder:text-gray-500 text-white transition-all"
                      />

                      {tempStopSearch && (
                        <div className="max-h-36 overflow-y-auto mt-2 bg-black/40 border border-white/10 rounded-lg p-2 scrollbar-thin scrollbar-thumb-white/10">
                          {stops
                            .filter((stop) =>
                              `${stop.name}${stop.town ? ', ' + stop.town : ''}`
                                .toLowerCase()
                                .includes(tempStopSearch.toLowerCase())
                            )
                            .map((stop) => (
                              <div
                                key={stop.stopId}
                                onClick={() => {
                                  setForm((f) => ({
                                    ...f,
                                    tempStopId: stop.stopId,
                                  }));
                                  setTempStopSearch('');
                                }}
                                className={`cursor-pointer px-2 py-1.5 rounded text-sm hover:bg-white/10 ${
                                  form.tempStopId === stop.stopId
                                    ? 'bg-yellow-600/40 border border-yellow-500/20'
                                    : ''
                                }`}
                              >
                                {stop.name}
                                {stop.town ? `, ${stop.town}` : ''}
                              </div>
                            ))}
                        </div>
                      )}

                      {form.tempStopId && (
                        <div className="mt-2 bg-yellow-600/10 border border-yellow-500/30 text-yellow-300 rounded-md px-3 py-1.5 text-sm flex justify-between items-center">
                          <span className="truncate">
                            {stops.find((s) => s.stopId === form.tempStopId)?.name}
                            {stops.find((s) => s.stopId === form.tempStopId)?.town
                              ? `, ${
                                  stops.find((s) => s.stopId === form.tempStopId).town
                                }`
                              : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setForm((f) => ({ ...f, tempStopId: '' }))
                            }
                            className="ml-2 text-yellow-400 hover:text-red-400 transition"
                            title="Clear temp stop"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {editing && form.closed ? (
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleDisruptionSave}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black w-1/2 py-2 rounded-lg font-semibold flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save Closure'}
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-green-500 hover:bg-green-600 text-black w-1/2 py-2 rounded-lg font-semibold flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Update Stop'}
                </button>
              </div>
            ) : (
              <button
                type="submit"
                disabled={saving}
                className="bg-green-500 hover:bg-green-600 text-black w-full py-2 rounded-lg font-semibold flex justify-center items-center gap-2 disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? 'Saving...' : editing ? 'Update Stop' : 'Add Stop'}
              </button>
            )}
          </form>
        </div>

        {/* RIGHT PANE: STOP LIST */}
        <div className="col-span-3 bg-[#283335] p-6 rounded-2xl border border-white/10 backdrop-blur-lg max-h-[666px] overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-xl font-semibold">All Stops</h2>

            <div className="flex flex-wrap items-center gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search stops..."
                className="p-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500 text-sm"
              />

              <select
                onChange={(e) => setSortType(e.target.value)}
                className="p-2 rounded bg-white/10 border border-white/20 text-sm focus:ring-2 focus:ring-green-500"
              >
                <option className="bg-[#283335]" value="az">
                  Name (A–Z)
                </option>
                <option className="bg-[#283335]" value="za">
                  Name (Z–A)
                </option>
                <option className="bg-[#283335]" value="routesAsc">
                  Fewest Routes
                </option>
                <option className="bg-[#283335]" value="routesDesc">
                  Most Routes
                </option>
                <option className="bg-[#283335]" value="closed">
                  Closed Stops
                </option>
                <option className="bg-[#283335]" value="active">
                  Active Stops
                </option>
              </select>

              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={showAlerts}
                  onChange={(e) => setShowAlerts(e.target.checked)}
                />
                Show Stops with Alerts
              </label>
            </div>
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
                {sortedStops.map((s) => (
                  <div
                    key={s._id}
                    className="bg-white/5 p-4 rounded-xl border border-white/10 hover:border-white/20 transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-green-400">{s.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{s.stopId}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300">{s.town}</p>
                    <p className="text-xs text-gray-400">{s.branding}</p>
                    {s.notes && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        📝 {s.notes}
                      </p>
                    )}

                    {s.closed && (
                      <p className="text-xs text-yellow-400 mt-1">
                        ⚠️ Stop Closed
                      </p>
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

      {/* DELETE CONFIRM MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#283335] border border-white/10 rounded-xl p-6 w-[90%] sm:w-[400px] shadow-xl">
            <h3 className="text-lg font-semibold text-red-400 mb-2">
              Confirm Deletion
            </h3>
            <p className="text-white/70 text-sm mb-4">
              Are you sure you want to permanently delete the stop{' '}
              <span className="font-semibold text-white">
                {confirmDelete.name || 'Unnamed Stop'}
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
