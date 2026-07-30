const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');

// SSE route MUST come BEFORE authMiddleware because EventSource cannot set custom headers.
// Token authentication is handled inside the sseNotificationsStream handler via query string.
router.get('/notifications/stream', dashboardController.sseNotificationsStream);

// All other routes are protected by auth token
router.use(authMiddleware);

// --- ADMIN DASHBOARD ROUTES ---
router.get('/admin/stats', dashboardController.getAdminStats);
router.get('/admin/analytics', dashboardController.getAdminAnalytics);
router.get('/admin/users', dashboardController.getAdminUsers);
router.post('/admin/users', dashboardController.createUser);
router.get('/admin/check-email', dashboardController.checkEmailExists);
router.put('/admin/users/:id/status', dashboardController.toggleUserStatus);
router.get('/admin/trainers', dashboardController.getAdminTrainers);
router.get('/admin/trainers/:trainerId', dashboardController.getAdminTrainerDetail);
router.post('/admin/trainers', dashboardController.createTrainer);
router.get('/admin/plans', dashboardController.getAdminPlans);
router.post('/admin/plans', dashboardController.createAdminPlan);
router.put('/admin/plans/:id', dashboardController.updateAdminPlan);
router.delete('/admin/plans/:id', dashboardController.deleteAdminPlan);
router.get('/admin/appointments', dashboardController.getAdminAppointments);
router.put('/admin/appointments/:id/cancel', dashboardController.cancelAdminAppointment);
router.get('/api/admin/services', dashboardController.getAdminServices); // backward compatibility
router.get('/admin/services', dashboardController.getAdminServices);
router.post('/admin/services', dashboardController.createAdminService);
router.put('/admin/services/:id', dashboardController.toggleAdminService);
router.put('/admin/services/:id/update', dashboardController.updateAdminService);
router.delete('/admin/services/:id', dashboardController.deleteAdminService);

// Homepage Config routes
const uploadHomepageImages = require('../middlewares/uploadHomepageMiddleware');
router.get('/admin/homepage-config', dashboardController.getHomepageConfig);
router.put('/admin/homepage-config', uploadHomepageImages.single('image'), dashboardController.updateHomepageConfig);

// --- TRAINER DASHBOARD ROUTES ---
router.get('/trainer/members', dashboardController.getTrainerMembers);
router.get('/trainer/appointments', dashboardController.getTrainerAppointments);
router.put('/trainer/appointments/:id/confirm', dashboardController.confirmTrainerAppointment);
router.post('/trainer/assign-plan', dashboardController.assignPlanToMember);
router.post('/trainer/finish-progress', dashboardController.finishMemberProgress);
router.get('/trainer/schedule', dashboardController.getTrainerScheduleForDashboard);
router.post('/trainer/schedule/toggle', dashboardController.toggleTrainerSchedule);
router.post('/trainer/schedule/bulk-save', dashboardController.bulkSaveTrainerSchedule);

// --- TRAINER CANCEL ROUTES ---
router.put('/trainer/appointments/:id/cancel', dashboardController.requestTrainerAppointmentCancel);
router.put('/trainer/appointments/:id/cancel-respond', dashboardController.respondTrainerAppointmentCancel);

// --- MEMBER DASHBOARD ROUTES ---
router.get('/member/appointments', dashboardController.getMemberAppointments);
router.post('/member/appointments', dashboardController.createMemberAppointment);
router.put('/member/appointments/:id/cancel', dashboardController.requestMemberAppointmentCancel);
router.put('/member/appointments/:id/cancel-respond', dashboardController.respondMemberAppointmentCancel);
router.get('/member/my-trainers', dashboardController.getMemberTrainers);


// --- SSE & OFF-REQUEST ROUTES ---
router.get('/admin/off-requests', dashboardController.getAdminOffRequests);
router.get('/admin/approved-offs', dashboardController.getAdminApprovedOffs);
router.put('/admin/off-requests/:id/approve', dashboardController.approveOffRequest);
router.put('/admin/off-requests/:id/reject', dashboardController.rejectOffRequest);

router.get('/trainer/off-requests/quota', dashboardController.getOffRequestQuota);
router.get('/trainer/off-requests', dashboardController.getTrainerOffRequests);
router.post('/trainer/off-requests', dashboardController.createOffRequestByDay);
router.delete('/trainer/off-requests/:id', dashboardController.cancelOffRequest);


// --- CHECK-IN ROUTES ---
router.post('/admin/checkin/perform', dashboardController.performCheckIn);
router.get('/admin/checkins', dashboardController.getAdminCheckIns);
router.get('/member/checkins', dashboardController.getMemberCheckIns);
router.get('/member/checkin/status', dashboardController.getMemberCheckInStatus);

// QR Code endpoints for Member
router.get('/member/checkin/qr-code', dashboardController.getMemberQrCode);
router.post('/member/checkin/qr-code/regenerate', dashboardController.regenerateMemberQrCode);

// QR Code endpoints for Trainer
router.get('/trainer/checkin/qr-code', dashboardController.getTrainerQrCode);
router.post('/trainer/checkin/qr-code/regenerate', dashboardController.regenerateTrainerQrCode);

// Admin scanning endpoint
router.post('/admin/checkin/scan', dashboardController.performQrScan);

module.exports = router;
