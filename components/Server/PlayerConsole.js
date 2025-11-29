import {
  LogOut,
  Ban,
  VolumeX,
  Volume2,
  Copy,
  BrushCleaning,
  MessageSquare,
  Clock
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
  onDeselect
}) {
  if (!player)
    return (
      <div className="flex items-center justify-center h-40 text-gray-500">
        Select a player from the list.
      </div>
    );

  const messages = chatLogs.filter(m => m.playerId === player.playerId);

  return (
    <div className="bg-[#283335]/80 rounded-lg border border-white/10 p-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-3 items-center">
          <img src={player.icon} className="w-12 h-12 rounded-md" />
          <div>
            <h3 className="text-lg text-blue-300 font-semibold">
              {player.username}
            </h3>
            <p className="text-xs text-gray-400">
              {player.role} ({player.rank})
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onKick} disabled={!isStaff} className="btn-yellow">
            <LogOut size={16} /> Kick
          </button>
          <button onClick={onBan} disabled={!isStaff} className="btn-red">
            <Ban size={16} /> Ban
          </button>
          <button onClick={onUnban} disabled={!isStaff} className="btn-green">
            <Ban size={16} className="rotate-180" /> Unban
          </button>
          <button onClick={onMute} className="btn-orange">
            <VolumeX size={16} /> Mute
          </button>
          <button onClick={onUnmute} className="btn-green">
            <Volume2 size={16} /> Unmute
          </button>
          <button onClick={() => navigator.clipboard.writeText(player.playerId)} className="btn-gray">
            <Copy size={16} /> ID
          </button>
          <button onClick={onDeselect} className="btn-blue">
            <BrushCleaning size={16} /> Clear
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mt-3 text-sm">
        <div className="flex items-center gap-1 text-gray-300">
          <MessageSquare size={16} /> {messages.length} messages
        </div>
        <div className="flex items-center gap-1 text-gray-300">
          <Clock size={16} />
          {messages.length
            ? new Date(messages[messages.length - 1].time).toLocaleTimeString()
            : "No messages"}
        </div>
      </div>

      {/* Recent messages */}
      <div className="mt-4 bg-[#222a2e]/40 rounded-md p-3 text-sm max-h-40 overflow-y-auto">
        {messages.length ? (
          messages.slice(-5).reverse().map((m, i) => (
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
    </div>
  );
}
