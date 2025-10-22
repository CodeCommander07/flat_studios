'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function ReturnedTasksPage() {
  const [returnedTasks, setReturnedTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/developers/returned')
      .then(res => setReturnedTasks(res.data.tasks || []))
      .catch(err => console.error('Failed to fetch returned tasks:', err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-8 text-white">Loading returned tasks...</p>;

  return (
    <div className="p-8 text-white max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold mb-4">Returned Developer Tasks</h1>

      {returnedTasks.length === 0 ? (
        <p className="text-white/60">No returned tasks found.</p>
      ) : (
        <ul className="space-y-4">
          {returnedTasks.map(task => (
            <li key={task.taskId} className="bg-white/10 border border-white/20 p-4 rounded-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-semibold text-lg">{task.taskName}</h2>
                  <p className="text-sm text-white/60">{task.taskDescription}</p>
                  <p className="text-xs mt-1">
                    Assigned to <strong>{task.userName}</strong> • Returned on {new Date(task.updatedAt).toLocaleDateString('en-UK')}
                  </p>
                </div>
                <a
                  href={`/dev/tasks/${task.taskId}`}
                  className="text-blue-400 hover:underline text-sm"
                >
                  Review →
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
