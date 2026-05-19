const { Router } = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const { list, create, update, updateStatus, remove } = require('../controllers/todo.controller');

const router = Router();

/**
 * @swagger
 * /api/todos:
 *   get:
 *     summary: 获取待办列表
 *     description: |
 *       管理员返回全部待办；普通员工仅返回自己的待办。
 *       支持按状态和优先级筛选。
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, done]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [high, medium, low]
 *     responses:
 *       200:
 *         description: 待办列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 todos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Todo'
 */
router.get('/', authenticate, list);

/**
 * @swagger
 * /api/todos:
 *   post:
 *     summary: 创建待办
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 example: 采购审批
 *               source:
 *                 type: string
 *                 example: ERP系统
 *               type:
 *                 type: string
 *                 default: 任务
 *               priority:
 *                 type: string
 *                 enum: [high, medium, low]
 *                 default: medium
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 todo:
 *                   $ref: '#/components/schemas/Todo'
 */
router.post('/', authenticate, create);

/**
 * @swagger
 * /api/todos/{id}:
 *   patch:
 *     summary: 更新待办内容
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               priority: { type: string, enum: [high, medium, low] }
 *               type: { type: string }
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.patch('/:id', authenticate, update);

/**
 * @swagger
 * /api/todos/{id}/status:
 *   patch:
 *     summary: 更新待办状态
 *     description: |
 *       状态流转规则：pending → processing → done
 *       processing 可回退到 pending，done 不可回退
 *     tags: [Todos]
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, done]
 *     responses:
 *       200:
 *         description: 状态更新成功
 *       400:
 *         description: 无效的状态转换
 */
router.patch('/:id/status', authenticate, updateStatus);

/**
 * @swagger
 * /api/todos/{id}:
 *   delete:
 *     summary: 删除待办（管理员，软删除）
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 删除成功
 *       403:
 *         description: 权限不足
 */
router.delete('/:id', authenticate, requireRole('admin'), remove);

module.exports = router;
