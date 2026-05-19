const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { chat, summary } = require('../controllers/ai.controller');

const router = Router();

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: AI 智能对话
 *     description: |
 *       调用 DeepSeek Chat 大模型进行多轮智能对话。
 *       服务端根据 JWT 中解析的用户角色注入对应的 System Prompt：
 *       admin 角色获得战略分析风格回复，staff 角色获得任务执行指导风格回复。
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [prompt]
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: 用户输入的自然语言问题
 *                 example: 我现在有哪些待处理任务？
 *               history:
 *                 type: array
 *                 description: 多轮对话历史
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant]
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: AI 回复
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reply:
 *                   type: string
 *                   example: 您好张总，当前系统有3条待处理任务...
 */
router.post('/chat', authenticate, chat);

/**
 * @swagger
 * /api/ai/summary:
 *   post:
 *     summary: AI 待办汇总
 *     description: 调用 DeepSeek 对当前待办任务进行智能汇总并给出优先级建议
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               todoIds:
 *                 type: array
 *                 items: { type: integer }
 *                 description: 待汇总的待办 ID，为空则汇总全部待处理
 *     responses:
 *       200:
 *         description: AI 汇总结果
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: string
 */
router.post('/summary', authenticate, summary);

module.exports = router;
