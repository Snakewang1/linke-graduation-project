const pool = require('../config/db');

exports.list = async (req, res, next) => {
  try {
    const { status, priority } = req.query;
    let sql = 'SELECT * FROM todos WHERE deleted_at IS NULL';
    const params = [];

    // Staff sees own todos; admin sees all
    if (req.user.role === 'staff') {
      sql += ' AND user_id = ?';
      params.push(req.user.id);
    }

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (priority) {
      sql += ' AND priority = ?';
      params.push(priority);
    }

    sql += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute(sql, params);
    res.json({ todos: rows });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { source, title, type, priority, user_id } = req.body;
    if (!title) {
      return res.status(400).json({ error: '请输入待办标题' });
    }

    const [result] = await pool.execute(
      'INSERT INTO todos (user_id, source, title, type, priority, status) VALUES (?,?,?,?,?,?)',
      [user_id || req.user.id, source || '手动创建', title, type || '任务', priority || 'medium', 'pending']
    );

    const [rows] = await pool.execute('SELECT * FROM todos WHERE id = ?', [result.insertId]);
    res.status(201).json({ todo: rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, priority, type } = req.body;

    const [existing] = await pool.execute('SELECT * FROM todos WHERE id = ? AND deleted_at IS NULL', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: '待办不存在' });
    }

    await pool.execute(
      'UPDATE todos SET title = COALESCE(?, title), priority = COALESCE(?, priority), type = COALESCE(?, type) WHERE id = ?',
      [title || null, priority || null, type || null, id]
    );

    const [rows] = await pool.execute('SELECT * FROM todos WHERE id = ?', [id]);
    res.json({ todo: rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validTransitions = {
      pending: ['processing'],
      processing: ['done', 'pending'],
      done: [],
    };

    const [existing] = await pool.execute('SELECT * FROM todos WHERE id = ? AND deleted_at IS NULL', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: '待办不存在' });
    }

    const current = existing[0].status;
    if (!validTransitions[current].includes(status)) {
      return res.status(400).json({ error: `不能从 ${current} 切换到 ${status}` });
    }

    await pool.execute('UPDATE todos SET status = ? WHERE id = ?', [status, id]);

    const [rows] = await pool.execute('SELECT * FROM todos WHERE id = ?', [id]);
    res.json({ todo: rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.execute('UPDATE todos SET deleted_at = NOW() WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
