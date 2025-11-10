'use client';
import axios from 'axios';
import { useEffect, useState, useMemo } from 'react';
import LogoLoop from '@/components/LogoLoop';

export default function Home() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const res = await axios.get('/api/ycc/operators/active');
        setCompanies(res.data.submissions || []);
        console.log('Loaded companies:', res.data.submissions);
      } catch (err) {
        console.error('Failed to load operators:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCompanies();
  }, []);

  // 🧩 Build logos array dynamically when companies update
  const logos = useMemo(
    () =>
      companies
        .filter((c) => c.logo) // only include ones with a logo
        .map((c) => ({
          src: c.logo,
          alt: c.operatorName || 'Operator Logo',
        })),
    [companies]
  );

  return (
    <main className="flex flex-col gap-16 items-center justify-center px-4 py-20 text-white max-w-7xl mx-auto">
      {loading && <p className="text-white/50">Loading operators...</p>}

      {!loading && companies.length === 0 && (
        <p className="text-white/50">No active operators found.</p>
      )}

      {!loading && logos.length > 0 && (
        <LogoLoop
          logos={logos}
          speed={20}
          direction="left"
          fadeOut
          fadeOutColor="rgb(15,23,42)"
          scaleOnHover
          className="max-w-7xl"
        />
      )}

      {companies.map((company, idx) => (
        <div
          key={company._id || idx}
          className={`flex flex-col md:flex-row ${
            idx % 2 !== 0 ? 'md:flex-row-reverse' : ''
          } items-center gap-10 bg-[#283335] border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-lg w-full`}
        >
          {/* 🖼️ Logo */}
          <div className="w-full md:w-1/2 flex justify-center">
            <div className="w-64 h-64 bg-black/20 rounded-xl flex items-center justify-center overflow-hidden">
              {company.logo ? (
                <img
                  src={company.logo}
                  alt={`${company.operatorName || 'Unknown'} Logo`}
                  className="object-contain w-full h-full"
                />
              ) : (
                <div className="text-gray-400 text-sm">No Logo</div>
              )}
            </div>
          </div>

          {/* 🧾 Text & Links */}
          <div className="w-full md:w-1/2 text-left space-y-4">
            <h2 className="text-3xl font-bold">{company.operatorName}</h2>
            <p className="text-white/80">
              Owned & Operated by: {company.robloxUsername}
            </p>
            {company.description && (
              <p className="text-white/80">{company.description}</p>
            )}
<div className='grid grid-cols-3 sm:gid-cols-1 gap-2'>
              <a
                href={`/ycc/operators/${company.slug}`}
                className="text-center inline-block mt-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-full font-semibold transition"
              >
                View Operator
              </a>
            {company.discordInvite && (
              <a
              href={company.discordInvite}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center inline-block mt-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-full font-semibold transition"
              >
                Discord
              </a>
            )}

            {company.robloxGroup && (
              <a
              href={company.robloxGroup}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center inline-block mt-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-full font-semibold transition"
              >
                Roblox Group
              </a>
            )}
            </div>
          </div>
        </div>
      ))}
    </main>
  );
}
