'use server';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { Check, Clipboard, Menu, X } from 'lucide-react';

const scenarios = [
  { id: '01', type: "Admin", title: 'A27(M) CLOSED Junction 0 - 1 BUS FIRE', desc: "This is the first approved scenario that can be used for shifts and impacts all routes using the motorway from junction 0 to junction 1 both ways due a bus fire.", adminCmd: "To use:", cmd: ":BusFire" },
  { id: '02', type: "Admin", title: 'Seafront CLOSED Yapton - Yapton Industrial Estate', desc: "The seafront has been closed due to roadworks.", adminCmd: "To use:", cmd: ":Seaf" },
  { id: '03', type: "Admin", title: 'Music Festival', desc: "A music festival is being held at Ford. [REQUIRES BTOOLS TO OPEN GATE (CD+)]", adminCmd: "To use:", cmd: ":Festival" },
  {
    id: '04', type: "Staff", title: 'Event at School', extraInfo: "(E.G School production)", desc: `School routes (to be hosted at suitable times (UK time) E.G 8-9am & 15:00 - 16:00)`
  },
  { id: '05', type: "Staff", title: 'Events at Airport', extraInfo: "Bank holiday getaway (check it's actually a bank holiday in England prior)/ peak time travel", desc: `Poor weather keeping planes grounded` },
  { id: '06', type: "Staff", title: 'Rail Replacement', desc: `Broken down train/issue on the line [SWB only operates RR]` },
  { id: '07', type: "Staff", title: 'Holmbush', desc: `Sale now on` },
  { id: '08', type: "Staff", title: 'Flansham Centre', desc: `New production/musical` },
  { id: '09', type: "Staff", title: 'Ford WWT (wildfowl wetlands trust)', desc: `Event on` },
  { id: '10', type: "Staff", title: 'Trading Estate', desc: `Rush hour` },
  { id: '11', type: "Staff", title: 'A New Bar', desc: `A new bar has opened in [insert place name]; [insert route number] services will be busy.` },
  { id: '12', type: "Staff", title: 'Charter Service', desc: `Charter service has been requested at [insert place name]` },
  { id: '13', type: "Staff", title: 'Traffic Collision', desc: `[insert place name] has had a major traffic collision and (optional) no buses can enter and all are diverting to [insert place name]` },
  { id: '14', type: "Staff", title: 'Network Rail Shutdown', desc: `Network Rail have ceased all operations due to a storm, run rail replacements.` },
  { id: '15', type: "Staff", title: 'Airport Diversion', desc: `Heathrow Airport (or another one) had been hit with bad winds. Some flights have been diverted to Yapton, run route [insert route number]` },
  { id: '16', type: "Staff", title: 'Evening Festival', desc: `A musical festival is taking place on [insert place name] tonight, run shuttle buses` },
  { id: '17', type: "Staff", title: 'School Coach Hire', desc: `Ford Secondary School has hired [IC/SWB] to run coaches to [insert place name]` },
  { id: '18', type: "Staff", title: 'Photography Event', desc: `[insert place name] is hosting a photography event, run [insert route number] to take people there.` },
];

export default function ScenariosPage() {
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('shiftId');
  const selectedScenario = scenarios.find(s => s.id === selectedId);

  const adminScenarios = scenarios.filter(s => s.type === 'Admin');
  const staffScenarios = scenarios.filter(s => s.type === 'Staff');

  const [copied, setCopied] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const handleCopy = () => {
    if (!selectedScenario) return;
    navigator.clipboard.writeText(selectedScenario.desc);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightScenarioTitle = (desc) => {
    const match = desc.match(/^Scenario\s\d+\s-\s.+/m);
    if (!match) return <pre className="whitespace-pre-wrap">{desc}</pre>;

    const scenarioTitle = match[0];
    const rest = desc.replace(scenarioTitle, '').trim();

    return (
      <div className="whitespace-pre-wrap">
        <p className="font-semibold text-yellow-300">{scenarioTitle}</p>
        <p className="mt-2">{rest}</p>
      </div>
    );
  };

  return (
    <main className="text-white bg-black/50 max-h-[calc(100vh-163px)] flex relative">
      {/* Mobile scenario list toggle button */}
      {!showSidebar && (
        <button
          className="md:hidden fixed top-4 left-4 z-50 bg-blue-600 p-2 rounded-md hover:bg-blue-700 transition"
          onClick={() => setShowSidebar(true)}
          aria-label="Show scenarios list"
        >
          <Menu className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Sidebar on desktop */}
      <aside className="hidden md:block w-72 bg-white/5 border-r border-white/10 p-4 space-y-2 text-white max-h-screen overflow-y-auto">
        <h2 className="text-xl font-semibold mb-2">Admin Scenarios</h2>
        {adminScenarios.map(s => (
          <Link
            key={s.id}
            href={`?shiftId=${s.id}`}
            scroll={false}
            className={`block p-2 rounded-lg border transition ${selectedId === s.id
                ? 'bg-red-500 border-red-400 text-white'
                : 'border-red-300/20 hover:bg-red-400/20 text-white/90'
              }`}
          >
            {s.title}
          </Link>
        ))}

        <hr className="my-4 border-white/20" />

        <h2 className="text-xl font-semibold mb-2">Staff Scenarios</h2>
        {staffScenarios.map(s => (
          <Link
            key={s.id}
            href={`?shiftId=${s.id}`}
            scroll={false}
            className={`block p-2 rounded-lg border transition ${selectedId === s.id
                ? 'bg-blue-500 border-blue-400 text-white'
                : 'border-blue-300/20 hover:bg-blue-400/20 text-white/80'
              }`}
          >
            {s.title}
          </Link>
        ))}
      </aside>

      {/* Mobile sidebar (full screen overlay) */}
      {showSidebar && (
        <>
          <div
            className="fixed inset-0 bg-black z-40"
            onClick={() => setShowSidebar(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-0 z-50 bg-white/5 pt-20 p-6 overflow-y-auto text-white">
            {/* Close button (moved to top-left to replace hamburger) */}
            <button
              className="md:hidden fixed top-4 left-4 z-50 bg-blue-600 p-2 rounded-md hover:bg-blue-700 transition"
              onClick={() => setShowSidebar(false)}
              aria-label="Close scenarios list"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-xl mt-2 font-semibold mb-4">Admin Scenarios</h2>
            {adminScenarios.map(s => (
              <Link
                key={s.id}
                href={`?shiftId=${s.id}`}
                scroll={false}
                onClick={() => setShowSidebar(false)}
                className={`block p-3 m-2 rounded-lg border transition ${selectedId === s.id
                    ? 'bg-red-500 border-red-400 text-white'
                    : 'border-red-300/20 hover:bg-red-400/20 text-white/90'
                  }`}
              >
                {s.title}
              </Link>
            ))}

            <hr className="my-6 border-white/20" />

            <h2 className="text-xl font-semibold mb-4">Staff Scenarios</h2>
            {staffScenarios.map(s => (
              <Link
                key={s.id}
                href={`?shiftId=${s.id}`}
                scroll={false}
                onClick={() => setShowSidebar(false)}
                className={`block p-3 m-2 rounded-lg border transition ${selectedId === s.id
                    ? 'bg-blue-500 border-blue-400 text-white'
                    : 'border-blue-300/20 hover:bg-blue-400/20 text-white/80'
                  }`}
              >
                {s.title}
              </Link>
            ))}
          </aside>
        </>
      )}

      {/* Main content */}
      <section className="flex-1 p-8 overflow-y-auto max-h-[calc(100vh-160px)]">
        {selectedScenario ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">{selectedScenario.title}</h1>
              {selectedScenario.type === 'Admin' && (
                <span className="text-red-500 font-semibold">Admin is required</span>
              )}
            </div>

            {selectedScenario.extraInfo && (
              <h2 className="text-xl font-bold mb-4 underline">{selectedScenario.extraInfo}</h2>
            )}

            <p className="text-white/70 mb-2">
              Scenario ID: <strong>{selectedScenario.id}</strong>
            </p>

            <div className="bg-white/10 border border-white/20 p-4 rounded-xl relative group">
              {highlightScenarioTitle(selectedScenario.desc)}

<button
  onClick={handleCopy}
  className="hidden sm:flex absolute top-4 right-4 text-white/70 hover:text-white items-center gap-1 text-sm"
  aria-label="Copy description"
>
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Clipboard className="w-4 h-4" /> Copy
                  </>
                )}
              </button>
            </div>

            {selectedScenario.adminCmd && (
              <p className="text-white/60 mt-6">
                {selectedScenario.adminCmd}{' '}
                <code
                  className="bg-gray-500 px-2 py-1 rounded text-white cursor-pointer hover:bg-black/50 transition"
                  onClick={() => navigator.clipboard.writeText(selectedScenario.cmd)}
                  title="Click to copy"
                >
                  {selectedScenario.cmd}
                </code>
              </p>
            )}
          </div>
        ) : (
          <div className="text-white/60 text-lg">
            Select a scenario from the sidebar to view more information.
          </div>
        )}
      </section>
    </main>
  );
}
