'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import AuthWrapper from '@/components/AuthWrapper';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, } from 'lucide-react';

// Sortable item component
function SortableQuestion({ question, index, onRemove, onChange }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    transformOrigin: '0 0',
    background: isDragging
      ? 'rgba(59,130,246,0.15)'
      : 'rgba(255,255,255,0.05)',
    border: isDragging
      ? '1px solid rgba(59,130,246,0.4)'
      : '1px solid rgba(255,255,255,0.1)',
    zIndex: isDragging ? 50 : 1,
  };

  const handleAutoDenyChange = (field, value) => {
    onChange(index, { ...question, [field]: value });
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex flex-col gap-3 p-3 rounded-bl-lg rounded-tr-lg cursor-default select-none"
    >
      <div className="flex justify-between items-center">
        <div
          className="flex items-center gap-2 text-gray-400 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
          <span className="text-xs">Drag</span>
        </div>
        <button
          onClick={() => onRemove(index)}
          className="text-red-400 hover:underline text-sm"
        >
          Remove
        </button>
      </div>

      {/* Question Label */}
      {/* Question Label */}
      <input
        value={question.label}
        onChange={(e) => onChange(index, { ...question, label: e.target.value })}
        placeholder="Question Label"
        className="w-full p-2 rounded-md bg-[#283335] placeholder-white/60"
      />

      {/* Question Info (description) */}
      <textarea
        value={question.info || ''}
        onChange={(e) => onChange(index, { ...question, info: e.target.value })}
        placeholder="Additional information about this question..."
        className="w-full p-2 rounded-md bg-[#283335] placeholder-white/60 text-sm resize-none"
        rows={2}
      />


      {/* Type Selector */}
      <select
        value={question.type}
        onChange={(e) =>
          onChange(index, {
            ...question,
            type: e.target.value,
            options:
              e.target.value === 'radio' ? question.options || [''] : [],
          })
        }
        className="w-full p-2 rounded-md bg-[#283335] text-white"
      >
        <option className="bg-black text-white" value="short">Short Answer</option>
        <option className="bg-black text-white" value="long">Long Answer</option>
        <option className="bg-black text-white" value="radio">Multiple Choice (Single Select)</option>
        <option className="bg-black text-white" value="checkbox">Multiple Choice (Multi Select)</option>
        <option className="bg-black text-white" value="number">Number Option</option>
      </select>

      {/* Multiple Choice Options */}
      {(question.type === 'radio' || question.type === 'checkbox') && (
        <div className="space-y-1">
          {question.options?.map((opt, i) => (
            <input
              key={i}
              value={opt}
              onChange={(e) => {
                const newOptions = [...question.options];
                newOptions[i] = e.target.value;
                onChange(index, { ...question, options: newOptions });
              }}
              placeholder={`Option ${i + 1}`}
              className="w-full p-2 rounded-md bg-[#283335] placeholder-white/60"
            />
          ))}
          <button
            onClick={() =>
              onChange(index, {
                ...question,
                options: [...question.options, ''],
              })
            }
            className="text-blue-400 text-sm hover:underline"
          >
            + Add Option
          </button>
        </div>
      )}

      {/* ✅ Auto Deny Controls */}
      <div className="mt-2 border-t border-white/10 pt-2 space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={question.autoDeny || false}
            onChange={(e) => handleAutoDenyChange('autoDeny', e.target.checked)}
          />
          <span className="text-sm text-white/80">Enable Auto Deny</span>
        </label>

        {question.autoDeny && (
          <input
            type="text"
            value={
              Array.isArray(question.acceptedAnswers)
                ? question.acceptedAnswers.join(', ')
                : (question.acceptedAnswers || '')
            }
            onChange={(e) =>
              handleAutoDenyChange(
                'acceptedAnswers',
                e.target.value
                  .split(',')
                  .map((a) => a.trim())
                  .filter(Boolean)
              )
            }
            placeholder="Accepted answers (comma-separated)"
            className="w-full p-2 rounded-md bg-[#283335] placeholder-white/60"
          />
        )}
      </div>

    </li>
  );
}

export default function EditForm() {
  const params = useParams();
  const { id } = params || {};

  const [form, setForm] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [status, setStatus] = useState(true);
  const [qLabel, setQLabel] = useState('');
  const [qInfo, setQInfo] = useState('')
  const [qType, setQType] = useState('short');
  const [qOptions, setQOptions] = useState(['']);
  const [saving, setSaving] = useState(false); const [showDescModal, setShowDescModal] = useState(false);
  const [showReqModal, setShowReqModal] = useState(false);
  const [tempDesc, setTempDesc] = useState('');
  const [tempReq, setTempReq] = useState('');
  const [appCount, setAppCount] = useState(null);

  useEffect(() => {
    if (showDescModal) setTempDesc(description);
    if (showReqModal) setTempReq(requirements);
  }, [showDescModal, showReqModal]);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await axios.get('/api/careers/submissions');
        setAppCount(res.data.length || 0);
      } catch (err) {
        console.error('Failed to fetch applications count:', err);
        setAppCount(0);
      }
    };
    fetchCount();
  }, []);

  // Load the form
  useEffect(() => {
    if (!id) return;
    axios.get(`/api/careers/applications/${id}`).then((r) => {
      const data = r.data;
      // Ensure each question has a unique ID
      data.questions = (data.questions || []).map((q, i) => ({
        id: q.id || `q_${i}_${Date.now()}`,
        ...q,
      }));
      setForm(data);
      setTitle(data.title);
      setDescription(data.description);
      setRequirements(data.requirements);
      setStatus(data.open);
    });
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
    if (!qLabel.trim()) return alert('Enter a question label');
    const q = {
      id: `q_${Date.now()}`,
      label: qLabel.trim(),
      info: qInfo.trim(),
      type: qType,
      options: qType === 'radio' ? qOptions.filter((o) => o.trim()) : [],
    };

    const data = { ...form, questions: [...(form.questions || []), q] };
    await saveForm(data);
    setQLabel('');
    setQInfo('');
    setQType('short');
    setQOptions(['']);
  };

  const removeQuestion = (idx) => {
    const data = {
      ...form,
      questions: form.questions.filter((_, i) => i !== idx),
    };
    saveForm(data);
  };

  const updateQuestion = (idx, newQ) => {
    const newQuestions = form.questions.map((q, i) =>
      i === idx ? newQ : q
    );
    const data = { ...form, questions: newQuestions };
    setForm(data);
    saveForm(data);
  };

  const toggleStatus = async (newStatus) => {
    const data = { ...form, open: newStatus };
    await saveForm(data);
    setStatus(newStatus);
  };

  const updateTitle = async () => {
    const data = { ...form, title };
    await saveForm(data);
  };

  const updateDescription = async () => {
    const data = { ...form, description };
    await saveForm(data);
  };
  const updateRequirements = async () => {
    const data = { ...form, requirements };
    await saveForm(data);
  };

  // ✅ Drag and drop reorder handler
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = form.questions.findIndex((q) => q.id === active.id);
    const newIndex = form.questions.findIndex((q) => q.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newQuestions = arrayMove(form.questions, oldIndex, newIndex);
    const newForm = { ...form, questions: newQuestions };
    setForm(newForm);
    saveForm(newForm);
  };

  if (!form) return <p className="text-center text-white">Loading...</p>;

  return (
    <AuthWrapper requiredRole="admin">
      <main className="max-w-8xl mx-auto px-4 py-5 text-white grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className=" bg-[#283335] p-4 rounded-bl-2xl rounded-tr-2xl shadow-lg flex items-center justify-between">
            <h2 className="text-xl font-bold p-2">Title:</h2>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={updateTitle}
              placeholder="Enter title..."
              className="bg-[#283335] rounded-bl-md rounded-tr-md hover:rounded-md focus:rounded-md transition-all duration-300 ease-in-out p-2 text-white w-[95%] focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>


          {/* Description (modal-based) */}
          <div
            className=" bg-[#283335] p-6 rounded-bl-2xl rounded-tr-2xl hover:rounded-2xl focus:rounded-2xl transition-all duration-300 ease-in-out shadow-lg cursor-pointer hover:bg-[#283335]/80 transition relative"
            onClick={() => setShowDescModal(true)}
          >
            <h2 className="text-xl font-bold mb-2">Description</h2>
            <p className="text-gray-300 truncate">{description || 'Click to add description...'}</p>
          </div>

          {/* Requirements (modal-based) */}
          <div
            className=" bg-[#283335] p-6 rounded-bl-2xl rounded-tr-2xl hover:rounded-2xl focus:rounded-2xl transition-all duration-300 ease-in-out shadow-lg cursor-pointer hover:bg-[#283335]/80 transition relative"
            onClick={() => setShowReqModal(true)}
          >
            <h2 className="text-xl font-bold mb-2">Requirements</h2>
            <p className="text-gray-300 truncate whitespace-nowrap overflow-hidden text-ellipsis">
              {requirements || 'Click to add requirements...'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className=" bg-[#283335] p-4 rounded-bl-2xl rounded-tr-2xl hover:rounded-2xl focus:rounded-2xl transition-all duration-300 ease-in-out shadow-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">Status:</h2>
                <span
                  className={`font-semibold ${status ? 'text-green-400' : 'text-red-400'
                    }`}
                >
                  {status ? 'Opened' : 'Closed'}
                </span>
              </div>

              <button
                onClick={() => toggleStatus(!status)}
                disabled={saving}
                className="text-blue-400 hover:text-blue-500 text-sm transition disabled:opacity-50"
              >
                {status ? 'Click to close' : 'Click to open'}
              </button>
            </div>


            <div className=" bg-[#283335] p-4 rounded-bl-2xl rounded-tr-2xl hover:rounded-2xl focus:rounded-2xl transition-all duration-300 ease-in-out shadow-lg flex items-center justify-between">
              <h2 className="text-xl font-bold">Applications</h2>
              <button
                onClick={() => window.open(`/admin/hiring/review`, '_blank')}
                className="text-blue-400 hover:text-blue-500 text-sm transition"
              >
                View {appCount ?? '...'} Applications
              </button>
            </div>


          </div>

          {/* Add Question Section (unchanged) */}
          <div className=" bg-[#283335] p-6 rounded-bl-2xl rounded-tr-2xl hover:rounded-2xl focus:rounded-2xl transition-all duration-300 ease-in-out shadow-lg space-y-2">
            <h2 className="text-xl font-bold mb-2">Add Question</h2>
            <input
              placeholder="Question Label"
              value={qLabel}
              onChange={(e) => setQLabel(e.target.value)}
              className="w-full p-2 rounded-bl-md rounded-tr-md hover:rounded-md focus:rounded-md transition-all duration-300 ease-in-out bg-[#283335] placeholder-white/50"
              disabled={saving}
            />
            <textarea
              value={qInfo}
              onChange={(e) => setQInfo(e.target.value)}
              placeholder="Additional information about this question..."
              className="w-full p-2 rounded-bl-md rounded-tr-md hover:rounded-md focus:rounded-md transition-all duration-300 ease-in-out bg-[#283335] placeholder-white/60 text-sm resize-none"
              rows={2}
            />
            <select
              className="w-full p-2 rounded-bl-md rounded-tr-md hover:rounded-md focus:rounded-md transition-all duration-300 ease-in-out bg-[#283335] text-white"
              value={qType}
              onChange={(e) => setQType(e.target.value)}
              disabled={saving}
            >
              <option className="bg-black text-white" value="short">Short Answer</option>
              <option className="bg-black text-white" value="long">Long Answer</option>
              <option className="bg-black text-white" value="radio">Multiple Choice (Single Select)</option>
              <option className="bg-black text-white" value="checkbox">Multiple Choice (Multi Select)</option>
              <option className="bg-black text-white" value="number">Number Option</option>
            </select>

            {(qType === 'radio' || qType === 'checkbox') && (
              <div className="space-y-1">
                {qOptions.map((opt, i) => (
                  <input
                    key={i}
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) =>
                      setQOptions((prev) =>
                        prev.map((v, idx) => (idx === i ? e.target.value : v))
                      )
                    }
                    className="w-full p-2 rounded-bl-md rounded-tr-md hover:rounded-md focus:rounded-md transition-all duration-300 ease-in-out bg-[#283335] placeholder-white/60"
                  />
                ))}
                <button
                  onClick={() => setQOptions((prev) => [...prev, ''])}
                  className="text-blue-400 text-sm hover:underline"
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
        </div>

        <div className="bg-[#283335] p-6 rounded-bl-2xl rounded-tr-2xl hover:rounded-2xl focus:rounded-2xl transition-all duration-300 ease-in-out shadow-lg">
          <h2 className="text-xl font-bold mb-2">Questions</h2>
          <div className="max-h-[624px] overflow-y-auto overscroll-contain">
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={(form.questions || []).map((q) => q.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-2">
                  {form.questions.map((q, i) => (
                    <SortableQuestion
                      key={q.id}
                      question={q}
                      index={i}
                      onRemove={removeQuestion}
                      onChange={updateQuestion}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {showDescModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-[#283335] p-6 rounded-bl-2xl rounded-tr-2xl hover:rounded-2xl focus:rounded-2xl transition-all duration-300 ease-in-out shadow-lg max-w-5xl max-h-5xl w-full relative">
              <h2 className="text-xl font-bold mb-4">Edit Description</h2>
              <textarea
                value={tempDesc}
                onChange={(e) => setTempDesc(e.target.value)}
                rows={6}
                className="w-full p-2 rounded-md bg-[#283335] placeholder-white/60 mb-4"
              ></textarea>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDescModal(false)}
                  className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setDescription(tempDesc);
                    await updateDescription();
                    setShowDescModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {showReqModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-[#283335] p-6 rounded-bl-2xl rounded-tr-2xl hover:rounded-2xl focus:rounded-2xl transition-all duration-300 ease-in-out shadow-lg max-w-5xl max-h-5xl w-full relative">
              <h2 className="text-xl font-bold mb-4">Edit Requirements</h2>
              <textarea
                value={tempReq}
                onChange={(e) => setTempReq(e.target.value)}
                rows={6}
                className="w-full p-2 rounded-md bg-[#283335] placeholder-white/60 mb-4"
              ></textarea>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowReqModal(false)}
                  className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setRequirements(tempReq);
                    await updateRequirements();
                    setShowReqModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          .glass {
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
            ::-webkit-scrollbar {
    display: none;
}
        `}</style>
      </main>
    </AuthWrapper>
  );
}
