'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

const tagColors = {
  Important: 'bg-red-600 text-white',
  'General Support': 'bg-blue-600 text-white',
  Accounts: 'bg-green-600 text-white',
  Billing: 'bg-yellow-600 text-black',
  Other: 'bg-gray-600 text-white',
  Test: 'bg-purple-600 text-white',
  'Feature Request': 'bg-orange-600 text-white',
};

function EmailStatusControls({ messageId, onStatusChange }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (!messageId) return;
    setLoading(true);

    axios
      .get('/api/contact/emails/status', { params: { messageId } })
      .then((res) => {
        setStatus(res.data.status || {
          deleted: false,
          flagged: false,
          flags: [],
          tags: [],
        });
      })
      .catch((err) => {
        console.error('Failed to fetch status:', err);
        setStatus(null);
      })
      .finally(() => setLoading(false));
  }, [messageId]);

  if (!messageId || !status) return null;

  const updateStatus = async (newFields) => {
    try {
      setLoading(true);
      const updated = { ...status, ...newFields };
      await axios.post('/api/contact/emails/edit', {
        messageId,
        ...updated,
      });
      setStatus(updated);
      onStatusChange?.();
    } catch (err) {
      console.error('Update failed:', err);
      alert('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = () => updateStatus({ flagged: !status.flagged });
  const toggleDelete = () => updateStatus({ deleted: !status.deleted });

  const addTag = async () => {
    const tag = newTag.trim();
    if (!tag) return;
    if ((status.tags || []).includes(tag)) return alert('Tag already exists');
    const updatedTags = [...(status.tags || []), tag];
    await updateStatus({ tags: updatedTags });
    setNewTag('');
  };

  const removeTag = async (tagToRemove) => {
    const updatedTags = (status.tags || []).filter((tag) => tag !== tagToRemove);
    await updateStatus({ tags: updatedTags });
  };

  return (
    <div className={`p-4 rounded`}>
      {loading && <p className="text-white/70">Updating...</p>}

      <div className="mb-3 flex gap-2">
        <button onClick={toggleFlag} className="px-2 py-1 border rounded hover:bg-yellow-600">
          {status.flagged ? 'Unflag' : 'Flag'}
        </button>
        <button onClick={toggleDelete} className="px-2 py-1 border rounded hover:bg-red-600">
          {status.deleted ? 'Undelete' : 'Delete'}
        </button>
      </div>

<div className="mt-2 text-white/90">
  <strong>Tags:</strong>{' '}
  {(status?.tags || []).map((tag) => {
    const style = tagColors[tag] || 'bg-gray-600 text-white';
    return (
      <span
        key={tag}
        onClick={() => removeTag(tag)}
        className={`inline-block px-2 py-0.5 rounded mr-2 cursor-pointer hover:opacity-80 ${style}`}
        title="Click to remove tag"
      >
        {tag} &times;
      </span>
    );
  })}
</div>

      <div className="mt-2">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Add tag"
          className="px-2 py-1 rounded mr-2 text-white bg-gray-700 border border-gray-600 focus:outline-none"
        />
        <button
          onClick={addTag}
          className="px-3 py-1 bg-green-600 rounded text-white hover:bg-green-700"
        >
          Add Tag
        </button>
      </div>
    </div>
  );
}

export default EmailStatusControls;
