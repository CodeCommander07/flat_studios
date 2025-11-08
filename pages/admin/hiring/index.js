'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
import AuthWrapper from '@/components/AuthWrapper';
import { useRouter } from 'next/navigation';

export default function ManageForms() {
  const router = useRouter();
  const [forms, setForms] = useState([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    axios.get('/api/careers/applications').then((r) => setForms(r.data));
  }, []);

  const create = async () => {
    if (!title.trim()) return alert('Title is required.');
    const res = await axios.post('/api/careers/applications', {
      title,
      description: desc,
    });
    setForms((prev) => [...prev, res.data]);
    setTitle('');
    setDesc('');
  };

  const deleteForm = async (id) => {
    const confirm = window.confirm('Are you sure you want to delete this form?');
    if (!confirm) return;

    await axios.delete(`/api/careers/applications/${id}`);
    setForms((prev) => prev.filter((f) => f._id !== id));
  };

  return (
    <AuthWrapper requiredRole="admin">

      <main className="max-w-4xl mx-auto px-4 py-10 text-white">
        <div className="glass p-6 rounded-2xl shadow-lg space-y-6">
          <h1 className="text-3xl font-bold">Manage Applications</h1>

          {/* Create Form */}
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Application Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 rounded-md bg-white/10 placeholder-white/60"
            />
            <textarea
              placeholder="Short Description"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full p-3 rounded-md bg-white/10 placeholder-white/60 resize-none h-28"
            />
            <button
              onClick={create}
              className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-md font-semibold"
            >
              Create New Form
            </button>
            <button
              onClick={() => router.push('/admin/ycc/form')}
              className="bg-green-600 hover:bg-green-700 ml-2 px-5 py-2 rounded-md font-semibold"
            >
              Manage Route Form
            </button>
            <button
              onClick={() => router.push('/admin/hiring/review')}
              className="bg-orange-600 hover:bg-orange-700 ml-2 px-5 py-2 rounded-md font-semibold"
            >
              Review Applications
            </button>
          </div>

          {/* Existing Forms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
            {forms.map((f) => (
              <div
                key={f._id}
                className="bg-white/5 hover:bg-white/10 p-4 rounded-xl border border-white/10 transition relative group"
              >
                <Link href={`/admin/hiring/${f._id}`} className="block">
                  <h2 className="text-xl font-semibold mb-1 flex justify-between items-center gap-2">
                    <span>{f.title}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${f.open === true ? 'bg-green-600' : 'bg-red-600'
                        }`}
                    >
                      {
                        f.open === true ? "Open" : "Closed"
                      }
                    </span>
                  </h2>
                  <p className="text-sm text-white/70 line-clamp-3">
                    {f.description || 'No description provided.'}
                  </p>
                </Link>

                {/* Edit/Delete icons */}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  <Trash2
                    size={18}
                    className="text-red-400 hover:text-red-500 cursor-pointer"
                    onClick={() => deleteForm(f._id)}
                  />
                </div>
              </div>
            ))}
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
