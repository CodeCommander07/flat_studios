'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Menu, X, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LogoutButton from './LogoutButton';
import { hasAccessTo } from '@/utils/permissions';
import CountUp from '@/components/CountUp';

const dropdownVariants = {
  hidden: { opacity: 0, y: -6, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.98 },
};

const mobileMenuVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: 'auto', transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.2, ease: 'easeIn' } },
};

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('User');
  const [players, setPlayers] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const localUser = JSON.parse(localStorage.getItem('User'));
        if (!localUser?._id) return;
        const res = await axios.get(`/api/user/me?id=${localUser._id}`);
        setUser(res.data);
        setRole(localUser.role || 'User');
      } catch (err) {
        console.error('Failed to fetch user:', err.message);
      }
    };

    const fetchPlayers = async () => {
      try {
        const res = await axios.get('/api/roblox/playerCount');
        setPlayers(res.data.playing || 0);
      } catch {
        setPlayers(null);
      }
    };
    const fetchNotifications = async () => {
      try {
        const localUser = JSON.parse(localStorage.getItem('User'));
        if (!localUser?._id) return;
        const res = await axios.get(`/api/user/notifications?userId=${localUser._id}`);
        setNotifications(res.data || []);
        setHasNew(res.data.some(n => !n.read));
      } catch (err) {
        console.error('Failed to fetch notifications:', err.message);
      }
    };
    fetchNotifications();

    fetchUser();
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 30000);
    const notifInterval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dropdowns = [
    {
      name: 'Community',
      id:1,
      items: [
        { label: 'Home', href: '/' },
        { label: 'Advertising', href: '/advertising' },
        { label: 'Content', href: '/content' },
        { label: 'Make A Report', href: '/make-a-report' },
        { label: 'Operators', href: '/ycc/operators/' },
      ],
    },
    {
      name: 'Yapton Community Council',
      id:2,
      items: [
        { label: 'YCC Home', href: '/ycc/' },
        { label: 'Travel Updates', href: '/ycc/travel' },
        { label: 'Stops', href: '/ycc/stops/' },
        { label: 'Routes', href: '/ycc/routes/' },
        { label: 'Route Editor', href: '/ycc/routes/request', roleKey: 'Operator' },
      ],
    },
    {
      name: 'Staff Hub',
      id:3,
      roleKey: 'hub',
      items: [
        { label: 'Hub', href: '/hub/' },
        { label: 'Authorised Leave', href: '/me/leave' },
        { label: 'Activity Logging', href: '/me/activity' },
        { label: 'Moderation Guide', href: '/hub/guide' },
        { label: 'Moderation Panel', href: '/hub/game' },
        { label: 'Shift Scenarios', href: '/hub/shift' },
      ],
    },
    {
      name: 'Hub+',
      id:4,
      roleKey: 'hubPlus',
      items: [
        { label: 'Hub+', href: '/hub+/' },
        { label: 'Activity', href: '/hub+/activity' },
        { label: 'Contact Emails', href: '/hub+/contact/emails' },
        { label: 'Contact Forms', href: '/hub+/contact/forms' },
        { label: 'Disciplinaries', href: '/hub+/disciplinaries' },
      ],
    },
    {
      name: 'Admin',
      id:5,
      roleKey: 'admin',
      items: [
        { label: 'Admin', href: '/admin' },
        { label: 'Ban Appeals', href: '/admin/appeals' },
        { label: 'Dev Tasks', href: '/admin/dev' },
        { label: 'Hiring', href: '/admin/hiring' },
        { label: 'Leave Requests', href: '/admin/leave' },
        { label: 'Manage Content', href: '/admin/content' },
        { label: 'Manage Operators', href: '/admin/operators' },
        { label: 'Manage Routes', href: '/admin/routes' },
        { label: 'Manage Stops', href: '/admin/stops' },
        { label: 'Newsletter Subs', href: '/admin/newsletter' },
        { label: 'Notice Control', href: '/admin/notice-control' },
        { label: 'Routes Submission', href: '/admin/ycc/routes' },
        { label: 'Staff Accounts', href: '/admin/accounts' },
      ],
    },
    {
      name: 'Developer',
      id:6,
      roleKey: 'dev',
      items: [
        { label: 'Dev Hub', href: '/dev/' },
        { label: 'Authorised Leave', href: '/me/leave' },
        { label: 'Tasks', href: '/dev/tasks' },
      ],
    },
  ];

  return (
    <nav
      ref={navRef}
      className="w-full bg-[#283335] backdrop-blur-xl text-white sticky top-0 z-50 shadow-md"
    >
      <div className="mx-auto flex justify-between items-center px-4 md:px-8 py-3">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Image src={process.env.NODE_ENV === "development" ? "/orange_logo.png" : "/logo.png"} alt="Logo" width={40} height={40} />
          </Link>
          <div>
            <p className="font-semibold text-lg">
              <Link
                href="/"
                className={process.env.NODE_ENV === "development" ? "text-orange-500" : ""}
              >
                Yapton & District
              </Link>
            </p>

            <p className={`text-xs ${process.env.NODE_ENV === "development" ? "text-orange-500" : "text-gray-300"}`}>
              <CountUp
                from={0}
                to={players ?? 0}
                separator=","
                direction="up"
                duration={1}
                className="count-up-text"
              /> playing •{' '}
              <a
                href="https://www.roblox.com/games/5883938795/UPDATE-Yapton-and-District"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400 underline"
              >
                Visit on Roblox
              </a>
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
          {dropdowns.map((dropdown, i) => {
            if (dropdown.id === 1 || dropdown.id === 2 || (user && (!dropdown.roleKey || hasAccessTo(dropdown.roleKey, role)))) {
              return (
                <div key={i} className="relative">
                  <button
                    onClick={() =>
                      setOpenDropdown(openDropdown === dropdown.name ? null : dropdown.name)
                    }
                    className="hover:bg-[#283335] px-3 py-2 rounded-md text-md font-medium transition"
                  >
                    {dropdown.name}
                  </button>
                  <AnimatePresence>
                    {openDropdown === dropdown.name && (
                      <motion.div
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute top-full left-0 mt-0.5 bg-[#283335] backdrop-blur-lg 
                                   rounded-b-lg shadow-xl 
                                   overflow-hidden min-w-[180px] z-50"
                      >
                        {dropdown.items
                          .filter((item) => {
                            if (!user && item.roleKey) return false;
                            if (item.roleKey && user?.role !== item.roleKey) return false;
                            return true;
                          })
                          .map((item, j) => (
                            <Link
                              key={j}
                              href={item.href}
                              onClick={() => setOpenDropdown(null)}
                              className="block px-4 py-2 hover:bg-[#283335] text-md transition"
                            >
                              {item.label}
                            </Link>
                          ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }
            return null;
          })}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 relative">
              <div
                className="relative"
                onMouseEnter={() => setNotifOpen(true)}
                onMouseLeave={() => setNotifOpen(false)}
              >
                <div className="relative p-2 hover:bg-[#283335] rounded-full transition cursor-pointer">
                  <Bell className="w-5 h-5" />
                  {hasNew && (
                    <>
                      <span className="absolute top-0.5 right-0.5 h-4 w-4 bg-red-500 rounded-full opacity-75 animate-ping"></span>
                      <span className="absolute top-0.5 right-0.5 flex items-center justify-center h-4 w-4 rounded-full bg-red-600 text-[8px] font-bold text-white">
                        {notifications.filter((n) => !n.read).length}
                      </span>
                    </>
                  )}
                </div>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-3 bg-[#2e3b3e]/95 backdrop-blur-xl rounded-xl shadow-2xl w-72 py-3 px-4 z-50 border border-white/10"
                    >
                      <p className="font-semibold text-white mb-2 text-sm">Notifications</p>
                      {notifications.length === 0 ? (
                        <p className="text-white/60 text-sm">No new notifications.</p>
                      ) : (
                        <ul className="max-h-60 overflow-y-auto space-y-2">
                          {notifications.slice(0, 5).map((n, i) => (
                            <li
                              key={i}
                              className={`text-sm p-2 rounded-lg ${n.read
                                ? 'bg-white/5 text-white/70'
                                : 'bg-blue-500/20 text-blue-100'
                                }`}
                            >
                              <a
                                href={n.link ? n.link : '/me/notifications'}
                                className="hover:underline hover:text-blue-300 transition-colors"
                              >
                                {n.notification}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                      <Link
                        href="/me/notifications"
                        className="text-blue-400 hover:text-blue-300 text-xs mt-3 inline-block"
                      >
                        View all →
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <button
                  onClick={() =>
                    setOpenDropdown(openDropdown === 'user' ? null : 'user')
                  }
                  className="flex items-center gap-2 hover:bg-[#283335] px-3 py-2 rounded-md transition"
                >
                  <Image
                    src={user?.defaultAvatar || '/logo.png'}
                    alt="Avatar"
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                  <span className="text-md">{user.username}</span>
                </button>

                <AnimatePresence>
                  {openDropdown === 'user' && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-1 bg-[#283335]/95 backdrop-blur-lg 
                         rounded-lg shadow-xl overflow-hidden w-44 border border-white/10 z-50"
                    >
                      <Link href="/me" className="block px-4 py-2 hover:bg-[#283335] text-md">Profile</Link>
                      <Link href="/me/cdn" className="block px-4 py-2 hover:bg-[#283335] text-md">File Sharer</Link>
                      <Link href="/me/applications" className="block px-4 py-2 hover:bg-[#283335] text-md">My Applications</Link>
                      <Link href="/me/appeals" className="block px-4 py-2 hover:bg-[#283335] text-md">My Appeals</Link>
                      <Link href="/me/notifications" className="block px-4 py-2 hover:bg-[#283335] text-md">My Notifications</Link>
                      <LogoutButton />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <Link
              href="/auth/"
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm transition"
            >
              Login
            </Link>
          )}
        </div>


        <div className="relative md:hidden">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-md hover:bg-[#283335] transition relative"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {hasNew && (
            <span className="absolute top-1 right-1 flex">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
            </span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="md:hidden bg-[#283335] backdrop-blur-xl border-t px-4 py-3 space-y-3"
          >
            {dropdowns.map((dropdown, i) => {
              if (
               dropdown.id === 1 || dropdown.id === 2 ||
                (user && (!dropdown.roleKey || hasAccessTo(dropdown.roleKey, role)))
              ) {
                const isOpen = openDropdown === dropdown.name;
                return (
                  <div key={i} className="border-b border-white/10 pb-2">
                    <button
                      onClick={() =>
                        setOpenDropdown(isOpen ? null : dropdown.name)
                      }
                      className="flex justify-between items-center w-full text-left text-sm font-semibold text-white hover:text-blue-400 py-2"
                    >
                      {dropdown.name}
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        ▼
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="ml-3 mt-1 space-y-1 overflow-hidden"
                        >
                          {dropdown.items
                          .filter((item) => {
                            if (!user && item.roleKey) return false;
                            if (item.roleKey && user?.role !== item.roleKey) return false;
                            return true;
                          })
                          .map((item, j) => (
                            <Link
                              key={j}
                              href={item.href}
                              onClick={() => {
                                setMobileOpen(false);
                                setOpenDropdown(null);
                              }}
                              className="block text-sm text-gray-300 hover:text-blue-400"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }
              return null;
            })}

            {user ? (
              <div className="border-t pt-2">
                <button
                  onClick={() =>
                    setOpenDropdown(openDropdown === 'user-mobile' ? null : 'user-mobile')
                  }
                  className="flex justify-between items-center w-full text-left text-sm font-semibold text-white hover:text-blue-400 py-2 relative"
                >
                  <div className="flex items-center gap-2">
                    {user.username || 'Account'}

                    {hasNew && (
                      <span className="relative flex">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                      </span>
                    )}
                  </div>

                  <motion.span
                    animate={{ rotate: openDropdown === 'user-mobile' ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    ▼
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {openDropdown === 'user-mobile' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="ml-3 mt-1 space-y-1 overflow-hidden"
                    >
                      <Link
                        href="/me"
                        onClick={() => {
                          setMobileOpen(false);
                          setOpenDropdown(null);
                        }}
                        className="block text-sm text-gray-300 hover:text-blue-400"
                      >
                        Profile
                      </Link>
                      <Link
                        href="/me/cdn"
                        onClick={() => {
                          setMobileOpen(false);
                          setOpenDropdown(null);
                        }}
                        className="block text-sm text-gray-300 hover:text-blue-400"
                      >
                        File Sharer
                      </Link>
                      <Link
                        href="/me/applications"
                        onClick={() => {
                          setMobileOpen(false);
                          setOpenDropdown(null);
                        }}
                        className="block text-sm text-gray-300 hover:text-blue-400"
                      >
                        My Applications
                      </Link>
                      <Link
                        href="/me/appeals"
                        onClick={() => {
                          setMobileOpen(false);
                          setOpenDropdown(null);
                        }}
                        className="block text-sm text-gray-300 hover:text-blue-400"
                      >
                        My Appeals
                      </Link>
                      <Link
                        href="/me/notifications"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between text-sm text-gray-300 hover:text-blue-400"
                      >
                        <span className="flex items-center gap-2">
                          My Notifications
                        </span>

                        {hasNew && (
                          <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-[1px] rounded-full">
                            {notifications.filter(n => !n.read).length}
                          </span>
                        )}
                      </Link>
                      <div className="pt-2">
                        <LogoutButton />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/auth/"
                onClick={() => setMobileOpen(false)}
                className="block bg-blue-600 hover:bg-blue-700 text-center py-2 rounded-md text-sm"
              >
                Login
              </Link>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
