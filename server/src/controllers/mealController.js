const { models } = require('../config/db');

// Role checks
const ROLE = {
    MEMBER: 1,
    PT: 2,
    ADMIN: 3
};

// GET /api/meal-plans
// Get all meal plans (filtered by role)
exports.getAllMealPlans = async (req, res) => {
    try {
        const { roleId, userId } = req.user;
        let whereCondition = {};

        if (roleId === ROLE.MEMBER) {
            const member = await models.Members.findOne({ where: { user_id: userId } });
            if (!member) {
                return res.status(200).json([]);
            }
            whereCondition.member_id = member.member_id;

            // Auto-assign default templates disabled so members only see nutrition plans explicitly assigned by their PT
        } else if (roleId === ROLE.PT) {
            const trainer = await models.Trainers.findOne({ where: { user_id: userId } });
            if (!trainer) {
                return res.status(200).json([]);
            }
            whereCondition.trainer_id = trainer.trainer_id;
        }

        const plans = await models.MealPlans.findAll({
            where: whereCondition,
            include: [
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
        console.error('❌ Lỗi lấy danh sách kế hoạch ăn:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi lấy danh sách kế hoạch ăn!', error: error.message });
    }
};

// GET /api/meal-plans/:id
// Get a single meal plan by ID
exports.getMealPlanById = async (req, res) => {
    try {
        const { id } = req.params;
        const { roleId, userId } = req.user;

        const plan = await models.MealPlans.findByPk(id, {
            include: [
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
            return res.status(404).json({ message: 'Không tìm thấy kế hoạch ăn uống này!' });
        }

        // Authorization checks
        if (roleId === ROLE.MEMBER) {
            if (!plan.member || plan.member.user_id !== userId) {
                return res.status(403).json({ message: 'Bạn không có quyền xem kế hoạch ăn uống này!' });
            }
        } else if (roleId === ROLE.PT) {
            if (!plan.trainer || plan.trainer.user_id !== userId) {
                return res.status(403).json({ message: 'Bạn không có quyền xem kế hoạch ăn uống của huấn luyện viên khác!' });
            }
        }

        return res.status(200).json(plan);
    } catch (error) {
        console.error('❌ Lỗi lấy chi tiết kế hoạch ăn:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi lấy chi tiết kế hoạch ăn!', error: error.message });
    }
};

// POST /api/meal-plans
// Create a new meal plan
exports.createMealPlan = async (req, res) => {
    try {
        const { roleId, userId } = req.user;
        const { memberId, title, description, calories_per_day } = req.body;

        if (roleId !== ROLE.PT && roleId !== ROLE.ADMIN) {
            return res.status(403).json({ message: 'Chỉ có Huấn luyện viên hoặc Admin mới có quyền tạo kế hoạch ăn uống!' });
        }

        if (!memberId || !title) {
            return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ memberId và tiêu đề kế hoạch!' });
        }

        // Determine trainerId
        let trainerId;
        if (roleId === ROLE.PT) {
            const trainer = await models.Trainers.findOne({ where: { user_id: userId } });
            if (!trainer) {
                return res.status(400).json({ message: 'Không tìm thấy thông tin huấn luyện viên của bạn!' });
            }
            trainerId = trainer.trainer_id;
        } else {
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

        const newPlan = await models.MealPlans.create({
            trainer_id: trainerId,
            member_id: memberId,
            title,
            description,
            calories_per_day: parseInt(calories_per_day) || 0
        });

        return res.status(201).json({
            message: 'Tạo kế hoạch ăn uống thành công!',
            plan: newPlan
        });

    } catch (error) {
        console.error('❌ Lỗi tạo kế hoạch ăn uống:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi tạo kế hoạch ăn uống!', error: error.message });
    }
};

// PUT /api/meal-plans/:id
// Update a meal plan
exports.updateMealPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { roleId, userId } = req.user;
        const { title, description, calories_per_day } = req.body;

        if (roleId !== ROLE.PT && roleId !== ROLE.ADMIN) {
            return res.status(403).json({ message: 'Chỉ có Huấn luyện viên hoặc Admin mới có quyền cập nhật kế hoạch ăn uống!' });
        }

        const plan = await models.MealPlans.findByPk(id, {
            include: [{ model: models.Trainers, as: 'trainer' }]
        });

        if (!plan) {
            return res.status(404).json({ message: 'Không tìm thấy kế hoạch ăn uống cần sửa!' });
        }

        // Authorization checks
        if (roleId === ROLE.PT) {
            if (!plan.trainer || plan.trainer.user_id !== userId) {
                return res.status(403).json({ message: 'Bạn không có quyền sửa kế hoạch ăn uống của huấn luyện viên khác!' });
            }
        }

        await plan.update({
            title: title !== undefined ? title : plan.title,
            description: description !== undefined ? description : plan.description,
            calories_per_day: calories_per_day !== undefined ? (parseInt(calories_per_day) || 0) : plan.calories_per_day
        });

        return res.status(200).json({
            message: 'Cập nhật kế hoạch ăn uống thành công!',
            plan
        });

    } catch (error) {
        console.error('❌ Lỗi sửa kế hoạch ăn uống:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi cập nhật kế hoạch ăn uống!', error: error.message });
    }
};

// DELETE /api/meal-plans/:id
// Delete a meal plan
exports.deleteMealPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { roleId, userId } = req.user;

        if (roleId !== ROLE.PT && roleId !== ROLE.ADMIN) {
            return res.status(403).json({ message: 'Chỉ có Huấn luyện viên hoặc Admin mới có quyền xóa kế hoạch ăn uống!' });
        }

        const plan = await models.MealPlans.findByPk(id, {
            include: [{ model: models.Trainers, as: 'trainer' }]
        });

        if (!plan) {
            return res.status(404).json({ message: 'Không tìm thấy kế hoạch ăn uống cần xóa!' });
        }

        // Authorization checks
        if (roleId === ROLE.PT) {
            if (!plan.trainer || plan.trainer.user_id !== userId) {
                return res.status(403).json({ message: 'Bạn không có quyền xóa kế hoạch ăn uống của huấn luyện viên khác!' });
            }
        }

        await plan.destroy();

        return res.status(200).json({ message: 'Xóa kế hoạch ăn uống thành công!' });

    } catch (error) {
        console.error('❌ Lỗi xóa kế hoạch ăn uống:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi xóa kế hoạch ăn uống!', error: error.message });
    }
};

// GET /api/meal-plans/templates
exports.getMealTemplates = async (req, res) => {
    try {
        const { roleId, userId } = req.user;
        let sportFilter = null;

        if (roleId === ROLE.PT) {
            const trainer = await models.Trainers.findOne({ where: { user_id: userId } });
            if (trainer) {
                const trainerSpec = (trainer.specialization || '').toLowerCase();
                if (trainerSpec.includes('yoga')) {
                    sportFilter = 'Yoga';
                } else if (trainerSpec.includes('boxing')) {
                    sportFilter = 'Boxing';
                } else if (trainerSpec.includes('fitness') || trainerSpec.includes('bodybuilding') || trainerSpec.includes('gym')) {
                    sportFilter = 'Gym';
                } else {
                    sportFilter = trainer.specialization;
                }
            }
        } else if (roleId === ROLE.MEMBER) {
            const member = await models.Members.findOne({
                where: { user_id: userId },
                include: [{
                    model: models.MemberMemberships,
                    as: 'MemberMemberships',
                    where: { membership_status: 'Active' },
                    include: [{ model: models.MembershipPlans, as: 'membership_plan' }]
                }]
            });
            if (member && member.MemberMemberships && member.MemberMemberships.length > 0) {
                const sport = (member.MemberMemberships[0].membership_plan?.sport_type || '').toLowerCase();
                if (sport.includes('yoga')) sportFilter = 'Yoga';
                else if (sport.includes('boxing')) sportFilter = 'Boxing';
                else if (sport.includes('gym')) sportFilter = 'Gym';
            }
        }

        const config = await models.AppConfigs.findOne({ where: { config_key: 'meal_templates' } });
        let templates = [];
        if (config && config.config_value) {
            templates = JSON.parse(config.config_value);
        }

        if (sportFilter) {
            templates = templates.filter(t => t.sport_type.toLowerCase() === sportFilter.toLowerCase());
        }

        return res.status(200).json(templates);
    } catch (error) {
        console.error('❌ Lỗi lấy mẫu thực đơn:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi lấy mẫu thực đơn!', error: error.message });
    }
};
