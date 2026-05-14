const { Router } = require('express');
const { login, register, me } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticate, me);

module.exports = router;
