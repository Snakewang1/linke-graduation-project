const { Router } = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const { list, getOne, update, push, getLogs } = require('../controllers/integration.controller');

const router = Router();

router.get('/',               authenticate, list);
router.get('/:id',            authenticate, getOne);
router.patch('/:id',          authenticate, requireRole('admin'), update);
router.post('/:id/push',      authenticate, requireRole('admin'), push);
router.get('/:id/logs',       authenticate, requireRole('admin'), getLogs);

module.exports = router;
