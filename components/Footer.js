'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [vercelStatus, setVercelStatus] = useState(null);

  // 🟢 Fetch Vercel system status
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('https://www.vercel-status.com/api/v2/status.json');
        const data = await res.json();
        setVercelStatus(data.status);
      } catch (err) {
        console.error('Failed to fetch Vercel status:', err);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // refresh every 60 s
    return () => clearInterval(interval);
  }, []);

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

  // 🟢 Pick color based on status
  const getStatusColor = () => {
    if (!vercelStatus) return 'bg-gray-400';
    switch (vercelStatus.indicator) {
      case 'none':
        return 'bg-green-500';
      case 'minor':
        return 'bg-yellow-400';
      case 'major':
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <footer className="w-full bg-[#283335]/95 backdrop-blur-md text-white px-5 py-6 border-t border-white/20 shadow-inner mb-0">
      <div className="mx-auto flex flex-col md:flex-row justify-between items-center gap-6">

        {/* Left: Logo & Name + Status */}
        <div className="flex flex-col items-center md:items-start gap-2">
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

          {/* 🟢 Vercel status line */}
          <a
            href="https://www.vercel-status.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gray-300 bg-black/50 rounded p-2 hover:text-blue-400 transition"
          >
            <span className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`} />
            <span>
              {vercelStatus
                ? vercelStatus.description
                : 'Checking Vercel status...'}
            </span>
          </a>
        </div>

        {/* Center: Newsletter */}
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

          {status === 'success' && (
            <p className="text-green-400 text-sm mt-3">✅ You’ve successfully subscribed!</p>
          )}
          {status === 'error' && (
            <p className="text-red-400 text-sm mt-3">
              ❌ There was a problem subscribing. Please try again.
            </p>
          )}
        </div>

        {/* Right: Links */}
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
