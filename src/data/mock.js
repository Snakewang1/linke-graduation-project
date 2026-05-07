import {
  Briefcase, FileText, BarChart3, ShoppingCart, Package, CreditCard,
  Bot, Users, ClipboardCheck, Target,
} from "lucide-react";

export const MOCK_DB = {
  users: {
    admin: { name: "张总",   role: "admin", avatar: "👨‍💼", dept: "总经办", id: "U001" },
    staff: { name: "李专员", role: "staff", avatar: "👩‍💻", dept: "销售部", id: "U009" },
  },
  integrations: [
    { id: "erp",     name: "SAP ERP",      status: "connected",   color: "bg-blue-600" },
    { id: "finance", name: "金蝶云财务",    status: "connected",   color: "bg-orange-500" },
    { id: "oa",      name: "泛微 OA",       status: "connected",   color: "bg-green-600" },
    { id: "crm",     name: "Salesforce CRM", status: "connected",  color: "bg-purple-600" },
  ],
  todos: [
    { id: 101, source: "ERP系统", title: "Q3季度原材料采购审批",          type: "审批", priority: "high",   time: "10:30", status: "pending" },
    { id: 102, source: "财务云", title: "差旅报销单 #BX202403 签字",       type: "签字", priority: "medium", time: "11:00", status: "pending" },
    { id: 103, source: "OA系统", title: "研发部李工提交年假申请（3天）",    type: "审批", priority: "medium", time: "09:45", status: "pending" },
    { id: 105, source: "CRM系统", title: "华东区新客户「明辉科技」合同评审",  type: "审批", priority: "high",   time: "08:30", status: "pending" },
    { id: 106, source: "OA系统", title: "周五下午3点A301会议室预定申请",    type: "预定", priority: "low",    time: "14:00", status: "processing" },
    { id: 107, source: "CRM系统", title: "跟进线索：张经理-企业采购意向",    type: "任务", priority: "medium", time: "16:00", status: "pending" },
    { id: 104, source: "内部OA", title: "填写本周工作周报",                 type: "任务", priority: "low",    time: "17:00", status: "done" },
  ],
  messages: [
    {
      id: 11, type: "bot", name: "ERP AI 助手",
      content: "点击可咨询库存、报表或审批进度",
      time: "11:30", unread: 0, avatarIcon: Bot, color: "bg-slate-800", tag: "AI",
      history: [
        {
          id: 1, sender: "other", type: "text",
          content: "您好！我是您的 LinkE AI 助手（Powered by DeepSeek）。您可以向我询问：\n\n1. 采购审批详情\n2. 财务报销进度\n3. 异构系统集成状态",
          time: "11:30",
        },
      ],
    },
    {
      id: 3, type: "group", name: "双11大促项目组",
      content: "陈工: 方案初稿已上传", time: "10:05", unread: 3, avatarIcon: Users,
      color: "bg-indigo-500", pinned: true,
      history: [
        { id: 1, sender: "other", name: "陈工",   type: "text", content: "方案初稿已上传，大家确认下。", time: "10:05" },
        { id: 2, sender: "other", name: "王财务", type: "file", content: "预算分配表.xlsx", size: "1.2MB", time: "10:08" },
      ],
    },
    {
      id: 1, type: "user", name: "王财务",
      content: "[图片] 请确认发票金额", time: "10:15", unread: 1,
      avatarText: "王", color: "bg-orange-500", history: [],
    },
    {
      id: 5, type: "bot", name: "OA 系统通知",
      content: "李工申请年假审批，请及时处理", time: "09:45", unread: 1,
      avatarIcon: ClipboardCheck, color: "bg-green-600", tag: "OA",
      history: [
        { id: 1, sender: "other", type: "text", content: "OA 系统提醒：\n\n研发部李工提交了年假申请（3天），请您审批。\n\n申请时间：2025年6月12日 - 6月14日\n理由：家庭事务\n\n请在今日内完成审批。", time: "09:45" },
      ],
    },
    {
      id: 6, type: "bot", name: "CRM 商机提醒",
      content: "明辉科技合同金额 ¥280,000 待评审", time: "08:30", unread: 2,
      avatarIcon: Target, color: "bg-purple-600", tag: "CRM",
      history: [
        { id: 1, sender: "other", type: "text", content: "CRM 系统推送：\n\n新商机提醒\n客户：明辉科技（华东区）\n合同金额：¥280,000\n产品线：企业协同管理平台\n阶段：合同评审\n\n建议本周内完成内部评审流程。", time: "08:30" },
      ],
    },
  ],
};

export const APP_MENUS = {
  erp: {
    title: "ERP系统", color: "bg-blue-500", icon: Briefcase,
    items: [
      {
        id: "purchase", title: "采购管理", icon: ShoppingCart, desc: "订单、供应商",
        children: [
          { id: "p_create", title: "创建采购申请", type: "form", formFields: ["物料名称", "规格", "数量"] },
        ],
      },
      {
        id: "inventory", title: "库存管理", icon: Package, desc: "出入库、盘点",
        children: [
          { id: "i_query", title: "实时库存查询", type: "search" },
        ],
      },
    ],
  },
  finance: {
    title: "财务审批", color: "bg-orange-500", icon: FileText,
    items: [
      {
        id: "reim", title: "费用报销", icon: CreditCard, desc: "差旅、日常报销",
        children: [
          { id: "r_new", title: "发起报销申请", type: "form", formFields: ["金额", "说明"] },
        ],
      },
      {
        id: "report", title: "财务看板", icon: BarChart3, desc: "营收与成本分析",
        children: [
          { id: "rep_v", title: "查看月度分析", type: "list" },
        ],
      },
    ],
  },
  oa: {
    title: "OA办公", color: "bg-green-500", icon: ClipboardCheck,
    items: [
      {
        id: "leave", title: "请假审批", icon: ClipboardCheck, desc: "年假、事假、病假",
        children: [
          { id: "l_new", title: "提交请假申请", type: "form", formFields: ["类型", "开始日期", "结束日期", "事由"] },
          { id: "l_list", title: "待审批请假单", type: "list" },
        ],
      },
      {
        id: "meeting", title: "会议室预定", icon: Briefcase, desc: "预定、查询、取消",
        children: [
          { id: "m_new", title: "预定会议室", type: "form", formFields: ["日期", "时间段", "参会人数", "主题"] },
        ],
      },
    ],
  },
  crm: {
    title: "CRM客户", color: "bg-purple-500", icon: Target,
    items: [
      {
        id: "customer", title: "客户管理", icon: Users, desc: "客户信息、联系人",
        children: [
          { id: "c_new", title: "新建客户档案", type: "form", formFields: ["公司名称", "行业", "联系人", "电话"] },
          { id: "c_search", title: "客户信息查询", type: "search" },
        ],
      },
      {
        id: "contract", title: "合同审批", icon: FileText, desc: "合同评审、签约",
        children: [
          { id: "ct_review", title: "发起合同评审", type: "form", formFields: ["合同名称", "客户", "金额", "条款摘要"] },
        ],
      },
    ],
  },
};
