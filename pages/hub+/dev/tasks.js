import { useEffect, useState } from 'react';
import axios from 'axios';

export default function HRDashboard() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ userId: '', taskName: '', taskDescription: '', dueDate: '', priority: 'low' });

  useEffect(() => {
    axios.get('/api/users?role=DeveloperGroup').then(res => setUsers(res.data));
  }, []);

  const assignTask = async (e) => {
    e.preventDefault();
    const task = {
      taskId: Date.now().toString(),
      taskName: form.taskName,
      taskDescription: form.taskDescription,
      taskStatus: 'pending',
      dueDate: form.dueDate,
      priority: form.priority,
    };
    await axios.post(`/api/developers/tasks/${form.userId}`, { task });
    alert('Task assigned!');
  };

  return (
    <form onSubmit={assignTask} className="space-y-4">
      <select value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })} className="bg-gray-800 p-2 rounded w-full text-white">
        <option value="">Select Developer</option>
        {users.map(u => (
          <option key={u._id} value={u._id}>{u.username} ({u.email})</option>
        ))}
      </select>
      {/* Task fields... */}
      <input placeholder="Task Name" value={form.taskName} onChange={e => setForm({ ...form, taskName: e.target.value })} className="w-full bg-gray-800 p-2 rounded text-white" />
      <textarea placeholder="Description" value={form.taskDescription} onChange={e => setForm({ ...form, taskDescription: e.target.value })} className="w-full bg-gray-800 p-2 rounded text-white" />
      <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="w-full bg-gray-800 p-2 rounded text-white" />
      <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full bg-gray-800 p-2 rounded text-white">
        <option>low</option>
        <option>medium</option>
        <option>high</option>
        <option>urgent</option>
      </select>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Assign Task</button>
    </form>
  );
}
