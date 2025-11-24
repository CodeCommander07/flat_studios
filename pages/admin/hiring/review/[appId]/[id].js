'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Flag, StickyNote, Trash } from 'lucide-react';
import Image from 'next/image';
import Breadcrumb from '@/components/Breadcrumb';

export default function SubmissionDetailPage() {
  const params = useParams();
  const { id, appId } = params || {};

  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [userData, setUserData] = useState(null);

  // 🆕 Modal for deny reason
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  const [submittingDeny, setSubmittingDeny] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem('User');
    if (data) setUserData(JSON.parse(data));
  }, []);

  const fetchSubmission = async () => {
    try {
      const res = await axios.get(`/api/careers/submissions/${id}`);
      const subData = res.data;

      // Fetch staff info for notes
      const notePromises = subData.notes?.map(async (note) => {
        if (!note.staffMember) return note;
        try {
          const staffRes = await axios.get(`/api/users/${note.staffMember}`);
          return { ...note, staffMember: staffRes.data };
        } catch {
          return note;
        }
      }) || [];

      subData.notes = await Promise.all(notePromises);
      setSub(subData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchSubmission();
  }, [id]);

  // 🧩 Handle status change (accept / talent pool)
  const handleStatusChange = async (status, extraNote) => {
    if (!userData) return;
    try {
      await axios.patch(`/api/careers/submissions/${id}/status`, { status, denyReason });

      const systemNote = {
        staffMember: userData._id,
        noteText:
          status === 'accepted'
            ? `✅ Application was accepted by ${userData.username || 'Unknown'}`
            : status === 'denied'
              ? `❌ Application was denied by ${userData.username || 'Unknown'}${extraNote ? ` — Reason: ${extraNote}` : ''}`
              : `⚠️ Application was added to the talent pool by ${userData.username || 'Unknown'}`,
        system: true,
      };

      await axios.post(`/api/careers/submissions/${id}/note`, systemNote);
      await fetchSubmission();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !userData) return;
    setAddingNote(true);
    try {
      await axios.post(`/api/careers/submissions/${id}/note`, {
        noteText: newNote,
        staffMember: userData._id,
      });
      setNewNote('');
      await fetchSubmission();
    } catch (err) {
      console.error(err);
    } finally {
      setAddingNote(false);
    }
  };

  // 🆕 Handle deny with popup reason
  const handleDeny = async () => {
    setSubmittingDeny(true);
    try {
      // ✅ Always call handleStatusChange, even if denyReason is empty
      await handleStatusChange('denied', denyReason || '');

      // ✅ Only add a personal note if a reason was actually entered
      if (denyReason.trim()) {
        await axios.post(`/api/careers/submissions/${id}/note`, {
          staffMember: userData._id,
          noteText: `📝 Deny Reason: ${denyReason}`,
        });
      }

      setDenyReason('');
      setShowDenyModal(false);
      await fetchSubmission();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingDeny(false);
    }
  };


  const handleDeleteApplication = async () => {
    if (!userData) return alert('User data missing.');
    if (!confirm('Are you sure you want to permanently delete this application?')) return;

    try {
      await axios.delete(`/api/careers/submissions/${id}`);
      alert('Application deleted successfully.');
      window.location.href = `/hub+/hiring/${appId}`;
    } catch (err) {
      console.error('Failed to delete application:', err);
      alert('Failed to delete this application.');
    }
  };

  const getNoteStyles = (note) => {
    const text = note.noteText.toLowerCase();
    let bgColor = 'bg-[#283335] border-white/20';
    let textColor = 'text-white';

    if (text.includes('accepted') || text.includes('✅')) {
      bgColor = 'bg-green-500/20 border-green-500/30';
      textColor = 'text-green-400';
    } else if (text.includes('denied') || text.includes('❌')) {
      bgColor = 'bg-red-500/20 border-red-500/30';
      textColor = 'text-red-400';
    } else if (text.includes('talent') || text.includes('⚠️')) {
      bgColor = 'bg-yellow-500/20 border-yellow-500/30';
      textColor = 'text-yellow-400';
    }

    return { bgColor, textColor };
  };

  if (loading) return <p className="text-center text-white/70">Loading...</p>;
  if (!sub) return <p className="text-center text-white/70">Submission not found.</p>;

  return (
    <div className="p-4">
      <motion.div
        layout
        className={`max-w-10xl mx-auto w-full grid ${showNotes ? 'md:grid-cols-2' : 'grid-cols-1'} gap-6 transition-all duration-500`}
      >
        {/* Left Panel */}
        <motion.div layout className={`bg-[#283335] border border-white/20 backdrop-blur-md p-6 rounded-bl-2xl rounded-tr-2xl hover:rounded-2xl focus:rounded-2xl transition-all duration-300 ease-in-out shadow-xl flex flex-col`}>
          <Breadcrumb />
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-white">Application Details</h2>
            <button onClick={() => setShowNotes(!showNotes)} className="text-white/60 hover:text-white transition">
              <StickyNote className="w-5 h-5" />
            </button>
          </div>

          <p className="text-white/70 mb-2">
            <span className="font-semibold text-blue-300">Applicant Email:</span> {sub.applicantEmail}
          </p>
          <p className="text-white/70 mb-4">
            <span className="font-semibold text-blue-300">Status:</span>{' '}
            <span
              className={`capitalize font-medium ${sub.status === 'accepted'
                  ? 'text-green-400'
                  : sub.status === 'denied'
                    ? 'text-red-400'
                    : sub.status === 'talented'
                      ? 'text-yellow-400'
                      : 'text-white/70'
                }`}
            >
              {sub.status}
            </span>
          </p>

          <div className="space-y-3 overflow-y-auto max-h-[500px] pr-2">
            {[...sub.answers].reverse().map((ans, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-bl-lg rounded-tr-lg hover:rounded-lg focus:rounded-lg transition-all duration-300 ease-in-out p-4">
                <p className="font-semibold text-blue-300">{ans.questionLabel}</p>
                <p className="text-white/80 mt-1">
                  {Array.isArray(ans.answer) ? ans.answer.join(', ') : ans.answer || '—'}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-auto flex flex-wrap gap-3 justify-between pt-6">
            <button
              onClick={() => handleStatusChange('accepted')}
              className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-semibold px-4 py-2 rounded-bl-lg rounded-tr-lg hover:rounded-lg focus:rounded-lg transition-all duration-300 ease-in-out "
            >
              <CheckCircle className="w-5 h-5" /> Accept
            </button>
            <button
              onClick={() => handleStatusChange('talented')}
              className="flex items-center gap-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-semibold px-4 py-2 rounded-bl-lg rounded-tr-lg hover:rounded-lg focus:rounded-lg transition-all duration-300 ease-in-out "
            >
              <Flag className="w-5 h-5" /> Talent Pool
            </button>
            <button
              onClick={() => setShowDenyModal(true)} // 🆕 open popup
              className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold px-4 py-2 rounded-bl-lg rounded-tr-lg hover:rounded-lg focus:rounded-lg transition-all duration-300 ease-in-out "
            >
              <XCircle className="w-5 h-5" /> Deny
            </button>
            <button
              onClick={handleDeleteApplication}
              className="flex items-center gap-2 bg-red-700/20 hover:bg-red-700/30 text-red-500 font-semibold px-4 py-2 rounded-bl-lg rounded-tr-lg hover:rounded-lg focus:rounded-lg transition-all duration-300 ease-in-out "
            >
              <Trash className="w-5 h-5" /> Delete
            </button>
          </div>
        </motion.div>

        {/* Right Panel (Notes) */}
        <AnimatePresence>
          {showNotes && (
            <motion.div
              key="notes"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.4 }}
              className="bg-[#283335] border border-white/20 backdrop-blur-md p-6 rounded-bl-2xl rounded-tr-2xl hover:rounded-2xl focus:rounded-2xl transition-all duration-300 ease-in-out shadow-xl h-full flex flex-col"
            >
              <h2 className="text-2xl font-semibold mb-4 text-white">Staff Notes</h2>

              <div className="flex gap-2 mb-4">
                <textarea
                  className="flex-1 px-3 py-2 rounded-bl-lg rounded-tr-lg hover:rounded-lg focus:rounded-lg transition-all duration-300 ease-in-out bg-[#283335] border border-white/20 text-white resize-none"
                  rows={3}
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <button
                  onClick={handleAddNote}
                  disabled={addingNote}
                  className="bg-blue-500/20 hover:bg-blue-500/30 px-4 py-2 rounded-bl-lg rounded-tr-lg hover:rounded-lg focus:rounded-lg transition-all duration-300 ease-in-out text-white"
                >
                  {addingNote ? 'Adding...' : 'Add'}
                </button>
              </div>

              {sub.notes?.length === 0 ? (
                <p className="text-white/60">No notes yet.</p>
              ) : (
                <ul className="space-y-2 flex-1 overflow-y-auto max-h-[500px]">
                  {[...sub.notes].reverse().map((note, idx) => {
                    const staff = note.staffMember;
                    const { bgColor, textColor } = getNoteStyles(note);

                    return (
                      <li key={idx} className={`p-3 rounded-bl-lg rounded-tr-lg hover:rounded-lg focus:rounded-lg transition-all duration-300 ease-in-out border ${bgColor} flex items-start gap-3`}>
                        {staff?.defaultAvatar ? (
                          <Image width={40} height={40} src={staff.defaultAvatar || '/default-avatar.png'} alt={staff.username} className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#283335]" />
                        )}
                        <div>
                          <span className="font-semibold text-blue-300">{staff?.username || 'Unknown'}</span>{' '}
                          {staff?.robloxUsername && <span className="text-white/60">(@{staff.robloxUsername})</span>}
                          {staff?.discordUsername && <span className="text-white/60 ml-1">({staff.discordUsername})</span>}
                          <div className={`text-sm mt-1 ${textColor}`}>{note.noteText}</div>
                          <div className="text-xs text-white/50">{new Date(note.createdAt).toLocaleString()}</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 🆕 Deny Reason Modal */}
      <AnimatePresence>
        {showDenyModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#283335] border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl max-w-md w-full text-white"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-xl font-semibold mb-4 text-center">Enter Deny Reason</h2>
              <textarea
                rows={4}
                className="w-full bg-[#283335] border border-white/20 rounded-md p-2 text-white resize-none"
                placeholder="Why is this application being denied?"
                value={denyReason}
                onChange={(e) => setDenyReason(e.target.value)}
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowDenyModal(false)}
                  className="bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeny}
                  disabled={submittingDeny}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
                >
                  {submittingDeny ? 'Submitting...' : 'Confirm Deny'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
