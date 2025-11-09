'use client';

import { useState } from 'react';

export default function WebsiteReportForm() {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        robloxUsername: '',
        email: '',
        purpose: '',
        device: '',
        operator: '',
        bugDescription: '',
        bugReplication: '',
        bugEvidence: '',
        suggestion: '',
        suggestionEvidence: '',
    });

    const next = () => setStep((s) => Math.min(s + 1, 3));
    const back = () => setStep((s) => Math.max(s - 1, 1));

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const handleSubmit = async (e) => {
        await fetch('/api/ycc/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });

    };

    return (
        <main className="text-white px-6 py-12 flex flex-col items-center">
            <div className="w-full max-w-2xl bg-[#283335] border border-white/20 backdrop-blur-md rounded-2xl p-8 shadow-xl">
                <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">
                    Website Report Form
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* PAGE 1 – Contact Details */}
                    {step === 1 && (
                        <>
                            <h2 className="text-xl font-semibold mb-2">Contact Details</h2>

                            <label className="block mb-3">
                                <span className="block mb-1 text-sm font-medium text-white/80">
                                    Roblox Username *
                                </span>
                                <input
                                    type="text"
                                    name="robloxUsername"
                                    value={form.robloxUsername}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-white/10 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </label>

                            <label className="block mb-3">
                                <span className="block mb-1 text-sm font-medium text-white/80">
                                    Email (optional)
                                </span>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    className="w-full border border-white/10 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-white/50 mt-1">
                                    We may contact you for clarification. See our{' '}
                                    <a
                                        href="/privacy"
                                        className="text-blue-400 underline hover:text-blue-300"
                                    >
                                        Privacy Policy
                                    </a>
                                    .
                                </p>
                            </label>
                        </>
                    )}

                    {/* PAGE 2 – Purpose & Device */}
                    {step === 2 && (
                        <>
                            <h2 className="text-xl font-semibold mb-2">Purpose & Device</h2>

                            <label className="block mb-4">
                                <span className="block mb-1 text-sm font-medium text-white/80">
                                    What are you here to do? *
                                </span>
                                <select
                                    name="purpose"
                                    value={form.purpose}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-white/10 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option className="text-white bg-black" value="">Select...</option>
                                    <option className="text-white bg-black" value="suggestion">Make a Suggestion</option>
                                    <option className="text-white bg-black" value="bug">Report a Bug</option>
                                </select>
                            </label>

                            <label className="block mb-4">
                                <span className="block mb-1 text-sm font-medium text-white/80">
                                    What device are you playing on? *
                                </span>
                                <select
                                    name="device"
                                    value={form.device}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-white/10 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option className="text-white bg-black" value="">Select...</option>
                                    <option className="text-white bg-black" value="PC">PC</option>
                                    <option className="text-white bg-black" value="Console">Console</option>
                                    <option className="text-white bg-black" value="Tablet">Tablet</option>
                                    <option className="text-white bg-black" value="Mobile">Mobile</option>
                                </select>
                            </label>

                            <div className="mb-4">
                                <p className="text-sm font-medium text-white/80 mb-1">
                                    Which operator is this regarding? <span className="text-red-400">*</span>
                                </p>
                                <p className="text-xs text-white/60 mb-2">
                                    For all non-operator issues (anything other than their fleets) please select <strong>‘Game’</strong>.
                                </p>
                                <div className="space-y-2">
                                    {[
                                        'Yapton Country Bus',
                                        'South West Buses / Slowcoach',
                                        'IRVING Coaches',
                                        'Game',
                                    ].map((op) => (
                                        <label key={op} className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="operator"
                                                value={op}
                                                checked={form.operator === op}
                                                onChange={handleChange}
                                                required
                                                className="accent-blue-500"
                                            />
                                            <span>{op}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}


                    {/* PAGE 3 – Conditional Fields */}
                    {step === 3 && (
                        <>
                            {form.purpose === 'bug' ? (
                                <>
                                    <h2 className="text-xl font-semibold mb-2">Bug Report</h2>

                                    <label className="block mb-3">
                                        <span className="block mb-1 text-sm font-medium text-white/80">
                                            Describe the bug *
                                        </span>
                                        <textarea
                                            name="bugDescription"
                                            value={form.bugDescription}
                                            onChange={handleChange}
                                            required
                                            className="w-full border border-white/10 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                                            rows={3}
                                        />
                                    </label>

                                    <label className="block mb-3">
                                        <span className="block mb-1 text-sm font-medium text-white/80">
                                            How can this be replicated? *
                                        </span>
                                        <textarea
                                            name="bugReplication"
                                            value={form.bugReplication}
                                            onChange={handleChange}
                                            required
                                            className="w-full border border-white/10 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                                            rows={3}
                                        />
                                    </label>

                                    <label className="block mb-3">
                                        <span className="block mb-1 text-sm font-medium text-white/80">
                                            Attach evidence via link *
                                        </span>
                                        <input
                                            type="text"
                                            name="bugEvidence"
                                            value={form.bugEvidence}
                                            onChange={handleChange}
                                            placeholder="Paste your link..."
                                            required
                                            className="w-full border border-white/10 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </label>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-xl font-semibold mb-2">Suggestion</h2>

                                    <label className="block mb-3">
                                        <span className="block mb-1 text-sm font-medium text-white/80">
                                            What's your suggestion? *
                                        </span>
                                        <textarea
                                            name="suggestion"
                                            value={form.suggestion}
                                            onChange={handleChange}
                                            required
                                            className="w-full border border-white/10 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                                            rows={3}
                                        />
                                    </label>

                                    <label className="block mb-3">
                                        <span className="block mb-1 text-sm font-medium text-white/80">
                                            Attach evidence via link (optional)
                                        </span>
                                        <input
                                            type="text"
                                            name="suggestionEvidence"
                                            value={form.suggestionEvidence}
                                            onChange={handleChange}
                                            placeholder="Paste your link..."
                                            className="w-full border border-white/10 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </label>
                                </>
                            )}
                        </>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-4 border-t border-white/10">
                        {step > 1 && (
                            <button
                                type="button"
                                onClick={back}
                                className="bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-lg font-semibold"
                            >
                                Back
                            </button>
                        )}
                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={next}
                                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold ml-auto"
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg font-semibold ml-auto"
                            >
                                Submit
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </main>
    );
}
