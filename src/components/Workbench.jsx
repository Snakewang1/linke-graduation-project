import { useState } from "react";
import { ChevronRight, ArrowLeft, FileText, CheckCircle, GitBranch } from "lucide-react";
import { APP_MENUS } from "../data/mock";
import { findMatchingWorkflow } from "../data/workflow-engine";

const SYSTEM_NAMES = { erp: "SAP ERP", finance: "金蝶云财务", oa: "泛微 OA", crm: "Salesforce CRM" };
const appIdToSystemName = (id) => SYSTEM_NAMES[id] || id;

export default function Workbench({ role, user, onStartWorkflow, onCreateTodo, workflows = [], todos = [] }) {
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

      {/* 各系统待处理统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl">
        {[
          { key: "erp", label: "ERP 系统", color: "bg-blue-500", textColor: "text-blue-600", bgColor: "bg-blue-50" },
          { key: "finance", label: "财务系统", color: "bg-orange-500", textColor: "text-orange-600", bgColor: "bg-orange-50" },
          { key: "oa", label: "OA 系统", color: "bg-green-500", textColor: "text-green-600", bgColor: "bg-green-50" },
          { key: "crm", label: "CRM 系统", color: "bg-purple-500", textColor: "text-purple-600", bgColor: "bg-purple-50" },
        ].map((sys) => {
          const count = todos.filter((t) => {
            if (t.status !== "pending" && t.status !== "processing") return false;
            const s = (t.system || t.source || "").toLowerCase();
            if (sys.key === "erp") return s.includes("erp");
            if (sys.key === "oa") return s.includes("oa");
            if (sys.key === "crm") return s.includes("crm");
            if (sys.key === "finance") return s.includes("财务") || s.includes("finance") || s.includes("金蝶");
            return false;
          }).length;
          return (
            <div key={sys.key} className={`${sys.bgColor} rounded-2xl p-4 flex items-center gap-3`}>
              <div className={`w-3 h-3 rounded-full ${sys.color}`} />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{sys.label}</p>
                <p className={`text-2xl font-black ${sys.textColor}`}>{count} <span className="text-xs font-normal text-slate-400">待处理</span></p>
              </div>
            </div>
          );
        })}
      </div>

      {workflows.filter((w) => w.status === "active").length > 0 && (
        <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm max-w-4xl">
          <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <GitBranch size={16} className="text-purple-500" />
            运行中的跨系统流程
          </h4>
          <div className="space-y-4">
            {workflows.filter((w) => w.status === "active").map((wf) => (
              <div key={wf.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-700">{wf.templateName}</span>
                  <span className="text-[10px] text-slate-400">{wf.createdAt}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${(wf.currentStep / wf.totalSteps) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-purple-600 min-w-[52px] text-right">
                    第 {wf.currentStep}/{wf.totalSteps} 步
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {Array.from({ length: wf.totalSteps }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-1.5 rounded-full ${
                        i < wf.currentStep
                          ? "bg-green-400"
                          : i === wf.currentStep
                          ? "bg-purple-500"
                          : "bg-slate-150"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
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
              onClick={() => {
                const hasSingleForm = m.children && m.children.length === 1 && m.children[0].type === "form";
                if (hasSingleForm) {
                  push({ type: "form", data: m.children[0], appId: id });
                } else {
                  push({ type: "module", data: m, color: data.color, appId: id });
                }
              }}
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

  const ModuleView = ({ data, appId }) => (
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
            onClick={() => push({ type: "form", data: f, appId })}
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

  const FormView = ({ data, appId }) => {
    const [formValues, setFormValues] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
      // 合并字段默认值（空值填 "—"）
      const filled = {};
      (data.formFields || []).forEach((f) => {
        filled[f] = (formValues[f] || "").trim() || "—";
      });

      // 检查是否命中跨系统工作流
      const workflow = findMatchingWorkflow(appId, data.id);

      if (workflow && onStartWorkflow) {
        onStartWorkflow(workflow.id, filled);
      } else if (onCreateTodo) {
        const isOA = appId === 'oa';
        const fieldSummary = Object.entries(filled).map(([k, v]) => `${k}: ${v}`).join(", ");
        onCreateTodo({
          source: appIdToSystemName(appId),
          title: isOA
            ? `[OA审批] ${data.title}ÿ1a${user.name}ÿ0c${fieldSummary}`
            : `[${data.title}] ${fieldSummary}`,
          type: isOA ? "OA审批" : "表单提交",
          priority: isOA ? "high" : "medium",
          system: appId,
          requestedBy: isOA ? user.id : null,
          requestedByName: isOA ? user.name : null,
          oaType: isOA ? data.id : null,
        });
      }

      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2500);
    };

    return (
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
                value={formValues[f] || ""}
                onChange={(e) => setFormValues({ ...formValues, [f]: e.target.value })}
              />
            </div>
          ))}
          <div className="p-6 bg-slate-50 md:bg-white md:border-t md:border-slate-50">
            <button
              onClick={handleSubmit}
              disabled={submitted}
              className={`w-full py-4 rounded-xl font-bold text-base shadow-lg transition-all ${
                submitted
                  ? "bg-green-500 text-white shadow-green-200"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200"
              }`}
            >
              {submitted ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle size={20} /> 提交成功，请查看待办列表
                </span>
              ) : (
                "提交申请"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ---- router ---- */
  if (current.type === "app")    return <AppView id={current.id} />;
  if (current.type === "module") return <ModuleView data={current.data} appId={current.appId} />;
  if (current.type === "form")   return <FormView data={current.data} appId={current.appId} />;
  return <RootView />;
}
