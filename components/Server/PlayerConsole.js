import { useState } from "react";
import {
  LogOut,
  Ban,
  VolumeX,
  Volume2,
  Copy,
  BrushCleaning,
  MessageSquare,
  Clock,
} from "lucide-react";

export default function PlayerConsole({
  player,
  chatLogs,
  isStaff,
  onKick,
  onBan,
  onUnban,
  onMute,
  onUnmute,
  onDeselect,
}) {
  const [tab, setTab] = useState("messages");

  if (!player)
    return (
      <div className="flex items-center justify-center h-40 text-gray-500">
        Select a player from the list.
      </div>
    );

  const messages = chatLogs.filter((m) => m.playerId === player.playerId);

  // moderation flags
  const isMuted = player.muted;
  const isServerBanned = player.serverBanned;
  const isGlobalBanned = player.globalBanned;

  return (
    <div className="bg-[#283335]/80 rounded-lg border border-white/10 p-4">

      {/* ------- Header ------- */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3 items-center">
          <img
            src={player.icon}
            className="w-12 h-12 rounded-md border border-white/20 shadow-md"
          />
          <div>
            <h3 className="text-lg text-blue-300 font-semibold">
              {player.username}
            </h3>
            <p className="text-xs text-gray-400">
              {player.role} ({player.rank})
            </p>
            <p className="text-xs text-cyan-300 mt-1">
              Team:{" "}
              <span className="bg-cyan-500/20 border border-cyan-400/30 px-2 py-0.5 rounded-md">
                {player.team || "Unassigned"}
              </span>
            </p>
          </div>
        </div>

        {/* ------- ACTION BUTTONS (same location) ------- */}
        <div className="flex flex-wrap justify-end gap-2 ml-auto">
          {isStaff && (
            <button
              onClick={onKick}
              className="px-3 py-1 rounded-md text-sm flex items-center gap-1 
              bg-yellow-600/20 border border-yellow-500/40 
              text-yellow-300 shadow-sm hover:bg-yellow-500/30 
              transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <LogOut size={16} /> Kick
            </button>)}
          {isStaff && (
            <button
              onClick={onBan}
              disabled={!isStaff}
              className="px-3 py-1 rounded-md text-sm flex items-center gap-1 
              bg-red-600/20 border border-red-500/40 text-red-300 
              shadow-sm hover:bg-red-500/30 transition 
              disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Ban size={16} /> Ban
            </button>)}
          {isStaff && (
            <button
              onClick={onUnban}
              disabled={!isStaff}
              className="px-3 py-1 rounded-md text-sm flex items-center gap-1 
              bg-green-600/20 border border-green-500/40 
              text-green-300 shadow-sm hover:bg-green-500/30 
              transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Ban size={16} className="rotate-180" /> Unban
            </button>)}

          <button
            onClick={onMute}
            className="px-3 py-1 rounded-md text-sm flex items-center gap-1 
              bg-orange-600/20 border border-orange-500/40 
              text-orange-300 shadow-sm hover:bg-orange-500/30 transition"
          >
            <VolumeX size={16} /> Mute
          </button>

          <button
            onClick={onUnmute}
            className="px-3 py-1 rounded-md text-sm flex items-center gap-1 
              bg-green-600/20 border border-green-500/40 
              text-green-300 shadow-sm hover:bg-green-500/30 transition"
          >
            <Volume2 size={16} /> Unmute
          </button>

          <button
            onClick={() => navigator.clipboard.writeText(player.playerId)}
            className="px-3 py-1 rounded-md text-sm flex items-center gap-1 
              bg-gray-600/20 border border-gray-500/40 
              text-gray-300 shadow-sm hover:bg-gray-500/30 transition"
          >
            <Copy size={16} /> ID
          </button>

          <button
            onClick={onDeselect}
            className="px-3 py-1 rounded-md text-sm flex items-center gap-1 
              bg-blue-600/20 border border-blue-500/40 
              text-blue-300 shadow-sm hover:bg-blue-500/30 transition"
          >
            <BrushCleaning size={16} /> Clear
          </button>

        </div>
      </div>

      {/* ------- Moderation Status ------- */}
      <div className="mt-3 p-3 rounded-md bg-[#1f2629]/70 border border-white/5">
        <h4 className="text-sm text-gray-300 font-semibold mb-1">Moderation Status</h4>

        <div className="text-xs text-gray-300 space-y-1">
          <p>
            <b>Muted:</b>{" "}
            {isMuted ? (
              <span className="text-orange-400">Yes</span>
            ) : (
              <span className="text-green-400">No</span>
            )}
          </p>

          <p>
            <b>Server Banned:</b>{" "}
            {isServerBanned ? (
              <span className="text-red-400">Yes</span>
            ) : (
              <span className="text-green-400">No</span>
            )}
          </p>

          <p>
            <b>Global Banned:</b>{" "}
            {isGlobalBanned ? (
              <span className="text-red-400">Yes</span>
            ) : (
              <span className="text-green-400">No</span>
            )}
          </p>
        </div>
      </div>

      {/* ------- Timeline ------- */}
      <div className="mt-3 p-3 bg-[#1f2629]/60 border border-white/5 rounded-md">
        <h4 className="text-sm text-gray-300 font-semibold mb-2">Timeline</h4>

        <div className="text-xs text-gray-300 space-y-1">
          <p>
            🟢 <b>Joined:</b>{" "}
            {player.joined
              ? new Date(player.joined).toLocaleString("en-GB")
              : "Unknown"}
          </p>

          {player.left && (
            <p>
              🔴 <b>Left:</b>{" "}
              {new Date(player.left).toLocaleString("en-GB")}
            </p>
          )}

          <p>
            👮 <b>Team:</b> {player.team || "Unassigned"}
          </p>
        </div>
      </div>

      {/* ------- Tabs ------- */}
      <div className="flex gap-2 mt-4 border-b border-white/10 pb-2">
        <button
          className={`px-3 py-1 rounded-md text-sm ${tab === "messages" ? "bg-white/10 text-blue-300" : "text-gray-300"
            }`}
          onClick={() => setTab("messages")}
        >
          Messages
        </button>

        <button
          className={`px-3 py-1 rounded-md text-sm ${tab === "vehicle" ? "bg-white/10 text-blue-300" : "text-gray-300"
            }`}
          onClick={() => setTab("vehicle")}
        >
          Vehicle
        </button>
      </div>

      {/* ------- Tab Content ------- */}
      <div className="mt-4">

        {tab === "messages" && (
          <div className="bg-[#222a2e]/40 rounded-md p-3 text-sm max-h-52 overflow-y-auto">
            {messages.length ? (
              messages
                .slice(-20)
                .reverse()
                .map((m, i) => (
                  <div key={i} className="text-gray-300 mb-1">
                    <span className="text-gray-500 mr-1">
                      [{new Date(m.time).toLocaleTimeString()}]
                    </span>
                    {m.chatMessage}
                  </div>
                ))
            ) : (
              <p className="text-gray-500">No messages found.</p>
            )}
          </div>
        )}

        {tab === "vehicle" && (
          <div className="p-3 text-sm text-gray-300 bg-[#222a2e]/40 rounded-md">
            <p className="text-gray-400">No vehicle assigned.</p>
          </div>
        )}
      </div>
    </div>
  );
}
