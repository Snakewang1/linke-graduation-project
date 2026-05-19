import { useState } from "react";
import { Briefcase, Mail, Lock, Loader2 } from "lucide-react";
import { login } from "../firebase/auth";
import { MOCK_DB } from "../data/mock";

const DEMO_ACCOUNTS = {
  "admin@linke.com":   MOCK_DB.users.admin,
  "finance@linke.com": MOCK_DB.users.finance,
  "erp@linke.com":     MOCK_DB.users.erp,
  "staff@linke.com":   MOCK_DB.users.staff,
};

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
      onLogin(result.user, false);
    } catch {
      // Firebase 失败时，回退到本地演示账号
      const demoUser = DEMO_ACCOUNTS[email];
      if (demoUser) {
        onLogin(demoUser, true); // true = 本地登录
      } else {
        setError("邮箱或密码错误");
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

        {/* Quick login cards */}
        <p className="text-xs font-bold text-slate-400 text-center mt-6 mb-3">快速切换演示账号</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "张总", sub: "管理员", avatar: "👨‍💼", email: "admin@linke.com", pw: "admin123", color: "bg-blue-500" },
            { label: "王财务", sub: "财务专员", avatar: "💳", email: "finance@linke.com", pw: "finance123", color: "bg-orange-500" },
            { label: "陈仓管", sub: "ERP专员", avatar: "📦", email: "erp@linke.com", pw: "erp123", color: "bg-blue-600" },
            { label: "李专员", sub: "普通员工", avatar: "👩‍💻", email: "staff@linke.com", pw: "staff123", color: "bg-green-600" },
          ].map((u) => (
            <button
              key={u.email}
              type="button"
              onClick={() => { setEmail(u.email); setPassword(u.pw); setError(""); }}
              className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${
                email === u.email
                  ? "border-blue-300 bg-blue-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="text-lg">{u.avatar}</span>
              <div>
                <p className="text-xs font-bold text-slate-700">{u.label}</p>
                <p className="text-[10px] text-slate-400">{u.sub}</p>
              </div>
              {email === u.email && (
                <span className="ml-auto w-2 h-2 rounded-full bg-blue-500" />
              )}
            </button>
          ))}
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-3">
          选择账号后点击"登录" · 由 Firebase Auth 驱动
        </p>
      </div>
    </div>
  );
}
