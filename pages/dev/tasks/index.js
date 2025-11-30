'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Plus,
  User,
  Calendar,
  Loader2,
  Archive,
  Search,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AllTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [developer, setDeveloper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState('number-asc');
  const [showSort, setShowSort] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTask, setNewTask] = useState({
    taskName: '',
    taskDescription: '',
    dueDate: '',
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const stored = localStorage.getItem('User');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const fetchTasks = async () => {
    if (!user?._id) return;

    setLoading(true);
    try {
      const res = await axios.get(`/api/developers/tasks/${user._id}`);
      setTasks(res.data.tasks || []);
      setDeveloper(res.data.user || null);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) fetchTasks();
  }, [user]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.taskName || !newTask.taskDescription || !newTask.dueDate) {
      alert('Please fill all fields.');
      return;
    }

    try {
      setCreating(true);

      await axios.post('/api/developers/tasks/set', {
        ...newTask,
        user,
      });

      setShowModal(false);
      setNewTask({ taskName: '', taskDescription: '', dueDate: '' });
      fetchTasks();
    } catch {
      alert("Failed to create task.");
    } finally {
      setCreating(false);
    }
  };

  const archiveTask = async (taskId) => {
    try {
      await axios.post(`/api/developers/tasks/archive/${taskId}`);
      fetchTasks();
    } catch {
      alert("Failed to archive task.");
    }
  };


const filteredTasks = tasks
  // 1️⃣ Hide archived tasks
  .filter(t => !t.archived)

  // 2️⃣ Filter by selected status
  .filter(t => {
    if (statusFilter === "all") return true;
    return t.taskStatus === statusFilter;
  })

  // 3️⃣ Search filter (name + description)
  .filter(t => {
    const q = searchQuery.toLowerCase();
    return (
      t.taskName.toLowerCase().includes(q) ||
      t.taskDescription.toLowerCase().includes(q)
    );
  })

  // 4️⃣ Sorting (NEW — real sorting logic)
  .sort((a, b) => {
    switch (sortType) {
      case "due-asc":
        return new Date(a.dueDate) - new Date(b.dueDate);

      case "due-desc":
        return new Date(b.dueDate) - new Date(a.dueDate);

      case "name-asc":
        return a.taskName.localeCompare(b.taskName);

      case "name-desc":
        return b.taskName.localeCompare(a.taskName);

      default:
        return 0;
    }
  });
  const STATUS_COLORS = {
    implemented: 'bg-purple-600',
    reviewed: 'bg-blue-600',
    completed: 'bg-green-600',
    developing: 'bg-yellow-600',
    "not-started": 'bg-red-600',
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-52 text-white">
        <Loader2 className="animate-spin w-6 h-6 mr-2" /> Loading tasks…
      </div>
    );

  return (
    <div className="p-10 text-white max-w-7xl mx-auto space-y-10">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10 bg-[#283335] p-6 rounded-2xl border border-white/10 shadow-xl">

        {/* LEFT: Title + Subtitle */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Developer Tasks</h1>
          <p className="text-white/50 mt-1">Manage, filter & create developer tasks</p>
        </div>

        {/* RIGHT SIDE CONTROLS */}
        <div className="flex flex-col lg:flex-row items-center gap-4 w-full lg:w-auto">

          {/* SEARCH BAR */}
          <div className="relative flex items-center bg-[#283335] border border-white/20 rounded-xl px-3 py-2 w-full lg:w-64">
            <Search className="w-5 h-5 text-white/40 mr-2" />
            <input
              type="text"
              placeholder="Search tasks…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none w-full text-white"
            />
          </div>

          {/* STATUS FILTER (styled like dropdown in your example) */}
          <div className="relative dropdown">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSort(!showSort);
              }}
              className="bg-[#283335] border border-white/20 text-white px-3 py-2 rounded-lg flex items-center gap-2"
            >
              {(() => {
                const styles = {
                  all: { label: "All Statuses", color: "#6B7280" },
                  "not-started": { label: "Not-Started", color: "#DC2626" },
                  developing: { label: "Developing", color: "#D97706" },
                  completed: { label: "Completed", color: "#16A34A" },
                  reviewed: { label: "Reviewed", color: "#2563EB" },
                  implemented: { label: "Implemented", color: "#7C3AED" },
                };

                const s = styles[statusFilter];

                return (
                  <div
                    className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: `${s.color}20`,
                      border: `1px solid ${s.color}`,
                    }}
                  >
                    {s.label}
                  </div>
                );
              })()}
            </button>

            <AnimatePresence>
              {showSort && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="absolute right-0 z-50 mt-2 bg-[#283335] border border-white/20 rounded-lg p-2 w-56"
                >
                  {[
                    { value: "all", label: "All Statuses", color: "#6B7280" },
                    { value: "not-started", label: "Not-Started", color: "#DC2626" },
                    { value: "developing", label: "Developing", color: "#D97706" },
                    { value: "reviewed", label: "Reviewed", color: "#2563EB" },
                    { value: "implemented", label: "Implemented", color: "#7C3AED" },
                    { value: "completed", label: "Completed", color: "#16A34A" },
                  ].map((opt) => (
                    <div
                      key={opt.value}
                      className="cursor-pointer mb-1"
                      onClick={() => {
                        setStatusFilter(opt.value);
                        setShowSort(false);
                      }}
                    >
                      <div
                        className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm font-medium w-full"
                        style={{
                          backgroundColor: `${opt.color}20`,
                          border: `1px solid ${opt.color}`,
                        }}
                      >
                        {opt.label}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* NEW TASK BUTTON */}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl shadow-md shadow-blue-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>

        </div>
      </div>

      {/* TASK LIST */}
      {filteredTasks.length === 0 ? (
        <p className="text-white/50 text-center italic">No tasks found under these filters.</p>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          {filteredTasks.map((task) => (
            <motion.div
              key={task.taskId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-[#283335] border border-white/10 shadow-xl hover:bg-[#283335]/90 hover:border-white/20 transition backdrop-blur group"
            >
              {/* TOP ROW */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <a href={`/dev/tasks/${task.taskId}`}>
                    <h2 className="text-xl font-bold group-hover:underline">
                      {task.taskName}
                    </h2>
                  </a>
                  <p className="text-white/50 mt-1">{task.taskDescription}</p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium capitalize shadow ${STATUS_COLORS[task.taskStatus] || 'bg-red-600'
                    }`}
                >
                  {task.taskStatus}
                </span>
              </div>

              {/* BOTTOM ROW */}
              <div className="flex justify-between items-center text-white/70 text-sm mt-6">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {task.user?.username || "Assigned to you"}
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(task.dueDate).toLocaleDateString('en-UK')}
                </div>
              </div>

              {/* ARCHIVE BUTTON */}
              <button
                onClick={() => archiveTask(task.taskId)}
                className="mt-6 flex items-center gap-2 text-white/50 hover:text-white transition"
              >
                <Archive className="w-4 h-4" />
                Archive
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#1f252a] p-8 rounded-2xl border border-white/10 w-full max-w-lg shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-3xl font-bold mb-6">Create New Task</h2>

              <form onSubmit={handleCreateTask} className="space-y-6">

                <div>
                  <label className="block mb-1 text-sm text-white/50">
                    Task Name
                  </label>
                  <input
                    type="text"
                    value={newTask.taskName}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, taskName: e.target.value }))
                    }
                    className="w-full p-3 rounded-xl bg-[#283335] border border-white/20 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm text-white/50">
                    Description
                  </label>
                  <textarea
                    value={newTask.taskDescription}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, taskDescription: e.target.value }))
                    }
                    className="w-full p-3 rounded-xl bg-[#283335] border border-white/20 outline-none min-h-[120px]"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm text-white/50">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, dueDate: e.target.value }))
                    }
                    className="w-full p-3 rounded-xl bg-[#283335] border border-white/20 outline-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 transition"
                  >
                    {creating ? 'Creating…' : 'Create Task'}
                  </button>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



    </div>
  );
}
