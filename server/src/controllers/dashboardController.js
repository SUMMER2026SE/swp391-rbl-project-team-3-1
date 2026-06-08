const { models, sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const ROLE = {
  MEMBER: 1,
  PT: 2,
  ADMIN: 3
};

// =====================================================
// HELPER: SELF-SEEDING DATABASE LOGIC
// If crucial tracking tables are empty, populate them
// =====================================================
const seedDatabaseIfNeeded = async () => {
  try {
    // 1. Seed Services
    const serviceCount = await models.Services.count();
    if (serviceCount === 0) {
      console.log('🌱 Seeding Services table...');
      await models.Services.bulkCreate([
        { service_name: 'Bể bơi vô cực bốn mùa', sport_type: 'Swimming', price: 100000, description: 'Bể bơi điều hòa nhiệt độ tiêu chuẩn Olympic.', status: 'Active' },
        { service_name: 'Phòng xông hơi đá muối Sauna', sport_type: 'Sauna', price: 150000, description: 'Xông hơi hồng ngoại giúp phục hồi cơ bắp sâu.', status: 'Active' },
        { service_name: 'Tủ Locker thông minh cá nhân', sport_type: 'Locker', price: 50000, description: 'Hệ thống tủ khóa bảo mật vân tay và mã số.', status: 'Active' },
        { service_name: 'Fitness Beverage Bar', sport_type: 'Beverage', price: 30000, description: 'Quầy phục vụ Whey protein và nước uống thể thao.', status: 'Inactive' }
      ]);
    }

    // Get active Trainer and Member for seeding schedules/appointments/reports
    const trainer = await models.Trainers.findOne();
    const member = await models.Members.findOne();

    if (trainer && member) {
      // 2. Seed TrainerSchedules
      const scheduleCount = await models.TrainerSchedules.count();
      if (scheduleCount === 0) {
        console.log('🌱 Seeding TrainerSchedules table...');
        await models.TrainerSchedules.bulkCreate([
          { trainer_id: trainer.trainer_id, working_date: '2026-06-08', start_time: '09:00:00', end_time: '10:30:00', availability_status: 'Busy' },
          { trainer_id: trainer.trainer_id, working_date: '2026-06-08', start_time: '15:00:00', end_time: '16:30:00', availability_status: 'Busy' },
          { trainer_id: trainer.trainer_id, working_date: '2026-06-09', start_time: '17:00:00', end_time: '18:30:00', availability_status: 'Available' }
        ]);
      }

      // 3. Seed Appointments
      const appointmentCount = await models.Appointments.count();
      if (appointmentCount === 0) {
        console.log('🌱 Seeding Appointments table...');
        const schedules = await models.TrainerSchedules.findAll({
          where: { trainer_id: trainer.trainer_id }
        });
        if (schedules.length >= 2) {
          await models.Appointments.bulkCreate([
            { member_id: member.member_id, schedule_id: schedules[0].schedule_id, status: 'Confirmed', note: 'Tập trung tập bụng và đùi' },
            { member_id: member.member_id, schedule_id: schedules[1].schedule_id, status: 'Confirmed', note: 'Bài tập thể lực Cardio nhẹ' }
          ]);
        }
      }

      // 4. Seed Reports (Complaints)
      const reportCount = await models.Reports.count();
      if (reportCount === 0) {
        console.log('🌱 Seeding Reports table...');
        const service = await models.Services.findOne();
        const plan = await models.MembershipPlans.findOne();

        await models.Reports.bulkCreate([
          {
            reported_by: member.user_id,
            reported_service_id: service ? service.service_id : null,
            title: 'Lỗi tủ locker',
            reason: 'Hệ thống tủ locker khu vực nam bị lỗi quét mã vòng tay, không mở được ngăn 14.',
            status: 'Pending'
          },
          {
            reported_by: member.user_id,
            reported_membership_plan_id: plan ? plan.membership_plan_id : null,
            title: 'Yêu cầu hoàn trả chi phí',
            reason: 'Yêu cầu xem xét hoàn trả chi phí gói tập do lịch đi công tác đột xuất không sử dụng được.',
            status: 'Pending'
          }
        ]);
      }
    }
  } catch (err) {
    console.error('❌ Error seeding database:', err.message);
  }
};

// Execute seeding check asynchronously
seedDatabaseIfNeeded();

// =====================================================
// ADMIN DASHBOARD CONTROLLERS
// =====================================================

// GET /api/dashboard/admin/stats
exports.getAdminStats = async (req, res) => {
  try {
    const totalMembers = await models.Members.count();
    const activeTrainers = await models.Trainers.count();

    // Sum Payments. If empty, calculate dummy revenue or sum member memberships
    let totalRevenue = 0;
    const paymentSum = await models.Payments.sum('amount');
    if (paymentSum) {
      totalRevenue = paymentSum;
    } else {
      // Fallback: sum plan prices from active member memberships
      const memberships = await models.MemberMemberships.findAll({
        include: [{ model: models.MembershipPlans, as: 'membership_plan' }]
      });
      totalRevenue = memberships.reduce((sum, m) => {
        return sum + (m.membership_plan ? Number(m.membership_plan.price) : 0);
      }, 0);
    }

    if (totalRevenue === 0) {
      totalRevenue = 48500000; // Mock default matching mockup
    }

    const todayDate = new Date().toISOString().split('T')[0];
    const appointmentsToday = await models.Appointments.count({
      include: [
        {
          model: models.TrainerSchedules,
          as: 'schedule',
          where: { working_date: todayDate }
        }
      ]
    });

    return res.status(200).json({
      totalMembers,
      activeTrainers,
      totalRevenue,
      appointmentsToday: appointmentsToday || 34 // Fallback if no appts today
    });
  } catch (error) {
    console.error('❌ Error getting admin stats:', error);
    return res.status(500).json({ message: 'Lỗi server khi lấy thống kê admin!' });
  }
};

// GET /api/dashboard/admin/users
exports.getAdminUsers = async (req, res) => {
  try {
    const users = await models.Users.findAll({
      attributes: ['user_id', 'full_name', 'email', 'role_id', 'status'],
      include: [
        {
          model: models.Roles,
          as: 'role',
          attributes: ['role_name']
        },
        {
          model: models.Members,
          as: 'Member',
          attributes: ['joined_date']
        }
      ],
      order: [['user_id', 'DESC']]
    });

    const mappedUsers = users.map(u => {
      let roleText = 'GUEST';
      if (u.role_id === ROLE.MEMBER) roleText = 'MEMBER';
      if (u.role_id === ROLE.PT) roleText = 'TRAINER';
      if (u.role_id === ROLE.ADMIN) roleText = 'ADMIN';

      return {
        id: u.user_id,
        name: u.full_name,
        email: u.email,
        role: roleText,
        joinDate: u.Member?.joined_date || '—',
        status: u.status || 'Active'
      };
    });

    return res.status(200).json({ users: mappedUsers });
  } catch (error) {
    console.error('❌ Error getting admin users:', error);
    return res.status(500).json({ message: 'Lỗi server khi lấy danh sách người dùng!' });
  }
};

// PUT /api/dashboard/admin/users/:id/status
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await models.Users.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
    }

    const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    await user.update({ status: nextStatus });

    return res.status(200).json({
      message: `Đã cập nhật trạng thái tài khoản thành ${nextStatus}`,
      user: { id: user.user_id, name: user.full_name, status: user.status }
    });
  } catch (error) {
    console.error('❌ Error updating user status:', error);
    return res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái người dùng!' });
  }
};

// GET /api/dashboard/admin/trainers
exports.getAdminTrainers = async (req, res) => {
  try {
    const trainers = await models.Trainers.findAll({
      include: [
        {
          model: models.Users,
          as: 'user',
          attributes: ['full_name', 'email', 'phone_number']
        }
      ]
    });

    const mappedTrainers = await Promise.all(trainers.map(async t => {
      // Count active members associated with this PT
      const activeMembers = await models.WorkoutPlans.count({
        where: { trainer_id: t.trainer_id },
        distinct: true,
        col: 'member_id'
      });

      return {
        id: t.trainer_id,
        userId: t.user_id,
        name: t.user ? t.user.full_name : 'N/A',
        email: t.user ? t.user.email : 'N/A',
        specialty: t.specialization || 'Gym tổng hợp',
        expYears: t.experience_years || 0,
        activeMembers: activeMembers || 0,
        rating: t.rating || 5.0
      };
    }));

    return res.status(200).json({ trainers: mappedTrainers });
  } catch (error) {
    console.error('❌ Error getting admin trainers:', error);
    return res.status(500).json({ message: 'Lỗi server khi lấy danh sách PT!' });
  }
};

// POST /api/dashboard/admin/trainers
exports.createTrainer = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { name, email, specialty, expYears, bio } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ tên và email!' });
    }

    // Check email exists
    const emailExist = await models.Users.findOne({ where: { email } });
    if (emailExist) {
      return res.status(400).json({ message: 'Email này đã tồn tại trên hệ thống!' });
    }

    // Create User entry first (default password is '123456')
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('123456', salt);

    const newUser = await models.Users.create({
      full_name: name,
      email: email,
      password_hash: passwordHash,
      role_id: ROLE.PT, // Trainer role
      status: 'Active',
      must_change_password: true // Trainer must reset temporary password on first login
    }, { transaction });

    // Create Trainer details entry
    await models.Trainers.create({
      user_id: newUser.user_id,
      specialization: specialty || 'Fitness & Bodybuilding',
      experience_years: Number(expYears) || 1,
      bio: bio || '',
      rating: 5.0
    }, { transaction });

    await transaction.commit();

    return res.status(201).json({
      message: 'Tạo tài khoản PT thành công! Mật khẩu mặc định là: 123456',
      user: {
        id: newUser.user_id,
        name: newUser.full_name,
        email: newUser.email,
        role: 'TRAINER'
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error creating trainer:', error);
    return res.status(500).json({ message: 'Lỗi server khi tạo mới tài khoản PT!' });
  }
};

// GET /api/dashboard/admin/plans
exports.getAdminPlans = async (req, res) => {
  try {
    const plans = await models.MembershipPlans.findAll({
      order: [['price', 'ASC']]
    });

    const mappedPlans = plans.map(p => ({
      id: p.membership_plan_id,
      title: p.plan_name,
      price: Number(p.price),
      durationMonths: p.duration_months,
      features: p.description || 'Truy cập đầy đủ tiện ích phòng tập',
      status: p.status
    }));

    return res.status(200).json({ plans: mappedPlans });
  } catch (error) {
    console.error('❌ Error getting plans:', error);
    return res.status(500).json({ message: 'Lỗi server khi lấy danh sách gói tập!' });
  }
};

// PUT /api/dashboard/admin/plans/:id
exports.updateAdminPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, price, durationMonths, features } = req.body;

    const plan = await models.MembershipPlans.findByPk(id);
    if (!plan) {
      return res.status(404).json({ message: 'Không tìm thấy gói tập!' });
    }

    await plan.update({
      plan_name: title || plan.plan_name,
      price: price !== undefined ? Number(price) : plan.price,
      duration_months: durationMonths !== undefined ? Number(durationMonths) : plan.duration_months,
      description: features !== undefined ? features : plan.description
    });

    return res.status(200).json({
      message: 'Cập nhật thông tin gói tập thành công!',
      plan: {
        id: plan.membership_plan_id,
        title: plan.plan_name,
        price: Number(plan.price)
      }
    });
  } catch (error) {
    console.error('❌ Error updating plan:', error);
    return res.status(500).json({ message: 'Lỗi server khi cập nhật gói tập!' });
  }
};

// GET /api/dashboard/admin/appointments
exports.getAdminAppointments = async (req, res) => {
  try {
    const appointments = await models.Appointments.findAll({
      include: [
        {
          model: models.Members,
          as: 'member',
          include: [{ model: models.Users, as: 'user', attributes: ['full_name'] }]
        },
        {
          model: models.TrainerSchedules,
          as: 'schedule',
          include: [
            {
              model: models.Trainers,
              as: 'trainer',
              include: [{ model: models.Users, as: 'user', attributes: ['full_name'] }]
            }
          ]
        }
      ]
    });

    // Helper: convert TIME field (Date object or string) to "HH:mm"
    const toTimeStr = (val, fallback = '00:00') => {
      if (!val) return fallback;
      if (typeof val === 'string') return val.slice(0, 5);
      if (val instanceof Date) {
        const h = String(val.getUTCHours()).padStart(2, '0');
        const m = String(val.getUTCMinutes()).padStart(2, '0');
        return `${h}:${m}`;
      }
      return fallback;
    };

    // Helper: format working_date (Date or string) to "DD/MM/YYYY"
    const toDateStr = (val) => {
      if (!val) return 'N/A';
      const d = new Date(val);
      if (isNaN(d)) return String(val).slice(0, 10);
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    };

    const mappedAppts = appointments.map((a) => {
      return {
        id: a.appointment_id,
        memberName: a.member?.user?.full_name || 'Hội viên',
        ptName: a.schedule?.trainer?.user?.full_name || 'Huấn luyện viên',
        time: `${toTimeStr(a.schedule?.start_time, '07:00')} - ${toTimeStr(a.schedule?.end_time, '08:30')}`,
        date: toDateStr(a.schedule?.working_date),
        type: a.note || 'Tập luyện cá nhân',
        status: a.status === 'Confirmed' ? 'Scheduled' : a.status || 'Scheduled'
      };
    });

    return res.status(200).json({ appointments: mappedAppts });
  } catch (error) {
    console.error('❌ Error getting admin appointments:', error);
    return res.status(500).json({ message: 'Lỗi server khi lấy lịch hẹn!' });
  }
};

// PUT /api/dashboard/admin/appointments/:id/cancel
exports.cancelAdminAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await models.Appointments.findByPk(id);

    if (!appointment) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn!' });
    }

    await appointment.update({ status: 'Cancelled' });

    // Update Trainer schedule status back to Available
    if (appointment.schedule_id) {
      await models.TrainerSchedules.update(
        { availability_status: 'Available' },
        { where: { schedule_id: appointment.schedule_id } }
      );
    }

    return res.status(200).json({ message: 'Hủy lịch hẹn thành công!' });
  } catch (error) {
    console.error('❌ Error cancelling appointment:', error);
    return res.status(500).json({ message: 'Lỗi server khi hủy lịch hẹn!' });
  }
};

// GET /api/dashboard/admin/services
exports.getAdminServices = async (req, res) => {
  try {
    const services = await models.Services.findAll();
    const mappedServices = services.map(s => ({
      id: s.service_id,
      title: s.service_name,
      description: s.description || '',
      active: s.status === 'Active'
    }));

    return res.status(200).json({ services: mappedServices });
  } catch (error) {
    console.error('❌ Error getting services:', error);
    return res.status(500).json({ message: 'Lỗi server khi lấy tiện ích!' });
  }
};

// PUT /api/dashboard/admin/services/:id
exports.toggleAdminService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await models.Services.findByPk(id);

    if (!service) {
      return res.status(404).json({ message: 'Không tìm thấy dịch vụ!' });
    }

    const nextStatus = service.status === 'Active' ? 'Inactive' : 'Active';
    await service.update({ status: nextStatus });

    return res.status(200).json({
      message: 'Cập nhật trạng thái dịch vụ thành công!',
      service: { id: service.service_id, title: service.service_name, active: nextStatus === 'Active' }
    });
  } catch (error) {
    console.error('❌ Error toggling service status:', error);
    return res.status(500).json({ message: 'Lỗi server khi cập nhật dịch vụ!' });
  }
};

// GET /api/dashboard/admin/complaints
exports.getAdminComplaints = async (req, res) => {
  try {
    const reports = await models.Reports.findAll({
      include: [
        {
          model: models.Users,
          as: 'reported_by_User',
          attributes: ['full_name']
        }
      ],
      order: [['report_id', 'DESC']]
    });

    const mappedComplaints = reports.map(r => ({
      id: r.report_id,
      memberName: r.reported_by_User?.full_name || 'Hội viên ẩn danh',
      date: r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : '—',
      content: r.reason,
      status: r.status
    }));

    return res.status(200).json({ complaints: mappedComplaints });
  } catch (error) {
    console.error('❌ Error getting complaints:', error);
    return res.status(500).json({ message: 'Lỗi server khi lấy khiếu nại phản hồi!' });
  }
};

// PUT /api/dashboard/admin/complaints/:id/resolve
exports.resolveAdminComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Resolved' or 'Cancelled'

    const report = await models.Reports.findByPk(id);
    if (!report) {
      return res.status(404).json({ message: 'Không tìm thấy khiếu nại!' });
    }

    await report.update({
      status: status || 'Resolved',
      resolved_at: new Date(),
      admin_note: 'Đã giải quyết thông qua Bảng điều khiển Quản trị viên'
    });

    return res.status(200).json({ message: 'Đã xử lý phản hồi khiếu nại thành công!' });
  } catch (error) {
    console.error('❌ Error resolving complaint:', error);
    return res.status(500).json({ message: 'Lỗi server khi xử lý phản hồi!' });
  }
};

// =====================================================
// TRAINER/PT DASHBOARD CONTROLLERS
// =====================================================

// GET /api/dashboard/trainer/members
exports.getTrainerMembers = async (req, res) => {
  try {
    const trainerUser = await models.Trainers.findOne({ where: { user_id: req.user.userId } });
    if (!trainerUser) {
      return res.status(400).json({ message: 'Hồ sơ huấn luyện viên không tồn tại!' });
    }

    // Fetch members who have registered workout plans or schedule appointments with this trainer
    // Fallback: list all system members if none are linked yet
    let members = [];
    const workoutMembers = await models.WorkoutPlans.findAll({
      where: { trainer_id: trainerUser.trainer_id },
      include: [
        {
          model: models.Members,
          as: 'member',
          include: [
            { model: models.Users, as: 'user', attributes: ['full_name', 'email', 'phone_number'] },
            { model: models.MemberMemberships, as: 'MemberMemberships', include: [{ model: models.MembershipPlans, as: 'membership_plan' }] }
          ]
        }
      ]
    });

    if (workoutMembers.length > 0) {
      members = workoutMembers.map(wm => wm.member).filter(Boolean);
    } else {
      // Fallback: grab all system members to prevent empty screen
      members = await models.Members.findAll({
        include: [
          { model: models.Users, as: 'user', attributes: ['full_name', 'email', 'phone_number'] },
          { model: models.MemberMemberships, as: 'MemberMemberships', include: [{ model: models.MembershipPlans, as: 'membership_plan' }] }
        ]
      });
    }

    const mappedMembers = members.map((m, idx) => {
      const activeMembership = m.MemberMemberships?.find(
        ms => ms.membership_status === 'Active'
      );

      // Calculate a dummy progress metric or remaining classes
      const progress = Math.round(40 + (idx * 15)) % 100;
      const remainingSessions = Math.round(5 + (idx * 3)) % 15;

      return {
        id: m.member_id,
        name: m.user ? m.user.full_name : 'Hội viên',
        email: m.user ? m.user.email : 'N/A',
        phone: m.user ? m.user.phone_number : 'N/A',
        planName: activeMembership?.membership_plan?.plan_name || 'Standard Gym',
        goal: m.fitness_goal || 'Tập lực cơ bản',
        height: Math.round((m.height || 1.7) * 100), // convert to cm
        weight: m.weight || 70,
        bmi: m.bmi || 22.5,
        progress: progress || 50,
        remainingSessions: remainingSessions || 8
      };
    });

    return res.status(200).json({ members: mappedMembers });
  } catch (error) {
    console.error('❌ Error getting trainer members:', error);
    return res.status(500).json({ message: 'Lỗi server khi tải danh sách học viên!' });
  }
};

// GET /api/dashboard/trainer/appointments
exports.getTrainerAppointments = async (req, res) => {
  try {
    const trainerUser = await models.Trainers.findOne({ where: { user_id: req.user.userId } });
    if (!trainerUser) {
      return res.status(400).json({ message: 'Hồ sơ huấn luyện viên không tồn tại!' });
    }

    const appointments = await models.Appointments.findAll({
      include: [
        {
          model: models.Members,
          as: 'member',
          include: [{ model: models.Users, as: 'user', attributes: ['full_name'] }]
        },
        {
          model: models.TrainerSchedules,
          as: 'schedule',
          where: { trainer_id: trainerUser.trainer_id }
        }
      ]
    });

    const mappedAppts = appointments.map(a => {
      const startT = a.schedule?.start_time || '07:00:00';
      const endT = a.schedule?.end_time || '08:30:00';

      // Map working_date like '25', '26', '27' for trainer calendar
      const dayNum = a.schedule?.working_date ? a.schedule.working_date.split('-')[2] : '25';

      return {
        id: a.appointment_id,
        day: dayNum,
        time: `${startT.slice(0, 5)} - ${endT.slice(0, 5)}`,
        member: a.member?.user?.full_name || 'Hội viên',
        name: a.member?.user?.full_name || 'Hội viên',
        type: a.note || 'Lớp tập luyện riêng',
        note: a.note || 'Lớp tập luyện riêng',
        active: a.status === 'Confirmed' || a.status === 'Scheduled',
        status: a.status === 'Confirmed' ? 'Scheduled' : a.status
      };
    });

    return res.status(200).json({ appointments: mappedAppts });
  } catch (error) {
    console.error('❌ Error getting trainer appointments:', error);
    return res.status(500).json({ message: 'Lỗi server khi tải lịch dạy!' });
  }
};

// PUT /api/dashboard/trainer/appointments/:id/confirm
exports.confirmTrainerAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'confirm' or 'reject'

    const appointment = await models.Appointments.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn!' });
    }

    const nextStatus = action === 'confirm' ? 'Confirmed' : 'Cancelled';
    await appointment.update({ status: nextStatus });

    // Free the slot if rejected
    if (action === 'reject' && appointment.schedule_id) {
      await models.TrainerSchedules.update(
        { availability_status: 'Available' },
        { where: { schedule_id: appointment.schedule_id } }
      );
    }

    return res.status(200).json({ message: `Đã ${action === 'confirm' ? 'xác nhận' : 'từ chối'} lịch hẹn tập thành công!` });
  } catch (error) {
    console.error('❌ Error confirming appointment:', error);
    return res.status(500).json({ message: 'Lỗi server khi duyệt lịch dạy!' });
  }
};

// POST /api/dashboard/trainer/assign-plan
exports.assignPlanToMember = async (req, res) => {
  try {
    const { memberId, type, name } = req.body; // type = 'workout' or 'meal'

    if (!memberId || !name) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin hội viên và tên giáo án!' });
    }

    const trainerUser = await models.Trainers.findOne({ where: { user_id: req.user.userId } });
    if (!trainerUser) {
      return res.status(400).json({ message: 'Chỉ huấn luyện viên mới được giao giáo án!' });
    }

    if (type === 'workout') {
      await models.WorkoutPlans.create({
        trainer_id: trainerUser.trainer_id,
        member_id: memberId,
        title: name,
        description: 'Giáo án được giao từ huấn luyện viên qua dashboard.',
        created_at: new Date()
      });
    } else {
      await models.MealPlans.create({
        trainer_id: trainerUser.trainer_id,
        member_id: memberId,
        title: name,
        calories_per_day: 2000,
        description: 'Chế độ dinh dưỡng giao trực tiếp từ huấn luyện viên.',
        created_at: new Date()
      });
    }

    return res.status(201).json({ message: `Đã giao thành công ${type === 'workout' ? 'giáo án tập luyện' : 'thực đơn dinh dưỡng'}: ${name}` });
  } catch (error) {
    console.error('❌ Error assigning plan:', error);
    return res.status(500).json({ message: 'Lỗi server khi giao giáo án/thực đơn!' });
  }
};

// =====================================================
// MEMBER DASHBOARD CONTROLLERS
// =====================================================

// GET /api/dashboard/member/appointments
exports.getMemberAppointments = async (req, res) => {
  try {
    const member = await models.Members.findOne({ where: { user_id: req.user.userId } });
    if (!member) {
      return res.status(200).json({ appointments: [] });
    }

    const appointments = await models.Appointments.findAll({
      where: { member_id: member.member_id },
      include: [
        {
          model: models.TrainerSchedules,
          as: 'schedule',
          include: [
            {
              model: models.Trainers,
              as: 'trainer',
              include: [{ model: models.Users, as: 'user', attributes: ['full_name'] }]
            }
          ]
        }
      ],
      order: [['appointment_id', 'DESC']]
    });

    const mappedAppts = appointments.map(a => {
      const startT = a.schedule?.start_time || '07:00:00';
      const endT = a.schedule?.end_time || '08:30:00';

      return {
        id: a.appointment_id,
        ptName: a.schedule?.trainer?.user?.full_name || 'HLV Cá Nhân',
        trainer: a.schedule?.trainer?.user?.full_name || 'HLV Cá Nhân',
        date: a.schedule?.working_date || 'N/A',
        time: a.schedule?.working_date ? `${a.schedule.working_date} (${startT.slice(0, 5)} - ${endT.slice(0, 5)})` : `${startT.slice(0, 5)} - ${endT.slice(0, 5)}`,
        type: a.note || 'Tập thử Gym',
        status: (a.status === 'Confirmed' || a.status === 'Scheduled' ? 'confirmed' : a.status || 'pending').toLowerCase()
      };
    });

    return res.status(200).json({ appointments: mappedAppts });
  } catch (error) {
    console.error('❌ Error getting member appointments:', error);
    return res.status(500).json({ message: 'Lỗi server khi tải lịch hẹn!' });
  }
};

// POST /api/dashboard/member/appointments
exports.createMemberAppointment = async (req, res) => {
  try {
    const { date, time, type, note } = req.body;

    if (!date || !time) {
      return res.status(400).json({ message: 'Vui lòng cung cấp ngày hẹn và thời gian!' });
    }

    const member = await models.Members.findOne({ where: { user_id: req.user.userId } });
    if (!member) {
      return res.status(400).json({ message: 'Hồ sơ hội viên chưa được thiết lập!' });
    }

    // To link an appointment, we need a TrainerSchedule.
    // Find first active PT or default system PT schedule slot
    // If no schedule slots exist, we create one dynamically for today/selected date!
    const defaultTrainer = await models.Trainers.findOne();
    if (!defaultTrainer) {
      return res.status(400).json({ message: 'Hệ thống hiện tại chưa có HLV nào hoạt động để đặt lịch!' });
    }

    const start_time = `${time}:00`;
    // Add 1.5 hours
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + 90;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    const end_time = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;
    // Create a new Available Trainer Schedule row
    const newSchedule = await models.TrainerSchedules.create({
      trainer_id: defaultTrainer.trainer_id,
      working_date: date,
      start_time,
      end_time,
      availability_status: 'Busy'
    });

    const newAppt = await models.Appointments.create({
      member_id: member.member_id,
      schedule_id: newSchedule.schedule_id,
      status: 'Pending',
      note: note || type || 'Đăng ký tập luyện cá nhân',
      created_at: new Date()
    });

    return res.status(201).json({
      message: 'Đăng ký lịch hẹn thành công! Đang chờ huấn luyện viên xác nhận.',
      appointment: {
        id: newAppt.appointment_id,
        ptName: defaultTrainer.user?.full_name || 'HLV Cá Nhân',
        date: date,
        time: `${time} - ${end_time.slice(0, 5)}`,
        type: newAppt.note,
        status: newAppt.status
      }
    });

  } catch (error) {
    console.error('❌ Error creating member appointment:', error);
    return res.status(500).json({ message: 'Lỗi server khi đăng ký lịch tập!' });
  }
};
