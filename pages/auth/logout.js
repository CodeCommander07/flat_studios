'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    localStorage.removeItem('User'); // Clear user data
    router.replace('/'); // Redirect to home (change path as needed)
  }, [router]);

  return (
    <main className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
      <p>Logging out...</p>
    </main>
  );
}
