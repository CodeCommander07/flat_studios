'use client';

import { useEffect, useState } from "react";
import CountUp from "@/components/CountUp";
import TiltedCard from "@/components/TiltedCard";
import TextType from "@/components/TextType";
import BackgroundCarousel from "@/components/BackgoundCarousel";
import HistoryTimeline from '@/components/HistoryTimeline';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";

export default function Home() {
  const [game, setGame] = useState(null);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/game/stats");
        const json = await res.json();
        setGame(json);
      } catch (err) {
        console.error("Failed to load game data", err);
      }
    }
    loadData();
  }, []);

  const members = game?.groupMembers ?? 0;
  const visits = game?.visits ?? 0;
  const roundedVisits = Math.floor((visits ?? 0) / 100000) * 100000;
  const current = game?.current ?? 0;

  const historyData = [
    {
      year: "2020",
      title: "The Beginning",
      details: [
        "Yapton & District launches its first version.",
        "Created by Flatcar under Skyway Group.",
        "Reached 1,000 Discord members milestone.",
        "Added first regional routes and operators.",
        "Introduced base map of Yapton Town."
      ],
    },
    {
      year: "2021",
      title: "Expansion and Growth",
      details: [
        "Version 3 released with improved gameplay and vehicles.",
        "Skyway disbanded to focus fully on Yapton & District.",
        "Hit 3,000 monthly player visits milestone.",
        "First major rebrand of the network lines.",
        "Introduced new ticketing system."
      ],
    },
    {
      year: "2022",
      title: "Version 4 Development",
      details: [
        "Version 4 development begins.",
        "New map and depot systems added.",
        "Introduction of lighting overhaul.",
        "Community milestones: 20,000 total visits.",
        "New logo and branding introduced."
      ],
    },
    {
      year: "2023",
      title: "v4 Release and Rebrand",
      details: [
        "Version 4 released in August.",
        "Achieved 300,000 visits milestone.",
        "Major backend rewrite for stability.",
        "New bus fleet added.",
        "Dynamic weather and traffic improvements."
      ],
    },
    {
      year: "2024",
      title: "The Modern Era",
      details: [
        "v4.1 update launched with visual overhaul.",
        "Over 1 million total visits milestone.",
        "Featured in Roblox Transport Showcase 2024.",
        "Added passenger system revamp.",
        "Introduced real-time tracking features."
      ],
    },
  ];

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-10 text-white space-y-10">
      <div className="w-full max-w-7xl">
        {/* 🎞️ Hero */}
        <div className="relative w-full h-[200px] rounded-2xl overflow-hidden mb-10 shadow-lg">
          <div className="absolute inset-0 z-0">
            <BackgroundCarousel
              images={[
                "/carosel/swb.png",
                "/carosel/ycb.png",
                "/carosel/ic.png",
                "/carosel/css.png",
              ]}
              interval={6000}
              transitionDuration={12000}
            />
          </div>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[1]" />
          <div className="relative z-[2] text-4xl flex flex-col items-center justify-center h-full text-center">
            <TextType
              text={[
                "Welcome to Yapton & District",
                "The future of virtual public transport",
                "Join thousands of players today!",
              ]}
              typingSpeed={75}
              pauseDuration={6000}
              showCursor={true}
              cursorCharacter="|"
            />
          </div>
        </div>

        {/* 🧩 Intro */}
        <div className="bg-[#283335] backdrop-blur-md border border-white/20 rounded-2xl shadow-lg p-10 text-center w-full mb-10">
          <p className="text-lg mb-6 leading-relaxed">
            Welcome to{" "}
            <span className="font-semibold text-blue-400">Yapton & District</span>, the ultimate destination for virtual bus enthusiasts on Roblox!
            Immerse yourself in the thrilling world of public transportation as you take the wheel in this exciting bus driving game.
            <br />
            <br />
            With over <strong>{roundedVisits.toLocaleString()}</strong> visits, our community is thriving with passionate players.
            <br />
            <br />
            Since its creation in 2020 by{" "}
            <span className="font-semibold text-blue-400">Flatcar</span>, Yapton & District has evolved through multiple versions, constantly pushing the boundaries of realism and innovation.
          </p>
        </div>

        {/* 📊 Stats */}
        <div className="relative w-full rounded-lg overflow-hidden mb-16">
          <div
            className="absolute inset-0 bg-[url('/statsbg.png')] bg-cover bg-center z-[0]"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[1]" />
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 w-full p-6 z-[2]">
            <TiltedCard
              containerHeight="160px"
              containerWidth="100%"
              rotateAmplitude={10}
              scaleOnHover={1.05}
              displayOverlayContent={true}
              overlayContent={
                <div className="w-full h-[160px] bg-white/10 border border-white/20 rounded-xl p-6 text-center shadow-lg flex flex-col items-center justify-center">
                  <h3 className="text-xl font-semibold text-blue-300 mb-2">
                    Group Members
                  </h3>
                  <p className="text-3xl font-bold">
                    <CountUp from={0} to={members} duration={1.5} />
                  </p>
                </div>
              }
            />
            <TiltedCard
              containerHeight="160px"
              containerWidth="100%"
              rotateAmplitude={10}
              scaleOnHover={1.05}
              displayOverlayContent={true}
              overlayContent={
                <div className="w-full h-[160px] bg-white/10 border border-white/20 rounded-xl p-6 text-center shadow-lg flex flex-col items-center justify-center">
                  <h3 className="text-xl font-semibold text-green-300 mb-2">
                    Active Players
                  </h3>
                  <p className="text-3xl font-bold">
                    <CountUp from={0} to={current} separator="," duration={2} />
                  </p>
                </div>
              }
            />
            <TiltedCard
              containerHeight="160px"
              containerWidth="100%"
              rotateAmplitude={10}
              scaleOnHover={1.05}
              displayOverlayContent={true}
              overlayContent={
                <div className="w-full h-[160px] bg-white/10 border border-white/20 rounded-xl p-6 text-center shadow-lg flex flex-col items-center justify-center">
                  <h3 className="text-xl font-semibold text-green-300 mb-2">
                    Total Visits
                  </h3>
                  <p className="text-3xl font-bold">
                    <CountUp from={0} to={visits} separator="," duration={2} />
                  </p>
                </div>
              }
            />
          </div>
        </div>

        <HistoryTimeline />
      </div>
    </main>
  );
}
