const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const USERS = [
  { id: 'U001', name: '张总',   email: 'admin@linke.com',  password: 'admin123', role: 'admin', avatar: '👨‍💼', dept: '总经办' },
  { id: 'U009', name: '李专员', email: 'staff@linke.com',  password: 'staff123', role: 'staff', avatar: '👩‍💻', dept: '销售部' },
];

const INTEGRATIONS = [
  { id: 'erp',     name: 'SAP ERP',         status: 'connected', color: 'bg-blue-600',   webhook_endpoint: 'POST /v1/erp/webhook' },
  { id: 'finance', name: '金蝶云财务',       status: 'connected', color: 'bg-orange-500', webhook_endpoint: 'POST /v1/finance/webhook' },
  { id: 'oa',      name: '泛微 OA',          status: 'connected', color: 'bg-green-600',  webhook_endpoint: 'POST /v1/oa/approval/webhook' },
  { id: 'crm',     name: 'Salesforce CRM',   status: 'connected', color: 'bg-purple-600', webhook_endpoint: 'POST /v1/crm/opportunity/webhook' },
];

const TODOS = [
  { id: 101, user_id: 'U001', source: 'ERP系统', title: 'Q3季度原材料采购审批',         type: '审批', priority: 'high',   status: 'pending' },
  { id: 102, user_id: 'U001', source: '财务云', title: '差旅报销单 #BX202403 签字',      type: '签字', priority: 'medium', status: 'pending' },
  { id: 103, user_id: 'U001', source: 'OA系统', title: '研发部李工提交年假申请（3天）',   type: '审批', priority: 'medium', status: 'pending' },
  { id: 105, user_id: 'U001', source: 'CRM系统', title: '华东区新客户「明辉科技」合同评审', type: '审批', priority: 'high',   status: 'pending' },
  { id: 106, user_id: 'U001', source: 'OA系统', title: '周五下午3点A301会议室预定申请',   type: '预定', priority: 'low',    status: 'processing' },
  { id: 107, user_id: 'U001', source: 'CRM系统', title: '跟进线索：张经理-企业采购意向',   type: '任务', priority: 'medium', status: 'pending' },
  { id: 104, user_id: 'U009', source: '内部OA', title: '填写本周工作周报',                type: '任务', priority: 'low',    status: 'done' },
];

const THREADS = [
  { id: 11, type: 'bot',  name: 'ERP AI 助手',       color: 'bg-slate-800',  tag: 'AI',  pinned: false },
  { id: 3,  type: 'group', name: '双11大促项目组',     color: 'bg-indigo-500', tag: null,  pinned: true },
  { id: 1,  type: 'user',  name: '王财务',            color: 'bg-orange-500', tag: null,  pinned: false },
  { id: 5,  type: 'bot',   name: 'OA 系统通知',        color: 'bg-green-600',  tag: 'OA', pinned: false },
  { id: 6,  type: 'bot',   name: 'CRM 商机提醒',       color: 'bg-purple-600', tag: 'CRM', pinned: false },
];

const HISTORY = [
  { thread_id: 11, sender_type: 'other', sender_name: null, type: 'text',
    content: '您好！我是您的 LinkE AI 助手（Powered by DeepSeek）。您可以向我询问：\n\n1. 采购审批详情\n2. 财务报销进度\n3. 异构系统集成状态' },
  { thread_id: 3, sender_type: 'other', sender_name: '陈工', type: 'text', content: '方案初稿已上传，大家确认下。' },
  { thread_id: 3, sender_type: 'other', sender_name: '王财务', type: 'file', content: '预算分配表.xlsx', file_size: '1.2MB' },
  { thread_id: 5, sender_type: 'other', sender_name: null, type: 'text',
    content: 'OA 系统提醒：\n\n研发部李工提交了年假申请（3天），请您审批。\n\n申请时间：2025年6月12日 - 6月14日\n理由：家庭事务\n\n请在今日内完成审批。' },
  { thread_id: 6, sender_type: 'other', sender_name: null, type: 'text',
    content: 'CRM 系统推送：\n\n新商机提醒\n客户：明辉科技（华东区）\n合同金额：¥280,000\n产品线：企业协同管理平台\n阶段：合同评审\n\n建议本周内完成内部评审流程。' },
];

async function seed() {
  const conn = await pool.getConnection();
  try {
    // ── users ──
    for (const u of USERS) {
      const hash = await bcrypt.hash(u.password, 10);
      await conn.execute(
        'INSERT INTO users (id, name, email, password, role, avatar, dept) VALUES (?,?,?,?,?,?,?)',
        [u.id, u.name, u.email, hash, u.role, u.avatar, u.dept]
      );
    }
    console.log('✓ users seeded');

    // ── integrations ──
    for (const i of INTEGRATIONS) {
      await conn.execute(
        'INSERT INTO integrations (id, name, status, color, webhook_endpoint) VALUES (?,?,?,?,?)',
        [i.id, i.name, i.status, i.color, i.webhook_endpoint]
      );
    }
    console.log('✓ integrations seeded');

    // ── todos ──
    for (const t of TODOS) {
      await conn.execute(
        'INSERT INTO todos (id, user_id, source, title, type, priority, status) VALUES (?,?,?,?,?,?,?)',
        [t.id, t.user_id, t.source, t.title, t.type, t.priority, t.status]
      );
    }
    console.log('✓ todos seeded');

    // ── message_threads ──
    for (const t of THREADS) {
      await conn.execute(
        'INSERT INTO message_threads (id, type, name, color, tag, pinned) VALUES (?,?,?,?,?,?)',
        [t.id, t.type, t.name, t.color, t.tag, t.pinned]
      );
    }
    console.log('✓ message_threads seeded');

    // ── message_history ──
    for (const h of HISTORY) {
      await conn.execute(
        'INSERT INTO message_history (thread_id, sender_type, sender_name, type, content, file_size) VALUES (?,?,?,?,?,?)',
        [h.thread_id, h.sender_type, h.sender_name, h.type, h.content, h.file_size || null]
      );
    }
    console.log('✓ message_history seeded');

    // ── thread_participants ──
    const participantThreads = [
      { thread_id: 11, user_id: 'U001', unread: 0 },
      { thread_id: 11, user_id: 'U009', unread: 0 },
      { thread_id: 3,  user_id: 'U001', unread: 3 },
      { thread_id: 3,  user_id: 'U009', unread: 3 },
      { thread_id: 1,  user_id: 'U001', unread: 1 },
      { thread_id: 5,  user_id: 'U001', unread: 1 },
      { thread_id: 6,  user_id: 'U001', unread: 2 },
    ];
    for (const p of participantThreads) {
      await conn.execute(
        'INSERT INTO thread_participants (thread_id, user_id, unread) VALUES (?,?,?)',
        [p.thread_id, p.user_id, p.unread]
      );
    }
    console.log('✓ thread_participants seeded');

    console.log('\n🎉 Seed completed!');
    console.log('   Admin login: admin@linke.com / admin123');
    console.log('   Staff login: staff@linke.com / staff123');
  } finally {
    conn.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
