'use client';
import { useState, useEffect } from 'react';
import { Plus, Save, Loader2, X } from 'lucide-react';
import AuthWrapper from '@/components/AuthWrapper';

export default function OperatorSubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [routes, setRoutes] = useState([]); // 🆕 All available routes
  const [form, setForm] = useState({
    robloxUsername: '',
    discordTag: '',
    discordInvite: '',
    robloxGroup: '',
    description: '',
    operatorName: '',
    logo: '',
    routes: [], // 🆕 Selected route IDs/names
    slug: '',
  });

  // 🧩 Load Operators
  async function loadOperators() {
    setLoading(true);
    const res = await fetch('/api/ycc/operators/admin');
    const data = await res.json();
    setSubmissions(data.submissions || []);
    setLoading(false);
  }

  // 🧩 Load Routes
  async function loadRoutes() {
    try {
      const res = await fetch('/api/ycc/routes');
      const data = await res.json();
      setRoutes(data.routes || []);
    } catch (err) {
      console.error('Failed to load routes:', err);
    }
  }

  useEffect(() => {
    loadOperators();
    loadRoutes();
  }, []);

  // 🧾 Handle field changes + auto slug
  const handleChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...form, [name]: value };
    if (name === 'operatorName') {
      updated.slug = value.toLowerCase().replace(/\s+/g, '-');
    }
    setForm(updated);
  };

  // 🧭 Handle multi-route selection
  const handleRouteSelect = (e) => {
    const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
    setForm((prev) => ({ ...prev, routes: selected }));
  };

  // 💾 Submit
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

  // 🗑️ Delete
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this operator?')) return;
    await fetch(`/api/ycc/operators/admin/${id}`, { method: 'DELETE' });
    await loadOperators();
  };

  // ✏️ Edit
  const handleEdit = (item) => {
    setEditing(item._id);
    setForm({
      robloxUsername: item.robloxUsername || '',
      discordTag: item.discordTag || '',
      discordInvite: item.discordInvite || '',
      robloxGroup: item.robloxGroup || '',
      description: item.description || '',
      operatorName: item.operatorName || '',
      logo: item.logo || '',
      routes: item.routes || [],
      slug: item.slug || '',
    });
  };

  // 🔄 Reset
  const resetForm = () => {
    setEditing(null);
    setForm({
      robloxUsername: '',
      discordTag: '',
      discordInvite: '',
      robloxGroup: '',
      description: '',
      operatorName: '',
      logo: '',
      routes: [],
      slug: '',
    });
  };

  return (
    <AuthWrapper requiredRole="admin">
      <main className="max-w-10xl mx-auto px-8 mt-5 text-white">
        <div className="grid md:grid-cols-5 gap-8">
          {/* LEFT — Operator Form */}
          <div className="col-span-2 bg-[#283335] backdrop-blur-lg p-6 rounded-2xl border border-white/10">
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
              {/* Operator Name */}
              <div>
                <label className="block text-sm mb-1">Operator Name</label>
                <input
                  type="text"
                  name="operatorName"
                  value={form.operatorName}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Roblox + Discord Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Roblox Username</label>
                  <input
                    type="text"
                    name="robloxUsername"
                    value={form.robloxUsername}
                    onChange={handleChange}
                    className="w-full p-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Discord</label>
                  <input
                    type="text"
                    name="discordTag"
                    value={form.discordTag}
                    onChange={handleChange}
                    placeholder=""
                    className="w-full p-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Discord Invite + Roblox Group Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Discord Invite</label>
                  <input
                    type="text"
                    name="discordInvite"
                    value={form.discordInvite}
                    onChange={handleChange}
                    placeholder=""
                    className="w-full p-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Roblox Group</label>
                  <input
                    type="text"
                    name="robloxGroup"
                    value={form.robloxGroup}
                    onChange={handleChange}
                    placeholder=""
                    className="w-full p-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Description + Routes Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows="4"
                    className="w-full p-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Routes Operated</label>
                  <select
                    multiple
                    name="routes"
                    value={form.routes}
                    onChange={handleRouteSelect}
                    className="w-full p-2 h-[120px] rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500"
                  >
                    {routes.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.number || r.id}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Hold <kbd>Ctrl</kbd> (or <kbd>Cmd</kbd> on Mac) to select multiple.
                  </p>
                </div>
              </div>

              {/* Logo URL */}
              <div>
                <label className="block text-sm mb-1">Logo URL</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    name="logo"
                    placeholder="https://yapton.vercel.app/api/cdn/view?fileId=..."
                    value={form.logo}
                    onChange={handleChange}
                    className="flex-1 p-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500 text-sm"
                  />
                  {form.logo ? (
                    <img
                      src={form.logo}
                      alt="Logo Preview"
                      className="w-40 h-20 rounded-lg object-cover border border-white/20"
                    />
                  ) : (
                    <div className="w-40 h-20 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-xs text-gray-400">
                      No Logo
                    </div>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-black w-full py-2 rounded-lg font-semibold flex justify-center items-center gap-2"
              >
                <Save size={18} />
                {editing ? 'Update Operator' : 'Add Operator'}
              </button>
            </form>
          </div>

          {/* RIGHT — Operator Cards */}
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
                          alt="Logo"
                          className="w-12 h-12 rounded-lg object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-white/10 flex items-center justify-center text-xs text-gray-400 rounded-lg">
                          No Logo
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">{s.operatorName}</p>
                        <p className="text-xs text-gray-400">
                          {s.robloxUsername || 'Unknown Roblox'} • {s.discordTag || 'No Discord'}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-3">
                      {s.description || 'No description'}
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
      `}</style>
    </AuthWrapper>
  );
}
