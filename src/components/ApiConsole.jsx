import { useState } from "react";
import { ArrowLeft, Shield, Copy, Server, Terminal, Activity, GitBranch } from "lucide-react";
import { api } from "../api/client-firebase";

export default function ApiConsole({ onBack, onPushTodo, integrations, workflows = [] }) {
  const [apiInputs, setApiInputs] = useState({
    erp: "核心仓物料 SKU-001 低于安全库存",
    finance: "差旅报销单 #BX202403 金额 ¥3,200",
    oa: "研发部李工提交年假申请（3天）",
    crm: "华东区新客户明辉科技合同待评审 ¥280,000",
  });
  const [apiEndpoints, setApiEndpoints] = useState({
    erp: "POST /v1/erp/webhook",
    finance: "POST /v1/finance/webhook",
    oa: "POST /v1/oa/approval/webhook",
    crm: "POST /v1/crm/opportunity/webhook",
  });
  const [webhookLogs, setWebhookLogs] = useState([]);

  const addLog = (source, endpoint, payload, status) => {
    setWebhookLogs((prev) => [
      {
        id: Date.now(),
        source,
        endpoint,
        payload: payload.slice(0, 50) + (payload.length > 50 ? "..." : ""),
        status,
        timestamp: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
      },
      ...prev.slice(0, 49),
    ]);
  };

  const simulatePush = async (integrationId, source, title, endpoint) => {
    if (!title.trim() || !endpoint.trim()) return alert("推送内容或接口路径不能为空！");
    try {
      await api.post(`/integrations/${integrationId}/push`, { payload: title });
      addLog(source, endpoint, title, "success");
      if (onPushTodo) onPushTodo(source, title);
      alert(
        `请求成功 (200 OK)！\n[${source}] 成功调用了接口：\n${endpoint}\n\n推送内容：\n"${title}"\n\n请前往"协同待办"查看最新任务流转。`
      );
    } catch {
      addLog(source, endpoint, title, "error");
      alert("推送失败，请检查后端服务是否运行。");
    }
  };

  return (
    <div className="animate-fade-in pb-24 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <button
          onClick={onBack}
          className="p-2 -ml-2 md:bg-white hover:bg-slate-200 rounded-full md:shadow-sm"
        >
          <ArrowLeft size={22} />
        </button>
        <h2 className="text-2xl font-bold">OpenAPI 控制台</h2>
      </div>

      {/* Credentials card */}
      <div className="bg-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-lg">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Shield size={16} /> 鉴权凭证
        </h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2 bg-slate-800 p-4 rounded-2xl">
            <span className="text-xs text-slate-400">AppID</span>
            <span className="font-mono text-sm md:text-base">linke_pk_992x...</span>
          </div>
          <div className="flex flex-col gap-2 bg-slate-800 p-4 rounded-2xl">
            <span className="text-xs text-slate-400">AppSecret</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm md:text-base">****************</span>
              <Copy size={16} className="text-slate-400 hover:text-white cursor-pointer" />
            </div>
          </div>
        </div>
      </div>

      {/* Integration cards */}
      <div className="space-y-4 pt-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Server size={14} /> 异构系统 Webhook 推送模拟
        </h4>
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <PushCard
            color="bg-blue-600"
            label="ERP 库存集成"
            endpoint={apiEndpoints.erp}
            onEndpointChange={(v) => setApiEndpoints({ ...apiEndpoints, erp: v })}
            payload={apiInputs.erp}
            onPayloadChange={(v) => setApiInputs({ ...apiInputs, erp: v })}
            onSend={() => simulatePush("erp", "SAP ERP", apiInputs.erp, apiEndpoints.erp)}
            buttonColor="bg-blue-600 hover:bg-blue-700"
          />
          <PushCard
            color="bg-orange-500"
            label="财务系统集成"
            endpoint={apiEndpoints.finance}
            onEndpointChange={(v) => setApiEndpoints({ ...apiEndpoints, finance: v })}
            payload={apiInputs.finance}
            onPayloadChange={(v) => setApiInputs({ ...apiInputs, finance: v })}
            onSend={() => simulatePush("finance", "金蝶云财务", apiInputs.finance, apiEndpoints.finance)}
            buttonColor="bg-orange-500 hover:bg-orange-600"
          />
          <PushCard
            color="bg-green-600"
            label="OA 办公集成"
            endpoint={apiEndpoints.oa}
            onEndpointChange={(v) => setApiEndpoints({ ...apiEndpoints, oa: v })}
            payload={apiInputs.oa}
            onPayloadChange={(v) => setApiInputs({ ...apiInputs, oa: v })}
            onSend={() => simulatePush("oa", "泛微 OA", apiInputs.oa, apiEndpoints.oa)}
            buttonColor="bg-green-600 hover:bg-green-700"
          />
          <PushCard
            color="bg-purple-600"
            label="CRM 客户集成"
            endpoint={apiEndpoints.crm}
            onEndpointChange={(v) => setApiEndpoints({ ...apiEndpoints, crm: v })}
            payload={apiInputs.crm}
            onPayloadChange={(v) => setApiInputs({ ...apiInputs, crm: v })}
            onSend={() => simulatePush("crm", "Salesforce CRM", apiInputs.crm, apiEndpoints.crm)}
            buttonColor="bg-purple-600 hover:bg-purple-700"
          />
        </div>
      </div>

      {/* Running workflows panel */}
      {workflows.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <GitBranch size={16} className="text-purple-500" />
              运行中的跨系统流程
            </h4>
          </div>
          <div className="divide-y divide-slate-50">
            {workflows.filter((w) => w.status === "active").map((wf) => (
              <div key={wf.id} className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-700">{wf.templateName}</span>
                  <span className="text-[10px] text-slate-400">{wf.createdAt}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${(wf.currentStep / wf.totalSteps) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-purple-600 min-w-[52px] text-right">
                    {wf.currentStep}/{wf.totalSteps}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {wf.stepTodos.map((tid, i) => {
                    const done = i < wf.currentStep;
                    const active = i === wf.currentStep;
                    return (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full ${
                          done ? "bg-green-400" : active ? "bg-purple-500 animate-pulse" : "bg-slate-200"
                        }`}
                        title={`步骤 ${i + 1}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
            {workflows.filter((w) => w.status === "active").length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400">暂无运行中的流程</div>
            )}
          </div>
        </div>
      )}

      {/* Webhook log panel */}
      {webhookLogs.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Activity size={16} className="text-blue-500" />
              Webhook 推送日志
            </h4>
            <button
              onClick={() => setWebhookLogs([])}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              清空
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
            {webhookLogs.map((log) => (
              <div key={log.id} className="px-4 py-3 flex items-center gap-3 text-xs">
                <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-orange-50 text-orange-600">
                  PUSH
                </span>
                <span className="text-slate-600 font-medium min-w-[64px]">{log.source}</span>
                <span className="text-slate-400 font-mono text-[10px] truncate">{log.endpoint}</span>
                <span className="text-slate-400 ml-auto whitespace-nowrap">{log.timestamp}</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    log.status === "success" ? "bg-green-400" : "bg-red-400"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PushCard({ color, label, endpoint, onEndpointChange, payload, onPayloadChange, onSend, buttonColor }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5 border-b border-slate-100 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
          <span className="text-base font-bold">{label}</span>
        </div>
        <input
          value={endpoint}
          onChange={(e) => onEndpointChange(e.target.value)}
          className="text-xs font-mono bg-slate-50 text-slate-600 px-3 py-2.5 rounded-xl outline-none focus:border-blue-400 border border-transparent w-full transition-colors"
        />
      </div>
      <div className="p-5 bg-slate-50/50 space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-400 mb-2 block">推送内容 (Payload)</label>
          <input
            value={payload}
            onChange={(e) => onPayloadChange(e.target.value)}
            className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors shadow-sm"
          />
        </div>
        <button
          onClick={onSend}
          className={`w-full ${buttonColor} text-white py-3 rounded-xl text-sm font-bold shadow-md active:scale-95 transition-all flex justify-center items-center gap-2`}
        >
          <Terminal size={16} /> 发送推送请求
        </button>
      </div>
    </div>
  );
}
