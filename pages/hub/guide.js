'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

const guides = [
  { id: '00', type: 'Tab', title: 'Introduction', desc: 'It is the aim of this document to include all the information we have created to assist you in one easy place and document with your roles and responsibilities while moderating for us on Yapton and District. This Document will be updated as required based on the current situation of the game and if any/all duties required of you change. ' },
  { id: '01', type: 'Tab', title: 'What do we expect from you?', },
  {
    id: '02', type: 'InTab', underId: '01', title: 'What do we expect from you?', desc: `At the core of our mission is a strong belief that everyone should maintain a balanced life outside of Roblox. To uphold this commitment, we've implemented a stringent industry standard - in-game activity moderation to just 60 minutes per week. This approach ensures that players have ample time to engage in other meaningful activities, fostering a healthy and well-rounded lifestyle while enjoying the Roblox experience. 

Our system relies on manual logging, so it is crucial for all participants to diligently log their activity, as any unrecorded data will not be considered. When logging your activity, please ensure you log using the google form which can be found in the pinned messages in the ⁠activity-log channel and in the channel description. For those handling shifts, it is equally important to include the total number of players present during your shift, whether it's everyone or just the peak turnout. 

If you have already been given admin, we expect you to moderate the game for an hour a week, managing the game on our behalf for a payment, We do not pay you for driving or playing the game, we pay you for moderating the game in a just and fair manner for all users, the income that's generated from these same users at the end of the day is where the income for your pay comes from.

If you haven’t been given admin yet, we still expect you to moderate the game, we want you to use some decent common sense in your actions, we don’t train you, this is a trial for you to prove to us you would be a good fit at moderating Yapton, i don't see where the problem is in you understanding this concept, you are doing a trial for 2 weeks, if you were being trained your trial would be for a shit ton longer.

The concept of mod management is mostly common sense, hence why you don't need admin in the majority of situations, this concept has been used for a long bloody time in the bus community, yes prob outdated but still the only effective measurement to assess your fit for the role and whether you can be trusted not to use admin as the first line of repercussion methods.` },
  { id: '03', type: 'InTab', underId: '01', title: 'I don’t have admin, how can I admin the game?', desc: `Most of the time, it's engagement in chat, how do I start my bus? Give instructions, don’t know? Find out and then relay that information to them in chat, how do I get route directions, relay that information, what's new coming to the game? All updates and previews are on the server, I’m not on the server or I'm not old enough, give them a brief description - or tell them to visit the Yapton website. ` },
  { id: '04', type: 'InTab', underId: '01', title: "What's the point of us doing moderation like this?", desc: `It gives the senior Management Team and Flatcar1 awareness of what kind of person you are and how you moderate on a game, are you a person that can encourage engagement or are you that knobhead that respawns/kicks/be a dick that drives people away. ` },
  { id: '05', type: 'InTab', underId: '01', title: 'Why not just give us admin and observe us then?', desc: `We don't know you to trust you, you're a person or a donkey that has made an application for a position of trust within the game, we don’t know if you have positive intent or malicious intent for the game, because of the nature of the UK bus community of Roblox there is a necessity to be sure to be cautious, on the other hand, most of you that have applied will not have had any background in any reputable game within the community, so this allows us to see how you would deal with a situation and discuss the feedback with ourselves to have you more aligned with our vision of how we want the game ran. ` },
  { id: '06', type: 'InTab', underId: '01', title: 'Why can’t we join a team and drive around, surely that would expand our range in dealing with situations?', desc: `Yes technically correct, but never in history has a company paid its own employees to sample their own merchandise and pay them for doing so, if we’re paying you to engage with the community, we’re paying you to engage with the community for the hour of that activity, you driving around is not engaging, especially in a shift setting. ` },
  { id: '07', type: 'InTab', underId: '01', title: 'So you expect us to sit at the bus station teamed as passengers for an hour a week until we get admin?', desc: `Plainly put. Yes, yes we fucking do, the main area of problems occurring in the game is centred around the bus station and town centre circle, its all walkable in under a minute. Its 2 hours of fucking activity at its minimum effort, to get your admin(as long as sterling gives the all clear, that you can be trusted with admin). ` },
  { id: '08', type: 'Tab', title: 'Points Of Contacts' },
  {
    id: '09', type: 'InTab', underId: '08', title: 'Points Of Contacts', desc: `Your first point of call for all matters is the following order below: 
• Line Managers/Community Directors
• 123reeg
• Kelvin 

You should contact your line manager FIRST. We expect this chain to be respected, if you bypass one level and go above without a valid reason, warnings will be issued, Flatcar is extremely busy managing the majority of the operations of the game. 

Other members of staff include:

Director of Human Resources
• Cypher/TheIronicIrony 

Creator
• Flatcar1` },
  { id: '10', type: 'InTab', underId: '08', title: 'Rolex said we can log it as activity?', desc: `Rolex is Not your manager/line manager/HR director or owner of the game. He may have a head developer title, but in reality the title is superficial. ` },
  { id: '11', type: 'Tab', title: 'Admin' },
  {
    id: '12', type: 'InTab', underId: '11', title: 'Approved Uses', desc: `For moderation of the game which may include:
Flying (:fly) - Quickly get somewhere
Teleporting (:to [user]) - Get somewhere immediately 
Mute (:mute) - For anyone causing a row or issue (what is described as an “issue” is down to you to decide as your own discretion) 
Kick (:kick) - To remove someone from the server
Serverban (:serverban) - Ban someone from a specific server (requires admin)
Globalban (:globalban) - Permanently bans someone from all servers. (requires admin)
Chat logs (:chatlogs) - View chatlogs
Exploit logs (:exploitlogs) - - view exploit logs
Logs (:logs) - View logs
Join logs (:joinlogs) - View everyone who joined your server
Leave logs (:leavelogs) - View who has left the server
Reset (:reset) - Resets a user (also deletes any vehicles they may have spawned)
Refresh (:refresh) - Refreshes a user without resetting them to spawn)

Given the current state of the game of the game, that being collisions are turned off, admin usage may be questioned inappropriate, actions against users should only be done when no other alternative is possible and with reasonable constraint into what has been used, Trolling of players are extremely limited in what they can do in game while collisions are off. However this would be likely to change if we reconsider turning collisions back on in the future, depending on how functional the staff team is as a whole with their availability, productivity and Time scales in responding to situations both on the Discord and events and situations within the game.` },
  {
    id: '13', type: 'InTab', underId: '11', title: 'Prohibited Uses', desc: `Any command that is not stated above or any command that is not helpful in moderating the game.
Any command which could be seen as abusive towards the player or abuse of admin.
Specific commands include:
Brazil
Break
Char
Ins - you should not be driving around vans. This is considered an abuse of admin and requires permission from flatcar or sterling to be used in rare circumstances.` },
  { id: '14', type: 'Tab', title: 'Taking Action: The Process', desc: `Some users may cause an annoyance or drama when in-game. When appropriate (down to your discretion), you make take action against them` },
  {
    id: '15', type: 'InTab', underId: '14', title: 'Chat Offenses', desc: `Stage 1 (chat offenses)
Any user causing drama within chat may be muted for a set period as determined by your-self

Stage 2 (chat offenses)
Any repeat offenders who rejoin can be serverbanned, this requires an admin.` },
  {
    id: '16', type: 'InTab', underId: '14', title: 'Game Offenses', desc: `Stage 1 (game offenses)
Any user causing a blockage or drama can be
reset using :reset. 

Stage 2 (game offenses)
Any repeat offenders - repeat offenders are classified as those who have gone through stage 1 at least 3 times - can be kicked from the server, this requires an admin. 

Stage 3 (game offenses)
Any repeat offender that has gone through stage 2 at least once (whilst on the same server or within 12 hours) can be serverbanned. This requires an admin.

Stage 4 (game offenses)
Any repeat offenders that have gone through stage 3 at least once (whilst on the same server or within 24hrs) can be permanently banned using :globalban. This requires an admin.` },
  { id: '17', type: 'Tab', title: 'Formats', desc: 'You can click on the format to copy it to your clipboard.' },
  { id: '18', type: 'InTab', underId: '17', title: 'Schedule', },
  { id: '19', type: 'InTab', underId: '17', title: 'Starting', },
  { id: '20', type: 'Tab', title: 'Ropro', desc: `As the game is now popular, for shifts ropro links must be used. Install it here: https://ropro.io/ If you need assistance or have any questions please ask in ⁠holding (pinging flat is never a good idea). ` },
  {
    id: '21', type: 'Tab', title: 'Payments', desc: `It's important to be aware that any activity performed during the trial period will not contribute to your monthly payments. Consequently, your initial paycheck, which is scheduled for the end of this month, will be reduced accordingly due to the non-inclusion of trial activity. This policy underscores the separation of the trial phase from the regular payment structure, ensuring that payments accurately reflect the commitment and performance beyond the trial period. 

You are issued a payslip every month via email. The email we use is the one you gave to us. All payslips come from PAYE@flatstudios.net ` },
  { id: '22', type: 'Tab', title: 'Inactivity Requests', desc: `Inactivity Requests should be made on the staff hub under the Authorised Leave Tab.  The Inactivity Request must be made 48 Hours/2 Days prior to the Inactivity as a minimum. The inactivity must last longer than 5 days to be valid.` }
];

export default function ScenariosPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedId = searchParams.get('guideId') || guides.find(g => g.type === 'Tab')?.id;
  const selectedTabId = searchParams.get('tabId');

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tabs = guides.filter(g => g.type === 'Tab');
  const inTabs = guides.filter(g => g.type === 'InTab' && g.underId === selectedId);
  const parentTab = tabs.find(t => t.id === selectedId);
  const combinedTabs = inTabs.length > 0 ? [parentTab, ...inTabs] : [];
  const selectedInTab = combinedTabs.find(t => t.id === selectedTabId) || parentTab;

  useEffect(() => {
    if (inTabs.length > 0) {
      if (!selectedTabId || !inTabs.some(t => t.id === selectedTabId)) {
        router.replace(`?guideId=${selectedId}&tabId=${inTabs[0].id}`, { scroll: false });
      }
    } else if (selectedTabId) {
      router.replace(`?guideId=${selectedId}`, { scroll: false });
    }
  }, [selectedId, selectedTabId, inTabs, router]);

  // Auto-close sidebar on selection (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [selectedId, selectedTabId]);

  return (
    <main className="text-white bg-black/90 min-h-[calc(100vh-163px)] flex relative">
      {/* Mobile toggle button */}
      {!sidebarOpen && (
        <button
          className="md:hidden fixed top-4 left-4 z-50 bg-blue-600 p-2 rounded-md hover:bg-blue-700 transition"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open guide list"
        >
          <Menu className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-72 bg-white/5 border-r border-white/10 p-4 space-y-2 text-white max-h-screen overflow-y-auto">
        <h2 className="text-xl font-semibold mb-2">Moderation Guides</h2>
        {tabs.map(tab => (
          <Link
            key={tab.id}
            href={`?guideId=${tab.id}`}
            scroll={false}
            className={`block p-2 rounded-lg border transition ${selectedId === tab.id
              ? 'bg-blue-500 border-blue-400 text-white'
              : 'border-blue-300/20 hover:bg-blue-400/20 text-white/80'
              }`}
          >
            {tab.title}
          </Link>
        ))}
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black z-40"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-0 z-50 bg-white/5 pt-20 p-6 overflow-y-auto text-white">
            <button
              className="md:hidden fixed top-4 left-4 z-50 bg-blue-600 p-2 rounded-md hover:bg-blue-700 transition"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close guide list"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="pt-2 md:pt-0 text-xl font-semibold mb-4">Moderation Guides</h2>
            {tabs.map(tab => (
              <Link
                key={tab.id}
                href={`?guideId=${tab.id}`}
                scroll={false}
                onClick={() => setSidebarOpen(false)}
                className={`block p-3 m-2 rounded-lg border transition ${selectedId === tab.id
                  ? 'bg-blue-500 border-blue-400 text-white'
                  : 'border-blue-300/20 hover:bg-blue-400/20 text-white/80'
                  }`}
              >
                {tab.title}
              </Link>
            ))}
          </aside>
        </>
      )}

      <section
        className="
          flex-1 p-6 pt-[72px] md:pt-8 overflow-y-auto max-h-[calc(100vh-160px)]
          md:p-8
        "
      >
        {selectedId ? (
          <>
            {inTabs.length > 0 && parentTab && (
              <div className="bg-white/10 border border-white/20 rounded-lg p-6 text-white mb-2">
                <h2 className="text-xl font-bold mb-2">{parentTab.title}</h2>
                <p className="text-white/80 whitespace-pre-wrap">{parentTab.desc ? parentTab.desc : null}</p>
              </div>
            )}
            {inTabs.length > 0 && (
              <div className="mb-3 border border-white/20 rounded-lg bg-white/10 overflow-x-auto no-scrollbar">
                <nav className="flex flex-col sm:flex-row px-1 gap-1 sm:gap-0">
                  {inTabs.map(subTab => (
                    <Link
                      key={subTab.id}
                      href={`?guideId=${selectedId}&tabId=${subTab.id}`}
                      scroll={false}
                      className={`w-full sm:w-auto truncate px-4 py-2 font-semibold text-sm text-center cursor-pointer select-none transition
            ${selectedTabId === subTab.id
                          ? 'rounded-lg bg-blue-900 text-white'
                          : 'text-white/70 hover:bg-blue-900 rounded-lg hover:text-white'
                        }`}
                                        style={{
                  width: `${100 / inTabs.length}%`,
                }}
                    >
                      {subTab.title}
                    </Link>
                  ))}
                </nav>
              </div>
            )}

            {(selectedInTab?.desc) && (
              <article className="bg-white/5 p-6 rounded-lg border border-white/10">
                {selectedInTab?.title && (
                  <h1 className="text-2xl font-bold mb-4">{selectedInTab.title}</h1>
                )}
                {selectedInTab?.desc && (
                  <p className="whitespace-pre-wrap text-white/80">{selectedInTab.desc}</p>
                )}
              </article>
            )}
            {selectedId === "01" && (
              <div className="mt-3 p-4 rounded-xl border border-white/20 bg-white/10 text-white">
                <p className="text-sm leading-relaxed">
                  <strong>Sterling is not on Discord for now</strong>, any enquiries to Sterling should be forwarded to <strong>Cypher</strong>, any communication/instructions from Sterling should be adhered to. Sterling is Cypher's younger brother — if there's anything Sterling observes, Cypher will be told immediately.
                </p>
              </div>
            )}
            {selectedId === "21" && (
              <div className="mt-3 p-4 rounded-xl border border-white/20 bg-white/10 text-white">
                <p className="text-sm leading-relaxed italic">
                  Payment is issued to staff who complete the month as "employed" by Yapton & District. Should you leave (or get fired), you won't be entitled to the month's pay. This doe not affect authorised leave.
                </p>
              </div>
            )}
            {selectedId === "14" && (
              <div className="mt-3 p-4 rounded-xl border border-white/20 bg-white/10 text-white">
                <p className="text-sm leading-relaxed">
                  Given the current state of the game of the game, that being collisions are turned off, admin usage may be questioned inappropriate, actions against users should only be done when no other alternative is possible and with reasonable constraint into what has been used, Trolling of players are extremely limited in what they can do in game while collisions are off. However this would be likely to change if we reconsider turning collisions back on in the future, depending on how functional the staff team is as a whole with their availability, productivity and Time scales in responding to situations both on the Discord and events and situations within the game.
                  <br /><strong>(Correct as of 19/12/2024)</strong>

                </p>
              </div>
            )}
            {selectedId === "20" && (
              <div className="mt-3 p-4 rounded-xl border border-white/20 bg-white/10 text-white">
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition"
                  onClick={() => { router.push('https://ropro.io/') }}
                >
                  Go to RoPro
                </button>
              </div>
            )}
            {selectedId === "22" && (
              <div className="mt-3 p-4 rounded-xl border border-white/20 bg-white/10 text-white">
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition"
                  onClick={() => { router.push('/hub/leave') }}
                >
                  Go to Inactivity Request Form
                </button>
              </div>
            )}
            {selectedTabId === "18" && (
              <>
                {/* Shift Scheduled */}
                <div
                  className="mt-3 p-4 rounded-xl border border-white/20 bg-white/10 text-white cursor-pointer transition hover:bg-white/20"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      ":SHIFTALERT: | SHIFT SCHEDULED\n\nHiya I'm hosting a shift (you may change this to what you want but keep it along those lines)\n\nScenario: insert here\n\nTime & Date\n\n@shifts"
                    )
                  }
                >
                  <h1 className='text-2xl font-bold mb-4'>Scheduled a Shift</h1>
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    :SHIFTALERT: | SHIFT SCHEDULED

                    <br />
                    <br />
                    Hiya I'm hosting a shift (you may change this to what you want but keep it along those lines)

                    <br />
                    <br />
                    Scenario: insert here

                    <br />
                    <br />
                    Time & Date

                    <br />
                    <br />
                    @shifts
                  </p>
                </div>
              </>
            )}
            {selectedTabId === "19" && (
              <>

                {/* Shift Starting */}
                <div
                  className="mt-3 p-4 rounded-xl border border-white/20 bg-white/10 text-white cursor-pointer transition hover:bg-white/20"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      ":SHIFTALERT: | SHIFT STARTING\n\nMy shift [INSERT LINK TO ORIGINAL SHIFT ANNOUNCEMENT MESSAGE HERE] on yapton starting now! (you can change this to what you want you just need a link to your original message)\n\n[insert ropro link here]\n\n@shifts"
                    )
                  }
                >
                  <h1 className='text-2xl font-bold mb-4'>Starting a Shift</h1>

                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    :SHIFTALERT: | SHIFT STARTING

                    <br />
                    <br />
                    My shift [INSERT LINK TO ORIGINAL SHIFT ANNOUNCEMENT MESSAGE HERE] on yapton starting now! (you can change this to what you want you just need a link to your original message)

                    <br />
                    <br />
                    [insert ropro link here]

                    <br />
                    <br />
                    @shifts
                  </p>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-white/60 text-lg">
            Select a guide from the sidebar to view more information.
          </div>
        )}
      </section>
    </main>
  );
}
