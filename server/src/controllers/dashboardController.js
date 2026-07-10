const { models, sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const ROLE = {
  MEMBER: 1,
  PT: 2,
  ADMIN: 3
};

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
  if (isNaN(d.getTime())) return String(val).slice(0, 10);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

// Helper: format working_date to "YYYY-MM-DD"
const toYYYYMMDD = (val) => {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) {
    const s = String(val);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    return null;
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

    // Generate temporary password
    const crypto = require('crypto');
    const generateTempPassword = (length = 8) => {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let password = '';
      const bytes = crypto.randomBytes(length);
      for (let i = 0; i < length; i++) {
        password += chars[bytes[i] % chars.length];
      }
      return password;
    };
    const temporaryPassword = generateTempPassword(8);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(temporaryPassword, salt);

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

    // Send email asynchronously outside transaction
    let emailSent = false;
    try {
      const { sendTrainerAccountEmail } = require('../utils/emailService');
      const mailResult = await sendTrainerAccountEmail(email, name, temporaryPassword);
      if (mailResult) {
        emailSent = true;
      }
    } catch (mailError) {
      console.error('❌ Lỗi gửi email thông báo PT:', mailError.message);
    }

    return res.status(201).json({
      message: emailSent 
        ? 'Tạo tài khoản PT thành công! Email thông tin và mật khẩu tạm thời đã được gửi.'
        : 'Tạo tài khoản PT thành công nhưng không gửi được email (Mật khẩu hiển thị bên dưới).',
      temporaryPassword,
      emailSent,
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
      order: [['price', 'ASC']],
      include: [{
        model: models.Services,
        as: 'IncludedServices',
        attributes: ['service_id', 'service_name'],
        through: { attributes: ['session_count'] }
      }]
    });

    const mappedPlans = plans.map(p => ({
      id: p.membership_plan_id,
      title: p.plan_name,
      price: Number(p.price),
      durationMonths: p.duration_months,
        sportType: p.sport_type,
      features: p.description || 'Truy cập đầy đủ tiện ích phòng tập',
      status: p.status,
      attachedServices: p.IncludedServices ? p.IncludedServices.map(s => ({
        serviceId: s.service_id,
        serviceName: s.service_name,
        sessionCount: s.MembershipPlanServices ? s.MembershipPlanServices.session_count : null
      })) : []
    }));

    return res.status(200).json({ plans: mappedPlans });
  } catch (error) {
    console.error('❌ Error getting plans:', error);
    return res.status(500).json({ message: 'Lỗi server khi lấy danh sách gói tập!' });
  }
};

// POST /api/dashboard/admin/plans
exports.createAdminPlan = async (req, res) => {
  try {
    const { title, price, durationMonths, features, sportType, attachedServices } = req.body;
    if (!title || !price) {
      return res.status(400).json({ message: 'Vui lòng nhập tên và giá gói tập!' });
    }

    const newPlan = await models.MembershipPlans.create({
      plan_name: title,
      price: Number(price),
      duration_months: Number(durationMonths) || 1,
      description: features || '',
      sport_type: sportType || 'Gym',
      status: 'Active'
    });

    if (attachedServices && Array.isArray(attachedServices)) {
      for (const svc of attachedServices) {
        await models.MembershipPlanServices.create({
          membership_plan_id: newPlan.membership_plan_id,
          service_id: svc.serviceId,
          session_count: svc.sessionCount !== undefined ? svc.sessionCount : null
        });
      }
    }

    return res.status(201).json({
      message: 'Tạo gói tập mới thành công!',
      plan: {
        id: newPlan.membership_plan_id,
        title: newPlan.plan_name,
        price: Number(newPlan.price),
        status: newPlan.status
      }
    });
  } catch (error) {
    console.error('❌ Error creating plan:', error);
    return res.status(500).json({ message: 'Lỗi server khi tạo gói tập!' });
  }
};

// PUT /api/dashboard/admin/plans/:id
exports.updateAdminPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, price, durationMonths, features, status, sportType, attachedServices } = req.body;

    const plan = await models.MembershipPlans.findByPk(id);
    if (!plan) {
      return res.status(404).json({ message: 'Không tìm thấy gói tập!' });
    }

    await plan.update({
      plan_name: title !== undefined ? title : plan.plan_name,
      price: price !== undefined ? Number(price) : plan.price,
      duration_months: durationMonths !== undefined ? Number(durationMonths) : plan.duration_months,
      description: features !== undefined ? features : plan.description,
      status: status !== undefined ? status : plan.status,
      sport_type: sportType !== undefined ? sportType : plan.sport_type
    });

    if (attachedServices && Array.isArray(attachedServices)) {
      await models.MembershipPlanServices.destroy({
        where: { membership_plan_id: plan.membership_plan_id }
      });
      for (const svc of attachedServices) {
        await models.MembershipPlanServices.create({
          membership_plan_id: plan.membership_plan_id,
          service_id: svc.serviceId,
          session_count: svc.sessionCount !== undefined && svc.sessionCount !== null ? svc.sessionCount : null
        });
      }
    }

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


    const mappedAppts = appointments.map((a) => {
      const startTimeFormatted = toTimeStr(a.schedule?.start_time, '07:00');
      const endTimeFormatted = toTimeStr(a.schedule?.end_time, '08:30');
      const workingDateStr = toYYYYMMDD(a.schedule?.working_date);
      const startDateTime = workingDateStr ? `${workingDateStr}T${startTimeFormatted}:00` : null;
      const endDateTime = workingDateStr ? `${workingDateStr}T${endTimeFormatted}:00` : null;

      return {
        id: a.appointment_id,
        memberName: a.member?.user?.full_name || 'Hội viên',
        ptName: a.schedule?.trainer?.user?.full_name || 'Huấn luyện viên',
        time: `${startTimeFormatted} - ${endTimeFormatted}`,
        date: toDateStr(a.schedule?.working_date),
        workingDate: workingDateStr,
        startTime: startTimeFormatted,
        endTime: endTimeFormatted,
        startDateTime,
        endDateTime,
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
      price: Number(s.price) || 0,
      active: s.status === 'Active'
    }));

    return res.status(200).json({ services: mappedServices });
  } catch (error) {
    console.error('❌ Error getting services:', error);
    return res.status(500).json({ message: 'Lỗi server khi lấy tiện ích!' });
  }
};

// POST /api/dashboard/admin/services
exports.createAdminService = async (req, res) => {
  try {
    const { title, description, price } = req.body;
    if (!title || price === undefined) {
      return res.status(400).json({ message: 'Vui lòng nhập tên và giá dịch vụ!' });
    }

    const newService = await models.Services.create({
      service_name: title,
      description: description || '',
      price: Number(price) || 0,
      status: 'Active'
    });

    return res.status(201).json({
      message: 'Tạo dịch vụ thành công!',
      service: {
        id: newService.service_id,
        title: newService.service_name,
        price: Number(newService.price),
        active: true
      }
    });
  } catch (error) {
    console.error('❌ Error creating service:', error);
    return res.status(500).json({ message: 'Lỗi server khi tạo dịch vụ!' });
  }
};

// PUT /api/dashboard/admin/services/:id/update
exports.updateAdminService = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price } = req.body;

    const service = await models.Services.findByPk(id);
    if (!service) {
      return res.status(404).json({ message: 'Không tìm thấy dịch vụ!' });
    }

    await service.update({
      service_name: title !== undefined ? title : service.service_name,
      description: description !== undefined ? description : service.description,
      price: price !== undefined ? Number(price) : service.price
    });

    return res.status(200).json({ message: 'Cập nhật dịch vụ thành công!' });
  } catch (error) {
    console.error('❌ Error updating service:', error);
    return res.status(500).json({ message: 'Lỗi server khi cập nhật dịch vụ!' });
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
// HOMEPAGE CONFIG CONTROLLERS
// =====================================================

// GET /api/dashboard/admin/homepage-config
exports.getHomepageConfig = async (req, res) => {
  try {
    const config = await models.AppConfigs.findOne({ where: { config_key: 'core_sports' } });
    let coreSports = [];
    if (config && config.config_value) {
      try {
        coreSports = JSON.parse(config.config_value);
      } catch (e) {
        console.error('Lỗi parse config core_sports:', e);
      }
    }

    return res.status(200).json({ coreSports });
  } catch (error) {
    console.error('❌ Error getting homepage config:', error);
    return res.status(500).json({ message: 'Lỗi server khi lấy cấu hình trang chủ!' });
  }
};

// PUT /api/dashboard/admin/homepage-config
exports.updateHomepageConfig = async (req, res) => {
  try {
    // Expected structure for a single sport update or full array update
    // If updating full array, req.body.coreSports contains JSON string
    // Let's support updating full array
    let updatedSports = [];

    if (req.body.coreSports) {
      try {
        updatedSports = JSON.parse(req.body.coreSports);
      } catch(e) {
        return res.status(400).json({ message: 'Định dạng dữ liệu không hợp lệ!' });
      }
    } else {
      return res.status(400).json({ message: 'Thiếu dữ liệu cấu hình!' });
    }

    // Handle image upload if a new file is uploaded
    // Note: Due to limitations of multipart/form-data with array of objects, 
    // a simpler approach is updating one sport at a time or passing image URL.
    // Assuming frontend updates one sport at a time: index, name, description, and file
    const indexStr = req.body.updateIndex;
    if (indexStr !== undefined && req.file) {
      const idx = parseInt(indexStr, 10);
      if (updatedSports[idx]) {
         const fileUrl = `/assets/images/${req.file.filename}`;
         updatedSports[idx].image = fileUrl;
      }
    }

    const [config, created] = await models.AppConfigs.findOrCreate({
      where: { config_key: 'core_sports' },
      defaults: {
        config_value: JSON.stringify(updatedSports),
        description: 'Cấu hình 3 bộ môn trên trang chủ'
      }
    });

    if (!created) {
      await config.update({ config_value: JSON.stringify(updatedSports), updated_at: new Date() });
    }

    return res.status(200).json({ 
      message: 'Cập nhật cấu hình trang chủ thành công!',
      coreSports: updatedSports
    });

  } catch (error) {
    console.error('❌ Error updating homepage config:', error);
    return res.status(500).json({ message: 'Lỗi server khi cập nhật cấu hình!' });
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
      const seen = new Set();
      members = [];
      workoutMembers.forEach(wm => {
        if (wm.member && !seen.has(wm.member.member_id)) {
          seen.add(wm.member.member_id);
          members.push(wm.member);
        }
      });
    } else {
      // Mật khẩu/tài khoản PT mới tạo hoặc chưa có học viên thì trả về danh sách rỗng
      members = [];
    }

    const mappedMembers = await Promise.all(members.map(async (m, idx) => {
      // Map trainer specialization to membership sport type
      const trainerSpec = (trainerUser.specialization || '').toLowerCase();
      let matchedSportTypes = [];
      if (trainerSpec.includes('yoga')) {
        matchedSportTypes = ['yoga'];
      } else if (trainerSpec.includes('fitness') || trainerSpec.includes('bodybuilding') || trainerSpec.includes('gym')) {
        matchedSportTypes = ['gym', 'mixed'];
      } else {
        matchedSportTypes = [trainerSpec];
      }

      // Filter active memberships matching the trainer's sport types
      const matchedActiveMemberships = (m.MemberMemberships || []).filter(ms => {
        const sport = (ms.membership_plan?.sport_type || '').toLowerCase();
        return ms.membership_status === 'Active' && matchedSportTypes.includes(sport);
      });

      const primaryMembership = matchedActiveMemberships[0];
      const planName = primaryMembership?.membership_plan?.plan_name || 'Standard Plan';

      // Fetch actual workout and meal plan assigned to this member by this trainer
      const latestWorkoutPlan = await models.WorkoutPlans.findOne({
        where: { member_id: m.member_id, trainer_id: trainerUser.trainer_id },
        order: [['workout_plan_id', 'DESC']]
      });

      let workoutExercises = [];
      let workoutExercisesCount = 0;
      if (latestWorkoutPlan) {
        workoutExercises = await models.WorkoutExercises.findAll({
          where: { workout_plan_id: latestWorkoutPlan.workout_plan_id }
        });
        workoutExercisesCount = workoutExercises.length;
      }

      const mealPlans = await models.MealPlans.findAll({
        where: { member_id: m.member_id, trainer_id: trainerUser.trainer_id },
        order: [['meal_plan_id', 'DESC']]
      });

      let remainingDays = 0;
      matchedActiveMemberships.forEach(ms => {
        const endDate = new Date(ms.end_date);
        const diffTime = endDate - new Date();
        let daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (daysLeft > 0) {
          remainingDays += daysLeft;
        }
      });

      return {
        id: m.member_id,
        name: m.user ? m.user.full_name : 'Hội viên',
        email: m.user ? m.user.email : 'N/A',
        phone: m.user ? m.user.phone_number : 'N/A',
        planName: planName,
        goal: m.fitness_goal || 'Tập lực cơ bản',
        height: Math.round((m.height || 1.7) * 100), // convert to cm
        weight: m.weight || 70,
        bmi: m.bmi || 22.5,
        remainingDays: remainingDays,
        workoutAssigned: latestWorkoutPlan ? latestWorkoutPlan.title : 'Chưa phân công',
        mealAssigned: mealPlans.length > 0 ? mealPlans[0].title : 'Chưa phân công',
        workoutPlanId: latestWorkoutPlan ? latestWorkoutPlan.workout_plan_id : null,
        workoutCreatedAt: latestWorkoutPlan ? latestWorkoutPlan.created_at : null,
        workoutExercisesCount,
        workoutExercises: workoutExercises.map(e => ({ name: e.exercise_name, sets: e.sets, reps: e.reps })),
        assignedMeals: mealPlans.map(mp => ({ id: mp.meal_plan_id, title: mp.title, description: mp.description, calories: mp.calories_per_day, createdAt: mp.created_at }))
      };
    }));

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
      ],
      order: [
        [{ model: models.TrainerSchedules, as: 'schedule' }, 'working_date', 'ASC'],
        [{ model: models.TrainerSchedules, as: 'schedule' }, 'start_time', 'ASC']
      ]
    });

    const mappedAppts = appointments.map(a => {
      const startTimeFormatted = toTimeStr(a.schedule?.start_time, '07:00');
      const endTimeFormatted = toTimeStr(a.schedule?.end_time, '08:30');

      let dayNum = '25';
      let dateStr = '2026-06-17';
      if (a.schedule?.working_date) {
        const dateVal = a.schedule.working_date;
        if (typeof dateVal === 'string') {
          const part = dateVal.split('-')[2];
          dayNum = part ? part.slice(0, 2) : '25';
          dateStr = dateVal.slice(0, 10);
        } else if (dateVal instanceof Date) {
          dayNum = String(dateVal.getDate()).padStart(2, '0');
          const y = dateVal.getFullYear();
          const m = String(dateVal.getMonth() + 1).padStart(2, '0');
          const d = String(dateVal.getDate()).padStart(2, '0');
          dateStr = `${y}-${m}-${d}`;
        } else {
          const part = String(dateVal).split('-')[2];
          dayNum = part ? part.slice(0, 2) : '25';
          dateStr = String(dateVal).slice(0, 10);
        }
      }

      const workingDateStr = toYYYYMMDD(a.schedule?.working_date);
      const startDateTime = workingDateStr ? `${workingDateStr}T${startTimeFormatted}:00` : null;
      const endDateTime = workingDateStr ? `${workingDateStr}T${endTimeFormatted}:00` : null;

      return {
        id: a.appointment_id,
        day: dayNum,
        date: dateStr,
        workingDate: workingDateStr,
        startTime: startTimeFormatted,
        endTime: endTimeFormatted,
        startDateTime,
        endDateTime,
        time: `${startTimeFormatted} - ${endTimeFormatted}`,
        member: a.member?.user?.full_name || 'Hội viên',
        name: a.member?.user?.full_name || 'Hội viên',
        type: a.note || 'Lớp tập luyện riêng',
        note: a.note || 'Lớp tập luyện riêng',
        active: a.status === 'Confirmed' || a.status === 'Scheduled',
        status: a.status === 'Confirmed' ? 'Scheduled' : a.status,
        cancelReason: a.cancel_reason,
        cancelRequestedAt: a.cancel_requested_at,
        cancelRequestedBy: a.cancel_requested_by
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

    const nextStatus = action === 'confirm' ? 'Confirmed' : 'Rejected';
    await appointment.update({ status: nextStatus });

    // Update schedule availability based on action
    if (action === 'confirm' && appointment.schedule_id) {
      await models.TrainerSchedules.update(
        { availability_status: 'Busy' },
        { where: { schedule_id: appointment.schedule_id } }
      );
    } else if (action === 'reject' && appointment.schedule_id) {
      await models.TrainerSchedules.update(
        { availability_status: 'Available' },
        { where: { schedule_id: appointment.schedule_id } }
      );
    }

    // Create notification for Member
    try {
      const member = await models.Members.findByPk(appointment.member_id);
      if (member) {
        const memberUserId = member.user_id;
        
        // Find PT info
        const trainerUser = await models.Users.findByPk(req.user.userId);
        const ptName = trainerUser?.full_name || 'HLV';

        // Retrieve schedule details
        const schedule = await models.TrainerSchedules.findByPk(appointment.schedule_id);
        const dateFormatted = schedule?.working_date ? toDateStr(schedule.working_date) : 'N/A';
        const startTimeFormatted = schedule?.start_time ? toTimeStr(schedule.start_time, '07:00') : 'N/A';

        // Auto mark the PT's "appointment_booked" notification as read
        try {
          const trainerRecord = await models.Trainers.findByPk(schedule.trainer_id);
          if (trainerRecord) {
            const trainerUserId = trainerRecord.user_id;
            const ptNotification = await models.Notifications.findOne({
              where: {
                user_id: trainerUserId,
                notification_type: 'appointment_booked',
                is_read: false,
                content: {
                  [require('sequelize').Op.like]: `%ngày ${dateFormatted} lúc ${startTimeFormatted}%`
                }
              }
            });

            if (ptNotification) {
              await ptNotification.update({ is_read: true });
              
              // Emit notification update to the trainer to clear their badge count in real-time
              const notificationEmitter = require('../utils/notificationEmitter');
              notificationEmitter.emit('notification_created', {
                user_id: trainerUserId,
                notification: {
                  notification_id: ptNotification.notification_id,
                  user_id: trainerUserId,
                  title: ptNotification.title,
                  content: ptNotification.content,
                  notification_type: ptNotification.notification_type,
                  is_read: true,
                  created_at: ptNotification.created_at || new Date()
                }
              });
            }
          }
        } catch (ptNotifErr) {
          console.error('⚠️ Lỗi tự động đọc thông báo cho PT:', ptNotifErr.message);
        }

        const typeStr = action === 'confirm' ? 'appointment_confirmed' : 'appointment_rejected';
        const titleStr = action === 'confirm' ? 'Lịch hẹn được xác nhận' : 'Lịch hẹn bị từ chối';
        const contentStr = action === 'confirm'
          ? `Lịch hẹn tập của bạn với HLV ${ptName} vào ngày ${dateFormatted} lúc ${startTimeFormatted} đã được xác nhận.`
          : `Lịch hẹn tập của bạn với HLV ${ptName} vào ngày ${dateFormatted} lúc ${startTimeFormatted} đã bị từ chối.`;

        const notification = await models.Notifications.create({
          user_id: memberUserId,
          title: titleStr,
          content: contentStr,
          notification_type: typeStr,
          is_read: false
        });

        // Emit via notificationEmitter
        const notificationEmitter = require('../utils/notificationEmitter');
        notificationEmitter.emit('notification_created', {
          user_id: memberUserId,
          notification: {
            notification_id: notification.notification_id,
            user_id: memberUserId,
            title: notification.title,
            content: notification.content,
            notification_type: notification.notification_type,
            is_read: notification.is_read,
            created_at: new Date()
          }
        });
      }
    } catch (notifErr) {
      console.error('⚠️ Lỗi tạo thông báo phản hồi lịch hẹn:', notifErr.message);
    }

    return res.status(200).json({ message: `Đã ${action === 'confirm' ? 'xác nhận' : 'từ chối'} lịch hẹn tập thành công!` });
  } catch (error) {
    console.error('❌ Error confirming appointment:', error);
    return res.status(500).json({ message: 'Lỗi server khi duyệt lịch dạy!' });
  }
};

// POST /api/dashboard/trainer/assign-plan
exports.assignPlanToMember = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { memberId, type, name } = req.body; // type = 'workout' or 'meal'

    if (!memberId || !name) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin hội viên và tên giáo án!' });
    }

    const trainerUser = await models.Trainers.findOne({ where: { user_id: req.user.userId } });
    if (!trainerUser) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Chỉ huấn luyện viên mới được giao giáo án!' });
    }

    if (type === 'workout') {
      const config = await models.AppConfigs.findOne({ where: { config_key: 'workout_templates' } }, { transaction });
      let templates = [];
      if (config && config.config_value) {
        templates = JSON.parse(config.config_value);
      }
      const matchedTemplate = templates.find(t => t.title === name);

      const newPlan = await models.WorkoutPlans.create({
        trainer_id: trainerUser.trainer_id,
        member_id: memberId,
        title: name,
        description: matchedTemplate?.description || 'Giáo án được giao từ huấn luyện viên qua dashboard.'
      }, { transaction });

      const exercises = matchedTemplate?.exercises || [
        { exercise_name: name, sets: 3, reps: 10, duration_minutes: 15, calories_burned: 100, rpe: 7 }
      ];

      const exercisesToCreate = exercises.map(ex => ({
        workout_plan_id: newPlan.workout_plan_id,
        exercise_name: ex.exercise_name,
        sets: ex.sets,
        reps: ex.reps,
        duration_minutes: ex.duration_minutes,
        calories_burned: ex.calories_burned,
        rpe: ex.rpe
      }));

      await models.WorkoutExercises.bulkCreate(exercisesToCreate, { transaction });
    } else {
      const config = await models.AppConfigs.findOne({ where: { config_key: 'meal_templates' } }, { transaction });
      let templates = [];
      if (config && config.config_value) {
        templates = JSON.parse(config.config_value);
      }
      const matchedTemplate = templates.find(t => t.title === name);

      await models.MealPlans.create({
        trainer_id: trainerUser.trainer_id,
        member_id: memberId,
        title: name,
        calories_per_day: 2000,
        description: matchedTemplate?.description || 'Chế độ dinh dưỡng giao trực tiếp từ huấn luyện viên.'
      }, { transaction });
    }

    await transaction.commit();
    return res.status(201).json({ message: `Đã giao thành công ${type === 'workout' ? 'giáo án tập luyện' : 'thực đơn dinh dưỡng'}: ${name}` });
  } catch (error) {
    console.error('❌ Error assigning plan:', error);
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error('❌ Lỗi khi rollback:', rollbackError.message);
    }
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
      const startTimeFormatted = toTimeStr(a.schedule?.start_time, '07:00');
      const endTimeFormatted = toTimeStr(a.schedule?.end_time, '08:30');
      const workingDateStr = toYYYYMMDD(a.schedule?.working_date);
      const startDateTime = workingDateStr ? `${workingDateStr}T${startTimeFormatted}:00` : null;
      const endDateTime = workingDateStr ? `${workingDateStr}T${endTimeFormatted}:00` : null;

      return {
        id: a.appointment_id,
        ptName: a.schedule?.trainer?.user?.full_name || 'HLV Cá Nhân',
        trainer: a.schedule?.trainer?.user?.full_name || 'HLV Cá Nhân',
        date: toDateStr(a.schedule?.working_date),
        workingDate: workingDateStr,
        startTime: startTimeFormatted,
        endTime: endTimeFormatted,
        startDateTime,
        endDateTime,
        time: a.schedule?.working_date ? `${toDateStr(a.schedule.working_date)} (${startTimeFormatted} - ${endTimeFormatted})` : `${startTimeFormatted} - ${endTimeFormatted}`,
        type: a.note || 'Tập thử Gym',
        status: (a.status === 'Confirmed' || a.status === 'Scheduled' ? 'confirmed' : a.status || 'pending').toLowerCase(),
        cancelReason: a.cancel_reason,
        cancelRequestedAt: a.cancel_requested_at,
        cancelRequestedBy: a.cancel_requested_by
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
    let { date, time, type, note, trainerId } = req.body;

    if (!date || !time) {
      return res.status(400).json({ message: 'Vui lòng cung cấp ngày hẹn và thời gian!' });
    }

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (date < todayStr) {
      return res.status(400).json({ message: 'Không thể đặt lịch hẹn cho những ngày đã qua!' });
    }

    const member = await models.Members.findOne({ where: { user_id: req.user.userId } });
    if (!member) {
      return res.status(400).json({ message: 'Hồ sơ hội viên chưa được thiết lập!' });
    }

    if (trainerId) {
      trainerId = Number(trainerId);
    }

    // To link an appointment, we need a TrainerSchedule.
    // Try to find the member's active PT from their workout plans if not explicitly selected
    if (!trainerId) {
      const activeWorkoutPlan = await models.WorkoutPlans.findOne({
        where: { member_id: member.member_id },
        order: [['created_at', 'DESC']]
      });

      if (activeWorkoutPlan) {
        trainerId = activeWorkoutPlan.trainer_id;
      } else {
        // Look in MealPlans if no WorkoutPlan exists
        const activeMealPlan = await models.MealPlans.findOne({
          where: { member_id: member.member_id },
          order: [['created_at', 'DESC']]
        });
        if (activeMealPlan) {
          trainerId = activeMealPlan.trainer_id;
        }
      }
    }

    // Fallback: pick the first trainer in database
    if (!trainerId) {
      const defaultTrainer = await models.Trainers.findOne();
      if (!defaultTrainer) {
        return res.status(400).json({ message: 'Hệ thống hiện tại chưa có HLV nào hoạt động để đặt lịch!' });
      }
      trainerId = defaultTrainer.trainer_id;
    }

    // Add 1.5 hours
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + 90;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    
    // Format times as string (e.g. HH:mm:00) to avoid MSSQL parameter binding / type validation errors
    const start_time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
    const end_time = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;
    const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    // Check if slot already booked
    const existingSchedule = await models.TrainerSchedules.findOne({
      where: {
        trainer_id: trainerId,
        working_date: date,
        start_time: start_time,
        availability_status: ['Busy', 'Off']
      }
    });

    if (existingSchedule) {
      return res.status(400).json({ message: 'Ca tập này đã có người đặt hoặc HLV đang bận, vui lòng chọn ca khác!' });
    }

    // Create a new Available Trainer Schedule row
    const newSchedule = await models.TrainerSchedules.create({
      trainer_id: trainerId,
      working_date: date,
      start_time,
      end_time,
      availability_status: 'Available'
    });

    const newAppt = await models.Appointments.create({
      member_id: member.member_id,
      schedule_id: newSchedule.schedule_id,
      status: 'Pending',
      note: note || type || 'Đăng ký tập luyện cá nhân'
      // Omitted created_at so SQL Server default getdate() is used
    });

    // Create real-time notification for Trainer
    try {
      const memberUser = await models.Users.findByPk(member.user_id);
      const memberName = memberUser?.full_name || 'Hội viên';
      
      const trainerRecord = await models.Trainers.findByPk(trainerId);
      if (trainerRecord) {
        const trainerUserId = trainerRecord.user_id;
        const notification = await models.Notifications.create({
          user_id: trainerUserId,
          title: 'Yêu cầu đặt lịch mới',
          content: `Hội viên ${memberName} đã gửi yêu cầu đặt lịch tập mới vào ngày ${toDateStr(date)} lúc ${time}.`,
          notification_type: 'appointment_booked',
          is_read: false
        });

        // Emit via notificationEmitter
        const notificationEmitter = require('../utils/notificationEmitter');
        notificationEmitter.emit('notification_created', {
          user_id: trainerUserId,
          notification: {
            notification_id: notification.notification_id,
            user_id: trainerUserId,
            title: notification.title,
            content: notification.content,
            notification_type: notification.notification_type,
            is_read: notification.is_read,
            created_at: new Date()
          }
        });
      }
    } catch (notifErr) {
      console.error('⚠️ Lỗi tạo thông báo đặt lịch:', notifErr.message);
    }

    // Fetch the target trainer details to return in response
    const targetTrainer = await models.Trainers.findByPk(trainerId, {
      include: [{ model: models.Users, as: 'user', attributes: ['full_name'] }]
    });

    return res.status(201).json({
      message: 'Đăng ký lịch hẹn thành công! Đang chờ huấn luyện viên xác nhận.',
      appointment: {
        id: newAppt.appointment_id,
        ptName: targetTrainer?.user?.full_name || 'HLV Cá Nhân',
        date: date,
        time: `${time} - ${endTimeStr}`,
        type: newAppt.note,
        status: newAppt.status
      }
    });

  } catch (error) {
    console.error('❌ Error creating member appointment:', error);
    return res.status(500).json({ message: 'Lỗi server khi đăng ký lịch tập!: ' + error.message });
  }
};

// GET /api/dashboard/member/my-trainers
exports.getMemberTrainers = async (req, res) => {
  try {
    const member = await models.Members.findOne({ where: { user_id: req.user.userId } });
    if (!member) {
      return res.status(200).json({ trainers: [] });
    }

    // Find all distinct trainer IDs associated with this member in WorkoutPlans or MealPlans
    const workoutPlans = await models.WorkoutPlans.findAll({
      where: { member_id: member.member_id },
      attributes: ['trainer_id']
    });

    const mealPlans = await models.MealPlans.findAll({
      where: { member_id: member.member_id },
      attributes: ['trainer_id']
    });

    const trainerIds = new Set();
    workoutPlans.forEach(wp => { if (wp.trainer_id) trainerIds.add(wp.trainer_id); });
    mealPlans.forEach(mp => { if (mp.trainer_id) trainerIds.add(mp.trainer_id); });

    if (trainerIds.size === 0) {
      return res.status(200).json({ trainers: [] });
    }

    // Retrieve Trainer records along with User info
    const trainers = await models.Trainers.findAll({
      where: { trainer_id: Array.from(trainerIds) },
      include: [{
        model: models.Users,
        as: 'user',
        attributes: ['user_id', 'full_name', 'avatar_url']
      }]
    });

    const result = trainers.map(t => ({
      userId: t.user?.user_id,
      trainerId: t.trainer_id,
      fullName: t.user?.full_name || 'Huấn luyện viên',
      avatarUrl: t.user?.avatar_url ? `${req.protocol}://${req.get('host')}${t.user.avatar_url}` : null,
      specialization: t.specialization || 'Gym tổng hợp',
      experienceYears: t.experience_years || 0,
      bio: t.bio || '',
      rating: t.rating || 4.5
    }));

    return res.status(200).json({ trainers: result });
  } catch (error) {
    console.error('❌ Error getting member trainers:', error);
    return res.status(500).json({ message: 'Lỗi server khi lấy danh sách PT của bạn!' });
  }
};

// GET /api/dashboard/trainer/schedule
exports.getTrainerScheduleForDashboard = async (req, res) => {
  try {
    const trainerUser = await models.Trainers.findOne({ where: { user_id: req.user.userId } });
    if (!trainerUser) {
      return res.status(400).json({ message: 'Chỉ huấn luyện viên mới có thể xem lịch trình!' });
    }

    const { startDate, endDate } = req.query;
    const whereCondition = { trainer_id: trainerUser.trainer_id };
    if (startDate && endDate) {
      whereCondition.working_date = {
        [require('sequelize').Op.between]: [startDate, endDate]
      };
    }

    const schedules = await models.TrainerSchedules.findAll({
      where: whereCondition,
      order: [['working_date', 'ASC'], ['start_time', 'ASC']]
    });

    const formatTimeField = (val) => {
      if (!val) return '00:00:00';
      if (typeof val === 'string') return val;
      if (val instanceof Date) {
        const h = String(val.getUTCHours()).padStart(2, '0');
        const m = String(val.getUTCMinutes()).padStart(2, '0');
        const s = String(val.getUTCSeconds()).padStart(2, '0');
        return `${h}:${m}:${s}`;
      }
      return '00:00:00';
    };

    const result = schedules.map(s => ({
      scheduleId: s.schedule_id,
      workingDate: s.working_date,
      startTime: formatTimeField(s.start_time),
      endTime: formatTimeField(s.end_time),
      status: s.availability_status
    }));

    return res.status(200).json({ schedules: result });
  } catch (error) {
    console.error('❌ Error getting trainer schedule for dashboard:', error);
    return res.status(500).json({ message: 'Lỗi server khi lấy lịch trình của bạn!' });
  }
};

// POST /api/dashboard/trainer/schedule/toggle
exports.toggleTrainerSchedule = async (req, res) => {
  try {
    const trainerUser = await models.Trainers.findOne({ where: { user_id: req.user.userId } });
    if (!trainerUser) {
      return res.status(400).json({ message: 'Chỉ huấn luyện viên mới được phép quản lý lịch!' });
    }

    const { date, startTime, endTime } = req.body;
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ ngày và giờ của ca tập!' });
    }

    // Check if slot has an active member appointment (pending, confirmed, etc.)
    const existingSchedule = await models.TrainerSchedules.findOne({
      where: {
        trainer_id: trainerUser.trainer_id,
        working_date: date,
        start_time: startTime
      }
    });

    if (existingSchedule) {
      // Check if there is an appointment linked to this schedule that is Confirmed, Scheduled, or Pending
      const linkedAppt = await models.Appointments.findOne({
        where: {
          schedule_id: existingSchedule.schedule_id,
          status: ['Pending', 'Confirmed', 'Scheduled']
        }
      });

      if (linkedAppt) {
        return res.status(400).json({ 
          message: 'Ca này đã có học viên đăng ký hoặc đang chờ duyệt lịch, bạn không thể thay đổi trạng thái bận! Hãy từ chối/hủy lịch hẹn trước.' 
        });
      }

      // Toggle status
      const nextStatus = existingSchedule.availability_status === 'Busy' ? 'Available' : 'Busy';
      await existingSchedule.update({ availability_status: nextStatus });
      return res.status(200).json({ 
        message: `Đã chuyển ca sang trạng thái ${nextStatus === 'Busy' ? 'BẬN' : 'RẢNH'}.`,
        status: nextStatus 
      });
    } else {
      // Create new busy schedule row
      const newSchedule = await models.TrainerSchedules.create({
        trainer_id: trainerUser.trainer_id,
        working_date: date,
        start_time: startTime,
        end_time: endTime,
        availability_status: 'Busy'
      });
      return res.status(201).json({ 
        message: 'Đã chuyển ca sang trạng thái BẬN.',
        status: 'Busy' 
      });
    }
  } catch (error) {
    console.error('❌ Error toggling trainer schedule:', error);
    return res.status(500).json({ message: 'Lỗi server khi cập nhật lịch bận của bạn!' });
  }
};

// POST /api/dashboard/trainer/schedule/bulk-save
exports.bulkSaveTrainerSchedule = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const trainerUser = await models.Trainers.findOne({ where: { user_id: req.user.userId } });
    if (!trainerUser) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Chỉ huấn luyện viên mới được phép quản lý lịch!' });
    }

    const { startDate, endDate, busySlots } = req.body;
    if (!startDate || !endDate || !Array.isArray(busySlots)) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Dữ liệu lưu lịch không hợp lệ!' });
    }

    // 1. Find all appointments of this PT in this date range to prevent deleting their schedules
    const activeAppts = await models.Appointments.findAll({
      include: [{
        model: models.TrainerSchedules,
        as: 'schedule',
        where: {
          trainer_id: trainerUser.trainer_id,
          working_date: {
            [require('sequelize').Op.between]: [startDate, endDate]
          }
        }
      }],
      transaction
    });

    const activeScheduleIds = activeAppts.map(a => a.schedule_id);

    // 2. Delete all schedule rows in the range for this trainer EXCEPT those with active appointments
    const { Op } = require('sequelize');
    await models.TrainerSchedules.destroy({
      where: {
        trainer_id: trainerUser.trainer_id,
        working_date: {
          [Op.between]: [startDate, endDate]
        },
        schedule_id: {
          [Op.notIn]: activeScheduleIds.length > 0 ? activeScheduleIds : [-1]
        }
      },
      transaction
    });

    // 3. Insert new busy slots
    const schedulesToCreate = [];
    for (const slot of busySlots) {
      // Check if there is already a schedule (which must be an active appointment, since others were deleted)
      const exists = await models.TrainerSchedules.findOne({
        where: {
          trainer_id: trainerUser.trainer_id,
          working_date: slot.date,
          start_time: slot.startTime
        },
        transaction
      });

      if (!exists) {
        schedulesToCreate.push({
          trainer_id: trainerUser.trainer_id,
          working_date: slot.date,
          start_time: slot.startTime,
          end_time: slot.endTime,
          availability_status: 'Busy'
        });
      }
    }

    if (schedulesToCreate.length > 0) {
      await models.TrainerSchedules.bulkCreate(schedulesToCreate, { transaction });
    }

    await transaction.commit();
    return res.status(200).json({ message: 'Lưu lịch bận thành công!' });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error bulk saving trainer schedule:', error);
    return res.status(500).json({ message: 'Lỗi server khi lưu lịch bận của bạn! Chi tiết: ' + error.message });
  }
};

// PUT /api/dashboard/member/appointments/:id/cancel
exports.requestMemberAppointmentCancel = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Vui lòng cung cấp lý do hủy lịch hẹn!' });
    }

    const appointment = await models.Appointments.findOne({
      where: { appointment_id: id },
      include: [
        {
          model: models.Members,
          as: 'member',
          include: [{ model: models.Users, as: 'user', attributes: ['user_id', 'full_name'] }]
        },
        {
          model: models.TrainerSchedules,
          as: 'schedule',
          include: [
            {
              model: models.Trainers,
              as: 'trainer',
              include: [{ model: models.Users, as: 'user', attributes: ['user_id', 'full_name'] }]
            }
          ]
        }
      ]
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn!' });
    }

    // Update status, reason, request time, and requested by
    await appointment.update({
      status: 'CancelPending',
      cancel_reason: reason,
      cancel_requested_at: require('sequelize').fn('getdate'),
      cancel_requested_by: 'MEMBER'
    });

    // Notify the Trainer
    try {
      const trainerUserId = appointment.schedule?.trainer?.user?.user_id;
      if (trainerUserId) {
        const memberName = appointment.member?.user?.full_name || 'Hội viên';
        const dateFormatted = appointment.schedule?.working_date ? toDateStr(appointment.schedule.working_date) : 'N/A';
        const startTimeFormatted = appointment.schedule?.start_time ? toTimeStr(appointment.schedule.start_time, '07:00') : 'N/A';
        const endTimeFormatted = appointment.schedule?.end_time ? toTimeStr(appointment.schedule.end_time, '08:30') : 'N/A';
        
        const titleStr = 'Yêu cầu hủy lịch hẹn tập';
        const contentStr = `Học viên ${memberName} gửi yêu cầu hủy lịch dạy lúc ${startTimeFormatted} - ${endTimeFormatted} ngày ${dateFormatted}. Lý do: ${reason}`;

        const notification = await models.Notifications.create({
          user_id: trainerUserId,
          title: titleStr,
          content: contentStr,
          notification_type: 'appointment_cancel_request',
          is_read: false
        });

        // Push real-time SSE notification
        const notificationEmitter = require('../utils/notificationEmitter');
        notificationEmitter.emit('notification_created', {
          user_id: trainerUserId,
          notification: {
            notification_id: notification.notification_id,
            user_id: trainerUserId,
            title: notification.title,
            content: notification.content,
            notification_type: notification.notification_type,
            is_read: false,
            created_at: notification.created_at || new Date()
          }
        });
      }
    } catch (notifErr) {
      console.error('❌ Error creating cancel request notification:', notifErr);
    }

    return res.status(200).json({ message: 'Đã gửi yêu cầu hủy lịch hẹn tập. Đang chờ HLV duyệt!' });
  } catch (error) {
    console.error('❌ Error requesting cancel appointment:', error);
    return res.status(500).json({ message: 'Lỗi server khi gửi yêu cầu hủy!' });
  }
};

// PUT /api/dashboard/trainer/appointments/:id/cancel-respond
exports.respondTrainerAppointmentCancel = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    const appointment = await models.Appointments.findOne({
      where: { appointment_id: id },
      include: [
        {
          model: models.Members,
          as: 'member',
          include: [{ model: models.Users, as: 'user', attributes: ['user_id', 'full_name'] }]
        },
        {
          model: models.TrainerSchedules,
          as: 'schedule',
          include: [
            {
              model: models.Trainers,
              as: 'trainer',
              include: [{ model: models.Users, as: 'user', attributes: ['user_id', 'full_name'] }]
            }
          ]
        }
      ]
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn!' });
    }

    const nextStatus = action === 'accept' ? 'Cancelled' : 'Confirmed';
    await appointment.update({ status: nextStatus });

    // Update schedule status
    if (appointment.schedule_id) {
      const nextAvailability = action === 'accept' ? 'Available' : 'Busy';
      await models.TrainerSchedules.update(
        { availability_status: nextAvailability },
        { where: { schedule_id: appointment.schedule_id } }
      );
    }

    // Auto mark the Trainer's cancellation request notification as read
    try {
      const trainerUserId = appointment.schedule?.trainer?.user?.user_id;
      const dateFormatted = appointment.schedule?.working_date ? toDateStr(appointment.schedule.working_date) : 'N/A';
      const startTimeFormatted = appointment.schedule?.start_time ? toTimeStr(appointment.schedule.start_time, '07:00') : 'N/A';

      if (trainerUserId) {
        const ptNotification = await models.Notifications.findOne({
          where: {
            user_id: trainerUserId,
            notification_type: 'appointment_cancel_request',
            is_read: false,
            content: {
              [require('sequelize').Op.like]: `%ngày ${dateFormatted}%`
            }
          }
        });

        if (ptNotification) {
          await ptNotification.update({ is_read: true });
          
          const notificationEmitter = require('../utils/notificationEmitter');
          notificationEmitter.emit('notification_created', {
            user_id: trainerUserId,
            notification: {
              notification_id: ptNotification.notification_id,
              user_id: trainerUserId,
              title: ptNotification.title,
              content: ptNotification.content,
              notification_type: ptNotification.notification_type,
              is_read: true,
              created_at: ptNotification.created_at || new Date()
            }
          });
        }
      }
    } catch (ptNotifErr) {
      console.error('❌ Error marking trainer notif read:', ptNotifErr);
    }

    // Notify Member
    try {
      const memberUserId = appointment.member?.user?.user_id;
      if (memberUserId) {
        const ptName = appointment.schedule?.trainer?.user?.full_name || 'Huấn luyện viên';
        const dateFormatted = appointment.schedule?.working_date ? toDateStr(appointment.schedule.working_date) : 'N/A';
        const startTimeFormatted = appointment.schedule?.start_time ? toTimeStr(appointment.schedule.start_time, '07:00') : 'N/A';

        const titleStr = action === 'accept' ? 'Yêu cầu hủy lịch đã được chấp nhận' : 'Yêu cầu hủy lịch bị từ chối';
        const contentStr = action === 'accept'
          ? `HLV ${ptName} đã đồng ý hủy lịch dạy ngày ${dateFormatted} lúc ${startTimeFormatted}.`
          : `HLV ${ptName} đã từ chối yêu cầu hủy lịch dạy ngày ${dateFormatted} lúc ${startTimeFormatted}.`;

        const notification = await models.Notifications.create({
          user_id: memberUserId,
          title: titleStr,
          content: contentStr,
          notification_type: action === 'accept' ? 'appointment_cancel_accepted' : 'appointment_cancel_rejected',
          is_read: false
        });

        const notificationEmitter = require('../utils/notificationEmitter');
        notificationEmitter.emit('notification_created', {
          user_id: memberUserId,
          notification: {
            notification_id: notification.notification_id,
            user_id: memberUserId,
            title: notification.title,
            content: notification.content,
            notification_type: notification.notification_type,
            is_read: false,
            created_at: notification.created_at || new Date()
          }
        });
      }
    } catch (notifErr) {
      console.error('❌ Error sending member cancellation response notification:', notifErr);
    }

    return res.status(200).json({ 
      message: action === 'accept' 
        ? 'Đã đồng ý hủy lịch hẹn!' 
        : 'Đã từ chối hủy lịch hẹn!' 
    });
  } catch (error) {
    console.error('❌ Error responding to cancel appointment:', error);
    return res.status(500).json({ message: 'Lỗi server khi phản hồi yêu cầu hủy!' });
  }
};

// PUT /api/dashboard/trainer/appointments/:id/cancel
exports.requestTrainerAppointmentCancel = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Vui lòng cung cấp lý do hủy lịch dạy!' });
    }

    const appointment = await models.Appointments.findOne({
      where: { appointment_id: id },
      include: [
        {
          model: models.Members,
          as: 'member',
          include: [{ model: models.Users, as: 'user', attributes: ['user_id', 'full_name'] }]
        },
        {
          model: models.TrainerSchedules,
          as: 'schedule',
          include: [
            {
              model: models.Trainers,
              as: 'trainer',
              include: [{ model: models.Users, as: 'user', attributes: ['user_id', 'full_name'] }]
            }
          ]
        }
      ]
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Không tìm thấy lịch dạy!' });
    }

    // Update status, reason, request time, and requested by
    await appointment.update({
      status: 'CancelPending',
      cancel_reason: reason,
      cancel_requested_at: require('sequelize').fn('getdate'),
      cancel_requested_by: 'TRAINER'
    });

    // Notify the Member
    try {
      const memberUserId = appointment.member?.user?.user_id;
      if (memberUserId) {
        const ptName = appointment.schedule?.trainer?.user?.full_name || 'HLV';
        const dateFormatted = appointment.schedule?.working_date ? toDateStr(appointment.schedule.working_date) : 'N/A';
        const startTimeFormatted = appointment.schedule?.start_time ? toTimeStr(appointment.schedule.start_time, '07:00') : 'N/A';
        const endTimeFormatted = appointment.schedule?.end_time ? toTimeStr(appointment.schedule.end_time, '08:30') : 'N/A';
        
        const titleStr = 'Huấn luyện viên yêu cầu hủy lịch dạy';
        const contentStr = `HLV ${ptName} gửi yêu cầu hủy lịch dạy lúc ${startTimeFormatted} - ${endTimeFormatted} ngày ${dateFormatted}. Lý do: ${reason}`;

        const notification = await models.Notifications.create({
          user_id: memberUserId,
          title: titleStr,
          content: contentStr,
          notification_type: 'appointment_cancel_request_pt',
          is_read: false
        });

        // Push real-time SSE notification
        const notificationEmitter = require('../utils/notificationEmitter');
        notificationEmitter.emit('notification_created', {
          user_id: memberUserId,
          notification: {
            notification_id: notification.notification_id,
            user_id: memberUserId,
            title: notification.title,
            content: notification.content,
            notification_type: notification.notification_type,
            is_read: false,
            created_at: notification.created_at || new Date()
          }
        });
      }
    } catch (notifErr) {
      console.error('❌ Error creating PT cancel request notification:', notifErr);
    }

    return res.status(200).json({ message: 'Đã gửi yêu cầu hủy lịch dạy. Đang chờ học viên duyệt!' });
  } catch (error) {
    console.error('❌ Error PT requesting cancel appointment:', error);
    return res.status(500).json({ message: 'Lỗi server khi gửi yêu cầu hủy lịch!' });
  }
};

// PUT /api/dashboard/member/appointments/:id/cancel-respond
exports.respondMemberAppointmentCancel = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    const appointment = await models.Appointments.findOne({
      where: { appointment_id: id },
      include: [
        {
          model: models.Members,
          as: 'member',
          include: [{ model: models.Users, as: 'user', attributes: ['user_id', 'full_name'] }]
        },
        {
          model: models.TrainerSchedules,
          as: 'schedule',
          include: [
            {
              model: models.Trainers,
              as: 'trainer',
              include: [{ model: models.Users, as: 'user', attributes: ['user_id', 'full_name'] }]
            }
          ]
        }
      ]
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn!' });
    }

    const nextStatus = action === 'accept' ? 'Cancelled' : 'Confirmed';
    await appointment.update({ status: nextStatus });

    // Update schedule status
    if (appointment.schedule_id) {
      const nextAvailability = action === 'accept' ? 'Available' : 'Busy';
      await models.TrainerSchedules.update(
        { availability_status: nextAvailability },
        { where: { schedule_id: appointment.schedule_id } }
      );
    }

    // Auto mark the Member's cancellation request notification as read
    try {
      const memberUserId = appointment.member?.user?.user_id;
      const dateFormatted = appointment.schedule?.working_date ? toDateStr(appointment.schedule.working_date) : 'N/A';

      if (memberUserId) {
        const memberNotification = await models.Notifications.findOne({
          where: {
            user_id: memberUserId,
            notification_type: 'appointment_cancel_request_pt',
            is_read: false,
            content: {
              [require('sequelize').Op.like]: `%ngày ${dateFormatted}%`
            }
          }
        });

        if (memberNotification) {
          await memberNotification.update({ is_read: true });
          
          const notificationEmitter = require('../utils/notificationEmitter');
          notificationEmitter.emit('notification_created', {
            user_id: memberUserId,
            notification: {
              notification_id: memberNotification.notification_id,
              user_id: memberUserId,
              title: memberNotification.title,
              content: memberNotification.content,
              notification_type: memberNotification.notification_type,
              is_read: true,
              created_at: memberNotification.created_at || new Date()
            }
          });
        }
      }
    } catch (memberNotifErr) {
      console.error('❌ Error marking member notif read:', memberNotifErr);
    }

    // Notify Trainer
    try {
      const trainerUserId = appointment.schedule?.trainer?.user?.user_id;
      if (trainerUserId) {
        const memberName = appointment.member?.user?.full_name || 'Hội viên';
        const dateFormatted = appointment.schedule?.working_date ? toDateStr(appointment.schedule.working_date) : 'N/A';
        const startTimeFormatted = appointment.schedule?.start_time ? toTimeStr(appointment.schedule.start_time, '07:00') : 'N/A';

        const titleStr = action === 'accept' ? 'Yêu cầu hủy lịch dạy đã được đồng ý' : 'Yêu cầu hủy lịch dạy bị từ chối';
        const contentStr = action === 'accept'
          ? `Học viên ${memberName} đã đồng ý hủy lịch dạy ngày ${dateFormatted} lúc ${startTimeFormatted}.`
          : `Học viên ${memberName} đã từ chối yêu cầu hủy lịch dạy ngày ${dateFormatted} lúc ${startTimeFormatted}.`;

        const notification = await models.Notifications.create({
          user_id: trainerUserId,
          title: titleStr,
          content: contentStr,
          notification_type: action === 'accept' ? 'appointment_cancel_accepted_member' : 'appointment_cancel_rejected_member',
          is_read: false
        });

        const notificationEmitter = require('../utils/notificationEmitter');
        notificationEmitter.emit('notification_created', {
          user_id: trainerUserId,
          notification: {
            notification_id: notification.notification_id,
            user_id: trainerUserId,
            title: notification.title,
            content: notification.content,
            notification_type: notification.notification_type,
            is_read: false,
            created_at: notification.created_at || new Date()
          }
        });
      }
    } catch (notifErr) {
      console.error('❌ Error sending trainer cancellation response notification:', notifErr);
    }

    return res.status(200).json({ 
      message: action === 'accept' 
        ? 'Đã đồng ý hủy lịch hẹn!' 
        : 'Đã từ chối hủy lịch hẹn!' 
    });
  } catch (error) {
    console.error('❌ Error responding to cancel appointment:', error);
    return res.status(500).json({ message: 'Lỗi server khi phản hồi yêu cầu hủy!' });
  }
};
