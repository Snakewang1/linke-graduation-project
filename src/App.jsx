import { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard, CheckSquare, MessageSquare, Settings, Briefcase,
} from "lucide-react";
import Workbench from "./components/Workbench";
import Messages from "./components/Messages";
import TodoList from "./components/TodoList";
import Profile from "./components/Profile";
import Login from "./components/Login";
import ErrorBoundary from "./components/ErrorBoundary";
import { api, clearToken, setToken } from "./api/client";

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
  const [authChecking, setAuthChecking] = useState(true);

  const unreadCount = useMemo(
    () => messages.reduce((sum, m) => sum + (m.unread || 0), 0),
    [messages]
  );

  // Check auth on mount
  useEffect(() => {
    const token = localStorage.getItem("linke_token");
    if (!token) {
      setAuthChecking(false);
      setLoading(false);
      return;
    }
    api.get("/auth/me")
      .then((data) => {
        setUser(data.user);
        setAuthChecking(false);
        // Fetch data
        return Promise.all([
          api.get("/todos"),
          api.get("/messages"),
        ]);
      })
      .then(([todoData, msgData]) => {
        if (todoData) setTodos(todoData.todos || []);
        if (msgData) setMessages(msgData.threads || []);
        setLoading(false);
      })
      .catch(() => {
        clearToken();
        setAuthChecking(false);
        setLoading(false);
      });
  }, []);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    setLoading(true);
    // Fetch initial data
    Promise.all([
      api.get("/todos"),
      api.get("/messages"),
    ])
      .then(([todoData, msgData]) => {
        setTodos(todoData.todos || []);
        setMessages(msgData.threads || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleLogout = () => {
    clearToken();
    setUser(null);
  };

  const handlePushTodo = async (source, title) => {
    try {
      await api.post("/todos", { source, title, type: "业务推送", priority: "high" });
      // Refresh todos
      const data = await api.get("/todos");
      setTodos(data.todos || []);
      // Refresh messages
      const msgData = await api.get("/messages");
      setMessages(msgData.threads || []);
    } catch {
      // Fallback: local update
      const now = new Date().toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit" });
      const newTodo = {
        id: Date.now(), source, title, type: "业务推送", priority: "high", time: now, status: "pending",
      };
      setTodos((prev) => [newTodo, ...prev]);
    }
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
            {tab === "workbench" && <Workbench role={user.role} user={user} />}
            {tab === "messages" && <Messages messages={messages} setMessages={setMessages} role={user.role} />}
            {tab === "todo" && <TodoList todos={todos} setTodos={setTodos} role={user.role} />}
            {tab === "profile" && (
              <Profile
                user={user}
                onPushTodo={handlePushTodo}
                onLogout={handleLogout}
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
