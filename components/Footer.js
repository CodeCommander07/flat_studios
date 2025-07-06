'use client';
import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-[#283335] backdrop-blur-md text-white px-8 py-6 border-t border-white/20 shadow-inner mb-0">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Left: Logo & Name */}
        <div className="flex items-center gap-3">
          {/* If you want a logo here: */}
          <Image src="/logo.png" alt="Logo" width={30} height={30} className="rounded-md black" />
          <span className="text-lg font-semibold">© 2025 Yapton & District</span>
        </div>

        {/* Right: Links */}
        <div className="flex gap-6 text-sm">
          <Link href="/" className="hover:underline hover:text-white/80 transition">Home</Link>
          <Link href="/terms" className="hover:underline hover:text-white/80 transition">Terms</Link>
          <Link href="/ban-appeal" className="hover:underline hover:text-white/80 transition">Ban Appeal</Link>
          <Link href="/privacy" className="hover:underline hover:text-white/80 transition">Privacy</Link>
          <Link href="mailto:support@flatstudios.net" className="hover:underline hover:text-white/80 transition">Contact</Link>
          <Link href="https://www.roblox.com/games/5883938795/UPDATE-Yapton-and-District" className="hover:underline hover:text-blue-500/80 transition">Game</Link>
        </div>
      </div>
    </footer>
  );
}
