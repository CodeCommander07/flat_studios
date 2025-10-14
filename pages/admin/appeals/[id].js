'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import AuthWrapper from '@/components/AuthWrapper';
import { Check, X, PanelTopOpen, PanelTopClose } from 'lucide-react';

export default function AppealDetailPage() {
    const router = useRouter();
    const { id } = router.query;

    const [appeal, setAppeal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [noteText, setNoteText] = useState('');
    const [addingNote, setAddingNote] = useState(false);
    const [staffMember, setStaffMember] = useState('');
    const [showNotes, setShowNotes] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Deny Modal State
    const [showDenyModal, setShowDenyModal] = useState(false);
    const [denyReason, setDenyReason] = useState('');

    useEffect(() => {
        const userData = localStorage.getItem('User');
        setStaffMember(userData || 'Unknown');
    }, []);

    const fetchAppeal = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await axios.get(`/api/appeals/${id}`);
            setAppeal(res.data);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch appeal.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!noteText.trim()) return;
        setAddingNote(true);
        try {
            const res = await axios.post(`/api/appeals/${id}/note`, {
                staffMember,
                noteText,
            });
            setAppeal(res.data);
            setNoteText('');
        } catch (err) {
            alert('Failed to add note.');
        } finally {
            setAddingNote(false);
        }
    };

    // Update appeal status (Accept / Deny)
    const handleStatusChange = async (status, reason = '') => {
        setActionLoading(true);
        try {
            const res = await axios.patch(`/api/appeals/${id}/status`, {
                status,
                denyReason: reason, // send deny reason if any
            });
            setAppeal(res.data);
            setShowDenyModal(false);
            setDenyReason('');
        } catch (err) {
            alert('Failed to update status.');
        } finally {
            setActionLoading(false);
        }
    };

    useEffect(() => {
        fetchAppeal();
    }, [id]);

    if (loading) return <p className="text-white">Loading...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!appeal) return <p className="text-white">Appeal not found.</p>;

    return (
        <AuthWrapper requiredRole="admin">
            <main className="text-white px-6 py-10 flex flex-col items-center">
                <div className="max-w-4xl w-full bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl space-y-6">

                    <div className="flex items-center justify-between w-full mb-4">
                        <h1 className="text-2xl font-bold">
                            Appeal: <span className="text-blue-400">{id}</span>
                        </h1>
                        <div>
                            <h1 className="text-2xl font-bold">
                            <strong>Status: </strong>
                            <strong
                                className={`underline ${appeal.status === 'Pending'
                                        ? 'text-yellow-400'
                                        : appeal.status === 'Denied'
                                            ? 'text-red-500'
                                            : appeal.status === 'Accepted'
                                                ? 'text-green-500'
                                                : 'text-white'}`
                                   
                                }
                            >
                                {appeal.status}
                            </strong>
                            </h1>
                        </div>
                    </div>

                    {/* Row with Email, Discord, Roblox */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <p><strong>Email:</strong> {appeal.email}</p>
                        <p><strong>Discord:</strong> {appeal.DiscordUsername} ({appeal.DiscordId})</p>
                        <p><strong>Roblox:</strong> {appeal.RobloxUsername}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <p><strong>Staff Member:</strong> {appeal.staffMember}</p>
                        <p><strong>Ban Date:</strong> {new Date(appeal.banDate).toLocaleDateString()}</p>
                        <p><strong>Appeal Date:</strong> {new Date(appeal.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div><strong>Ban Reason:</strong>
                        <div className='bg-black/30 p-2 rounded rounded-lg mt-2'>{appeal.banReason}</div></div>
                    <div><strong>Unban Justification:</strong> <div className='bg-black/30 p-2 rounded rounded-lg mt-2'>{appeal.unbanReason || 'N/A'}</div></div>

                    {appeal.status === 'Denied' && (
                        <div>
                            <strong>Deny Reason:</strong>
                            <div className='bg-black/30 p-2 rounded rounded-lg mt-2'>{appeal.denyReason || 'N/A'}</div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex mt-4">
                        <button
                            onClick={() => handleStatusChange('Accepted')}
                            disabled={actionLoading}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-l-full flex items-center justify-center gap-2"
                        >
                            <Check size={16} /> Accept
                        </button>

                        <button
                            onClick={() => setShowNotes(!showNotes)}
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 flex items-center justify-center gap-2"
                        >
                            {showNotes ? <PanelTopOpen size={16} /> : <PanelTopClose size={16} />}
                            {showNotes ? 'Hide' : 'Show'} Notes
                        </button>

                        <button
                            onClick={() => setShowDenyModal(true)}
                            disabled={actionLoading}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-r-full flex items-center justify-center gap-2"
                        >
                            <X size={16} /> Deny
                        </button>
                    </div>

                    {/* Notes Section */}
                    {showNotes && (
                        <div className="mt-6">
                            <h2 className="text-lg font-semibold mb-2">User Notes:</h2>

                            {appeal.notes.length === 0 ? (
                                <p className="text-white/60">No notes yet.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {appeal.notes.map((note, idx) => (
                                        <li key={idx} className="bg-white/10 p-2 rounded-md">
                                            <span className="font-semibold text-blue-300">{note.staffMember}</span> - {note.noteText}
                                            <div className="text-xs text-white/50">{new Date(note.createdAt).toLocaleString()}</div>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className="mt-4 flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Add a note..."
                                    className="flex-1 px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white"
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                />
                                <button
                                    onClick={handleAddNote}
                                    disabled={addingNote}
                                    className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-md text-white"
                                >
                                    {addingNote ? 'Saving...' : 'Add'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Deny Modal */}
                {showDenyModal && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                        <div className="bg-zinc-500 rounded-lg w-200 h-100 p-6 text-white shadow-lg">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-red-400">Deny Appeal</h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowDenyModal(false)}
                                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm h-10"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange('Denied', denyReason)}
                                        className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm h-10"
                                    >
                                        Deny
                                    </button>
                                </div>
                            </div>

                            <textarea
                                className="w-full p-2 rounded bg-black/20 text-white h-75 resize-none"
                                rows={5}
                                placeholder="Enter reason for denial..."
                                value={denyReason}
                                onChange={(e) => setDenyReason(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </main>
        </AuthWrapper>
    );
}
