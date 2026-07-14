const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middlewares/authMiddleware');

// All booking routes are protected by auth token
router.use(authMiddleware);

router.get('/member/packages', bookingController.getMemberTrainerPackages);
router.get('/trainer/:trainerId/schedule', bookingController.getTrainerSchedule);
router.post('/member', bookingController.createBooking);
router.delete('/member/:id', bookingController.cancelBooking);
router.get('/member/history', bookingController.getMemberBookingHistory);
router.get('/pt/pending', bookingController.getPtPendingBookings);
router.put('/pt/:id/approve', bookingController.approveBooking);
router.put('/pt/:id/reject', bookingController.rejectBooking);

module.exports = router;
