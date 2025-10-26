'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LogoutButton from './LogoutButton';
import { hasAccessTo } from '@/utils/permissions';

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

    fetchUser();
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 30000);
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
      name: 'Public',
      items: [
        { label: 'Home', href: '/' },
        { label: 'Content', href: '/content' },
      ],
    },
    {
      name: 'Yapton Community Council',
      roleKey: 'ycc',
      items: [
        { label: 'YCC Home', href: '/ycc/' },
        { label: 'Bus Stops', href: '/ycc/stops/' },
        { label: 'Route Viewer', href: '/ycc/routes/' },
        { label: 'Route Editor', href: '/ycc/routes/request', roleKey: 'Operator' },
      ],
    },
    {
      name: 'Staff Hub',
      roleKey: 'hub',
      items: [
        { label: 'Hub', href: '/hub/' },
        { label: 'Authorised Leave', href: '/hub/leave' },
        { label: 'Activity Logging', href: '/hub/activity' },
        { label: 'Moderation Guide', href: '/hub/guide' },
        { label: 'Shift Scenarios', href: '/hub/shift' },
      ],
    },
    {
      name: 'Hub+',
      roleKey: 'hubPlus',
      items: [
        { label: 'Hub+', href: '/hub+/' },
        { label: 'Activity', href: '/hub+/activity' }, 
        { label: 'Contact Emails', href: '/hub+/contact/emails' },
        { label: 'Contact Forms', href: '/hub+/contact/forms' },
        { label: 'Diciplinaries', href: '/hub+/diciplinaries' },
        { label: 'Hiring', href: '/hub+/hiring' },
        { label: 'Infract', href: '/hub+/infract' },
      ],
    },
    {
      name: 'Admin',
      roleKey: 'admin',
      items: [
        { label: 'Admin', href: '/admin' },
        { label: 'Ban Appeals', href: '/admin/appeals' },
        { label: 'Dev Tasks', href: '/admin/dev' },
        { label: 'Leave Requests', href: '/admin/leave' },
        { label: 'Manage Content', href: '/admin/content' },
        { label: 'Manage Forms', href: '/admin/hiring' },
        { label: 'Manage Operators', href: '/admin/operators' },
        { label: 'Manage Routes', href: '/admin/routes' },
        { label: 'Staff Accounts', href: '/admin/accounts' },
      ],
    },
    {
      name: 'Developer',
      roleKey: 'dev',
      items: [
        { label: 'Dev Hub', href: '/dev/' },
        { label: 'Leave', href: '/dev/leave' },
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
        {/* Left: Logo + info */}
        <div className="flex items-center gap-3">
          <Link href="/">
            <Image src="/logo.png" alt="Logo" width={40} height={40} />
          </Link>
          <div>
            <p className="font-semibold text-lg">
              <Link href="/">Yapton & District</Link>
            </p>
            <p className="text-xs text-gray-300">
              {players ?? '–'} playing •{' '}
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


        {/* Center: Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {dropdowns.map((dropdown, i) => {
            if (dropdown.name === 'Public' || (user && (!dropdown.roleKey || hasAccessTo(dropdown.roleKey, role)))) {
              return (
                <div key={i} className="relative">
                  <button
                    onClick={() =>
                      setOpenDropdown(openDropdown === dropdown.name ? null : dropdown.name)
                    }
                    className="hover:bg-white/10 px-3 py-2 rounded-md text-md font-medium transition"
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
                        {dropdown.items.map((item, j) => (
                          <Link
                            key={j}
                            href={item.href}
                            onClick={() => setOpenDropdown(null)}
                            className="block px-4 py-2 hover:bg-white/10 text-md transition"
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

        {/* Right: Account */}
        <div className="hidden md:flex items-center">
          {user ? (
            <div className="relative">
              <button
                onClick={() =>
                  setOpenDropdown(openDropdown === 'user' ? null : 'user')
                }
                className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-md transition"
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
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute right-0 mt-0.5 bg-[#283335] backdrop-blur-lg 
                               rounded-b-lg shadow-xl 
                               overflow-hidden w-44"
                  >
                    <Link href="/me" className="block px-4 py-2 hover:bg-white/10 text-md">Profile</Link>
                    <Link href="/me/cdn" className="block px-4 py-2 hover:bg-white/10 text-md">File Sharer</Link>
                    <LogoutButton />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm transition"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-md hover:bg-white/10 transition"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
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
              if (dropdown.name === 'Public' || (user && (!dropdown.roleKey || hasAccessTo(dropdown.roleKey, role)))) {
                return (
                  <div key={i}>
                    <p className="font-semibold text-sm mb-1">{dropdown.name}</p>
                    <div className="ml-2 space-y-1">
                      {dropdown.items.map((item, j) => (
                        <Link
                          key={j}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className="block text-sm text-gray-200 hover:text-blue-400"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })}

            {user ? (
              <div className="border-t pt-3">
                <Link href="/me" className="block text-sm hover:text-blue-400">Profile</Link>
                <Link href="/me/cdn" className="block text-sm hover:text-blue-400">File Sharer</Link>
                <LogoutButton />
              </div>
            ) : (
              <Link
                href="/auth/login"
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
