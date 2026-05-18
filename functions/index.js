const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Base system prompt (same as Express version)
const BASE_INSTRUCTION = `你是一个专业的企业协同助手 LinkE AI，通过自然语言帮助用户处理企业内部的跨系统事务。
你可以提供以下支持：
1. ERP 采购/库存查询与审批
2. 财务报销流程咨询
3. OA 审批流程管理
4. CRM 客户/商机管理
5. 企业数据分析与报表解读

请使用专业、礼貌、简洁的中文进行回复。`;

const ROLE_APPEND = {
  admin: `\n\n你正在与企业的管理者（张总/高层）对话。请从战略高度分析问题，关注跨部门协同效率、关键业务指标、潜在风险提示。使用"张总"称呼对方。回复风格应偏向 MBA 级别的商业分析。`,
  staff: `\n\n你正在与一线员工对话。请聚焦具体任务的执行指导，给出明确的操作步骤和流程方向。使用"您"称呼对方。回复风格应务实、可操作。`,
};

/**
 * POST /aiChat
 * Body: { prompt: string, history: array, role: string }
 * Response: { reply: string }
 */
exports.aiChat = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "请先登录");
  }

  const { prompt, history = [], role = "staff" } = data;
  if (!prompt) {
    throw new functions.https.HttpsError("invalid-argument", "请输入问题");
  }

  const systemPrompt = BASE_INSTRUCTION + (ROLE_APPEND[role] || ROLE_APPEND.staff);
  const messages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: prompt },
  ];

  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({ model: "deepseek-chat", messages, stream: false }),
    });

    if (!res.ok) {
      console.error(`DeepSeek API error: ${res.status}`);
      throw new functions.https.HttpsError("internal", "AI 服务暂时不可用");
    }

    const result = await res.json();
    return { reply: result.choices?.[0]?.message?.content || "AI 返回了空响应。" };
  } catch (err) {
    console.error("DeepSeek request failed:", err);
    throw new functions.https.HttpsError("internal", "AI 服务连接失败");
  }
});

/**
 * POST /aiSummary
 * Body: { todos: array of { title, source, priority } }
 * Response: { summary: string }
 */
exports.aiSummary = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "请先登录");
  }

  const { todos = [] } = data;
  if (todos.length === 0) {
    return { summary: "当前没有待处理的任务，干得漂亮！" };
  }

  const taskList = todos
    .map((t, i) => `${i + 1}. [${t.source}] ${t.title}（${t.priority === "high" ? "紧急" : "普通"}）`)
    .join("\n");

  const prompt = `请汇总以下待办任务并给出核心建议：\n\n${taskList}`;
  const systemPrompt = BASE_INSTRUCTION + ROLE_APPEND.admin;

  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        stream: false,
      }),
    });

    const result = await res.json();
    return { summary: result.choices?.[0]?.message?.content || "AI 返回了空响应。" };
  } catch (err) {
    console.error("DeepSeek summary failed:", err);
    throw new functions.https.HttpsError("internal", "AI 摘要生成失败");
  }
});

/**
 * HTTP health check
 */
exports.health = functions.https.onRequest((req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});
