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
          bg-[#283335] text-white flex items-center justify-between
          hover:bg-white/20 transition
        "
      >
        {OPTIONS.find((o) => o.value === value)?.label}
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
                  ${
                    value === opt.value
                      ? 'bg-blue-600/40 text-blue-200'
                      : 'hover:bg-[#283335] text-white/80'
                  }
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

  const [bannerConfig, setBannerConfig] = useState({
    displayMode: 'rotate', // 'stack' | 'rotate'
    banners: [
      {
        active: false,
        message: '',
        linkText: '',
        linkUrl: '',
        bgColor: '#1b4332',
        textColor: '#ffffff',
        icon: 'circle-check-big',
      },
      {
        active: false,
        message: '',
        linkText: '',
        linkUrl: '',
        bgColor: '#1b4332',
        textColor: '#ffffff',
        icon: 'circle-check-big',
      },
      {
        active: false,
        message: '',
        linkText: '',
        linkUrl: '',
        bgColor: '#1b4332',
        textColor: '#ffffff',
        icon: 'circle-check-big',
      },
    ],
  });
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  // 🔁 Backwards-compatible load from /api/banner
  useEffect(() => {
    fetch('/api/banner')
      .then((res) => res.json())
      .then((data) => {
        if (!data) return;

        // New shape: { displayMode, banners: [...] }
        if (Array.isArray(data.banners)) {
          setBannerConfig((prev) => ({
            displayMode: data.displayMode || prev.displayMode || 'rotate',
            banners: [
              ...data.banners,
              ...prev.banners.slice(data.banners.length), // pad up to 3
            ].slice(0, 3),
          }));
          return;
        }

        setBannerConfig((prev) => ({
          ...prev,
          banners: [
            {
              ...prev.banners[0],
              ...data,
            },
            prev.banners[1],
            prev.banners[2],
          ],
        }));
      })
      .catch(() => {});
  }, []);

  const updateBannerField = (index, field, value) => {
    setBannerConfig((cfg) => {
      const banners = [...cfg.banners];
      banners[index] = {
        ...banners[index],
        [field]: value,
      };
      return { ...cfg, banners };
    });
  };

  const saveBannerConfig = async () => {
    setSaving(true);
    try {
      await fetch('/api/banner', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bannerConfig),
      });
    } finally {
      setSaving(false);
    }
  };

  const [alerts, setAlerts] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [announcement, setAnnouncement] = useState({
    title: '',
    type: 'announcement',
    content: '',
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
      await axios.put('/api/admin/alerts/update', {
        id: editingId,
        ...announcement,
      });
    } else {
      await axios.post('/api/admin/alerts/set', announcement);
    }

    setEditingId(null);
    setShowForm(false);
    setAnnouncement({ title: '', type: selectedType, content: '' });
    fetchAlerts();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return;
    await axios.delete('/api/admin/alerts/delete', { data: { id } });
    fetchAlerts();
  };

  const current = bannerConfig.banners[activeBannerIndex];

  return (
    <AuthWrapper requiredRole="admin">
      <main className="p-8 max-w-6xl mx-auto text-white">
        <div className="bg-[#283335] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold ">Notice & Banner Control</h1>

        {/* Top mode switch (banner vs announcements) */}
        <div className="">
          <ModeDropdown value={mode} onChange={setMode} />
        </div>
        </div>

        {mode === 'banner' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#283335] p-6 rounded-2xl border border-white/10 backdrop-blur-lg"
          >
            <div className="flex items-center justify-between mb-4 gap-4">
              <h2 className="text-xl font-semibold">Banner Settings</h2>

              {/* Display mode selector: Stack vs Rotate */}
              <div className="flex items-center gap-3 text-sm">
                <span className="text-white/70">Display Mode:</span>
                <div className="inline-flex bg-black/40 rounded-lg border border-white/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() =>
                      setBannerConfig((cfg) => ({
                        ...cfg,
                        displayMode: 'stack',
                      }))
                    }
                    className={`px-3 py-1.5 ${
                      bannerConfig.displayMode === 'stack'
                        ? 'bg-blue-600 text-white'
                        : 'text-white/70 hover:bg-[#283335]'
                    }`}
                  >
                    Stack
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setBannerConfig((cfg) => ({
                        ...cfg,
                        displayMode: 'rotate',
                      }))
                    }
                    className={`px-3 py-1.5 ${
                      bannerConfig.displayMode === 'rotate'
                        ? 'bg-blue-600 text-white'
                        : 'text-white/70 hover:bg-[#283335]'
                    }`}
                  >
                    Rotate (30s)
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs for Banner 1–3 */}
            <div className="flex gap-2 mb-4">
              {['Banner 1', 'Banner 2', 'Banner 3'].map((label, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveBannerIndex(idx)}
                  className={`px-4 py-2 rounded-lg text-sm border transition ${
                    activeBannerIndex === idx
                      ? 'bg-blue-600 border-blue-400 text-white'
                      : 'bg-black/30 border-white/20 text-white/70 hover:bg-[#283335]'
                  }`}
                >
                  {label}
                  {bannerConfig.banners[idx]?.active && (
                    <span className="ml-2 text-xs text-emerald-300">
                      ● active
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="grid gap-4">
              <label>
                Message
                <input
                  name="message"
                  className="w-full bg-[#283335] border border-white/20 p-2 rounded-lg mt-1"
                  value={current.message}
                  onChange={(e) =>
                    updateBannerField(activeBannerIndex, 'message', e.target.value)
                  }
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label>
                  Link Text
                  <input
                    name="linkText"
                    className="w-full bg-[#283335] border border-white/20 p-2 rounded-lg mt-1"
                    value={current.linkText}
                    onChange={(e) =>
                      updateBannerField(
                        activeBannerIndex,
                        'linkText',
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Link URL
                  <input
                    name="linkUrl"
                    className="w-full bg-[#283335] border border-white/20 p-2 rounded-lg mt-1"
                    value={current.linkUrl}
                    onChange={(e) =>
                      updateBannerField(
                        activeBannerIndex,
                        'linkUrl',
                        e.target.value
                      )
                    }
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
                    className="w-full h-10 bg-[#283335] border border-white/20 rounded-lg mt-1"
                    value={current.bgColor}
                    onChange={(e) =>
                      updateBannerField(
                        activeBannerIndex,
                        'bgColor',
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Text Color
                  <input
                    type="color"
                    name="textColor"
                    className="w-full h-10 bg-[#283335] border border-white/20 rounded-lg mt-1"
                    value={current.textColor}
                    onChange={(e) =>
                      updateBannerField(
                        activeBannerIndex,
                        'textColor',
                        e.target.value
                      )
                    }
                  />
                </label>
              </div>

              {/* Icon */}
              <label className="block">
                <span>Icon</span>
                <div className="flex items-center gap-4 mt-2">
                  <select
                    className="flex-1 bg-[#283335] border border-white/20 rounded p-2"
                    value={current.icon}
                    onChange={(e) =>
                      updateBannerField(
                        activeBannerIndex,
                        'icon',
                        e.target.value
                      )
                    }
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        className="bg-black text-white"
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <div className="p-3 bg-[#283335] border border-white/20 rounded-lg">
                    {(() => {
                      const Comp = ICON_OPTIONS.find(
                        (o) => o.value === current.icon
                      )?.icon;
                      return Comp ? (
                        <Comp className="w-6 h-6 text-white" />
                      ) : null;
                    })()}
                  </div>
                </div>
              </label>

              {/* Active toggle for this banner */}
              <label className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  checked={current.active}
                  onChange={(e) =>
                    updateBannerField(
                      activeBannerIndex,
                      'active',
                      e.target.checked
                    )
                  }
                />
                <span>Active</span>
              </label>

              <button
                onClick={saveBannerConfig}
                disabled={saving}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-black rounded-lg font-semibold flex items-center gap-2 mt-4"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Banners'}
              </button>
            </div>
          </motion.div>
        )}

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
              <form
                onSubmit={handleSubmit}
                className="bg-black/40 p-6 rounded-xl border border-white/10 mb-8"
              >
                <input
                  type="text"
                  className="w-full bg-[#283335] border border-white/20 rounded p-2 mb-4"
                  placeholder="Title"
                  value={announcement.title}
                  onChange={(e) =>
                    setAnnouncement({ ...announcement, title: e.target.value })
                  }
                />

                <textarea
                  rows={4}
                  className="w-full bg-[#283335] border border-white/20 rounded p-2 mb-4"
                  placeholder="Announcement text..."
                  value={announcement.content}
                  onChange={(e) =>
                    setAnnouncement({
                      ...announcement,
                      content: e.target.value,
                    })
                  }
                />

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-green-600 px-4 py-2 rounded-lg"
                  >
                    {editingId ? 'Update' : 'Post'}
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    type="button"
                    className="bg-zinc-700 px-4 py-2 rounded-lg"
                  >
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
                  className="bg-[#283335] border border-white/20 rounded-xl p-4 flex justify-between items-center"
                >
                  <div>
                    <h3 className="text-lg">{a.title}</h3>
                    <p className="text-white/70 text-sm">{a.content}</p>
                  </div>

                  <div className="flex gap-4 text-sm">
                    <button
                      className="text-blue-400"
                      onClick={() => {
                        setEditingId(a._id);
                        setAnnouncement(a);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-400"
                      onClick={() => handleDelete(a._id)}
                    >
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
