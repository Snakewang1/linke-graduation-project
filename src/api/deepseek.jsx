const BASE_INSTRUCTION =
  "你是一个专业的企业协同助手 LinkE AI。请使用简洁、易读的纯文本回答，不要使用复杂的 Markdown 标记（如 # 或表格），重要内容可以使用文字提示。请确保使用换行符来分隔段落。";

const ROLE_APPEND = {
  admin:
    "\n\n你正在与管理者对话。请提供：\n- 战略层面的分析和建议\n- 跨部门资源协调建议\n- 关键指标解读和风险预警\n- 称呼对方为“张总”",
  staff:
    "\n\n你正在与一线员工对话。请提供：\n- 任务级别的操作指导\n- 流程指引和最佳实践\n- 具体问题的解决方案",
};

function getSystemPrompt(role) {
  const append = ROLE_APPEND[role] || ROLE_APPEND.staff;
  return BASE_INSTRUCTION + append;
}

/**
 * callDeepSeek(options) — multi-turn capable
 *
 * Accepts either the legacy signature:
 *   callDeepSeek(prompt: string, apiKey: string)
 * or the new options-based signature:
 *   callDeepSeek({ prompt, apiKey, role?, history? })
 *
 * history: Array<{ role: "user" | "assistant", content: string }>
 */
export async function callDeepSeek(arg1, arg2) {
  // Legacy signature detection
  let prompt, apiKey, role = "staff", history = [];

  if (typeof arg1 === "string") {
    prompt = arg1;
    apiKey = arg2;
  } else {
    ({ prompt, apiKey, role = "staff", history = [] } = arg1);
  }

  if (!apiKey) return "请在设置中心配置 API Key。";

  const messages = [
    { role: "system", content: getSystemPrompt(role) },
    ...history,
    { role: "user", content: prompt },
  ];

  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        stream: false,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "AI 暂时无法响应。";
  } catch (error) {
    console.error("DeepSeek API error:", error);
    return `连接失败：${error.message}`;
  }
}

export function formatContent(text) {
  if (!text) return "";

  // Split by **bold** markers
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold underline decoration-blue-400/30">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
