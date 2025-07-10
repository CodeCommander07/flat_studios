'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Check, XCircle, Clock, SortAsc, SortDesc } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const colors = {
    Approved: 'bg-green-600',
    Pending: 'bg-yellow-500',
    Rejected: 'bg-red-600',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded text-white ${colors[status] || 'bg-gray-500'}`}>
      {status}
    </span>
  );
};

export default function AdminLeaveDashboard() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [sortAsc, setSortAsc] = useState(true);
  const [adminUserId, setAdminUserId] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('User'));
    if (userData && userData._id) {
      setAdminUserId(userData._id);
    }
  }, []);

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const res = await axios.get('/api/leave/all');
        setLeaves(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await axios.post('/api/leave/update', { id, status, adminId: adminUserId });
      setLeaves((prev) =>
        prev.map((leave) =>
          leave._id === id ? res.data : leave
        )
      );
    } catch {
      alert('Failed to update status');
    }
  };

  const today = new Date();
  const isActive = (leave) => {
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    return start <= today && today <= end && leave.status === 'Approved';
  };

  const filteredLeaves = leaves
    .filter((l) => {
      if (filter === 'All') return true;
      if (filter === 'Active') return isActive(l);
      return l.status === filter;
    })
    .sort((a, b) => {
      const da = new Date(a.startDate);
      const db = new Date(b.startDate);
      return sortAsc ? da - db : db - da;
    });

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 text-white">
      <h1 className="text-3xl font-bold mb-6">Admin Leave Dashboard</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        {['All', 'Pending', 'Approved', 'Rejected', 'Active'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded ${
              filter === f ? 'bg-blue-600' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {f}
          </button>
        ))}

        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="ml-auto px-3 py-2 rounded bg-white/10 hover:bg-white/20 flex items-center gap-1"
          title={sortAsc ? 'Sort Descending' : 'Sort Ascending'}
        >
          {sortAsc ? <SortAsc size={18} /> : <SortDesc size={18} />}
          Sort by Start Date
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : filteredLeaves.length === 0 ? (
        <p>No leave requests found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredLeaves.map((leave) => (
            <div
              key={leave._id}
              className="bg-white/10 p-4 rounded-xl border border-white/10 space-y-2"
            >
              <div className="flex justify-between">
                <h3 className="text-lg font-semibold">{leave.userId?.username || leave.userId}</h3>
                <StatusBadge status={leave.status} />
              </div>
              <p className="text-sm text-white/70">
                <strong>Reason:</strong> {leave.reason}
              </p>
              <p className="text-sm text-white/70">
                {leave.startDate} → {leave.endDate}
              </p>
              {leave.approvedBy && (
                <p className="text-xs text-white/50 italic">
                  Decided by: {leave.approvedBy} on {new Date(leave.decisionDate).toLocaleDateString()}
                </p>
              )}

              {leave.status === 'Pending' && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => updateStatus(leave._id, 'Approved')}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm font-semibold flex items-center gap-2"
                  >
                    <Check size={16} /> Approve
                  </button>
                  <button
                    onClick={() => updateStatus(leave._id, 'Rejected')}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-semibold flex items-center gap-2"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
