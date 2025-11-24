'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function ApplicationSuccess() {
  return (
    <div className="max-h-screen p-15 flex items-center justify-center text-white px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-[#283335] backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10 text-center"
      >
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-16 h-16 text-green-400" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Application Submitted</h1>
        <p className="text-gray-300 mb-8">
          Thank you for submitting your application. Our team will review it shortly and contact you via email with any updates.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/me/applications"
            className="bg-green-600 hover:bg-green-700 transition-all px-4 py-2 rounded-md font-semibold text-white"
          >
            View Application History
          </Link>
          <Link
            href="/"
            className="text-gray-300 hover:text-white underline underline-offset-4"
          >
            Return to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
