const { models, sequelize } = require('../config/db');

// Role checks
const ROLE = {
    MEMBER: 1,
    PT: 2,
    ADMIN: 3
};

// GET /api/workout-plans/members
// PT & Admin only: List all members with user profiles
exports.getMembersList = async (req, res) => {
    try {
        if (req.user.roleId !== ROLE.PT && req.user.roleId !== ROLE.ADMIN) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập thông tin này!' });
        }

        const members = await models.Members.findAll({
            include: [
                {
                    model: models.Users,
                    as: 'user',
                    attributes: ['full_name', 'email', 'phone_number']
                }
            ]
        });

        const list = members.map(m => ({
            member_id: m.member_id,
            fullName: m.user ? m.user.full_name : 'N/A',
            email: m.user ? m.user.email : 'N/A',
            phoneNumber: m.user ? m.user.phone_number : 'N/A',
            height: m.height,
            weight: m.weight,
            bmi: m.bmi,
            fitnessGoal: m.fitness_goal
        }));

        return res.status(200).json(list);
    } catch (error) {
        console.error('❌ Lỗi lấy danh sách hội viên:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi lấy danh sách hội viên!', error: error.message });
    }
};

// GET /api/workout-plans
// Get all workout plans (filtered by role)
exports.getAllWorkoutPlans = async (req, res) => {
    try {
        const { roleId, userId } = req.user;
        let whereCondition = {};

        if (roleId === ROLE.MEMBER) {
            const member = await models.Members.findOne({ where: { user_id: userId } });
            if (!member) {
                return res.status(200).json([]); // No plans if not a member yet
            }
            whereCondition.member_id = member.member_id;
        } else if (roleId === ROLE.PT) {
            const trainer = await models.Trainers.findOne({ where: { user_id: userId } });
            if (!trainer) {
                return res.status(200).json([]); // No plans if not a trainer yet
            }
            whereCondition.trainer_id = trainer.trainer_id;
        }

        const plans = await models.WorkoutPlans.findAll({
            where: whereCondition,
            include: [
                {
                    model: models.WorkoutExercises,
                    as: 'WorkoutExercises'
                },
                {
                    model: models.Members,
                    as: 'member',
                    include: [{ model: models.Users, as: 'user', attributes: ['full_name', 'email'] }]
                },
                {
                    model: models.Trainers,
                    as: 'trainer',
                    include: [{ model: models.Users, as: 'user', attributes: ['full_name', 'email'] }]
                }
            ],
            order: [['created_at', 'DESC']]
        });

        return res.status(200).json(plans);
    } catch (error) {
        console.error('❌ Lỗi lấy danh sách kế hoạch tập:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi lấy danh sách kế hoạch tập!', error: error.message });
    }
};

// GET /api/workout-plans/:id
// Get a single workout plan by ID
exports.getWorkoutPlanById = async (req, res) => {
    try {
        const { id } = req.params;
        const { roleId, userId } = req.user;

        const plan = await models.WorkoutPlans.findByPk(id, {
            include: [
                {
                    model: models.WorkoutExercises,
                    as: 'WorkoutExercises'
                },
                {
                    model: models.Members,
                    as: 'member',
                    include: [{ model: models.Users, as: 'user', attributes: ['user_id', 'full_name', 'email'] }]
                },
                {
                    model: models.Trainers,
                    as: 'trainer',
                    include: [{ model: models.Users, as: 'user', attributes: ['user_id', 'full_name', 'email'] }]
                }
            ]
        });

        if (!plan) {
            return res.status(404).json({ message: 'Không tìm thấy kế hoạch tập luyện này!' });
        }

        // Authorization checks
        if (roleId === ROLE.MEMBER) {
            if (!plan.member || plan.member.user_id !== userId) {
                return res.status(403).json({ message: 'Bạn không có quyền xem kế hoạch tập luyện này!' });
            }
        } else if (roleId === ROLE.PT) {
            if (!plan.trainer || plan.trainer.user_id !== userId) {
                return res.status(403).json({ message: 'Bạn không có quyền xem kế hoạch tập luyện của huấn luyện viên khác!' });
            }
        }

        return res.status(200).json(plan);
    } catch (error) {
        console.error('❌ Lỗi lấy chi tiết kế hoạch tập:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi lấy chi tiết kế hoạch tập!', error: error.message });
    }
};

// POST /api/workout-plans
// Create a new workout plan with exercises
exports.createWorkoutPlan = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { roleId, userId } = req.user;
        const { memberId, title, description, exercises } = req.body;

        if (roleId !== ROLE.PT && roleId !== ROLE.ADMIN) {
            return res.status(403).json({ message: 'Chỉ có Huấn luyện viên hoặc Admin mới có quyền tạo kế hoạch tập luyện!' });
        }

        if (!memberId || !title) {
            return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ memberId và tiêu đề kế hoạch!' });
        }

        // Determine trainer_id
        let trainerId;
        if (roleId === ROLE.PT) {
            const trainer = await models.Trainers.findOne({ where: { user_id: userId } });
            if (!trainer) {
                return res.status(400).json({ message: 'Không tìm thấy thông tin huấn luyện viên của bạn!' });
            }
            trainerId = trainer.trainer_id;
        } else {
            // Admin must provide trainer_id, or default to a trainer
            trainerId = req.body.trainerId;
            if (!trainerId) {
                const firstTrainer = await models.Trainers.findOne();
                if (!firstTrainer) {
                    return res.status(400).json({ message: 'Hệ thống chưa có huấn luyện viên nào. Không thể tạo kế hoạch!' });
                }
                trainerId = firstTrainer.trainer_id;
            }
        }

        // Verify member exists
        const member = await models.Members.findByPk(memberId);
        if (!member) {
            return res.status(400).json({ message: 'Không tìm thấy hội viên được chọn!' });
        }

        // Create the WorkoutPlan
        const newPlan = await models.WorkoutPlans.create({
            trainer_id: trainerId,
            member_id: memberId,
            title,
            description,
            created_at: new Date()
        }, { transaction });

        // Create exercises if provided
        if (exercises && Array.isArray(exercises) && exercises.length > 0) {
            const exercisesToCreate = exercises.map(ex => ({
                workout_plan_id: newPlan.workout_plan_id,
                exercise_name: ex.exercise_name,
                sets: parseInt(ex.sets) || 0,
                reps: parseInt(ex.reps) || 0,
                duration_minutes: parseInt(ex.duration_minutes) || 0,
                calories_burned: parseInt(ex.calories_burned) || 0
            }));
            await models.WorkoutExercises.bulkCreate(exercisesToCreate, { transaction });
        }

        await transaction.commit();

        // Fetch complete created plan
        const createdPlan = await models.WorkoutPlans.findByPk(newPlan.workout_plan_id, {
            include: [
                { model: models.WorkoutExercises, as: 'WorkoutExercises' },
                { model: models.Members, as: 'member', include: [{ model: models.Users, as: 'user', attributes: ['full_name'] }] }
            ]
        });

        return res.status(201).json({
            message: 'Tạo kế hoạch tập luyện thành công!',
            plan: createdPlan
        });

    } catch (error) {
        await transaction.rollback();
        console.error('❌ Lỗi tạo kế hoạch tập luyện:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi tạo kế hoạch tập luyện!', error: error.message });
    }
};

// PUT /api/workout-plans/:id
// Update workout plan and replace exercises
exports.updateWorkoutPlan = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { roleId, userId } = req.user;
        const { title, description, exercises } = req.body;

        if (roleId !== ROLE.PT && roleId !== ROLE.ADMIN) {
            return res.status(403).json({ message: 'Chỉ có Huấn luyện viên hoặc Admin mới có quyền cập nhật kế hoạch tập luyện!' });
        }

        const plan = await models.WorkoutPlans.findByPk(id, {
            include: [{ model: models.Trainers, as: 'trainer' }]
        });

        if (!plan) {
            return res.status(404).json({ message: 'Không tìm thấy kế hoạch tập luyện cần sửa!' });
        }

        // Authorization checks
        if (roleId === ROLE.PT) {
            if (!plan.trainer || plan.trainer.user_id !== userId) {
                return res.status(403).json({ message: 'Bạn không có quyền sửa kế hoạch tập luyện của huấn luyện viên khác!' });
            }
        }

        // Update basic fields
        await plan.update({
            title: title !== undefined ? title : plan.title,
            description: description !== undefined ? description : plan.description,
            updated_at: new Date()
        }, { transaction });

        // Update exercises if provided
        if (exercises && Array.isArray(exercises)) {
            // Delete old exercises
            await models.WorkoutExercises.destroy({
                where: { workout_plan_id: id }
            }, { transaction });

            // Bulk create new exercises
            if (exercises.length > 0) {
                const exercisesToCreate = exercises.map(ex => ({
                    workout_plan_id: id,
                    exercise_name: ex.exercise_name,
                    sets: parseInt(ex.sets) || 0,
                    reps: parseInt(ex.reps) || 0,
                    duration_minutes: parseInt(ex.duration_minutes) || 0,
                    calories_burned: parseInt(ex.calories_burned) || 0
                }));
                await models.WorkoutExercises.bulkCreate(exercisesToCreate, { transaction });
            }
        }

        await transaction.commit();

        const updatedPlan = await models.WorkoutPlans.findByPk(id, {
            include: [
                { model: models.WorkoutExercises, as: 'WorkoutExercises' },
                { model: models.Members, as: 'member', include: [{ model: models.Users, as: 'user', attributes: ['full_name'] }] }
            ]
        });

        return res.status(200).json({
            message: 'Cập nhật kế hoạch tập luyện thành công!',
            plan: updatedPlan
        });

    } catch (error) {
        await transaction.rollback();
        console.error('❌ Lỗi sửa kế hoạch tập luyện:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi cập nhật kế hoạch tập luyện!', error: error.message });
    }
};

// DELETE /api/workout-plans/:id
// Delete workout plan and its exercises
exports.deleteWorkoutPlan = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { roleId, userId } = req.user;

        if (roleId !== ROLE.PT && roleId !== ROLE.ADMIN) {
            return res.status(403).json({ message: 'Chỉ có Huấn luyện viên hoặc Admin mới có quyền xóa kế hoạch tập luyện!' });
        }

        const plan = await models.WorkoutPlans.findByPk(id, {
            include: [{ model: models.Trainers, as: 'trainer' }]
        });

        if (!plan) {
            return res.status(404).json({ message: 'Không tìm thấy kế hoạch tập luyện cần xóa!' });
        }

        // Authorization checks
        if (roleId === ROLE.PT) {
            if (!plan.trainer || plan.trainer.user_id !== userId) {
                return res.status(403).json({ message: 'Bạn không có quyền xóa kế hoạch tập luyện của huấn luyện viên khác!' });
            }
        }

        // Delete associated exercises
        await models.WorkoutExercises.destroy({
            where: { workout_plan_id: id }
        }, { transaction });

        // Delete plan
        await plan.destroy({ transaction });

        await transaction.commit();

        return res.status(200).json({ message: 'Xóa kế hoạch tập luyện thành công!' });

    } catch (error) {
        await transaction.rollback();
        console.error('❌ Lỗi xóa kế hoạch tập luyện:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi xóa kế hoạch tập luyện!', error: error.message });
    }
};
