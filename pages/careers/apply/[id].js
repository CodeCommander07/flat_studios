'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { useRouter } from 'next/router';

export default function ApplicationView() {
    const params = useParams();
    const router = useRouter();
    const { id } = params || {};

    const [form, setForm] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [email, setEmail] = useState('');

    useEffect(() => {
        if (!id) return;
        axios.get(`/api/careers/applications/${id}`).then((res) => setForm(res.data));
    }, [id]);

    const handleAnswerChange = (questionId, value, type, checked) => {
        setAnswers((prev) => {
            const existing = prev.find((a) => a.questionId === questionId);

            // 🟦 Handle checkboxes as an array of selected options
            if (type === 'checkbox') {
                if (existing) {
                    const updatedAnswers = checked
                        ? [...(existing.answer || []), value] // add if checked
                        : (existing.answer || []).filter((v) => v !== value); // remove if unchecked

                    return prev.map((a) =>
                        a.questionId === questionId ? { ...a, answer: updatedAnswers } : a
                    );
                } else {
                    return [...prev, { questionId, answer: [value] }];
                }
            }

            // 🟩 Handle all other question types normally (single answer)
            if (existing) {
                return prev.map((a) =>
                    a.questionId === questionId ? { ...a, answer: value } : a
                );
            }

            return [...prev, { questionId, answer: value }];
        });
    };


    const handleSubmit = async () => {
        if (!form) return;
        setSubmitting(true);
        try {
            await axios.post('/api/careers/submissions', {
                appTitle: form.title,
                applicationId: form._id,
                applicantEmail: email,
                answers,
            });
            router.push('/careers/success');
        } catch (err) {
            console.error('Submit failed:', err);
            alert('Something went wrong while submitting.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!form) return <p className="text-center text-white mt-10">Loading...</p>;

    return (
        <main className="max-w-7xl mx-auto px-4 py-10 text-white grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-8 min-h-[700px]">
            {/* LEFT — Details */}
            <div className="bg-[#283335] p-6 rounded-2xl shadow-lg min-h-[700px] h-fit lg:sticky lg:top-8 space-y-4">
                <h1 className="text-3xl font-bold mb-2">{form.title}</h1>
                <p className="text-gray-300">{form.description}</p>

                {form.requirements && (
                    <div>
                        <h2 className="text-lg font-semibold mt-4 mb-2">Requirements</h2>
                        <ul className="list-disc list-inside text-gray-400 space-y-1">
                            {form.requirements.split('\n').map((req, i) => (
                                <li key={i}>{req}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="pt-4 mt-6 border-t border-white/10 text-center">
                    <span
                        className={`inline-block px-3 py-1 rounded-md text-sm font-semibold ${form.open ? 'bg-green-700' : 'bg-red-700'
                            }`}
                    >
                        {form.open ? 'Open for Applications' : 'Closed'}
                    </span>
                </div>
            </div>

            {/* RIGHT — Questions Panel */}
            <div className="bg-[#283335] p-6 rounded-2xl shadow-lg flex flex-col relative min-h-[700px] max-h-[700px]">
                <h2 className="text-xl font-bold mb-4">Application Form</h2>

                {/* Scrollable Questions */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                    <label className="block mb-1 font-medium">
                        Email Address<span className='text-red-400'>*</span>{' '}
                        <span className="text-sm text-gray-400">
                            (We will contact you via this email)
                        </span>
                    </label>
                    <input
                        type="text"
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                        className="w-full p-2 rounded-md glass placeholder-white/60"
                        value={email}
                        required
                        placeholder="Your Email"
                    />
                    {form.questions && form.questions.length > 0 ? (
                        form.questions.map((q) => (
                            <div key={q.id || q._id} className="space-y-2 border-t pt-4 border-white/10">
                                <label className="block mb-1 font-medium text-white">
                                    {q.label}
                                    {q.type && (
                                        <span className="ml-2 text-xs text-gray-500">({q.type})</span>
                                    )}
                                </label>

                                {q.info && (
                                    <p className="text-white/60 text-sm italic mb-1">{q.info}</p>
                                )}

                                {q.type === 'short' && (
                                    <input
                                        type="text"
                                        onChange={(e) =>
                                            handleAnswerChange(q.id || q._id, e.target.value)
                                        }
                                        className="w-full p-2 rounded-md glass placeholder-white/60"
                                        placeholder="Your answer"
                                    />
                                )}

                                {q.type === 'long' && (
                                    <textarea
                                        rows={3}
                                        onChange={(e) =>
                                            handleAnswerChange(q.id || q._id, e.target.value)
                                        }
                                        className="w-full p-2 rounded-md glass placeholder-white/60"
                                        placeholder="Your detailed answer"
                                    ></textarea>
                                )}

                                {q.type === 'number' && (
                                    <input
                                        type="number"
                                        onChange={(e) =>
                                            handleAnswerChange(q.id || q._id, e.target.value)
                                        }
                                        className="w-full p-2 rounded-md glass placeholder-white/60"
                                        placeholder="Enter a number"
                                    />
                                )}

                                {q.type === 'radio' && (
                                    <div className="space-y-1">
                                        {q.options?.map((opt, i) => (
                                            <label key={i} className="flex items-center gap-2 text-gray-300 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name={q.id || q._id}
                                                    value={opt}
                                                    onChange={(e) =>
                                                        handleAnswerChange(q.id || q._id, e.target.value)
                                                    }
                                                />
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {q.type === 'checkbox' && (
                                    <div className="space-y-1">
                                        {q.options?.map((opt, i) => (
                                            <label key={i} className="flex items-center gap-2 text-gray-300 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name={q.id || q._id}
                                                    value={opt}
                                                    onChange={(e) =>
                                                        handleAnswerChange(
                                                            q.id || q._id,
                                                            e.target.value,
                                                            'checkbox',
                                                            e.target.checked
                                                        )
                                                    }
                                                />
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-400">No questions have been added yet.</p>
                    )}

                </div>

                {/* Fixed Submit Button */}
                <div className="pt-4 sticky bottom-0 left-0 right-0 backdrop-blur-md border-t border-white/10 mt-4">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !form.open}
                        className={`w-full py-3 rounded-md font-semibold transition ${form.open
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-gray-600 cursor-not-allowed'
                            }`}
                    >
                        {submitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                </div>
            </div>

            <style jsx>{`
        .glass {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        ::-webkit-scrollbar {
          display: none;
        }
      `}</style>
        </main>
    );
}
