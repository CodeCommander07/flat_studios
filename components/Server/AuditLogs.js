import { useState, useMemo } from "react";
import { Shield, ChevronDown, X, Search } from "lucide-react";

function ExpandableRow({ log }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* MAIN ROW */}
      <tr
        onClick={() => setOpen(!open)}
        className="border-b border-white/10 hover:bg-white/5 transition cursor-pointer"
      >
        {/* TIME COLUMN — fixed width */}
        <td className="p-2 text-white/70 whitespace-nowrap w-[180px]">
          {new Date(log.createdAt).toLocaleString("en-GB")}
        </td>

        {/* ACTION — compact */}
        <td className="p-2 capitalize text-white w-[130px]">
          <div className="flex items-center gap-2">
            {log.action}
            <ChevronDown
              size={14}
              className={`transition ${open ? "rotate-180" : ""}`}
            />
          </div>
        </td>

        {/* TARGET */}
        <td className="p-2 text-blue-300 w-[180px]">
          {log.targetName || log.targetId}
        </td>

        {/* MODERATOR — compact */}
        <td className="p-2 text-emerald-300 w-[180px]">
          {log.moderatorName}
        </td>

        {/* REASON */}
        <td className="p-2 text-white/70">
          {log.reason || "—"}
        </td>
      </tr>

      {/* EXPANDED CONTENT ROW */}
      {open && (
        <tr className="bg-[#1f2629]/60 border-b border-white/10">
          <td colSpan={5} className="p-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">

              <div>
                <h3 className="font-semibold text-white mb-1">Action Details</h3>
                <p><b>Action:</b> {log.action}</p>
                {log.banType && <p><b>Ban Type:</b> {log.banType}</p>}
                <p><b>Scope:</b> {log.scope || "N/A"}</p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-1">User Details</h3>
                <p><b>Target:</b> {log.targetName || log.targetId}</p>
                <p><b>Moderator:</b> {log.moderatorName}</p>
              </div>

              <div className="md:col-span-2">
                <h3 className="font-semibold text-white mb-1">Reason</h3>
                <pre className="bg-black/30 p-3 rounded-lg border border-white/10 overflow-auto text-xs text-gray-400">
                  {log.reason || "No reason provided."}
                </pre>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AuditLogs({ logs }) {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [moderator, setModerator] = useState("all");
  const [target, setTarget] = useState("all");

  const [showActionDD, setShowActionDD] = useState(false);
  const [showModDD, setShowModDD] = useState(false);
  const [showTargetDD, setShowTargetDD] = useState(false);

  const actionOptions = [
    "all",
    "kick",
    "ban",
    "mute",
    "unmute",
    "notification",
  ];

  const moderators = useMemo(() => {
    const list = Array.from(new Set(logs.map((l) => l.moderatorName)));
    return ["all", ...list];
  }, [logs]);

  const targets = useMemo(() => {
    const list = Array.from(
      new Set(logs.map((l) => l.targetName || l.targetId))
    );
    return ["all", ...list];
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const text = search.toLowerCase();

      const matchesSearch =
        log.action?.toLowerCase().includes(text) ||
        log.reason?.toLowerCase().includes(text) ||
        log.moderatorName?.toLowerCase().includes(text) ||
        String(log.targetId)?.toLowerCase().includes(text) ||
        (log.targetName || "").toLowerCase().includes(text);

      if (!matchesSearch) return false;
      if (action !== "all" && log.action !== action) return false;
      if (moderator !== "all" && log.moderatorName !== moderator) return false;

      const tgtName = log.targetName || String(log.targetId);
      if (target !== "all" && tgtName !== target) return false;

      return true;
    });
  }, [logs, search, action, moderator, target]);

  return (
    <div className="bg-[#283335]/80 border border-white/10 rounded-xl p-4">

      {/* HEADER */}
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
        <Shield size={20} /> Moderation Audit Logs
      </h2>

      {/* FILTER BAR */}
      <div className="bg-[#1f2629]/60 border border-white/10 rounded-xl p-3 mb-4 flex flex-wrap gap-3 items-center">

        {/* SEARCH */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-2 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#283335] border border-white/10 rounded-md pl-8 pr-3 py-2 text-sm w-full text-gray-200 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* ACTION FILTER */}
        <div className="relative">
          <button
            onClick={() => setShowActionDD(!showActionDD)}
            className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 ${action !== "all"
              ? "bg-blue-600 text-white"
              : "bg-[#283335] text-white/70 hover:bg-[#3a4448]"
              }`}
          >
            Action
            <ChevronDown
              size={14}
              className={`transition ${showActionDD ? "rotate-180" : ""}`}
            />
          </button>

          {showActionDD && (
            <div className="absolute mt-2 w-48 bg-[#283335] border border-white/10 rounded-md shadow-lg z-20 overflow-hidden">
              {actionOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setAction(opt);
                    setShowActionDD(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-[#3a4448] ${action === opt ? "bg-blue-600 text-white" : "text-gray-200"
                    }`}
                >
                  {opt === "all"
                    ? "All Actions"
                    : opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* MODERATOR FILTER */}
        <div className="relative">
          <button
            onClick={() => setShowModDD(!showModDD)}
            className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 ${moderator !== "all"
              ? "bg-purple-600 text-white"
              : "bg-[#283335] text-white/70 hover:bg-[#3a4448]"
              }`}
          >
            Moderator
            <ChevronDown size={14} />
          </button>

          {showModDD && (
            <div className="absolute mt-2 w-48 bg-[#283335] border border-white/10 rounded-md shadow-lg z-20 overflow-hidden">
              {moderators.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setModerator(m);
                    setShowModDD(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-[#3a4448] ${moderator === m
                    ? "bg-purple-600 text-white"
                    : "text-gray-200"
                    }`}
                >
                  {m === "all" ? "All Moderators" : m}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TARGET FILTER */}
        <div className="relative">
          <button
            onClick={() => setShowTargetDD(!showTargetDD)}
            className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 ${target !== "all"
              ? "bg-emerald-600 text-white"
              : "bg-[#283335] text-white/70 hover:bg-[#3a4448]"
              }`}
          >
            Target
            <ChevronDown size={14} />
          </button>

          {showTargetDD && (
            <div className="absolute mt-2 w-52 bg-[#283335] border border-white/10 rounded-md shadow-lg z-20 overflow-hidden max-h-64 overflow-y-auto">
              {targets.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTarget(t);
                    setShowTargetDD(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-[#3a4448] ${target === t
                    ? "bg-emerald-600 text-white"
                    : "text-gray-200"
                    }`}
                >
                  {t === "all" ? "All Targets" : t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CLEAR BUTTON */}
        {(action !== "all" || moderator !== "all" || target !== "all" || search) && (
          <button
            onClick={() => {
              setSearch("");
              setAction("all");
              setModerator("all");
              setTarget("all");
            }}
            className="px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm flex items-center gap-1"
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* TABLE */}
      <div className="max-h-[600px] overflow-y-auto rounded-lg border border-white/10">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-white/5 border-b border-white/10 sticky top-0">
            <tr>
              <th className="p-2 text-white/80 text-left">Time</th>
              <th className="p-2 text-white/80 text-left">Action</th>
              <th className="p-2 text-white/80 text-left">Target</th>
              <th className="p-2 text-white/80 text-left">Moderator</th>
              <th className="p-2 text-white/80 text-left">Reason</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((log) => (
              <ExpandableRow key={log._id} log={log} />
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-400">
                  No logs match your filters.
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

    </div>
  );
}
