'use client';

import { useState, useEffect, useRef } from 'react';

function hexToHsv(hex) {
  try {
    let r = parseInt(hex.substring(1, 3), 16) / 255;
    let g = parseInt(hex.substring(3, 5), 16) / 255;
    let b = parseInt(hex.substring(5, 7), 16) / 255;

    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let v = max;
    let d = max - min;
    let s = max === 0 ? 0 : d / max;

    let h = 0;
    if (d !== 0) {
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      else if (max === g) h = ((b - r) / d + 2) * 60;
      else if (max === b) h = ((r - g) / d + 4) * 60;
    }

    return [h, s * 100, v * 100];
  } catch {
    return [0, 0, 100];
  }
}

function hsvToHex({ h, s, v }) {
  s /= 100;
  v /= 100;

  let c = v * s;
  let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  let m = v - c;

  let [r, g, b] = [0, 0, 0];

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (n) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function ColorPickerSV({ hex, onChange }) {
  const ref = useRef(null);

  const [h, s, v] = hexToHsv(hex);

  const handle = (e) => {
    const box = ref.current.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - box.left, 0), box.width);
    const y = Math.min(Math.max(e.clientY - box.top, 0), box.height);

    const sat = Math.round((x / box.width) * 100);
    const val = Math.round(100 - (y / box.height) * 100);

    onChange(hsvToHex({ h, s: sat, v: val }));
  };

  return (
    <div
      ref={ref}
      className="relative w-full h-36 rounded-lg cursor-crosshair overflow-hidden"
      style={{
        background: `hsl(${h}, 100%, 50%)`,
      }}
      onMouseDown={(e) => {
        handle(e);
        const move = (ev) => handle(ev);
        const up = () => {
          window.removeEventListener('mousemove', move);
          window.removeEventListener('mouseup', up);
        };
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black"></div>

      <div
        className="absolute w-4 h-4 border-2 border-white rounded-full shadow"
        style={{
          left: `${s}%`,
          top: `${100 - v}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  );
}

function ColorPickerHue({ hex, onChange }) {
  const ref = useRef(null);

  const [h] = hexToHsv(hex);

  const handle = (e) => {
    const box = ref.current.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * 360;
    const newHue = Math.min(Math.max(x, 0), 360);

    const [, s, v] = hexToHsv(hex);

    onChange(hsvToHex({ h: newHue, s, v }));
  };

  return (
    <div
      ref={ref}
      className="relative w-full h-4 rounded-lg cursor-pointer mt-3"
      style={{
        background:
          'linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)',
      }}
      onMouseDown={(e) => {
        handle(e);
        const move = (ev) => handle(ev);
        const up = () => {
          window.removeEventListener('mousemove', move);
          window.removeEventListener('mouseup', up);
        };
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
      }}
    >
      <div
        className="absolute top-1/2 w-3 h-3 border-2 border-white rounded-full shadow bg-white"
        style={{
          left: `${(h / 360) * 100}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  );
}

export default function ColorPickerPopup({ value, onChange }) {
  const [hex, setHex] = useState(value);

  useEffect(() => setHex(value), [value]);

  return (
    <div
      id="opColourPopup"
      className="absolute mt-2 left-0 z-50 w-64 p-4 rounded-xl bg-[#283335] border border-white/20 backdrop-blur shadow-xl"
    >
      <ColorPickerSV
        hex={hex}
        onChange={(v) => {
          setHex(v);
          onChange(v);
        }}
      />

      <ColorPickerHue
        hex={hex}
        onChange={(v) => {
          setHex(v);
          onChange(v);
        }}
      />
    </div>
  );
}
