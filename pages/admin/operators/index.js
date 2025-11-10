'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Save, X, Loader2, Image as ImageIcon } from 'lucide-react';
import AuthWrapper from '@/components/AuthWrapper';

export default function OperatorSubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    email: '',
    robloxUsername: '',
    discordTag: '',
    operatorName: '',
    discordInvite: '',
    robloxGroup: '',
    description: '',
    logo: null, // File
    logoPreview: '', // Preview URL
  });
  const [showForm, setShowForm] = useState(false);

  // 🧭 Load all submissions
  async function load() {
    setLoading(true);
    const res = await fetch('/api/ycc/operators/admin');
    const data = await res.json();
    setSubmissions(data.submissions || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // 🧾 Handle text input
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // 🖼️ Handle file upload + live preview
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({
        ...form,
        logo: file,
        logoPreview: URL.createObjectURL(file),
      });
    }
  };

  // ➕ Add or Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editing ? 'PUT' : 'POST';
    const url = editing
      ? `/api/ycc/operators/admin/${editing}`
      : '/api/ycc/operators/admin';

    const data = new FormData();
    for (const [key, value] of Object.entries(form)) {
      if (key === 'logoPreview') continue;
      if (value) data.append(key, value);
    }

    await fetch(url, { method, body: data });
    setShowForm(false);
    setEditing(null);
    await load();
  };

  // 🗑️ Delete
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;
    await fetch(`/api/ycc/operators/admin/${id}`, { method: 'DELETE' });
    await load();
  };

  // ✏️ Edit
  const handleEdit = (item) => {
    setEditing(item._id);
    setForm({
      ...item,
      logo: null,
      logoPreview: item.logo || '',
    });
    setShowForm(true);
  };

  // 🔄 Reset form
  const resetForm = () => {
    setEditing(null);
    setForm({
      email: '',
      robloxUsername: '',
      discordTag: '',
      operatorName: '',
      discordInvite: '',
      robloxGroup: '',
      description: '',
      logo: null,
      logoPreview: '',
    });
  };

  return (
    <AuthWrapper requiredRole="admin">
      <main className="max-w-10xl mx-auto mt-10 px-8 text-white grid md:grid-cols-2 gap-8">
        {/* LEFT: Form Panel */}
        <div className="glass bg-[#283335] p-6 rounded-2xl space-y-6 flex flex-col h-[70vh] overflow-hidden">
          <div className="overflow-y-auto pr-2">
            <h1 className="text-3xl font-bold mb-4">
              {editing ? 'Edit Operator' : 'Add Operator'}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-3">
              {Object.keys(form).map(
                (key) =>
                  !['logo', 'logoPreview'].includes(key) && (
                    <div key={key}>
                      <label className="block text-sm capitalize mb-1">{key}</label>
                      <input
                        type="text"
                        name={key}
                        value={form[key] || ''}
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  )
              )}

              {/* 🖼️ Logo Upload + Preview */}
              <div>
                <label className="block text-sm mb-1">Logo</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="w-full text-sm bg-white/10 border border-white/20 p-2 rounded"
                  />
                </div>

                {form.logoPreview ? (
                  <div className="mt-3">
                    <p className="text-xs text-gray-400 mb-1">Preview:</p>
                    <img
                      src={form.logoPreview}
                      alt="Logo preview"
                      className="w-24 h-24 object-cover rounded-lg border border-white/10"
                    />
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> No image selected
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded flex items-center gap-2"
                >
                  <Save size={18} /> {editing ? 'Update Operator' : 'Add Operator'}
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* Divider Line */}
              <div className="flex items-center mt-6">
                <div className="flex-grow border-t border-white/20"></div>
                <span className="px-3 text-gray-300 text-sm">Operators</span>
                <div className="flex-grow border-t border-white/20"></div>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT: Operator List */}
        <div className="glass bg-[#283335] p-6 rounded-2xl flex flex-col h-[70vh]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Existing Submissions</h2>
            <button
              onClick={() => {
                setShowForm(true);
                resetForm();
              }}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex items-center gap-2"
            >
              <Plus size={18} /> Add New
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {loading ? (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="animate-spin w-4 h-4" />
                Loading operators...
              </div>
            ) : submissions.length === 0 ? (
              <p className="text-gray-400 text-sm">No operator submissions yet.</p>
            ) : (
              <div className="divide-y divide-white/10">
                {submissions.map((s) => (
                  <div
                    key={s._id}
                    className="flex justify-between items-center py-3 px-2 hover:bg-white/10 rounded transition"
                  >
                    <div className="flex items-center gap-3">
                      {s.logo ? (
                        <img
                          src={s.logo}
                          alt="Logo"
                          className="w-10 h-10 rounded object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-white/5 border border-white/10 rounded flex items-center justify-center text-xs text-gray-400">
                          No Logo
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">{s.operatorName}</p>
                        <p className="text-xs text-gray-400">
                          {s.discordTag || 'Unknown'} •{' '}
                          {s.robloxUsername || 'No Roblox'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(s)}
                        className="bg-yellow-500 text-black px-3 py-1 rounded text-sm hover:bg-yellow-400"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s._id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-500"
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

        {/* Glass & Scrollbar Styling */}
        <style jsx>{`
          .glass {
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          ::-webkit-scrollbar {
            width: 6px;
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.4);
          }
        `}</style>
      </main>
    </AuthWrapper>
  );
}
