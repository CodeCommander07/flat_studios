'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bus } from 'lucide-react';

export default function Custom404() {
  return (
    <main className="flex-1 flex items-center justify-center text-white px-4 py-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="bg-[#283335] backdrop-blur-md border border-white/20 rounded-2xl shadow-lg p-10 max-w-md text-center w-full"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="mx-auto mb-6"
        >
          <Bus
            className="w-24 h-24 mx-auto text-red-400 drop-shadow-xl drop-shadow-red-500"
          />
        </motion.div>

        <h1 className="text-5xl font-bold mb-4">404</h1>
        <p className="text-lg mb-6">Oops! The page you’re looking for doesn’t exist.</p>

        <Link
          href="/"
          className="inline-block bg-white/20 hover:bg-white/30 transition px-6 py-2 rounded font-medium"
        >
          Return Home
        </Link>
      </motion.div>
    </main>
  );
}
