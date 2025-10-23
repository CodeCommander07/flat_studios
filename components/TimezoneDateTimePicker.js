'use client';
import { useState, useEffect } from 'react';

export default function TimezoneDateTimePicker({ value, onChange }) {
  // Convert UTC date to local for display
  const [localDateTime, setLocalDateTime] = useState('');

  useEffect(() => {
    if (value) {
      const utcDate = new Date(value);
      const localIso = new Date(
        utcDate.getTime() - utcDate.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 16);
      setLocalDateTime(localIso);
    }
  }, [value]);

  const handleChange = (e) => {
    const localInput = e.target.value; // local time input string
    setLocalDateTime(localInput);

    const localDate = new Date(localInput);
    const utcDate = new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60000);
    onChange(utcDate.toISOString());
  };

  // Detect timezone name dynamically
  const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  const offsetHours = -now.getTimezoneOffset() / 60;
  const offsetLabel = `UTC${offsetHours >= 0 ? '+' : ''}${offsetHours}`;

  return (
    <div className="flex flex-col gap-2">
      <input
        type="datetime-local"
        value={localDateTime}
        onChange={handleChange}
        className="w-full p-2 rounded-md bg-black/30 border border-white/10 focus:border-cyan-400 outline-none transition"
      />
      <p className="text-white/50 text-sm">
        🕒 Your local time zone: <b>{tzName}</b> ({offsetLabel})
      </p>
    </div>
  );
}
