'use client';
import AuthWrapper from '@/components/AuthWrapper';
import { useEffect, useState } from 'react';

export default function MultiStepForm() {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        // Page 1: Contact Details
        email: '',
        robloxUsername: '',
        discordUsername: '',
        discordId: '',
        robloxId: '',

        // Page 2: Operator Details
        operatorName: '',
        operatorFleet: '',
        operatorDiscord: '',
        operatorRoblox: '',
        reason: '',
    });

    const [user, setUser] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('User'));
        if (userData) {
            setUser(userData);
            setForm((prev) => ({
                ...prev,
                email: userData.email || '',
                discordUsername: userData.discordUsername || '',
                discordId: userData.discordId || '',
                robloxUsername: userData.robloxUsername || '',
                robloxId: userData.robloxId || '',
            }));
        }
    }, []);

    const totalSteps = 4;

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const validateStep = () => {
        if (step === 1) {
            if (!form.email.trim()) {
                alert('Please enter your email.');
                return false;
            }
            if (!form.robloxUsername.trim()) {
                alert('Please enter your Roblox username.');
                return false;
            }
            if (!form.discordUsername.trim()) {
                alert('Please enter your Discord username.');
                return false;
            }
            if (!form.discordId.trim()) {
                alert('Please enter your Discord ID.');
                return false;
            }
            if (!form.robloxId.trim()) {
                alert('Please enter your Roblox ID.');
                return false;
            }
        }

        if (step === 2) {
            if (!form.operatorName.trim()) {
                alert('Please enter the operator name.');
                return false;
            }
            if (!form.operatorFleet.trim()) {
                alert('Please describe the operator fleet.');
                return false;
            }
            if (!form.operatorDiscord.trim()) {
                alert('Please provide the operator Discord.');
                return false;
            }
            if (!form.operatorRoblox.trim()) {
                alert('Please provide the operator Roblox username.');
                return false;
            }
            if (!form.reason.trim()) {
                alert('Please explain the reason for creating this operator.');
                return false;
            }
        }

        return true;
    };

    const nextStep = () => {
        if (!validateStep()) return;
        if (step < totalSteps) setStep(step + 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/ycc/operators/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(form),
            });

            if (res.ok) {
                setStep(4); // Success page
            } else {
                const errorData = await res.json();
                alert(`Error submitting application: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            alert('Network error submitting application');
            console.error('Submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const progressPercent = step === 1 ? 25 : step === 2 ? 50 : step === 3 ? 75 : 100;

    const editSection = (sectionNumber) => {
        setStep(sectionNumber);
    };

    const resetForm = () => {
        setForm({
            email: '',
            robloxUsername: '',
            discordUsername: '',
            discordId: '',
            robloxId: '',
            operatorName: '',
            operatorFleet: '',
            operatorDiscord: '',
            operatorRoblox: '',
            reason: '',
        });
        setStep(1);
    };

    return (
            <main className="max-w-5xl mx-auto p-8 bg-[#283335] border border-white/20 backdrop-blur-md rounded-2xl mt-10 mb-10 shadow-lg text-white">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${progressPercent === 100 ? "bg-green-500" : "bg-orange-500"} transition-all duration-300`}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <p className="mt-2 text-center font-semibold">
                        Step {step} of {totalSteps}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {step === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-center">Step 1: Your Contact Details</h2>

                            <div>
                                <label className="block font-medium mb-1">Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded bg-[#283335] border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-medium mb-1">Roblox Username *</label>
                                    <input
                                        type="text"
                                        name="robloxUsername"
                                        value={form.robloxUsername}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded bg-[#283335] border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
                                        placeholder="Your Roblox username"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block font-medium mb-1">Roblox ID *</label>
                                    <input
                                        type="text"
                                        name="robloxId"
                                        value={form.robloxId}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded bg-[#283335] border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
                                        placeholder="Your Roblox ID"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-medium mb-1">Discord Username *</label>
                                    <input
                                        type="text"
                                        name="discordUsername"
                                        value={form.discordUsername}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded bg-[#283335] border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
                                        placeholder="username#0000"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block font-medium mb-1">Discord ID *</label>
                                    <input
                                        type="text"
                                        name="discordId"
                                        value={form.discordId}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded bg-[#283335] border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
                                        placeholder="Your Discord ID"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-center">Step 2: Operator Details</h2>

                            <div>
                                <label className="block font-medium mb-1">Operator Name *</label>
                                <input
                                    type="text"
                                    name="operatorName"
                                    value={form.operatorName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded bg-[#283335] border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
                                    placeholder="Name of your operator company"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-medium mb-1">Operator Discord *</label>
                                    <input
                                        type="text"
                                        name="operatorDiscord"
                                        value={form.operatorDiscord}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded bg-[#283335] border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
                                        placeholder="Operator Discord server/invite"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block font-medium mb-1">Operator Roblox *</label>
                                    <input
                                        type="text"
                                        name="operatorRoblox"
                                        value={form.operatorRoblox}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded bg-[#283335] border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
                                        placeholder="Operator Roblox group/username"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-medium mb-1">Operator Fleet Description *</label>
                                <textarea
                                    name="operatorFleet"
                                    value={form.operatorFleet}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded bg-[#283335] border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white resize-y"
                                    placeholder="Describe the vehicles in your fleet, types, liveries, etc."
                                    rows={4}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-medium mb-1">Reason for Creating this Operator *</label>
                                <textarea
                                    name="reason"
                                    value={form.reason}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded bg-[#283335] border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white resize-y"
                                    placeholder="Explain why you want to create this operator and what you plan to bring to the community"
                                    rows={4}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-center">Step 3: Review Your Application</h2>
                            <p className="text-center text-white/70 mb-6">
                                Please review all details carefully before submitting. You can edit any section by clicking the Edit button.
                            </p>

                            <div className="space-y-6">
                                {/* Contact Details Section */}
                                <div className="bg-[#283335] p-6 rounded-xl border border-white/20">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-semibold">Contact Details</h3>
                                        <button
                                            type="button"
                                            onClick={() => editSection(1)}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium transition"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><strong>Email:</strong> {form.email || '-'}</div>
                                        <div><strong>Roblox Username:</strong> {form.robloxUsername || '-'}</div>
                                        <div><strong>Roblox ID:</strong> {form.robloxId || '-'}</div>
                                        <div><strong>Discord Username:</strong> {form.discordUsername || '-'}</div>
                                        <div><strong>Discord ID:</strong> {form.discordId || '-'}</div>
                                    </div>
                                </div>

                                {/* Operator Details Section */}
                                <div className="bg-[#283335] p-6 rounded-xl border border-white/20">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-semibold">Operator Details</h3>
                                        <button
                                            type="button"
                                            onClick={() => editSection(2)}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium transition"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <div><strong>Operator Name:</strong> {form.operatorName || '-'}</div>
                                        <div><strong>Operator Discord:</strong> {form.operatorDiscord || '-'}</div>
                                        <div><strong>Operator Roblox:</strong> {form.operatorRoblox || '-'}</div>
                                        <div><strong>Operator Fleet:</strong>
                                            <p className="mt-1 text-white/80 whitespace-pre-wrap">{form.operatorFleet || '-'}</p>
                                        </div>
                                        <div><strong>Reason for Creation:</strong>
                                            <p className="mt-1 text-white/80 whitespace-pre-wrap">{form.reason || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6 text-center">
                            <div className="bg-green-500/20 border border-green-500/50 p-8 rounded-2xl">
                                <div className="text-6xl mb-4">🎉</div>
                                <h2 className="text-3xl font-bold text-green-400 mb-4">Application Submitted Successfully!</h2>
                                <p className="text-xl text-white/80 mb-6">
                                    Thank you for submitting your operator application to Yapton Community Council.
                                </p>
                                <div className="space-y-3 text-white/70">
                                    <p>Your application has been received and is now under review.</p>
                                    <p>We will contact you via email or Discord with updates on your application status.</p>
                                    <p className="font-semibold text-white">Expected review time: 3-5 business days</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded text-white font-semibold transition"
                                >
                                    Submit Another Application
                                </button>
                                <button
                                    type="button"
                                    onClick={() => window.location.href = '/'}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold transition"
                                >
                                    Return to Homepage
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons - Hidden on success page */}

                    {step !== 4 && (
                        <div className="flex mt-8">
                            {step > 1 && step < 4 && (
                                <button
                                    type="button"
                                    onClick={() => setStep(step - 1)}
                                    className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 rounded text-black font-semibold transition"
                                >
                                    Back
                                </button>
                            )}

                            <div className="ml-auto flex gap-4">
                                {step === 3 ? (
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-800 rounded text-black font-semibold transition"
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit Application'}
                                    </button>
                                ) : step < 3 ? (
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="px-6 py-2 bg-orange-500 hover:bg-orange-600 rounded text-white font-semibold transition"
                                    >
                                        {step === 2 ? 'Review Application' : 'Next'}
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    )}
                </form>
            </main>
    );
}