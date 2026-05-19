const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { listThreads, getHistory, sendMessage } = require('../controllers/message.controller');

const router = Router();

/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: 获取消息会话列表
 *     description: 返回当前用户参与的所有消息线程，置顶优先，按更新时间倒序
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 会话列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 threads:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MessageThread'
 */
router.get('/', authenticate, listThreads);

/**
 * @swagger
 * /api/messages/{id}/history:
 *   get:
 *     summary: 获取消息历史
 *     description: 获取指定线程的全部消息，同时将当前用户未读计数清零
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: 消息线程 ID
 *     responses:
 *       200:
 *         description: 消息历史
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 history:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 */
router.get('/:id/history', authenticate, getHistory);

/**
 * @swagger
 * /api/messages/{id}/history:
 *   post:
 *     summary: 发送消息
 *     description: 向指定线程发送消息，自动更新线程时间戳并为其他参与者增加未读计数
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 example: 大家好，方案已更新
 *               type:
 *                 type: string
 *                 enum: [text, file]
 *                 default: text
 *     responses:
 *       201:
 *         description: 消息已发送
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   $ref: '#/components/schemas/Message'
 */
router.post('/:id/history', authenticate, sendMessage);

module.exports = router;
