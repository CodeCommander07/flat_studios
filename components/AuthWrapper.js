'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hasAccessTo } from '@/utils/permissions';

export default function AuthWrapper({ children, requiredPage = null }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('User'));

    if (!storedUser) {
      router.replace('/auth/login');
    } else if (
      requiredPage &&
      !hasAccessTo(requiredPage, storedUser.role)
    ) {
      router.replace('/unauthorised');
    } else {
      setUser(storedUser);
      setLoading(false);
    }
  }, [requiredPage]);

  if (loading) return <p>Loading...</p>;

  return <>{children}</>;
}
