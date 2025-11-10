'use client';
import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';

export default function BannerSettings() {
  const [banner, setBanner] = useState({
    active: false,
    message: '',
    linkText: '',
    linkUrl: '',
    style: { bgColor: '#1b4332', textColor: '#ffffff' },
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/banner')
      .then((res) => res.json())
      .then((data) => data && setBanner(data));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBanner((b) => ({ ...b, [name]: value }));
  };

  const handleStyleChange = (e) => {
    const { name, value } = e.target;
    setBanner((b) => ({ ...b, style: { ...b.style, [name]: value } }));
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

  return (
    <div className="bg-[#283335] p-6 rounded-2xl border border-white/10 backdrop-blur-lg">
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
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm">Background Color</span>
            <input
              type="color"
              name="bgColor"
              value={banner.style.bgColor}
              onChange={handleStyleChange}
              className="w-full p-1 h-10 rounded border border-white/20"
            />
          </label>
          <label className="block">
            <span className="text-sm">Text Color</span>
            <input
              type="color"
              name="textColor"
              value={banner.style.textColor}
              onChange={handleStyleChange}
              className="w-full p-1 h-10 rounded border border-white/20"
            />
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={banner.active}
            onChange={(e) => setBanner((b) => ({ ...b, active: e.target.checked }))}
          />
          <span>Active</span>
        </div>

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
