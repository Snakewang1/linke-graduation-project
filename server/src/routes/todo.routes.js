const { Router } = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const { list, create, update, updateStatus, remove } = require('../controllers/todo.controller');

const router = Router();

router.get('/',     authenticate, list);
router.post('/',    authenticate, create);
router.patch('/:id',         authenticate, update);
router.patch('/:id/status',  authenticate, updateStatus);
router.delete('/:id',        authenticate, requireRole('admin'), remove);

module.exports = router;
