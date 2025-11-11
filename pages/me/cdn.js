'use client';

import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import {
  FileDown,
  Trash,
  Eye,
  UploadCloud,
  Image as ImageIcon,
  FileText,
  File,
} from 'lucide-react';

export default function FilesPage() {
  const [userId, setUserId] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [filename, setFilename] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('User'));
    if (user?._id) setUserId(user._id);
  }, []);

  const fetchFiles = async () => {
    if (!userId) return;
    try {
      const res = await axios.get('/api/cdn/list', { params: { userId } });
      setFiles(res.data.files || []);
    } catch {
      setError('Failed to load files');
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [userId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return setPreview(null);

    setFilename(file.name.replace(/\.[^/.]+$/, ''));
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview({ type: 'image', src: ev.target.result });
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      setPreview({ type: 'pdf', name: file.name });
    } else {
      setPreview({ type: 'file', name: file.name });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!userId) return setError('User not logged in');
    if (!fileInputRef.current.files.length) return setError('Select a file to upload');

    const file = fileInputRef.current.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('filename', filename || file.name);

    setUploading(true);
    setError(null);

    try {
      await axios.post('/api/cdn/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreview(null);
      setFilename('');
      fileInputRef.current.value = '';
      fetchFiles();
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleView = (fileId) => {
    window.open(`/api/cdn/view?fileId=${fileId}&userId=${userId}`, '_blank');
  };

  const handleDownload = async (fileId) => {
    try {
      const res = await axios.get(`/api/cdn/view?fileId=${fileId}&userId=${userId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'downloaded-file';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Download failed');
    }
  };

  const handleDelete = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    try {
      await axios.delete('/api/cdn/delete', { data: { userId, fileId } });
      fetchFiles();
    } catch {
      setError('Delete failed');
    }
  };

  const cleanFileName = (filename) =>
    filename.replace(/^.*?[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}-/, '');

  return (
    <main className="max-w-10xl mx-auto px-6 py-12 text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">Your Files</h1>

      {error && (
        <p className="text-red-400 text-center font-medium mb-4">⚠️ {error}</p>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* LEFT — Uploader */}
        <form
          onSubmit={handleUpload}
          className="bg-[#283335] p-6 rounded-2xl border border-white/10 backdrop-blur-lg shadow-md flex flex-col gap-4"
        >
          {/* Preview box */}
          <div className="flex-1 flex justify-center items-center bg-white/5 border border-white/10 rounded-xl h-56 overflow-hidden">
            {!preview ? (
              <div className="flex flex-col items-center text-white/60">
                <UploadCloud className="w-10 h-10 mb-2" />
                <p>Select a file to preview</p>
              </div>
            ) : preview.type === 'image' ? (
              <img src={preview.src} alt="Preview" className="object-contain h-full w-full rounded-xl" />
            ) : preview.type === 'pdf' ? (
              <div className="flex flex-col items-center">
                <FileText className="w-10 h-10 mb-2 text-red-400" />
                <p>{preview.name}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <File className="w-10 h-10 mb-2 text-blue-400" />
                <p>{preview.name}</p>
              </div>
            )}
          </div>

          {/* File input + name */}
          <div>
            <label className="block text-sm mb-1 text-gray-300">Choose File</label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="block w-full text-sm text-white bg-white/10 border border-white/20 rounded-lg cursor-pointer focus:ring-2 focus:ring-blue-500 p-2"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-300">File Name</label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="w-full p-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter custom filename (optional)"
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className={`w-full py-2 rounded-lg font-semibold flex justify-center items-center gap-2 transition ${
              uploading
                ? 'bg-blue-500/70 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </form>

        {/* RIGHT — File list */}
        <div className="bg-[#283335] p-6 rounded-2xl border border-white/10 backdrop-blur-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>

          {files.length === 0 ? (
            <p className="text-center text-white/60">No files uploaded yet.</p>
          ) : (
            <ul className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              {[...files].reverse().map((file) => (
                <li
                  key={file._id}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div>
                    <h3 className="font-semibold">{cleanFileName(file.filename)}</h3>
                    <p className="text-white/60 text-sm">
                      Uploaded:{' '}
                      {new Date(file.uploadedAt || file.createdAt).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false,
                        timeZone: 'Europe/London',
                      })}
                    </p>
                  </div>

                  <div className="flex gap-3 items-center">
                    <button
                      onClick={() => handleView(file._id)}
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <Eye size={18} /> View
                    </button>
                    <button
                      onClick={() => handleDownload(file._id)}
                      className="text-green-400 hover:text-green-300"
                      title="Download"
                    >
                      <FileDown size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(file._id)}
                      className="text-red-400 hover:text-red-300"
                      title="Delete"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
