'use client';

import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import AuthWrapper from '@/components/AuthWrapper';
import useServerData from '@/hooks/useServerData';

import PlayerList from '@/components/Server/PlayerList';
import PlayerConsole from '@/components/Server/PlayerConsole';
import ChatLogs from '@/components/Server/ChatLogs';
import VehicleLogs from '@/components/Server/VehicleLogs';
import AuditLogs from '@/components/Server/AuditLogs';

export default function ServerDetailPage() {
  const { serverId } = useRouter().query;
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [activeTab, setActiveTab] = useState('players');

  const {
    loading,
    players,
    chatLogs,
    vehicleLogs,
    modLogs,
    serverMeta,
  } = useServerData(serverId);

  const isStaff = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('User') || '{}');
      return ['Owner', 'Community-Director', 'Human-Resources'].includes(u.role);
    } catch {
      return false;
    }
  })();

  return (
    <AuthWrapper requiredRole="hub">
      <main className="flex px-6 py-4 gap-5 text-white">

        {/* LEFT SIDE — PLAYER LIST ALWAYS VISIBLE */}
        <aside className="w-64">
          <PlayerList
            players={players}
            selectedPlayer={selectedPlayer}
            onSelect={setSelectedPlayer}
          />
        </aside>

        {/* RIGHT SIDE — TABS */}
        <section className="flex-1">
          <div className="flex gap-3 border-b border-white/10 mb-4 pb-2">
            {['players', 'chat', 'vehicles', 'audit'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={
                  `px-4 py-1 rounded-md text-sm ` +
                  (activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#283335] text-white/70 hover:bg-[#3a4448]')
                }
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* TAB CONTENT */}
          {activeTab === 'players' && (
            <PlayerConsole
              player={selectedPlayer}
              chatLogs={chatLogs}
              isStaff={isStaff}
              onDeselect={() => setSelectedPlayer(null)}
            />
          )}

          {activeTab === 'chat' && (
            <ChatLogs logs={chatLogs} />
          )}

          {activeTab === 'vehicles' && (
            <VehicleLogs vehicles={vehicleLogs} />
          )}

          {activeTab === 'audit' && (
            <AuditLogs logs={modLogs} />
          )}
        </section>
      </main>
    </AuthWrapper>
  );
}
