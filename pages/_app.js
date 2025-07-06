'use client';

import '@/styles/globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from "next/router";

export default function App({ Component, pageProps }) {
   const router = useRouter();
     const hideNavbarRoutes = ["/auth", "/auth/login", "/auth/register", "/auth/reset-password", "/auth/staff/register"];
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('User');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const segments = router.pathname.split('/').filter(Boolean);
  const lastSegment = segments.length === 0 ? 'Home' : segments[segments.length - 1];
  const pageTitle = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);

  const title = `${pageTitle} | Flat Studios`;


  const shouldHideNavbar = hideNavbarRoutes.includes(router.pathname);

  return (<>
    <Head>
      <title>{title}</title>
    </Head>
    <div className="flex flex-col min-h-screen bg-[url(/comet.png)] bg-cover bg-center text-white">
      {!shouldHideNavbar ?  <Navbar role={user?.role} user={user?.username} /> : <div />}
      <main className="flex-1">
        <Component {...pageProps} />
      </main>
      {!shouldHideNavbar ?  <Footer /> : <div />}

    </div>
    </>
  );
}
