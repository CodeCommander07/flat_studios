'use client';

import { useEffect, useState } from "react";
import CountUp from "@/components/CountUp";
import TiltedCard from "@/components/TiltedCard";
import TextType from "@/components/TextType";
import BackgroundCarousel from "@/components/BackgoundCarousel";

export default function Home() {
  const [game, setGame] = useState(null);

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

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-10 text-white space-y-10">
      <div className="w-full max-w-7xl">
        <div className="relative w-full h-[200px] rounded-2xl overflow-hidden mb-10 shadow-lg">

          <div className="absolute inset-0 z-0">
            <BackgroundCarousel
              images={[
                "/carosel/swb.png",
                "/carosel/ycb.png",
                "/carosel/ic.png",
                "/carosel/css.png",
              ]}
              interval={6000}          // 5 seconds per slide
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

        {/* Intro Box */}
        <div className="bg-[#283335] backdrop-blur-md border border-white/20 rounded-2xl shadow-lg p-10 text-center w-full mb-10">
          <p className="text-lg mb-6 leading-relaxed">
            Welcome to{" "}
            <span className="font-semibold text-blue-400">Yapton & District</span>, the ultimate destination for virtual bus enthusiasts on Roblox! Immerse yourself in the thrilling world of public transportation as you take the wheel in this exciting bus driving game.
            <br />
            <br />
            With over <strong>{roundedVisits.toLocaleString()}</strong> visits, our community is bustling with passionate players who share a love for the open road.
            <br />
            <br />
            In 2020,{" "}
            <span className="font-semibold text-blue-400">Flatcar</span>, an avid aviation enthusiast on Roblox, conceived the idea of creating the game "Yapton & District" to financially support his burgeoning aviation alliance,{" "}
            <em>Skyway</em>. As the game continued to expand, the financial vulnerabilities of alliances made them unprofitable, resulting in Skyway's closure in mid-2021 with full focus now on Yapton & District.
            <br />
            <br />
            Since then, the game has been thriving through version 3 and into version 4 — with <strong>version 4.1</strong> on the horizon.
            <br />
            <br />
            Read all about the game's history and get the latest news below 👇
          </p>
        </div>

        <div className="relative w-full rounded-lg overflow-hidden">

          <div
            className="absolute inset-0 bg-[url('/statsbg.png')] bg-cover bg-center z-[0]"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[1]" />


          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 w-full p-6 md:place-items-stretch place-items-center z-[2]">

            <div className="w-full">
              <TiltedCard
                containerHeight="160px"
                containerWidth="100%"
                rotateAmplitude={10}
                scaleOnHover={1.05}
                showMobileWarning={false}
                displayOverlayContent={true}
                showTooltip={false}
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
            </div>

            <div className="w-full">
              <TiltedCard
                containerHeight="160px"
                containerWidth="100%"
                rotateAmplitude={10}
                scaleOnHover={1.05}
                showMobileWarning={false}
                displayOverlayContent={true}
                showTooltip={false}
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
            </div>
            <div className="w-full">
              <TiltedCard
                containerHeight="160px"
                containerWidth="100%"
                rotateAmplitude={10}
                scaleOnHover={1.05}
                showMobileWarning={false}
                displayOverlayContent={true}
                showTooltip={false}
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
        </div>
      </div>
    </main>
  );
}
