import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare, ArrowLeft, MoreHorizontal, Plus, Sparkles,
  Loader2, Send, File, Bot, Users, Inbox, X,
} from "lucide-react";
import { formatContent } from "../api/deepseek";
import { api } from "../api/client-firebase";

export default function Messages({ messages, setMessages, role, todos = [], workflows = [], onDeleteThread }) {
  const [activeChat, setActiveChat] = useState(null);
  // Local mutable copies so we never mutate the source data
  const [chatHistories, setChatHistories] = useState({});
  // Inline AI chat state
  const [aiExpanded, setAiExpanded] = useState(false);
  const [aiInputText, setAiInputText] = useState("");
  const [aiHistory, setAiHistory] = useState([]);
  const [aiIsThinking, setAiIsThinking] = useState(false);
  const [aiIsPolishing, setAiIsPolishing] = useState(false);
  const [aiHistoryLoaded, setAiHistoryLoaded] = useState(false);
  const aiScrollRef = useRef(null);

  const buildContext = useCallback(() => {
    const pending = todos.filter((t) => t.status === "pending" || t.status === "processing");
    const active = workflows.filter((w) => w.status === "active");
    const lines = [];
    if (pending.length > 0) {
      lines.push(`待办任务（${pending.length}项）：${pending.map((t) => `[${t.source || t.system || "系统"}] ${t.title}（${t.priority === "high" ? "紧急" : "普通"}）`).join("；")}`);
    }
    if (active.length > 0) {
      lines.push(`运行中流程（${active.length}个）：${active.map((w) => `${w.templateName}（第${w.currentStep}/${w.totalSteps}步）`).join("；")}`);
    }
    return lines.length > 0 ? `【当前任务背景】\n${lines.join("\n")}\n\n` : "";
  }, [todos, workflows]);

  const openChat = async (msg) => {
    setActiveChat(msg);
    if (!chatHistories[msg.id]) {
      try {
        const data = await api.get(`/messages/${msg.id}/history`);
        setChatHistories((prev) => ({
          ...prev,
          [msg.id]: (data.history || []).map((m) => ({ ...m })),
        }));
      } catch {
        setChatHistories((prev) => ({
          ...prev,
          [msg.id]: [],
        }));
      }
    }
    // Mark as read
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, unread: 0 } : m))
    );
  };

  const closeChat = () => setActiveChat(null);

  const updateHistory = useCallback((chatId, updater) => {
    setChatHistories((prev) => ({
      ...prev,
      [chatId]: updater(prev[chatId] || []),
    }));
  }, []);

  // Load AI history on expand
  useEffect(() => {
    if (!aiExpanded || aiHistoryLoaded) return;
    (async () => {
      try {
        const data = await api.get("/messages/11/history");
        setAiHistory((data.history || []).map((m) => ({ ...m })));
      } catch {
        const aiThread = messages.find((m) => m.id === 11);
        setAiHistory(aiThread?.history || []);
      }
      setAiHistoryLoaded(true);
    })();
  }, [aiExpanded, aiHistoryLoaded, messages]);

  // Auto-scroll AI chat
  useEffect(() => {
    if (aiScrollRef.current) aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
  }, [aiHistory]);

  const handleAiSend = useCallback(async () => {
    const text = aiInputText.trim();
    if (!text || aiIsThinking) return;
    const currentHistory = aiHistory;
    const userMsg = { id: Date.now(), sender: "self", type: "text", content: text, time: "刚刚" };
    setAiHistory((prev) => [...prev, userMsg]);
    setAiInputText("");
    const tempId = Date.now() + 1;
    setAiHistory((prev) => [...prev, { id: tempId, sender: "other", type: "text", content: "AI 正在处理查询...", time: "刚刚", isTemp: true }]);
    setAiIsThinking(true);
    try {
      const messageHistory = currentHistory
        .filter((m) => m.type === "text" && !m.isTemp)
        .map((m) => ({ role: m.sender === "self" ? "user" : "assistant", content: m.content }));
      const contextPrefix = buildContext();
      const data = await api.post("/ai/chat", { prompt: contextPrefix + text, history: messageHistory });
      setAiHistory((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        { id: Date.now() + 2, sender: "other", type: "text", content: data.reply, time: "刚刚" },
      ]);
    } catch {
      setAiHistory((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        { id: Date.now() + 2, sender: "other", type: "text", content: "AI 服务暂时不可用，请检查后端配置。", time: "刚刚" },
      ]);
    }
    setAiIsThinking(false);
  }, [aiInputText, aiIsThinking, aiHistory]);

  const handleAiPolish = useCallback(async () => {
    if (!aiInputText.trim()) return;
    setAiIsPolishing(true);
    try {
      const data = await api.post("/ai/chat", { prompt: `请专业润色以下内容，只返回润色后的文本，不要加任何解释：${aiInputText}`, history: [] });
      setAiInputText(data.reply);
    } catch { /* keep original */ }
    setAiIsPolishing(false);
  }, [aiInputText]);

  const handleAiKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAiSend();
    }
  };

  const handleAiExpand = (open) => {
    setAiExpanded(open);
    if (open) {
      setMessages((prev) => prev.map((m) => (m.id === 11 ? { ...m, unread: 0 } : m)));
    }
  };

  return (
    <>
      {/* ---------- List ---------- */}
      <div className="animate-fade-in pb-24 max-w-4xl">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 md:mb-8">消息中心</h2>

        <InlineAIChat
          role={role}
          history={aiHistory}
          inputText={aiInputText}
          isThinking={aiIsThinking}
          isPolishing={aiIsPolishing}
          expanded={aiExpanded}
          scrollRef={aiScrollRef}
          onToggle={handleAiExpand}
          onInputChange={setAiInputText}
          onSend={handleAiSend}
          onPolish={handleAiPolish}
          onKeyDown={handleAiKeyDown}
        />

        <div className="space-y-2 md:space-y-3">
          {messages.filter((m) => m.id !== 11).length === 0 && (
            <div className="text-center py-16 md:py-20 px-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Inbox size={32} className="text-slate-400" />
              </div>
              <h3 className="text-base md:text-lg font-bold text-slate-700 mb-2">暂无消息</h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                当有新的系统推送通知或同事消息时，会在这里显示
              </p>
            </div>
          )}
          {messages.filter((m) => m.id !== 11).map((msg) => (
            <div
              key={msg.id}
              onClick={() => openChat(msg)}
              className="flex items-center gap-4 p-4 md:p-5 bg-white md:bg-transparent md:hover:bg-white rounded-2xl transition-all cursor-pointer border-b border-slate-50 md:border-transparent md:shadow-sm md:hover:shadow-md group"
            >
              <div
                className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-white font-bold shrink-0 ${msg.color}`}
              >
                {msg.avatarIcon ? (
                  <msg.avatarIcon size={26} />
                ) : (
                  <span className="text-lg">{msg.avatarText}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h4 className="text-[15px] md:text-lg font-bold text-slate-800">
                    {msg.name}
                  </h4>
                  <span className="text-xs text-slate-400">{msg.time}</span>
                </div>
                <p className="text-xs md:text-sm text-slate-500 truncate mt-1">
                  {msg.content}
                </p>
              </div>
              {msg.unread > 0 && (
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-200" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteThread?.(msg.id);
                }}
                className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- Chat overlay ---------- */}
      {activeChat && (
        <ChatView
          chat={activeChat}
          history={chatHistories[activeChat.id] || []}
          role={role}
          onClose={closeChat}
          onUpdateHistory={(updater) => updateHistory(activeChat.id, updater)}
          buildContext={buildContext}
        />
      )}
    </>
  );
}

/* ================================================================
   InlineAIChat — collapsible AI panel at top of message list
   ================================================================ */
function InlineAIChat({ role, history, inputText, isThinking, isPolishing, expanded, scrollRef, onToggle, onInputChange, onSend, onPolish, onKeyDown }) {
  return (
    <div className="mb-4">
      {/* Collapsed bar */}
      {!expanded && (
        <button
          onClick={() => onToggle(true)}
          className="w-full flex items-center gap-3 px-4 py-3 md:px-5 md:py-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
            <Bot size={22} />
          </div>
          <span className="flex-1 text-left text-sm text-slate-400">向 AI 助手提问，获取即时帮助...</span>
          <Sparkles size={18} className="text-indigo-400 group-hover:text-indigo-600 transition-colors" />
        </button>
      )}

      {/* Expanded card */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? "max-h-[700px] opacity-100" : "max-h-0 opacity-0"}`}>
        {expanded && (
          <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <Bot size={18} />
                </div>
                <span className="font-bold text-sm text-slate-800">AI 助手</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-bold">AI</span>
              </div>
              <button
                onClick={() => onToggle(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ArrowLeft size={18} style={{ transform: "rotate(-90deg)" }} />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-5 max-h-[60vh] md:max-h-[450px]"
            >
              {history.length === 0 && (
                <div className="text-center py-8">
                  <Bot size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">向 AI 助手提问，获取即时帮助</p>
                </div>
              )}
              {history.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === "self" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm relative whitespace-pre-wrap leading-relaxed ${
                      m.sender === "self"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-slate-50 text-slate-700 rounded-bl-none border border-slate-100"
                    } ${m.isTemp ? "animate-pulse" : ""}`}
                  >
                    {m.type === "text" && formatContent(m.content)}
                    <span
                      className={`text-[10px] absolute -bottom-5 whitespace-nowrap ${
                        m.sender === "self" ? "right-0 text-slate-400" : "left-0 text-slate-400"
                      }`}
                    >
                      {m.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-2 shrink-0">
              <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2.5 flex items-center gap-2 transition-colors focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-200">
                <input
                  value={inputText}
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyDown={onKeyDown}
                  type="text"
                  placeholder="向 AI 助手提问..."
                  className="bg-transparent w-full outline-none text-sm text-slate-700"
                />
                {inputText && !isThinking && (
                  <button
                    onClick={onPolish}
                    disabled={isPolishing}
                    className="p-1 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
                  >
                    {isPolishing ? (
                      <Loader2 size={16} className="animate-spin text-indigo-500" />
                    ) : (
                      <Sparkles size={16} className="text-indigo-500" />
                    )}
                  </button>
                )}
              </div>
              <button
                onClick={onSend}
                disabled={isThinking}
                className="bg-indigo-600 hover:bg-indigo-700 transition-colors text-white p-2.5 rounded-xl disabled:opacity-50 shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   ChatView — full chat panel (modal on desktop, fullscreen on mobile)
   ================================================================ */
function ChatView({ chat, history, role, onClose, onUpdateHistory, buildContext }) {
  const [inputText, setInputText] = useState("");
  const [isPolishing, setIsPolishing] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;

    const userMsg = { id: Date.now(), sender: "self", type: "text", content: text, time: "刚刚" };
    onUpdateHistory((prev) => [...prev, userMsg]);
    setInputText("");

    // AI chat — multi-turn with history
    if (chat.id === 11) {
      const tempId = Date.now() + 1;
      onUpdateHistory((prev) => [
        ...prev,
        { id: tempId, sender: "other", type: "text", content: "AI 正在处理查询...", time: "刚刚", isTemp: true },
      ]);
      setIsAiThinking(true);

      try {
        const messageHistory = history
          .filter((m) => m.type === "text" && !m.isTemp)
          .map((m) => ({
            role: m.sender === "self" ? "user" : "assistant",
            content: m.content,
          }));

        const ctx = buildContext ? buildContext() : "";
        const data = await api.post("/ai/chat", { prompt: ctx + text, history: messageHistory });

        onUpdateHistory((prev) => [
          ...prev.filter((m) => m.id !== tempId),
          { id: Date.now() + 2, sender: "other", type: "text", content: data.reply, time: "刚刚" },
        ]);
      } catch {
        onUpdateHistory((prev) => [
          ...prev.filter((m) => m.id !== tempId),
          { id: Date.now() + 2, sender: "other", type: "text", content: "AI 服务暂时不可用，请检查后端配置。", time: "刚刚" },
        ]);
      }
      setIsAiThinking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePolish = async () => {
    if (!inputText.trim()) return;
    setIsPolishing(true);
    try {
      const data = await api.post("/ai/chat", { prompt: `请专业润色以下内容，只返回润色后的文本，不要加任何解释：${inputText}`, history: [] });
      setInputText(data.reply);
    } catch { /* keep original text */ }
    setIsPolishing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center md:bg-slate-900/60 md:backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col w-full h-full md:h-[85vh] md:max-h-[900px] md:w-[700px] bg-slate-50 md:bg-white md:rounded-3xl md:shadow-2xl md:border md:border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-white p-4 md:p-5 border-b flex items-center justify-between shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-3">
            <ArrowLeft
              className="cursor-pointer md:hover:bg-slate-100 p-1 rounded-full transition-colors"
              onClick={onClose}
              size={28}
            />
            <h3 className="font-bold text-lg text-slate-800">{chat.name}</h3>
          </div>
          <MoreHorizontal className="text-slate-400 cursor-pointer" />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6" ref={scrollRef}>
          {history.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender === "self" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 md:px-5 md:py-4 text-sm md:text-base shadow-sm relative whitespace-pre-wrap leading-relaxed ${
                  m.sender === "self"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white md:bg-slate-50 text-slate-700 rounded-bl-none border border-slate-100"
                } ${m.isTemp ? "animate-pulse" : ""}`}
              >
                {m.type === "text" && formatContent(m.content)}
                {m.type === "file" && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                      <File size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm truncate w-32">{m.content}</span>
                      <span className="text-[10px] opacity-60">{m.size}</span>
                    </div>
                  </div>
                )}
                <span
                  className={`text-[10px] absolute -bottom-5 whitespace-nowrap ${
                    m.sender === "self" ? "right-0 text-slate-400" : "left-0 text-slate-400"
                  }`}
                >
                  {m.time}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="bg-white p-4 md:p-5 border-t pb-safe md:pb-5 flex items-center gap-3 shrink-0">
          <Plus className="text-slate-400 cursor-pointer hidden md:block md:mx-2" size={24} />
          <div className="flex-1 bg-slate-100 md:bg-slate-50 md:border md:border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-2 transition-colors focus-within:bg-white focus-within:border-blue-400">
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              type="text"
              placeholder={chat.id === 11 ? "向 AI 助手提问..." : "输入消息..."}
              className="bg-transparent w-full outline-none text-sm md:text-base text-slate-700"
            />
            {inputText && !isAiThinking && (
              <button
                onClick={handlePolish}
                disabled={isPolishing}
                className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {isPolishing ? (
                  <Loader2 size={18} className="animate-spin text-indigo-500" />
                ) : (
                  <Sparkles size={20} className="text-indigo-500" />
                )}
              </button>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={isAiThinking}
            className="bg-blue-600 hover:bg-blue-700 transition-colors text-white p-3 rounded-full shadow-lg md:ml-2 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
