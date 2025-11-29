import { Shield } from 'lucide-react';

export default function AuditLogs({ logs }) {
  return (
    <div className="bg-[#283335]/80 border border-white/10 rounded-xl p-4">

      <h2 className="text-xl font-semibold flex items-center gap-2 mb-3">
        <Shield size={20} /> Moderation Audit Logs
      </h2>

      {logs.length === 0 && (
        <p className="text-gray-400 text-sm">No moderation actions recorded.</p>
      )}

      <div className="max-h-[600px] overflow-y-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-white/5 border-b border-white/10 text-white/90">
            <tr>
              <th className="p-2">Time</th>
              <th className="p-2">Action</th>
              <th className="p-2">Target</th>
              <th className="p-2">Moderator</th>
              <th className="p-2">Reason</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log) => (
              <tr key={log._id} className="border-b border-white/10">
                <td className="p-2 text-white/70">
                  {new Date(log.createdAt).toLocaleString('en-GB')}
                </td>
                <td className="p-2 text-white capitalize">
                  {log.action}
                  {log.banType && ` (${log.banType})`}
                </td>
                <td className="p-2 text-blue-300">
                  {log.targetName || log.targetId}
                </td>
                <td className="p-2 text-emerald-300">
                  {log.moderatorName}
                </td>
                <td className="p-2 text-white/70">{log.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
