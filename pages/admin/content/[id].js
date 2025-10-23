'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import {
  Save,
  Bold,
  Italic,
  Underline,
  Heading2,
  List,
  ListOrdered,
  Link,
  Code,
  Quote,
  FileText,
  Image,
  LayoutGrid,
  Tag,
  Clock,
  Eye,
} from 'lucide-react';

/* ---------------------------------------------------------------------- */

export default function EditContentPage() {
  const router = useRouter();
  const { id } = router.query;
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef(null);

  /* 🔹 Load existing post */
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await axios.get(`/api/content/${id}`);
        setForm(res.data);
      } catch (err) {
        console.error('Failed to load content', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const onChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  /* ---------------------------------------------------------------------- */
  // 🧠 Markdown toolbar helper
  const insertAtCursor = (before, after = '') => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.slice(start, end);
    const newText =
      text.slice(0, start) + before + selected + after + text.slice(end);
    onChange('content', newText);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd =
        start + before.length + selected.length + after.length;
    }, 10);
  };

  const toolbarButtons = [
    { icon: <Bold />, title: 'Bold', action: () => insertAtCursor('**', '**') },
    { icon: <Italic />, title: 'Italic', action: () => insertAtCursor('*', '*') },
    { icon: <Underline />, title: 'Underline (HTML)', action: () => insertAtCursor('<u>', '</u>') },
    { icon: <Heading2 />, title: 'Heading', action: () => insertAtCursor('## ') },
    { icon: <List />, title: 'Bullet List', action: () => insertAtCursor('- ') },
    { icon: <ListOrdered />, title: 'Numbered List', action: () => insertAtCursor('1. ') },
    { icon: <Link />, title: 'Link', action: () => insertAtCursor('[text](url)') },
    { icon: <Code />, title: 'Code', action: () => insertAtCursor('`', '`') },
    { icon: <Quote />, title: 'Quote', action: () => insertAtCursor('> ') },
  ];

  /* ---------------------------------------------------------------------- */
  // 💾 Save Updates
  const saveChanges = async () => {
    try {
      setSaving(true);
      await axios.patch(`/api/content/${id}`, form);
      alert('✅ Saved changes successfully!');
    } catch (err) {
      alert('❌ Failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return <main className="p-8 text-white/70">Loading post...</main>;
  }

  /* ---------------------------------------------------------------------- */

  return (
    <main className="p-8 max-w-6xl mx-auto text-white space-y-8">
      <h1 className="text-4xl font-bold text-center mb-4">✏️ Edit Post</h1>

      {/* Status Indicator */}
      <div className="text-center mb-6">
        <span
          className={`px-4 py-1 rounded-full text-sm font-semibold ${
            form.status === 'published'
              ? 'bg-green-700'
              : form.status === 'scheduled'
              ? 'bg-yellow-600'
              : 'bg-gray-700'
          }`}
        >
          {form.status.toUpperCase()}
        </span>
      </div>

      {/* Basic Info */}
      <Section icon={<FileText className="text-cyan-400" />} title="Basic Info">
        <TwoColumn>
          <Input label="Title" value={form.title} onChange={(e) => onChange('title', e.target.value)} />
          <Input label="Slug" value={form.slug} onChange={(e) => onChange('slug', e.target.value)} />
        </TwoColumn>
        <Textarea
          label="Excerpt (summary)"
          rows={3}
          value={form.excerpt}
          onChange={(e) => onChange('excerpt', e.target.value)}
        />
      </Section>

      {/* Content */}
      <Section icon={<LayoutGrid className="text-green-400" />} title="Content Editor">
        <Toolbar buttons={toolbarButtons} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <textarea
            ref={textareaRef}
            rows={20}
            value={form.content}
            onChange={(e) => onChange('content', e.target.value)}
            className="w-full p-3 rounded-lg bg-black/30 border border-white/10 focus:border-cyan-400 outline-none transition resize-none font-mono"
          />
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-md overflow-y-auto max-h-[600px]">
            <article className="prose prose-invert prose-lg max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                {form.content || '_Start writing..._'}
              </ReactMarkdown>
            </article>
          </div>
        </div>
      </Section>

      {/* Cover Image */}
      <Section icon={<Image className="text-pink-400" />} title="Cover Image">
        <TwoColumn>
          <Input
            label="Cover Image URL"
            value={form.coverImage?.url || ''}
            onChange={(e) =>
              onChange('coverImage', { ...form.coverImage, url: e.target.value })
            }
          />
          <Input
            label="Alt Text"
            value={form.coverImage?.alt || ''}
            onChange={(e) =>
              onChange('coverImage', { ...form.coverImage, alt: e.target.value })
            }
          />
        </TwoColumn>
        {form.coverImage?.url && (
          <motion.img
            src={form.coverImage.url}
            alt={form.coverImage.alt}
            className="rounded-xl shadow-lg border border-white/10 mt-3 w-full max-h-64 object-cover"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          />
        )}
      </Section>

      {/* Tags */}
      <Section icon={<Tag className="text-yellow-400" />} title="Tags & Categories">
        <Input
          label="Tags (comma separated)"
          value={form.tags?.join(', ') || ''}
          onChange={(e) =>
            onChange('tags', e.target.value.split(',').map((s) => s.trim()))
          }
        />
        <Input
          label="Categories (comma separated)"
          value={form.categories?.join(', ') || ''}
          onChange={(e) =>
            onChange('categories', e.target.value.split(',').map((s) => s.trim()))
          }
        />
      </Section>

      {/* Visibility + Scheduling */}
      <Section icon={<Eye className="text-indigo-400" />} title="Visibility & Status">
        <TwoColumn>
          <Select
            label="Visibility"
            value={form.visibility}
            onChange={(e) => onChange('visibility', e.target.value)}
            options={['public', 'unlisted', 'private']}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => onChange('status', e.target.value)}
            options={['draft', 'scheduled', 'published', 'archived']}
          />
        </TwoColumn>
        {form.status === 'scheduled' && (
          <Input
            label="Scheduled Date"
            type="datetime-local"
            value={
              form.scheduledFor
                ? new Date(form.scheduledFor).toISOString().slice(0, 16)
                : ''
            }
            onChange={(e) => onChange('scheduledFor', e.target.value)}
          />
        )}
      </Section>

      {/* Save Button */}
      <div className="flex justify-center mt-8">
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          onClick={saveChanges}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-lg font-semibold transition 
            ${saving ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-500'}`}
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Changes'}
        </motion.button>
      </div>
    </main>
  );
}

/* ---------------------------------------------------------------------- */
/* Shared Components */
function Section({ icon, title, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-lg"
    >
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </motion.section>
  );
}

function Input({ label, ...props }) {
  return (
    <div className="w-full">
      <label className="block text-sm mb-1 text-white/70">{label}</label>
      <input
        {...props}
        className="w-full p-2 rounded-lg bg-black/30 border border-white/10 focus:border-cyan-400 outline-none transition"
      />
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div className="w-full">
      <label className="block text-sm mb-1 text-white/70">{label}</label>
      <textarea
        {...props}
        className="w-full p-2 rounded-lg bg-black/30 border border-white/10 focus:border-cyan-400 outline-none transition"
      />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div className="w-full">
      <label className="block text-sm mb-1 text-white/70">{label}</label>
      <select
        {...props}
        className="w-full p-2 rounded-lg bg-black/30 border border-white/10 focus:border-cyan-400 outline-none transition"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function TwoColumn({ children }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function Toolbar({ buttons }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-white/10 pb-2">
      {buttons.map((btn, i) => (
        <button
          key={i}
          title={btn.title}
          onClick={btn.action}
          className="p-2 rounded-md bg-white/10 hover:bg-white/20 transition"
        >
          {btn.icon}
        </button>
      ))}
    </div>
  );
}
