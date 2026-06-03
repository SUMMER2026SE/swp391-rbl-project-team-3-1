const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', authMiddleware, profileController.getProfile);
router.put('/avatar', authMiddleware, upload.single('avatar'), profileController.updateAvatar);

module.exports = router;
