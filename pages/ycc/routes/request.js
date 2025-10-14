'use client';
import AuthWrapper from '@/components/AuthWrapper';
import { useEffect, useState } from 'react';

export default function MultiStepForm() {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        email: '',
        discordTag: '',
        selectedCompany: '',
        routeSubmissionType: '',
        P3Q1: '',         // routeNumber or routeId
        P3Q2: '',         // allocatedVehicle or new start stop
        P3Q3: '',         // startingLocation (for new route)
        P3Q4: [],         // via stops (array!)
        P3Q5: '',         // finishingLocation or details of change
        P3Q6: null,       // uploadMap (file)
    });


    const [user, setUser] = useState(null); // Assuming user data is fetched and set somewhere

    const [routesList, setRoutesList] = useState([]);
    const [stopsList, setStopsList] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [routesRes, stopsRes] = await Promise.all([
                    fetch('/api/ycc/routes'),
                    fetch('/api/ycc/stops')
                ]);
                const routesData = await routesRes.json();
                const stopsData = await stopsRes.json();

                if (routesData.success) setRoutesList(routesData.routes);
                if (stopsData.success) setStopsList(stopsData.stops);
            } catch (err) {
                console.error('Error loading data:', err);
            }
        };
        fetchData();
    }, []);


    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('User'));
        if (userData) {
            setUser(userData);
            setForm((prev) => ({
                ...prev,
                email: userData.email || '',
                discordTag: userData.discordUsername || '',
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
            if (!form.discordTag.trim()) {
                alert('Please enter your Discord tag.');
                return false;
            }
            if (!form.selectedCompany) {
                alert('Please select your company.');
                return false;
            }
        }

        if (step === 2) {
            if (!form.routeSubmissionType) {
                alert('Please select an option for route submission.');
                return false;
            }
        }

        if (step === 3) {
            if (!form.P3Q1.trim()) {
                alert('Please fill in the Route Number.');
                return false;
            }
            if (!form.P3Q2.trim()) {
                alert(step === 3 && form.routeSubmissionType === 'new'
                    ? 'Please fill in the Allocated/Recommended Vehicle.'
                    : 'Please fill in the New Start Loc.'
                );
                return false;
            }
            if (form.routeSubmissionType === 'change' && !form.P3Q5.trim()) {
                alert('Please fill in the Details of Change.');
                return false;
            }
            if (!form.P3Q5.trim() && form.routeSubmissionType === 'new') {
                // In "new" flow P3Q5 is finishingLocation, so required
                alert('Please fill in the Finishing Location.');
                return false;
            }
            if (!form.P3Q6) {
                alert('Please upload the map.');
                return false;
            }
        }

        return true; // All good
    };


    const nextStep = () => {
        if (!validateStep()) return; // stop if validation fails

        if (step < totalSteps) setStep(step + 1);
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('email', form.email);
        formData.append('discordTag', form.discordTag);
        formData.append('selectedCompany', form.selectedCompany);
        formData.append('routeSubmissionType', form.routeSubmissionType);
        formData.append('P3Q1', form.P3Q1);
        formData.append('P3Q2', form.P3Q2);
        formData.append('P3Q3', form.P3Q3);
        formData.append('P3Q4', form.P3Q4);
        formData.append('P3Q5', form.P3Q5);
        formData.append('mapFile', form.P3Q6);

        const res = await fetch('/api/ycc', {
            method: 'POST',
            body: formData,
        });
        if (res.ok) {
            alert('Request submitted successfully!');
            setForm({
                email: '',
                discordTag: '',
                selectedCompany: '',
                routeSubmissionType: '',
                P3Q1: '',
                P3Q2: '',
                P3Q3: '',
                P3Q4: [],  // reset to empty array
                P3Q5: '',
                P3Q6: null,
            });

            setStep(1); // Reset to first step
        } else {
            const errorData = await res.json();
            alert(`Error submitting request: ${errorData.error || 'Unknown error'}`);
        }
    };

    // Calculate progress bar width (%)
    let progressPercent;
    if (step === 1) progressPercent = 25;
    else if (step === 2) progressPercent = 50;
    else if (step === 3) progressPercent = 75;
    else if (step === 4) progressPercent = 100;
    else progressPercent = 0;

    // Helper functions to get display names
    const getStopName = (stopId) => {
        const stop = stopsList.find((s) => s.stopId === stopId);
        return stop ? `${stop.name} (${stop.town})` : stopId || '-';
    };

    const getRouteName = (routeId) => {
        const route = routesList.find((r) => r.routeId === routeId);
        return route ? `Route ${route.number} | ${route.origin} → ${route.destination}` : routeId || '-';
    };

    // Auto-fill route details when a route is selected (for editing)
    useEffect(() => {
        if (form.routeSubmissionType === 'change' && form.P3Q1 && routesList.length > 0) {
            const selectedRoute = routesList.find(r => r.routeId === form.P3Q1);

            if (selectedRoute) {
                setForm(prev => ({
                    ...prev,
                    // Adjust these based on your real structure:
                    P3Q2: selectedRoute.origin || selectedRoute.startStop || prev.P3Q2 || '',
                    P3Q3: selectedRoute.viaStops || selectedRoute.stops?.slice(1, -1) || prev.P3Q3 || [],
                    P3Q4: selectedRoute.destination || selectedRoute.endStop || prev.P3Q4 || '',
                }));
            }
        }
    }, [form.P3Q1, form.routeSubmissionType, routesList]);

    return (
        <AuthWrapper requiredRole="ycc">

            <main className="max-w-4xl mx-auto p-8 bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl mt-10 mb-10 shadow-lg text-white">
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
                            <h2 className="text-2xl font-bold text-center">Step 1: Basic Info</h2>

                            <div>
                                <label className="block font-medium mb-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-medium mb-1">Discord Tag</label>
                                <input
                                    type="text"
                                    name="discordTag"
                                    value={form.discordTag}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
                                    placeholder="user#0001"
                                    required
                                />
                            </div>

                            <div>
                                <p className="block font-medium mb-2">Select Your Company</p>
                                <div className="flex flex-col space-y-3">
                                    {['IRVING Coaches', 'South West Buses', 'West Coast motors', 'Slowcoach'].map((company) => (
                                        <label key={company} className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="selectedCompany"
                                                value={company}
                                                checked={form.selectedCompany === company}
                                                onChange={handleChange}
                                                required
                                                className="accent-blue-600"
                                            />
                                            <span>{company}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-center">Step 2: Route Submission Type</h2>

                            <p className="mb-4 font-medium">
                                Are you here to submit a new route or submit a change to an existing route? <span className="text-red-500">*</span>
                            </p>

                            <div className="flex flex-col space-y-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="routeSubmissionType"
                                        value="new"
                                        checked={form.routeSubmissionType === 'new'}
                                        onChange={handleChange}
                                        required
                                        className="accent-blue-600"
                                    />
                                    <span>Submit a new route</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="routeSubmissionType"
                                        value="change"
                                        checked={form.routeSubmissionType === 'change'}
                                        onChange={handleChange}
                                        required
                                        className="accent-blue-600"
                                    />
                                    <span>Submit a proposed change to an existing route</span>
                                </label>
                            </div>
                        </div>
                    )}
                    {step === 3 && form.routeSubmissionType === 'new' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-center">Step 3: New Route Details</h2>

                            <div>
                                <label className="block font-medium mb-1">Route Number</label>
                                <input
                                    type="text"
                                    name="P3Q1"
                                    value={form.P3Q1}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
                                    placeholder="e.g. 101A"
                                    required
                                />
                            </div>


                            <div>
                                <label className="block font-medium mb-1">Starting Location</label>
                                <select
                                    name="P3Q3"
                                    value={form.P3Q3}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white"
                                    required
                                >
                                    <option value="">Select a bus stop...</option>
                                    {stopsList.map((stop) => (
                                        <option className='bg-black text-white' key={stop.stopId} value={stop.stopId}>
                                            {stop.name} ({stop.town})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-medium mb-1">Via Stops (click to select)</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 bg-white/10 rounded border border-white/20">
                                    {stopsList.map((stop) => {
                                        const selected = form.P3Q4?.includes(stop.stopId);
                                        return (
                                            <button
                                                key={stop.stopId}
                                                type="button"
                                                onClick={() => {
                                                    const selected = form.P3Q4.includes(stop.stopId);
                                                    const updated = selected
                                                        ? form.P3Q4.filter(id => id !== stop.stopId)
                                                        : [...form.P3Q4, stop.stopId];
                                                    setForm({ ...form, P3Q4: updated });
                                                }}
                                                className={`text-left px-4 py-2 rounded-lg transition-all border ${selected
                                                    ? 'bg-green-600 border-green-400 text-white shadow-md scale-[1.02]'
                                                    : 'bg-white/5 border-white/20 hover:bg-white/20 text-gray-200'
                                                    }`}
                                            >
                                                <span className="font-medium">{stop.name}</span>
                                                <span className="text-sm text-gray-400 ml-1">({stop.town})</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>


                            <div>
                                <label className="block font-medium mb-1">Finishing Location</label>
                                <select
                                    name="P3Q5"
                                    value={form.P3Q5}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white"
                                    required
                                >
                                    <option value="">Select a bus stop...</option>
                                    {stopsList.map((stop) => (
                                        <option className='bg-black text-white' key={stop.stopId} value={stop.stopId}>
                                            {stop.name} ({stop.town})
                                        </option>
                                    ))}
                                </select>
                            </div>


                            <div>
                                <label className="block font-medium mb-1">Allocated/Recommended Vehicle</label>
                                <input
                                    type="text"
                                    name="P3Q2"
                                    value={form.P3Q2}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
                                    placeholder="e.g. Volvo B9TL"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Upload Map</label>
                                <input
                                    type="file"
                                    name="P3Q6"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => setForm({ ...form, P3Q6: e.target.files[0] })}
                                    className="w-full text-white"
                                />
                            </div>
                        </div>
                    )}
                    {step === 3 && form.routeSubmissionType === 'change' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-center">Step 3: Proposed Change Details</h2>

                            <div>
                                <label className="block font-medium mb-1">Select Route</label>
                                <select
                                    name="P3Q1"
                                    value={form.P3Q1}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white"
                                    required
                                >
                                    <option value="">Select a route...</option>
                                    {routesList.map((r) => (
                                        <option className='bg-black text-white' key={r.routeId} value={r.routeId}>
                                            Route {r.number} | {getStopName(r.startStop)} → {getStopName(r.endStop)}
                                        </option>
                                    ))}
                                </select>

                            </div>

                            <div>
                                <label className="block font-medium mb-1">New Start Location</label>
                                <select
                                    name="P3Q2"
                                    value={form.P3Q2}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white"
                                    required
                                >
                                    <option value="">Select a bus stop...</option>
                                    {stopsList.map((stop) => (
                                        <option className='bg-black text-white' key={stop.stopId} value={stop.stopId}>
                                            {stop.name} ({stop.town})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Via Stops (click to select)</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 bg-white/10 rounded border border-white/20">
                                    {stopsList.map((stop) => {
                                        const selected = form.P3Q3?.includes(stop.stopId);
                                        return (
                                            <button
                                                key={stop.stopId}
                                                type="button"
                                                onClick={() => {
                                                    const selected = form.P3Q3.includes(stop.stopId);
                                                    const updated = selected
                                                        ? form.P3Q3.filter(id => id !== stop.stopId)
                                                        : [...form.P3Q3, stop.stopId];
                                                    setForm({ ...form, P3Q3: updated });
                                                }}
                                                className={`text-left px-4 py-2 rounded-lg transition-all border ${selected
                                                    ? 'bg-green-600 border-green-400 text-white shadow-md scale-[1.02]'
                                                    : 'bg-white/5 border-white/20 hover:bg-white/20 text-gray-200'
                                                    }`}
                                            >
                                                <span className="font-medium">{stop.name}</span>
                                                <span className="text-sm text-gray-400 ml-1">({stop.town})</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block font-medium mb-1">New Finish Location</label>
                                <select
                                    name="P3Q4"
                                    value={form.P3Q4}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white"
                                    required
                                >
                                    <option value="">Select a bus stop...</option>
                                    {stopsList.map((stop) => (
                                        <option className='bg-black text-white' key={stop.stopId} value={stop.stopId}>
                                            {stop.name} ({stop.town})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-medium mb-1">Details of Change</label>
                                <textarea
                                    name="P3Q5"
                                    value={form.P3Q5}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white resize-y"
                                    placeholder="Describe the proposed change in detail"
                                    rows={4}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-medium mb-1">New Map</label>
                                <input
                                    type="file"
                                    name="P3Q6"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => setForm({ ...form, P3Q6: e.target.files[0] })}
                                    className="w-full text-white"
                                />
                            </div>
                        </div>
                    )}
                    {step === 4 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-center mb-4">Step 4: Confirm Your Details</h2>

                            <div className="bg-white/10 p-6 rounded-xl border border-white/20 space-y-4 text-white/90">
                                <div>
                                    <strong>Email:</strong> {form.email || '-'}
                                </div>
                                <div>
                                    <strong>Discord Tag:</strong> {form.discordTag || '-'}
                                </div>
                                <div>
                                    <strong>Selected Company:</strong> {form.selectedCompany || '-'}
                                </div>
                                <div>
                                    <strong>Route Submission Type:</strong> {form.routeSubmissionType === 'new' ? 'New Route' : form.routeSubmissionType === 'change' ? 'Proposed Change' : '-'}
                                </div>

                                {/* Show different Page 3 question details based on submission type */}
                                {form.routeSubmissionType === 'new' ? (
                                    <>
                                        <h3 className="mt-4 font-semibold">New Route Details</h3>
                                        <div><strong>Route Number:</strong> {form.P3Q1 || '-'}</div>
                                        <div><strong>Recomended Vehicles:</strong> {form.P3Q5 || '-'}</div>
                                        <div><strong>Starting Location:</strong> {getStopName(form.P3Q2)}</div>
                                        <div><strong>Via:</strong>
                                            {Array.isArray(form.P3Q3) && form.P3Q3.length > 0
                                                ? form.P3Q3.map(id => getStopName(id)).join(', ')
                                                : '-'}
                                        </div>
                                        <div><strong>Finishing Location:</strong> {getStopName(form.P3Q4)}</div>


                                        <div>
                                            <strong>Uploaded Map:</strong>{' '}
                                            {form.P3Q6 ? form.P3Q6.name || form.P3Q6.fileName || 'File selected' : '-'}
                                        </div>
                                    </>
                                ) : form.routeSubmissionType === 'change' ? (
                                    <>
                                        <h3 className="mt-4 font-semibold">Proposed Change Details</h3>
                                        <div><strong>Route:</strong> {getRouteName(form.P3Q1)}</div>
                                        <div><strong>New Start Loc:</strong> {getStopName(form.P3Q2)}</div>
                                        <div><strong>New Via:</strong>
                                            {Array.isArray(form.P3Q3) && form.P3Q3.length > 0
                                                ? form.P3Q3.map(id => getStopName(id)).join(', ')
                                                : '-'}
                                        </div>
                                        <div><strong>New Finish:</strong> {getStopName(form.P3Q4)}</div>


                                        <div><strong>Details of Change:</strong> {form.P3Q5 || '-'}</div>
                                        <div>
                                            <strong>Uploaded New Map:</strong>{' '}
                                            {form.P3Q6 ? form.P3Q6.name || form.P3Q6.fileName || 'File selected' : '-'}
                                        </div>
                                    </>
                                ) : (
                                    <div>No route submission type selected.</div>
                                )}
                            </div>

                            <p className="mt-4 text-center text-white/70">
                                Please review your information before submitting.
                            </p>
                        </div>
                    )}

                    <div className="flex mt-8">
                        {step > 1 && (
                            <button
                                type="button"
                                onClick={() => setStep(step - 1)}
                                className="px-6 py-2 bg-yellow-500 hover:bg-yellow-500 rounded text-black"
                            >
                                Back
                            </button>
                        )}

                        <button
                            type={step === totalSteps ? "submit" : "button"}
                            onClick={step === totalSteps ? undefined : nextStep}
                            className={`ml-auto px-6 py-2 ${step === totalSteps ? "bg-green-500 hover:bg-green-700 text-black" : "bg-orange-500 hover:bg-orange-700 text-white"} rounded`}
                        >
                            {step === totalSteps ? "Submit" : "Next"}
                        </button>
                    </div>


                </form>
            </main>
        </AuthWrapper>
    );
}
