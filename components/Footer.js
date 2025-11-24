'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [game, setGame] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/game/stats");
        const json = await res.json();
        setGame(json);
      } catch (err) {
        console.error("Failed to load game data", err);
      }
    }
    loadData();
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

  const updated = game?.updated
    ? new Date(game.updated).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "N/A";

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
            <div className="flex flex-col leading-tight">
              <span
                className={`text-lg font-semibold ${
                  process.env.NODE_ENV === 'development' ? 'text-orange-500' : ''
                }`}
              >
                © 2025 Flat Stuidos
              </span>
              <span
                className={`text-sm opacity-70 ${
                  process.env.NODE_ENV === 'development' ? 'text-orange-400' : 'text-gray-300'
                }`}
              >
                Game Last Updated: <span className='underline'>{updated}</span>
              </span>
            </div>
          </div>
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
          <Link href="/sitemap" className="hover:underline hover:text-white/80 transition">
            Sitemap
          </Link>
        </div>
      </div>
    </footer>
  );
}
