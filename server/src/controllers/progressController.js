const { models } = require('../config/db');

const ROLE = { MEMBER: 1, PT: 2, ADMIN: 3 };

// GET /api/progress/:memberId
// PT xem progress tracking của một member, hoặc Member xem của chính mình
exports.getProgressByMember = async (req, res) => {
    try {
        const { memberId } = req.params;
        const { roleId, userId } = req.user;

        // Authorization: PT có thể xem tất cả, Member chỉ xem của mình
        if (roleId === ROLE.MEMBER) {
            const member = await models.Members.findOne({ where: { user_id: userId } });
            if (!member || member.member_id !== parseInt(memberId)) {
                return res.status(403).json({ message: 'Bạn không có quyền xem thông tin này!' });
            }
        }

        const progress = await models.ProgressTrackings.findAll({
            where: { member_id: memberId },
            order: [['recorded_date', 'DESC']]
        });

        // Get member info
        const member = await models.Members.findByPk(memberId, {
            include: [{ model: models.Users, as: 'user', attributes: ['full_name', 'email'] }]
        });

        return res.status(200).json({
            member: member ? {
                memberId: member.member_id,
                fullName: member.user?.full_name || 'N/A',
                email: member.user?.email || 'N/A',
                currentHeight: member.height,
                currentWeight: member.weight,
                currentBmi: member.bmi
            } : null,
            progress
        });
    } catch (error) {
        console.error('❌ Lỗi lấy progress tracking:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi lấy progress tracking!', error: error.message });
    }
};

// POST /api/progress
// Ghi nhận một measurement mới cho member
exports.addProgress = async (req, res) => {
    try {
        const { memberId, height, weight, bodyFat, muscleMass, note } = req.body;
        const { roleId, userId } = req.user;

        if (!memberId) {
            return res.status(400).json({ message: 'Vui lòng cung cấp memberId!' });
        }

        // Authorization: chỉ PT hoặc chính member đó mới được ghi nhận
        if (roleId === ROLE.MEMBER) {
            const member = await models.Members.findOne({ where: { user_id: userId } });
            if (!member || member.member_id !== parseInt(memberId)) {
                return res.status(403).json({ message: 'Bạn không có quyền ghi nhận thông tin này!' });
            }
        }

        const newProgress = await models.ProgressTrackings.create({
            member_id: memberId,
            height: height ? parseFloat(height) : null,
            weight: weight ? parseFloat(weight) : null,
            body_fat: bodyFat ? parseFloat(bodyFat) : null,
            muscle_mass: muscleMass ? parseFloat(muscleMass) : null,
            note: note || null
        });

        // Also update current height/weight on Members table
        const member = await models.Members.findByPk(memberId);
        if (member) {
            const updateData = {};
            if (height) updateData.height = parseFloat(height);
            if (weight) updateData.weight = parseFloat(weight);
            if (Object.keys(updateData).length > 0) {
                await member.update(updateData);
            }
        }

        return res.status(201).json({
            message: 'Ghi nhận progress tracking thành công!',
            progress: newProgress
        });
    } catch (error) {
        console.error('❌ Lỗi ghi nhận progress:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi ghi nhận progress!', error: error.message });
    }
};
