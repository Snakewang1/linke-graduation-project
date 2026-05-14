const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { sign } = require('../utils/jwt');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: '请输入邮箱和密码' });
    }

    const [rows] = await pool.execute(
      'SELECT id, name, email, password, role, avatar, dept FROM users WHERE email = ?',
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const token = sign({ id: user.id, role: user.role });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        dept: user.dept,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, dept } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: '请填写必填字段' });
    }

    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: '该邮箱已被注册' });
    }

    const hash = await bcrypt.hash(password, 10);
    const id = 'U' + String(Date.now()).slice(-6);

    await pool.execute(
      'INSERT INTO users (id, name, email, password, role, avatar, dept) VALUES (?,?,?,?,?,?,?)',
      [id, name, email, hash, 'staff', '👤', dept || null]
    );

    const token = sign({ id, role: 'staff' });

    res.status(201).json({
      token,
      user: { id, name, email, role: 'staff', avatar: '👤', dept: dept || null },
    });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, avatar, dept FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
};
