import { useState, useEffect } from "react";
import { ChevronRight, Code, LogOut } from "lucide-react";
import { api } from "../api/client-firebase";
import ApiConsole from "./ApiConsole";

export default function Profile({ user, onPushTodo, onLogout }) {
  const [showApiConsole, setShowApiConsole] = useState(false);
  const [integrations, setIntegrations] = useState([]);

  useEffect(() => {
    api.get("/integrations")
      .then((data) => setIntegrations(data.integrations || []))
      .catch(() => {});
  }, []);

  if (showApiConsole && user.role === "admin") {
    return (
      <ApiConsole
        onBack={() => setShowApiConsole(false)}
        onPushTodo={onPushTodo}
        integrations={integrations}
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
            {user.dept} · {user.role === "admin" ? "系统管理员" : "普通员工"}
          </p>
        </div>
      </div>

      {/* Account info + Logout */}
      <div className="grid md:grid-cols-2 gap-8 md:gap-6">
        <div className="space-y-4">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            账户信息
          </h4>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div>
              <span className="text-xs text-slate-400">邮箱</span>
              <p className="text-sm font-bold text-slate-700">{user.email}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">角色</span>
              <p className="text-sm font-bold text-slate-700">
                {user.role === "admin" ? "系统管理员（全部权限）" : "普通员工（受限权限）"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            AI 模型配置
          </h4>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-sm font-bold text-slate-700">DeepSeek API</span>
            </div>
            <p className="text-xs text-slate-500">
              API Key 已配置在服务端，无需在浏览器中输入。所有 AI 请求通过后端代理，保证密钥安全。
            </p>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="space-y-4">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">操作</h4>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-5 py-3 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} />
          退出登录
        </button>
      </div>

      {/* OpenAPI entry (admin only) */}
      {user.role === "admin" && (
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
          {integrations.map((sys) => (
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
