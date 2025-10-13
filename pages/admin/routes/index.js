'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import AuthWrapper from '@/components/AuthWrapper';
import { FileText, Eye, X, Check, XCircle } from 'lucide-react';

const NEW_ROUTE_QUESTIONS = [
  'Route Number',
  'Allocated/Recommended Vehicle',
  'Starting Location',
  'Via',
  'Finishing Location',
  'Upload Map',
];

const CHANGE_ROUTE_QUESTIONS = [
  'Route Number',
  'New Start Location',
  'New Via',
  'New Finish',
  'Details of Change',
  'New Map',
];

export default function RequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [error, setError] = useState(null);
  const [stops, setStops] = useState([]);
  const [routes, setRoutes] = useState([]);

  const fetchStops = async () => {
    try {
      const res = await axios.get('/api/ycc/stops'); // create API to get all stops
      setStops(res.data.stops || []);
    } catch (err) {
      console.error('Failed to fetch stops', err);
    }
  };

  const fetchRoutes = async () => {
    try {
      const res = await axios.get('/api/ycc/routes'); // create API to get all stops
      setRoutes(res.data.routes || []);
    } catch (err) {
      console.error('Failed to fetch stops', err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await axios.get('/api/ycc/requests');
      setRequests(res.data.requests || []);
    } catch (err) {
      setError('Failed to fetch requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedRequest) return;

    const confirmed = confirm(`Are you sure you want to mark this as "${newStatus}"?`);
    if (!confirmed) return;

    try {
      await axios.post('/api/ycc/update-status', {
        id: selectedRequest._id,
        status: newStatus,
      });

      alert(`Request marked as ${newStatus}.`);
      closeDetailModal();
      fetchRequests();
    } catch (err) {
      alert('Failed to update request status.');
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchStops();
    fetchRoutes();
  }, []);;

  const openDetailModal = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedRequest(null);
    setShowDetailModal(false);
  };

  // Determine which question labels to use based on routeSubmissionType
  const getPage3QuestionLabels = (type) => {
    if (type === 'new') return NEW_ROUTE_QUESTIONS;
    if (type === 'change') return CHANGE_ROUTE_QUESTIONS;
    return [];
  };

  const getStopName = (stopId) => {
    const stop = stops.find((s) => s.stopId === stopId);
    return stop ? `${stop.name}${stop.town ? ', ' + stop.town : ''}` : stopId;
  };

  const getRouteNumber = (routeId) => {
    const route = routes.find((r) => r.routeId === routeId);
    console.log(routes)
    return route ? route.number : routeId;
  };
  // Resolve start, via, finish (like backend)
  const resolveStops = (start, via, end) => {
    const viaStops = Array.isArray(via) ? via : via ? [via] : [];
    return [start, ...viaStops, end].filter(Boolean).map(getStopName);
  };


  return (
    <AuthWrapper requiredRole="admin">
      <main className="text-white px-6 py-12 flex flex-col items-center">
        <div className="max-w-7xl w-full space-y-10">
          <div className="bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="text-blue-300" />
              <h1 className="text-2xl font-bold">Operator Requests</h1>
            </div>

            {loading ? (
              <p className="text-white/60">Loading requests...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : requests.length === 0 ? (
              <p>No requests found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto text-sm text-white/90 border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-white/60 border-b border-white/10">
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Discord Tag</th>
                      <th className="text-left p-2">Company</th>
                      <th className="text-left p-2">Submission Type</th>
                      <th className="text-left p-2">Route</th>
                      <th className="text-left p-2">Submitted At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr
                        key={req._id}
                        onClick={() => openDetailModal(req)}
                        className="border-b border-white/10 hover:bg-white/5 cursor-pointer"
                      >
                        <td
                          className={`p-2 ${req.status === 'pending'
                              ? 'text-yellow-400'
                              : req.status === 'denied'
                                ? 'text-red-500'
                                : req.status === 'accepted'
                                  ? 'text-green-500'
                                  : 'text-white'
                            }`}
                        >
                          {req.status.toUpperCase()}
                        </td>
                        <td className="p-2">{req.discordTag}</td>
                        <td className={`p-2 ${req.selectedCompany === 'South West Buses'
                              ? 'text-blue-400'
                              : req.selectedCompany === 'IRVING Coaches'
                                ? 'text-red-700'
                                : req.selectedCompany === 'Slowcoach'
                                  ? 'text-teal-500'
                                  : 'text-yellow-300'
                            }`}>{req.selectedCompany}</td>
                        <td className={`p-2 ${req.routeSubmissionType === 'change'
                              ? 'text-orange-400'
                              : 'text-yellow-200'
                            }`}>{req.routeSubmissionType}</td>
                        <td className="p-2">{getRouteNumber(req.P3Q1)}</td>
                        <td className="p-2">{new Date(req.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white/10 border border-white/20 p-6 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto text-white relative">
              <button
                onClick={closeDetailModal}
                className="absolute top-4 right-4 text-white hover:text-red-400"
              >
                <X size={24} />
              </button>
              <h2 className="text-2xl font-bold mb-4">Request Details</h2>

              <div className="space-y-3">
                <p><strong>Email:</strong> {selectedRequest.email}</p>
                <p><strong>Discord Tag:</strong> {selectedRequest.discordTag}</p>
                <p><strong>Company:</strong> {selectedRequest.selectedCompany}</p>
                <p><strong>Submission Type:</strong> {selectedRequest.routeSubmissionType}</p>

                <p><strong>Details:</strong></p>
                <ul className="list-disc list-inside ml-4">
                  {getPage3QuestionLabels(selectedRequest.routeSubmissionType).map((label, i) => {
                    let answer = selectedRequest[`P3Q${i + 1}`];

                    // Convert route number if needed
                    if (label.toLowerCase().includes('route number')) {
                      answer = selectedRequest.number || getRouteNumber(answer) || '-';
                    }

                    // Convert stop IDs to names
                    if (
                      ['start location', 'via', 'finish', 'new start location', 'new via', 'new finish'].some((k) =>
                        label.toLowerCase().includes(k)
                      )
                    ) {
                      if (label.toLowerCase().includes('via')) {
                        // Split comma-separated IDs into an array, then map to names
                        let viaStops = [];
                        if (Array.isArray(answer)) {
                          viaStops = answer;
                        } else if (typeof answer === 'string') {
                          viaStops = answer.split(',').map((s) => s.trim()).filter(Boolean);
                        }
                        answer = viaStops.map(getStopName).join(', ');
                      } else {
                        answer = getStopName(answer);
                      }
                    }

                    return (
                      <li key={i}>
                        <strong>{label}:</strong> {answer || '-'}
                      </li>
                    );
                  })}
                </ul>


                {selectedRequest.mapFile ? (
                  <p>
                    <strong>Map File:</strong>{' '}
                    <a
                      href={`/api/ycc/routes/file?id=${selectedRequest._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-blue-400"
                    >
                      View Map
                    </a>
                  </p>
                ) : (
                  <p><strong>Map File:</strong> None</p>
                )}

                <p><strong>Submitted At:</strong> {new Date(selectedRequest.createdAt).toLocaleString()}</p>
                <p><strong>Status:</strong> {selectedRequest.status || 'pending'}</p>

                {/* Accept / Deny buttons */}
                <div className="mt-4 flex gap-4">
                  <button
                    onClick={() => handleStatusUpdate('accepted')}
                    className="bg-green-600 hover:bg-green-800 px-4 py-2 rounded text-white flex items-center gap-2 disabled:opacity-50"
                    disabled={selectedRequest.status === 'accepted'}
                  >
                    <Check size={16} /> Accept
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('denied')}
                    className="bg-red-600 hover:bg-red-800 px-4 py-2 rounded text-white flex items-center gap-2 disabled:opacity-50"
                    disabled={selectedRequest.status === 'denied'}
                  >
                    <XCircle size={16} /> Deny
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </AuthWrapper>
  );
}
