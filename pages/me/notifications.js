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

        const res = await axios.get(
          `/api/user/notifications?userId=${localUser._id}`
        );

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
      {/* HEADER */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Bell className="w-7 h-7 text-blue-400" />
          Notifications
        </h1>
        <p className="text-white/50 text-sm mt-1">
          Stay up to date with your tasks, alerts & system updates
        </p>

        <div className="h-[3px] w-24 mx-auto bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 rounded-full mt-3"></div>
      </div>

      {/* NOTIFICATION LIST */}
      {notifications.length === 0 ? (
        <p className="text-gray-400 text-center">
          No notifications yet.
        </p>
      ) : (
        <div className="space-y-4 max-h-[666px] overflow-y-scroll no-scrollbar">
          {notifications.map((n, i) => (
            <motion.div
              key={n._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
              className={`
                relative p-5 rounded-xl shadow-lg border backdrop-blur-lg transition-all 
                ${n.read
                  ? 'border-white/10 bg-[#283335] hover:bg-[#283335]/[0.8]'
                  : 'border-blue-500/40 bg-[#283335]/20 hover:bg-[#283335]/40'}
              `}
            >
              {/* Unread badge */}
              {!n.read && (
                <span className="absolute top-3 right-3 w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-[0_0_10px_2px_rgba(96,165,250,0.6)]"></span>
              )}

              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-lg text-white/90 mb-1">
                    {n.title}
                  </p>
                  <p className="text-sm text-white/70 leading-relaxed">
                    {n.notification}
                  </p>

                  {n.link && (
                    <Link
                      href={n.link}
                      className="inline-block mt-3 text-sm text-blue-300 hover:text-blue-400 transition underline underline-offset-2"
                    >
                      View more →
                    </Link>
                  )}
                </div>

                {/* MARK AS READ BUTTON */}
                <button
                  onClick={async () => {
                    try {
                      const localUser = JSON.parse(localStorage.getItem('User'));
                      await axios.patch(
                        `/api/user/notifications/?userId=${localUser._id}`,
                        { notifId: n._id }
                      );
                      setNotifications(prev =>
                        prev.map(item =>
                          item._id === n._id ? { ...item, read: true } : item
                        )
                      );
                    } catch (err) {
                      console.error('Failed to mark read:', err.message);
                    }
                  }}
                  disabled={n.read}
                  title={n.read ? 'Already read' : 'Mark as read'}
                  className={`
                    relative p-2 rounded-full transition
                    ${n.read
                      ? 'bg-green-700/30 text-green-400 cursor-default'
                      : 'bg-blue-600/40 hover:bg-blue-600/60 text-yellow-300'}
                  `}
                >
                  {n.read ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 relative z-10" />
                      <span className="absolute inset-0 rounded-full bg-blue-400 opacity-40 animate-ping"></span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>
    </div>
  );
}
