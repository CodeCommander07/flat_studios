'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';

export default function EditForm() {
    const params = useParams();

    if (!params || !params.id) {
        return <p className="text-center text-white">Loading...</p>;
    }

    const { id } = params;
    const [form, setForm] = useState(null);
    const [answers, setAnswers] = useState({});
    const [email, setEmail] = useState('');
    const [msg, setMsg] = useState('');

    useEffect(() => {
        axios.get(`/api/careers/applications/${id}`).then((r) => setForm(r.data));
    }, [id]);

    const submit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/careers/submissions', {
                applicationId: id,
                applicantEmail: email,
                answers: form.questions.map((q) => ({
                    questionLabel: q.label,
                    answer: answers[q.label] || '',
                })),
            });
            setMsg(res.status === 201 ? '✅ Submitted!' : '❌ Error');
            setAnswers({});
            setEmail('');
        } catch (err) {
            console.error(err);
            setMsg('❌ Submission failed.');
        }
    };

    if (!form) return <p className="text-center text-white">Loading...</p>;

    return (
        <main className="max-w-2xl mx-auto px-4 py-10 text-white">
            <div className="glass p-6 rounded-2xl shadow-lg space-y-6">
                <h1 className="text-3xl font-bold">{form.title}</h1>
                <p className="text-white/70">{form.description}</p>

                <form onSubmit={submit} className="space-y-6">
                    {/* Email field */}
                    <div>
                        <label className="block text-sm mb-1">Your Email</label>
                        <input
                            type="email"
                            required
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 rounded-md bg-white/10 placeholder-white/60"
                        />
                    </div>

                    {/* Dynamic questions */}
                    {form.questions.map((q) => (
                        <div key={q.label}>
                            <label className="block mb-1 font-medium">{q.label}</label>

                            {q.type === 'short' && (
                                <input
                                    type="text"
                                    placeholder="Type your answer..."
                                    className="w-full p-3 rounded-md bg-white/10 placeholder-white/60"
                                    value={answers[q.id] || ''}
                                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}

                                />
                            )}

                            {q.type === 'long' && (
                                <textarea
                                    placeholder="Type your answer..."
                                    className="w-full p-3 rounded-md bg-white/10 placeholder-white/60 resize-none"
                                    value={answers[q.id] || ''}
                                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}

                                />
                            )}

                            {q.type === 'radio' && (
                                <div className="space-y-2 bg-white/5 p-3 rounded-md">
                                    {q.options.map((opt) => (
                                        <label
                                            key={opt}
                                            className={`flex items-center gap-3 cursor-pointer text-white/90 ${answers[q.id] === opt ? 'bg-white/10 px-2 py-1 rounded' : ''
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name={q.id}  // use q.id, not q.label
                                                value={opt}
                                                className="accent-blue-500"
                                                checked={answers[q.id] === opt}
                                                onChange={() =>
                                                    setAnswers((prev) => ({ ...prev, [q.id]: opt }))
                                                }
                                            />
                                            <span>{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {q.type === 'number' && (
                                <input
                                    type="number"
                                    placeholder="Type your answer..."
                                    className="w-full p-3 rounded-md bg-white/10 placeholder-white/60"
                                    value={answers[q.id] || ''}
                                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}

                                />
                            )}

                        </div>
                    ))}

                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-md font-semibold"
                    >
                        Submit Application
                    </button>
                </form>

                {msg && (
                    <p
                        className={`mt-4 font-medium ${msg.startsWith('✅') ? 'text-green-400' : 'text-red-400'
                            }`}
                    >
                        {msg}
                    </p>
                )}
            </div>

            {/* Glassmorphism styling */}
            <style jsx>{`
        .glass {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
        </main>
    );
}
