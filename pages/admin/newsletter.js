'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import AuthWrapper from '@/components/AuthWrapper';
import { Users, SortAsc, SortDesc, Search, Calendar } from 'lucide-react';

export default function NewsletterSubscribers() {
    const [subs, setSubs] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sortAsc, setSortAsc] = useState(true);
    const [sourceFilter, setSourceFilter] = useState(["All"]);
    const [sourceList, setSourceList] = useState(["All"]);
    const [dateFilter, setDateFilter] = useState(["All"]);
    const [sourceCounts, setSourceCounts] = useState({});
    const [showSource, setShowSource] = useState(false);
    const [showDates, setShowDates] = useState(false);
    const [dateList, setDateList] = useState(["All"]);
    const [dateCounts, setDateCounts] = useState({});

    const fetchSubs = async () => {
        try {
            const res = await axios.get('/api/newsletters');
            const members = res.data.members || [];

            const formatted = members.map(m => ({
                email: m.email_address,
                username: m.merge_fields?.MMERGE1 || "—",
                status: m.status,
                date: m.timestamp_opt || m.last_changed,
                source: m.source || "Unknown"
            }));

            setSubs(formatted);

            const sourceCounts = formatted.reduce((acc, s) => {
                const src = s.source || "Unknown";
                acc[src] = (acc[src] || 0) + 1;
                return acc;
            }, {});

            setSourceList(["All", ...Object.keys(sourceCounts)]);
            setSourceCounts(sourceCounts);

            const dateCounts = formatted.reduce((acc, s) => {
                const bucket = getDateBucket(s.date);
                acc[bucket] = (acc[bucket] || 0) + 1;
                return acc;
            }, {});

            const sortedDates = ["All", ...Object.keys(dateCounts).sort((a, b) => {
                if (a === "Today") return -1;
                if (b === "Today") return 1;
                if (a === "Yesterday") return -1;
                if (b === "Yesterday") return 1;
                return 0;
            })];

            setDateList(sortedDates);
            setDateCounts(dateCounts);

            setFiltered(formatted);
        } catch (err) {
            console.error("Failed to load subscribers:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubs();
    }, []);

    useEffect(() => {
        let list = [...subs];

        // Search
        if (search.trim() !== "") {
            const s = search.toLowerCase();
            list = list.filter(
                u =>
                    u.username.toLowerCase().includes(s) ||
                    u.email.toLowerCase().includes(s)
            );
        }

        // Source filter
        if (!sourceFilter.includes("All")) {
            list = list.filter(u => sourceFilter.includes(u.source));
        }

        // Date filter
        if (!dateFilter.includes("All")) {
            list = list.filter(u => dateFilter.includes(getDateBucket(u.date)));
        }

        // Sorting
        list.sort((a, b) =>
            sortAsc
                ? a.username.localeCompare(b.username)
                : b.username.localeCompare(a.username)
        );

        setFiltered(list);
    }, [
        search,
        sortAsc,
        subs,
        sourceFilter,   // ← ADD THIS
        dateFilter      // ← ADD THIS
    ]);

    async function deleteSub(email) {
        if (!confirm(`Delete ${email}?`)) return;

        try {
            await axios.delete('/api/newsletters', { data: { email } });

            setSubs((prev) => prev.filter(s => s.email !== email));
        } catch (err) {
            alert("Failed to delete subscriber");
        }
    }

    function exportCSV(list) {
        const rows = [
            ["Email", "Username", "Source", "Status", "Joined"],
            ...list.map(s => [
                s.email,
                s.username,
                s.source,
                s.status,
                s.date ? new Date(s.date).toLocaleString("en-GB") : ""
            ])
        ];

        const csv = rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "newsletter_subscribers.csv";
        a.click();
        window.URL.revokeObjectURL(url);
    }


    function getDateBucket(dateStr) {
        if (!dateStr) return "Unknown";

        const d = new Date(dateStr);
        const now = new Date();
        const diff = (now - d) / (1000 * 60 * 60 * 24);

        if (diff < 1) return "Today";
        if (diff < 2) return "Yesterday";
        if (diff < 7) return "Last 7 Days";
        if (diff < 30) return "Last 30 Days";
        if (d.getFullYear() === now.getFullYear()) return `${d.toLocaleString('en-GB', { month: 'long' })}`;
        return d.getFullYear().toString();
    }

    return (
        <AuthWrapper requiredRole="admin">
            <main className="text-white px-6 py-12 max-w-10xl mx-auto bg-[#283335]">
                <h1 className="text-3xl font-bold mb-8 p-5 bg-[#283335] border-b flex items-center gap-3">
                    <Users /> Newsletter Subscribers {subs.length > 0 && `(${subs.length})`}
                </h1>
                <div className="flex flex-col lg:flex-row gap-10">
                    <aside className="lg:w-64 flex-shrink-0 space-y-5 pr-5 border-r">
                        <div className="bg-[#283335] p-4 rounded-xl border border-white/10 space-y-3">
                            <p className="font-semibold text-white/80 text-sm">Search</p>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-white/40" size={16} />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-[#283335] rounded-lg text-sm border border-white/20 focus:outline-none"
                                    placeholder="Search subscribers..."
                                />
                            </div>
                        </div>

                        <div className="bg-[#283335] p-4 rounded-xl border border-white/10">
                            <button
                                onClick={() => setShowSource(!showSource)}
                                className="w-full flex justify-between items-center text-sm font-semibold text-white/80"
                            >
                                Source
                                <span
                                    className={`transition-transform duration-300 ${showSource ? "rotate-180" : "rotate-0"
                                        }`}
                                >
                                    ▼
                                </span>
                            </button>
                            <div
                                className={`overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out ${showSource ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
                                    }`}
                            >
                                <div className="mt-3 space-y-2 pr-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                                    {sourceList.map(src => {
                                        const selected = sourceFilter.includes(src);
                                        return (
                                            <button
                                                key={src}
                                                onClick={() => {
                                                    setSourceFilter(prev =>
                                                        src === "All"
                                                            ? ["All"]
                                                            : prev.includes(src)
                                                                ? prev.filter(s => s !== src && s !== "All")
                                                                : [...prev.filter(s => s !== "All"), src]
                                                    );
                                                }}
                                                className={`w-full px-3 py-2 rounded-lg text-left text-sm transition flex justify-between items-center
                                                        ${selected ? "bg-blue-600" : "bg-[#283335] hover:bg-white/20"}
                                                `}
                                            >
                                                {src}
                                                <span className="text-white/40">
                                                    ({src === "All" ? subs.length : sourceCounts[src]})
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="bg-[#283335] p-4 rounded-xl border border-white/10">
                            <button
                                onClick={() => setShowDates(!showDates)}
                                className="w-full flex justify-between items-center text-sm font-semibold text-white/80"
                            >
                                <Calendar /> Join Date
                                <span
                                    className={`transition-transform duration-300 ${showDates ? "rotate-180" : "rotate-0"
                                        }`}
                                >
                                    ▼
                                </span>
                            </button>
                            <div
                                className={`overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out ${showDates ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
                                    }`}
                            >
                                <div className="mt-3 space-y-2 pr-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                                    {dateList.map(src => {
                                        const selected = dateFilter.includes(src);
                                        return (
                                            <button
                                                key={src}
                                                onClick={() => {
                                                    setDateFilter(prev =>
                                                        src === "All"
                                                            ? ["All"]
                                                            : prev.includes(src)
                                                                ? prev.filter(s => s !== src && s !== "All")
                                                                : [...prev.filter(s => s !== "All"), src]
                                                    );
                                                }}
                                                className={`w-full px-3 py-2 rounded-lg text-left text-sm transition flex justify-between items-center
                                                        ${selected ? "bg-blue-600" : "bg-[#283335] hover:bg-white/20"}
                                                `}
                                            >
                                                {src}
                                                <span className="text-white/40">
                                                    ({src === "All" ? subs.length : dateCounts[src]})
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setSortAsc(!sortAsc)}
                            className="w-full flex items-center gap-2 bg-[#283335] border border-white/10 px-4 py-3 rounded-lg hover:border-blue-500 transition"
                        >
                            {sortAsc ? <SortAsc size={18} /> : <SortDesc size={18} />}
                            Sort Alphabetically
                        </button>
                    </aside>
                    <section className="flex-1">
                        <div className="flex justify-end mb-4 gap-3">
                            <button
                                onClick={() => exportCSV(filtered)}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm"
                            >
                                Export CSV ({filtered.length})
                            </button>
                        </div>
                        {loading ? (
                            <p>Loading...</p>
                        ) : filtered.length === 0 ? (
                            <p className="text-white/60">No subscribers found.</p>
                        ) : (
                            <>
                                <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-6">
                                    {filtered.map((sub, i) => (
                                        <div
                                            key={i}
                                            className="bg-[#283335] border border-white/10 p-5 rounded-xl space-y-3 relative"
                                        >
                                            <button
                                                className="absolute top-2 right-2 text-red-400 hover:text-red-600 text-sm"
                                                onClick={() => deleteSub(sub.email)}
                                            >
                                                ✕
                                            </button>
                                            <p className="text-lg font-semibold">{sub.username}</p>
                                            <p className="text-sm text-white/70">
                                                <strong>Email:</strong> {sub.email}
                                            </p>
                                            <p className="text-sm text-white/70">
                                                <strong>Status:</strong> {sub.status}
                                            </p>
                                            <p className="text-sm text-white/70">
                                                <strong>Source:</strong>{" "}
                                                <span className={`px-2 py-1 text-xs rounded-lg ${sub.source === "Popup"
                                                    ? "bg-blue-600"
                                                    : sub.source === "Account"
                                                        ? "bg-green-600"
                                                        : "bg-[#283335]"
                                                    }`}>
                                                    {sub.source}
                                                </span>
                                            </p>
                                            <p className="text-sm text-white/70">
                                                <strong>Joined:</strong>{" "}
                                                {sub.date ? new Date(sub.date).toLocaleDateString('en-GB') : "—"}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </main>
        </AuthWrapper>
    );
}
