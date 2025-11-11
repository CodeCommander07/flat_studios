'use server';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function DisciplinaryDetail() {
  const { query, push } = useRouter();
  const [record, setRecord] = useState(null);
  const [staff, setStaff] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [form, setForm] = useState({});

  // 🧾 Load disciplinary record
  useEffect(() => {
    if (!query.id) return;

    async function fetchRecord() {
      const res = await fetch(`/api/disciplinaries/${query.id}`);
      const data = await res.json();
      if (data?.record) {
        setRecord(data.record);
        setForm(data.record);
        fetchStaff(data.record.staffId);
        fetchAdmin(data.record.issuedById);
      }
    }

    async function fetchStaff(staffId) {
      if (!staffId) return;
      try {
        const res = await fetch(`/api/user?id=${staffId}`);
        const data = await res.json();
        if (data?.user) setStaff(data.user);
      } catch (err) {
        console.error('❌ Failed to load staff details:', err);
      }
    }

    async function fetchAdmin(issuedById) {
      if (!issuedById) return;
      try {
        const res = await fetch(`/api/user?id=${issuedById}`);
        const data = await res.json();
        if (data?.user) setAdmin(data.user);
      } catch (err) {
        console.error('❌ Failed to load admin details:', err);
      }
    }

    fetchRecord();
  }, [query.id]);

  // 🔄 Update status
  async function updateStatus(status) {
    if (!record) return;
    setSaving(true);
    const res = await fetch(`/api/disciplinaries/${record._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setSaving(false);
    if (res.ok) {
      const { record: updated } = await res.json();
      setRecord(updated);
    }
  }

  // 💾 Save edits
  async function saveEdits() {
    setSaving(true);
    const res = await fetch(`/api/disciplinaries/${record._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason: form.reason,
        severity: form.severity,
        notes: form.notes,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const { record: updated } = await res.json();
      setRecord(updated);
      setEditing(false);
    } else {
      alert('Failed to update record.');
    }
  }

  // ❌ Delete record
  async function deleteRecord() {
    setSaving(true);
    const res = await fetch(`/api/disciplinaries/${record._id}`, {
      method: 'DELETE',
    });
    setSaving(false);
    if (res.ok) {
      push('/hub+/disciplinaries');
    } else {
      alert('Failed to delete record.');
    }
  }

  if (!record) {
    return (
      <div className="text-white flex items-center justify-center min-h-screen">
        Loading disciplinary record…
      </div>
    );
  }

  return (
    <div className="text-white">
      <div className="mx-auto max-w-3xl px-6 py-10 space-y-6">
        <button
          onClick={() => push('/hub+/disciplinaries')}
          className="text-sm text-gray-400 hover:text-gray-200"
        >
          ← Back to list
        </button>

        <div className="rounded-2xl bg-gray-900/60 border border-gray-800 p-6 shadow-sm relative">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">
                {staff?.username || record.staffId.username || 'Unknown Staff'}
              </h1>
              <p className="text-gray-400 text-sm">
                {staff?.email || record.staffId.email || 'No email available'}
              </p>
              {staff?.role && (
                <p className="text-gray-500 text-xs mt-1">Role: {staff.role}</p>
              )}
            </div>

            <span
              className={`text-xs px-2 py-1 rounded-full border self-start
                ${record.status === 'Active'
                  ? 'border-red-500 text-red-300'
                  : record.status === 'Appealed'
                    ? 'border-yellow-500 text-yellow-300'
                    : 'border-green-500 text-green-300'
                }`}
            >
              {record.status}
            </span>
          </div>

          {/* Editable Fields */}
          <div className="mt-4 grid gap-3 text-sm">
            <div>
              <span className="text-gray-400">Severity:</span>{' '}
              {editing ? (
                <select
                  value={form.severity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, severity: e.target.value }))
                  }
                  className="bg-gray-950 border border-gray-700 rounded-lg px-2 py-1 ml-2"
                >
                  <option className="text-white bg-black">Verbal Warning</option>
                  <option className="text-white bg-black">Warning</option>
                  <option className="text-white bg-black">Suspension</option>
                  <option className="text-white bg-black">Termination</option>
                </select>
              ) : (
                <strong>{record.severity}</strong>
              )}
            </div>

            <div>
              <span className="text-gray-400">Reason:</span>{' '}
              {editing ? (
                <input
                  value={form.reason}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reason: e.target.value }))
                  }
                  className="bg-gray-950 border border-gray-700 rounded-lg px-2 py-1 ml-2 w-full"
                />
              ) : (
                record.reason
              )}
            </div>

            <div>
              <span className="text-gray-400">Notes:</span>{' '}
              {editing ? (
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-2 py-1 mt-1"
                />
              ) : (
                record.notes || <span className="text-gray-500">—</span>
              )}
            </div>

            <div>
              <span className="text-gray-400">Issued By:</span>{' '}
              {record.issuedById?.username || 'Unknown'} ({record.issuedById?.email || 'No email'})
            </div>

            <div className="text-gray-400 text-xs mt-2">
              Created: {new Date(record.createdAt).toLocaleString()} • Updated:{' '}
              {new Date(record.updatedAt).toLocaleString()}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            {editing ? (
              <>
                <button
                  onClick={saveEdits}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 rounded-xl border border-gray-700 hover:bg-gray-800"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 rounded-xl border border-gray-700 hover:bg-gray-800"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => setShowConfirm(true)}
                  className="px-4 py-2 rounded-xl border border-red-700 text-red-400 hover:bg-red-900/20"
                >
                  ❌ Delete
                </button>
              </>
            )}
          </div>

          {/* Status Buttons */}
          {!editing && (
            <div className="mt-6 flex flex-wrap gap-3">
              {['Active', 'Appealed', 'Resolved'].map((st) => (
                <button
                  key={st}
                  onClick={() => updateStatus(st)}
                  disabled={saving || record.status === st}
                  className={`px-4 py-2 rounded-xl border transition-all duration-200 ${record.status === st
                    ? 'border-green-600 bg-green-900/30 text-green-200 cursor-default'
                    : 'border-gray-700 hover:bg-gray-800'
                    }`}
                >
                  {record.status === st ? '✓ ' : ''}
                  Mark {st}
                </button>
              ))}
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showConfirm && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-[90%] max-w-sm text-center shadow-lg shadow-black/40">
                <h2 className="text-xl font-semibold mb-2 text-red-400">
                  Confirm Deletion
                </h2>
                <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                  This disciplinary record will be permanently deleted.<br />
                  To confirm, please type <strong>"delete"</strong> below.
                </p>

                <input
                  type="text"
                  placeholder='Type "delete" here...'
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 mb-4 text-sm text-center outline-none focus:ring-2 focus:ring-red-600"
                />

                <div className="flex justify-center gap-3">
                  <button
                    disabled={confirmText.toLowerCase() !== 'delete' || saving}
                    onClick={deleteRecord}
                    className={`px-4 py-2 rounded-xl text-white transition-all ${confirmText.toLowerCase() === 'delete'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-red-900/40 cursor-not-allowed'
                      }`}
                  >
                    {saving ? 'Deleting…' : 'Confirm Delete'}
                  </button>

                  <button
                    onClick={() => {
                      setConfirmText('');
                      setShowConfirm(false);
                    }}
                    className="px-4 py-2 border border-gray-700 rounded-xl hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
