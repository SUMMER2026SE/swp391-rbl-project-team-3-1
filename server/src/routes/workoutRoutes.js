const express = require('express');
const router = express.Router();
const workoutController = require('../controllers/workoutController');
const authMiddleware = require('../middlewares/authMiddleware');

// All workout plan routes require authentication
router.use(authMiddleware);

// Get members list for dropdown (PT/Admin only)
router.get('/members', workoutController.getMembersList);

// CRUD routes
router.get('/', workoutController.getAllWorkoutPlans);
router.get('/:id', workoutController.getWorkoutPlanById);
router.post('/', workoutController.createWorkoutPlan);
router.put('/:id', workoutController.updateWorkoutPlan);
router.delete('/:id', workoutController.deleteWorkoutPlan);

module.exports = router;
