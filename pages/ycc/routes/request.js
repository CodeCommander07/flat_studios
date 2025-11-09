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

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/ycc/questions');
        const data = await res.json();
        if (data.success) {
          const all = data.questions;
          setQuestions(all);
          const maxPage = Math.max(...all.map((q) => Number(q.page) || 1));
          setTotalSteps(maxPage + 1);
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

  const isVisible = (q) => {
    if (!q.triggerQuestionId) return !q.hiddenByDefault;
    const val = formData[q.triggerQuestionId];
    if (Array.isArray(val)) return val.includes(q.triggerValue);
    return val === q.triggerValue;
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const hasFiles = Object.values(formData).some((v) => v instanceof File);
      const body = hasFiles ? new FormData() : {};
      for (const [key, val] of Object.entries(formData)) {
        if (hasFiles) body.append(key, val instanceof File ? val : JSON.stringify(val));
        else body[key] = val;
      }
      const res = await fetch('/api/ycc/submit', {
        method: 'POST',
        headers: hasFiles ? undefined : { 'Content-Type': 'application/json' },
        body: hasFiles ? body : JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) alert('Form submitted successfully!');
      else alert(`Error: ${data.error || 'Unknown error'}`);
    } catch (err) {
      console.error('Submit error:', err);
      alert('An error occurred while submitting.');
    }
  };

  // 🧩 Auto options question (routes/stops)
  function AutoOptionsQuestion({ q, formData, handleChange }) {
    const [options, setOptions] = useState([]);

    useEffect(() => {
      const loadOptions = async () => {
        try {
          if (q.autoSource === 'routes') {
            const res = await fetch('/api/ycc/routes');
            const data = await res.json();
            setOptions(data.routes || []);
          } else if (q.autoSource === 'stops') {
            const res = await fetch('/api/ycc/stops');
            const data = await res.json();
            setOptions(data.stops || []);
          } else {
            setOptions(q.options || []);
          }
        } catch (err) {
          console.error('Failed to load auto options:', err);
          setOptions([]);
        }
      };
      loadOptions();
    }, [q.autoSource, q.options]);

    // Select dropdown (auto-source)
    if (q.type === 'select') {
      return (
        <select
          required={q.required}
          value={formData[q._id] || ''}
          onChange={(e) => handleChange(q._id, e.target.value)}
          className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-orange-500"
        >
          <option value="">Select...</option>
          {options.map((o, i) => {
            const name = o.name || o.routeName || o.stopName || o;
            return (
              <option key={i} value={name} className="bg-black text-white">
                {name}
              </option>
            );
          })}
        </select>
      );
    }

    // Radio buttons
    if (q.type === 'radio') {
      return (
        <div className="space-y-2">
          {options.map((o, i) => {
            const name = o.name || o.routeName || o.stopName || o;
            return (
              <label key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={q._id}
                  value={name}
                  checked={formData[q._id] === name}
                  onChange={() => handleChange(q._id, name)}
                  required={q.required}
                  className="accent-blue-500"
                />
                {name}
              </label>
            );
          })}
        </div>
      );
    }

    // Checkbox grid (scrollable stops)
    if (q.type === 'checkbox') {
      const selected = formData[q._id] || [];
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
          {options.map((opt, i) => {
            const name = opt.name || opt.stopName || opt.routeName || opt;
            const location = opt.location || opt.zone || '';
            const checked = selected.includes(name);

            return (
              <label
                key={i}
                className={`flex flex-col justify-between p-3 h-[100px] rounded-xl border cursor-pointer transition ${
                  checked
                    ? 'bg-orange-500/20 border-orange-500 text-orange-200'
                    : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const updated = e.target.checked
                      ? [...selected, name]
                      : selected.filter((x) => x !== name);
                    handleChange(q._id, updated);
                  }}
                  className="hidden"
                />
                <div className="flex flex-col justify-center text-center h-full">
                  <span className="font-semibold text-sm truncate">{name}</span>
                  {location && (
                    <span className="text-xs text-gray-400 truncate">{location}</span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      );
    }

    return null;
  }

  // 🧱 Render question (handles both auto + manual)
  const renderQuestion = (q) => {
    const isAuto = q.autoSource && q.autoSource !== 'none';

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
            className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-orange-500"
          />
        )}

        {q.type === 'textarea' && (
          <textarea
            required={q.required}
            value={formData[q._id] || ''}
            onChange={(e) => handleChange(q._id, e.target.value)}
            rows={3}
            className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-orange-500 resize-y"
          />
        )}

        {['select', 'radio', 'checkbox'].includes(q.type) &&
          (isAuto ? (
            <AutoOptionsQuestion q={q} formData={formData} handleChange={handleChange} />
          ) : q.options && q.options.length > 0 ? (
            q.type === 'select' ? (
              <select
                required={q.required}
                value={formData[q._id] || ''}
                onChange={(e) => handleChange(q._id, e.target.value)}
                className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select...</option>
                {q.options.map((opt, i) => (
                  <option key={i} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : q.type === 'radio' ? (
              <div className="space-y-2">
                {q.options.map((opt, i) => (
                  <label key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={q._id}
                      value={opt}
                      checked={formData[q._id] === opt}
                      onChange={() => handleChange(q._id, opt)}
                      className="accent-orange-500"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {q.options.map((opt, i) => (
                  <label key={i} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData[q._id]?.includes(opt) || false}
                      onChange={(e) => {
                        const prev = formData[q._id] || [];
                        const updated = e.target.checked
                          ? [...prev, opt]
                          : prev.filter((x) => x !== opt);
                        handleChange(q._id, updated);
                      }}
                      className="accent-orange-500"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )
          ) : null)}

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
        {/* Progress Bar */}
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
              {questions.filter((q) => Number(q.page) === step && isVisible(q)).length > 0 ? (
                questions
                  .filter((q) => Number(q.page) === step && isVisible(q))
                  .map((q) => renderQuestion(q))
              ) : (
                <p className="text-center text-gray-400">No questions found for this step.</p>
              )}
            </>
          ) : (
            <div className="text-center">Review Coming Soon...</div>
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
