const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middlewares/authMiddleware');

// POST /api/ai/consult (Public - auth headers are parsed optionally inside the controller)
router.post('/consult', aiController.consult);

// POST /api/ai/chat (Public chatbot interaction endpoint)
router.post('/chat', aiController.chat);

// GET /api/ai/history (Protected - only for authenticated members to view their past advice)
router.get('/history', authMiddleware, aiController.getHistory);

module.exports = router;
