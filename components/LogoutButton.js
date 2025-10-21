import { useRouter } from 'next/router';

export default function YourComponent() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('User');
    router.push('/');
  };

  return (
    <button
      onClick={handleLogout}
      className="block px-4 py-2 hover:bg-black/20 text-left w-full"
      type="button"
    >
      Logout
    </button>
  );
}
