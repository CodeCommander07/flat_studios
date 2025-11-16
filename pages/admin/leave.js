'use client';

import { use, useEffect, useState } from 'react';
import axios from 'axios';
import { Check, XCircle, SortAsc, SortDesc } from 'lucide-react';
import Image from 'next/image';
import AuthWrapper from '@/components/AuthWrapper';

const StatusBadge = ({ status }) => {
  const colors = {
    Approved: 'bg-green-600',
    Pending: 'bg-yellow-500',
    Rejected: 'bg-red-600',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-bl-xl rounded-tr-xl hover:rounded-xl focus:rounded-xl transition-all duration-300 ease-in-out text-white ${colors[status] || 'bg-gray-500'}`}>
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
  const [approverNames, setApproverNames] = useState({});

  // Load usernames of approvers
  useEffect(() => {
    const loadApprovers = async () => {
      const approvedIds = leaves
        .filter(l => l.approvedBy)
        .map(l => String(l.approvedBy));

      const uniqueIds = Array.from(new Set(approvedIds));

      if (uniqueIds.length === 0) return;

      const map = {};

      for (const id of uniqueIds) {
        try {
          // Try correct route first
          let res = await fetch(`/api/users/${id}`);
          let data = await res.json();

          if (!data.success) {
            // Try the alternative route
            res = await fetch(`/api/user/${id}`);
            data = await res.json();
          }

          if (data.success) {
            map[id] = data.user.username;
          } else {
            console.warn("User lookup failed:", id, data);
            map[id] = "Unknown User";
          }
        } catch (err) {
          console.error("Approver fetch failed:", id, err);
          map[id] = "Unknown User";
        }
      }

      setApproverNames(map);
    };

    loadApprovers();
  }, [leaves]);

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
        const rawLeaves = res.data || [];

        // Fetch avatars for all unique users
        const avatarMap = {};
        for (const leave of rawLeaves) {
          const userId = leave.userId?._id;
          if (userId && !avatarMap[userId]) {
            try {
              const userRes = await axios.get(`/api/user/me?id=${userId}`);
              avatarMap[userId] = userRes.data.defaultAvatar || '/colour_logo.png';
            } catch {
              avatarMap[userId] = '/colour_logo.png';
            }
          }
        }

        // Attach avatar to each leave
        const enrichedLeaves = rawLeaves.map((leave) => ({
          ...leave,
          userAvatar: avatarMap[leave.userId?._id] || '/colour_logo.png',
        }));

        setLeaves(enrichedLeaves);
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
      setLeaves((prev) => prev.map((leave) => (leave._id === id ? res.data : leave)));
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
    <AuthWrapper requiredRole="admin">
      <div className="max-w-7xl mx-auto py-6 px-4 text-white">
        <h1 className="text-3xl font-bold mb-6 p-4 bg-[#283335] rounded-bl-xl rounded-tr-xl hover:rounded-xl focus:rounded-xl transition-all duration-300 ease-in-out">Admin Leave Dashboard</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar / Top Bar */}
          <div className="lg:w-60 flex-shrink-0">
            <div className="bg-[#283335] rounded-bl-xl rounded-tr-xl hover:rounded-xl focus:rounded-xl transition-all duration-300 ease-in-out p-4 sticky top-4 flex flex-row lg:flex-col gap-2 overflow-x-auto md:overflow-visible">
              {['All', 'Pending', 'Approved', 'Rejected', 'Active'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`whitespace-nowrap px-4 py-2 bg-[#283335] rounded-bl-xl rounded-tr-xl hover:rounded-xl focus:rounded-xl transition-all duration-300 ease-in-out text-sm ${filter === f ? 'bg-blue-600' : 'bg-white/10 hover:bg-white/20'
                    }`}
                >
                  {f}
                </button>
              ))}

              <button
                onClick={() => setSortAsc(!sortAsc)}
                className="mt-auto lg:mt-4 px-3 py-2 bg-[#283335] rounded-bl-xl rounded-tr-xl hover:rounded-xl focus:rounded-xl transition-all duration-300 ease-in-out bg-white/10 hover:bg-white/20 flex items-center gap-1 text-sm"
                title={sortAsc ? 'Sort Descending' : 'Sort Ascending'}
              >
                {sortAsc ? <SortAsc size={16} /> : <SortDesc size={16} />}
                Sort by Start
              </button>
            </div>
          </div>

          {/* Leave Requests Grid */}
          <div className="flex-1">
            {loading ? (
              <p>Loading...</p>
            ) : filteredLeaves.length === 0 ? (
              <p>No leave requests found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 ">
                {filteredLeaves.map((leave) => (
                  <div
                    key={leave._id}
                    className="bg-[#283335] rounded-bl-xl rounded-tr-xl hover:rounded-xl focus:rounded-xl transition-all duration-300 ease-in-out p-4 border border-white/10 space-y-2"
                  >
                    <div className="flex justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Image
                          src={leave.userAvatar || '/colour_logo.png'}
                          alt="User Avatar"
                          width={24}
                          height={24}
                          className="rounded-full"
                        />

                        {leave.userId?.username || leave.userId}
                      </h3>

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
                        Decided by: {approverNames[String(leave.approvedBy)] || "Unknown User"} on{" "}
                        {new Date(leave.decisionDate).toLocaleDateString("en-UK")}
                      </p>
                    )}

                    {leave.status === 'Pending' && (
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => updateStatus(leave._id, 'Approved')}
                          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-bl-xl rounded-tr-xl hover:rounded-xl focus:rounded-xl transition-all duration-300 ease-in-out text-sm font-semibold flex items-center gap-2"
                        >
                          <Check size={16} /> Approve
                        </button>
                        <button
                          onClick={() => updateStatus(leave._id, 'Rejected')}
                          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-bl-xl rounded-tr-xl hover:rounded-xl focus:rounded-xl transition-all duration-300 ease-in-out text-sm font-semibold flex items-center gap-2"
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
        </div>
      </div>
    </AuthWrapper>
  );
}
