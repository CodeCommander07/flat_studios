'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AllTasksPage() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    axios.get('/api/developers/tasks/').then(res => setTasks(res.data.tasks));
  }, []);

  return (
    <div className="p-8 text-white max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">All Developer Tasks</h1>
      {tasks.length === 0 ? (
        <p>No tasks assigned yet.</p>
      ) : (
        <div className="space-y-4">
          {tasks.map(task => (
                <a href={`/dev/tasks/${task.taskId}`} className="">
            <div key={task.taskId} className="bg-white/10 border border-white/20 p-4 rounded-xl">
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
                Assigned to: <span className="font-semibold">{task.userName}</span> ({task.userEmail})<br />
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </div>
            </div>
              </a>
          ))}
        </div>
      )}
    </div>
  );
}
