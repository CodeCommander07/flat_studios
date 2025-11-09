'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Loader2 } from 'lucide-react';
import Link from 'next/link';
import AuthWrapper from '@/components/AuthWrapper';

const StatusBadge = ({ status }) => {
  const map = {
    Pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    Approved: 'bg-green-500/20 text-green-300 border-green-500/30',
    Rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
    Implemented: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  };
  return (
    <span
      className={`px-2 py-0.5 text-xs rounded border ${map[status] || 'bg-white/10 text-white/70 border-white/20'}`}
    >
      {status || 'Pending'}
    </span>
  );
};

function SortableQuestion({ q, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: q._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    background: isDragging
      ? 'rgba(59,130,246,0.15)'
      : 'rgba(255,255,255,0.05)',
    border: isDragging
      ? '1px solid rgba(59,130,246,0.4)'
      : '1px solid rgba(255,255,255,0.1)',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 rounded-lg flex flex-col justify-between"
    >
      <div className="flex justify-between items-center mb-2">
        <div
          className="flex items-center gap-2 text-gray-400 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
          <span className="text-xs">Drag</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(q)}
            className="bg-yellow-500 text-black px-3 py-1 rounded text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(q._id)}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm"
          >
            Delete
          </button>
        </div>
      </div>
      <div>
        <p className="font-semibold">{q.label}</p>
        <p className="text-sm text-gray-400">
          Page {q.page} • {q.type}
          {q.required && <span className="text-red-400 ml-1">(Required)</span>}
          {q.autoSource && <> | Auto: {q.autoSource}</>}
          {q.triggerQuestionId && (
            <>
              {' '}
              | Triggered by:{' '}
              <span className="text-yellow-400">{q.triggerQuestionId}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default function ManageQuestions() {
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [editing, setEditing] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [form, setForm] = useState({
    page: 1,
    pageTitle: '',
    label: '',
    type: 'text',
    order: 1,
    options: '',
    triggerQuestionId: '',
    triggerValue: '',
    hiddenByDefault: false,
    autoSource: '',
    required: false,
  });

  const loadQuestions = async () => {
    const res = await fetch('/api/ycc/questions');
    const data = await res.json();
    if (data.success) {
      const sorted = data.questions.sort(
        (a, b) => a.page - b.page || a.order - b.order
      );
      setQuestions(sorted);
    }
  };

  const loadRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await fetch('/api/ycc/admin/requests/');
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err) {
      console.error('Failed to load requests', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadQuestions();
    loadRequests();
    const interval = setInterval(loadRequests, 30000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const resetForm = () => {
    setForm({
      page: 1,
      pageTitle: '',
      label: '',
      type: 'text',
      order: 1,
      options: '',
      triggerQuestionId: '',
      triggerValue: '',
      hiddenByDefault: false,
      autoSource: '',
      required: false,
    });
    setEditing(null);
  };

  const save = async () => {
    const payload = {
      ...form,
      page: Number(form.page),
      options:
        form.options && typeof form.options === 'string'
          ? form.options.split(',').map((o) => o.trim()).filter(Boolean)
          : form.options,
    };

    const res = await fetch(
      editing ? `/api/ycc/questions/${editing}` : '/api/ycc/questions',
      {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (res.ok) {
      alert('Saved!');
      resetForm();
      loadQuestions();
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this question?')) return;
    await fetch(`/api/ycc/questions/${id}`, { method: 'DELETE' });
    loadQuestions();
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = questions.findIndex((q) => q._id === active.id);
    const newIndex = questions.findIndex((q) => q._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(questions, oldIndex, newIndex).map((q, i) => ({
      ...q,
      order: i + 1,
    }));
    setQuestions(reordered);

    reordered.forEach(async (q) => {
      await fetch(`/api/ycc/questions/${q._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(q),
      });
    });
  };

  const groupedQuestions = questions.reduce((acc, q) => {
    acc[q.page] = acc[q.page] || [];
    acc[q.page].push(q);
    return acc;
  }, {});

  return (
    <AuthWrapper requiredRole="admin">
      <main className="max-w-10xl mx-auto mt-10 px-8 text-white grid md:grid-cols-2 gap-8">
        {/* LEFT: Builder Form */}
        <div className="glass bg-[#283335] p-6 rounded-2xl space-y-6 flex flex-col h-[70vh] overflow-hidden">
          <div className="overflow-y-auto pr-2">
            <h1 className="text-3xl font-bold mb-2">Manage YCC Questions</h1>

            <div className="grid grid-cols-2 gap-4">
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
                  onChange={(e) =>
                    setForm({ ...form, pageTitle: e.target.value })
                  }
                  className="w-full bg-white/10 border border-white/20 p-2 rounded"
                  placeholder="e.g. Basic Info"
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

              <div>
                <label>Question Order</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 p-2 rounded"
                />
              </div>

              <div className="col-span-2">
                <label>Question Label</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 p-2 rounded mb-2"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.required || false}
                    onChange={(e) =>
                      setForm({ ...form, required: e.target.checked })
                    }
                    className="accent-blue-500"
                  />
                  Required
                </label>
              </div>

              {(form.type === 'select' ||
                form.type === 'radio' ||
                form.type === 'checkbox') && (
                  <div className="col-span-2 space-y-2">
                    <label>Auto Populate Source</label>
                    <select
                      value={form.autoSource || 'none'}
                      onChange={(e) => setForm({ ...form, autoSource: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 p-2 rounded"
                    >
                      <option value="none" className="bg-black text-white">
                        None (Manual Options)
                      </option>
                      <option value="routes" className="bg-black text-white">
                        Auto: Routes
                      </option>
                      <option value="stops" className="bg-black text-white">
                        Auto: Stops
                      </option>
                    </select>

                    {form.autoSource === 'none' && (
                      <>
                        <label>Manual Options (comma-separated)</label>
                        <input
                          type="text"
                          value={form.options}
                          onChange={(e) =>
                            setForm({ ...form, options: e.target.value })
                          }
                          className="w-full bg-white/10 border border-white/20 p-2 rounded"
                          placeholder="e.g. Option 1, Option 2, Option 3"
                        />
                      </>
                    )}
                  </div>
                )}
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={save}
                className="bg-green-500 text-black px-4 py-2 rounded"
              >
                {editing ? 'Update Question' : 'Add Question'}
              </button>
              {editing && (
                <button
                  onClick={resetForm}
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => router.push('/admin/ycc/operators')}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Operator Responses
              </button>
            </div>

            {/* Divider Line */}
            <div className="flex items-center mt-1">
              <div className="flex-grow border-t border-white/20"></div>
              <span className="px-3 text-gray-300 text-sm">Requests</span>
              <div className="flex-grow border-t border-white/20"></div>
            </div>

            {/* ✅ Request List (RouteRequestList integrated) */}
            <div className="space-y-2 max-h-[225px] overflow-y-auto pt-1">
              {loadingRequests ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="animate-spin w-4 h-4" />
                  Loading requests...
                </div>
              ) : requests.length === 0 ? (
                <p className="text-gray-400 text-sm">No submissions yet.</p>
              ) : (
                <div className="divide-y divide-white/10">
                  {[...requests].reverse().map((req) => (
                    <Link
                      key={req._id}
                      href={`/admin/ycc/routes/${req._id}`}
                      className="block p-3 hover:bg-white/10 transition rounded-lg"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-sm text-white">
                            {req.meta?.company || 'Unknown Company'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {req.meta?.submitter || 'Unknown User'}
                            {req.meta?.submissionType && (
                              <span className="ml-2 text-gray-500">
                                • {req.meta.submissionType}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={req.status} />
                          <p className="text-xs text-gray-400">
                            {new Date(req.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Page-separated Question List */}
        <div className="glass bg-[#283335] p-6 rounded-2xl flex flex-col h-[70vh]">
          <h2 className="text-xl font-bold mb-4">Existing Questions</h2>
          <div className="flex-1 overflow-y-auto pr-2">
            {questions.length === 0 ? (
              <p className="text-gray-400">No questions yet.</p>
            ) : (
              Object.keys(groupedQuestions)
                .sort((a, b) => a - b)
                .map((page) => (
                  <div key={page} className="mb-6">
                    <div className="flex items-center mb-4">
                      <div className="flex-grow border-t border-white/20"></div>
                      <span className="px-3 text-gray-300 text-sm">
                        Page {page}
                        {groupedQuestions[page][0]?.pageTitle
                          ? `: ${groupedQuestions[page][0].pageTitle}`
                          : ''}
                      </span>
                      <div className="flex-grow border-t border-white/20"></div>
                    </div>

                    <DndContext
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={groupedQuestions[page].map((q) => q._id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="grid md:grid-cols-2 gap-4">
                          {groupedQuestions[page].map((q) => (
                            <SortableQuestion
                              key={q._id}
                              q={q}
                              onEdit={(data) => {
                                setForm({
                                  ...data,
                                  options: data.options?.join(', ') || '',
                                });
                                setEditing(data._id);
                              }}
                              onDelete={remove}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                ))
            )}
          </div>
        </div>

        <style jsx>{`
          .glass {
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          ::-webkit-scrollbar {
            width: 6px;
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.4);
          }
        `}</style>
      </main>
    </AuthWrapper>
  );
}
