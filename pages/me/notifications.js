'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const localUser = JSON.parse(localStorage.getItem('User'));
        if (!localUser?._id) return;
        const res = await axios.get(`/api/user/notifications?userId=${localUser._id}`);
        setNotifications(res.data || []);
      } catch (err) {
        console.error('Failed to load notifications:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-[70vh] text-white/60">
        Loading notifications...
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-6 text-white">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Bell className="w-6 h-6" /> Notifications
      </h1>

      {notifications.length === 0 ? (
        <p className="text-gray-400">No notifications yet.</p>
      ) : (
        <div className="space-y-3 max-h-36">
          {notifications.map((n, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-4 rounded-lg border transition ${n.read ? 'border-gray-600 bg-[#2f3a3c]' : 'border-blue-500/40 bg-[#2b3b3d] hover:bg-[#32494c]'
                }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{n.title}</p>
                  <p className="text-sm text-gray-300">{n.notification}</p>
                </div>

                <button
                  onClick={async () => {
                    try {
                      const localUser = JSON.parse(localStorage.getItem('User'));
                      await axios.patch(`/api/user/notifications/?userId=${localUser._id}`, { notifId: n._id });
                      setNotifications(prev =>
                        prev.map(item =>
                          item._id === n._id ? { ...item, read: true } : item
                        )
                      );
                    } catch (err) {
                      console.error('Failed to mark read:', err.message);
                    }
                  }}
                  className={`relative p-1 rounded-full transition ${n.read
                      ? 'bg-green-700/40 text-green-400 cursor-default'
                      : 'bg-blue-600/30 hover:bg-blue-600/50 text-yellow-400'
                    }`}
                  disabled={n.read}
                  title={n.read ? 'Already read' : 'Mark as read'}
                >
                  {n.read ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 relative z-10" />
                      <span className="absolute inset-0 rounded-full bg-blue-400 opacity-75 animate-ping"></span>
                    </>
                  )}
                </button>
              </div>

              {n.link && (
                <Link
                  href={n.link}
                  className="text-sm text-blue-400 hover:underline mt-2 block"
                >
                  View more →
                </Link>
              )}
            </motion.div>
          ))}

        </div>
      )}
    </div>
  );
}
