'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Menu, X } from 'lucide-react'; // optional icons, or use your own

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('User');
  const [players, setPlayers] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);


useEffect(() => {
  const fetchUser = async () => {
    try {
      const localUser = JSON.parse(localStorage.getItem('User'));
      if (!localUser?._id) return;

      const res = await axios.get(`/api/user/me?id=${localUser._id}`);
      setUser(res.data);
      setRole(localUser.role || 'User'); // Set from local storage
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

  fetchUser();
  fetchPlayers();

  const interval = setInterval(fetchPlayers, 30000);
  return () => clearInterval(interval);
}, []);

  const dropdowns = [
    {
      name: 'Public',
      role: 'User',
      items: [
        { label: 'Home', href: '/' },
        { label: 'Disruptions', href: '/disruptions' },
        { label: 'News', href: '/news' },
        { label: 'Community', href: '/community' },
        { label: 'Retailers', href: '/retailers' },
        { label: 'Guides', href: '/guides' },
        { label: 'Games', href: '/games' },
        { label: 'Report', href: '/report' },
        { label: 'Advertising', href: '/advertisment' },
      ],
    },
    {
      name: 'Operations Hub',
      role: 'User',
      items: [
        { label: 'Operators', href: '/operators/' },
        { label: 'Travel', href: '/operators/travel' },
        { label: 'Stops', href: '/operators/stops' },
        { label: 'Timetables', href: '/operators/timetables' },
        { label: 'Routes', href: '/operators/routes' },
        { label: 'Request Routes', href: '/operators/request' },
      ],
    },
    {
      name: 'Staff Hub',
      role: 'Staff',
      items: [
        { label: 'Hub', href: '/hub/' },
        { label: 'Moderation Guide', href: '/hub/guide' },
        { label: 'Activity Logging', href: '/hub/activity' },
        { label: 'Shift Scenarios', href: '/hub/shift' },
        { label: 'Authorised Leave', href: '/hub/leave' },
      ],
    },
    {
      name: 'Admin',
      role: 'High Rank',
      items: [
        { label: 'Admin', href: '/admin/' },
        { label: 'Staff Accounts', href: '/admin/accounts' },
        { label: 'Ban Appeals', href: '/admin/appeals' },
      ],
    },
    {
      name: 'Hub+',
      role: 'Community Director',
      items: [
        { label: 'Hub+', href: '/hub+/' },
        { label: 'Hiring', href: '/hub+/hiring' },
        { label: 'Contact', href: '/hub+/contact' },
        { label: 'Leave Requests', href: '/hub+/leave' },
        { label: 'Dev Assets', href: '/hub+/dev' },
        { label: 'Activity', href: '/hub+/activity' },
        { label: 'Infract', href: '/hub+/infract' },
        { label: 'Diciplinaries', href: '/hub+/diciplinaries' },
        { label: 'Accounts', href: '/hub+/accounts' },
      ],
    },
    {
      name: 'Developer',
      role: 'Developer',
      items: [
        { label: 'Dev Hub', href: '/dev/' },
        { label: 'Bot Status', href: '/dev/bot' },
      ],
    },
  ];

  const hasAccess = (requiredRole) => {
    const roles = ['User', 'Staff', 'High-Rank', 'Community-Director', 'Operations-Manager', 'Developer', 'Web-Developer'];
    return roles.indexOf(role) >= roles.indexOf(requiredRole);
  };

  return (
    <nav className="w-full bg-[#283335] backdrop-blur-2xl text-white px-4 md:px-8 py-4 rounded-b-2xl relative z-50">
      <div className="max-w-8xl mx-auto flex justify-between items-center">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <a href='/'><Image src="/logo.png" alt="Logo" width={40} height={40} className="rounded-md" /></a>
          <div className="flex flex-col">
            <span className="text-xl md:text-2xl font-bold">Yapton & District Staff Hub</span>
            <span className="text-sm text-gray-300">{players ?? '–'} currently playing</span>
          </div>
        </div>

        {/* Mobile toggle button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {dropdowns.map((dropdown, idx) =>
            hasAccess(dropdown.role) ? (
              <div key={idx} className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === idx ? null : idx)}
                  className="hover:bg-black/20 px-3 py-2 rounded transition"
                >
                  {dropdown.name}
                </button>
                {openDropdown === idx && (
                  <div className="absolute right-0 mt-2 bg-[#283335] rounded-lg shadow-md w-48 z-50">
                    {dropdown.items.map((item, i) => (
                      <Link
                        key={i}
                        href={item.href}
                        className="block px-4 py-2 hover:bg-black/20 transition"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : null
          )}

          {/* User Avatar */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'user' ? null : 'user')}
                className="flex items-center gap-2 hover:bg-black/20 px-3 py-2 rounded transition"
              >
                <span className="md:inline">{user?.username}</span>
                <Image
  src={user?.discordAvatar || '/logo.png'}
  alt="Avatar"
  width={30}
  height={30}
  className="rounded-full"
/>
              </button>
              {openDropdown === 'user' && (
                <div className="absolute right-0 mt-2 bg-[#283335] rounded-lg shadow-md w-48 z-50">
                  <Link href="/me" className="block px-4 py-2 hover:bg-black/20">Profile</Link>
                  <Link href="/auth/logout" className="block px-4 py-2 hover:bg-black/20">Logout</Link>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth/login" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition">
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden mt-4 bg-[#283335] rounded-lg px-4 py-3 space-y-4">
          {dropdowns.map((dropdown, idx) =>
            hasAccess(dropdown.role) ? (
              <div key={idx}>
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
            ) : null
          )}

          <div>
            {user ? (
              <div className="mt-4 border-t border-white/20 pt-4 space-y-1">
                <Link href="/me" className="block text-sm hover:text-blue-400">Profile</Link>
                <Link href="/auth/logout" className="block text-sm hover:text-blue-400">Logout</Link>
              </div>
            ) : (
              <Link href="/auth/login" className="block text-sm bg-blue-600 hover:bg-blue-700 text-center rounded py-2">
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
