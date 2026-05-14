require('dotenv').config();

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const API_KEY = process.env.DEEPSEEK_API_KEY;
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

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

function buildSystemPrompt(role) {
  const append = ROLE_APPEND[role] || ROLE_APPEND.staff;
  return BASE_INSTRUCTION + append;
}

async function chat({ prompt, history = [], role = 'staff' }) {
  if (!API_KEY || API_KEY === 'sk-your-deepseek-api-key') {
    return 'AI 服务未配置，请联系管理员设置 DEEPSEEK_API_KEY。';
  }

  const messages = [
    { role: 'system', content: buildSystemPrompt(role) },
    ...history,
    { role: 'user', content: prompt },
  ];

  try {
    const res = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ model: MODEL, messages, stream: false }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`DeepSeek API error ${res.status}:`, errText);
      return 'AI 暂时无法响应，请稍后再试。';
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || 'AI 返回了空响应。';
  } catch (err) {
    console.error('DeepSeek request failed:', err.message);
    return 'AI 服务连接失败，请检查网络。';
  }
}

module.exports = { chat };
