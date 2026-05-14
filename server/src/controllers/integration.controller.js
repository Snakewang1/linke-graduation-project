const pool = require('../config/db');

exports.list = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM integrations ORDER BY id');
    res.json({ integrations: rows });
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM integrations WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: '集成不存在' });
    }
    res.json({ integration: rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, webhook_endpoint } = req.body;

    await pool.execute(
      'UPDATE integrations SET status = COALESCE(?, status), webhook_endpoint = COALESCE(?, webhook_endpoint) WHERE id = ?',
      [status || null, webhook_endpoint || null, id]
    );

    const [rows] = await pool.execute('SELECT * FROM integrations WHERE id = ?', [id]);
    res.json({ integration: rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.push = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { payload } = req.body;

    const [integrations] = await pool.execute('SELECT * FROM integrations WHERE id = ?', [id]);
    if (integrations.length === 0) {
      return res.status(404).json({ error: '集成不存在' });
    }

    const integration = integrations[0];

    // Create a todo from the push
    const title = payload || `来自 ${integration.name} 的推送任务`;
    const [todoResult] = await pool.execute(
      'INSERT INTO todos (user_id, source, title, type, priority, status) VALUES (?,?,?,?,?,?)',
      [req.user.id, integration.name, title, '业务推送', 'high', 'pending']
    );

    // Log the integration call
    await pool.execute(
      'INSERT INTO integration_logs (integration_id, direction, source, endpoint, payload, status) VALUES (?,?,?,?,?,?)',
      [id, 'push', integration.name, integration.webhook_endpoint || '/push', title, 'success']
    );

    const [todo] = await pool.execute('SELECT * FROM todos WHERE id = ?', [todoResult.insertId]);

    // Create a notification message
    const [threadResult] = await pool.execute(
      "INSERT INTO message_threads (type, name, color, tag) VALUES ('bot', ?, 'bg-purple-500', '推送')",
      [`${integration.name} 通知`]
    );
    const threadId = threadResult.insertId;

    await pool.execute(
      `INSERT INTO message_history (thread_id, sender_type, sender_name, type, content)
       VALUES (?, 'other', ?, 'text', ?)`,
      [threadId, integration.name, `系统推送了一条新待办任务：\n\n${title}\n来源：${integration.name}\n\n请前往"协同待办"查看详情。`]
    );

    // Add participants
    const [users] = await pool.execute('SELECT id FROM users');
    for (const u of users) {
      await pool.execute(
        'INSERT INTO thread_participants (thread_id, user_id, unread) VALUES (?,?,?)',
        [threadId, u.id, u.id === req.user.id ? 0 : 1]
      );
    }

    res.status(201).json({
      todo: todo[0],
      messageThread: { id: threadId, name: `${integration.name} 通知` },
    });
  } catch (err) {
    next(err);
  }
};

exports.getLogs = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM integration_logs WHERE integration_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.params.id]
    );
    res.json({ logs: rows });
  } catch (err) {
    next(err);
  }
};
