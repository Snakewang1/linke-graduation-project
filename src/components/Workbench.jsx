import { useState } from "react";
import { ChevronRight, ArrowLeft, TrendingUp, FileText } from "lucide-react";
import { APP_MENUS } from "../data/mock";

export default function Workbench({ role, user }) {
  const [navStack, setNavStack] = useState([{ type: "root" }]);
  const push = (v) => setNavStack([...navStack, v]);
  const pop = () => setNavStack(navStack.slice(0, -1));
  const current = navStack[navStack.length - 1];

  /* ---- sub-views ---- */

  const RootView = () => (
    <div className="animate-fade-in space-y-8 md:space-y-10 pb-24">
      <div className="flex justify-between items-center bg-white md:bg-transparent p-4 md:p-0 rounded-2xl md:rounded-none shadow-sm md:shadow-none">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">下午好，{user.name}</h2>
          <p className="text-sm text-slate-500 mt-1">{user.dept} · 连接业务流程</p>
        </div>
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-200 flex items-center justify-center text-2xl shadow-inner border-2 border-white">
          {user.avatar}
        </div>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 md:gap-6 bg-white md:bg-transparent p-4 md:p-0 rounded-2xl md:rounded-none shadow-sm md:shadow-none">
        {Object.entries(APP_MENUS).map(([id, app]) => (
          <div
            key={id}
            onClick={() => push({ type: "app", id })}
            className="flex flex-col items-center gap-2 cursor-pointer group"
          >
            <div
              className={`${app.color} w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 group-active:scale-90 group-hover:-translate-y-1 transition-all text-white`}
            >
              <app.icon size={26} />
            </div>
            <span className="text-xs md:text-sm text-slate-600 font-bold mt-1">{app.title}</span>
          </div>
        ))}
      </div>

      {role === "admin" && (
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-blue-200 relative overflow-hidden max-w-4xl">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <p className="text-white/80 text-xs md:text-sm font-bold uppercase tracking-wider mb-2">
                本月实时销售额
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold">¥</span>
                <h3 className="text-4xl md:text-5xl font-black tracking-tight">1,230,500</h3>
              </div>
            </div>
            <div className="bg-white/20 p-3 md:p-4 rounded-2xl backdrop-blur-sm">
              <TrendingUp size={28} className="text-white" />
            </div>
          </div>
          <div className="mt-8 relative z-10">
            <div className="flex justify-between text-xs md:text-sm text-white/90 mb-2 font-medium">
              <span>月度目标完成率 82%</span>
              <span>目标: ¥ 1,500,000</span>
            </div>
            <div className="h-2 md:h-3 bg-indigo-900/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-300 to-white rounded-full relative"
                style={{ width: "82%" }}
              >
                <div className="absolute top-0 right-0 bottom-0 w-6 bg-white blur-[4px] animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const AppView = ({ id }) => {
    const data = APP_MENUS[id];
    return (
      <div className="animate-fade-in pb-24 max-w-4xl">
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <button
            onClick={pop}
            className="p-2 -ml-2 md:bg-white hover:bg-slate-200 rounded-full md:shadow-sm transition-all"
          >
            <ArrowLeft size={22} />
          </button>
          <h2 className="text-2xl font-bold">{data.title}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.items.map((m) => (
            <div
              key={m.id}
              onClick={() => push({ type: "module", data: m, color: data.color })}
              className="bg-white p-5 rounded-2xl flex items-center justify-between border border-slate-100 hover:border-blue-200 transition-all cursor-pointer shadow-sm hover:shadow-md group"
            >
              <div className="flex items-center gap-5">
                <div
                  className={`w-12 h-12 rounded-xl ${data.color} bg-opacity-10 flex items-center justify-center ${data.color.replace("bg-", "text-")} group-hover:scale-110 transition-transform`}
                >
                  <m.icon size={24} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800">{m.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{m.desc}</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ModuleView = ({ data }) => (
    <div className="animate-fade-in pb-24 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={pop}
          className="p-2 -ml-2 md:bg-white hover:bg-slate-200 rounded-full md:shadow-sm"
        >
          <ArrowLeft size={22} />
        </button>
        <h2 className="text-2xl font-bold">{data.title}</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {data.children.map((f) => (
          <div
            key={f.id}
            onClick={() => push({ type: "form", data: f })}
            className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 flex flex-col items-center gap-4 hover:bg-slate-50 hover:border-blue-200 transition-colors shadow-sm cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-blue-600 border border-slate-100 shadow-inner">
              <FileText size={24} />
            </div>
            <span className="text-sm font-bold text-slate-700">{f.title}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const FormView = ({ data }) => (
    <div className="animate-fade-in pb-24 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={pop}
          className="p-2 -ml-2 md:bg-white hover:bg-slate-200 rounded-full md:shadow-sm"
        >
          <ArrowLeft size={22} />
        </button>
        <h2 className="text-2xl font-bold">{data.title}</h2>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-md">
        {data.formFields?.map((f, i) => (
          <div
            key={i}
            className="p-5 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
          >
            <label className="text-xs font-bold text-slate-400 block mb-2 uppercase">{f}</label>
            <input
              type="text"
              className="w-full text-base outline-none bg-transparent"
              placeholder={`请输入${f}...`}
            />
          </div>
        ))}
        <div className="p-6 bg-slate-50 md:bg-white md:border-t md:border-slate-50">
          <button className="w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-blue-200">
            提交申请
          </button>
        </div>
      </div>
    </div>
  );

  /* ---- router ---- */
  if (current.type === "app")    return <AppView id={current.id} />;
  if (current.type === "module") return <ModuleView data={current.data} />;
  if (current.type === "form")   return <FormView data={current.data} />;
  return <RootView />;
}
