'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, Eye, Trash2, Send, XCircle } from 'lucide-react';

export default function TaskDetailPage() {
  const router = useRouter();
  const { taskId } = router.query;

  const [task, setTask] = useState(null);
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [viewFile, setViewFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const statusOptions = [
    { value: 'not-started', label: 'Not Started', color: 'bg-red-600' },
    { value: 'developing', label: 'Developing', color: 'bg-yellow-600' },
    { value: 'completed', label: 'Completed', color: 'bg-green-600' },
    { value: 'reviewed', label: 'Reviewed', color: 'bg-blue-600' },
    { value: 'implemented', label: 'Implemented', color: 'bg-purple-600' },
  ];

  // ✅ Load task + notes + files
  useEffect(() => {
    if (!taskId) return;

    (async () => {
      try {
        setIsLoading(true);
        const [taskRes, notesRes, filesRes] = await Promise.all([
          axios.get(`/api/developers/tasks/task/${taskId}`),
          axios.get(`/api/developers/notes?taskId=${taskId}`),
          axios.get(`/api/developers/tasks/files?taskId=${taskId}`),
        ]);

        setTask(taskRes.data.task || taskRes.data);
        setNotes(notesRes.data.notes || []);
        setFiles(filesRes.data.files || []);
      } catch (error) {
        console.error('Error loading task data:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [taskId]);

  // ✅ Simple status update
  const handleStatusUpdate = async (newStatus) => {
    try {
      await axios.patch(`/api/developers/tasks/status`, { taskId, taskStatus: newStatus });
      const refreshed = await axios.get(`/api/developers/tasks/task/${taskId}`);
      setTask(refreshed.data.task || refreshed.data);
      const notesRes = await axios.get(`/api/developers/notes?taskId=${taskId}`);
      setNotes(notesRes.data.notes || []);
    } catch (error) {
      console.error('Error updating status:', error.response?.data || error.message);
    }
  };

  // ✅ Add note
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      const storedUser = JSON.parse(localStorage.getItem('User') || '{}');
      const res = await axios.post('/api/developers/notes', {
        taskId,
        noteText: newNote,
        staffMember: {
          name: storedUser?.username || 'Unknown',
          email: storedUser?.email || 'Unknown',
        },
        system: false,
      });
      setNotes((prev) => [...prev, res.data.note]);
      setNewNote('');
    } catch (err) {
      console.error('Error adding note:', err);
    }
  };

  // ✅ File upload
  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('taskId', taskId);
    await axios.post('/api/developers/tasks/upload', formData);
    const filesRes = await axios.get(`/api/developers/tasks/files?taskId=${taskId}`);
    setFiles(filesRes.data.files || []);
    setSelectedFile(null);
    setUploading(false);
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-[calc(95vh-7rem)] text-white/80 text-xl">
        Loading task...
      </div>
    );

  if (!task)
    return (
      <div className="flex items-center justify-center h-[calc(95vh-7rem)] text-white/80 text-xl">
        Task not found
        <a href="/dev/tasks">Return Back To Tasks</a>
      </div>
    );

  const currentStatus = statusOptions.find((s) => s.value === task.taskStatus);

  return (
    <div className="p-6 text-white/90 max-h-screen flex flex-col">
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
        {/* LEFT SIDE */}
        <div className="flex flex-col gap-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#283335] backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg flex-1 max-h-[300px]"
          >

            {/* HEADER: Title + Status Selector */}
            {/* TITLE */}
            <h1 className="text-2xl font-bold text-blue-300 mb-2">{task.taskName}</h1>

            {/* 🔥 ANIMATED STATUS BAR */}
            <div className='w-full border border-gray-400/50 mb-2' />
            <div className="mb-2 status-bar">

              {/* Animated slider background */}
              <div
                className={`status-slider ${currentStatus?.color}`}
                style={{
                  width: `${100 / statusOptions.length}%`,
                  transform: `translateX(${statusOptions.findIndex(s => s.value === task.taskStatus) * 100}%)`,
                }}
              />

              {/* Render each status segment */}
              {statusOptions.map((status) => {
                const active = task.taskStatus === status.value;

                return (
                  <button
                    key={status.value}
                    onClick={() => handleStatusUpdate(status.value)}
                    className={`flex-1 text-center py-2 rounded-lg text-sm font-medium transition-all relative z-10
          ${active ? "text-white" : "text-white/60 hover:text-white"}
        `}
                  >
                    {status.label}
                  </button>
                );
              })}
            </div>
            <div className='w-full border border-gray-400/50 mb-2' />
            {/* DESCRIPTION */}
            <h3 className="text-lg font-semibold text-blue-300 mb-1">Details</h3>
            <p className="text-white/80 leading-relaxed whitespace-pre-wrap mb-2">
              {task.taskDescription}
            </p>
            <div className='w-full border border-gray-400/50 mb-2' />
            {/* METADATA ROW */}
            <div className="flex flex-wrap gap-4 text-sm text-white/70">

              <span className="text-red-400 font-semibold text-sm">
                Due: {new Date(task.dueDate).toLocaleDateString("en-UK")}
              </span>

              <span>
                Priority: <span className="font-semibold text-white">{task.priority}</span>
              </span>

              <span>
                Created:
                <span className="text-white font-medium"> {new Date(task.createdAt).toLocaleDateString("en-UK")}</span>
              </span>

              {task.completedAt && (
                <span>
                  Completed:
                  <span className="text-green-300 font-medium"> {new Date(task.completedAt).toLocaleDateString("en-UK")}</span>
                </span>
              )}

              {task.reviewedAt && (
                <span>
                  Reviewed:
                  <span className="text-blue-300 font-medium"> {new Date(task.reviewedAt).toLocaleDateString("en-UK")}</span>
                </span>
              )}

              {task.implementedAt && (
                <span>
                  Implemented:
                  <span className="text-purple-300 font-medium"> {new Date(task.implementedAt).toLocaleDateString("en-UK")}</span>
                </span>
              )}

              {(() => {
                const storedUser = JSON.parse(localStorage.getItem("User") || "{}");
                const allowedRoles = ["Human-Resources", "Web-Developer", "Owner"];

                if (!allowedRoles.includes(storedUser?.role)) return null;

                return (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-300 hover:text-red-400 font-semibold"
                  >
                    <Trash2 size={14} className="inline mr-1" />
                    Delete Task
                  </button>
                );
              })()}

            </div>

          </motion.div>



          {/* Files */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#283335] backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg flex-1 max-h-[300px]"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-blue-300">Files</h2>
              <label
                htmlFor="fileUpload"
                className="cursor-pointer bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2"
              >
                <Upload size={16} /> Upload
              </label>
              <input
                type="file"
                id="fileUpload"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="hidden"
              />
            </div>

            {selectedFile && (
              <button
                onClick={handleFileUpload}
                disabled={uploading}
                className="mb-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Submit File'}
              </button>
            )}

            {files.length === 0 ? (
              <p className="text-white/50 text-sm">No files uploaded yet.</p>
            ) : (
              <ul className="space-y-3">
                {files.map((file) => (
                  <li
                    key={file._id}
                    className="flex items-center justify-between bg-white/5 border border-white/10 p-3 rounded-lg hover:bg-white/10 transition"
                  >
                    <div>
                      <p className="font-medium">{file.filename}</p>
                      <p className="text-xs text-white/50">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          window.open(`/api/developers/tasks/download?taskId=${taskId}&fileId=${file._id}`, '_blank')
                        }
                        className="bg-green-600 hover:bg-green-700 p-2 rounded-lg"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => setViewFile(file)}
                        className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() =>
                          axios
                            .delete(`/api/developers/tasks/delete?taskId=${taskId}&fileId=${file._id}`)
                            .then(() => setFiles((prev) => prev.filter((f) => f._id !== file._id)))
                        }
                        className="bg-red-600 hover:bg-red-700 p-2 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </div>

        {/* RIGHT SIDE - Notes */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#283335] backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg flex flex-col max-h-[625px]"
        >
          <h2 className="text-lg font-semibold text-blue-300 mb-4">Notes</h2>
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[70vh]">
            {notes.length === 0 ? (
              <p className="text-white/50 text-sm text-center">No notes yet.</p>
            ) : (
              [...notes].reverse().map((n, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border ${n.system ? 'bg-blue-900/20 border-blue-500/30' : 'bg-white/5 border-white/10'
                    }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm text-white/90">
                      {n.staffMember?.name || 'Unknown'}
                    </span>
                    <span className="text-xs text-white/50">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-white/80 text-sm whitespace-pre-wrap">{n.noteText}</p>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note..."
              className="flex-1 bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <button
              onClick={handleAddNote}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg flex items-center gap-1"
            >
              <Send size={16} />
              <span className="text-sm font-medium">Send</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* FILE PREVIEW MODAL */}
      <AnimatePresence>
        {viewFile && (
          <motion.div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewFile(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black/90 border border-white/20 rounded-2xl p-6 max-w-3xl w-[90%] max-h-[80vh] overflow-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-3 right-3 text-white/70 hover:text-white"
                onClick={() => setViewFile(null)}
              >
                <XCircle size={24} />
              </button>
              <h2 className="text-xl font-bold text-blue-300 mb-4">{viewFile.filename}</h2>
              <p className="text-white/70 text-sm mb-4">Preview not available. Download below.</p>
              <button
                onClick={() =>
                  window.open(`/api/developers/tasks/download?taskId=${taskId}&fileId=${viewFile._id}`, '_blank')
                }
                className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg font-semibold"
              >
                Download
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#182022] border border-white/20 rounded-2xl p-6 w-[92%] max-w-md text-white shadow-xl"
            >
              {/* Title */}
              <h2 className="text-xl font-bold text-red-400 mb-3">Delete Task</h2>

              {/* Body */}
              <p className="text-white/70 mb-4">
                To confirm deletion of:
                <br />
                <span className="font-semibold text-white">
                  “{task.taskName}”
                </span>
                <br /><br />
                Please type <span className="text-red-400 font-semibold">DELETE TASK</span> below:
              </p>

              {/* Text Input */}
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE TASK to confirm..."
                className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm mb-6 focus:outline-none focus:ring-1 focus:ring-red-500"
              />

              {/* Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setConfirmText("");
                  }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
                >
                  Cancel
                </button>

                <button
                  disabled={confirmText !== "DELETE TASK"}
                  onClick={async () => {
                    try {
                      await axios.delete(`/api/developers/tasks/deleteTask?taskId=${taskId}`);
                      setShowDeleteConfirm(false);
                      router.push("/admin/dev/");
                    } catch (err) {
                      console.error(err);
                      alert("Failed to delete task.");
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2
              ${confirmText === "DELETE TASK"
                      ? "bg-red-600 hover:bg-red-700 text-gray-100"
                      : "bg-red-900/40 text-gray-400 cursor-not-allowed"
                    }
            `}
                >
                  <Trash2 size={16} />
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style jsx>{`
  .status-bar {
    position: relative;
    background: rgba(0,0,0,0.35);
    border-radius: 12px;
    padding: 4px;
    border: 1px solid rgba(255,255,255,0.1);
    display: flex;
    overflow: hidden;
  }

  .status-slider {
    position: absolute;
    top: 4px;
    bottom: 4px;
    border-radius: 10px;
    transition: all 0.35s cubic-bezier(.2,1,.22,1);
    z-index: 0;
  }
`}</style>
    </div>
  );
}
