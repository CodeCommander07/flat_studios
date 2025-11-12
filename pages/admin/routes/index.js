'use client';
import { useEffect, useState } from 'react';
import { Save, Loader2, X, AlertTriangle } from 'lucide-react';

export default function AdminRoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [operators, setOperators] = useState([]);
  const [query, setQuery] = useState('');

  const [form, setForm] = useState({
    number: '',
    operator: '',
    origin: '',
    destination: '',
    description: '',
    stops: { forward: [], backward: [] },
    diversion: { active: false, reason: '', stops: [] },
  });

  // 🚌 Load operators
  async function loadOperators() {
    try {
      const res = await fetch('/api/ycc/operators/active');
      const data = await res.json();
      setOperators(data.submissions || data || []);
    } catch (err) {
      console.error('Failed to load operators:', err);
    }
  }

  // 🧩 Load routes
  async function loadRoutes() {
    setLoading(true);
    try {
      const res = await fetch(`/api/ycc/routes${query ? `?q=${encodeURIComponent(query)}` : ''}`);
      const data = await res.json();
      setRoutes(data.routes || []);
    } catch (err) {
      console.error('Failed to load routes:', err);
    } finally {
      setLoading(false);
    }
  }

  // 🚏 Load stops
  async function loadStops() {
    try {
      const res = await fetch('/api/ycc/stops');
      const data = await res.json();
      setStops(data.stops || []);
    } catch (err) {
      console.error('Failed to load stops:', err);
    }
  }

  useEffect(() => {
    loadRoutes();
    loadStops();
    loadOperators();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadRoutes(), 300);
    return () => clearTimeout(t);
  }, [query]);


  // ✨ Helpers
  const getStopName = (id) => {
    const s = stops.find((x) => x.stopId === id);
    return s ? `${s.name}${s.town ? ', ' + s.town : ''}` : id;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const toggleStop = (stopId, direction = 'forward') => {
    setForm((s) => {
      const safeStops = s.stops || { forward: [], backward: [] };
      const current = safeStops[direction] || [];
      const updated = current.includes(stopId)
        ? current.filter((x) => x !== stopId)
        : [...current, stopId];
      return { ...s, stops: { ...safeStops, [direction]: updated } };
    });
  };

  const toggleDiversionStop = (stopId) => {
    setForm((f) => {
      const d = f.diversion || { active: false, reason: '', stops: [] };
      const updatedStops = d.stops.includes(stopId)
        ? d.stops.filter((x) => x !== stopId)
        : [...d.stops, stopId];
      return { ...f, diversion: { ...d, stops: updatedStops } };
    });
  };

  // 💾 Submit new or edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      number: form.number.trim(),
      operator: Array.isArray(form.operator)
        ? form.operator
        : form.operator
          ? [form.operator]
          : [],
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
    resetForm();
    await loadRoutes();
  };

  // 🗑️ Delete route
  const handleDelete = async (id) => {
    if (!confirm('Delete this route?')) return;
    await fetch(`/api/ycc/routes/${id}`, { method: 'DELETE' });
    await loadRoutes();
  };

  // ✏️ Edit route
  const handleEdit = (r) => {
    setEditing(r._id);
    setForm({
      number: r.number || '',
      operator: r.operator || '',
      origin: r.origin || '',
      destination: r.destination || '',
      description: r.description || '',
      stops: {
        forward: r.stops?.forward || [],
        backward: r.stops?.backward || [],
      },
      diversion: r.diversion || { active: false, reason: '', stops: [] },
    });
  };


  // 🔁 Reset form
  const resetForm = () => {
    setEditing(null);
    setForm({
      number: '',
      operator: '',
      origin: '',
      destination: '',
      description: '',
      stops: { forward: [], backward: [] },
      diversion: { active: false, reason: '', stops: [] },
    });
  };

  // ⚠️ Save disruption info
  const handleDisruptionSave = async () => {
    if (!editing) return;
    setSaving(true);
    await fetch(`/api/ycc/routes/${editing}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diversion: { ...form.diversion } }),
    });
    setSaving(false);
    alert('Disruption saved successfully.');
    await loadRoutes();
  };

  return (
    <main className="max-w-10xl mx-auto px-8 mt-8 text-white">
      <div className="grid md:grid-cols-5 gap-8">
        <div className="col-span-2 bg-[#1f282a]/90 p-6 rounded-2xl border border-white/10 backdrop-blur-xl shadow-xl flex flex-col max-h-[666px]">
          <div className="flex justify-between items-center mb-5">
            <h1 className="text-2xl font-semibold tracking-tight">
              {editing ? 'Edit Route' : 'Add New Route'}
            </h1>
            {editing && (
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 flex-1 pr-2"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">
                    Route Number
                  </label>
                  <input
                    type="text"
                    required
                    name="number"
                    value={form.number}
                    onChange={handleChange}
                    placeholder="e.g. 42A"
                    className="w-full p-3 rounded-lg bg-black/30 border border-white/15 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm placeholder:text-gray-500 text-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">
                    Start Stop
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Search start stop..."
                    value={getStopName(form.origin)||form.originSearch || ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, originSearch: e.target.value }))
                    }
                    className="w-full p-3 rounded-lg bg-black/30 border border-white/15 focus:ring-2 focus:ring-green-500 outline-none text-sm placeholder:text-gray-500 text-white transition-all"
                  />
                  {form.originSearch && (
                    <div className="max-h-32 overflow-y-auto mt-2 bg-black/40 border border-white/10 rounded-lg p-2 scrollbar-thin scrollbar-thumb-white/10">
                      {stops
                        .filter((stop) =>
                          getStopName(stop.stopId)
                            .toLowerCase()
                            .includes((form.originSearch || '').toLowerCase())
                        )
                        .map((stop) => (
                          <div
                            key={stop.stopId}
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                origin: stop.stopId,
                                originSearch: '',
                              }))
                            }
                            className={`cursor-pointer px-2 py-1.5 rounded text-sm hover:bg-white/10 ${form.origin === stop.stopId
                                ? 'bg-green-600/40 border border-green-500/20'
                                : ''
                              }`}
                          >
                            {getStopName(stop.stopId)}
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">
                    End Stop
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Search end stop..."
                    value={getStopName(form.destination)||form.destinationSearch || ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, destinationSearch: e.target.value }))
                    }
                    className="w-full p-3 rounded-lg bg-black/30 border border-white/15 focus:ring-2 focus:ring-blue-500 outline-none text-sm placeholder:text-gray-500 text-white transition-all"
                  />
                  {form.destinationSearch && (
                    <div className="max-h-32 overflow-y-auto mt-2 bg-black/40 border border-white/10 rounded-lg p-2 scrollbar-thin scrollbar-thumb-white/10">
                      {stops
                        .filter((stop) =>
                          getStopName(stop.stopId)
                            .toLowerCase()
                            .includes((form.destinationSearch || '').toLowerCase())
                        )
                        .map((stop) => (
                          <div
                            key={stop.stopId}
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                destination: stop.stopId,
                                destinationSearch: '',
                              }))
                            }
                            className={`cursor-pointer px-2 py-1.5 rounded text-sm hover:bg-white/10 ${form.destination === stop.stopId
                                ? 'bg-blue-600/40 border border-blue-500/20'
                                : ''
                              }`}
                          >
                            {getStopName(stop.stopId)}
                          </div>
                        ))}
                    </div>
                  )}
                </div>

              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col">
  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
    Operators <span className="text-red-500">*</span>
  </label>

  <div className="flex-1 overflow-y-auto bg-black/20 border border-white/10 rounded-lg p-2 scrollbar-thin scrollbar-thumb-white/10 max-h-72">
    {operators.length > 0 ? (
      operators.map((op) => {
        const isSelected = form.operator.includes(op.operatorName);
        return (
          <div
            key={op._id || op.operatorName}
            onClick={() => {
              setForm((f) => {
                const current = f.operator || [];
                const updated = current.includes(op.operatorName)
                  ? current.filter((x) => x !== op.operatorName)
                  : [...current, op.operatorName];
                return { ...f, operator: updated };
              });
            }}
            className={`cursor-pointer px-3 py-1.5 rounded text-sm mb-1 transition-all ${
              isSelected
                ? 'bg-green-600/40 border border-green-500/20 text-white'
                : 'hover:bg-white/10 text-gray-300'
            }`}
          >
            {op.operatorName}
          </div>
        );
      })
    ) : (
      <p className="text-xs text-gray-400 text-center py-2">
        No operators found
      </p>
    )}
  </div>

  {form.operator?.length > 0 ? (
    <p className="text-xs text-gray-300 mt-2">
      Selected: {form.operator.join(', ')}
    </p>
  ) : (
    <p className="text-xs text-red-400 mt-2">Required — select at least one.</p>
  )}
</div>

            </div>


            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                required
                onChange={handleChange}
                rows="3"
                className="w-full p-3 rounded-lg bg-black/30 border border-white/15 focus:ring-2 focus:ring-green-500 resize-none text-sm outline-none placeholder:text-gray-500 text-white transition-all"
                placeholder="Describe the route..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col">
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                  Forward Stops
                </label>

                <input
                  type="text"
                  placeholder="Search stops..."
                  value={form.forwardSearch || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, forwardSearch: e.target.value }))
                  }
                  className="w-full mb-3 p-2.5 rounded-lg bg-black/20 border border-white/15 focus:ring-2 focus:ring-green-500 text-sm outline-none placeholder:text-gray-400 text-white"
                />

                <div
                  className="overflow-y-auto bg-black/30 border border-white/10 rounded-lg p-2 scrollbar-thin scrollbar-thumb-white/10"
                  style={{ maxHeight: '10.5rem' }}
                >
                  {stops
                    .filter((stop) =>
                      getStopName(stop.stopId)
                        .toLowerCase()
                        .includes((form.forwardSearch || '').toLowerCase())
                    )
                    .map((stop) => (
                      <div
                        key={stop.stopId}
                        onClick={() => toggleStop(stop.stopId, 'forward')}
                        className={`cursor-pointer px-3 py-1.5 rounded text-sm mb-1 transition-all ${form.stops.forward.includes(stop.stopId)
                          ? 'bg-green-600/40 border border-green-500/20 text-white'
                          : 'hover:bg-white/10 text-gray-300'
                          }`}
                      >
                        {getStopName(stop.stopId)}
                      </div>
                    ))}
                  {stops.filter((stop) =>
                    getStopName(stop.stopId)
                      .toLowerCase()
                      .includes((form.forwardSearch || '').toLowerCase())
                  ).length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-2">
                        No stops found
                      </p>
                    )}
                </div>

                <div className="mt-3 text-xs text-gray-300 bg-black/20 border border-white/10 rounded-lg p-2">
                  {form.origin ? (
                    <>
                      <span className="text-green-400 font-semibold">
                        {getStopName(form.origin)}
                      </span>{' '}
                      →
                      {form.stops.forward.length > 0 ? (
                        <>
                          {' '}
                          {form.stops.forward
                            .map((id) => getStopName(id))
                            .slice(0, 3)
                            .join(' → ')}
                          {form.stops.forward.length > 3 && ' → ...'}
                        </>
                      ) : (
                        ' (no intermediate stops)'
                      )}{' '}
                      →
                      {form.destination ? (
                        <>
                          {' '}
                          <span className="text-blue-400 font-semibold">
                            {getStopName(form.destination)}
                          </span>
                        </>
                      ) : (
                        ' (no end stop)'
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500 italic">No route summary yet.</p>
                  )}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col">
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                  Return Stops
                </label>

                <input
                  type="text"
                  placeholder="Search stops..."
                  value={form.backwardSearch || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, backwardSearch: e.target.value }))
                  }
                  className="w-full mb-3 p-2.5 rounded-lg bg-black/20 border border-white/15 focus:ring-2 focus:ring-blue-500 text-sm outline-none placeholder:text-gray-400 text-white"
                />

                <div
                  className="overflow-y-auto bg-black/30 border border-white/10 rounded-lg p-2 scrollbar-thin scrollbar-thumb-white/10"
                  style={{ maxHeight: '10.5rem' }}
                >
                  {stops
                    .filter((stop) =>
                      getStopName(stop.stopId)
                        .toLowerCase()
                        .includes((form.backwardSearch || '').toLowerCase())
                    )
                    .map((stop) => (
                      <div
                        key={stop.stopId}
                        onClick={() => toggleStop(stop.stopId, 'backward')}
                        className={`cursor-pointer px-3 py-1.5 rounded text-sm mb-1 transition-all ${form.stops.backward.includes(stop.stopId)
                          ? 'bg-blue-600/40 border border-blue-500/20 text-white'
                          : 'hover:bg-white/10 text-gray-300'
                          }`}
                      >
                        {getStopName(stop.stopId)}
                      </div>
                    ))}
                  {stops.filter((stop) =>
                    getStopName(stop.stopId)
                      .toLowerCase()
                      .includes((form.backwardSearch || '').toLowerCase())
                  ).length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-2">
                        No stops found
                      </p>
                    )}
                </div>

                <div className="mt-3 text-xs text-gray-300 bg-black/20 border border-white/10 rounded-lg p-2">
                  {form.destination ? (
                    <>
                      <span className="text-blue-400 font-semibold">
                        {getStopName(form.destination)}
                      </span>{' '}
                      →
                      {form.stops.backward.length > 0 ? (
                        <>
                          {' '}
                          {form.stops.backward
                            .map((id) => getStopName(id))
                            .slice(0, 3)
                            .join(' → ')}
                          {form.stops.backward.length > 3 && ' → ...'}
                        </>
                      ) : (
                        ' (no intermediate stops)'
                      )}{' '}
                      →
                      {form.origin ? (
                        <>
                          {' '}
                          <span className="text-green-400 font-semibold">
                            {getStopName(form.origin)}
                          </span>
                        </>
                      ) : (
                        ' (no start stop)'
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500 italic">No route summary yet.</p>
                  )}
                </div>
              </div>
            </div>

            {editing && (
              <div className="mt-6 border-t border-white/10 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="text-yellow-400" size={18} />
                  <h2 className="text-lg font-semibold">Manage Disruption</h2>
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.diversion.active}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        diversion: { ...f.diversion, active: e.target.checked },
                      }))
                    }
                  />
                  Active Diversion
                </label>

                {form.diversion.active && (
                  <div className="mt-3 space-y-4 bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                        Diversion Message
                      </label>
                      <textarea
                        placeholder="Describe the diversion or reason..."
                        value={form.diversion.reason}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            diversion: { ...f.diversion, reason: e.target.value },
                          }))
                        }
                        rows="3"
                        className="w-full p-3 rounded-lg bg-black/20 border border-white/15 focus:ring-2 focus:ring-yellow-400 text-sm outline-none placeholder:text-gray-400 text-white resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                        Affected Stops
                      </label>

                      <input
                        type="text"
                        placeholder="Search stops..."
                        value={form.diversionSearch || ''}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, diversionSearch: e.target.value }))
                        }
                        className="w-full mb-3 p-2.5 rounded-lg bg-black/20 border border-white/15 focus:ring-2 focus:ring-yellow-400 text-sm outline-none placeholder:text-gray-400 text-white"
                      />

                      <div
                        className="overflow-y-auto bg-black/30 border border-white/10 rounded-lg p-2 scrollbar-thin scrollbar-thumb-white/10"
                        style={{ maxHeight: '10.5rem' }}
                      >
                        {stops
                          .filter((stop) =>
                            getStopName(stop.stopId)
                              .toLowerCase()
                              .includes((form.diversionSearch || '').toLowerCase())
                          )
                          .map((stop) => (
                            <div
                              key={stop.stopId}
                              onClick={() => toggleDiversionStop(stop.stopId)}
                              className={`cursor-pointer px-3 py-1.5 rounded text-sm mb-1 transition-all ${form.diversion.stops.includes(stop.stopId)
                                ? 'bg-yellow-600/40 border border-yellow-400/20 text-white'
                                : 'hover:bg-white/10 text-gray-300'
                                }`}
                            >
                              {getStopName(stop.stopId)}
                            </div>
                          ))}
                        {stops.filter((stop) =>
                          getStopName(stop.stopId)
                            .toLowerCase()
                            .includes((form.diversionSearch || '').toLowerCase())
                        ).length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-2">
                              No stops found
                            </p>
                          )}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleDisruptionSave}
                      className="bg-yellow-500 hover:bg-yellow-400 text-black w-full py-2.5 rounded-lg font-semibold flex justify-center items-center gap-2 transition disabled:opacity-50"
                    >
                      <Save size={18} />
                      {saving ? 'Saving...' : 'Save Disruption'}
                    </button>
                  </div>
                )}

              </div>
            )}

            <button
              type="submit"
              disabled={saving || !form.operator || !form.number || !form.origin || !form.destination || !form.description}
              className="mt-3 bg-green-500 hover:bg-green-400 text-black w-full py-2.5 rounded-xl font-semibold flex justify-center items-center gap-2 shadow-md transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={18} /> {editing ? 'Update Route' : 'Add Route'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT — Route List */}
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

          <div className="overflow-y-auto max-h-[550px] pr-2 scrollbar-thin scrollbar-thumb-white/10">
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
                    <p className="text-xs text-gray-500 mt-1">
                      {r.stops?.forward?.length || 0} → {r.stops?.backward?.length || 0} stops
                    </p>
                    {r.diversion?.active && (
                      <p className="text-xs text-yellow-400 mt-2">⚠️ Diversion Active</p>
                    )}
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
