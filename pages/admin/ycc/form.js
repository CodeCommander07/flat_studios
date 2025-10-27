'use client';
import { useEffect, useState } from 'react';
import AuthWrapper from '@/components/AuthWrapper';

export default function ManageQuestions() {
  const [questions, setQuestions] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    page: 1,
    pageTitle: '',
    label: '',
    type: 'text',
    options: '',
    triggerQuestionId: '',
    triggerValue: '',
    hiddenByDefault: false,
    autoSource: '',
    required: false,
  });

  const load = async () => {
    const res = await fetch('/api/ycc/questions');
    const data = await res.json();
    if (data.success) setQuestions(data.questions);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    const payload = {
      ...form,
      page: Number(form.page),
      options:
        form.options && typeof form.options === 'string'
          ? form.options.split(',').map((o) => o.trim()).filter(Boolean)
          : form.options,
      autoSource: form.autoSource || null,
    };

    const res = await fetch(editing ? `/api/ycc/questions/${editing}` : '/api/ycc/questions', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert('Saved!');
      setForm({
        page: 1,
        pageTitle: '',
        label: '',
        type: 'text',
        options: '',
        triggerQuestionId: '',
        triggerValue: '',
        hiddenByDefault: false,
        autoSource: '',
        required: false,
      });
      setEditing(null);
      load();
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this question?')) return;
    await fetch(`/api/ycc/questions/${id}`, { method: 'DELETE' });
    load();
  };

  // Only selectable types for conditional triggers
  const selectableQuestions = questions.filter(
    (q) => ['radio', 'checkbox', 'select'].includes(q.type)
  );

  const selectedTrigger = selectableQuestions.find((q) => q._id === form.triggerQuestionId);

  return (
    <AuthWrapper requiredRole="admin">
      <main className="max-w-5xl mx-auto mt-10 p-8 bg-white/10 border border-white/20 rounded-xl text-white">
        <h1 className="text-2xl font-bold mb-6">Manage Questions</h1>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div>
            <label>Page Number</label>
            <input
              type="number"
              value={form.page}
              onChange={(e) => setForm({ ...form, page: e.target.value })}
              className="w-full bg-white/10 border border-white/20 p-2 rounded"
            />
          </div>

          <div>
            <label>Page Title (optional)</label>
            <input
              type="text"
              value={form.pageTitle}
              onChange={(e) => setForm({ ...form, pageTitle: e.target.value })}
              placeholder="e.g. Basic Info"
              className="w-full bg-white/10 border border-white/20 p-2 rounded"
            />
          </div>

          <div>
            <label>Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full bg-white/10 border border-white/20 p-2 rounded"
            >
              <option className="bg-black text-white" value="text">Text</option>
              <option className="bg-black text-white" value="textarea">Textarea</option>
              <option className="bg-black text-white" value="select">Select</option>
              <option className="bg-black text-white" value="radio">Radio</option>
              <option className="bg-black text-white" value="checkbox">Checkbox</option>
              <option className="bg-black text-white" value="file">File Upload</option>
            </select>
          </div>

          <div className="col-span-2">
            <label>Question Label</label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full bg-white/10 border border-white/20 p-2 rounded mb-2"
            />

            {/* ✅ Required toggle */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.required || false}
                onChange={(e) => setForm({ ...form, required: e.target.checked })}
                className="accent-blue-500"
              />
              Required
            </label>
          </div>

          {/* ✅ Auto Source selector */}
          {(form.type === 'select' || form.type === 'radio' || form.type === 'checkbox') && (
            <>
              <div className="col-span-2">
                <label>Auto Source (optional)</label>
                <select
                  value={form.autoSource || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      autoSource: e.target.value,
                      options: e.target.value ? '' : form.options,
                    })
                  }
                  className="w-full bg-white/10 border border-white/20 p-2 rounded mb-2"
                >
                  <option value="">None (Manual Options)</option>
                  <option value="stops">Auto: Bus Stops</option>
                  <option value="routes">Auto: Bus Routes</option>
                </select>
              </div>

              {!form.autoSource && (
                <div className="col-span-2">
                  <label>Options (comma-separated)</label>
                  <input
                    type="text"
                    value={form.options}
                    onChange={(e) => setForm({ ...form, options: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 p-2 rounded"
                  />
                </div>
              )}
            </>
          )}

          {/* ✅ Conditional Logic */}
          {['radio', 'select', 'checkbox', 'text', 'textarea', 'file'].includes(form.type) && (
            <div className="col-span-2 border-t border-white/10 pt-4 mt-2">
              <h3 className="font-semibold mb-2">Conditional Logic (optional)</h3>

              <label className="block mb-1 text-sm text-gray-300">Trigger Question</label>
              <select
                value={form.triggerQuestionId || ''}
                onChange={(e) =>
                  setForm({ ...form, triggerQuestionId: e.target.value, triggerValue: '' })
                }
                className="w-full bg-white/10 border border-white/20 p-2 rounded mb-3"
              >
                <option value="">None</option>
                {selectableQuestions.map((q) => (
                  <option key={q._id} value={q._id} className="bg-black text-white">
                    {q.label}
                  </option>
                ))}
              </select>

              {selectedTrigger && selectedTrigger.options?.length > 0 && (
                <>
                  <label className="block mb-1 text-sm text-gray-300">Trigger Value</label>
                  <select
                    value={form.triggerValue || ''}
                    onChange={(e) => setForm({ ...form, triggerValue: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 p-2 rounded mb-3"
                  >
                    <option value="">Select value...</option>
                    {selectedTrigger.options.map((opt, i) => (
                      <option key={i} value={opt} className="bg-black text-white">
                        {opt}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.hiddenByDefault || false}
                  onChange={(e) => setForm({ ...form, hiddenByDefault: e.target.checked })}
                  className="accent-blue-500"
                />
                Hidden by default
              </label>
            </div>
          )}
        </div>

        <button
          onClick={save}
          className="bg-green-500 text-black px-4 py-2 rounded"
        >
          {editing ? 'Update' : 'Add'} Question
        </button>

        <hr className="my-8 border-white/20" />

        <h2 className="text-xl font-semibold mb-4">Existing Questions</h2>
        <div className="space-y-3">
          {questions.map((q) => (
            <div
              key={q._id}
              className="bg-white/10 border border-white/20 p-4 rounded flex justify-between items-center"
            >
              <div>
                <p><strong>Page {q.page}</strong> — {q.label}</p>
                <p className="text-sm text-gray-400">
                  Type: {q.type}
                  {q.required && <span className="text-red-400 ml-1">(Required)</span>}
                  {q.autoSource && <> | Auto Source: <span className="text-blue-400">{q.autoSource}</span></>}
                  {q.triggerQuestionId && (
                    <> | Depends on: <span className="text-yellow-400">{q.triggerQuestionId}</span> = <span className="text-green-400">{q.triggerValue}</span></>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setForm({
                      ...q,
                      options: q.options?.join(', ') || '',
                    });
                    setEditing(q._id);
                  }}
                  className="bg-yellow-500 text-black px-3 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(q._id)}
                  className="bg-red-600 px-3 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </AuthWrapper>
  );
}
