"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Task = {
  _id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  createdAt: string;
};

type TaskForm = {
  title: string;
  description: string;
  status: Task["status"];
  priority: Task["priority"];
};

const EMPTY_FORM: TaskForm = { title: "", description: "", status: "todo", priority: "medium" };

const COLUMNS: { key: Task["status"]; label: string; hex: string; bg: string }[] = [
  { key: "todo",        label: "To Do",       hex: "#eb5a46", bg: "bg-[#eb5a46]" },
  { key: "in-progress", label: "In Progress", hex: "#f2d600", bg: "bg-[#f2d600]" },
  { key: "done",        label: "Done",        hex: "#61bd4f", bg: "bg-[#61bd4f]" },
];

const PRIORITY_LABEL: Record<Task["priority"], { text: string; cls: string }> = {
  low:    { text: "Low",    cls: "trello-label-green"  },
  medium: { text: "Medium", cls: "trello-label-yellow" },
  high:   { text: "High",   cls: "trello-label-red"    },
};

const MOVE_NEXT: Record<Task["status"], Task["status"] | null> = {
  "todo": "in-progress", "in-progress": "done", "done": null,
};
const MOVE_PREV: Record<Task["status"], Task["status"] | null> = {
  "todo": null, "in-progress": "todo", "done": "in-progress",
};

/* ── SVG donut ring ── */
function CircleGraph({ count, total, hex }: { count: number; total: number; hex: string }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const pct = total === 0 ? 0 : count / total;
  const dash = pct * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="60" height="60" viewBox="0 0 60 60">
        {/* track */}
        <circle cx="30" cy="30" r={r} fill="none" stroke="#1c2c55" strokeWidth="6" />
        {/* progress */}
        <circle
          cx="30" cy="30" r={r}
          fill="none"
          stroke={hex}
          strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
        {/* centre text */}
        <text x="30" y="35" textAnchor="middle" fontSize="13" fontWeight="700" fill="#f3f5f8">
          {count}
        </text>
      </svg>
      <span className="text-[10px] font-semibold text-white uppercase tracking-wide">
        {total === 0 ? "0%" : `${Math.round(pct * 100)}%`}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks]       = useState<Task[]>([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState<TaskForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError]       = useState("");
  const [userName, setUserName] = useState("");

  const getToken    = () => localStorage.getItem("token");
  const authHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

  const fetchTasks = useCallback(async () => {
    const token = getToken();
    if (!token) { router.push("/"); return; }
    const res = await fetch("/api/tasks", { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) { router.push("/"); return; }
    setTasks(await res.json());
    setLoading(false);
  }, [router]);

  useEffect(() => {
    setUserName(localStorage.getItem("name") ?? "");
    fetchTasks();
  }, [fetchTasks]);

  const openCreate = (status: Task["status"] = "todo") => {
    setForm({ ...EMPTY_FORM, status });
    setEditingId(null);
    setError("");
    setShowModal(true);
  };

  const openEdit = (task: Task) => {
    setForm({ title: task.title, description: task.description, status: task.status, priority: task.priority });
    setEditingId(task._id);
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required"); return; }
    const res = await fetch(editingId ? `/api/tasks/${editingId}` : "/api/tasks", {
      method: editingId ? "PUT" : "POST",
      headers: authHeaders(),
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed to save"); return; }
    setShowModal(false);
    fetchTasks();
  };

  const handleMove = async (task: Task, newStatus: Task["status"]) => {
    await fetch(`/api/tasks/${task._id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ ...task, status: newStatus }),
    });
    fetchTasks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this card?")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE", headers: authHeaders() });
    fetchTasks();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    router.push("/");
  };

  const total    = tasks.length;
  const counts   = Object.fromEntries(COLUMNS.map((c) => [c.key, tasks.filter((t) => t.status === c.key).length])) as Record<Task["status"], number>;
  const initials = userName ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

  return (
    <div className="flex flex-col h-screen bg-[#0079bf] overflow-hidden">

      {/* ── Navbar ── */}
      <header className="trello-navbar shrink-0 flex items-center justify-between px-4 h-12">
        <div className="flex items-center gap-1.5 text-white font-bold text-xl tracking-tight select-none">
          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
            <rect x="2" y="2" width="9" height="14" rx="2"/>
            <rect x="13" y="2" width="9" height="9" rx="2"/>
          </svg>
          TaskFlow
        </div>

        <div className="flex items-center gap-2">
          {/* ── Dedicated Add Task button ── */}
          <button
            onClick={() => openCreate()}
            className="flex items-center gap-2 bg-white text-[#0079bf] hover:bg-[#e4f0f6] font-semibold text-sm px-4 py-1.5 rounded-full shadow transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
            </svg>
            Add Task
          </button>

          <div
            className="w-8 h-8 rounded-full bg-[#ffc107] flex items-center justify-center text-[#172b4d] text-xs font-bold cursor-pointer select-none"
            title={userName}
          >
            {initials}
          </div>

          <button onClick={handleLogout} className="trello-nav-btn px-3 py-1.5 text-sm font-medium">
            Log out
          </button>
        </div>
      </header>

      {/* ── Board title + Circle graphs ── */}
      <div className="shrink-0 px-6 pt-3 pb-2 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-white font-bold text-lg">My Board</h1>
          <span className="text-white/60 text-sm">·</span>
          <span className="text-white/80 text-sm">👋 {userName || "there"}</span>
          <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {total} total
          </span>
        </div>

        {/* Circle graphs — one per column */}
        <div className="flex items-center gap-6">
          {COLUMNS.map((col) => (
            <div key={col.key} className="flex flex-col items-center gap-1">
              <CircleGraph count={counts[col.key]} total={total} hex={col.hex} />
              <span className="text-white/80 text-[11px] font-medium">{col.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Kanban columns ── */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin w-8 h-8 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <p className="text-white/80 text-sm">Loading board...</p>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 h-full items-start">
            {COLUMNS.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.key);
              return (
                <div key={col.key} className="trello-column flex flex-col w-72 shrink-0 rounded-xl bg-[#ebecf0] max-h-full">

                  {/* Column header */}
                  <div className="flex items-center justify-between px-3 pt-3 pb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-sm ${col.bg}`} />
                      <h2 className="text-[#172b4d] font-semibold text-sm">{col.label}</h2>
                      <span className="text-[#5e6c84] text-xs font-medium bg-[#dfe1e6] px-1.5 py-0.5 rounded">
                        {colTasks.length}
                      </span>
                    </div>
                    {/* Per-column add button */}
                    <button
                      onClick={() => openCreate(col.key)}
                      className="flex items-center gap-1 text-xs font-semibold text-[#0079bf] bg-[#e4f0f6] hover:bg-[#cce0f5] px-2 py-1 rounded-full transition"
                      title={`Add to ${col.label}`}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
                      </svg>
                      Add
                    </button>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-0">
                    {colTasks.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-[#a5adba]">
                        <svg className="w-8 h-8 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                        </svg>
                        <p className="text-xs">No cards yet</p>
                      </div>
                    )}

                    {colTasks.map((task) => (
                      <div key={task._id} className="trello-card group bg-white rounded-lg shadow-sm p-3 cursor-pointer hover:shadow-md transition-shadow">
                        <div className="mb-2">
                          <span className={`trello-label ${PRIORITY_LABEL[task.priority].cls}`}>
                            {PRIORITY_LABEL[task.priority].text}
                          </span>
                        </div>

                        <p className="text-[#172b4d] text-sm font-medium leading-snug mb-1">
                          {task.title}
                        </p>

                        {task.description && (
                          <p className="text-[#5e6c84] text-xs leading-relaxed mb-2 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#f4f5f7]">
                          <span className="text-[#97a0af] text-xs">
                            {new Date(task.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {MOVE_PREV[task.status] && (
                              <button onClick={() => handleMove(task, MOVE_PREV[task.status]!)} className="trello-card-btn" title="Move left">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
                              </button>
                            )}
                            {MOVE_NEXT[task.status] && (
                              <button onClick={() => handleMove(task, MOVE_NEXT[task.status]!)} className="trello-card-btn" title="Move right">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
                              </button>
                            )}
                            <button onClick={() => openEdit(task)} className="trello-card-btn" title="Edit">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            </button>
                            <button onClick={() => handleDelete(task._id)} className="trello-card-btn trello-card-btn-danger" title="Delete">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-16 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#dfe1e6]">
              <h2 className="text-[#172b4d] font-semibold text-base">
                {editingId ? "Edit Card" : "Add Card"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded flex items-center justify-center text-[#5e6c84] hover:bg-[#dfe1e6] hover:text-[#172b4d] transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
              <div>
                <label className="trello-form-label">Title <span className="text-[#eb5a46]">*</span></label>
                <input
                  type="text"
                  placeholder="Enter a title for this card…"
                  className="trello-form-input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="trello-form-label">Description</label>
                <textarea
                  placeholder="Add a more detailed description…"
                  className="trello-form-input resize-none"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="trello-form-label">List</label>
                  <select
                    className="trello-form-input"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as Task["status"] })}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="trello-form-label">Priority Label</label>
                  <select
                    className="trello-form-input"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as Task["priority"] })}
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-[#eb5a46] text-sm bg-[#ffebe6] border border-[#ffbdad] rounded-lg px-3 py-2">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button type="submit" className="bg-[#0079bf] hover:bg-[#026aa7] text-white text-sm font-semibold px-4 py-2 rounded transition">
                  {editingId ? "Save" : "Add Card"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="text-[#5e6c84] hover:text-[#172b4d] text-sm font-medium px-4 py-2 rounded hover:bg-[#dfe1e6] transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
