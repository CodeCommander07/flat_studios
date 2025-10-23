'use client';

import '@/styles/globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from "next/router";
import { SpeedInsights } from "@vercel/speed-insights/next"

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const hideNavbarRoutes = ["/auth", "/auth/login", "/auth/register", "/auth/reset-password", "/auth/staff/register"];
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Try to run scheduler on page load (non-blocking)
    fetch('/api/internal/run-scheduler').catch(() => {});
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('User');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const title = `Yapton | Flat Studios`;

  const shouldHideNavbar = hideNavbarRoutes.includes(router.pathname);

  return (<>
    <Head>
      <title>{title}</title>
    </Head>
    <div className="relative flex flex-col min-h-screen text-white">
      {/* Black overlay with blur */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-0"></div>

      {/* Background image */}
      <div className="fixed inset-0 bg-[url(/comet.png)] bg-cover bg-center z-[-1]"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {!shouldHideNavbar ? <Navbar role={user?.role} user={user?.username} /> : <div />}
        <main className="flex-1">
          <Component {...pageProps} />
          <SpeedInsights/>
        </main>
        {!shouldHideNavbar ? <Footer /> : <div />}
      </div>
    </div>

  </>
  );
}