'use client';

import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from '@/components/CountUp';
import GradientText from '@/components/GradientText';
import { FileDown, Trash, Eye, UploadCloud, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';

export default function FilesPage() {
  const [user, setUser] = useState('');
  const [userId, setUserId] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [filename, setFilename] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('User'));
    setUser(user);
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

  const handleShare = async (fileId) => {
    const url = `${window.location.origin}/api/cdn/view?fileId=${fileId}&userId=${userId}`;

    try {
      await navigator.clipboard.writeText(url);
      setError('✅ Link copied!');
      setTimeout(() => setError(null), 2000);
    } catch {
      setError('Failed to copy link');
      setTimeout(() => setError(null), 2000);
    }
  };

  const handleDownload = (fileId, filename) => {
    const url = `/api/cdn/view?fileId=${fileId}&userId=${userId}`;

    const link = document.createElement('a');
    link.href = url;
    link.download = cleanFileName(filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(1);
    return `${size} ${sizes[i]}`;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed.');
      fileInputRef.current.value = '';
      return;
    }

    setFilename(file.name.replace(/\.[^/.]+$/, ''));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!userId) return setError('User not logged in');
    if (!fileInputRef.current.files.length) return setError('Select a file to upload');

    const file = fileInputRef.current.files[0];
    if (!file.type.startsWith('image/')) {
      return setError('Only image files can be uploaded.');
    }

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
      fetchFiles();
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
      fileInputRef.current.value = '';
      setFilename('');
    }
  };

  const handlePreviewFile = (index) => {
    setSelectedIndex(index === selectedIndex ? null : index);
  };

  const handleNext = () => {
    if (files.length === 0) return;
    setSelectedIndex((i) => (i + 1) % files.length);
  };

  const handlePrev = () => {
    if (files.length === 0) return;
    setSelectedIndex((i) => (i - 1 + files.length) % files.length);
  };

  const handleDelete = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    try {
      await axios.delete('/api/cdn/delete', { data: { userId, fileId } });
      fetchFiles();
      if (files[selectedIndex]?._id === fileId) setSelectedIndex(null);
    } catch {
      setError('Delete failed');
    }
  };

  const cleanFileName = (filename) =>
    filename?.replace(
      /^.*?[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}-/,
      ''
    ) || '';

  const selectedFile = selectedIndex !== null ? files[selectedIndex] : null;

  return (
    <main className="flex flex-col justify-center items-center text-white px-4 py-4">
      {/* Title */}
      <GradientText
        colors={['#40ffaa', '#4079ff', '#40ffaa']}
        animationSpeed={6}
        className="bg-[#283335] rounded-2xl border border-white/10 mb-4 text-3xl font-bold text-center w-full max-w-6xl"
      >
        Welcome {user.username} — You currently have{' '}
        <CountUp from={0} to={files.length} duration={1} /> images
      </GradientText>

      {error && <p className="text-red-400 text-center mb-4">⚠️ {error}</p>}

      {/* Background box (full width) */}
      <div className="w-full max-w-7xl bg-[#283335] rounded-2xl border border-white/10 shadow-lg backdrop-blur-lg p-8 grid md:grid-cols-2 gap-8">
        {/* LEFT — Image preview */}
        <div className="relative flex flex-col justify-center items-center max-h-[600px] border border-white/10 rounded-2xl overflow-hidden bg-[#1f2628]">
          <AnimatePresence mode="wait">
            {selectedFile ? (
              <motion.div
                key={selectedFile._id}
                className="absolute inset-0 flex justify-center items-center"
                initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                transition={{ duration: 0.4 }}
              >
                <img
                  src={`/api/cdn/view?fileId=${selectedFile._id}&userId=${userId}`}
                  alt={cleanFileName(selectedFile.filename)}
                  className="object-contain h-full w-full rounded-2xl"
                />
                <div className="absolute bottom-0 bg-black/50 text-sm text-white/80 w-full text-center py-2">
                  {cleanFileName(selectedFile.filename)} — {formatFileSize(selectedFile.size)}
                </div>

                {/* Arrows */}
                <div className="absolute inset-0 flex justify-between items-center px-4">
                  <button
                    onClick={handlePrev}
                    className="p-2 bg-black/30 hover:bg-black/50 rounded-full transition"
                  >
                    <ChevronLeft size={28} />
                  </button>
                  <button
                    onClick={handleNext}
                    className="p-2 bg-black/30 hover:bg-black/50 rounded-full transition"
                  >
                    <ChevronRight size={28} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                className="text-white/60 flex flex-col items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <UploadCloud className="w-10 h-10 mb-2" />
                <p>Select or click an image to preview</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT — File list + Upload */}
        <div className="flex flex-col h-[600px]">
          <form onSubmit={handleUpload} className="mb-4 flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-white bg-[#283335] border border-white/20 rounded-lg cursor-pointer focus:ring-2 focus:ring-blue-500 p-2"
            />
            <button
              type="submit"
              disabled={uploading}
              className={`px-4 py-2 rounded-lg font-semibold transition ${uploading
                ? 'bg-blue-500/70 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>

          <motion.ul
            layout
            className="flex-1 space-y-4 overflow-y-scroll"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <style jsx>{`
              ul::-webkit-scrollbar {
                display: none;
              }
            `}</style>

            <AnimatePresence>
              {files.map((file, index) => (
                <motion.li
                  key={file._id}
                  onClick={() => handlePreviewFile(index)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-center gap-4 bg-white/5 border rounded-xl p-4 transition cursor-pointer ${selectedIndex === index
                    ? 'border-2 border-blue-400 bg-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                    : 'border-white/10 hover:bg-[#283335]'
                    }`}
                >
                  <div className="w-20 h-16 flex-shrink-0 overflow-hidden rounded-lg border border-white/10">
                    <img
                      src={`/api/cdn/view?fileId=${file._id}&userId=${userId}`}
                      alt="thumbnail"
                      className="object-cover w-full h-full"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {cleanFileName(file.filename)}
                    </h3>
                    <p className="text-white/60 text-sm">
                      {formatFileSize(file.size)} — Uploaded:{' '}
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
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(file._id);
                      }}
                      className="text-blue-400 hover:text-blue-300 transition"
                      title="Copy share link"
                    >
                      <Share2 size={18} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(file._id, file.filename);
                      }}
                      className="text-green-400 hover:text-green-300 transition"
                      title="Download file"
                    >
                      <FileDown size={18} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(file._id);
                      }}
                      className="text-red-400 hover:text-red-300 transition"
                      title="Delete file"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        </div>
      </div>
    </main>
  );
}
