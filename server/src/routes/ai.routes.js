const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { chat, summary } = require('../controllers/ai.controller');

const router = Router();

router.post('/chat',    authenticate, chat);
router.post('/summary', authenticate, summary);

module.exports = router;
