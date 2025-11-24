'use client';
import { useState, useEffect } from 'react';
import { Plus, Save, Loader2, X } from 'lucide-react';
import AuthWrapper from '@/components/AuthWrapper';
import ColorPickerPopup from '@/components/ColorPickerPopup';

export default function OperatorSubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  const [form, setForm] = useState({
    robloxUsername: '',
    discordTag: '',
    discordInvite: '',
    robloxGroup: '',
    description: '',
    operatorName: '',
    operatorColour: '',
    logo: '',
    routes: [],
    slug: '',
    routeSearch: ''
  });

  // Load operators
  async function loadOperators() {
    setLoading(true);
    const res = await fetch('/api/ycc/operators/admin');
    const data = await res.json();
    setSubmissions(data.submissions || []);
    setLoading(false);
  }

  // Load routes
  async function loadRoutes() {
    try {
      const res = await fetch('/api/ycc/routes');
      const data = await res.json();
      setRoutes(data.routes || []);
    } catch (err) {
      console.error('Failed to load routes:', err);
    }
  }

  // click-outside-colour-picker
  useEffect(() => {
    function handleClick(e) {
      if (!document.getElementById("opColourPopup")?.contains(e.target)) {
        if (!document.getElementById("opColourPreview")?.contains(e.target)) {
          setShowPicker(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    loadOperators();
    loadRoutes();
  }, []);

  // handle form input
  const handleChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...form, [name]: value };

    if (name === 'operatorName') {
      updated.slug = value.toLowerCase().replace(/\s+/g, '-');
    }
    setForm(updated);
  };

  // submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      slug: form.operatorName.toLowerCase().replace(/\s+/g, '-'),
    };

    const method = editing ? 'PUT' : 'POST';
    const url = editing
      ? `/api/ycc/operators/admin/${editing}`
      : '/api/ycc/operators/admin';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setEditing(null);
    await loadOperators();
  };

  // Delete operator
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this operator?')) return;
    await fetch(`/api/ycc/operators/admin/${id}`, { method: 'DELETE' });
    await loadOperators();
  };

  // start editing
  const handleEdit = (item) => {
    setEditing(item._id);
    setForm({
      robloxUsername: item.robloxUsername || '',
      discordTag: item.discordTag || '',
      discordInvite: item.discordInvite || '',
      robloxGroup: item.robloxGroup || '',
      description: item.description || '',
      operatorName: item.operatorName || '',
      operatorColour: item.operatorColour || '',
      logo: item.logo || '',
      routes: item.routes || [],
      slug: item.slug || '',
      routeSearch: ''
    });
  };

  // reset form
  const resetForm = () => {
    setEditing(null);
    setForm({
      robloxUsername: '',
      discordTag: '',
      discordInvite: '',
      robloxGroup: '',
      description: '',
      operatorName: '',
      operatorColour: '',
      logo: '',
      routes: [],
      slug: '',
      routeSearch: ''
    });
  };

  return (
    <AuthWrapper requiredRole="admin">
      <main className="max-w-10xl mx-auto px-8 mt-5 text-white">
        <div className="grid md:grid-cols-5 gap-8 max-h-[666px]">

          {/* LEFT: FORM */}
          <div className="col-span-2 bg-[#283335] max-h-[666px] overflow-y-auto scrollbar-none backdrop-blur-lg p-6 rounded-2xl border border-white/10">

            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold mb-6">Operator Management</h1>
              {editing && (
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-white transition"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Operator Name + Colour */}
              <div className="grid grid-cols-2 gap-4">

                {/* Operator Name */}
                <div className="flex flex-col h-full">
                  <label className="block text-sm mb-1">Operator Name</label>
                  <input
                    type="text"
                    name="operatorName"
                    value={form.operatorName}
                    onChange={handleChange}
                    className="form-field h-full bg-black/20 border border-white/15"
                  />
                </div>

                {/* Colour Picker */}
                <div className="relative">
                  <label className="block text-sm mb-1">Operator Colour</label>

                  <div className="flex items-center gap-3">
                    <div
                      id="opColourPreview"
                      onClick={() => setShowPicker(!showPicker)}
                      className="w-16 h-12 rounded-lg border border-white/10 shadow-inner cursor-pointer relative transition active:scale-[0.98]"
                      style={{ backgroundColor: form.operatorColour }}
                    >
                      <div className="absolute bottom-1 right-1 text-[10px] px-1 py-0.5 bg-black/40 rounded">
                        {form.operatorColour?.toUpperCase()}
                      </div>
                    </div>

                    <input
                      type="text"
                      name="operatorColour"
                      value={form.operatorColour}
                      onChange={handleChange}
                      className="form-field bg-black/20 border border-white/15"
                    />
                  </div>

                  {/* Popup */}
                  {showPicker && (
                    <ColorPickerPopup
                      id="opColourPopup"
                      value={form.operatorColour}
                      onChange={(hex) =>
                        handleChange({ target: { name: "operatorColour", value: hex } })
                      }
                      className="absolute left-0 mt-2"
                    />
                  )}
                </div>

              </div>

              {/* ROW — Roblox + Discord */}
              <div className="grid grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm mb-1">Roblox Username</label>
                  <input
                    type="text"
                    name="robloxUsername"
                    value={form.robloxUsername}
                    onChange={handleChange}
                    className="form-field bg-black/20 border border-white/15"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Discord</label>
                  <input
                    type="text"
                    name="discordTag"
                    value={form.discordTag}
                    onChange={handleChange}
                    className="form-field bg-black/20 border border-white/15"
                  />
                </div>

              </div>

              {/* Discord Invite + Group */}
              <div className="grid grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm mb-1">Discord Invite</label>
                  <input
                    type="text"
                    name="discordInvite"
                    value={form.discordInvite}
                    onChange={handleChange}
                    className="form-field bg-black/20 border border-white/15"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Roblox Group</label>
                  <input
                    type="text"
                    name="robloxGroup"
                    value={form.robloxGroup}
                    onChange={handleChange}
                    className="form-field bg-black/20 border border-white/15"
                  />
                </div>

              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className="form-field bg-black/20 border border-white/15 resize-none"
                    style={{ height: "17rem", maxHeight: "17rem" }}
                  />
                </div>

                {/* ROUTES SELECTOR */}
                <div>
                  <label className="block text-sm mb-1">Routes Operated</label>

                  {/* SEARCH */}
                  <input
                    type="text"
                    placeholder="Search routes..."
                    value={form.routeSearch}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, routeSearch: e.target.value }))
                    }
                    className="form-field bg-black/20 border border-white/15 mb-3"
                  />

                  {/* SCROLLER BOX */}
                  <div
                    className="overflow-y-auto bg-black/30 border border-white/10 rounded-lg p-2 scrollbar-thin scrollbar-thumb-white/10"
                    style={{ maxHeight: "10.5rem" }}
                  >
                    {routes
                      .filter((r) =>
                        (r.number || "").toLowerCase().includes(form.routeSearch.toLowerCase())
                      )
                      .map((r) => {
                        const id = r._id;
                        const selected = form.routes.includes(id);

                        return (
                          <div
                            key={id}
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                routes: selected
                                  ? f.routes.filter((x) => x !== id)
                                  : [...f.routes, id],
                              }))
                            }
                            className={`cursor-pointer px-3 py-1.5 rounded text-sm mb-1 transition-all ${selected
                                ? "bg-green-600/40 border border-green-500/20 text-white"
                                : "hover:bg-[#283335] text-gray-300"
                              }`}
                          >
                            {r.number}
                          </div>
                        );
                      })}

                    {routes.filter((r) =>
                      (r.number || "").toLowerCase().includes(form.routeSearch.toLowerCase())
                    ).length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-2">
                          No routes found
                        </p>
                      )}
                  </div>

                  {/* SUMMARY */}
                  <div className="mt-3 text-xs text-gray-300 bg-black/20 border border-white/10 rounded-lg p-2">
                    {form.routes.length > 0 ? (
                      <p>
                        Operator runs:{" "}
                        <span className="text-green-400 font-semibold">
                          {form.routes
                            .map((rid) => {
                              const r = routes.find((x) => x._id === rid);
                              return r ? r.number : "Unknown";
                            })
                            .join(", ")}
                        </span>
                      </p>
                    ) : (
                      <p className="text-gray-500 italic">No routes selected.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Logo */}
              <div>
                <label className="block text-sm mb-1">Logo URL</label>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    name="logo"
                    value={form.logo}
                    onChange={handleChange}
                    placeholder="https://yapton.flatstudios.net/api/cdn/view?fileId=..."
                    className="form-field bg-black/20 border border-white/15"
                  />

                  {form.logo ? (
                    <img
                      src={form.logo}
                      className="w-40 h-20 rounded-lg object-cover border border-white/20"
                    />
                  ) : (
                    <div className="w-40 h-20 rounded-lg bg-black/20 border border-white/20 flex items-center justify-center text-xs text-gray-400">
                      No Logo
                    </div>
                  )}
                </div>
              </div>

              {/* Save */}
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-black w-full py-2 rounded-lg font-semibold flex justify-center items-center gap-2"
              >
                <Save size={18} />
                {editing ? "Update Operator" : "Add Operator"}
              </button>

            </form>

          </div>

          {/* RIGHT: Operator Cards */}
          <div className="col-span-3 bg-[#283335] backdrop-blur-lg p-6 rounded-2xl border border-white/10">

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Operators</h2>

              <button
                onClick={() => {
                  resetForm();
                  setEditing(null);
                }}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus size={18} /> Add New
              </button>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="animate-spin w-4 h-4" /> Loading operators...
              </div>
            ) : submissions.length === 0 ? (
              <p className="text-gray-400 text-sm">No operators found.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {submissions.map((s) => (
                  <div
                    key={s._id}
                    className="bg-white/5 p-4 rounded-xl border border-white/10 hover:border-white/20 transition"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {s.logo ? (
                        <img
                          src={s.logo}
                          className="w-12 h-12 rounded-lg object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-[#283335] flex items-center justify-center text-xs text-gray-400 rounded-lg">
                          No Logo
                        </div>
                      )}

                      <div>
                        <p
                          className="font-semibold"
                          style={{ color: s.operatorColour || '#FFFFFF' }}
                        >
                          {s.operatorName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {s.robloxUsername || "Unknown Roblox"} • {s.discordTag || "No Discord"}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-400 line-clamp-3">
                      {s.description || "No description"}
                    </p>

                    <div className="text-xs text-gray-400 mt-1">
                      Routes: {s.routes?.length || 0}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleEdit(s)}
                        className="bg-yellow-500 hover:bg-yellow-400 text-black px-3 py-1 rounded text-sm font-medium flex-1"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(s._id)}
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
      </main>

      <style jsx>{`
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </AuthWrapper>
  );
}
