const pool = require('../config/db');

exports.listThreads = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT mt.*, tp.unread
       FROM message_threads mt
       JOIN thread_participants tp ON mt.id = tp.thread_id AND tp.user_id = ?
       ORDER BY mt.pinned DESC, mt.updated_at DESC`,
      [req.user.id]
    );
    res.json({ threads: rows });
  } catch (err) {
    next(err);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Mark as read
    await pool.execute(
      'UPDATE thread_participants SET unread = 0, last_read_at = NOW() WHERE thread_id = ? AND user_id = ?',
      [id, req.user.id]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM message_history WHERE thread_id = ? ORDER BY created_at ASC',
      [id]
    );

    res.json({ history: rows });
  } catch (err) {
    next(err);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, type } = req.body;

    if (!content) {
      return res.status(400).json({ error: '消息不能为空' });
    }

    // Insert the user's message
    const [result] = await pool.execute(
      `INSERT INTO message_history (thread_id, sender_id, sender_type, sender_name, type, content)
       SELECT ?, ?, 'self', u.name, ?, ?
       FROM users u WHERE u.id = ?`,
      [id, req.user.id, type || 'text', content, req.user.id]
    );

    // Update thread timestamp
    await pool.execute('UPDATE message_threads SET updated_at = NOW() WHERE id = ?', [id]);

    // Increment unread for other participants
    await pool.execute(
      'UPDATE thread_participants SET unread = unread + 1 WHERE thread_id = ? AND user_id != ?',
      [id, req.user.id]
    );

    const [rows] = await pool.execute('SELECT * FROM message_history WHERE id = ?', [result.insertId]);
    res.status(201).json({ message: rows[0] });
  } catch (err) {
    next(err);
  }
};
