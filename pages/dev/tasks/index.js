'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AllTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [developer, setDeveloper] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Modal state (added)
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTask, setNewTask] = useState({
    taskName: '',
    taskDescription: '',
    dueDate: '',
  });

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

  // 🔹 Create task (no priority field exposed)
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.taskName || !newTask.taskDescription || !newTask.dueDate) {
      alert('Please fill all fields.');
      return;
    }

    try {
      setCreating(true);
      // ✅ Correct backend URL (SET route)
      await axios.post('/api/developers/tasks/set', {
        taskName: newTask.taskName,
        taskDescription: newTask.taskDescription,
        user: user,
        dueDate: newTask.dueDate,
      });

      setShowModal(false);
      setNewTask({ taskName: '', taskDescription: '', dueDate: '' });

      // refresh tasks the same way your page already does
      const res = await axios.get(`/api/developers/tasks/${user._id}`);
      setTasks(res.data.tasks || []);
      setDeveloper(res.data.user || null);
    } catch (err) {
      console.error('Failed to create task:', err.message);
      alert('Failed to create task.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <p className="text-white p-8">Loading tasks...</p>;
  
  return (
    <div className="p-8 text-white max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">All Developer Tasks</h1>

        {/* 🔹 New Task button (opens modal) */}
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
          >
          New Task
        </button>
      </div>

      {tasks.length === 0 ? (
        <p>No tasks assigned yet.</p>
      ) : (
        <div className="space-y-4">
          {tasks.map(task => (
            <a key={task.taskId} href={`/dev/tasks/${task.taskId}`} className="block">
              <div className="bg-[#283335] border border-white/20 p-4 rounded-xl hover:bg-[#283335]/80 transition">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h2 className="text-xl font-semibold">{task.taskName}</h2>
                    <p className="text-sm text-white/60">{task.taskDescription}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${task.taskStatus === 'implemented' ? 'bg-blue-600' :
                      task.taskStatus === 'completed' ? 'bg-green-600' :
                        task.taskStatus === 'pending' ? 'bg-yellow-600' :
                          task.taskStatus === 'in-progress' ? 'bg-orange-600' :
                            'bg-red-600'
                    }`}>
                    {task.taskStatus}
                  </span>
                </div>
                <div className="text-sm text-white/70">
                  Assigned to: {task.user?.username || "Me" }<br />
                  Due: {new Date(task.dueDate).toLocaleDateString('en-UK')}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* 🔹 Modal (added) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur flex items-center justify-center p-4 z-50">
          <div className="bg-[#1f252a] p-6 rounded-2xl w-full max-w-lg border border-white/10 relative">
            <h2 className="text-2xl font-bold mb-4">Create New Task</h2>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm text-white/70">Task Name</label>
                <input
                  type="text"
                  value={newTask.taskName}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, taskName: e.target.value }))}
                  className="w-full p-2 rounded bg-white/10 border border-white/20 outline-none"
                  placeholder="Enter task name"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-sm text-white/70">Description</label>
                <textarea
                  value={newTask.taskDescription}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, taskDescription: e.target.value }))}
                  className="w-full p-2 rounded bg-white/10 border border-white/20 outline-none min-h-[100px]"
                  placeholder="Enter description"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-sm text-white/70">Due Date</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full p-2 rounded bg-white/10 border border-white/20 outline-none"
                  required
                />
              </div>

              {/* No priority field on purpose */}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
