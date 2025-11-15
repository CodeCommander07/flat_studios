'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function JoinServerPage() {
  const router = useRouter();
  const { server } = router.query;

  const [failed, setFailed] = useState(false);

  const PLACE_ID = "5883938795"; // your game ID

  useEffect(() => {
    if (!server) return;

    // URL-encode launch data
    const launchData = encodeURIComponent(JSON.stringify({ jobId: server }));

    const deepLink = `roblox://placeId=${PLACE_ID}&launchData=${launchData}`;

    // Try to open Roblox
    const start = Date.now();
    window.location.href = deepLink;

    // If Roblox did not capture the URL in time → show fallback
    setTimeout(() => {
      const now = Date.now();
      if (now - start < 1600) {
        setFailed(true);
      }
    }, 1500);
  }, [server]);

  if (!server) {
    return (
      <div className="flex items-center justify-center bg-[#283335] min-h-screen text-white text-xl">
        Missing server ID (?server=jobId)
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#283335] text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-2">Joining Server…</h1>
      <p className="text-white/60 mb-6">
        Trying to open Roblox with job ID: <span className="text-yellow-400">{server}</span>
      </p>

      {!failed ? (
        <div className="animate-pulse text-blue-300 text-lg">
          Launching Roblox…
        </div>
      ) : (
        <div className="text-center">
          <p className="text-red-400 mb-4">Roblox didn't open.</p>
          <a
            href={`https://www.roblox.com/games/${PLACE_ID}`}
            target="_blank"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold inline-block"
          >
            Open Game Page
          </a>
        </div>
      )}
    </main>
  );
}
