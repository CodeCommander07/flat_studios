'use client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('User');
    router.push('/auth/');
  };

  return (
    <button
      onClick={handleLogout}
      className="block w-full text-left px-4 py-2 hover:bg-white/10 text-md transition"
    >
      Logout
    </button>
  );
}
