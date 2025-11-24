'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Loader2 } from 'lucide-react';

export default function ApplicationHistory() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const user = localStorage.getItem('User');
        const parsedUser = JSON.parse(user);
        const res = await fetch(`/api/careers/user?email=${parsedUser.email}`);
        const data = await res.json();
        setApplications(data.applications || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="text-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-[#283335] backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-xl"
      >
        <h1 className="text-3xl font-bold mb-6">Your Application History</h1>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin w-8 h-8 text-gray-400" />
          </div>
        ) : applications.length === 0 ? (
          <p className="text-gray-400 text-center py-10">
            You haven’t submitted any applications yet.
          </p>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const status = app.status?.toLowerCase();
              const denyReason = app.denyReason || null;

              return (
                <motion.div
                  key={app._id}
                  whileHover={{ scale: 1.02 }}
                  className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="text-blue-400 w-5 h-5 flex-shrink-0" />
                    <div className="flex flex-col flex-1">
                      <p className="font-semibold">
                        {app.applicationId?.title || 'Untitled Application'}
                      </p>
                      <p className="text-sm text-gray-400">
                        Submitted: {new Date(app.createdAt).toLocaleDateString()}
                      </p>

                      {/* Deny Reason or Additional Info */}
                      {status === 'denied' && denyReason && (
                        <p className="mt-1 text-sm text-red-400">
                          <span className="font-semibold">Reason:</span> {denyReason}
                        </p>
                      )}
                      {status === 'accepted' && (
                        <p className="mt-1 text-sm text-green-400">
                          ✅ Congratulations! Your application was accepted.
                        </p>
                      )}
                      {status === 'talented' && (
                        <p className="mt-1 text-sm text-yellow-400">
                          ⚠️ You were added to the talent pool for future roles.
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-md text-sm font-semibold ${
                      status === 'accepted'
                        ? 'bg-green-600/40 text-green-300'
                        : status === 'denied'
                        ? 'bg-red-600/40 text-red-300'
                        : status === 'talented'
                        ? 'bg-yellow-600/40 text-yellow-300'
                        : 'bg-gray-600/40 text-gray-300'
                    }`}
                  >
                    {app.status?.toUpperCase() || 'PENDING'}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
