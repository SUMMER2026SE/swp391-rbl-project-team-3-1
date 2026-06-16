const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/:memberId', progressController.getProgressByMember);
router.post('/', progressController.addProgress);

module.exports = router;
