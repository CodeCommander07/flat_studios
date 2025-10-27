'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <footer className="w-full bg-[#283335]/95 backdrop-blur-md text-white px-5 py-5 border-t border-white/20 shadow-inner mb-0">
      <div className="mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Left: Logo & Name */}
        <div className="flex items-center gap-3">
          <Image
            src={process.env.NODE_ENV === 'development' ? '/orange_logo.png' : '/logo.png'}
            alt="Logo"
            width={30}
            height={30}
            className="rounded-md"
          />
          <span
            className={`text-lg font-semibold ${
              process.env.NODE_ENV === 'development' ? 'text-orange-500' : ''
            }`}
          >
            © 2025 Yapton & District
          </span>
        </div>

        {/* Right: Links */}
      <div className="max-w-3xl mx-auto text-center">
        <h3 className="text-xl font-semibold mb-2">Subscribe to our Newsletter</h3>
        <form
          onSubmit={handleSubscribe}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="px-4 py-2 w-full sm:w-80 rounded-md bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/20"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 transition text-white font-medium disabled:opacity-50"
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>

        {/* Status Message */}
        {status === 'success' && (
          <p className="text-green-400 text-sm mt-3">✅ You’ve successfully subscribed!</p>
        )}
        {status === 'error' && (
          <p className="text-red-400 text-sm mt-3">
            ❌ There was a problem subscribing. Please try again.
          </p>
        )}
      </div>
       <div className="flex flex-col md:flex-row gap-2 md:gap-6 text-sm text-center md:text-left">
          <Link href="/" className="hover:underline hover:text-white/80 transition">
            Home
          </Link>
          <Link href="/careers" className="hover:underline hover:text-white/80 transition">
            Careers
          </Link>
          <Link href="/ban-appeal" className="hover:underline hover:text-white/80 transition">
            Ban Appeal
          </Link>
          <Link href="/contact" className="hover:underline hover:text-white/80 transition">
            Contact
          </Link>
          <Link href="/terms" className="hover:underline hover:text-white/80 transition">
            Terms
          </Link>
          <Link href="/privacy" className="hover:underline hover:text-white/80 transition">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
