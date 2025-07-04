'use client';

import '@/styles/globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useEffect, useState } from 'react';
import { useRouter } from "next/router";

export default function App({ Component, pageProps }) {
   const router = useRouter();
     const hideNavbarRoutes = ["/auth/login", "/auth/register"];
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Try to load the user from localStorage
    const storedUser = localStorage.getItem('User');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Optional: Show a loading screen until user is loaded
  // if (!user) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  const shouldHideNavbar = hideNavbarRoutes.includes(router.pathname);

  return (
    <div className="flex flex-col min-h-screen bg-[url(/comet.png)] bg-cover bg-center text-white">
      {!shouldHideNavbar ?  <Navbar role={user?.role} user={user?.username} /> : <div />}
      <main className="flex-1">
        <Component {...pageProps} />
      </main>
      {!shouldHideNavbar ?  <Footer /> : <div />}

    </div>
  );
}
