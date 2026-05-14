import { useState } from "react";
import { Briefcase, Mail, Lock, Loader2, Server, ChevronDown } from "lucide-react";
import { api, setToken, getServerUrl, setServerUrl } from "../api/client";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@linke.com");
  const [password, setPassword] = useState("admin123");
  const [server, setServer] = useState(getServerUrl());
  const [showServer, setShowServer] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleServerChange = (value) => {
    setServer(value);
    setServerUrl(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api.post("/auth/login", { email, password });
      setToken(data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message || "登录失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <Briefcase className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">领客协同 LinkE</h1>
          <p className="text-slate-500 text-sm mt-1">企业数字化协同平台</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              <Mail size={14} className="inline mr-1" />
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@linke.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              <Lock size={14} className="inline mr-1" />
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Server config toggle */}
          <button
            type="button"
            onClick={() => setShowServer(!showServer)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Server size={12} />
            服务器地址
            <ChevronDown size={12} className={showServer ? "rotate-180" : ""} />
          </button>

          {showServer && (
            <input
              type="text"
              value={server}
              onChange={(e) => handleServerChange(e.target.value)}
              placeholder="http://192.168.x.x:3001/api"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "登录中..." : "登 录"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          演示账号：admin@linke.com / admin123
          <br />
          当前服务器：{server === "/api" ? "Vite 代理（开发模式）" : server}
        </p>
      </div>
    </div>
  );
}
