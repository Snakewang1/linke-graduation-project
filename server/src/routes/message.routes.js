const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { listThreads, getHistory, sendMessage } = require('../controllers/message.controller');

const router = Router();

router.get('/',              authenticate, listThreads);
router.get('/:id/history',   authenticate, getHistory);
router.post('/:id/history',  authenticate, sendMessage);

module.exports = router;
