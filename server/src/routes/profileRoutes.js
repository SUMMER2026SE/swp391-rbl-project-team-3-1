const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const uploadAvatar = require('../middlewares/uploadAvatarMiddleware'); 
const profileController = require('../controllers/profileController');

router.get('/', authMiddleware, profileController.getMyProfile);
router.put('/', authMiddleware, profileController.updateMyProfile);
router.put('/avatar', authMiddleware, uploadAvatar.single('avatar'), profileController.updateMyAvatar);

module.exports = router;