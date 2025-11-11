'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import EmailEditor from 'react-email-editor';

export default function EditorPage() {
  const router = useRouter();
  const { id } = router.query;
  const editorRef = useRef(null);

  const [meta, setMeta] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [testTo, setTestTo] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');

  // Fetch data
  useEffect(() => {
    if (!id) return;
    axios.get(`/api/news/${id}`).then((res) => setMeta(res.data));
  }, [id]);

  // Default starter design
  const starterDesign = {
    body: {
      rows: [
        {
          columns: [
            {
              contents: [
                {
                  type: 'text',
                  values: {
                    containerPadding: '20px',
                    textAlign: 'center',
                    backgroundColor: '#283335',
                    color: '#ffffff',
                    text: '<h1 style="margin:0;font-size:22px;">Header</h1>',
                  },
                },
              ],
            },
          ],
        },
        {
          columns: [
            {
              contents: [
                {
                  type: 'text',
                  values: {
                    containerPadding: '20px',
                    lineHeight: '1.6',
                    color: '#333333',
                    text: '<p style="font-size:16px;">Body content here.</p>',
                  },
                },
              ],
            },
          ],
        },
        {
          columns: [
            {
              contents: [
                {
                  type: 'text',
                  values: {
                    containerPadding: '10px',
                    backgroundColor: '#f4f4f9',
                    color: '#888888',
                    fontSize: '12px',
                    textAlign: 'center',
                    text: 'Footer text',
                  },
                },
              ],
            },
          ],
        },
      ],
      values: {
        backgroundColor: '#f4f4f9',
        contentWidth: '600px',
        contentAlign: 'center',
      },
    },
  };

  // When Unlayer editor is ready
  const handleEditorReady = (unlayer) => {
    console.log('✅ Unlayer onReady fired');
    if (meta) {
      const hasDesign = meta.design && Object.keys(meta.design).length > 0;
      console.log('📦 Loading design:', hasDesign ? 'existing' : 'starter');
      unlayer.loadDesign(hasDesign ? meta.design : starterDesign);
    } else {
      console.log('⚠️ Meta not loaded yet, waiting...');
      // Wait until meta loads, then inject
      const interval = setInterval(() => {
        if (editorRef.current?.editor && meta) {
          const hasDesign = meta.design && Object.keys(meta.design).length > 0;
          editorRef.current.editor.loadDesign(hasDesign ? meta.design : starterDesign);
          clearInterval(interval);
        }
      }, 500);
    }
  };

  // Save newsletter
  const save = async () => {
    if (!editorRef.current) return;
    setSaving(true);
    const unlayer = editorRef.current.editor;
    unlayer.exportHtml(async ({ design, html }) => {
      const res = await axios.put(`/api/news/${id}`, {
        title: meta?.title || 'Untitled Newsletter',
        design,
        html,
      });
      setMeta(res.data);
      setSaving(false);
    });
  };

  const exportHtml = async () => {
    await save();
    window.location.href = `/api/news/export/${id}`;
  };

  const showPreview = () => {
    const unlayer = editorRef.current?.editor;
    if (!unlayer) return;
    unlayer.exportHtml(({ html }) => setPreviewHtml(html || '<p>No content</p>'));
  };

  const sendTest = async () => {
    if (!testTo) return alert('Enter a test email address');
    const unlayer = editorRef.current?.editor;
    if (!unlayer) return;
    setSending(true);
    unlayer.exportHtml(async ({ html, design }) => {
      await axios.put(`/api/news/${id}`, { design, html });
      await axios.post('/api/news/send-test', { id, to: testTo });
      setSending(false);
      alert('Sent!');
    });
  };

  return (
    <div className="max-h-screen text-white">
      <div className="max-w-[1400px] mx-auto p-4">
        {/* Header Controls */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <input
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 w-[320px] outline-none"
            value={meta?.title || ''}
            onChange={(e) => setMeta((m) => ({ ...(m || {}), title: e.target.value }))}
            onBlur={async () =>
              await axios.put(`/api/news/${id}`, { title: meta?.title || 'Untitled Newsletter' })
            }
            placeholder="Newsletter title"
          />

          <div className="flex items-center gap-2">
            <button onClick={showPreview} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15">
              Preview
            </button>
            <button onClick={exportHtml} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15">
              Export HTML
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/25 border border-white/10"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <a href="/admin/newsletters" className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15">
              Back
            </a>
          </div>
        </div>

        {/* Test Email */}
        <div className="flex items-center gap-2 mb-3">
          <input
            type="email"
            placeholder="Send test to..."
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
          />
          <button
            onClick={sendTest}
            disabled={sending}
            className="px-3 py-2 rounded-xl bg-blue-600/90 hover:bg-blue-600"
          >
            {sending ? 'Sending…' : 'Send Test'}
          </button>
        </div>

        {/* Editor */}
        <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/30">
          <EmailEditor
            ref={editorRef}
            minHeight="70vh"
            projectId={281513}
            onReady={handleEditorReady}
            options={{
              appearance: { theme: 'dark', panels: { tools: { dock: 'left' } } },
              tools: { form: { enabled: true }, video: { enabled: true } },
            }}
          />
        </div>

        {/* Preview Modal */}
        {previewHtml && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur flex items-center justify-center p-6"
            onClick={() => setPreviewHtml('')}
          >
            <div
              className="bg-[#0f1420] w-full max-w-4xl h-[80vh] rounded-2xl overflow-hidden border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-3 border-b border-white/10">
                <p className="font-semibold">Preview</p>
                <button
                  onClick={() => setPreviewHtml('')}
                  className="px-3 py-1 rounded bg-white/10 hover:bg-white/15"
                >
                  Close
                </button>
              </div>
              <iframe title="preview" className="w-full h-full bg-white" srcDoc={previewHtml} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
