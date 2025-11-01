'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

export default function DisciplinaryList() {
  const [data, setData] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState('')
  const [admin, setAdmin] = useState('')

  useEffect(() => {
    const url = `/api/disciplinaries${status ? `?status=${encodeURIComponent(status)}` : ''}`;
    fetch(url).then(r => r.json()).then(({ records }) => setData(records || [])).finally(() => setLoading(false));
  }, [status]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data;
    return data.filter(d =>
      d.staffName?.toLowerCase().includes(s) ||
      d.reason?.toLowerCase().includes(s) ||
      d.severity?.toLowerCase().includes(s)
    );
  }, [q, data]);

  return (
    <div className="text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Disciplinary Records</h1>
          <p className="text-gray-400 mt-1">Search, filter, and drill into details.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-6">
          <div className="flex gap-3 w-full md:w-auto">
            <input
              className="flex-1 md:w-80 bg-gray-900/70 border border-gray-800 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by name, reason, or severity…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
            <select
              className="bg-gray-900/70 border border-gray-800 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              <option>Active</option>
              <option>Appealed</option>
              <option>Resolved</option>
            </select>
          </div>

          <Link
            href="/hub+/infract"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 font-medium hover:bg-blue-700 shadow-lg shadow-blue-600/20"
          >
            + New Infraction
          </Link>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-gray-900/60 border border-gray-800 p-6">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-gray-900/60 border border-gray-800 p-6 text-gray-400">
            No records found.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map(d => (
              <Link
                key={d._id}
                href={`/hub+/disciplinaries/${d._id}`}
                className="rounded-2xl bg-gray-900/60 border border-gray-800 p-5 hover:bg-gray-900 transition shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">{d.staffName}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full border
                    ${d.status === 'Active' ? 'border-red-500 text-red-300' :
                      d.status === 'Appealed' ? 'border-yellow-500 text-yellow-300' :
                      'border-green-500 text-green-300'}`}>
                    {d.status}
                  </span>
                </div>
                <p className="text-gray-300 mt-2">{d.reason}</p>
                <div className="mt-3 text-sm text-gray-400 flex items-center gap-3">
                  <span>Severity: <strong className="text-gray-200">{d.severity}</strong></span>
                  <span>•</span>
                  <span>Issued by: {d.issuedBy}</span>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  {new Date(d.createdAt).toLocaleString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
