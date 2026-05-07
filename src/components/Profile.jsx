import { useState, useEffect } from "react";
import { ChevronRight, Key, Code } from "lucide-react";
import { MOCK_DB } from "../data/mock";
import ApiConsole from "./ApiConsole";

export default function Profile({ role, setRole, user, onPushTodo, apiKey, setApiKey }) {
  const [showApiConsole, setShowApiConsole] = useState(false);

  useEffect(() => {
    if (role !== "admin") setShowApiConsole(false);
  }, [role]);

  if (showApiConsole && role === "admin") {
    return (
      <ApiConsole
        onBack={() => setShowApiConsole(false)}
        onPushTodo={onPushTodo}
      />
    );
  }

  return (
    <div className="animate-fade-in space-y-8 md:space-y-10 pb-24 max-w-4xl">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-800">设置中心</h2>

      {/* User info */}
      <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-100 flex items-center gap-5 shadow-sm">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-slate-100 flex items-center justify-center text-5xl shadow-inner border border-slate-50">
          {user.avatar}
        </div>
        <div>
          <h3 className="font-bold text-xl md:text-2xl text-slate-800">{user.name}</h3>
          <p className="text-sm text-slate-500 mt-1">
            {user.dept} · {role === "admin" ? "系统管理员" : "普通员工"}
          </p>
        </div>
      </div>

      {/* Role switch + API config */}
      <div className="grid md:grid-cols-2 gap-8 md:gap-6">
        <div className="space-y-4">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            角色切换演示
          </h4>
          <div className="bg-white rounded-2xl p-1.5 flex border border-slate-200 shadow-sm">
            <button
              onClick={() => setRole("admin")}
              className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all ${
                role === "admin"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              管理者视角
            </button>
            <button
              onClick={() => setRole("staff")}
              className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all ${
                role === "staff"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              员工视角
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            AI 模型接入配置
          </h4>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Key size={16} className="text-blue-500" />
              <label className="text-sm font-bold text-slate-700">DeepSeek API Key</label>
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-500 transition-colors shadow-inner"
              placeholder="输入 sk- 开头的 API Key"
            />
          </div>
        </div>
      </div>

      {/* OpenAPI entry (admin only) */}
      {role === "admin" && (
        <div
          onClick={() => setShowApiConsole(true)}
          className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-5 md:p-6 rounded-3xl flex items-center justify-between shadow-xl cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-3 rounded-xl">
              <Code className="text-blue-400" size={24} />
            </div>
            <div>
              <span className="font-bold text-lg block group-hover:text-blue-200 transition-colors">
                OpenAPI 控制台
              </span>
              <span className="text-xs text-slate-400 mt-1 block">
                配置并测试第三方系统集成联调
              </span>
            </div>
          </div>
          <ChevronRight size={24} className="text-slate-500 group-hover:text-white transition-colors" />
        </div>
      )}

      {/* Integration status */}
      <div className="space-y-4">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
          系统连接状态
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {MOCK_DB.integrations.map((sys) => (
            <div
              key={sys.id}
              className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full shadow-sm ${
                    sys.status === "connected"
                      ? "bg-green-500 shadow-green-200"
                      : "bg-red-500 shadow-red-200"
                  }`}
                />
                <span className="text-base font-bold text-slate-700">{sys.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
