'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LogoutButton from './LogoutButton';
import { hasAccessTo } from '@/utils/permissions';

// Animation variants
const dropdownVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.95 },
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
  const [pages, setPages] = useState([]);
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
      } catch (err) {
        console.error('Failed to fetch player count:', err.message);
      }
    };

    const fetchPages = async () => {
      try {
        const res = await axios.get('/api/pages');
        const publishedPages = res.data.filter(page => page.published);
        setPages(publishedPages);
      } catch (err) {
        console.error('Failed to fetch pages:', err.message);
      }
    };

    fetchUser();
    fetchPlayers();
    fetchPages();
    const interval = setInterval(fetchPlayers, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpenDropdown(null);
        setMobileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const dropdowns = [
    {
      name: 'Public',
      items: [
        { label: 'Home', href: '/' },
      ],
    },
    {
      name: 'Yapton Community Council',
      roleKey: 'ycc',
      items: [
        { label: 'YCC Home', href: '/ycc/' },
        { label: 'Route Viewer', href: '/ycc/routes/' },
        { label: 'Bus Stops', href: '/ycc/stops/' },
        { label: 'Route Editor', href: '/ycc/routes/request', roleKey: 'Operator' },
      ],
    },
    {
      name: 'Staff Hub',
      roleKey: 'hub',
      items: [
        { label: 'Hub', href: '/hub/' },
        { label: 'Moderation Guide', href: '/hub/guide' },
        { label: 'Activity Logging', href: '/hub/activity' },
        { label: 'Shift Scenarios', href: '/hub/shift' },
        { label: 'Authorised Leave', href: '/hub/leave' },
      ],
    },
    {
      name: 'Hub+',
      roleKey: 'hubPlus',
      items: [
        { label: 'Hub+', href: '/hub+/' },
        { label: 'Hiring', href: '/hub+/hiring' },
        { label: 'Contact Forms', href: '/hub+/contact/forms' },
        { label: 'Contact Emails', href: '/hub+/contact/emails' },
        { label: 'Activity', href: '/hub+/activity' },
        { label: 'Infract', href: '/hub+/infract' },
        { label: 'Diciplinaries', href: '/hub+/diciplinaries' },
      ],
    },
    {
      name: 'Admin',
      roleKey: 'admin',
      items: [
        { label: 'Admin', href: '/admin/' },
        { label: 'Staff Accounts', href: '/admin/accounts' },
        { label: 'Ban Appeals', href: '/admin/appeals' },
        { label: 'Manage Forms', href: '/admin/hiring' },
        { label: 'Leave Requests', href: '/admin/leave' },
        { label: 'Manage Routes', href: '/admin/routes' },
        { label: 'Manage Operators', href: '/admin/operators' },
        { label: 'Dev Tasks', href: '/admin/dev' },
        { label: 'Page Editor', href: '/admin/pages' },
      ],
    },
    {
      name: 'Developer',
      roleKey: 'dev',
      items: [
        { label: 'Dev Hub', href: '/dev/' },
        { label: 'Leave', href: '/dev/leave' },
        { label: 'Tasks', href: '/dev/tasks' },
        { label: 'Submit Tasks', href: '/dev/submit' },
      ],
    },
  ];

  // Add dynamic pages to Public dropdown (excluding blog pages)
  const publicDropdown = dropdowns.find(d => d.name === 'Public');
  if (publicDropdown) {
    // Add pages to public dropdown (avoid duplicates and exclude blog pages)
    const existingLinks = new Set(publicDropdown.items.map(item => item.href));
    pages.forEach(page => {
      const pageHref = `/${page.slug}`;
      // Only add if not a blog page and not already in the dropdown
      if (!page.isBlog && !existingLinks.has(pageHref)) {
        publicDropdown.items.push({
          label: page.title,
          href: pageHref,
          blog: page.isBlog,
        });
        existingLinks.add(pageHref);
      }
    });
  }

  return (
    <nav ref={navRef} className="w-full bg-[#283335] backdrop-blur-2xl text-white px-4 md:px-8 py-4 relative z-50">
      <div className="max-w-8xl mx-auto flex justify-between items-center">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Image src="/logo.png" alt="Logo" width={40} height={40} className="rounded-md" />
          </Link>
          <div className="flex flex-col">
            <span className="text-xl md:text-2xl font-bold">Yapton & District</span>
            <span className="text-sm text-gray-300">{players ?? '–'} currently playing • <Link href="https://www.roblox.com/games/5883938795/UPDATE-Yapton-and-District" className='hover:text-blue-300'>Game Link</Link></span>
          </div>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {dropdowns.map((dropdown, idx) => {
            if (dropdown.name === 'Public') {
              return (
                <DropdownMenu
                  key={idx}
                  dropdown={dropdown}
                  openDropdown={openDropdown}
                  setOpenDropdown={setOpenDropdown}
                />
              );
            }

            if (!user || !dropdown.roleKey || !hasAccessTo(dropdown.roleKey, role)) return null;
            return (
              <DropdownMenu
                key={idx}
                dropdown={dropdown}
                openDropdown={openDropdown}
                setOpenDropdown={setOpenDropdown}
              />
            );
          })}

          {/* User dropdown */}
          {user ? (
            <div className="relative">
              <button
                onClick={() =>
                  setOpenDropdown(openDropdown === 'user' ? null : 'user')
                }
                className="flex items-center gap-2 hover:bg-black/20 px-3 py-2 rounded transition"
              >
                <span>{user?.username}</span>
                <Image
                  src={user?.defaultAvatar || '/logo.png'}
                  alt="Avatar"
                  width={30}
                  height={30}
                  className="rounded-full"
                />
              </button>

              <AnimatePresence>
                {openDropdown === 'user' && (
                  <motion.div
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute right-0 mt-2 bg-[#283335] rounded-lg shadow-md w-48 z-50 overflow-hidden"
                  >
                    <Link href="/me" className="block px-4 py-2 hover:bg-black/20">Profile</Link>
                    <Link href="/me/cdn" className="block px-4 py-2 hover:bg-black/20">File Sharer</Link>
                    <LogoutButton />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link href="/auth/login" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition">
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="md:hidden mt-4 bg-[#283335] rounded-lg px-4 py-3 space-y-4 overflow-hidden"
          >
            {dropdowns.map((dropdown, idx) => {
              if (dropdown.name === 'Public') {
                return <MobileDropdownMenu key={idx} dropdown={dropdown} />;
              }

              if (!user || !dropdown.roleKey || !hasAccessTo(dropdown.roleKey, role)) return null;
              return <MobileDropdownMenu key={idx} dropdown={dropdown} />;
            })}

            <div>
              {user ? (
                <div className="mt-4 border-t border-white/20 pt-4 space-y-1">
                  <Link href="/me" className="block text-sm hover:text-blue-400">Profile</Link>
                  <Link href="/me/cdn" className="block text-sm hover:text-blue-400">File Sharer</Link>
                  <LogoutButton />
                </div>
              ) : (
                <Link href="/auth/login" className="block text-sm bg-blue-600 hover:bg-blue-700 text-center rounded py-2">
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

/* ========== DESKTOP DROPDOWN ========== */
function DropdownMenu({ dropdown, openDropdown, setOpenDropdown }) {
  return (
    <div className="relative">
      <button
        onClick={() =>
          setOpenDropdown(openDropdown === dropdown.name ? null : dropdown.name)
        }
        className="hover:bg-black/20 px-3 py-2 rounded transition"
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
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 mt-2 bg-[#283335] rounded-lg shadow-md w-48 z-50 overflow-hidden"
          >
            {dropdown.items.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className="block px-4 py-2 hover:bg-black/20 transition"
                onClick={() => setOpenDropdown(null)}
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

/* ========== MOBILE DROPDOWN ========== */
function MobileDropdownMenu({ dropdown }) {
  return (
    <div>
      <p className="font-semibold">{dropdown.name}</p>
      <div className="ml-2 space-y-1">
        {dropdown.items.map((item, i) => (
          <Link
            key={i}
            href={item.href}
            className="block text-sm hover:text-blue-400 transition"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}