'use client';

import { useRouter } from 'next/router';
import { useState } from 'react';
import AuthWrapper from '@/components/AuthWrapper';
import useServerData from '@/hooks/useServerData';

import PlayerList from '@/components/Server/PlayerList';
import PlayerConsole from '@/components/Server/PlayerConsole';
import ChatLogs from '@/components/Server/ChatLogs';
import AuditLogs from '@/components/Server/AuditLogs';
import NotificationModal from '@/components/Server/NotificationModal';

export default function ServerDetailPage() {
  const { serverId } = useRouter().query;
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [activeTab, setActiveTab] = useState("players");

  const {
    loading,
    players,
    chatLogs,
    modLogs,
    serverMeta
  } = useServerData(serverId); // vehicleLogs removed

  const isStaff = (() => {
    try {
      const u = JSON.parse(localStorage.getItem("User") || "{}");
      return ["Owner", "Community-Director", "Human-Resources"].includes(u.role);
    } catch {
      return false;
    }
  })();

  return (
    <AuthWrapper requiredRole="hub">
      <main className="flex px-6 py-4 gap-5 text-white">

        {/* LEFT – PLAYER LIST ALWAYS ON SCREEN */}
        <aside className="w-64">
          <PlayerList
            players={players}
            selectedPlayer={selectedPlayer}
            onSelect={setSelectedPlayer}
          />
        </aside>

        {/* RIGHT – TABS & CONTENT */}
        <section className="flex-1">

          {/* Tabs */}
          <div className="flex gap-3 border-b border-white/10 mb-4 pb-2">
            {[
              { id: "players", label: "Players" },
              { id: "chat", label: "Chat" },
              { id: "audit", label: "Audit Logs" }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={
                  `px-4 py-1 rounded-md text-sm ` +
                  (activeTab === t.id
                    ? "bg-blue-600 text-white"
                    : "bg-[#283335] text-white/70 hover:bg-[#3a4448]"
                  )
                }
              >
                {t.label}
              </button>
            ))}
            <button onClick={() => setShowNotificationModal(true)}>
              Send Notification
            </button>
          </div>

          {/* Tab content */}
          {activeTab === "players" && (
            <PlayerConsole
              player={selectedPlayer}
              chatLogs={chatLogs}
              isStaff={isStaff}
              onDeselect={() => setSelectedPlayer(null)}
            />
          )}

          {activeTab === "chat" && (
            <ChatLogs logs={chatLogs} />
          )}

          {activeTab === "audit" && (
            <AuditLogs logs={modLogs} />
          )}

        </section>

        {showNotificationModal && (
          <NotificationModal
            serverId={serverId}
            onClose={() => setShowNotificationModal(false)}
          />
        )}
      </main>
    </AuthWrapper>
  );
}
