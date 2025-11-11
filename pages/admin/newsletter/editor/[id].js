'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/router';

export default function NewsletterEditor() {
  const router = useRouter();
  const { id } = router.query;
  const [design, setDesign] = useState(null);
  const [editing, setEditing] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [sending, setSending] = useState(false);

  // 🧠 Keybinds
  useEffect(() => {
    const handleKeys = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveDesign();
      }
      if (e.key === 'Delete' && editing) {
        deleteBlock(editing.rowId, editing.colId, editing.block.id);
      }
      if (e.key === 'Escape') {
        setEditing(null);
        setShowMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [editing]);

  // 📱 Mobile Detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // 🧩 Load newsletter design
  useEffect(() => {
    if (!id) return;
    axios.get(`/api/news/${id}`).then((res) => {
      setDesign(res.data.design || starterDesign);
    });
  }, [id]);

  // 🎨 Default Design
  const starterDesign = {
    backgroundColor: '#283335',
    contentWidth: '600px',
    fontFamily: 'sans-serif',
    rows: [
      {
        id: uuidv4(),
        columns: [
          {
            id: uuidv4(),
            contents: [
              {
                id: uuidv4(),
                type: 'text',
                values: {
                  text: '<h2>Welcome!</h2><p>Your newsletter starts here.</p>',
                  align: 'center',
                  color: '#ffffff',
                  background: '#36424a',
                  fontSize: '18px',
                  padding: '20px',
                },
              },
            ],
          },
        ],
      },
    ],
  };

  // ➕ Add new block
  const addBlock = (type) => {
    const newBlock = {
      id: uuidv4(),
      type,
      values:
        type === 'text'
          ? {
            text: '<p>New text block</p>',
            align: 'left',
            color: '#ffffff',
            background: '#36424a',
            fontSize: '16px',
            padding: '15px',
          }
          : type === 'image'
            ? {
              src: 'https://placehold.co/600x200',
              alt: 'Image',
              width: '100%',
              background: 'transparent',
              padding: '10px',
            }
            : type === 'button'
              ? {
                label: 'Click Me',
                bg: '#3b82f6',
                color: '#fff',
                borderRadius: '6px',
                align: 'center',
                padding: '14px 24px',
              }
              : type === 'divider'
                ? { color: '#555', thickness: '1px', padding: '10px' }
                : { height: '25px' },
    };

    setDesign((d) => ({
      ...d,
      rows: [
        ...d.rows,
        { id: uuidv4(), columns: [{ id: uuidv4(), contents: [newBlock] }] },
      ],
    }));
  };

  // ✏️ Update block
  const updateBlock = (rowId, colId, blockId, field, value) => {
    setDesign((d) => ({
      ...d,
      rows: d.rows.map((r) =>
        r.id === rowId
          ? {
            ...r,
            columns: r.columns.map((c) =>
              c.id === colId
                ? {
                  ...c,
                  contents: c.contents.map((b) =>
                    b.id === blockId
                      ? { ...b, values: { ...b.values, [field]: value } }
                      : b
                  ),
                }
                : c
            ),
          }
          : r
      ),
    }));
  };

  // 🌍 Update global
  const updateGlobal = (key, value) => {
    setDesign((d) => ({ ...d, [key]: value }));
  };

  // ❌ Delete block
  const deleteBlock = useCallback((rowId, colId, blockId) => {
    setDesign((d) => ({
      ...d,
      rows: d.rows.map((r) => ({
        ...r,
        columns: r.columns.map((c) => ({
          ...c,
          contents: c.contents.filter((b) => b.id !== blockId),
        })),
      })),
    }));
    setEditing(null);
  }, []);

  // 💾 Save
  const saveDesign = async () => {
    await axios.put(`/api/news/${id}`, { design });
    alert('✅ Newsletter saved!');
  };

  // 🧾 HTML Render
  const renderHTML = (d) => `
    <div style="background:${d.backgroundColor};padding:30px;font-family:${d.fontFamily};">
      <div style="max-width:${d.contentWidth};margin:auto;background:#36424a;border-radius:10px;overflow:hidden;">
        ${d.rows
      .map(
        (r) =>
          `<div>${r.columns
            .map(
              (c) =>
                `<div>${c.contents
                  .map((b) => {
                    switch (b.type) {
                      case 'text':
                        return `<div style="padding:${b.values.padding};color:${b.values.color};text-align:${b.values.align};font-size:${b.values.fontSize};background:${b.values.background};">${b.values.text}</div>`;
                      case 'image':
                        return `<div style="padding:${b.values.padding};background:${b.values.background};"><img src="${b.values.src}" alt="${b.values.alt}" style="width:${b.values.width};border-radius:8px;"/></div>`;
                      case 'button':
                        return `<div style="text-align:${b.values.align};padding:20px;"><a href="#" style="display:inline-block;padding:${b.values.padding};background:${b.values.bg};color:${b.values.color};border-radius:${b.values.borderRadius};text-decoration:none;font-weight:600;">${b.values.label}</a></div>`;
                      case 'divider':
                        return `<div style="padding:${b.values.padding};"><hr style="border:none;height:${b.values.thickness};background:${b.values.color};"/></div>`;
                      case 'spacer':
                        return `<div style="height:${b.values.height};"></div>`;
                      default:
                        return '';
                    }
                  })
                  .join('')}</div>`
            )
            .join('')}</div>`
      )
      .join('')}
      </div>
    </div>`;

  if (!design)
    return (
      <div className="flex items-center justify-center h-screen bg-[#283335] text-gray-300">
        Loading editor…
      </div>
    );

  if (isMobile)
    return (
      <div className="h-screen flex items-center justify-center bg-[#283335] text-white text-center px-6">
        <div>
          <h2 className="text-2xl font-semibold mb-3">
            You cannot edit a newsletter on mobile!
          </h2>
          <p className="text-gray-400">
            Please open this page on a desktop or laptop to access the full
            editor.
          </p>
        </div>
      </div>
    );

  return (
    <div
      className="grid grid-cols-[400px_1fr_400px_300px] w-full overflow-hidden bg-[#283335] text-gray-200 relative"
      style={{ maxHeight: 'calc(100vh - 200px)' }}
    >
      {/* 🧱 LEFT SIDEBAR */}
      <aside className="bg-[#1e2a2d] w-[400px] border-r border-white/10 flex flex-col overflow-hidden">
        {/* Header Controls */}
        <div className="p-4 flex justify-between items-center border-b border-white/10 gap-2">
          <button
            onClick={() => router.push('/admin/newsletter')}
            className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-sm"
          >
            ← Back
          </button>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={saveDesign}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-white text-sm font-medium"
            >
              💾 Save
            </button>
            <button
              onClick={() => setShowMenu(true)}
              className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-sm"
            >
              ⋮ Menu
            </button>
          </div>
        </div>

        {/* Two-column layout for Add + Settings */}
        <div className="flex flex-1 overflow-hidden">
          {/* Add Blocks */}
          <div className="w-1/2 border-r border-white/10 p-4 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-3">Add Blocks</h2>
            {['text', 'image', 'button', 'divider', 'spacer'].map((type) => (
              <button
                key={type}
                onClick={() => addBlock(type)}
                className="w-full mb-2 bg-white/5 hover:bg-white/10 rounded-lg py-2 text-left px-3"
              >
                + {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* Block Settings */}
          <div className="w-1/2 p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-3 text-white">Block Settings</h3>

            {!editing && (
              <p className="text-sm text-gray-400 mb-3">
                Select a block to edit its properties.
              </p>
            )}

            {editing && (
              <div className="space-y-3">
                {Object.entries(editing.block.values).map(([key, value]) => {
                  const inputType =
                    key.includes('color') || key.includes('bg')
                      ? 'color'
                      : key.includes('fontSize') || key.includes('padding')
                        ? 'text'
                        : 'text';

                  return (
                    <div key={key}>
                      <label className="block text-sm text-gray-300 mb-1 capitalize">
                        {key}
                      </label>

                      {key === 'text' ? (
                        <textarea
                          value={value}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            updateBlock(
                              editing.rowId,
                              editing.colId,
                              editing.block.id,
                              key,
                              newValue
                            );
                            setEditing((prev) =>
                              prev
                                ? {
                                  ...prev,
                                  block: {
                                    ...prev.block,
                                    values: {
                                      ...prev.block.values,
                                      [key]: newValue,
                                    },
                                  },
                                }
                                : prev
                            );
                          }}
                          rows={5}
                          className="w-full rounded-md bg-white/5 border border-white/10 text-white px-2 py-1 outline-none resize-y"
                        />
                      ) : inputType === 'color' ? (
                        <input
                          type="color"
                          value={value}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            updateBlock(
                              editing.rowId,
                              editing.colId,
                              editing.block.id,
                              key,
                              newValue
                            );
                            setEditing((prev) =>
                              prev
                                ? {
                                  ...prev,
                                  block: {
                                    ...prev.block,
                                    values: {
                                      ...prev.block.values,
                                      [key]: newValue,
                                    },
                                  },
                                }
                                : prev
                            );
                          }}
                          className="w-full h-10 rounded-md border border-white/10 bg-white/5"
                        />
                      ) : (
                        <input
                          type={inputType}
                          value={value}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            updateBlock(
                              editing.rowId,
                              editing.colId,
                              editing.block.id,
                              key,
                              newValue
                            );
                            setEditing((prev) =>
                              prev
                                ? {
                                  ...prev,
                                  block: {
                                    ...prev.block,
                                    values: {
                                      ...prev.block.values,
                                      [key]: newValue,
                                    },
                                  },
                                }
                                : prev
                            );
                          }}
                          className="w-full rounded-md bg-white/5 border border-white/10 text-white px-2 py-1 outline-none"
                        />
                      )}
                    </div>
                  );
                })}

                <button
                  onClick={() =>
                    deleteBlock(editing.rowId, editing.colId, editing.block.id)
                  }
                  className="w-full mt-3 bg-red-600 hover:bg-red-700 py-2 rounded-lg font-medium"
                >
                  🗑 Delete Block
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ✏️ EDITOR CENTER */}
      <main className="overflow-y-auto p-8 bg-[#283335]">
        <div
          className="mx-auto max-w-[600px] bg-[#36424a] rounded-xl border border-white/10 shadow-lg"
          style={{ minHeight: '80vh' }}
        >
          {design.rows.map((row) =>
            row.columns.map((col) =>
              col.contents.map((block) => (
                <div
                  key={block.id}
                  className={`p-2 border ${editing?.block?.id === block.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-transparent'
                    } rounded-md relative`}
                  onClick={() =>
                    setEditing({ rowId: row.id, colId: col.id, block })
                  }
                >
                  {block.type === 'text' && (
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      className="outline-none w-full"
                      style={{
                        textAlign: block.values.align,
                        color: block.values.color,
                        background: block.values.background,
                        fontSize: block.values.fontSize,
                        padding: block.values.padding,
                      }}
                      dangerouslySetInnerHTML={{
                        __html: block.values.text,
                      }}
                    />
                  )}
                  {block.type === 'image' && (
                    <img
                      src={block.values.src}
                      alt={block.values.alt}
                      className="rounded-md inline-block max-w-full cursor-pointer"
                      onClick={() =>
                        updateBlock(
                          row.id,
                          col.id,
                          block.id,
                          'src',
                          prompt('Image URL:', block.values.src)
                        )
                      }
                    />
                  )}
                  {block.type === 'button' && (
                    <div className="text-center">
                      <button
                        className="rounded-md font-medium"
                        style={{
                          background: block.values.bg,
                          color: block.values.color,
                          padding: block.values.padding,
                        }}
                      >
                        {block.values.label}
                      </button>
                    </div>
                  )}
                  {block.type === 'divider' && (
                    <hr
                      style={{
                        border: 'none',
                        height: block.values.thickness,
                        background: block.values.color,
                      }}
                    />
                  )}
                  {block.type === 'spacer' && (
                    <div style={{ height: block.values.height }}></div>
                  )}
                </div>
              ))
            )
          )}
        </div>
      </main>

      {/* 👁 PREVIEW */}
      <aside className="bg-[#1e2a2d] border-l border-white/10 p-4 overflow-y-auto">
        <h2 className="text-sm font-semibold mb-2 text-white/70">Preview</h2>
        <iframe
          title="preview"
          className="w-full h-[90vh] rounded-md border border-white/10 bg-white"
          srcDoc={renderHTML(design)}
        />
      </aside>

      {/* 🎨 RIGHT SIDEBAR - GLOBAL */}
      <aside className="bg-[#1e2a2d] border-l border-white/10 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-3 text-white">Global Design</h2>

        <div className="space-y-3">
          <label className="block text-sm text-gray-300">
            Background Color
          </label>
          <input
            type="color"
            value={design.backgroundColor}
            onChange={(e) => updateGlobal('backgroundColor', e.target.value)}
            className="w-full h-10 rounded border border-white/10 bg-white/5"
          />

          <label className="block text-sm text-gray-300">Font Family</label>
          <select
            value={design.fontFamily}
            onChange={(e) => updateGlobal('fontFamily', e.target.value)}
            className="w-full rounded-md bg-white/5 border border-white/10 text-white px-2 py-1"
          >
            <option value="sans-serif">Sans Serif</option>
            <option value="serif">Serif</option>
            <option value="monospace">Monospace</option>
            <option value="Arial">Arial</option>
            <option value="Roboto">Roboto</option>
          </select>

          <label className="block text-sm text-gray-300">
            Content Width (px)
          </label>
          <input
            type="number"
            value={parseInt(design.contentWidth)}
            onChange={(e) =>
              updateGlobal('contentWidth', `${e.target.value}px`)
            }
            className="w-full rounded-md bg-white/5 border border-white/10 text-white px-2 py-1"
          />
        </div>
      </aside>

      {/* 🧭 MENU MODAL */}
      {showMenu && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowMenu(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1e2a2d] text-white rounded-xl border border-white/10 p-6 w-[320px] shadow-xl"
          >
            <h2 className="text-lg font-semibold mb-4">Newsletter Options</h2>
            <div className="flex flex-col gap-2">
              <button
                onClick={async () => {
                  try {
                    setSending(true);
                    await axios.put(`/api/news/${id}`, { design });
                    const res = await axios.post(`/api/news/send`, { id });
                    alert(res.data.message || '✅ Newsletter sent to all subscribers!');
                  } catch (err) {
                    console.error(err);
                    alert('❌ Failed to send newsletter.');
                  } finally {
                    setSending(false);
                    setShowMenu(false);
                  }
                }}
                disabled={sending}
                className="bg-blue-600 hover:bg-blue-700 py-2 rounded-lg disabled:opacity-50"
              >
                {sending ? '📤 Sending…' : '✉️ Send to Subscribers'}
              </button>

              <button
                onClick={() => window.open(`/api/news/view/${id}`, '_blank')}
                className="bg-white/10 hover:bg-white/20 py-2 rounded-lg"
              >
                👁️ View Newsletter
              </button>
              <button
                onClick={() => (window.location.href = `/api/news/export/${id}`)}
                className="bg-white/10 hover:bg-white/20 py-2 rounded-lg"
              >
                📥 Export Newsletter
              </button>
            </div>
            <button
              onClick={() => setShowMenu(false)}
              className="mt-4 text-sm text-gray-400 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );

}
