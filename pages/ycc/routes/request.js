'use client';
import { useEffect, useState } from 'react';
import AuthWrapper from '@/components/AuthWrapper';

export default function DynamicYCCForm() {
  const [questions, setQuestions] = useState([]);
  const [formData, setFormData] = useState({});
  const [step, setStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(1);
  const [pageTitles, setPageTitles] = useState({});
  const [loading, setLoading] = useState(true);

  // Load questions
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/ycc/questions');
        const data = await res.json();
        if (data.success) {
          const all = data.questions;
          setQuestions(all);
          const maxPage = Math.max(...all.map((q) => Number(q.page) || 1));
          setTotalSteps(maxPage + 1); // +1 for review
          const titles = {};
          for (const q of all) {
            if (q.pageTitle && !titles[q.page]) titles[q.page] = q.pageTitle;
          }
          setPageTitles(titles);
        }
      } catch (e) {
        console.error('Error loading questions:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (id, value) => setFormData((p) => ({ ...p, [id]: value }));

  // Visibility logic
  const isVisible = (q) => {
    if (!q.triggerQuestionId) return !q.hiddenByDefault;
    const val = formData[q.triggerQuestionId];
    if (Array.isArray(val)) return val.includes(q.triggerValue);
    return val === q.triggerValue;
  };

  // Navigation
  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    // separate file uploads from text fields
    const hasFiles = Object.values(formData).some((v) => v instanceof File);

    if (hasFiles) {
      const form = new FormData();
      for (const [key, val] of Object.entries(formData)) {
        if (val instanceof File) form.append(key, val);
        else form.append(key, typeof val === 'object' ? JSON.stringify(val) : val);
      }

      const res = await fetch('/api/ycc/submit', {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (res.ok) {
        alert('Form submitted successfully!');
        console.log(data);
      } else {
        alert(`Error: ${data.error || 'Unknown error'}`);
      }
    } else {
      const res = await fetch('/api/ycc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Form submitted successfully!');
        console.log(data);
      } else {
        alert(`Error: ${data.error || 'Unknown error'}`);
      }
    }
  } catch (err) {
    console.error('Submit error:', err);
    alert('An error occurred while submitting.');
  }
};


  const currentQuestions = questions.filter(
    (q) => Number(q.page) === step && isVisible(q)
  );

  // 🧱 Render one question (no autoSource)
  const renderQuestion = (q) => {
    return (
      <div key={q._id} className="space-y-2">
        <label className="block font-semibold">{q.label}</label>
        {q.helperText && <p className="text-sm text-gray-400">{q.helperText}</p>}

        {q.type === 'text' && (
          <input
            type="text"
            required={q.required}
            value={formData[q._id] || ''}
            onChange={(e) => handleChange(q._id, e.target.value)}
            className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-white"
          />
        )}

        {q.type === 'textarea' && (
          <textarea
            required={q.required}
            value={formData[q._id] || ''}
            onChange={(e) => handleChange(q._id, e.target.value)}
            rows={3}
            className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-white resize-y"
          />
        )}

        {['radio', 'checkbox', 'select'].includes(q.type) && (
          <>
            {q.type === 'select' && (
              <input
                type="text"
                required={q.required}
                placeholder="Enter option manually..."
                value={formData[q._id] || ''}
                onChange={(e) => handleChange(q._id, e.target.value)}
                className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-white"
              />
            )}
            {q.type === 'radio' && q.options?.length > 0 && (
              <div className="space-y-2">
                {q.options.map((o, i) => (
                  <label key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={q._id}
                      value={o}
                      checked={formData[q._id] === o}
                      onChange={() => handleChange(q._id, o)}
                      required={q.required}
                      className="accent-blue-500"
                    />
                    {o}
                  </label>
                ))}
              </div>
            )}
            {q.type === 'checkbox' && q.options?.length > 0 && (
              <div className="space-y-2">
                {q.options.map((o, i) => (
                  <label key={i} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData[q._id]?.includes(o) || false}
                      onChange={(e) => {
                        const prev = formData[q._id] || [];
                        const updated = e.target.checked
                          ? [...prev, o]
                          : prev.filter((x) => x !== o);
                        handleChange(q._id, updated);
                      }}
                      className="accent-blue-500"
                    />
                    {o}
                  </label>
                ))}
              </div>
            )}
          </>
        )}

        {q.type === 'file' && (
          <input
            type="file"
            required={q.required}
            onChange={(e) => handleChange(q._id, e.target.files[0])}
            className="w-full text-white"
          />
        )}
      </div>
    );
  };

  // 🧾 Review grouped by page
  const renderReview = () => {
    const pages = {};
    for (const q of questions) {
      if (!isVisible(q)) continue;
      const val = formData[q._id];
      if (!val || val === '') continue;

      const pageKey = q.page;
      if (!pages[pageKey])
        pages[pageKey] = { title: pageTitles[q.page] || `Page ${q.page}`, items: [] };
      pages[pageKey].items.push({ label: q.label, value: val });
    }

    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-center mb-4">Step {step}: Review & Confirm</h2>

        {Object.keys(pages).map((p) => (
          <div
            key={p}
            className="bg-white/10 p-6 rounded-xl border border-white/20 space-y-3"
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-1 mb-3">
              <h3 className="text-lg font-semibold">{pages[p].title}</h3>
              <button
                type="button"
                onClick={() => setStep(Number(p))}
                className="text-sm bg-blue-500 hover:bg-blue-600 text-black px-3 py-1 rounded"
              >
                Edit
              </button>
            </div>

            {pages[p].items.map((i, idx) => (
              <div key={idx}>
                <p className="font-medium">{i.label}</p>
                <p className="text-sm text-gray-300 break-words">
                  {Array.isArray(i.value)
                    ? i.value.join(', ')
                    : i.value?.name || i.value.toString()}
                </p>
              </div>
            ))}
          </div>
        ))}

        <p className="text-center text-white/70">
          Please review your answers before submitting.
        </p>
      </div>
    );
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <p>Loading form...</p>
      </div>
    );

  const currentTitle = pageTitles[step] || `Step ${step}`;

  return (
    <AuthWrapper requiredRole="ycc">
      <main className="max-w-4xl mx-auto mt-10 p-8 bg-white/10 border border-white/20 rounded-2xl text-white backdrop-blur-lg shadow-lg">
        <div className="mb-6">
          <div className="w-full h-2 bg-white/20 rounded-full">
            <div
              className="h-2 bg-orange-500 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-center">
            Step {step} of {totalSteps}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step < totalSteps ? (
            <>
              <h2 className="text-2xl font-bold text-center mb-6">{currentTitle}</h2>
              {currentQuestions.length > 0 ? (
                currentQuestions.map((q) => renderQuestion(q))
              ) : (
                <p className="text-center text-gray-400">
                  {questions.some((q) => Number(q.page) === step)
                    ? 'Please complete the previous step to reveal questions for this section.'
                    : 'No questions found for this step.'}
                </p>
              )}
            </>
          ) : (
            renderReview()
          )}

          <div className="flex mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded"
              >
                Back
              </button>
            )}
            {step < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="ml-auto px-6 py-2 bg-orange-500 hover:bg-orange-600 rounded"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="ml-auto px-6 py-2 bg-green-500 hover:bg-green-600 text-black rounded"
              >
                Submit
              </button>
            )}
          </div>
        </form>
      </main>
    </AuthWrapper>
  );
}
