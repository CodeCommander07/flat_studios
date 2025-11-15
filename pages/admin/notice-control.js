'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import axios from 'axios';
import {
  Save,
  CircleCheckBig,
  TriangleAlert,
  Megaphone,
  Info,
  OctagonAlert,
  TreePine,
  CalendarDays,
} from 'lucide-react';
import AuthWrapper from '@/components/AuthWrapper';


const ICON_OPTIONS = [
  { label: 'No Disruption', value: 'circle-check-big', icon: CircleCheckBig },
  { label: 'Minor Disruption', value: 'triangle-alert', icon: TriangleAlert },
  { label: 'Severe Disruption', value: 'octagon-alert', icon: OctagonAlert },
  { label: 'Updates', value: 'megaphone', icon: Megaphone },
  { label: 'Info', value: 'info', icon: Info },
  { label: 'Festive', value: 'tree-pine', icon: TreePine },
  { label: 'Calendar', value: 'calendar-days', icon: CalendarDays },
];


function ModeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);

  const OPTIONS = [
    { label: 'Banner Settings', value: 'banner' },
    { label: 'Announcements', value: 'announcements' },
  ];

  return (
    <div className="relative inline-block w-64">
      {/* Selected Button */}
      <button
        onClick={() => setOpen(!open)}
        className="
          w-full px-4 py-2 rounded-lg border border-white/20
          bg-white/10 text-white flex items-center justify-between
          hover:bg-white/20 transition
        "
      >
        {OPTIONS.find(o => o.value === value)?.label}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.span>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="
              absolute w-full mt-2 rounded-lg overflow-hidden z-50
              bg-[#1f2a2e]/95 border border-white/20 backdrop-blur-md shadow-xl
            "
          >
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`
                  w-full text-left px-4 py-2 text-sm transition
                  ${value === opt.value
                    ? "bg-blue-600/40 text-blue-200"
                    : "hover:bg-white/10 text-white/80"}
                `}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


export default function NoticeControlPage() {
  const [mode, setMode] = useState('banner');

  const [banner, setBanner] = useState({
    active: false,
    message: '',
    linkText: '',
    linkUrl: '',
    bgColor: '#1b4332',
    textColor: '#ffffff',
    icon: 'circle-check-big',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/banner')
      .then((res) => res.json())
      .then((data) => data && setBanner((b) => ({ ...b, ...data })));
  }, []);

  const saveBanner = async () => {
    setSaving(true);
    await fetch('/api/banner', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(banner),
    });
    setSaving(false);
  };


  const [alerts, setAlerts] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [announcement, setAnnouncement] = useState({
    title: '',
    type: 'announcement',
    content: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState('announcement');

  useEffect(() => {
    fetchAlerts();
    fetchNotices();
  }, []);

  const fetchAlerts = async () => {
    const res = await axios.get('/api/admin/alerts/all');
    setAlerts(res.data.notices || []);
  };

  const fetchNotices = async () => {
    setLoadingNotices(true);
    const res = await axios.get('/api/admin/alerts/fetch');
    setNotices(res.data.notices || []);
    setLoadingNotices(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!announcement.title || !announcement.content) return;

    if (editingId) {
      await axios.put('/api/admin/alerts/update', { id: editingId, ...announcement });
    } else {
      await axios.post('/api/admin/alerts/set', announcement);
    }

    setEditingId(null);
    setShowForm(false);
    setAnnouncement({ title: '', type: selectedType, content: '' });
    fetchAlerts();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete?")) return;
    await axios.delete('/api/admin/alerts/delete', { data: { id } });
    fetchAlerts();
  };


  return (
    <AuthWrapper requiredRole="admin">
      <main className="p-8 max-w-6xl mx-auto text-white">

        <h1 className="text-3xl font-bold mb-6">Notice & Banner Control</h1>

        {/* Custom Dropdown */}
        <div className="mb-8">
          <ModeDropdown value={mode} onChange={setMode} />
        </div>

        {mode === 'banner' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#283335] p-6 rounded-2xl border border-white/10 backdrop-blur-lg"
          >
            <h2 className="text-xl font-semibold mb-4">Banner Settings</h2>

            <div className="grid gap-4">
              <label>
                Message
                <input
                  name="message"
                  className="w-full bg-white/10 border border-white/20 p-2 rounded-lg mt-1"
                  value={banner.message}
                  onChange={(e) => setBanner({ ...banner, message: e.target.value })}
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label>
                  Link Text
                  <input
                    name="linkText"
                    className="w-full bg-white/10 border border-white/20 p-2 rounded-lg mt-1"
                    value={banner.linkText}
                    onChange={(e) => setBanner({ ...banner, linkText: e.target.value })}
                  />
                </label>

                <label>
                  Link URL
                  <input
                    name="linkUrl"
                    className="w-full bg-white/10 border border-white/20 p-2 rounded-lg mt-1"
                    value={banner.linkUrl}
                    onChange={(e) => setBanner({ ...banner, linkUrl: e.target.value })}
                  />
                </label>
              </div>

              {/* Colours */}
              <div className="grid grid-cols-2 gap-4">
                <label>
                  Background Color
                  <input
                    type="color"
                    name="bgColor"
                    className="w-full h-10 bg-white/10 border border-white/20 rounded-lg mt-1"
                    value={banner.bgColor}
                    onChange={(e) => setBanner({ ...banner, bgColor: e.target.value })}
                  />
                </label>

                <label>
                  Text Color
                  <input
                    type="color"
                    name="textColor"
                    className="w-full h-10 bg-white/10 border border-white/20 rounded-lg mt-1"
                    value={banner.textColor}
                    onChange={(e) => setBanner({ ...banner, textColor: e.target.value })}
                  />
                </label>
              </div>

              {/* Icon */}
              <label className="block">
                <span>Icon</span>
                <div className="flex items-center gap-4 mt-2">
                  <select
                    className="flex-1 bg-white/10 border border-white/20 rounded p-2"
                    value={banner.icon}
                    onChange={(e) => setBanner({ ...banner, icon: e.target.value })}
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-black text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <div className="p-3 bg-white/10 border border-white/20 rounded-lg">
                    {
                      (() => {
                        const Comp = ICON_OPTIONS.find(o => o.value === banner.icon)?.icon;
                        return Comp ? <Comp className="w-6 h-6 text-white" /> : null;
                      })()
                    }
                  </div>
                </div>
              </label>

              {/* Active toggle */}
              <label className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  checked={banner.active}
                  onChange={(e) => setBanner({ ...banner, active: e.target.checked })}
                />
                Active
              </label>

              <button
                onClick={saveBanner}
                disabled={saving}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-black rounded-lg font-semibold flex items-center gap-2 mt-4"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Banner'}
              </button>
            </div>
          </motion.div>
        )}

        {/* -----------------------------
            MODE: ANNOUNCEMENTS
        ----------------------------- */}
        {mode === 'announcements' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#283335] p-6 rounded-2xl border border-white/10 backdrop-blur-lg"
          >
            <h2 className="text-xl font-semibold mb-6">Manage Announcements</h2>

            <button
              onClick={() => {
                setEditingId(null);
                setAnnouncement({ title: '', type: 'announcement', content: '' });
                setShowForm(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg mb-4"
            >
              Add New Announcement
            </button>

            {/* Form */}
            {showForm && (
              <form onSubmit={handleSubmit} className="bg-black/40 p-6 rounded-xl border border-white/10 mb-8">
                <input
                  type="text"
                  className="w-full bg-white/10 border border-white/20 rounded p-2 mb-4"
                  placeholder="Title"
                  value={announcement.title}
                  onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                />

                <textarea
                  rows={4}
                  className="w-full bg-white/10 border border-white/20 rounded p-2 mb-4"
                  placeholder="Announcement text..."
                  value={announcement.content}
                  onChange={(e) => setAnnouncement({ ...announcement, content: e.target.value })}
                />

                <div className="flex gap-4">
                  <button type="submit" className="bg-green-600 px-4 py-2 rounded-lg">
                    {editingId ? 'Update' : 'Post'}
                  </button>
                  <button onClick={() => setShowForm(false)} type="button" className="bg-zinc-700 px-4 py-2 rounded-lg">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* List */}
            <div className="space-y-4">
              {alerts.map((a) => (
                <div
                  key={a._id}
                  className="bg-white/10 border border-white/20 rounded-xl p-4 flex justify-between items-center"
                >
                  <div>
                    <h3 className="text-lg">{a.title}</h3>
                    <p className="text-white/70 text-sm">{a.content}</p>
                  </div>

                  <div className="flex gap-4 text-sm">
                    <button className="text-blue-400" onClick={() => {
                      setEditingId(a._id);
                      setAnnouncement(a);
                      setShowForm(true);
                    }}>
                      Edit
                    </button>
                    <button className="text-red-400" onClick={() => handleDelete(a._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </AuthWrapper>
  );
}
