'use client';
import '@/styles/globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { SpeedInsights } from "@vercel/speed-insights/next";
import DotGridWrapper from '@/components/DotGridWrapper'; 
import Banner from '@/components/Banner';
import ConsentAndNewsletter from '@/components/ConsentAndNewsletter';

export default function App({ Component, pageProps, router }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/internal/run-scheduler').catch(() => {});
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('User');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const title = `${process.env.NODE_ENV === "development" ? "Dev | " :""}Yapton | Flat Studios`;

const privateRoutes = [
    '/hub',
    '/hub+',
    '/dev',
    '/admin',
    '/me',
  ];

  const isPrivate = privateRoutes.some(path =>
    router.pathname.startsWith(path)
  );

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
       {!isPrivate && <ConsentAndNewsletter />}

      <div className="relative flex flex-col min-h-screen text-white overflow-hidden">
        {/* 🚌 Background image */}
        <div className="fixed inset-0 z-0 bg-[url(/comet.png)] bg-cover bg-center" />

        {/* ✨ Animated DotGrid overlay */}
        <div className="fixed inset-0 z-[2] pointer-events-none">
          <DotGridWrapper
            dotSize={10}
            gap={28}
            baseColor="#4d4d4d"
            activeColor="#123456"
            proximity={180}
            className="h-full w-full opacity-30"
          />
        </div>

        {/* 🖤 Subtle blur overlay */}
        <div className="fixed inset-0 z-[1] bg-black/57 backdrop-blur-md" />

        {/* 🧭 Foreground content */}
        <div className="relative z-[3] flex flex-col min-h-screen">
          {/* 🟢 Global banner at very top */}
          <Banner />

          <Navbar role={user?.role} user={user?.username} />
          <main className="flex-1">
            <Component {...pageProps} />
            <SpeedInsights/>
          </main>
         <Footer />
        </div>
      </div>
    </>
  );
}
