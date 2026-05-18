import { useState } from "react";
import { Briefcase, Mail, Lock, Loader2, Server, ChevronDown } from "lucide-react";
import { login } from "../firebase/auth";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@linke.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);
      onLogin(result.user);
    } catch (err) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found") {
        setError("邮箱或密码错误");
      } else if (err.code === "auth/too-many-requests") {
        setError("登录尝试过于频繁，请稍后再试");
      } else {
        setError(err.message || "登录失败，请重试");
      }
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
          <span className="inline-block mt-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
            Firebase 云原生版
          </span>
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
          由 Firebase Auth + Firestore 驱动
        </p>
      </div>
    </div>
  );
}
