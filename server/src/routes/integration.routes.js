const { Router } = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const { list, getOne, update, push, getLogs } = require('../controllers/integration.controller');

const router = Router();

/**
 * @swagger
 * /api/integrations:
 *   get:
 *     summary: 获取所有异构系统集成
 *     description: 返回已接入的四套异构系统（ERP/OA/CRM/财务）及其连接状态
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 集成列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 integrations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Integration'
 */
router.get('/', authenticate, list);

/**
 * @swagger
 * /api/integrations/{id}:
 *   get:
 *     summary: 获取单个集成详情
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: 集成系统 ID（erp / finance / oa / crm）
 *     responses:
 *       200:
 *         description: 集成详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 integration:
 *                   $ref: '#/components/schemas/Integration'
 *       404:
 *         description: 集成不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authenticate, getOne);

/**
 * @swagger
 * /api/integrations/{id}:
 *   patch:
 *     summary: 更新集成配置（管理员）
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [connected, disconnected, error]
 *               webhookEndpoint:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新后的集成
 *       403:
 *         description: 权限不足（仅管理员）
 */
router.patch('/:id', authenticate, requireRole('admin'), update);

/**
 * @swagger
 * /api/integrations/{id}/push:
 *   post:
 *     summary: 异构系统数据推送（管理员）
 *     description: |
 *       模拟外部异构系统向 LinkE 推送业务数据。接收推送后自动创建待办任务、
 *       写入集成调用日志（direction=push），并向所有用户广播通知消息。
 *       这是 LinkE 与 ERP/OA/CRM/财务等外部系统对接的核心入口。
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: 集成系统 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payload:
 *                 type: string
 *                 description: 业务数据内容
 *                 example: '新订单 #ORD202403 已确认，金额 ¥50,000'
 *     responses:
 *       201:
 *         description: 推送成功，待办已创建
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 todo:
 *                   $ref: '#/components/schemas/Todo'
 *       403:
 *         description: 权限不足
 */
router.post('/:id/push', authenticate, requireRole('admin'), push);

/**
 * @swagger
 * /api/integrations/{id}/logs:
 *   get:
 *     summary: 获取集成调用日志（管理员）
 *     description: 返回最近 50 条 Push/Pull 调用记录，用于链路追踪与审计
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 调用日志列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/IntegrationLog'
 */
router.get('/:id/logs', authenticate, requireRole('admin'), getLogs);

module.exports = router;
