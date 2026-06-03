const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController');
const authMiddleware = require('../middlewares/authMiddleware');

// All meal plan routes require authentication
router.use(authMiddleware);

// CRUD routes
router.get('/', mealController.getAllMealPlans);
router.get('/:id', mealController.getMealPlanById);
router.post('/', mealController.createMealPlan);
router.put('/:id', mealController.updateMealPlan);
router.delete('/:id', mealController.deleteMealPlan);

module.exports = router;
