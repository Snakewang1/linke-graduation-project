import { useState } from "react";
import { ArrowLeft, Shield, Copy, Server, Terminal, Download, Activity } from "lucide-react";

const PULL_MOCK_DATA = {
  ec: {
    title: "SKU-A001 防晒霜库存低于安全阈值 (50件)",
    raw: `{"code":200,"data":{"orders":[{"id":"DD20240506","status":"待发货","amount":12800,"customer":"华东分销中心"}],"total":1,"ts":"2024-05-06T10:30:00Z"}}`,
  },
  erp: {
    title: "库存预警: 核心仓物料 SKU-001 低于安全库存",
    raw: `{"code":200,"data":{"sku":"SKU-001","current":42,"safe":50,"warehouse":"核心仓","suggest":"建议立即发起采购申请"}}`,
  },
  oa: {
    title: "研发部李工提交年假申请（3天）待审批",
    raw: `{"code":200,"data":{"type":"leave","applicant":"李工","dept":"研发部","days":3,"startDate":"2025-06-12","reason":"家庭事务","approver":"张总","status":"pending"}}`,
  },
  crm: {
    title: "商机列表: 3个新线索待分配，2个合同待评审",
    raw: `{"code":200,"data":{"leads":[{"company":"明辉科技","contact":"张经理","value":280000,"stage":"合同评审"},{"company":"星辰网络","contact":"赵总","value":150000,"stage":"初次接触"}],"total":5,"urgent":2}}`,
  },
};

export default function ApiConsole({ onBack, onPushTodo }) {
  const [apiInputs, setApiInputs] = useState({
    ec: "天猫双11新增大额订单待发货审核",
    erp: "核心仓物料 SKU-001 低于安全库存",
    oa: "研发部李工提交年假申请（3天）",
    crm: "华东区新客户明辉科技合同待评审 ¥280,000",
  });
  const [apiEndpoints, setApiEndpoints] = useState({
    ec: "POST /v1/orders/sync",
    erp: "POST /v1/erp/webhook",
    oa: "POST /v1/oa/approval/webhook",
    crm: "POST /v1/crm/opportunity/webhook",
  });
  const [apiDirections, setApiDirections] = useState({ ec: "push", erp: "push", oa: "push", crm: "push" });
  const [webhookLogs, setWebhookLogs] = useState([]);

  const addLog = (direction, source, endpoint, payload, status) => {
    setWebhookLogs((prev) => [
      {
        id: Date.now(),
        direction,
        source,
        endpoint,
        payload: payload.slice(0, 50) + (payload.length > 50 ? "..." : ""),
        status,
        timestamp: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
      },
      ...prev.slice(0, 49),
    ]);
  };

  const simulateApiCall = (source, title, endpoint, direction) => {
    if (direction === "push") {
      if (!title.trim() || !endpoint.trim()) return alert("推送内容或接口路径不能为空！");
      onPushTodo(source, title);
      addLog("push", source, endpoint, title, "success");
      alert(
        `请求成功 (200 OK)！\n[${source}] 成功调用了接口：\n👉 ${endpoint}\n\n推送的数据内容为：\n"${title}"\n\n请前往"协同待办"模块查看最新任务流转。`
      );
    } else {
      // Pull mode
      addLog("pull", source, endpoint, title.slice(0, 40), "success");
      alert(
        `拉取成功 (200 OK)！\n[${source}] 成功拉取了数据：\n👉 ${endpoint}\n\n返回数据：\n"${title}"`
      );
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
          <Server size={14} /> 异构系统联调模拟
        </h4>
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <ApiCard
            color="bg-orange-500"
            label="电商平台集成"
            endpoint={apiEndpoints.ec}
            onEndpointChange={(v) => setApiEndpoints({ ...apiEndpoints, ec: v })}
            payloadLabel="订单待办内容 (Payload)"
            payload={apiInputs.ec}
            onPayloadChange={(v) => setApiInputs({ ...apiInputs, ec: v })}
            direction={apiDirections.ec}
            onToggleDirection={(d) => setApiDirections({ ...apiDirections, ec: d })}
            pullData={PULL_MOCK_DATA.ec}
            onSend={() =>
              simulateApiCall(
                "电商中台",
                apiDirections.ec === "push" ? apiInputs.ec : PULL_MOCK_DATA.ec.title,
                apiEndpoints.ec,
                apiDirections.ec
              )
            }
            buttonColor="bg-orange-500 hover:bg-orange-600"
          />
          <ApiCard
            color="bg-blue-600"
            label="ERP 库存集成"
            endpoint={apiEndpoints.erp}
            onEndpointChange={(v) => setApiEndpoints({ ...apiEndpoints, erp: v })}
            payloadLabel="库存预警内容 (Payload)"
            payload={apiInputs.erp}
            onPayloadChange={(v) => setApiInputs({ ...apiInputs, erp: v })}
            direction={apiDirections.erp}
            onToggleDirection={(d) => setApiDirections({ ...apiDirections, erp: d })}
            pullData={PULL_MOCK_DATA.erp}
            onSend={() =>
              simulateApiCall(
                "SAP ERP",
                apiDirections.erp === "push" ? apiInputs.erp : PULL_MOCK_DATA.erp.title,
                apiEndpoints.erp,
                apiDirections.erp
              )
            }
            buttonColor="bg-blue-600 hover:bg-blue-700"
          />
          <ApiCard
            color="bg-green-600"
            label="OA 办公集成"
            endpoint={apiEndpoints.oa}
            onEndpointChange={(v) => setApiEndpoints({ ...apiEndpoints, oa: v })}
            payloadLabel="审批内容 (Payload)"
            payload={apiInputs.oa}
            onPayloadChange={(v) => setApiInputs({ ...apiInputs, oa: v })}
            direction={apiDirections.oa}
            onToggleDirection={(d) => setApiDirections({ ...apiDirections, oa: d })}
            pullData={PULL_MOCK_DATA.oa}
            onSend={() =>
              simulateApiCall(
                "泛微 OA",
                apiDirections.oa === "push" ? apiInputs.oa : PULL_MOCK_DATA.oa.title,
                apiEndpoints.oa,
                apiDirections.oa
              )
            }
            buttonColor="bg-green-600 hover:bg-green-700"
          />
          <ApiCard
            color="bg-purple-600"
            label="CRM 客户集成"
            endpoint={apiEndpoints.crm}
            onEndpointChange={(v) => setApiEndpoints({ ...apiEndpoints, crm: v })}
            payloadLabel="商机/合同内容 (Payload)"
            payload={apiInputs.crm}
            onPayloadChange={(v) => setApiInputs({ ...apiInputs, crm: v })}
            direction={apiDirections.crm}
            onToggleDirection={(d) => setApiDirections({ ...apiDirections, crm: d })}
            pullData={PULL_MOCK_DATA.crm}
            onSend={() =>
              simulateApiCall(
                "Salesforce CRM",
                apiDirections.crm === "push" ? apiInputs.crm : PULL_MOCK_DATA.crm.title,
                apiEndpoints.crm,
                apiDirections.crm
              )
            }
            buttonColor="bg-purple-600 hover:bg-purple-700"
          />
        </div>
      </div>

      {/* Webhook log panel */}
      {webhookLogs.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Activity size={16} className="text-blue-500" />
              集成调用日志
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
                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    log.direction === "push"
                      ? "bg-orange-50 text-orange-600"
                      : "bg-green-50 text-green-600"
                  }`}
                >
                  {log.direction === "push" ? "PUSH" : "PULL"}
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

function ApiCard({
  color,
  label,
  endpoint,
  onEndpointChange,
  payloadLabel,
  payload,
  onPayloadChange,
  direction,
  onToggleDirection,
  pullData,
  onSend,
  buttonColor,
}) {
  const isPush = direction === "push";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5 border-b border-slate-100 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
          <span className="text-base font-bold">{label}</span>
        </div>
        {/* Direction toggle */}
        <div className="flex bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => onToggleDirection("push")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              isPush ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
            }`}
          >
            推送到本系统
          </button>
          <button
            onClick={() => onToggleDirection("pull")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              !isPush ? "bg-white text-green-600 shadow-sm" : "text-slate-500"
            }`}
          >
            拉取数据
          </button>
        </div>
        <input
          value={endpoint}
          onChange={(e) => onEndpointChange(e.target.value)}
          className="text-xs font-mono bg-slate-50 text-slate-600 px-3 py-2.5 rounded-xl outline-none focus:border-blue-400 border border-transparent w-full transition-colors"
        />
      </div>
      <div className="p-5 bg-slate-50/50 space-y-4">
        {isPush ? (
          <div>
            <label className="text-xs font-bold text-slate-400 mb-2 block">{payloadLabel}</label>
            <input
              value={payload}
              onChange={(e) => onPayloadChange(e.target.value)}
              className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors shadow-sm"
            />
          </div>
        ) : (
          <div className="bg-green-50/50 border border-green-100 rounded-xl p-3">
            <p className="text-[10px] font-bold text-green-600 uppercase mb-1">拉取数据预览</p>
            <p className="text-xs text-slate-700 leading-relaxed">{pullData.title}</p>
            <details className="mt-2">
              <summary className="text-[10px] text-slate-400 cursor-pointer hover:text-slate-600">
                查看原始 JSON
              </summary>
              <pre className="mt-2 text-[10px] font-mono text-slate-600 bg-white p-2 rounded-lg border border-slate-100 overflow-x-auto whitespace-pre-wrap">
                {pullData.raw}
              </pre>
            </details>
          </div>
        )}
        <button
          onClick={onSend}
          className={`w-full ${buttonColor} text-white py-3 rounded-xl text-sm font-bold shadow-md active:scale-95 transition-all flex justify-center items-center gap-2`}
        >
          {isPush ? (
            <>
              <Terminal size={16} /> 发送集成请求
            </>
          ) : (
            <>
              <Download size={16} /> 拉取数据
            </>
          )}
        </button>
      </div>
    </div>
  );
}
