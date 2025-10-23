'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import AuthWrapper from '@/components/AuthWrapper';
import { Check, X, PanelTopOpen, PanelTopClose, CheckCircle, Flag, XCircle } from 'lucide-react';

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
    const [showDenyModal, setShowDenyModal] = useState(false);
    const [denyReason, setDenyReason] = useState('');

    useEffect(() => {
        const userData = localStorage.getItem('User');
        setStaffMember(userData || 'Unknown');
    }, []);

    const fetchUserById = async (userId) => {
        if (!userId) return null;
        try {
            const res = await axios.get(`/api/users/${userId}`);
            return res.data;
        } catch (err) {
            console.error(`Failed to fetch user ${userId}`, err);
            return null;
        }
    };

    const fetchAppeal = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await axios.get(`/api/appeals/${id}`);
            const appealData = res.data;

            const notePromises = appealData.notes.map(async (note) => {
                let staffMemberId = null;

                if (typeof note.staffMember === 'string') {
                    staffMemberId = note.staffMember;
                } else if (typeof note.staffMember === 'object' && note.staffMember._id) {
                    staffMemberId = note.staffMember._id;
                }

                if (staffMemberId) {
                    const user = await fetchUserById(staffMemberId);
                    return { ...note, staffMember: user || null };
                }

                return note;
            });

            appealData.notes = await Promise.all(notePromises);
            setAppeal(appealData);
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
            const userData = JSON.parse(localStorage.getItem('User') || '{}');
            await axios.post(`/api/appeals/${id}/note`, {
                staffMember: userData._id,
                noteText,
            });
            await fetchAppeal();
            setNoteText('');
        } catch (err) {
            console.error(err);
            alert('Failed to add note.');
        } finally {
            setAddingNote(false);
        }
    };

    const handleStatusChange = async (status, reason = '') => {
        setActionLoading(true);
        try {
            const res = await axios.patch(`/api/appeals/${id}/status`, { status, denyReason: reason });
            setAppeal((prev) => ({
                ...prev,
                status: res.data.status || status,
                denyReason: res.data.denyReason || reason,
            }));

            const userData = JSON.parse(localStorage.getItem('User') || '{}');
            const staffId = userData._id || null;

            const systemNotePayload = {
                staffMember: staffId,
                noteText:
          status === 'Accepted'
            ? `System | ✅ Appeal was accepted by ${userData.username || 'Unknown'}`
            : status === 'Denied'
              ? `System | ❌ Appeal was denied by ${userData.username || 'Unknown'}`
              : `System | ⚠️ Appeal was flagged by ${userData.username || 'Unknown'}`,
                status,
                createdAt: new Date().toISOString(),
                system: true,
            };

            await axios.post(`/api/appeals/${id}/note`, systemNotePayload);
            await fetchAppeal();
            setShowDenyModal(false);
            setDenyReason('');
        } catch (err) {
            console.error(err);
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
            <main className="text-white px-6 py-10 flex justify-center">
                <div
                    className={`max-w-10xl w-full grid ${showNotes ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 min-h-[675px] max-h-[675px]'
                        } gap-6 transition-all duration-500`}
                >

                    {/* Details Column */}
                    <motion.div
                        layout
                        animate={{ x: showNotes ? 0 : 0, scale: showNotes ? 1 : 1.05 }}
                        transition={{ type: 'spring', duration: 0.5 }}
                        className={`bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl h-full flex flex-col ${showNotes ? '' : 'mx-auto max-w-xl'
                            }`}
                    >

                        <div className="flex items-center justify-between w-full mb-4">
                            <h1 className="text-2xl font-bold">
                                Appeal: <span className="text-blue-400">{id}</span>
                            </h1>
                            <h1 className="text-2xl font-bold">
                                <strong>Status: </strong>
                                <strong
                                    className={`underline ${appeal.status === 'Pending'
                                        ? 'text-yellow-400'
                                        : appeal.status === 'Denied'
                                            ? 'text-red-500'
                                            : appeal.status === 'Accepted'
                                                ? 'text-green-500'
                                                : appeal.status === 'Flagged'
                                                ? 'text-yellow-500':'text-white'
                                        }`}
                                >
                                    {appeal.status}
                                </strong>
                            </h1>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <p><strong>Email:</strong> <span className="text-purple-400">{appeal.email}</span></p>
                            <p><strong>Discord:</strong> <span className="text-purple-400">{appeal.DiscordUsername}</span> <span className="text-white/60">({appeal.DiscordId})</span></p>
                            <p><strong>Roblox:</strong> <span className="text-purple-400">{appeal.RobloxUsername}</span></p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                            <p><strong>Staff Member:</strong> {appeal.staffMember}</p>
                            <p><strong>Ban Date:</strong> {new Date(appeal.banDate).toLocaleDateString('en-UK')}</p>
                            <p><strong>Appeal Date:</strong> {new Date(appeal.createdAt).toLocaleDateString('en-UK')}</p>
                        </div>

                        <div className="mt-4">
                            <strong>Ban Reason:</strong>
                            <div className="bg-black/30 p-2 rounded-lg mt-2 min-h-[100px] overflow-hidden">{appeal.banReason}</div>
                        </div>

                        <div className="mt-4">
                            <strong>Unban Justification:</strong>
                            <div className="bg-black/30 p-2 rounded-lg mt-2 min-h-[100px] overflow-hidden">{appeal.unbanReason || 'N/A'}</div>
                        </div>

                        {appeal.status === 'Denied' && (
                            <div className="mt-4">
                                <strong>Deny Reason:</strong>
                                <div className="bg-black/30 p-2 rounded-lg mt-2 min-h-[100px] overflow-hidden">{appeal.denyReason || 'N/A'}</div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-auto flex justify-between pt-6">
                            <button onClick={() => handleStatusChange('Accepted')} className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-semibold px-4 py-2 rounded-lg transition">
                                <CheckCircle className="w-5 h-5" /> Accept
                            </button>
                            <button onClick={() => handleStatusChange('Flagged')} className="flex items-center gap-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-semibold px-4 py-2 rounded-lg transition">
                                <Flag className="w-5 h-5" /> Flag
                            </button>
                            <button onClick={() => handleStatusChange('Denied')} className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold px-4 py-2 rounded-lg transition">
                                <XCircle className="w-5 h-5" /> Deny
                            </button>
                        </div>
                    </motion.div>

                    {/* Notes Column */}
                    <AnimatePresence>
                        {showNotes && (
                            <motion.div
                                key="notes"
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 100 }}
                                transition={{ duration: 0.4 }}
                                className="bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl h-full flex flex-col"
                            >
                                <h2 className="text-lg font-semibold mb-3">Notes</h2>

                                <div className="flex gap-2 mb-4">
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

                                {appeal.notes.length === 0 ? (
                                    <p className="text-white/60">No notes yet.</p>
                                ) : (
                                    <ul className="space-y-2 overflow-y-auto max-h-[500px] ">
                                         {[...appeal.notes].reverse().map((note, idx) => {
                                            const staff = note.staffMember;
                                            const isAccepted = note.noteText.includes('✅ Appeal was accepted');
                                            const isDenied = note.noteText.includes('❌ Appeal was denied');
                                            const isTalented = note.noteText.includes('⚠️ Appeal was flagged');

                                            const bgColor = isAccepted
                                                ? 'bg-green-500/20 border-green-500/30'
                                                : isDenied
                                                    ? 'bg-red-500/20 border-red-500/30'
                                                    : isTalented
                                                    ? 'bg-yellow-500/20 border-yellow-500/30': 'bg-white/10 border-white/20';

                                            const textColor = isAccepted
                                                ? 'text-green-400'
                                                : isDenied
                                                    ? 'text-red-400'
                                                    : isTalented
                                                    ? 'text-yellow-400':'text-white';

                                            return (
                                                <li key={idx} className={`p-2 rounded-md flex items-center gap-3 border ${bgColor}`}>
                                                    {staff?.defaultAvatar ? (
                                                        <Image
                                                            src={
                                                                staff.defaultAvatar ||
                                                                staff.robloxAvatar ||
                                                                staff.discordAvatar ||
                                                                '/default-avatar.png'
                                                            }
                                                            alt={staff.username}
                                                            className="w-8 h-8 rounded-full"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-white/10" />
                                                    )}
                                                    <div>
                                                        <span className="font-semibold text-blue-300">
                                                            {staff?.username || 'Unknown'}
                                                        </span>{' '}
                                                        {staff?.robloxUsername && (
                                                            <span className="text-white/60">(@{staff.robloxUsername})</span>
                                                        )}
                                                        <div className={`text-sm mt-1 ${textColor}`}>{note.noteText}</div>
                                                        <div className="text-xs text-white/50">
                                                            {new Date(note.createdAt).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </AuthWrapper>
    );
}
