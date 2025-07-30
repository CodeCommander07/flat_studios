'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function TaskDetailPage() {
  const router = useRouter();
  const { taskId } = router.query;

  const [task, setTask] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const statuses = ['not started', 'in-progress', 'completed'];

  const handleStatusCycle = () => {
    const currentIndex = statuses.indexOf(task.taskStatus);
    const nextIndex = (currentIndex + 1) % statuses.length;
    updateStatus(statuses[nextIndex]);
  };

  useEffect(() => {
    if (!taskId) return;

    const fetchTask = async () => {
      try {
        const res = await fetch(`/api/developers/tasks/task/${taskId}`);
        if (!res.ok) throw new Error('Task not found');
        const data = await res.json();
        setTask(data);
      } catch (err) {
        console.error('Error loading task:', err);
      }
    };

    fetchTask();
  }, [taskId]);

  const fetchFiles = async () => {
    try {
      const res = await axios.get(`/api/developers/tasks/files?taskId=${taskId}`);
      setFiles(res.data.files || []);
    } catch (err) {
      console.error('Error loading files:', err);
    }
  };

  useEffect(() => {
    if (taskId) fetchFiles();
  }, [taskId]);

  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('taskId', taskId);

    try {
      await axios.post('/api/developers/tasks/upload', formData);
      setSelectedFile(null);
      await fetchFiles();
    } catch (err) {
      console.error('Upload failed', err);
      alert('Upload failed');
    }
    setUploading(false);
  };

  const updateStatus = async (status) => {
    setUpdatingStatus(true);
    try {
      await axios.patch('/api/developers/tasks/update', {
        userId: task.userId,
        taskId,
        updates: {
          taskStatus: status,
          updatedAt: new Date(),
          ...(status === 'completed' ? { completedAt: new Date() } : {}),
        },
      });
      setTask({ ...task, taskStatus: status });
    } catch {
      alert('Failed to update status');
    }
    setUpdatingStatus(false);
  };

  const handleDownload = (fileId) => {
    window.open(`/api/developers/tasks/download?taskId=${taskId}&fileId=${fileId}`, '_blank');
  };

  const handleDelete = async (fileId) => {
    try {
      await axios.delete(`/api/developers/tasks/delete?taskId=${taskId}&fileId=${fileId}`);
      setFiles(prev => prev.filter(file => file._id !== fileId));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (!task)
    return (
      <div className="flex items-center justify-center h-[calc(95vh-7.3rem)] text-white text-xl">
        Loading task...
      </div>
    );

  return (
    <div className="max-h-screen flex flex-col h-[calc(95vh-7rem)] text-white">
      <div className="flex flex-wrap justify-between items-center gap-4 w-full mt-2">
        {/* Due Date */}
        <div className="bg-black/90 border border-white/30 rounded-xl ml-4 shadow-md px-4 py-2">
          <span className="text-red-400 font-semibold text-sm">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </span>
        </div>

        {/* Task Title */}
        <div className="bg-black/90 border border-white/30 rounded-xl shadow-md px-4 py-2">
          <h1 className="text-blue-400 font-bold text-lg">{task.taskName}</h1>
        </div>

        {/* Status */}
        <div className="bg-black/90 border border-white/30 rounded-xl shadow-md px-4 py-2 mr-4">
          <button
            onClick={handleStatusCycle}
            disabled={updatingStatus}
            className={`px-4 py-1 rounded-md font-semibold text-white transition-all duration-200 ${task.taskStatus === 'not started'
              ? 'bg-red-600'
              : task.taskStatus === 'in-progress'
                ? 'bg-orange-500'
                : 'bg-green-600'
              }`}
          >
            {updatingStatus ? 'Updating...' : task.taskStatus}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap md:flex-nowrap w-full min-h-[400px] max-h-screen gap-6 p-4">
        {/* Description */}
        <div className="flex-1 bg-black/90 border border-white/30 rounded-xl shadow-md p-6 text-white/90 overflow-y-auto">
          <p>{task.taskDescription}</p>
        </div>

        {/* Upload & File List */}
        <div className="flex-1 bg-black/90 border border-white/30 rounded-xl shadow-md p-6 text-white flex flex-col overflow-y-auto">
          {/* Upload Controls */}
          <div className="mb-6">
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="text-white file:bg-indigo-600 file:text-white file:px-4 file:py-2 file:rounded-lg file:cursor-pointer file:hover:bg-indigo-700"
            />
            {selectedFile && (
              <button
                onClick={handleFileUpload}
                disabled={uploading}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-semibold"
              >
                {uploading ? 'Uploading...' : 'Submit'}
              </button>
            )}
          </div>

          {/* Uploaded Files */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Uploaded Files</h3>
            {files.length === 0 ? (
              <p className="text-white/50">No files uploaded yet.</p>
            ) : (
              <ul className="space-y-3">
                {files.map(file => (
                  <li
                    key={file._id}
                    className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10"
                  >
                    <div>
                      <p className="font-medium">{file.filename}</p>
                      <p className="text-white/60 text-sm">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(file._id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => handleDelete(file._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
