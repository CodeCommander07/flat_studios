'use servers';
import '@/styles/globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from "next/router";
import { SpeedInsights } from "@vercel/speed-insights/next";
import DotGridWrapper from '@/components/DotGridWrapper'; 

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const hideNavbarRoutes = ["/auth", "/auth/login", "/auth/register", "/auth/reset-password", "/auth/staff/register"];
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/internal/run-scheduler').catch(() => {});
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('User');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const title = `Yapton | Flat Studios`;
  const shouldHideNavbar = hideNavbarRoutes.includes(router.pathname);

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <div className="relative flex flex-col min-h-screen text-white overflow-hidden">
        {/* 🚌 Background image (your bus/comet) */}
        <div className="fixed inset-0 z-0 bg-[url(/comet.png)] bg-cover bg-center" />

        {/* ✨ Animated DotGrid overlay (on top of bus) */}
        <div className="fixed inset-0 z-[2] pointer-events-none">
          <DotGridWrapper
            dotSize={10}
            gap={28}
            baseColor="#283335"
            activeColor="#B49BFF"
            proximity={180}
            className="h-full w-full opacity-30"
          />
        </div>

        {/* 🖤 Subtle blur overlay for readability */}
        <div className="fixed inset-0 z-[1] bg-black/75 backdrop-blur-md" />

        {/* 🧭 Foreground content */}
        <div className="relative z-[3] flex flex-col min-h-screen">
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
