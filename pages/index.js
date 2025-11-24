'use client';

import { useEffect, useState } from "react";
import CountUp from "@/components/CountUp";
import TiltedCard from "@/components/TiltedCard";
import TextType from "@/components/TextType";
import BackgroundCarousel from "@/components/BackgoundCarousel";
import HistoryTimeline from '@/components/HistoryTimeline';
import axios from "axios";
import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock } from "lucide-react";

export default function Home() {
  const [game, setGame] = useState(null);
  const [stats, setStats] = useState(null);
  const [stats2, setStats2] = useState(null);
  const [stats3, setStats3] = useState(null);
  const [featuredArticles, setFeaturedArticles] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/game/stats");
        const [res1, res2, res3] = await Promise.all([
          axios.get('/api/ycc/routes'),
          axios.get('/api/ycc/stops'),
          axios.get('/api/ycc/operators/active'),
        ]);
        setStats(res1.data.routes);
        setStats2(res2.data.stops);
        setStats3(res3.data.submissions);
        const json = await res.json();
        setGame(json);

        const articlesRes = await fetch("/api/content?type=article&status=published");
        const articleJson = await articlesRes.json();
        setFeaturedArticles(articleJson.items.slice(0, 3));
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
        <ScrollReveal>
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
        </ScrollReveal>
        <ScrollReveal>
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
        </ScrollReveal>
        <ScrollReveal>
          <div className="relative w-full rounded-lg overflow-hidden mb-10">
            <div
              className="absolute inset-0 bg-[url('/statsbg.png')] bg-cover bg-center z-[0]"
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[1]" />
            <div className="relative z-[2] w-full py-6 flex justify-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide drop-shadow-lg">
                Game Statistics Overview
              </h2>
            </div>
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 w-full p-6 z-[2]">
              <TiltedCard
                containerHeight="160px"
                containerWidth="100%"
                rotateAmplitude={10}
                scaleOnHover={1.05}
                displayOverlayContent={true}
                overlayContent={
                  <div className="w-full h-[160px] bg-[#283335] border border-white/20 rounded-xl p-6 text-center shadow-lg flex flex-col items-center justify-center">
                    <h3 className="text-xl font-semibold text-blue-300 mb-2">
                      Group Members
                    </h3>
                    <p className="text-3xl font-bold">
                      <CountUp from={0} to={members} separator="," duration={1.5} />
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
                  <div className="w-full h-[160px] bg-[#283335] border border-white/20 rounded-xl p-6 text-center shadow-lg flex flex-col items-center justify-center">
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
                  <div className="w-full h-[160px] bg-[#283335] border border-white/20 rounded-xl p-6 text-center shadow-lg flex flex-col items-center justify-center">
                    <h3 className="text-xl font-semibold text-orange-300 mb-2">
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
        </ScrollReveal>
        <ScrollReveal>
          <div className="bg-[#283335] backdrop-blur-md border border-white/20 mb-10 rounded-2xl shadow-xl p-8 mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">Featured Articles</h2>
              <Link
                href="/content"
                className="text-blue-300 hover:text-blue-400 text-sm font-semibold"
              >
                View All Articles →
              </Link>
            </div>

            {featuredArticles.length === 0 ? (
              <p className="text-white/60">No published articles yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredArticles.map((post) => (
                  <Link
                    key={post._id}
                    href={`/content/${post.slug}`}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-lg hover:bg-[#283335] transition flex flex-col"
                  >
                    {post.coverImage?.url && (
                      <Image
                        src={post.coverImage.url}
                        alt={post.coverImage.alt || post.title}
                        width={400}
                        height={160}
                        className="rounded-xl mb-3 w-full h-40 object-cover border border-white/10"
                      />
                    )}

                    <h3 className="text-xl font-semibold mb-1">{post.title}</h3>

                    <p className="text-white/60 text-sm line-clamp-2 mb-3">
                      {post.excerpt}
                    </p>

                    <div className="mt-auto flex items-center gap-3 text-xs text-white/50">
                      {post.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}

                      {post.readingTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.readingTime} min read
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>
        <ScrollReveal>
          <div className="relative w-full rounded-lg overflow-hidden mb-10">
            <div
              className="absolute inset-0 bg-[url('/statsbg2.png')] bg-cover bg-center z-[0]"
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[1]" />
            <div className="relative z-[2] w-full py-6 flex justify-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide drop-shadow-lg">
                Yapton & District Network Stats
              </h2>
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 w-full p-6 z-[2]">
              <TiltedCard
                containerHeight="160px"
                containerWidth="100%"
                rotateAmplitude={10}
                scaleOnHover={1.05}
                displayOverlayContent={true}
                overlayContent={
                  <div className="w-full h-[160px] bg-[#283335] border border-white/20 rounded-xl p-6 text-center shadow-lg flex flex-col items-center justify-center">
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">
                      Total Routes
                    </h3>
                    <p className="text-3xl font-bold">
                      <CountUp from={0} to={stats?.length ?? 0} separator="," duration={1.5} />
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
                  <div className="w-full h-[160px] bg-[#283335] border border-white/20 rounded-xl p-6 text-center shadow-lg flex flex-col items-center justify-center">
                    <h3 className="text-xl font-semibold text-lime-300 mb-2">
                      Total Operators
                    </h3>
                    <p className="text-3xl font-bold">
                      <CountUp from={0} to={stats3?.length ?? 0} separator="," duration={2} />
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
                  <div className="w-full h-[160px] bg-[#283335] border border-white/20 rounded-xl p-6 text-center shadow-lg flex flex-col items-center justify-center">
                    <h3 className="text-xl font-semibold text-fuchsia-300 mb-2">
                      Total Stops
                    </h3>
                    <p className="text-3xl font-bold">
                      <CountUp from={0} to={stats2?.length ?? 0} separator="," duration={2} />
                    </p>
                  </div>
                }
              />
            </div>
          </div>
        </ScrollReveal>
        <ScrollReveal>
          <HistoryTimeline />
        </ScrollReveal>
        <ScrollReveal>
          <div className="text-center bg-[#283335]/95 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl relative mt-10">
            <h1 className="text-3xl font-bold">Want to be an operator?</h1>
            <p className="text-sm text-white/60 mt-2 mb-5">
              Apply to be an operator
            </p>
            <a
              href="/ycc/operators/request"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full font-semibold transition"
            >
              Submit Operator
            </a>
          </div>
        </ScrollReveal>
      </div>
    </main>
  );
}
