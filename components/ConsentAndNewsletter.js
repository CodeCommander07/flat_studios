'use client';
import { useEffect, useState } from 'react';

export default function ConsentAndNewsletter() {
  const [showConsent, setShowConsent] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  async function subscribe() {
    if (!email.trim()) {
      setMessage("Please enter an Email.");
      return;
    }
    if (!username.trim()) {
      setMessage("Please enter a Username.");
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/newsletters', {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          username
        })
      });

      if (!res.ok) throw new Error("Failed");

      // ✅ never show popup again
      localStorage.setItem("newsletterSubscribed", "true");

      setMessage("✅ Subscribed!");

      setTimeout(() => {
        closePopup();
      }, 1200);

    } catch (e) {
      setMessage("❌ Failed, try again.");
    }

    setSubmitting(false);
  }

  // ✅ detect logged in user
  const isLoggedIn = (() => {
    try {
      const user = JSON.parse(localStorage.getItem("User") || "{}");
      return !!user?._id;
    } catch {
      return false;
    }
  })();

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);

    const consent = localStorage.getItem('siteConsent');
    const nextShow = localStorage.getItem('newsletterNextShow');

    // ✅ Already accepted cookies
    if (!consent) setShowConsent(true);

    // ✅ Block newsletter if logged in
    if (isLoggedIn) return;

    // ✅ 7-day suppression
    if (nextShow && Date.now() < Number(nextShow)) return;

    // ✅ wait for consent before showing popup
    if (consent === 'accepted') {
      if (isMobile) {
        setTimeout(() => setShowPopup(true), 15000 + Math.random() * 5000);
      } else {
        setShowPopup(true);
      }
    }
  }, []);

  function acceptConsent() {
    localStorage.setItem('siteConsent', 'accepted');

    // ✅ enable GA + Ads
    window.gtag?.('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'granted',
      ad_personalization: 'granted',
      ad_user_data: 'granted'
    });

    setShowConsent(false);

    setTimeout(() => setShowPopup(true), 2000);
  }

  function denyConsent() {
    localStorage.setItem('siteConsent', 'denied');

    window.gtag?.('consent', 'update', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_personalization: 'denied',
      ad_user_data: 'denied'
    });

    setShowConsent(false);
  }

  function closePopup() {
    setShowPopup(false);
    localStorage.setItem(
      'newsletterNextShow',
      Date.now() + 7 * 24 * 60 * 60 * 1000 // ✅ 7 days
    );
  }

  return (
    <>
      {/* ✅ CONSENT BANNER */}
      {showConsent && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/90 text-white p-4 z-[9999]">
          <p className="text-sm mb-2">
            We use cookies for analytics and personalised ads. Allow?
          </p>
          <div className="flex gap-2">
            <button onClick={acceptConsent}
              className="px-4 py-2 bg-green-600 rounded">
              Accept
            </button>
            <button onClick={denyConsent}
              className="px-4 py-2 bg-gray-600 rounded">
              Reject
            </button>
          </div>
        </div>
      )}

      {/* ✅ NEWSLETTER POPUP */}
      {showPopup && (
        <div className="fixed bottom-4 right-4 z-[9999] animate-slide-up">
          <div className="relative bg-[#283335] backdrop-blur-md border border-white/10 shadow-xl rounded-2xl w-80 p-4 text-white">

            {/* Close Button */}
            <button
              onClick={closePopup}
              className="absolute top-2 right-2 text-white/60 hover:text-white transition"
            >
              ✕
            </button>

            <h3 className="font-bold text-lg mb-1">Subscribe?</h3>
            <p className="text-sm text-white/60 mb-4">
              Get updates & announcements.
            </p>

            <input
              type="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full bg-[#283335] border border-white/20 text-white p-2 rounded-lg placeholder-white/40 mb-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />

            <input
              type="text"
              value={username}
              required
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Roblox Username"
              className="w-full bg-[#283335] border border-white/20 text-white p-2 rounded-lg placeholder-white/40 mb-3 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />

            {message && (
              <p className="text-xs text-center mb-2 text-white/70">
                {message}
              </p>
            )}

            <button
              disabled={submitting}
              onClick={subscribe}
              className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-2 rounded-lg font-semibold shadow-md transition ${submitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              {submitting ? "Subscribing..." : "Subscribe"}
            </button>
          </div>
        </div>
      )}
      <style jsx>{`
        .animate-slide-up {
          animation: slideUp 0.4s ease forwards;
        }
        @keyframes slideUp {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
