const express = require('express');
const { listForUser, markRead } = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/notifications', authMiddleware, listForUser);
router.post('/notifications/:id/read', authMiddleware, markRead);

module.exports = router;
