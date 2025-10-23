'use client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Clock,
  FilePlus,
  Settings,
  LogOut,
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const currentPath = router.pathname;

  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard />, href: '/admin/dashboard' },
    { name: 'Posts', icon: <FileText />, href: '/admin/content' },
    { name: 'Drafts', icon: <Clock />, href: '/admin/content?status=draft' },
    { name: 'New Post', icon: <FilePlus />, href: '/admin/content/new' },
    { name: 'Settings', icon: <Settings />, href: '/admin/settings' },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#050510] to-[#0e1a2a] text-white">
      {/* Sidebar */}
      <aside className="w-64 hidden md:flex flex-col bg-white/5 border-r border-white/10 backdrop-blur-md p-6">
        <h1 className="text-2xl font-bold mb-8">📰 CMS Admin</h1>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.03 }}
                className={`flex items-center gap-3 p-2 rounded-lg transition ${
                  currentPath === item.href
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-white/10'
                }`}
              >
                <span className="w-5 h-5">{item.icon}</span>
                {item.name}
              </motion.div>
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-white/10">
          <button className="flex items-center gap-2 text-white/60 hover:text-red-400 transition">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Admin Panel</h2>
        </header>

        <div>{children}</div>
      </main>
    </div>
  );
}
