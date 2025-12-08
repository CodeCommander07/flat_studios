"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import AuthWrapper from "@/components/AuthWrapper";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

export default function AdminDevTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Header filters
  const [developerFilter, setDeveloperFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dueFilter, setDueFilter] = useState("all");

  // Header dropdown open states
  const [devDropdownOpen, setDevDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const [dueDropdownOpen, setDueDropdownOpen] = useState(false);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [editForm, setEditForm] = useState({
    taskName: "",
    taskDescription: "",
    user: null,
    dueDate: "",
    priority: "",
  });

  const [editSearch, setEditSearch] = useState("");
  const [editResults, setEditResults] = useState([]);
  const [editLoading, setEditLoading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const DEFAULT_AVATAR = "/default-avatar.png";

  const formatDateInput = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // ---- Pills ----
  const StatusPill = ({ status }) => {
    const s = status || "unknown";
    let classes = "border-red-500/70 text-red-300 bg-red-500/10";

    switch (s) {
      case "not-started":
        classes = "border-red-500/70 text-red-300 bg-red-500/10";
        break;
      case "developing":
        classes = "border-amber-500/70 text-amber-300 bg-amber-500/10";
        break;
      case "completed":
        classes = "border-emerald-500/70 text-emerald-300 bg-emerald-500/10";
        break;
      case "reviewed":
        classes = "border-sky-500/70 text-sky-300 bg-sky-500/10";
        break;
      case "implemented":
        classes = "border-purple-500/70 text-purple-300 bg-purple-500/10";
        break;
    }

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${classes}`}
      >
        {s}
      </span>
    );
  };

  const PriorityPill = ({ priority }) => {
    const p = priority || "unknown";
    let classes = "border-white/30 text-white/70 bg-white/5";

    switch (p) {
      case "low":
        classes = "border-emerald-500/70 text-emerald-300 bg-emerald-500/10";
        break;
      case "medium":
        classes = "border-yellow-500/70 text-yellow-300 bg-yellow-500/10";
        break;
      case "high":
        classes = "border-orange-500/70 text-orange-300 bg-orange-500/10";
        break;
      case "urgent":
        classes = "border-red-500/70 text-red-300 bg-red-500/10";
        break;
    }

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${classes}`}
      >
        {p}
      </span>
    );
  };

  // Build unique developer list from tasks
  const developers = tasks
    .map((t) => ({
      id: t.userEmail || t.userName || "unknown",
      username: t.userName || "Unknown",
      avatar: t.user?.defaultAvatar || DEFAULT_AVATAR,
      roblox: t.user?.robloxUsername,
      discord: t.user?.discordUsername,
    }))
    .filter(
      (v, i, arr) => v.username && arr.findIndex((x) => x.id === v.id) === i
    );

  // LOAD TASKS
  const fetchTasks = async () => {
    try {
      const res = await axios.get("/api/developers/admin/all-tasks");
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error("Failed to fetch tasks:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // EDIT DEV SEARCH (inside modal)
  useEffect(() => {
    if (!editSearch || editSearch.length < 2) {
      setEditResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      setEditLoading(true);
      try {
        const res = await axios.get(
          `/api/developers/search?q=${encodeURIComponent(editSearch)}`
        );
        setEditResults(res.data || []);
      } catch (err) {
        console.error("Developer search failed:", err.message);
      } finally {
        setEditLoading(false);
      }
    }, 350);

    return () => clearTimeout(delay);
  }, [editSearch]);

  const handleSelectEditUser = (dev) => {
    setEditForm((prev) => ({
      ...prev,
      user: dev,
    }));
    setEditSearch(dev.username);
    setEditResults([]);
  };

  // EDIT MODAL OPEN
  const openEditModal = async (task) => {
    setEditingTask(task);

    let fullUser = null;

    try {
      const res = await axios.get(
        `/api/developers/search?q=${encodeURIComponent(task.userName || "")}`
      );
      const list = res.data || [];
      fullUser =
        list.find((u) => u.username === task.userName) || list[0] || null;
    } catch (err) {
      console.error("Failed to load dev for edit:", err);
    }

    setEditForm({
      taskName: task.taskName || "",
      taskDescription: task.taskDescription || "",
      user: fullUser,
      dueDate: formatDateInput(task.dueDate),
      priority: task.priority || "medium",
    });

    setEditSearch(fullUser?.username || task.userName || "");
    setShowEditModal(true);
  };

  // SUBMIT EDIT
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingTask) return;

    const userId = editForm.user?._id || editingTask.userId;

    try {
      setSavingEdit(true);

      await axios.post("/api/developers/admin/edit", {
        taskId: editingTask.taskId,
        userId,
        updates: {
          taskName: editForm.taskName,
          taskDescription: editForm.taskDescription,
          user: editForm.user,
          dueDate: editForm.dueDate,
          priority: editForm.priority,
        },
      });

      setShowEditModal(false);
      setEditingTask(null);
      await fetchTasks();
    } catch (err) {
      console.error("Failed to update task:", err);
      alert("Failed to update task.");
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteTask = async (id) => {
    if (!confirm("Delete this task?")) return;

    try {
      await axios.delete(`/api/developers/tasks/delete/${id}`);
      setTasks((prev) => prev.filter((t) => t.taskId !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed.");
    }
  };

  // ----- DUE DATE FILTER HELPER -----
  const matchesDueFilter = (task) => {
    if (dueFilter === "all") return true;

    if (!task.dueDate) {
      return dueFilter === "no-date";
    }

    const due = new Date(task.dueDate);
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );

    const diffMs = due.getTime() - todayStart.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    switch (dueFilter) {
      case "overdue":
        return due < todayStart;
      case "today":
        return due >= todayStart && due < todayEnd;
      case "next7":
        return diffDays >= 0 && diffDays <= 7;
      case "future":
        return diffDays > 7;
      case "no-date":
        return !task.dueDate;
      default:
        return true;
    }
  };

  // FILTER LOGIC
  const filteredTasks = tasks
    .filter((t) =>
      developerFilter === "all" ? true : t.userName === developerFilter
    )
    .filter((t) =>
      statusFilter === "all" ? true : t.taskStatus === statusFilter
    )
    .filter((t) =>
      priorityFilter === "all" ? true : t.priority === priorityFilter
    )
    .filter((t) => matchesDueFilter(t))
    .sort(
      (a, b) =>
        new Date(a.dueDate || 0).getTime() -
        new Date(b.dueDate || 0).getTime()
    );

  // ----------------------- RENDER -----------------------

  return (
    <AuthWrapper requiredRole="admin">
      <main className="text-white min-h-screen w-full flex flex-col p-4">
        <div className="flex-1 overflow-auto">
          {loading && (
            <div className="text-center text-white/60 mt-8">
              Loading tasks…
            </div>
          )}

          {!loading && (
            <table className="w-full text-left mt-2 border-collapse">
              <thead className="bg-[#283335] text-white/70 text-xs sm:text-sm uppercase tracking-wide">
                <tr>
                  {/* Developer header with dropdown filter */}
                  <th className="py-3 px-4 align-middle">
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => {
                          setDevDropdownOpen((v) => !v);
                          setStatusDropdownOpen(false);
                          setPriorityDropdownOpen(false);
                          setDueDropdownOpen(false);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1f252a] border border-white/30 text-[11px] sm:text-xs font-medium"
                      >
                        <span className="truncate max-w-[110px] sm:max-w-40">
                          {developerFilter === "all"
                            ? "All Developers"
                            : developerFilter}
                        </span>
                        <ChevronDown className="w-3 h-3 opacity-70" />
                      </button>

                      <AnimatePresence>
                        {devDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute mt-1 w-56 sm:w-64 bg-black/95 border border-white/20 rounded-lg max-h-64 overflow-y-auto z-50 shadow-xl"
                          >
                            <div
                              onClick={() => {
                                setDeveloperFilter("all");
                                setDevDropdownOpen(false);
                              }}
                              className="p-3 hover:bg-[#283335] cursor-pointer transition text-xs sm:text-sm text-white/80 border-b border-white/10"
                            >
                              All Developers
                            </div>

                            {developers.map((dev) => (
                              <div
                                key={dev.id}
                                onClick={() => {
                                  setDeveloperFilter(dev.username);
                                  setDevDropdownOpen(false);
                                }}
                                className="flex items-center gap-3 p-3 hover:bg-[#283335] cursor-pointer transition"
                              >
                                <Image
                                  src={dev.avatar}
                                  width={28}
                                  height={28}
                                  className="w-7 h-7 rounded-full"
                                  alt=""
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium text-xs sm:text-sm">
                                    {dev.username}
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    {dev.roblox || "—"} /{" "}
                                    {dev.discord || "—"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </th>

                  {/* Task Name header (no filter) */}
                  <th className="py-3 px-4 align-middle text-[11px] sm:text-xs">
                    Task Name
                  </th>

                  {/* Status header with dropdown filter */}
                  <th className="py-3 px-4 align-middle">
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => {
                          setStatusDropdownOpen((v) => !v);
                          setDevDropdownOpen(false);
                          setPriorityDropdownOpen(false);
                          setDueDropdownOpen(false);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1f252a] border border-white/30 text-[11px] sm:text-xs font-medium"
                      >
                        <span>
                          {statusFilter === "all"
                            ? "All Statuses"
                            : statusFilter}
                        </span>
                        <ChevronDown className="w-3 h-3 opacity-70" />
                      </button>

                      <AnimatePresence>
                        {statusDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute mt-1 w-44 bg-black/95 border border-white/20 rounded-lg max-h-64 overflow-y-auto z-50 shadow-xl"
                          >
                            {[
                              { value: "all", label: "All Statuses" },
                              { value: "not-started", label: "Not Started" },
                              { value: "developing", label: "Developing" },
                              { value: "completed", label: "Completed" },
                              { value: "reviewed", label: "Reviewed" },
                              { value: "implemented", label: "Implemented" },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setStatusFilter(opt.value);
                                  setStatusDropdownOpen(false);
                                }}
                                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-[#283335] text-[11px] sm:text-xs"
                              >
                                {opt.value !== "all" && (
                                  <StatusPill status={opt.value} />
                                )}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </th>

                  {/* Priority header with dropdown filter */}
                  <th className="py-3 px-4 align-middle">
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => {
                          setPriorityDropdownOpen((v) => !v);
                          setDevDropdownOpen(false);
                          setStatusDropdownOpen(false);
                          setDueDropdownOpen(false);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1f252a] border border-white/30 text-[11px] sm:text-xs font-medium"
                      >
                        <span>
                          {priorityFilter === "all"
                            ? "All Priorities"
                            : priorityFilter}
                        </span>
                        <ChevronDown className="w-3 h-3 opacity-70" />
                      </button>

                      <AnimatePresence>
                        {priorityDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute mt-1 w-44 bg-black/95 border border-white/20 rounded-lg max-h-64 overflow-y-auto z-50 shadow-xl"
                          >
                            {[
                              { value: "all", label: "All Priorities" },
                              { value: "low", label: "Low" },
                              { value: "medium", label: "Medium" },
                              { value: "high", label: "High" },
                              { value: "urgent", label: "Urgent" },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setPriorityFilter(opt.value);
                                  setPriorityDropdownOpen(false);
                                }}
                                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-[#283335] text-[11px] sm:text-xs"
                              >
                                {opt.value !== "all" && (
                                  <PriorityPill priority={opt.value} />
                                )}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </th>

                  {/* Due Date header with dropdown filter */}
                  <th className="py-3 px-4 align-middle">
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => {
                          setDueDropdownOpen((v) => !v);
                          setDevDropdownOpen(false);
                          setStatusDropdownOpen(false);
                          setPriorityDropdownOpen(false);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1f252a] border border-white/30 text-[11px] sm:text-xs font-medium"
                      >
                        <span>
                          {dueFilter === "all"
                            ? "All Dates"
                            : {
                                overdue: "Overdue",
                                today: "Due Today",
                                next7: "Next 7 Days",
                                future: "Future",
                                "no-date": "No Due Date",
                              }[dueFilter] || "Dates"}
                        </span>
                        <ChevronDown className="w-3 h-3 opacity-70" />
                      </button>

                      <AnimatePresence>
                        {dueDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute mt-1 w-48 bg-black/95 border border-white/20 rounded-lg max-h-64 overflow-y-auto z-50 shadow-xl"
                          >
                            {[
                              { value: "all", label: "All Dates" },
                              { value: "overdue", label: "Overdue" },
                              { value: "today", label: "Due Today" },
                              { value: "next7", label: "Next 7 Days" },
                              { value: "future", label: "Future" },
                              { value: "no-date", label: "No Due Date" },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setDueFilter(opt.value);
                                  setDueDropdownOpen(false);
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-[#283335] text-[11px] sm:text-xs"
                              >
                                {opt.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </th>

                  {/* Actions header (static) */}
                  <th className="py-3 px-4 align-middle text-[11px] sm:text-xs">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTasks.map((task, i) => (
                  <tr
                    key={task.taskId}
                    className={`${
                      i % 2 === 0 ? "bg-[#232C2E]" : "bg-[#2C3A3D]"
                    } border-b border-white/10 hover:bg-[#324246] transition`}
                  >
                    {/* Developer cell */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Image
                          src={task.user?.defaultAvatar || DEFAULT_AVATAR}
                          width={30}
                          height={30}
                          className="rounded-full"
                          alt=""
                        />
                        <span className="text-sm">{task.userName}</span>
                      </div>
                    </td>

                    {/* Task Name */}
                    <td className="py-3 px-4 text-sm">{task.taskName}</td>

                    {/* Status pill */}
                    <td className="py-3 px-4">
                      <StatusPill status={task.taskStatus} />
                    </td>

                    {/* Priority pill */}
                    <td className="py-3 px-4">
                      <PriorityPill priority={task.priority} />
                    </td>

                    {/* Due Date */}
                    <td className="py-3 px-4 text-sm">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString("en-UK")
                        : "—"}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4">
                      <div className="flex gap-2 justify-start">
                        <a
                          href={`/dev/tasks/${task.taskId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 rounded-full text-xs font-medium border border-blue-500 text-blue-300 hover:bg-blue-500/20"
                        >
                          View
                        </a>

                        <button
                          onClick={() => openEditModal(task)}
                          className="px-3 py-1 rounded-full text-xs font-medium border border-amber-500 text-amber-300 hover:bg-amber-500/20"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => deleteTask(task.taskId)}
                          className="px-3 py-1 rounded-full text-xs font-medium border border-red-500 text-red-300 hover:bg-red-500/20"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!filteredTasks.length && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-6 px-4 text-center text-white/60 text-sm"
                    >
                      No tasks match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* EDIT MODAL */}
        <AnimatePresence>
          {showEditModal && (
            <motion.div
              className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-[#283335] p-6 rounded-xl w-full max-w-2xl border border-white/20"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
              >
                <h2 className="text-2xl font-bold mb-4">
                  Edit Developer Task
                </h2>

                {/* Pills Preview */}
                <div className="flex items-center gap-3 mb-4">
                  {editingTask && (
                    <>
                      <StatusPill status={editingTask.taskStatus} />
                      <PriorityPill priority={editForm.priority} />
                    </>
                  )}
                </div>

                <form onSubmit={handleEditSubmit} className="space-y-4">
                  {/* Task Name */}
                  <div>
                    <label className="block mb-1 text-sm font-medium">
                      Task Name
                    </label>
                    <input
                      className="w-full p-2 rounded bg-white/10 border border-white/20 text-sm"
                      value={editForm.taskName}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          taskName: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block mb-1 text-sm font-medium">
                      Description
                    </label>
                    <textarea
                      className="w-full p-2 rounded bg-white/10 border border-white/20 text-sm min-h-[90px]"
                      value={editForm.taskDescription}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          taskDescription: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  {/* Developer + Priority + Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Assign */}
                    <div className="relative">
                      <label className="block mb-1 text-sm font-medium">
                        Assign To
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 rounded bg-white/10 border border-white/20 text-sm"
                        value={editSearch}
                        onChange={(e) => setEditSearch(e.target.value)}
                        placeholder="Search developer..."
                      />

                      {editLoading && (
                        <div className="absolute bg-black/70 p-2 rounded-b-lg w-full text-center text-xs text-gray-300">
                          Searching…
                        </div>
                      )}

                      {editResults.length > 0 && (
                        <ul className="absolute bg-black/90 border border-white/20 w-full mt-1 rounded-lg max-h-64 overflow-y-auto z-50">
                          {editResults.map((dev) => (
                            <li
                              key={dev._id}
                              onClick={() => handleSelectEditUser(dev)}
                              className="flex items-center gap-3 p-2 hover:bg-[#283335] cursor-pointer transition"
                            >
                              <Image
                                src={dev.defaultAvatar || DEFAULT_AVATAR}
                                width={32}
                                height={32}
                                className="rounded-full"
                                alt=""
                              />
                              <div>
                                <div className="font-semibold text-sm">
                                  {dev.username}
                                </div>
                                <div className="text-[11px] text-gray-400">
                                  {dev.robloxUsername || "—"} /{" "}
                                  {dev.discordUsername || "—"}
                                </div>
                                <div className="text-[10px] text-gray-500">
                                  {dev._id}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block mb-1 text-sm font-medium">
                        Priority
                      </label>
                      <select
                        className="w-full p-2 rounded bg-white/10 border border-white/20 text-sm"
                        value={editForm.priority}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            priority: e.target.value,
                          }))
                        }
                      >
                        <option className="bg-[#283335]" value="">
                          Select Priority
                        </option>
                        <option className="bg-[#283335]" value="low">
                          Low
                        </option>
                        <option className="bg-[#283335]" value="medium">
                          Medium
                        </option>
                        <option className="bg-[#283335]" value="high">
                          High
                        </option>
                        <option className="bg-[#283335]" value="urgent">
                          Urgent
                        </option>
                      </select>
                    </div>

                    {/* Due Date */}
                    <div>
                      <label className="block mb-1 text-sm font-medium">
                        Due Date
                      </label>
                      <input
                        type="date"
                        className="w-full p-2 rounded bg-white/10 border border-white/20 text-sm"
                        value={editForm.dueDate}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            dueDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingTask(null);
                        setEditResults([]);
                      }}
                      className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-800 text-sm font-semibold"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={savingEdit}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold disabled:opacity-60"
                    >
                      {savingEdit ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </AuthWrapper>
  );
}
