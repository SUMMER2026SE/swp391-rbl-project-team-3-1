const fs = require('fs');
const path = require('path');
const { models } = require('../config/db');

// Role trong SQL hiện tại:
// 1 = Member, 2 = PT, 3 = Admin
const ROLE = {
    MEMBER: 1,
    PT: 2,
    ADMIN: 3
};

const buildAvatarUrl = (req, avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    return `${req.protocol}://${req.get('host')}${avatarPath}`;
};

const removeOldLocalAvatar = (avatarUrl) => {
    if (!avatarUrl || !avatarUrl.startsWith('/uploads/avatars/')) return;

    const filePath = path.join(__dirname, '../../public', avatarUrl);

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

const getRoleName = (roleId) => {
    if (roleId === ROLE.MEMBER) return 'Member';
    if (roleId === ROLE.PT) return 'PT';
    if (roleId === ROLE.ADMIN) return 'Admin';
    return 'Unknown';
};

const findTrainerForSportType = (workoutPlans, sportType) => {
    if (!workoutPlans || workoutPlans.length === 0 || !sportType) return 'Chưa đăng ký';
    
    const sType = sportType.toLowerCase().trim();
    
    let matchedPlan = workoutPlans.find(wp => {
        const spec = wp.trainer?.specialization?.toLowerCase() || '';
        return spec.includes(sType) || sType.includes(spec);
    });

    if (!matchedPlan && sType === 'gym') {
        matchedPlan = workoutPlans.find(wp => {
            const spec = wp.trainer?.specialization?.toLowerCase() || '';
            return spec.includes('fitness') || spec.includes('bodybuilding') || spec.includes('gym') || spec.includes('pt');
        });
    }

    if (!matchedPlan && sType === 'yoga') {
        matchedPlan = workoutPlans.find(wp => {
            const spec = wp.trainer?.specialization?.toLowerCase() || '';
            return spec.includes('yoga');
        });
    }

    if (matchedPlan && matchedPlan.trainer?.user?.full_name) {
        return matchedPlan.trainer.user.full_name;
    }
    
    return 'Chưa đăng ký';
};

// =====================================================
// 1. XEM PROFILE
// GET /api/profile
// Header: Authorization: Bearer <token>
// =====================================================
exports.getMyProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await models.Users.findByPk(userId, {
            attributes: {
                exclude: ['password_hash']
            },
            include: [
                {
                    model: models.Roles,
                    as: 'role',
                    attributes: ['role_id', 'role_name']
                },
                {
                    model: models.Members,
                    as: 'Member',
                    required: false,
                    include: [
                        {
                            model: models.MemberMemberships,
                            as: 'MemberMemberships',
                            required: false,
                            include: [
                                {
                                    model: models.MembershipPlans,
                                    as: 'membership_plan',
                                    required: false
                                }
                            ]
                        },
                        {
                            model: models.WorkoutPlans,
                            as: 'WorkoutPlans',
                            required: false,
                            include: [
                                {
                                    model: models.Trainers,
                                    as: 'trainer',
                                    required: false,
                                    include: [
                                        {
                                            model: models.Users,
                                            as: 'user',
                                            required: false,
                                            attributes: ['user_id', 'full_name', 'avatar_url']
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            model: models.MemberServices,
                            as: 'MemberServices',
                            required: false,
                            include: [
                                {
                                    model: models.Services,
                                    as: 'service',
                                    required: false
                                }
                            ]
                        }
                    ]
                },
                {
                    model: models.Trainers,
                    as: 'Trainer',
                    required: false
                }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
        }

        if (user.status !== 'Active') {
            return res.status(403).json({ message: 'Tài khoản không ở trạng thái Active!' });
        }

        // Tính toán các thông tin bổ sung cho Member Dashboard
        let remainingDays = 0;
        let activePtName = 'Chưa đăng ký';
        let planName = 'Chưa đăng ký';
        let membershipsList = [];

        if (user.role_id === ROLE.MEMBER && user.Member) {
            // Lấy danh sách gói tập đã đăng ký
            membershipsList = (user.Member.MemberMemberships || []).map(m => {
                const endDate = new Date(m.end_date);
                const diffTime = endDate - new Date();
                let daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (daysLeft < 0) daysLeft = 0;

                let status = m.membership_status;
                if (status === 'Active' && daysLeft === 0) {
                    status = 'Expired';
                }

                return {
                    memberMembershipId: m.member_membership_id,
                    planId: m.membership_plan_id,
                    planName: m.membership_plan?.plan_name || 'Gói tập',
                    sportType: m.membership_plan?.sport_type || 'Gym',
                    startDate: m.start_date,
                    endDate: m.end_date,
                    status: status,
                    remainingDays: daysLeft,
                    price: m.membership_plan?.price ? Number(m.membership_plan.price) : 0,
                    durationMonths: m.membership_plan?.duration_months || 1,
                    description: m.membership_plan?.description || '',
                    trainerName: findTrainerForSportType(user.Member.WorkoutPlans || [], m.membership_plan?.sport_type)
                };
            });

            // Lấy thông tin Membership đang hoạt động
            const activeMembership = user.Member.MemberMemberships?.find(
                m => m.membership_status === 'Active'
            );
            if (activeMembership) {
                planName = activeMembership.membership_plan?.plan_name || 'Gói tập';
                const endDate = new Date(activeMembership.end_date);
                const diffTime = endDate - new Date();
                remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (remainingDays < 0) remainingDays = 0;
            }

            // Lấy thông tin HLV đang liên kết:
            // 1. Ưu tiên giáo án tự động tạo lúc đăng ký/mua gói từ đầu (Lộ trình luyện tập với HLV...)
            let workoutPlanWithPt = user.Member.WorkoutPlans?.find(
                wp => wp.title && wp.title.startsWith('Lộ trình luyện tập với HLV') && wp.trainer?.user?.full_name
            );

            // 2. Nếu không có giáo án đăng ký từ đầu, lấy giáo án mới nhất được giao gần đây
            if (!workoutPlanWithPt && user.Member.WorkoutPlans?.length > 0) {
                const sortedPlans = [...user.Member.WorkoutPlans].sort(
                    (a, b) => b.workout_plan_id - a.workout_plan_id
                );
                workoutPlanWithPt = sortedPlans.find(
                    wp => wp.trainer?.user?.full_name
                );
            }

            if (workoutPlanWithPt) {
                activePtName = workoutPlanWithPt.trainer.user.full_name;
            }

            // Lấy danh sách dịch vụ đã đăng ký
            var servicesList = (user.Member.MemberServices || []).map(ms => {
                const endDate = new Date(ms.end_date);
                const diffTime = endDate - new Date();
                let daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (daysLeft < 0) daysLeft = 0;

                let status = ms.service_status;
                if (status === 'Active' && daysLeft === 0) {
                    status = 'Expired';
                }

                return {
                    memberServiceId: ms.member_service_id,
                    serviceId: ms.service_id,
                    serviceName: ms.service?.service_name || 'Dịch vụ',
                    description: ms.service?.description || '',
                    price: ms.service?.price ? Number(ms.service.price) : 0,
                    startDate: ms.start_date,
                    endDate: ms.end_date,
                    status: status,
                    remainingDays: daysLeft
                };
            });
        }

        return res.status(200).json({
            message: 'Lấy thông tin profile thành công!',
            profile: {
                userId: user.user_id,
                fullName: user.full_name,
                email: user.email,
                phoneNumber: user.phone_number,
                gender: user.gender,
                dateOfBirth: user.date_of_birth,
                avatarUrl: buildAvatarUrl(req, user.avatar_url),
                role: user.role || {
                    role_id: user.role_id,
                    role_name: getRoleName(user.role_id)
                },
                memberInfo: user.Member ? {
                    member_id: user.Member.member_id,
                    height: user.Member.height,
                    weight: user.Member.weight,
                    bmi: user.Member.bmi,
                    fitness_goal: user.Member.fitness_goal,
                    fitness_level: user.Member.fitness_level,
                    emergency_contact: user.Member.emergency_contact,
                    joined_date: user.Member.joined_date,
                    remainingDays,
                    activePtName,
                    planName,
                    memberships: membershipsList,
                    services: servicesList || []
                } : null,
                trainerInfo: user.Trainer || null
            }
        });
    } catch (error) {
        console.error('❌ Lỗi xem profile:', error.message);
        return res.status(500).json({
            message: 'Lỗi server khi xem profile!',
            error: error.message
        });
    }
};

// =====================================================
// 2. EDIT PROFILE
// PUT /api/profile
// Header: Authorization: Bearer <token>
// Body chung: fullName, phoneNumber, gender, dateOfBirth
// Body Member: height, weight, fitnessGoal, emergencyContact
// Body PT: specialization, experienceYears, experienceDescription, bio
// Admin chỉ sửa thông tin cơ bản ở bảng Users.
// =====================================================
exports.updateMyProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await models.Users.findByPk(userId, {
            include: [
                { model: models.Members, as: 'Member', required: false },
                { model: models.Trainers, as: 'Trainer', required: false }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
        }

        if (user.status !== 'Active') {
            return res.status(403).json({ message: 'Tài khoản không ở trạng thái Active!' });
        }

        const {
            fullName,
            phoneNumber,
            gender,
            dateOfBirth,
            height,
            weight,
            fitnessGoal,
            fitnessLevel,
            emergencyContact,
            specialization,
            experienceYears,
            experienceDescription,
            bio
        } = req.body;

        if (fullName !== undefined && String(fullName).trim() === '') {
            return res.status(400).json({ message: 'Họ tên không được để trống!' });
        }

        let dobValue = user.date_of_birth;
        if (dateOfBirth !== undefined) {
            dobValue = (dateOfBirth === '' || dateOfBirth === null) ? null : dateOfBirth;
        }

        await user.update({
            full_name: fullName !== undefined ? fullName : user.full_name,
            phone_number: phoneNumber !== undefined ? phoneNumber : user.phone_number,
            gender: gender !== undefined ? gender : user.gender,
            date_of_birth: dobValue
        });

        // Member được sửa thêm thông tin luyện tập cá nhân.
        if (user.role_id === ROLE.MEMBER) {
            let member = user.Member;

            // Trường hợp data cũ chưa có dòng trong Members thì tạo bổ sung.
            if (!member) {
                member = await models.Members.create({ user_id: userId });
            }

            const parsedHeight = height !== undefined && height !== '' ? Number(height) : member.height;
            const parsedWeight = weight !== undefined && weight !== '' ? Number(weight) : member.weight;

            if (parsedHeight !== null && parsedHeight !== undefined && parsedHeight < 0) {
                return res.status(400).json({ message: 'Chiều cao không hợp lệ!' });
            }

            if (parsedWeight !== null && parsedWeight !== undefined && parsedWeight < 0) {
                return res.status(400).json({ message: 'Cân nặng không hợp lệ!' });
            }

            await member.update({
                height: parsedHeight,
                weight: parsedWeight,
                fitness_goal: fitnessGoal !== undefined ? fitnessGoal : member.fitness_goal,
                fitness_level: fitnessLevel !== undefined ? fitnessLevel : member.fitness_level,
                emergency_contact: emergencyContact !== undefined ? emergencyContact : member.emergency_contact
            });
        }

        // PT được sửa thêm hồ sơ chuyên môn.
        if (user.role_id === ROLE.PT) {
            let trainer = user.Trainer;

            // Trường hợp data cũ chưa có dòng trong Trainers thì tạo bổ sung.
            if (!trainer) {
                trainer = await models.Trainers.create({ user_id: userId });
            }

            const parsedExperienceYears = experienceYears !== undefined && experienceYears !== ''
                ? Number(experienceYears)
                : trainer.experience_years;

            if (parsedExperienceYears !== null && parsedExperienceYears !== undefined && parsedExperienceYears < 0) {
                return res.status(400).json({ message: 'Số năm kinh nghiệm không hợp lệ!' });
            }

            await trainer.update({
                specialization: specialization !== undefined ? specialization : trainer.specialization,
                experience_years: parsedExperienceYears,
                experience_description: experienceDescription !== undefined ? experienceDescription : trainer.experience_description,
                bio: bio !== undefined ? bio : trainer.bio
            });
        }

        const updatedUser = await models.Users.findByPk(userId, {
            attributes: { exclude: ['password_hash'] },
            include: [
                { model: models.Roles, as: 'role', attributes: ['role_id', 'role_name'] },
                { model: models.Members, as: 'Member', required: false },
                { model: models.Trainers, as: 'Trainer', required: false }
            ]
        });

        return res.status(200).json({
            message: 'Cập nhật profile thành công!',
            profile: {
                userId: updatedUser.user_id,
                fullName: updatedUser.full_name,
                email: updatedUser.email,
                phoneNumber: updatedUser.phone_number,
                gender: updatedUser.gender,
                dateOfBirth: updatedUser.date_of_birth,
                avatarUrl: buildAvatarUrl(req, updatedUser.avatar_url),
                role: updatedUser.role || {
                    role_id: updatedUser.role_id,
                    role_name: getRoleName(updatedUser.role_id)
                },
                memberInfo: updatedUser.Member || null,
                trainerInfo: updatedUser.Trainer || null
            }
        });
    } catch (error) {
        console.error('❌ Lỗi cập nhật profile:', error.message);
        return res.status(500).json({
            message: 'Lỗi server khi cập nhật profile!',
            error: error.message
        });
    }
};

// =====================================================
// 3. ĐỔI ẢNH ĐẠI DIỆN
// PUT /api/profile/avatar
// Header: Authorization: Bearer <token>
// Form-data: avatar = file ảnh
// =====================================================
exports.updateMyAvatar = async (req, res) => {
    try {
        const userId = req.user.userId;

        if (!req.file) {
            return res.status(400).json({ message: 'Vui lòng chọn file ảnh đại diện!' });
        }

        const user = await models.Users.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
        }

        if (user.status !== 'Active') {
            return res.status(403).json({ message: 'Tài khoản không ở trạng thái Active!' });
        }

        const avatarUrl = `/uploads/avatars/${req.file.filename}`;

        removeOldLocalAvatar(user.avatar_url);

        await user.update({ avatar_url: avatarUrl });

        return res.status(200).json({
            message: 'Đổi ảnh đại diện thành công!',
            avatarUrl: buildAvatarUrl(req, avatarUrl)
        });
    } catch (error) {
        console.error('❌ Lỗi đổi ảnh đại diện:', error.message);
        return res.status(500).json({
            message: 'Lỗi server khi đổi ảnh đại diện!',
            error: error.message
        });
    }
};
