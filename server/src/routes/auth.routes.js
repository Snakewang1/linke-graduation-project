const { Router } = require('express');
const { login, register, me } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 用户登录
 *     description: 通过邮箱和密码登录，返回 JWT Token 和用户信息。密码使用 bcrypt 校验。
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@linke.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: admin123
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT Token，有效期 7 天
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: 邮箱或密码错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 用户注册
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: 新员工
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               dept:
 *                 type: string
 *                 example: 研发部
 *     responses:
 *       201:
 *         description: 注册成功，返回 token 和用户信息
 *       409:
 *         description: 该邮箱已被注册
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: 获取当前用户信息
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 当前用户
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: 未登录
 */
router.get('/me', authenticate, me);

module.exports = router;
