const express = require('express');
const router = express.Router();
const certificationController = require('../controllers/certificationController');
const authMiddleware = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

router.get('/', certificationController.getMyCertifications);
router.post('/', certificationController.addCertification);
router.put('/:id', certificationController.updateCertification);
router.delete('/:id', certificationController.deleteCertification);

module.exports = router;
