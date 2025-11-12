'use client';
import { useEffect, useState } from 'react';
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

const ICON_OPTIONS = [
  { label: 'No Disruption', value: 'circle-check-big', icon: CircleCheckBig },
  { label: 'Minor Disruption', value: 'triangle-alert', icon: TriangleAlert },
  { label: 'Sever Disruption', value: 'octagon-alert', icon: OctagonAlert },
  { label: 'Updates', value: 'megaphone', icon: Megaphone },
  { label: 'Info', value: 'info', icon: Info },
  { label: 'Festive', value: 'tree-pine', icon: TreePine },
  { label: 'Calendar', value: 'calendar-days', icon: CalendarDays },
];

export default function BannerSettings() {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBanner((b) => ({ ...b, [name]: value }));
  };

  const saveBanner = async () => {
    setSaving(true);
    await fetch('/api/banner', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(banner),
    });
    setSaving(false);
  };

  const SelectedIcon = ICON_OPTIONS.find((opt) => opt.value === banner.icon)?.icon || Info;

  return (
    <div className="bg-[#283335] p-6 m-10 rounded-2xl border border-white/10 backdrop-blur-lg text-white">
      <h2 className="text-xl font-semibold mb-4">Banner Settings</h2>
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm">Message</span>
          <input
            name="message"
            value={banner.message}
            onChange={handleChange}
            className="w-full p-2 rounded bg-white/10 border border-white/20"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm">Link Text</span>
            <input
              name="linkText"
              value={banner.linkText}
              onChange={handleChange}
              className="w-full p-2 rounded bg-white/10 border border-white/20"
            />
          </label>
          <label className="block">
            <span className="text-sm">Link URL</span>
            <input
              name="linkUrl"
              value={banner.linkUrl}
              onChange={handleChange}
              className="w-full p-2 rounded bg-white/10 border border-white/20"
            />
          </label>
        </div>

        {/* 🎨 Colors */}
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm">Background Color</span>
            <input
              type="color"
              name="bgColor"
              value={banner.bgColor}
              onChange={handleChange}
              className="w-full p-1 h-10 rounded border border-white/20"
            />
          </label>
          <label className="block">
            <span className="text-sm">Text Color</span>
            <input
              type="color"
              name="textColor"
              value={banner.textColor}
              onChange={handleChange}
              className="w-full p-1 h-10 rounded border border-white/20"
            />
          </label>
        </div>

        {/* 🧩 Icon Selector */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <span className="block text-sm mb-2">Icon</span>
          <div className="flex items-center gap-4">
            <select
              name="icon"
              value={banner.icon}
              onChange={handleChange}
              className="flex-1 bg-white/10 border border-white/20 rounded p-2"
            >
              {ICON_OPTIONS.map((opt) => (
                <option className='bg-black text-white' key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="p-3 bg-white/10 rounded-lg border border-white/20 flex items-center justify-center">
              <SelectedIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* ✅ Active Checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={banner.active}
            onChange={(e) => setBanner((b) => ({ ...b, active: e.target.checked }))}
          />
          <span>Active</span>
        </div>

        {/* 💾 Save Button */}
        <button
          onClick={saveBanner}
          disabled={saving}
          className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Banner'}
        </button>
      </div>
    </div>
  );
}
