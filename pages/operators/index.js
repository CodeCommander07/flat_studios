'use client';
import Image from 'next/image';
import { useState } from 'react';

export default function Home() {
  const companies = [
    {
      title: 'IRVING Coaches',
      description: 'Part of the FlatStudios Group.',
      logo: '/logos/ycb.png',
      url: 'https://discord.gg/53EGGRJ62f',
    },
    {
      title: 'South West Buses',
      description: 'Part of the South West Group.',
      logo: '/logos/cowie.png',
      url: 'https://discord.gg/AN5eAnQ7gf',
    },
    {
      title: 'Yapton Countrybus',
      description: '',
      logo: '/logos/ic.png',
      url: 'https://discord.gg/3Snwhwu4rj3',
    },
    {
      title: 'Slowcoach',
      description: '',
      logo: '/logos/slowcoach.png',
      url: 'https://discord.gg/DANwX9bEd3',
    },
  ];

  const [form, setForm] = useState({
    email: '',
    robloxUsername: '',
    discordTag: '',
    operatorName: '',
    discordInvite: '',
    robloxGroup: '',
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const res = await fetch('/api/operators/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      alert('Submitted successfully!');
      setForm({ });
    } else {
      alert('Error submitting. Please try again.');
    }
  } catch (error) {
    console.error(error);
    alert('Server error.');
  }
};

  return (
    <main className="flex flex-col gap-16 items-center justify-center px-4 py-20 text-white max-w-7xl mx-auto">
      {companies.map((company, idx) => (
        <div
          key={idx}
          className={`flex flex-col md:flex-row ${
            idx % 2 !== 0 ? 'md:flex-row-reverse' : ''
          } items-center gap-10 bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-lg w-full`}
        >
          {/* Logo */}
          <div className="w-full md:w-1/2 flex justify-center">
            <div className="w-64 h-64 bg-black/20 rounded-xl flex items-center justify-center overflow-hidden">
              <Image
                src={company.logo}
                alt={`${company.title} Logo`}
                width={200}
                height={200}
                className="object-contain"
              />
            </div>
          </div>

          {/* Text & Link */}
          <div className="w-full md:w-1/2 text-left space-y-4">
            <h2 className="text-3xl font-bold">{company.title}</h2>
            <p className="text-white/80">{company.description}</p>
            <a
              href={company.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-full font-semibold transition"
            >
              Join Discord
            </a>
          </div>
        </div>
      ))}

      {/* Contact Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl shadow-lg p-10 space-y-6"
      >
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Submit Your Operator
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Column 1 */}
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Roblox Username</label>
              <input
                type="text"
                name="robloxUsername"
                value={form.robloxUsername}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
                placeholder="CodeCmdr"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Discord Tag</label>
              <input
                type="text"
                name="discordTag"
                value={form.discordTag}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
                placeholder="user#0001"
                required
              />
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-1">Operator Name</label>
              <input
                type="text"
                name="operatorName"
                value={form.operatorName}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
                placeholder="Stagecoach Roblox"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Discord Invite</label>
              <input
                type="text"
                name="discordInvite"
                value={form.discordInvite}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
                placeholder="https://discord.gg/xyz"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Roblox Group Link</label>
              <input
                type="text"
                name="robloxGroup"
                value={form.robloxGroup}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
                placeholder="https://www.roblox.com/groups/..."
                required
              />
            </div>
          </div>
        </div>

        <div className="text-center pt-6">
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full font-semibold transition"
          >
            Submit Operator
          </button>
        </div>
      </form>
    </main>
  );
}
