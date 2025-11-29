import { MessageSquare } from 'lucide-react';

export default function ChatLogs({ logs }) {
  return (
    <div className="bg-[#283335]/80 border border-white/10 rounded-xl p-4 max-h-[600px] overflow-y-auto">

      <h2 className="text-xl font-semibold flex items-center gap-2 mb-3">
        <MessageSquare size={20} /> Chat Logs ({logs.length})
      </h2>

      {logs.length === 0 && (
        <p className="text-gray-400 text-sm">No chat messages recorded.</p>
      )}

      <div className="space-y-3 font-mono text-sm">
        {logs
          .slice()
          .reverse()
          .map((msg, i) => (
            <div
              key={i}
              className="border-b border-white/10 pb-2 flex gap-3"
            >
              <img src={msg.icon} className="w-8 h-8 rounded-md" />

              <div className="flex-1">
                <p className="text-blue-300 font-semibold">{msg.username}</p>
                <p className="text-gray-200">{msg.chatMessage}</p>

                <p className="text-xs text-gray-500 mt-1">
                  {new Date(msg.time).toLocaleTimeString('en-GB')}
                </p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
