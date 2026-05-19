import {
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp,
} from "firebase/firestore";
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";
import { db, auth } from "../firebase/config";

// Cloud Functions — when deployed to Firebase, these handle DeepSeek proxy.
// For local dev without Functions, falls back to direct call with key from Firestore.
const functions = getFunctions();
// Uncomment for local emulator: connectFunctionsEmulator(functions, "127.0.0.1", 5001);

let deepseekApiKey = null;
let useCloudFunctions = false; // set to true after deploying functions

async function getDeepSeekKey() {
  if (deepseekApiKey) return deepseekApiKey;
  try {
    const snap = await getDoc(doc(db, "config", "deepseek"));
    if (snap.exists()) {
      deepseekApiKey = snap.data().apiKey;
      return deepseekApiKey;
    }
  } catch {}
  return null;
}

function getUserId() {
  return auth.currentUser?.uid || null;
}

// ── Todos ──

async function listAllTodos() {
  const snap = await getDocs(collection(db, "todos"));
  let todos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  todos = todos.filter((t) => !t.deletedAt);
  todos.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  return { todos };
}

async function listTodos(filters = {}) {
  const userId = getUserId();
  if (!userId) return { todos: [] };

  const q = query(collection(db, "todos"), where("userId", "==", userId));
  const snap = await getDocs(q);

  let todos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  todos = todos.filter((t) => !t.deletedAt);
  if (filters.status) todos = todos.filter((t) => t.status === filters.status);
  if (filters.priority) todos = todos.filter((t) => t.priority === filters.priority);
  todos.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  return { todos };
}

async function createTodo(data) {
  const userId = data.userId || getUserId();
  const todo = {
    userId,
    source: data.source || "手动创建",
    title: data.title,
    type: data.type || "任务",
    priority: data.priority || "medium",
    status: "pending",
    system: data.system || null,
    workflowInstanceId: data.workflowInstanceId || null,
    workflowStep: data.workflowStep ?? null,
    workflowTotalSteps: data.workflowTotalSteps ?? null,
    workflowName: data.workflowName || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
  };
  // 使用本地 ID 存 Firestore，保证和工作流引擎 ID 一致
  if (data.id) {
    await setDoc(doc(db, "todos", data.id), todo);
    return { todo: { id: data.id, ...todo } };
  }
  const ref = await addDoc(collection(db, "todos"), todo);
  return { todo: { id: ref.id, ...todo } };
}

async function updateTodoStatus(id, status) {
  await updateDoc(doc(db, "todos", id), { status, updatedAt: serverTimestamp() });
  return { todo: { id, status } };
}

async function updateTodo(id, data) {
  const updates = { updatedAt: serverTimestamp() };
  if (data.title) updates.title = data.title;
  if (data.priority) updates.priority = data.priority;
  if (data.type) updates.type = data.type;
  await updateDoc(doc(db, "todos", id), updates);
  return { todo: { id, ...updates } };
}

async function deleteThread(threadId) {
  await deleteDoc(doc(db, "messageThreads", threadId));
  return { success: true };
}

async function deleteTodo(id) {
  await updateDoc(doc(db, "todos", id), { deletedAt: serverTimestamp() });
  return { success: true };
}

// ── Messages ──

async function listThreads() {
  const userId = getUserId();
  if (!userId) return { threads: [] };

  // Simple query without orderBy to avoid composite index requirement
  const q = query(
    collection(db, "messageThreads"),
    where("participants", "array-contains", userId)
  );
  const snap = await getDocs(q);
  const threads = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      type: data.type,
      name: data.name,
      color: data.color || "bg-slate-800",
      tag: data.tag || null,
      pinned: data.pinned || false,
      unread: data.unreadBy?.[userId] || 0,
      content: data.lastContent || "",
      time: data.lastTime || "",
      updatedAt: data.updatedAt,
    };
  });
  // Sort client-side: pinned first, then by updatedAt desc
  threads.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0);
  });
  return { threads };
}

async function getHistory(threadId) {
  const q = query(
    collection(db, "messageThreads", threadId, "messages"),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);

  // Mark as read
  const userId = getUserId();
  if (userId) {
    await updateDoc(doc(db, "messageThreads", threadId), {
      [`unreadBy.${userId}`]: 0,
    });
  }

  const history = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    time: d.data().createdAt ? formatTime(d.data().createdAt.toDate()) : "",
  }));
  return { history };
}

async function sendToThread(threadId, content, type = "text") {
  const userId = getUserId();
  const user = auth.currentUser;
  const msg = {
    senderId: userId,
    senderType: "self",
    senderName: user?.displayName || "我",
    type,
    content,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, "messageThreads", threadId, "messages"), msg);

  // Update thread preview
  await updateDoc(doc(db, "messageThreads", threadId), {
    lastContent: content,
    lastTime: new Date().toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit" }),
    updatedAt: serverTimestamp(),
  });

  return { message: { id: ref.id, ...msg } };
}

// ── AI (Calls DeepSeek directly — production should use Cloud Function) ──

async function aiChat(prompt, history = []) {
  // Try Cloud Functions first (production)
  if (useCloudFunctions) {
    try {
      const callFn = httpsCallable(functions, "aiChat");
      const result = await callFn({ prompt, history, role: getRole() });
      return { reply: result.data.reply };
    } catch (err) {
      console.warn("Cloud Function failed, falling back:", err.message);
    }
  }

  // Fallback: direct call with key from Firestore (dev/demo)
  const key = await getDeepSeekKey();
  if (!key) return { reply: "AI 服务未配置，请联系管理员设置 DeepSeek API Key。" };

  const role = getRole();

  const BASE = "你是一个专业的企业协同助手 LinkE AI...";
  const APPEND = role === "admin"
    ? '\n\n你正在与管理者对话...称呼对方为"张总"。'
    : "\n\n你正在与一线员工对话...";

  const messages = [
    { role: "system", content: BASE + APPEND },
    ...history,
    { role: "user", content: prompt },
  ];

  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ model: "deepseek-chat", messages, stream: false }),
    });
    const data = await res.json();
    return { reply: data.choices?.[0]?.message?.content || "AI 返回了空响应。" };
  } catch {
    return { reply: "AI 服务连接失败。" };
  }
}

// ── Integrations ──

async function listIntegrations() {
  const snap = await getDocs(collection(db, "integrations"));
  const integrations = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return { integrations };
}

async function integrationPush(integrationId, payload) {
  const intSnap = await getDoc(doc(db, "integrations", integrationId));
  if (!intSnap.exists()) throw new Error("集成不存在");
  const integration = intSnap.data();

  // Create todo
  const todoRef = await addDoc(collection(db, "todos"), {
    userId: getUserId(),
    source: integration.name,
    title: payload || `来自 ${integration.name} 的推送任务`,
    type: "业务推送",
    priority: "high",
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
  });

  // Log
  await addDoc(collection(db, "integrationLogs"), {
    integrationId,
    direction: "push",
    source: integration.name,
    endpoint: integration.webhookEndpoint || "/push",
    payload: payload || "",
    status: "success",
    createdAt: serverTimestamp(),
  });

  return { todo: { id: todoRef.id, title: payload } };
}

async function getIntegrationLogs(integrationId) {
  const q = query(
    collection(db, "integrationLogs"),
    where("integrationId", "==", integrationId)
  );
  const snap = await getDocs(q);
  const logs = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
  // Sort client-side
  logs.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  return { logs: logs.slice(0, 50) };
}

// ── Helpers ──

function formatTime(date) {
  return date.toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit" });
}

function getRole() {
  const user = auth.currentUser;
  return user?.email?.includes("admin") ? "admin" : "staff";
}

// ── Workflows ──

async function listWorkflows() {
  const snap = await getDocs(collection(db, "workflows"));
  const workflows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return { workflows };
}

async function saveWorkflow(workflow) {
  await setDoc(doc(db, "workflows", workflow.id), workflow);
  return { workflow };
}

// ── Notifications (推给 admin) ──

async function notifyAdmin(content, tag) {
  // 查找 admin 的 uid
  let adminUid = null;
  try {
    const adminUser = await getDocs(query(collection(db, "users"), where("role", "==", "admin")));
    if (!adminUser.empty) adminUid = adminUser.docs[0].id;
  } catch {}
  if (!adminUid) return { sent: false };

  // 写入共享通知线程
  const threadRef = doc(db, "messageThreads", "notifications");
  const threadSnap = await getDoc(threadRef);
  if (!threadSnap.exists()) {
    await setDoc(threadRef, {
      type: "bot",
      name: "LinkE 流程引擎",
      color: "bg-purple-600",
      tag: tag || "系统",
      pinned: true,
      participants: [adminUid],
      unreadBy: { [adminUid]: 1 },
      lastContent: content.slice(0, 80),
      lastTime: new Date().toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit" }),
      updatedAt: serverTimestamp(),
    });
  } else {
    const data = threadSnap.data();
    await updateDoc(threadRef, {
      lastContent: content.slice(0, 80),
      lastTime: new Date().toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit" }),
      updatedAt: serverTimestamp(),
      [`unreadBy.${adminUid}`]: (data.unreadBy?.[adminUid] || 0) + 1,
    });
  }

  // 写入消息历史
  await addDoc(collection(db, "messageThreads", "notifications", "messages"), {
    senderId: null,
    senderType: "other",
    senderName: null,
    type: "text",
    content,
    createdAt: serverTimestamp(),
  });

  return { sent: true };
}

// ── Unified API object ──

export const api = {
  // The path-based interface for compatibility
  async get(path) {
    if (path === "/todos/all") return listAllTodos();
    if (path === "/todos") return listTodos();
    if (path.startsWith("/todos?")) {
      const params = new URLSearchParams(path.split("?")[1]);
      return listTodos({ status: params.get("status"), priority: params.get("priority") });
    }
    if (path === "/messages") return listThreads();
    if (path.match(/^\/messages\/.+\/history$/)) {
      const id = path.split("/")[2];
      return getHistory(id);
    }
    if (path === "/workflows") return listWorkflows();
    if (path === "/integrations") return listIntegrations();
    if (path.match(/^\/integrations\/.+\/logs$/)) {
      const id = path.split("/")[2];
      return getIntegrationLogs(id);
    }
    if (path === "/auth/me") {
      const user = auth.currentUser;
      if (!user) throw new Error("未登录");
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) throw new Error("用户不存在");
      return { user: { id: user.uid, ...snap.data() } };
    }
    throw new Error(`Unknown GET path: ${path}`);
  },

  async post(path, body) {
    if (path === "/notify-admin") return notifyAdmin(body?.content, body?.tag);
    if (path === "/workflows") return saveWorkflow(body);
    if (path === "/todos") return createTodo(body || {});
    if (path === "/ai/chat") return aiChat(body?.prompt, body?.history || []);
    if (path === "/ai/summary") {
      const todosSnap = await getDocs(query(
        collection(db, "todos"),
        where("userId", "==", getUserId()),
        where("status", "==", "pending")
      ));
      const todos = todosSnap.docs.map((d) => d.data());
      if (todos.length === 0) return { summary: "当前没有待处理的任务！" };
      const taskList = todos.map((t, i) => `${i + 1}. [${t.source}] ${t.title}`).join("\n");
      const reply = await aiChat(`请汇总以下待办任务并给出核心建议：\n\n${taskList}`, []);
      return { summary: reply.reply };
    }
    if (path.match(/^\/messages\/.+\/history$/)) {
      const id = path.split("/")[2];
      return sendToThread(id, body?.content, body?.type);
    }
    if (path.match(/^\/integrations\/.+\/push$/)) {
      const id = path.split("/")[2];
      return integrationPush(id, body?.payload);
    }
    throw new Error(`Unknown POST path: ${path}`);
  },

  async patch(path, body) {
    if (path.match(/^\/todos\/.+\/status$/)) {
      const id = path.split("/")[2];
      return updateTodoStatus(id, body?.status);
    }
    if (path.match(/^\/todos\/.+$/)) {
      const id = path.split("/")[2];
      return updateTodo(id, body || {});
    }
    throw new Error(`Unknown PATCH path: ${path}`);
  },

  async delete(path) {
    if (path.match(/^\/todos\/.+$/)) {
      const id = path.split("/")[2];
      return deleteTodo(id);
    }
    if (path.match(/^\/messages\/.+$/)) {
      const id = path.split("/")[2];
      return deleteThread(id);
    }
    throw new Error(`Unknown DELETE path: ${path}`);
  },
};
