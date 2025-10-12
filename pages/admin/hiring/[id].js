'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import AuthWrapper from '@/components/AuthWrapper';

export default function EditForm() {
  const params = useParams();

  if (!params || !params.id) {
    return <p className="text-center text-white">Loading...</p>;
  }

  const { id } = params;

  const [form, setForm] = useState(null);
  const [qLabel, setQLabel] = useState('');
  const [qType, setQType] = useState('short');
  const [qOptions, setQOptions] = useState(['']);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get(`/api/careers/applications/${id}`).then((r) => setForm(r.data));
  }, [id]);

  const saveForm = async (data) => {
    setSaving(true);
    try {
      await axios.put(`/api/careers/applications/${id}`, data);
      setForm(data);
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = async () => {
    if (!qLabel.trim()) return alert('Please enter a question label');
    const q = {
      label: qLabel.trim(),
      type: qType,
      options: qType === 'radio' ? qOptions.filter((o) => o.trim()) : [],
    };
    const data = { ...form, questions: [...form.questions, q] };
    await saveForm(data);
    setQLabel('');
    setQOptions(['']);
    setQType('short');
  };

  const removeQuestion = (idx) => {
    const data = { ...form, questions: form.questions.filter((_, i) => i !== idx) };
    saveForm(data);
  };

  const toggleStatus = async (newStatus) => {
    if (saving) return;
    const data = { ...form, open: newStatus };
    await saveForm(data);
  };

  if (!form) return <p className="text-center text-white">Loading...</p>;

  return (
    <AuthWrapper requiredRole="admin">
    <main className="max-w-3xl mx-auto px-4 py-10 text-white">
      <div className="glass p-6 rounded-2xl shadow-lg space-y-6">
        <h1 className="text-3xl font-bold">Edit Role: {form.title}</h1>

        {/* Status Toggle */}
        <div className="flex gap-4 items-center">
          <span className="font-semibold text-white/70">Status:</span>
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium cursor-default select-none ${form.open ? 'bg-green-600' : 'bg-red-600'
              }`}
          >
            {form.open ? 'Open' : 'Closed'}
          </span>
          <div className="ml-auto space-x-2">
            <button
              onClick={() => toggleStatus(true)}
              disabled={saving || form.open === true}
              className="bg-green-700 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 rounded-md text-sm transition"
            >
              Mark Open
            </button>
            <button
              onClick={() => toggleStatus(false)}
              disabled={saving || form.open === false}
              className="bg-red-700 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 rounded-md text-sm transition"
            >
              Mark Closed
            </button>
          </div>
        </div>

        {/* Add Question */}
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-4">
          <h2 className="text-xl font-semibold">Add New Question</h2>
          <input
            placeholder="Question Label"
            value={qLabel}
            onChange={(e) => setQLabel(e.target.value)}
            className="w-full p-2 rounded-md bg-white/10 placeholder-white/50"
            disabled={saving}
          />
          <select
            className="w-full p-2 rounded-md bg-white/10 text-white"
            value={qType}
            onChange={(e) => setQType(e.target.value)}
            disabled={saving}
          >
            <option className="bg-black text-white" value="short">Short Answer</option>
            <option className="bg-black text-white" value="long">Long Answer</option>
            <option className="bg-black text-white" value="radio">Multiple Choice (Radio)</option>
          </select>

          {qType === 'radio' && (
            <div className="space-y-2">
              {qOptions.map((opt, i) => (
                <input
                  key={i}
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={(e) =>
                    setQOptions((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                  }
                  className="w-full p-2 rounded-md bg-white/10 placeholder-white/50"
                  disabled={saving}
                />
              ))}
              <button
                onClick={() => setQOptions((prev) => [...prev, ''])}
                className="text-blue-400 hover:underline text-sm"
                disabled={saving}
              >
                + Add Option
              </button>
            </div>
          )}

          <button
            onClick={addQuestion}
            className="mt-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-semibold"
            disabled={saving}
          >
            Add Question
          </button>
        </div>

        {/* Questions List */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Existing Questions</h2>
          <ul className="space-y-2">
            {form.questions.map((q, i) => (
              <li
                key={i}
                className="flex justify-between items-center bg-white/5 border border-white/10 p-3 rounded-lg"
              >
                <div>
                  <p className="font-medium">{q.label}</p>
                  <p className="text-xs text-white/60">{q.type}</p>
                </div>
                <button
                  onClick={() => removeQuestion(i)}
                  className="text-red-400 hover:underline text-sm"
                  disabled={saving}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
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
    </AuthWrapper>
  );
}
