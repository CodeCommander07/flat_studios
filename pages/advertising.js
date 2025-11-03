'use client';

export default function AdvertisingPage() {
  return (
    <main className="text-white px-6 py-12 flex justify-center items-center min-h-[calc(100vh-100px)]">
      <div className="max-w-4xl w-full bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl p-8 shadow-xl text-center">
        <h1 className="text-4xl font-bold mb-6 text-blue-400">
          Advertising with Yapton & District
        </h1>

        <section className="space-y-8 text-white/80 leading-relaxed text-left">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Why advertise with us?</h2>
            <p>
              • Reach a vibrant community of bus enthusiasts on Roblox — over 1.4 million visits and growing.  
              • Align your brand with a high-quality, immersive transport simulation experience.  
              • Benefit from prominent placement, custom campaigns, and measurable results.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">Advertising Opportunities</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>In-Game Billboard & Vehicle Wraps:</strong> Your brand appears in-game on buses, stops and garage interiors.</li>
              <li><strong>Website & Social Media Sponsorships:</strong> Featured banners and posts across the Yapton & District network.</li>
              <li><strong>Dedicated Campaigns:</strong> We’ll create bespoke events, challenges or content integrations tailored to you.</li>
              <li><strong>Analytics & Reporting:</strong> Monthly insight on impressions, reach and community engagement.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">Pricing & Packages</h2>
            <p>
              We offer flexible packages — from starter placements to full-scale brand integrations. Please contact us for a tailored quote.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">How to Get Started</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Reach out to us at <a href="mailto:help@flatstudios.net" className="text-blue-400 underline hover:text-blue-300">help@flatstudios.net</a> with your brand, goals and budget.</li>
              <li>We’ll send you a media kit and custom plan based on your campaign objectives.</li>
              <li>Once approved, we’ll deploy creative assets and launch your campaign — tracking begins from day one.</li>
            </ol>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">Terms & Conditions</h2>
            <p>
              All advertising content must adhere to the Roblox Community Standards and our brand-safe environment. We reserve the right to reject or remove ads that violate policy or harm community experience.
            </p>
          </div>

          <div>
            <p className="text-sm text-white/60 pt-4 border-t border-white/10 text-center">
              Yapton &amp; District · Flat Studios © 2025 · All rights reserved.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
