'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Flag, StickyNote } from 'lucide-react';
import Image from 'next/image';

export default function SubmissionDetailPage() {
  const params = useParams();

  if (!params || !params.id) {
    return <p className="text-center text-white">Loading...</p>;
  }

  const { id } = params;
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem('User');
    if (data) setUserData(JSON.parse(data));
  }, []);

  const fetchSubmission = async () => {
    try {
      const res = await axios.get(`/api/careers/submissions/${id}`);
      const subData = res.data;

      // Fetch full staff data for notes
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

  const handleStatusChange = async (status) => {
    if (!userData) return;
    try {
      await axios.patch(`/api/careers/submissions/${id}/status`, { status });

      // Add system note for status change
      const systemNote = {
        staffMember: userData._id,
        noteText:
          status === 'accepted'
            ? `System | ✅ Application was accepted by ${userData.username || 'Unknown'}`
            : status === 'denied'
              ? `System | ❌ Application was denied by ${userData.username || 'Unknown'}`
              : `System | ⚠️ Application was added to the talent pool by ${userData.username || 'Unknown'}`,
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

  const getNoteStyles = (note) => {
    const text = note.noteText.toLowerCase();
    let bgColor = 'bg-white/10 border-white/20';
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
    <div className="p-6">
      <motion.div
        layout
        className={`max-w-10xl mx-auto w-full grid ${showNotes ? 'md:grid-cols-2' : 'grid-cols-1'} gap-6 transition-all duration-500`}
      >
        {/* Left Panel: Details */}
        <motion.div layout className={`bg-white/10 border border-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl h-full flex flex-col ${showNotes ? '' : 'mx-auto max-w-xl'}`}>
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
                  : sub.status === 'talnted'
                    ? 'text-yellow-400'
                    : 'text-white/70'
                }`}
            >
              {sub.status}
            </span>
          </p>

          <div className="space-y-3 overflow-y-auto pr-2">
            {sub.answers.map((ans, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="font-semibold text-blue-300">{ans.questionLabel}</p>
                <p className="text-white/80 mt-1">{ans.answer || '—'}</p>
              </div>
            ))}
          </div>

          <div className="mt-auto flex justify-between pt-6">
            <button onClick={() => handleStatusChange('accepted')} className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-semibold px-4 py-2 rounded-lg transition">
              <CheckCircle className="w-5 h-5" /> Accept
            </button>
            <button onClick={() => handleStatusChange('talented')} className="flex items-center gap-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-semibold px-4 py-2 rounded-lg transition">
              <Flag className="w-5 h-5" /> Talent Pool
            </button>
            <button onClick={() => handleStatusChange('denied')} className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold px-4 py-2 rounded-lg transition">
              <XCircle className="w-5 h-5" /> Deny
            </button>
          </div>
        </motion.div>
        {/* Right Panel: Notes */}
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
              <h2 className="text-2xl font-semibold mb-4 text-white">Staff Notes</h2>

              <div className="flex gap-2 mb-4">
                <textarea
                  className="flex-1 px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white resize-none"
                  rows={3}
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <button
                  onClick={handleAddNote}
                  disabled={addingNote}
                  className="bg-blue-500/20 hover:bg-blue-500/30 px-4 py-2 rounded-md text-white"
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
                      <li key={idx} className={`p-3 rounded-md border ${bgColor} flex items-start gap-3`}>
                        {staff?.defaultAvatar ? (
                          <Image width={40} height={40} src={staff.defaultAvatar || "./default-avatar.png"} alt={staff.username} className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white/10" />
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
    </div>
  );
}
