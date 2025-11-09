'use client';
import { useEffect, useState, Fragment } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import AuthWrapper from '@/components/AuthWrapper';

export default function DynamicYCCForm() {
  const [questions, setQuestions] = useState([]);
  const [formData, setFormData] = useState({});
  const [step, setStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(1);
  const [pageTitles, setPageTitles] = useState({});
  const [loading, setLoading] = useState(true);

  // 📦 Load questions
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

  // 🔍 Conditional visibility
  const isVisible = (q) => {
    if (!q.triggerQuestionId) return !q.hiddenByDefault;
    const val = formData[q.triggerQuestionId];
    if (Array.isArray(val)) return val.includes(q.triggerValue);
    return val === q.triggerValue;
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  // 📤 Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const hasFiles = Object.values(formData).some((v) => v instanceof File);
      const body = hasFiles
        ? (() => {
            const form = new FormData();
            for (const [key, val] of Object.entries(formData))
              form.append(key, val instanceof File ? val : JSON.stringify(val));
            return form;
          })()
        : JSON.stringify(formData);
      const res = await fetch('/api/ycc/submit', {
        method: 'POST',
        headers: hasFiles ? {} : { 'Content-Type': 'application/json' },
        body,
      });
      const data = await res.json();
      if (res.ok) alert('Form submitted successfully!');
      else alert(`Error: ${data.error || 'Unknown error'}`);
    } catch (err) {
      console.error('Submit error:', err);
      alert('An error occurred while submitting.');
    }
  };

  // 🧩 Auto-populated options (routes/stops)
  function AutoOptionsQuestion({ q }) {
    const [options, setOptions] = useState([]);
    const [query, setQuery] = useState('');

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
          console.error('Failed to load options', err);
        }
      };
      loadOptions();
    }, [q.autoSource, q.options]);

    // 🔍 Custom searchable select dropdown
    if (q.type === 'select') {
      const filtered =
        query === ''
          ? options
          : options.filter((opt) =>
              (opt.name || opt.routeName || opt.stopName || opt)
                .toLowerCase()
                .includes(query.toLowerCase())
            );

      return (
        <Combobox
          value={formData[q._id] || ''}
          onChange={(val) => handleChange(q._id, val)}
        >
          <div className="relative mt-1">
            <div className="relative w-full cursor-default overflow-hidden rounded-md bg-white/10 text-left border border-white/20 focus:ring-2 focus:ring-orange-500">
              <Combobox.Input
                className="w-full border-none bg-transparent py-2 pl-3 pr-10 text-white focus:ring-0 placeholder-gray-400"
                displayValue={(v) =>
                  v?.name || v?.routeName || v?.stopName || v || ''
                }
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search..."
              />
              <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-300" />
              </Combobox.Button>
            </div>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
              afterLeave={() => setQuery('')}
            >
              <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#202a2c] border border-white/20 shadow-lg z-50">
                {filtered.length === 0 ? (
                  <div className="px-4 py-2 text-gray-400">No results.</div>
                ) : (
                  filtered.map((opt, i) => (
                    <Combobox.Option
                      key={i}
                      value={opt}
                      className={({ active }) =>
                        `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                          active
                            ? 'bg-orange-500/20 text-white'
                            : 'text-gray-200'
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span
                            className={`block truncate ${
                              selected ? 'font-semibold' : 'font-normal'
                            }`}
                          >
                            {opt.name ||
                              opt.routeName ||
                              opt.stopName ||
                              opt}
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-orange-400">
                              <CheckIcon className="h-5 w-5" />
                            </span>
                          )}
                        </>
                      )}
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </Transition>
          </div>
        </Combobox>
      );
    }

    // 🟧 Custom checkbox grid
    if (q.type === 'checkbox') {
      const selected = formData[q._id] || [];
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
          {options.map((opt, i) => {
            const name = opt.name || opt.stopName || opt.routeName || opt;
            const location =
              opt.location ||
              opt.description ||
              opt.zone ||
              opt.area ||
              '';
            const checked = selected.some((s) => s.name === name || s === name);

            return (
              <label
                key={i}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  checked
                    ? 'bg-orange-500/20 border-orange-500 text-orange-200'
                    : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10'
                } flex flex-col gap-1`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const prev = selected || [];
                    const updated = e.target.checked
                      ? [...prev, opt]
                      : prev.filter((x) => (x.name || x) !== name);
                    handleChange(q._id, updated);
                  }}
                  className="hidden"
                />
                <span className="font-semibold text-sm truncate">{name}</span>
                {location && (
                  <span className="text-xs text-gray-400 truncate">
                    {location}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      );
    }

    return null;
  }

  // 🧱 Render single question
  const renderQuestion = (q) => (
    <div key={q._id} className="space-y-2">
      <label className="block font-semibold">{q.label}</label>
      {q.autoSource && q.autoSource !== 'none' ? (
        <AutoOptionsQuestion q={q} />
      ) : (
        <input
          type="text"
          required={q.required}
          value={formData[q._id] || ''}
          onChange={(e) => handleChange(q._id, e.target.value)}
          className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-orange-500"
          placeholder="Enter value..."
        />
      )}
    </div>
  );

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <p>Loading form...</p>
      </div>
    );

  const currentTitle = pageTitles[step] || `Step ${step}`;
  const currentQuestions = questions.filter(
    (q) => Number(q.page) === step && isVisible(q)
  );

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
              <h2 className="text-2xl font-bold text-center mb-6">
                {currentTitle}
              </h2>
              {currentQuestions.length > 0 ? (
                currentQuestions.map((q) => renderQuestion(q))
              ) : (
                <p className="text-center text-gray-400">
                  No questions found for this step.
                </p>
              )}
            </>
          ) : (
            <div className="text-center text-gray-400">
              Review & confirmation page coming soon
            </div>
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
