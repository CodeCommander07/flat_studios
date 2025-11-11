'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/router';

export default function NewsletterEditor() {
  const router = useRouter();
  const { id } = router.query;
  const [design, setDesign] = useState(null);
  const [editing, setEditing] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Adjust height to exclude navbar/banner/footer dynamically
  const [usableHeight, setUsableHeight] = useState('100vh');
  useEffect(() => {
    const calculateHeight = () => {
      // adjust here if you know your navbar/banner/footer total height
      const banner = document.getElementById('banner')?.offsetHeight || 0;
      const navbar = document.getElementById('navbar')?.offsetHeight || 0;
      const footer = document.getElementById('footer')?.offsetHeight || 0;
      const totalOffset = banner + navbar + footer;
      setUsableHeight(`calc(100vh - ${totalOffset}px)`);
    };
    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  }, []);

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/news/${id}`).then((res) => {
      setDesign(res.data.design || starterDesign);
    });
  }, [id]);

  const starterDesign = {
    backgroundColor: '#0f1420',
    contentWidth: '600px',
    rows: [
      {
        id: uuidv4(),
        columns: [
          {
            id: uuidv4(),
            contents: [
              {
                id: uuidv4(),
                type: 'heading',
                values: {
                  text: '<h2>Welcome to our Newsletter</h2>',
                  align: 'center',
                  color: '#ffffff',
                  background: '#1f2937',
                  fontSize: '22px',
                  padding: '20px',
                },
              },
            ],
          },
        ],
      },
    ],
  };

  // 🧩 Block Types
  const blockList = [
    'heading',
    'paragraph',
    'image',
    'button',
    'divider',
    'spacer',
    'quote',
    'social',
  ];

  const addBlock = (type) => {
    const newBlock = {
      id: uuidv4(),
      type,
      values: {
        ...(type === 'heading'
          ? {
              text: '<h2>Heading Title</h2>',
              align: 'center',
              color: '#ffffff',
              background: '#1f2937',
              fontSize: '24px',
              padding: '15px',
            }
          : type === 'paragraph'
          ? {
              text: '<p>Write your paragraph text here.</p>',
              align: 'left',
              color: '#dddddd',
              background: 'transparent',
              fontSize: '16px',
              padding: '10px',
            }
          : type === 'image'
          ? {
              src: 'https://placehold.co/600x200',
              alt: '',
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
          : type === 'spacer'
          ? { height: '30px' }
          : type === 'quote'
          ? {
              text: '“This is a quote block.”',
              color: '#ccc',
              background: '#1f2937',
              fontStyle: 'italic',
              padding: '20px',
              borderLeft: '4px solid #3b82f6',
            }
          : {
              color: '#ffffff',
              background: 'transparent',
              align: 'center',
            }),
      },
    };

    setDesign((d) => ({
      ...d,
      rows: [
        ...d.rows,
        { id: uuidv4(), columns: [{ id: uuidv4(), contents: [newBlock] }] },
      ],
    }));
  };

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

  const deleteBlock = (rowId, colId, blockId) => {
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
  };

  const saveDesign = async () => {
    await axios.put(`/api/news/${id}`, { design });
    alert('Newsletter saved!');
  };

  const renderHTML = (d) => `
  <div style="background:${d.backgroundColor};padding:30px;font-family:sans-serif;">
    <div style="max-width:${d.contentWidth};margin:auto;background:#1f2937;border-radius:10px;overflow:hidden;">
      ${d.rows
        .map(
          (r) =>
            `<div>${r.columns
              .map(
                (c) =>
                  `<div>${c.contents
                    .map((b) => {
                      switch (b.type) {
                        case 'heading':
                          return `<div style="padding:${b.values.padding};color:${b.values.color};text-align:${b.values.align};font-size:${b.values.fontSize};background:${b.values.background};">${b.values.text}</div>`;
                        case 'paragraph':
                          return `<div style="padding:${b.values.padding};color:${b.values.color};text-align:${b.values.align};font-size:${b.values.fontSize};">${b.values.text}</div>`;
                        case 'image':
                          return `<div style="padding:${b.values.padding};background:${b.values.background};"><img src="${b.values.src}" alt="${b.values.alt}" style="width:${b.values.width};border-radius:8px;"/></div>`;
                        case 'button':
                          return `<div style="text-align:${b.values.align};padding:20px;"><a href="#" style="display:inline-block;padding:${b.values.padding};background:${b.values.bg};color:${b.values.color};border-radius:${b.values.borderRadius};text-decoration:none;font-weight:600;">${b.values.label}</a></div>`;
                        case 'divider':
                          return `<div style="padding:${b.values.padding};"><hr style="border:none;height:${b.values.thickness};background:${b.values.color};"/></div>`;
                        case 'spacer':
                          return `<div style="height:${b.values.height};"></div>`;
                        case 'quote':
                          return `<blockquote style="padding:${b.values.padding};color:${b.values.color};background:${b.values.background};font-style:${b.values.fontStyle};border-left:${b.values.borderLeft};">${b.values.text}</blockquote>`;
                        case 'social':
                          return `<div style="text-align:center;padding:20px;"><a href="#" style="margin:0 5px;color:#fff;">Facebook</a> • <a href="#" style="margin:0 5px;color:#fff;">X</a> • <a href="#" style="margin:0 5px;color:#fff;">Instagram</a></div>`;
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
      <div className="flex items-center justify-center h-screen bg-[#0f1420] text-gray-300">
        Loading editor…
      </div>
    );

  if (isMobile)
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f1420] text-white text-center px-6">
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
      className="grid grid-cols-[300px_1fr_600px] overflow-hidden bg-[#0f1420] text-gray-200"
      style={{ height: usableHeight }}
    >
      {/* Left Panel: Blocks + Settings */}
      <aside className="bg-[#1c2533] border-r border-white/10 p-4 flex flex-col overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4 text-white">Add Blocks</h2>
        {blockList.map((type) => (
          <button
            key={type}
            onClick={() => addBlock(type)}
            className="w-full mb-2 bg-white/5 hover:bg-white/10 rounded-lg py-2 text-left px-3 capitalize"
          >
            + {type}
          </button>
        ))}

        <hr className="my-4 border-white/10" />

        <h3 className="text-lg font-semibold mb-2 text-white">Block Settings</h3>
        {!editing && (
          <p className="text-sm text-gray-400 mb-3">
            Select a block to edit its properties.
          </p>
        )}
        {editing &&
          Object.keys(editing.block.values).map((key) => (
            <div key={key} className="mb-3">
              <label className="block text-sm text-gray-300 mb-1 capitalize">
                {key}
              </label>
              <input
                type={
                  key.includes('color') || key.includes('bg')
                    ? 'color'
                    : 'text'
                }
                value={editing.block.values[key]}
                onChange={(e) =>
                  updateBlock(
                    editing.rowId,
                    editing.colId,
                    editing.block.id,
                    key,
                    e.target.value
                  )
                }
                className="w-full rounded-md bg-white/5 border border-white/10 text-white px-2 py-1 outline-none"
              />
            </div>
          ))}

        <div className="mt-auto pt-3 border-t border-white/10">
          <button
            onClick={saveDesign}
            className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg"
          >
            Save
          </button>
        </div>
      </aside>

      {/* Middle Editor */}
      <main className="overflow-y-auto p-8 bg-[#0f1420]">
        <div
          className="mx-auto max-w-[600px] bg-[#1f2937] rounded-xl border border-white/10 shadow-lg"
          style={{ minHeight: '80vh' }}
        >
          {design.rows.map((row) =>
            row.columns.map((col) =>
              col.contents.map((block) => (
                <div
                  key={block.id}
                  className={`p-2 border ${
                    editing?.block?.id === block.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-transparent'
                  } rounded-md relative`}
                  onClick={() =>
                    setEditing({ rowId: row.id, colId: col.id, block })
                  }
                >
                  {block.type === 'heading' || block.type === 'paragraph' ? (
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
                      onBlur={(e) =>
                        updateBlock(
                          row.id,
                          col.id,
                          block.id,
                          'text',
                          e.target.innerHTML
                        )
                      }
                      dangerouslySetInnerHTML={{
                        __html: block.values.text,
                      }}
                    />
                  ) : null}

                  {block.type === 'image' && (
                    <div
                      className="cursor-pointer text-center"
                      style={{
                        background: block.values.background,
                        padding: block.values.padding,
                      }}
                      onClick={() =>
                        updateBlock(
                          row.id,
                          col.id,
                          block.id,
                          'src',
                          prompt('Image URL:', block.values.src)
                        )
                      }
                    >
                      <img
                        src={block.values.src}
                        alt=""
                        className="rounded-md inline-block max-w-full"
                      />
                    </div>
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
                  {block.type === 'quote' && (
                    <blockquote
                      style={{
                        padding: block.values.padding,
                        color: block.values.color,
                        background: block.values.background,
                        fontStyle: block.values.fontStyle,
                        borderLeft: block.values.borderLeft,
                      }}
                    >
                      {block.values.text}
                    </blockquote>
                  )}
                  {block.type === 'social' && (
                    <div className="text-center text-white/80 py-3">
                      Facebook • X • Instagram
                    </div>
                  )}

                  <button
                    onClick={() => deleteBlock(row.id, col.id, block.id)}
                    className="absolute top-1 right-2 text-xs text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              ))
            )
          )}
        </div>
      </main>

      {/* Right Preview */}
      <aside className="bg-[#0d111a] border-l border-white/10 p-4 overflow-y-auto">
        <h2 className="text-sm font-semibold mb-2 text-white/70">Preview</h2>
        <iframe
          title="preview"
          className="w-full h-[90vh] rounded-md border border-white/10 bg-white"
          srcDoc={renderHTML(design)}
        />
      </aside>
    </div>
  );
}
