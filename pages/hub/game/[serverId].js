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
import axios from 'axios';

export default function ServerDetailPage() {
  const { serverId } = useRouter().query;
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [activeTab, setActiveTab] = useState("players");

  const { loading, players, chatLogs, modLogs, serverMeta, auditLogs } = useServerData(serverId);

  const isStaff = (() => {
    try {
      const u = JSON.parse(localStorage.getItem("User") || "{}");
      return ["Owner", "Community-Director", "Human-Resources"].includes(u.role);
    } catch {
      return false;
    }
  })();

  // ⭐ When clicking a username inside Chat tab
  function handleSelectFromChat(playerId) {
    const found = players.find(p => p.playerId == playerId);
    if (!found) return;

    setSelectedPlayer(found);
    setActiveTab("players");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function sendCommand(type, targetId, reason = "") {
    try {
      await axios.post(`/api/game/servers/${serverId}/commands`, {
        type,
        targetId,
        reason,
        issuedBy: JSON.parse(localStorage.getItem("User"))._id,
      });

      // Create audit log entry too
      await axios.post(`/api/game/servers/${serverId}/audit`, {
        action: type,
        targetId,
        targetName: selectedPlayer?.username || "Unknown",
        moderatorId: JSON.parse(localStorage.getItem("User"))._id,
        moderatorName: JSON.parse(localStorage.getItem("User")).username,
        reason,
        scope: "server",
        banType: type === "ban" ? "server" : null,
      });

    } catch (err) {
      console.error("Command error:", err);
    }
  }

  function handleKick() {
    sendCommand("kick", selectedPlayer.playerId, "Kicked from dashboard");
  }

  function handleBan() {
    sendCommand("ban", selectedPlayer.playerId, "Banned from dashboard");
  }

  function handleUnban() {
    sendCommand("unban", selectedPlayer.playerId, "Unbanned");
  }

  function handleMute() {
    sendCommand("mute", selectedPlayer.playerId, "Muted");
  }

  function handleUnmute() {
    sendCommand("unmute", selectedPlayer.playerId, "Unmuted");
  }

  return (
    <AuthWrapper requiredRole="hub">
      <main className="flex px-6 py-4 gap-5 text-white">

        {/* LEFT – PLAYER LIST */}
        <aside className="w-64">
          <PlayerList
            players={players}
            selectedPlayer={selectedPlayer}
            onSelect={setSelectedPlayer}
          />
        </aside>

        {/* RIGHT – CONTENT */}
        <section className="flex-1">

          {/* Tabs */}
          <div className="flex gap-3 border-b border-white/10 mb-4 pb-2">
            {[
              { id: "players", label: "Players" },
              { id: "chat", label: "Chat" },
              { id: "audit", label: "Audit Logs" },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-1 rounded-md text-sm ${activeTab === t.id
                  ? "bg-blue-600 text-white"
                  : "bg-[#283335] text-white/70 hover:bg-[#3a4448]"
                  }`}
              >
                {t.label}
              </button>
            ))}

            <button className='px-4 py-1 rounded-md text-sm bg-[#283335] text-white/70 hover:bg-[#3a4448]' onClick={() => setShowNotificationModal(true)}>
              Send Notification
            </button>
          </div>

          {/* Tab content */}
          {activeTab === "players" && (
            <PlayerConsole
              player={selectedPlayer}
              chatLogs={chatLogs}
              isStaff={isStaff}
              onKick={handleKick}
              onBan={handleBan}
              onUnban={handleUnban}
              onMute={handleMute}
              onUnmute={handleUnmute}
              onDeselect={() => setSelectedPlayer(null)}
            />
          )}

          {activeTab === "chat" && (
            <ChatLogs logs={chatLogs} onSelectUser={handleSelectFromChat} />
          )}

          {activeTab === "audit" && (
            <AuditLogs logs={auditLogs} />
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
