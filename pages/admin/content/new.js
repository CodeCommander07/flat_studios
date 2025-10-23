'use client';
import { useState, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import TimezoneDateTimePicker from '@/components/TimezoneDateTimePicker';
import {
  FileText,
  Image,
  Settings,
  Tag,
  Eye,
  Globe,
  Save,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Link,
  Code,
  Quote,
  PenTool,
  LayoutGrid,
  Underline,
} from 'lucide-react';

/* ---------------------------------------------------------------------- */

export default function NewContentPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: 'article',
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: { url: '', alt: '' },
    tags: '',
    categories: '',
    status: 'draft',
    visibility: 'public',
    scheduledFor: '',
    seo: { title: '', description: '', canonicalUrl: '' },
  });

  const textareaRef = useRef(null);
  const onChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  /* ---------------------------------------------------------------------- */
  // 🔧 Toolbar Actions
  const insertAtCursor = (syntaxBefore, syntaxAfter = '') => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.slice(start, end);

    const newText =
      text.slice(0, start) + syntaxBefore + selected + syntaxAfter + text.slice(end);
    onChange('content', newText);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd =
        start + syntaxBefore.length + selected.length + syntaxAfter.length;
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
  // 💾 Submit
  const submit = async () => {
    try {
      setLoading(true);
      const payload = {
        ...form,
        tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
        categories: form.categories.split(',').map((s) => s.trim()).filter(Boolean),
        scheduledFor:
          form.status === 'scheduled' && form.scheduledFor
            ? new Date(form.scheduledFor)
            : undefined,
      };

      const res = await axios.post('/api/content', payload);
      alert('✅ Created: ' + res.data.slug);
      setForm({
        type: 'article',
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        coverImage: { url: '', alt: '' },
        tags: '',
        categories: '',
        status: 'draft',
        visibility: 'public',
        scheduledFor: '',
        seo: { title: '', description: '', canonicalUrl: '' },
      });
    } catch (err) {
      alert('❌ Failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  return (
    <main className="p-8 max-w-6xl mx-auto text-white space-y-8">
      <h1 className="text-4xl font-bold text-center mb-6 flex items-center justify-center gap-3">
        <PenTool className="w-7 h-7 text-cyan-400" /> Create Blog Post
      </h1>

      {/* Basic Info */}
      <Section icon={<FileText className="text-cyan-400" />} title="Basic Info">
        <TwoColumn>
          <Input label="Title" value={form.title} onChange={(e) => onChange('title', e.target.value)} />
          <Input label="Slug" value={form.slug} onChange={(e) => onChange('slug', e.target.value)} />
        </TwoColumn>
        <Select
          label="Type"
          value={form.type}
          onChange={(e) => onChange('type', e.target.value)}
          options={['article', 'blog', 'guide', 'news', 'changelog']}
        />
        <Textarea
          label="Excerpt (summary)"
          rows={3}
          value={form.excerpt}
          onChange={(e) => onChange('excerpt', e.target.value)}
        />
      </Section>

      {/* Content Editor with Toolbar */}
      <Section icon={<LayoutGrid className="text-green-400" />} title="Content Editor">
        <Toolbar buttons={toolbarButtons} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor */}
          <div className="flex flex-col">
            <textarea
              ref={textareaRef}
              rows={18}
              value={form.content}
              onChange={(e) => onChange('content', e.target.value)}
              className="w-full flex-1 p-3 rounded-lg bg-black/30 border border-white/10 focus:border-cyan-400 outline-none transition resize-none font-mono"
              placeholder="Write your blog post in Markdown..."
            />
          </div>

          {/* Preview */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-md overflow-y-auto max-h-[600px]">
            <article className="prose prose-invert prose-lg max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                {form.content || '_Start writing to see a live preview..._'}
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
            value={form.coverImage.url}
            onChange={(e) => onChange('coverImage', { ...form.coverImage, url: e.target.value })}
          />
          <Input
            label="Alt Text"
            value={form.coverImage.alt}
            onChange={(e) => onChange('coverImage', { ...form.coverImage, alt: e.target.value })}
          />
        </TwoColumn>
        {form.coverImage.url && (
          <motion.img
            src={form.coverImage.url}
            alt={form.coverImage.alt}
            className="rounded-xl shadow-lg border border-white/10 mt-3 w-full max-h-64 object-cover"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          />
        )}
      </Section>

      {/* Tags + SEO + Submit */}
      <Section icon={<Tag className="text-yellow-400" />} title="Tags, SEO & Publish">
        <Input label="Tags (comma separated)" value={form.tags} onChange={(e) => onChange('tags', e.target.value)} />
        <Input
          label="Categories (comma separated)"
          value={form.categories}
          onChange={(e) => onChange('categories', e.target.value)}
        />
        <Input
          label="SEO Title"
          value={form.seo.title}
          onChange={(e) => onChange('seo', { ...form.seo, title: e.target.value })}
        />
        <Textarea
          label="SEO Description"
          rows={3}
          value={form.seo.description}
          onChange={(e) => onChange('seo', { ...form.seo, description: e.target.value })}
        />

        <div className="flex justify-center mt-8">
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            onClick={submit}
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-lg font-semibold transition 
              ${loading ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-500'}`}
          >
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : 'Publish Blog Post'}
          </motion.button>
        </div>
      </Section>
    </main>
  );
}

/* ---------------------------------------------------------------------- */
/* COMPONENTS */
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
