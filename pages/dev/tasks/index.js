'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AllTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [developer, setDeveloper] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('User');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (!user?._id) return;

    const fetchTasks = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/developers/tasks/${user._id}`);
        // Ensure the response has .tasks
        setTasks(res.data.tasks || []);
        setDeveloper(res.data.user || null);
      } catch (err) {
        console.error('Failed to fetch tasks:', err.message);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

  if (loading) return <p className="text-white p-8">Loading tasks...</p>;

  return (
    <div className="p-8 text-white max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">All Developer Tasks</h1>
      {tasks.length === 0 ? (
        <p>No tasks assigned yet.</p>
      ) : (
        <div className="space-y-4">
          {tasks.map(task => (
            <a key={task.taskId} href={`/dev/tasks/${task.taskId}`} className="block">
              <div className="bg-white/10 border border-white/20 p-4 rounded-xl hover:bg-white/20 transition">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h2 className="text-xl font-semibold">{task.taskName}</h2>
                    <p className="text-sm text-white/60">{task.taskDescription}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    task.taskStatus === 'returned' ? 'bg-red-600' :
                    task.taskStatus === 'completed' ? 'bg-green-600' :
                    task.taskStatus === 'pending' ? 'bg-yellow-600' :
                    task.taskStatus === 'in-progress' ? 'bg-blue-600' :
                    'bg-orange-600'
                  }`}>
                    {task.taskStatus}
                  </span>
                </div>
                <div className="text-sm text-white/70">
                  Assigned to: {developer}<br />
                  Due: {new Date(task.dueDate).toLocaleDateString('en-UK')}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}