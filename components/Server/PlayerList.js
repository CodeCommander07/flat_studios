import { Users } from 'lucide-react';

export default function PlayerList({ players, selectedPlayer, onSelect }) {
  return (
    <div className="bg-[#283335]/80 border border-white/10 rounded-xl p-3 h-full overflow-y-auto">

      <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
        <Users size={18} /> Players ({players.filter(p => !p.left).length})
      </h2>

      {players.length === 0 && (
        <p className="text-gray-400 text-sm">No players online.</p>
      )}

      <ul className="space-y-2">
        {players
          .filter(p => !p.left)
          .map((p) => (
            <li
              key={p.playerId}
              onClick={() => onSelect(p)}
              className={[
                'p-2 rounded-md cursor-pointer transition border border-white/10',
                selectedPlayer?.playerId === p.playerId
                  ? 'bg-blue-600/20'
                  : 'hover:bg-white/5'
              ].join(' ')}
            >
              <div className="flex items-center gap-3">
                <img src={p.icon} className="w-10 h-10 rounded-md border border-white/10" />
                <div>
                  <p className="text-blue-300 font-semibold">{p.username}</p>
                  <p className="text-xs text-gray-400">{p.role} ({p.rank})</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Team: <span className="text-white/80">{p.team || 'Unassigned'}</span>
                  </p>
                </div>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
}
