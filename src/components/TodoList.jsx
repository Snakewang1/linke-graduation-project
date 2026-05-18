import { useState, useRef } from "react";
import { Loader2, Sparkles, CheckCircle2, Clock, Circle, ClipboardList } from "lucide-react";
import { formatContent } from "../api/deepseek";
import { api } from "../api/client-firebase";

const STATUS_CONFIG = {
  pending:    { label: "待处理",   dot: "bg-orange-400",      bg: "bg-orange-50 text-orange-600",   icon: Circle },
  processing: { label: "处理中",   dot: "bg-blue-500 animate-pulse", bg: "bg-blue-50 text-blue-600", icon: Clock },
  done:       { label: "已完成",   dot: "bg-green-500",       bg: "bg-green-50 text-green-600",     icon: CheckCircle2 },
};

/* ---- Shared helpers ---- */

function Skeleton({ className = "" }) {
  return <div className={`rounded-xl skeleton-shimmer ${className}`} />;
}

function TodoCardSkeleton() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-10" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <div className="flex justify-end pt-2">
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="text-center py-16 md:py-20 px-6">
      <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon size={32} className="text-slate-400" />
      </div>
      <h3 className="text-base md:text-lg font-bold text-slate-700 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs mx-auto mb-4">{description}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default function TodoList({ todos, setTodos, role }) {
  const [filter, setFilter] = useState("pending");
  const [aiSummary, setAiSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (id, newStatus) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
    // Sync to server
    try {
      await api.patch(`/todos/${id}/status`, { status: newStatus });
    } catch { /* local state already updated */ }
  };

  const generateSummary = async () => {
    setLoading(true);
    try {
      const data = await api.post("/ai/summary", {});
      setAiSummary(data.summary);
    } catch {
      setAiSummary("AI 摘要生成失败，请检查后端服务。");
    }
    setLoading(false);
  };

  const filtered = todos.filter((t) => t.status === filter);

  return (
    <div className="animate-fade-in pb-24 space-y-6 md:space-y-8 max-w-5xl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800">协同待办</h2>
        <button
          onClick={generateSummary}
          disabled={loading}
          className="text-indigo-600 font-bold text-xs md:text-sm flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 transition-colors px-4 py-2 rounded-full shadow-sm"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          AI 智能摘要
        </button>
      </div>

      {aiSummary && (
        <div className="bg-indigo-50/70 p-5 md:p-6 rounded-2xl border border-indigo-100 text-indigo-900 text-sm md:text-base leading-relaxed animate-fade-in shadow-sm whitespace-pre-wrap">
          {formatContent(aiSummary)}
        </div>
      )}

      <div className="flex gap-2">
        {[
          ["pending",    "待处理"],
          ["processing", "处理中"],
          ["done",       "已完成"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
              filter === key
                ? "bg-slate-800 text-white shadow-lg"
                : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <TodoCardSkeleton key={i} />)
          : filtered.map((todo) => (
              <TodoCard key={todo.id} todo={todo} onStatusChange={handleStatusChange} />
            ))}
      </div>

      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title={
            filter === "done"
              ? "暂无已完成任务"
              : filter === "processing"
              ? "无处理中任务"
              : "没有待处理任务"
          }
          description={
            filter === "pending"
              ? "所有任务已处理完毕，去工作台看看其他功能吧"
              : "切换筛选标签查看其他状态的任务"
          }
        />
      )}
    </div>
  );
}

function TodoCard({ todo, onStatusChange }) {
  const status = STATUS_CONFIG[todo.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;
  const touchStartX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (diff < -60) {
      // Left swipe — advance status
      if (todo.status === "pending") {
        onStatusChange(todo.id, "processing");
      } else if (todo.status === "processing") {
        onStatusChange(todo.id, "done");
      }
    } else if (diff > 60 && todo.status === "processing") {
      // Right swipe — revert
      onStatusChange(todo.id, "pending");
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col gap-3 animate-fade-in select-none ${
        todo.status === "done" ? "opacity-70" : ""
      }`}
    >
      {/* Swipe hint for mobile */}
      {todo.status !== "done" && (
        <div className="text-[10px] text-slate-300 text-right -mb-1 md:hidden">
          ← 左滑处理 · 右滑回退 →
        </div>
      )}
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-2 flex-wrap">
          <span className="text-[10px] md:text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full font-bold uppercase">
            {todo.source}
          </span>
          <span
            className={`text-[10px] md:text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
              todo.priority === "high"
                ? "bg-red-50 text-red-500"
                : "bg-slate-50 text-slate-500"
            }`}
          >
            {todo.priority}
          </span>
        </div>
        <span className="text-[10px] md:text-xs text-slate-400 font-bold whitespace-nowrap ml-2">
          {todo.time}
        </span>
      </div>

      {/* Status badge */}
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold w-fit ${status.bg}`}>
        <StatusIcon size={12} className={status.dot} />
        {status.label}
      </div>

      <h4
        className={`text-base font-bold ${
          todo.status === "done" ? "line-through text-slate-400" : "text-slate-800"
        }`}
      >
        {todo.title}
      </h4>

      {/* Action buttons */}
      <div className="mt-auto pt-4 border-t border-slate-50 flex justify-end">
        {todo.status === "pending" && (
          <button
            onClick={() => onStatusChange(todo.id, "processing")}
            className="bg-slate-900 hover:bg-slate-800 transition-colors text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm"
          >
            开始处理
          </button>
        )}
        {todo.status === "processing" && (
          <button
            onClick={() => onStatusChange(todo.id, "done")}
            className="bg-green-600 hover:bg-green-700 transition-colors text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm shadow-green-200"
          >
            标记完成
          </button>
        )}
      </div>
    </div>
  );
}
