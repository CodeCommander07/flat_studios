'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Save, X } from 'lucide-react';

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
  });

  const [showForm, setShowForm] = useState(false);

  // 🧭 Load all
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

  // 🧾 Handle input
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ➕ Add or Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/ycc/operators/admin/${editing}` : '/api/ycc/operators/admin';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({
      email: '',
      robloxUsername: '',
      discordTag: '',
      operatorName: '',
      discordInvite: '',
      robloxGroup: '',
      description: '',
    });
    setEditing(null);
    setShowForm(false);
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
    setForm(item);
    setShowForm(true);
  };

  return (
    <div className="max-h-screen text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Operator Submissions</h1>
          <button
            onClick={() => {
              setShowForm(true);
              setEditing(null);
              setForm({
                email: '',
                robloxUsername: '',
                discordTag: '',
                operatorName: '',
                discordInvite: '',
                robloxGroup: '',
                description: '',
              });
            }}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex items-center gap-2"
          >
            <Plus size={18} /> Add New
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <p>Loading...</p>
        ) : submissions.length === 0 ? (
          <p className="text-gray-400">No submissions found.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-800 text-gray-300 uppercase text-xs">
                <tr>
                  <th className="p-3 text-left">Operator</th>
                  <th className="p-3 text-left">Discord</th>
                  <th className="p-3 text-left">Roblox</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Group</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s._id} className="border-b border-gray-800 hover:bg-gray-900">
                    <td className="p-3">{s.operatorName}</td>
                    <td className="p-3">{s.discordTag}</td>
                    <td className="p-3">{s.robloxUsername}</td>
                    <td className="p-3">{s.email}</td>
                    <td className="p-3">{s.robloxGroup}</td>
                    <td className="p-3 flex gap-3">
                      <button onClick={() => handleEdit(s)} className="text-blue-400 hover:text-blue-500">
                        <Edit3 size={18} />
                      </button>
                      <button onClick={() => handleDelete(s._id)} className="text-red-500 hover:text-red-600">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gray-900 p-6 rounded-xl w-full max-w-lg shadow-lg border border-gray-800">
              <div className="flex justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {editing ? 'Edit Submission' : 'Add Submission'}
                </h2>
                <button onClick={() => setShowForm(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {Object.keys(form).map((key) => (
                  <div key={key}>
                    <label className="block text-sm capitalize mb-1">{key}</label>
                    <input
                      type="text"
                      name={key}
                      value={form[key] || ''}
                      onChange={handleChange}
                      className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                ))}

                <button
                  type="submit"
                  className="mt-3 bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex items-center gap-2"
                >
                  <Save size={18} /> {editing ? 'Update' : 'Add'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
