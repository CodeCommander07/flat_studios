'use client';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';
import { FileText, Clock, FilePlus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const cards = [
    {
      title: 'All Posts',
      desc: 'View and manage all content items',
      icon: <FileText className="w-6 h-6 text-blue-400" />,
      href: '/admin/content',
    },
    {
      title: 'Drafts',
      desc: 'Edit and publish saved drafts',
      icon: <Clock className="w-6 h-6 text-yellow-400" />,
      href: '/admin/content?status=draft',
    },
    {
      title: 'Create New',
      desc: 'Write a new blog post or guide',
      icon: <FilePlus className="w-6 h-6 text-green-400" />,
      href: '/admin/content/new',
    },
  ];

  return (
    <AdminLayout>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {cards.map((card) => (
          <Link key={card.title} href={card.href}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 cursor-pointer hover:bg-white/10 transition"
            >
              <div className="flex items-center gap-3 mb-2">{card.icon}
                <h3 className="text-xl font-semibold">{card.title}</h3>
              </div>
              <p className="text-white/70 text-sm">{card.desc}</p>
            </motion.div>
          </Link>
        ))}
      </motion.div>
    </AdminLayout>
  );
}
