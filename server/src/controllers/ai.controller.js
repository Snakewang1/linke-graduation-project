const deepseek = require('../services/deepseek.service');
const pool = require('../config/db');

exports.chat = async (req, res, next) => {
  try {
    const { prompt, history } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: '请输入问题' });
    }

    const reply = await deepseek.chat({
      prompt,
      history: history || [],
      role: req.user.role,
    });

    res.json({ reply });
  } catch (err) {
    next(err);
  }
};

exports.summary = async (req, res, next) => {
  try {
    const { todoIds } = req.body;

    let todos;
    if (todoIds && todoIds.length > 0) {
      const placeholders = todoIds.map(() => '?').join(',');
      const [rows] = await pool.execute(
        `SELECT title, priority, source FROM todos WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
        todoIds
      );
      todos = rows;
    } else {
      const [rows] = await pool.execute(
        `SELECT title, priority, source FROM todos WHERE user_id = ? AND status = 'pending' AND deleted_at IS NULL`,
        [req.user.id]
      );
      todos = rows;
    }

    if (todos.length === 0) {
      return res.json({ summary: '当前没有待处理的任务，干得漂亮！' });
    }

    const taskList = todos.map((t, i) => `${i + 1}. [${t.source}] ${t.title}（${t.priority === 'high' ? '紧急' : '普通'}）`).join('\n');
    const prompt = `请汇总以下待办任务并给出核心建议：\n\n${taskList}`;

    const summary = await deepseek.chat({
      prompt,
      history: [],
      role: req.user.role,
    });

    res.json({ summary });
  } catch (err) {
    next(err);
  }
};
