import { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard, CheckSquare, MessageSquare, Settings, Briefcase,
} from "lucide-react";
import Workbench from "./components/Workbench";
import Messages from "./components/Messages";
import TodoList from "./components/TodoList";
import Profile from "./components/Profile";
import Login from "./components/Login";
import ErrorBoundary from "./components/ErrorBoundary";
import { api } from "./api/client-firebase";
import { logout, onAuthChange } from "./firebase/auth";
import { createWorkflowInstance, advanceWorkflow, abortWorkflow } from "./data/workflow-engine";
import { MOCK_DB } from "./data/mock";

const NAV_ITEMS = [
  { id: "messages",  icon: MessageSquare,    label: "消息" },
  { id: "workbench", icon: LayoutDashboard,  label: "工作台" },
  { id: "todo",      icon: CheckSquare,      label: "待办" },
  { id: "profile",   icon: Settings,         label: "设置" },
];

export default function App() {
  const [tab, setTab] = useState("workbench");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState([]);
  const [messages, setMessages] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [authChecking, setAuthChecking] = useState(true);
  const isLocalLoginRef = useRef(false);

  const unreadCount = useMemo(
    () => messages.reduce((sum, m) => sum + (m.unread || 0), 0),
    [messages]
  );

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthChange(async (fbUser) => {
      setAuthChecking(false);
      if (fbUser) {
        isLocalLoginRef.current = false;
        setUser(fbUser);
        setLoading(true);
        try {
          const [todoData, wfData, msgData] = await Promise.all([
            api.get("/todos/all"),
            api.get("/workflows"),
            api.get("/messages"),
          ]);
          setTodos(todoData.todos || []);
          setWorkflows(wfData.workflows || []);
          setMessages(msgData.threads || []);
        } catch {}
        setLoading(false);
      } else if (!isLocalLoginRef.current) {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const handleLogin = (loggedInUser, isLocal = false) => {
    if (isLocal) isLocalLoginRef.current = true;
    setUser(loggedInUser);
    setLoading(true);
    // 从 Firestore 加载共享数据
    if (!isLocal) {
      Promise.all([api.get("/todos/all"), api.get("/workflows"), api.get("/messages")])
        .then(([todoData, wfData, msgData]) => {
          setTodos(todoData.todos || []);
          setWorkflows(wfData.workflows || []);
          setMessages(msgData.threads || []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setTodos([]);
      setMessages(MOCK_DB.messages);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    isLocalLoginRef.current = false;
    await logout();
    setUser(null);
  };

  const handlePushTodo = async (source, title) => {
    try {
      await api.post("/todos", { source, title, type: "业务推送", priority: "high" });
      const data = await api.get("/todos");
      setTodos(data.todos || []);
      const msgData = await api.get("/messages");
      setMessages(msgData.threads || []);
    } catch {
      const now = new Date().toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit" });
      const newTodo = {
        id: Date.now(), source, title, type: "业务推送", priority: "high", time: now, status: "pending",
      };
      setTodos((prev) => [newTodo, ...prev]);
    }
  };

  const handleStartWorkflow = (templateId, formData) => {
    const result = createWorkflowInstance(templateId, formData);
    if (!result || !result.firstTodo) return;
    setWorkflows((prev) => [...prev, result.instance]);
    setTodos((prev) => [result.firstTodo, ...prev]);
    api.post("/todos", result.firstTodo).catch(() => {});
    api.post("/workflows", result.instance).catch(() => {});
  };

  const handleCreateTodo = (todoData) => {
    const now = new Date().toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit" });
    const newTodo = {
      id: `todo-${Date.now()}`,
      source: todoData.source || "手动创建",
      title: todoData.title || "新任务",
      type: todoData.type || "任务",
      priority: todoData.priority || "medium",
      time: now,
      status: "pending",
      system: todoData.system || null,
    };
    setTodos((prev) => [newTodo, ...prev]);
    api.post("/todos", newTodo).catch(() => {});
  };

  const handleTodoComplete = (todoId) => {
    const wf = workflows.find((w) => w.stepTodos.includes(todoId));
    if (!wf) return;

    const result = advanceWorkflow(wf, todoId);
    if (!result) return;

    setWorkflows((prev) => prev.map((w) => w.id === wf.id ? result.instance : w));
    api.post("/workflows", result.instance).catch(() => {});

    if (result.nextTodo) {
      setTodos((prev) => [result.nextTodo, ...prev]);
      api.post("/todos", result.nextTodo).catch(() => {});
    }
    if (result.done) {
      api.post("/notify-admin", {
        content: `流程「${wf.templateName}」全部完成！${wf.totalSteps} 个系统已自动协同流转。`,
        tag: "流程完成",
      }).catch(() => {});
    }
  };

  const handleAbortWorkflow = (todoId) => {
    const wf = workflows.find((w) => w.stepTodos.includes(todoId));
    if (!wf) return;
    const aborted = abortWorkflow(wf);
    if (!aborted) return;
    setWorkflows((prev) => prev.map((w) => w.id === wf.id ? aborted : w));
    api.post("/workflows", aborted).catch(() => {});
    setTodos((prev) => prev.map((t) => t.id === todoId ? { ...t, status: "done" } : t));
    api.post("/notify-admin", {
      content: `流程「${wf.templateName}」已终止（已执行 ${wf.currentStep}/${wf.totalSteps} 步）。`,
      tag: "流程终止",
    }).catch(() => {});
  };

  /* ---- auth checking screen ---- */
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* ---- login screen ---- */
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  /* ---- loading screen ---- */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mb-8 animate-bounce shadow-xl shadow-blue-200">
          <Briefcase className="text-white w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">
          领客协同 LinkE
        </h1>
        <p className="text-slate-500 text-base">正在为您初始化数字化办公空间...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 md:bg-slate-100 text-slate-800 font-sans flex flex-col md:flex-row w-full relative overflow-hidden">
      {/* ======== Desktop sidebar ======== */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-slate-200 h-screen z-40 shadow-sm shrink-0">
        <div className="p-8 flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Briefcase className="text-white w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">LinkE</h1>
        </div>
        <div className="flex-1 px-5 space-y-3">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
                tab === item.id
                  ? "bg-blue-50 text-blue-600 font-bold shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 font-medium"
              }`}
            >
              <item.icon size={22} strokeWidth={tab === item.id ? 2.5 : 2} />
              <span className="text-base">{item.label}</span>
              {item.id === "messages" && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="p-6 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-xl">
              {user.avatar}
            </div>
            <div className="text-left">
              <p className="text-sm font-bold">{user.name}</p>
              <p className="text-xs text-slate-400">{user.dept}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ======== Main content ======== */}
      <main className="flex-1 h-screen overflow-y-auto scroll-smooth">
        <div className="w-full max-w-7xl mx-auto p-5 md:p-10 lg:p-12 pb-28 md:pb-12">
          <ErrorBoundary>
            {tab === "workbench" && (
              <Workbench
                role={user.role}
                user={user}
                onStartWorkflow={handleStartWorkflow}
                onCreateTodo={handleCreateTodo}
                workflows={workflows}
                todos={todos}
              />
            )}
            {tab === "messages" && (
              <Messages
                messages={messages}
                setMessages={setMessages}
                role={user.role}
                todos={todos}
                workflows={workflows}
                onDeleteThread={async (id) => {
                  try { await api.delete(`/messages/${id}`); } catch {}
                  setMessages((prev) => prev.filter((m) => m.id !== id));
                }}
              />
            )}
            {tab === "todo" && (
              <TodoList
                todos={todos}
                setTodos={setTodos}
                role={user.role}
                workflows={workflows}
                onTodoComplete={handleTodoComplete}
                onAbortWorkflow={handleAbortWorkflow}
              />
            )}
            {tab === "profile" && (
              <Profile
                user={user}
                onPushTodo={handlePushTodo}
                onLogout={handleLogout}
                workflows={workflows}
              />
            )}
          </ErrorBoundary>
        </div>
      </main>

      {/* ======== Mobile bottom nav ======== */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-xl border-t border-slate-200 px-6 py-3.5 flex justify-between items-center z-40 pb-safe">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`relative flex flex-col items-center gap-1.5 transition-all ${
              tab === item.id ? "text-blue-600 -translate-y-1" : "text-slate-400"
            }`}
          >
            <item.icon size={24} strokeWidth={tab === item.id ? 2.5 : 2} />
            {item.id === "messages" && unreadCount > 0 && (
              <span className="absolute -top-1 -right-3 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
