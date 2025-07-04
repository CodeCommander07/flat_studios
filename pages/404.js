'use client';
import Link from 'next/link';

export default function Custom404() {
  return (
    <main className="flex items-center justify-center pt-55 text-white px-4">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg p-10 max-w-md text-center">
        <h1 className="text-5xl font-bold mb-4">404</h1>
        <p className="text-lg mb-6">Oops! The page you’re looking for doesn’t exist.</p>
        <Link
          href="/"
          className="inline-block bg-white/20 hover:bg-white/30 transition px-6 py-2 rounded font-medium"
        >
          Return Home
        </Link>
      </div>
    </main>
  );
}
