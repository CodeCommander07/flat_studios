'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import AuthWrapper from '@/components/AuthWrapper';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableQuestion({ question, index, onRemove, onChange }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    background: 'rgba(255,255,255,0.05)',
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex flex-col gap-2 border border-white/10 p-3 rounded-lg cursor-move min-h-[100px]"
    >
      {/* Question Label */}
      <input
        value={question.label}
        onChange={(e) => onChange(index, { ...question, label: e.target.value })}
        className="w-full p-2 rounded-md bg-white/10 placeholder-white/60"
      />

      {/* Question Type */}
      <select
        value={question.type}
        onChange={(e) => onChange(index, { 
          ...question, 
          type: e.target.value, 
          options: e.target.value === 'radio' ? question.options || [''] : [] 
        })}
        className="w-full p-2 rounded-md bg-white/10 text-white"
      >
        <option value="short">Short Answer</option>
        <option value="long">Long Answer</option>
        <option value="radio">Multiple Choice</option>
        <option value="number">Number Option</option>
      </select>

      {/* Radio Options */}
      {question.type === 'radio' && (
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
              className="w-full p-2 rounded-md bg-white/10 placeholder-white/60"
            />
          ))}
          <button
            onClick={() => onChange(index, { ...question, options: [...question.options, ''] })}
            className="text-blue-400 text-sm hover:underline"
          >
            + Add Option
          </button>
        </div>
      )}

      {/* Remove Button */}
      <button onClick={() => onRemove(index)} className="text-red-400 hover:underline text-sm mt-1 self-end">
        Remove
      </button>
    </li>
  );
}


export default function EditForm() {
  const params = useParams();
  const { id } = params || {};

  const [form, setForm] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(true);
  const [qLabel, setQLabel] = useState('');
  const [qType, setQType] = useState('short');
  const [qOptions, setQOptions] = useState(['']);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/careers/applications/${id}`).then((r) => {
      setForm(r.data);
      setTitle(r.data.title);
      setStatus(r.data.open);
      setDescription(r.data.description);
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
      type: qType,
      options: qType === 'radio' ? qOptions.filter((o) => o.trim()) : [],
    };
    const data = { ...form, questions: [...form.questions, q] };
    await saveForm(data);
    setQLabel('');
    setQType('short');
    setQOptions(['']);
  };

  const removeQuestion = (idx) => {
    const data = { ...form, questions: form.questions.filter((_, i) => i !== idx) };
    saveForm(data);
  };

  const updateQuestion = (idx, newQ) => {
    const newQuestions = form.questions.map((q, i) => (i === idx ? newQ : q));
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

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return; // Safety check
    if (active.id !== over.id) {
      const oldIndex = form.questions.findIndex((q) => q.id === active.id);
      const newIndex = form.questions.findIndex((q) => q.id === over.id);
      const newQuestions = arrayMove(form.questions, oldIndex, newIndex);
      const data = { ...form, questions: newQuestions };
      setForm(data);
      saveForm(data);
    }
  };


  if (!form) return <p className="text-center text-white">Loading...</p>;

  return (
    <AuthWrapper requiredRole="admin">
      <main className="max-w-6xl mx-auto px-4 py-10 text-white grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT COLUMN: Edit Details & Add Question */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-2">Edit Role Title</h2>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={updateTitle}
              className="w-full p-2 rounded-md bg-white/10 placeholder-white/60"
            />
          </div>
          <div className="glass p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-2">Edit Role Description</h2>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={updateDescription}
              className="w-full p-2 rounded-md bg-white/10 placeholder-white/60"
            />
          </div>

          <div className="glass p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-2">Status</h2>
            <div className="flex gap-2 items-center">
              <span className={`text-xs px-2 py-1 rounded-full font-medium select-none ${status ? 'bg-green-600' : 'bg-red-600'}`}>
                {status ? 'Open' : 'Closed'}
              </span>
              <button onClick={() => toggleStatus(true)} disabled={status} className="bg-green-700 hover:bg-green-800 px-3 py-1 rounded-md text-sm">
                Mark Open
              </button>
              <button onClick={() => toggleStatus(false)} disabled={!status} className="bg-red-700 hover:bg-red-800 px-3 py-1 rounded-md text-sm">
                Mark Closed
              </button>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl shadow-lg space-y-2">
            <h2 className="text-xl font-bold mb-2">Add Question</h2>
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
              <option className="text-white bg-black" value="short">Short Answer</option>
              <option className="text-white bg-black" value="long">Long Answer</option>
              <option className="text-white bg-black" value="radio">Multiple Choice</option>
              <option className="text-white bg-black" value="number">Number Option</option>
            </select>
            {qType === 'radio' && (
              <div className="space-y-1">
                {qOptions.map((opt, i) => (
                  <input
                    key={i}
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) =>
                      setQOptions((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                    }
                    className="w-full p-2 rounded-md bg-white/10 placeholder-white/60"
                  />
                ))}
                <button onClick={() => setQOptions((prev) => [...prev, ''])} className="text-blue-400 text-sm hover:underline">
                  + Add Option
                </button>
              </div>
            )}
            <button onClick={addQuestion} className="mt-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-semibold" disabled={saving}>
              Add Question
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Editable Questions List */}
        {/* RIGHT COLUMN: Editable Questions List with Drag & Drop */}
        <div className='glass p-6 rounded-2xl shadow-lg'>
          <h2 className="text-xl font-bold mb-2">Questions</h2>

          {/* Wrap in scrollable container for better drag handling */}
          <div className="max-h-[600px] overflow-auto">
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={form.questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
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
