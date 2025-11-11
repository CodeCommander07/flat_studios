'use server';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';

const LEVELS = [
    { label: 'Verbal Warning', bg: 'bg-blue-400', text: 'text-blue-900' },
    { label: 'Warning', bg: 'bg-yellow-400', text: 'text-yellow-900' },
    { label: 'Suspension', bg: 'bg-orange-500', text: 'text-orange-900' },
    { label: 'Termination', bg: 'bg-red-600', text: 'text-red-900' },
];

export default function NewDisciplinary() {
    const router = useRouter();
    const [staff, setStaff] = useState([]);
    const [loadingStaff, setLoadingStaff] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        staffId: '',
        issuedById: '',
        reason: '',
        notes: '',
        severityIndex: 0,
    });

    // 🧠 Load current user from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('User');
        if (stored) {
            try {
                const user = JSON.parse(stored);
                setForm((f) => ({
                    ...f,
                    issuedBy: user?.name || user?.username || 'Unknown User',
                    issuedById: user?._id || '', // ✅ add this
                }));

            } catch {
                console.warn('Invalid user object in localStorage');
            }
        }
    }, []);

    // 👥 Load staff
    useEffect(() => {
        fetch('/api/staff')
            .then((r) => r.json())
            .then(({ staff }) => setStaff(staff || []))
            .finally(() => setLoadingStaff(false));
    }, []);

    const severity = LEVELS[form.severityIndex].label;

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        const res = await fetch('/api/disciplinaries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                staffId: form.staffId,
                issuedById: form.issuedById, // ✅ send ID not name
                reason: form.reason,
                severity,
                notes: form.notes,
            }),

        });
        setSaving(false);
        if (res.ok) router.push('/hub+/disciplinaries');
        else alert('Failed to create disciplinary.');
    }

    const selectSeverity = (i) => setForm((f) => ({ ...f, severityIndex: i }));

    // compute fill color class dynamically
    const fillClass = LEVELS[form.severityIndex].bg;

    return (
        <div className="text-white">
            <div className="mx-auto max-w-3xl px-6 py-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">New Infraction</h1>
                    <p className="text-gray-400 mt-1">
                        Choose the staff member, select severity, and describe the infraction.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl bg-gray-900/60 border border-gray-800 p-6 shadow-sm space-y-6"
                >
                    {/* Staff dropdown */}
                    <div>
                        <label className="block text-sm text-gray-300 mb-1">Staff Member</label>
                        <select
                            required
                            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            value={form.staffId}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, staffId: e.target.value }))
                            }
                            disabled={loadingStaff}
                        >
                            <option className="text-white bg-black" value="">
                                {loadingStaff ? 'Loading staff…' : 'Select a staff member'}
                            </option>
                            {staff.map((s) => (
                                <option className="text-white bg-black" key={s._id} value={s._id}>
                                    {s.name} {s.role ? `(${s.role})` : ''}{' '}
                                    {s.email ? `– ${s.email}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Issued By */}
                    <div>
                        <label className="block text-sm text-gray-300 mb-1">Issued By</label>
                        <input
                            readOnly
                            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-gray-400"
                            value={form.issuedBy || 'Loading…'}
                        />
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm text-gray-300 mb-1">Reason</label>
                        <input
                            required
                            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            value={form.reason}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, reason: e.target.value }))
                            }
                            placeholder="Describe the infraction"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm text-gray-300 mb-1">
                            Notes (optional)
                        </label>
                        <textarea
                            rows={4}
                            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            value={form.notes}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, notes: e.target.value }))
                            }
                            placeholder="Any internal notes…"
                        />
                    </div>

                    {/* ⚡️ Severity Selector — Animated Token & Labels */}
                    <div>
                        <label className="block text-sm text-gray-300 mb-3">Severity</label>

                        <div className="relative bg-gray-950 border border-gray-800 rounded-xl py-5 px-4 overflow-hidden">
                            <div className="relative flex justify-between items-center font-semibold select-none">
                                {/* Sliding token */}
                                <motion.div
                                    className={`absolute top-1/2 -translate-y-1/2 h-8 w-[25%] rounded-lg shadow-lg backdrop-blur-md bg-opacity-90 transition-all duration-300
          ${form.severityIndex === 0 ? 'bg-blue-900 shadow-blue-900/40' : ''}
          ${form.severityIndex === 1 ? 'bg-yellow-900 shadow-yellow-900/40' : ''}
          ${form.severityIndex === 2 ? 'bg-orange-900 shadow-orange-900/40' : ''}
          ${form.severityIndex === 3 ? 'bg-red-900 shadow-red-900/40' : ''}`}
                                    animate={{
                                        left:
                                            form.severityIndex === 0
                                                ? '0%'
                                                : form.severityIndex === 1
                                                    ? '25%'
                                                    : form.severityIndex === 2
                                                        ? '50%' : '75%',
                                    }}
                                    transition={{ type: 'spring', stiffness: 250, damping: 25 }}
                                />

                                {/* Motion labels */}
                                {[
                                    { label: 'Verbal Warning', color: 'text-blue-300', hover: 'hover:text-blue-400' },
                                    { label: 'Warning', color: 'text-yellow-300', hover: 'hover:text-yellow-400' },
                                    { label: 'Suspension', color: 'text-orange-300', hover: 'hover:text-orange-400' },
                                    { label: 'Termination', color: 'text-red-300', hover: 'hover:text-red-400' },
                                ].map((lvl, i) => {
                                    const active = form.severityIndex === i;
                                    return (
                                        <motion.div
                                            key={i}
                                            onClick={() => setForm((f) => ({ ...f, severityIndex: i }))}
                                            whileTap={{ scale: 0.92 }}
                                            animate={{
                                                scale: active ? 1.1 : 1,
                                                opacity: active ? 1 : 0.8,
                                            }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                            className={`relative flex-1 text-center cursor-pointer z-10 font-medium text-sm transition-colors ${active ? lvl.color : `text-gray-300 ${lvl.hover}`
                                                }`}
                                        >
                                            {lvl.label}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>




                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => router.push('/hub+/disciplinaries')}
                            className="px-4 py-2 rounded-xl border border-gray-700 hover:bg-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={saving}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20"
                        >
                            {saving ? 'Creating…' : 'Create Infraction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
