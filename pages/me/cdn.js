'use client';

import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Share2, FileDown, Trash, Eye } from 'lucide-react';

export default function FilesPage() {
    const [userId, setUserId] = useState('');
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('User'));
        if (user?._id) setUserId(user._id);
    }, []);

    const fetchFiles = async () => {
        if (!userId) return;
        try {
            const res = await axios.get('/api/cdn/list', { params: { userId } });
            setFiles(res.data.files);
        } catch {
            setError('Failed to load files');
        }
    };

    useEffect(() => {
        fetchFiles();
    }, [userId]);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!userId) return setError('User not logged in');

        const fileInput = fileInputRef.current;
        if (!fileInput.files.length) return setError('Select a file to upload');

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('userId', userId);

        setUploading(true);
        setError(null);

        try {
            await axios.post('/api/cdn/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            fileInput.value = '';
            fetchFiles();
        } catch {
            setError('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (fileId) => {
        if (!userId) return setError('User not logged in');

        try {
            const res = await axios.get(`/api/cdn/view?fileId=${fileId}&userId=${userId}`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;

            const disposition = res.headers['content-disposition'];
            let fileName = 'downloaded-file';
            if (disposition) {
                const filenameMatch = disposition.match(/filename="(.+)"/);
                if (filenameMatch?.length === 2) fileName = filenameMatch[1];
            }
            link.setAttribute('download', fileName);

            document.body.appendChild(link);
            link.click();

            link.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            setError('Download failed');
        }
    };

    const handleShare = async (fileId) => {
        try {
            // This endpoint will redirect to Google Docs viewer if needed
            window.open(`/api/cdn/view?fileId=${fileId}&userId=${userId}`, '_blank');
        } catch {
            setError('View failed');
        }
    };

    const handleDelete = async (fileId) => {
        if (!userId) return setError('User not logged in');
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            await axios.delete('/api/cdn/delete', { data: { userId, fileId } });
            fetchFiles();
        } catch {
            setError('Delete failed');
        }
    };

    function cleanFileName(filename) {
        return filename.replace(/^.*?[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}-/, '');
    }


    return (
        <div className="max-h-screen p-6 flex justify-center items-start py-12">
            <div className="bg-[#283335] backdrop-blur-md rounded-2xl shadow-lg w-full max-w-4xl p-8 text-white border border-white/20">
                <h1 className="text-4xl font-extrabold mb-8 text-center tracking-wide drop-shadow-md">Your Files</h1>

                <form onSubmit={handleUpload} className="mb-8 flex flex-col sm:flex-row items-center gap-4">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="block bg-blue-600/10 w-full sm:w-auto text-white rounded-md p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        disabled={uploading}
                        className={`px-6 py-2 rounded-lg font-semibold tracking-wide transition-colors duration-300
              ${uploading
                                ? 'bg-blue-500 cursor-not-allowed opacity-70'
                                : 'bg-blue-700 hover:bg-blue-800 cursor-pointer'}`}
                    >
                        {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                </form>

                {error && (
                    <p className="mb-6 text-red-400 text-center font-medium select-none">
                        ⚠️ {error}
                    </p>
                )}

                {files.length === 0 ? (
                    <p className="text-center text-white/70 italic">No files uploaded yet.</p>
                ) : (
                    <ul className="space-y-4 max-h-96 overflow-y-auto">
                        {files.map((file) => (
                            <li key={file._id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <h3 className="text-white font-semibold">
                                    {cleanFileName(file.filename)}
                                </h3>
                                <p className="text-white/60 text-sm">
                                    Uploaded:{' '}
                                    {file.uploadedAt
                                        ? new Date(file.uploadedAt).toLocaleString('en-GB', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                            hour12: false,
                                            timeZone: 'Europe/London',
                                        })
                                        : file.createdAt
                                            ? new Date(file.createdAt).toLocaleString('en-GB', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                                hour12: false,
                                                timeZone: 'Europe/London',
                                            })
                                            : 'Unknown'}
                                </p>

                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => handleShare(file._id)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md"
                                    >
                                        View / Share
                                    </button>

                                    <button
                                        onClick={() => handleDownload(file._id)}
                                        className="text-green-400 hover:text-green-600 font-medium"
                                        title="Download file"
                                        aria-label={`Download ${file.filename}`}
                                    >
                                        <FileDown />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(file._id)}
                                        className="text-red-500 hover:text-red-700 font-semibold"
                                        title="Delete file"
                                        aria-label={`Delete ${file.filename}`}
                                    >
                                        <Trash />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
