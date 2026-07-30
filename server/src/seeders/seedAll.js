const { Sequelize } = require('sequelize');
Sequelize.DATE.prototype.stringify = function (date, options) {
  date = this._applyTimezone(date, options);
  return date.format('YYYY-MM-DD HH:mm:ss.SSS');
};

const { sequelize, models } = require('../config/db');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const crypto = require('crypto');

// Safety Checks
if (process.env.NODE_ENV === 'production') {
  console.error('❌ ERROR: Cannot run seeding script in PRODUCTION environment!');
  process.exit(1);
}

const config = sequelize.connectionManager.config;
if (config && config.host) {
  const hostLower = config.host.toLowerCase();
  const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(hostLower);
  const isLocalNamedInstance = !config.host.includes('.') && hostLower !== 'production';
  if (!isLocalhost && !isLocalNamedInstance) {
    console.error('❌ SAFETY WARNING: Seeding is only allowed on LOCAL databases (localhost/127.0.0.1)! Connected host: ' + config.host);
    process.exit(1);
  }
}

// Helper formatting functions for SQL Server
function formatDateForDB(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatDateOnlyForDB(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const VN_LAST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const VN_MID_NAMES_MALE = ['Văn', 'Đức', 'Minh', 'Hoàng', 'Gia', 'Anh', 'Khánh', 'Tuấn', 'Quang', 'Hữu', 'Ngọc', 'Thanh', 'Quốc'];
const VN_MID_NAMES_FEMALE = ['Thị', 'Hồng', 'Mai', 'Kim', 'Ngọc', 'Hải', 'Phương', 'Bích', 'Thu', 'Thanh', 'Cẩm', 'Mỹ', 'Linh'];
const VN_FIRST_NAMES_MALE = ['Hùng', 'Cường', 'Dũng', 'Tuấn', 'Nam', 'Bình', 'Hải', 'Sơn', 'Phúc', 'Tâm', 'Phong', 'Lâm', 'Kha', 'Long', 'Đạt', 'Hiếu', 'Khoa', 'Kiệt', 'Bảo', 'Tú'];
const VN_FIRST_NAMES_FEMALE = ['Lan', 'Mai', 'Vy', 'Hương', 'An', 'Trang', 'Phương', 'Dương', 'Linh', 'Huệ', 'Trúc', 'Quỳnh', 'Thảo', 'Trà', 'Nhi', 'Yến', 'Anh', 'Hà', 'Đào', 'Cúc'];

function getRandomName(gender) {
  const last = VN_LAST_NAMES[Math.floor(Math.random() * VN_LAST_NAMES.length)];
  let mid, first;
  if (gender === 'Male' || gender === 'Nam') {
    mid = VN_MID_NAMES_MALE[Math.floor(Math.random() * VN_MID_NAMES_MALE.length)];
    first = VN_FIRST_NAMES_MALE[Math.floor(Math.random() * VN_FIRST_NAMES_MALE.length)];
  } else {
    mid = VN_MID_NAMES_FEMALE[Math.floor(Math.random() * VN_MID_NAMES_FEMALE.length)];
    first = VN_FIRST_NAMES_FEMALE[Math.floor(Math.random() * VN_FIRST_NAMES_FEMALE.length)];
  }
  return `${last} ${mid} ${first}`;
}

function getRandomPhone() {
  const prefixes = ['090', '091', '098', '097', '096', '093', '094', '086', '088', '032', '033', '034', '035', '036', '037', '038', '039', '070', '076', '077', '078', '079', '081', '082', '083', '084', '085'];
  const pref = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(1000000 + Math.random() * 9000000);
  return `${pref}${num}`;
}

const PLANS_MAP = [
  { id: 76, name: 'Gym 3 Tháng', price: 1500000, type: 'Membership', duration: 3 },
  { id: 79, name: 'Yoga 3 Tháng', price: 1800000, type: 'Membership', duration: 3 },
  { id: 77, name: 'Gym 6 Tháng', price: 2800000, type: 'Membership', duration: 6 },
  { id: 80, name: 'Yoga 6 Tháng', price: 3200000, type: 'Membership', duration: 6 },
  { id: 78, name: 'Gym 12 Tháng', price: 5000000, type: 'Membership', duration: 12 },
  { id: 81, name: 'Yoga 12 Tháng', price: 6000000, type: 'Membership', duration: 12 }
];

const TARGET_REVENUE = {
  2025: {
    1: 120000000,
    2: 100000000,
    3: 140000000,
    4: 150000000,
    5: 160000000,
    6: 130000000,
    7: 170000000,
    8: 180000000,
    9: 150000000,
    10: 200000000,
    11: 210000000,
    12: 250000000
  },
  2026: {
    1: 150000000,
    2: 130000000,
    3: 170000000,
    4: 180000000,
    5: 190000000,
    6: 160000000,
    7: 200000000
  }
};

function distributeRevenueToPayments(totalAmount) {
  const minK = Math.max(8, Math.ceil(totalAmount / 18000000));
  const maxK = Math.max(minK + 4, 15);
  const K = Math.floor(minK + Math.random() * (maxK - minK + 1));
  let remaining = totalAmount;
  let parts = [];
  
  for (let i = 0; i < K; i++) {
    let avg = remaining / (K - i);
    let variation = (Math.random() * 0.6 - 0.3) * avg;
    let target = Math.round((avg + variation) / 100000) * 100000;
    
    let minAllowed = 1500000;
    let maxAllowed = Math.min(20000000, remaining - (K - 1 - i) * 1500000);
    
    if (i === K - 1) {
      target = remaining;
    } else {
      if (target < minAllowed) target = minAllowed;
      if (target > maxAllowed) target = maxAllowed;
    }
    
    const validPlans = PLANS_MAP.filter(p => p.price <= target);
    let plan = validPlans[validPlans.length - 1];
    if (!plan) plan = PLANS_MAP[0];
    
    let ptPrice = 0;
    let srvPrice = 0;
    let leftover = target - plan.price;
    
    if (leftover > 0) {
      if (leftover >= 50000) {
        srvPrice = Math.min(leftover, [50000, 100000, 150000, 200000][Math.floor(Math.random() * 4)]);
        leftover -= srvPrice;
      }
      if (leftover > 0) {
        ptPrice = leftover;
      }
    }
    
    parts.push({
      amount: target,
      planId: plan.id,
      duration: plan.duration,
      ptPrice: ptPrice,
      srvPrice: srvPrice
    });
    
    remaining -= target;
  }
  
  return parts;
}

function getRandomDateInMonth(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  let maxDay = daysInMonth;
  if (year === 2026 && month === 7) {
    maxDay = 30;
  }
  const day = Math.floor(1 + Math.random() * maxDay);
  
  const hour = Math.floor(7 + Math.random() * 14);
  const min = Math.floor(Math.random() * 60);
  const sec = Math.floor(Math.random() * 60);
  
  const d = new Date(year, month - 1, day, hour, min, sec);
  return d;
}

async function run() {
  const transaction = await sequelize.transaction();
  try {
    console.log('🧹 Bước 1: Đang dọn dẹp dữ liệu cũ (Idempotent)...');
    
    const seedUsers = await models.Users.findAll({
      where: { email: { [Op.like]: 'seed_%' } },
      transaction
    });
    const seedUserIds = seedUsers.map(u => u.user_id);
    
    if (seedUserIds.length > 0) {
      const seedMembers = await models.Members.findAll({ where: { user_id: seedUserIds }, transaction });
      const seedMemberIds = seedMembers.map(m => m.member_id);
      
      const seedTrainers = await models.Trainers.findAll({ where: { user_id: seedUserIds }, transaction });
      const seedTrainerIds = seedTrainers.map(t => t.trainer_id);
      
      // Xóa tuần tự theo thứ tự ngược
      await models.ChatMessages.destroy({ where: { [Op.or]: [{ sender_id: seedUserIds }, { receiver_id: seedUserIds }] }, transaction });
      await models.Reports.destroy({ where: { [Op.or]: [{ reported_by: seedUserIds }, { reported_user_id: seedUserIds }] }, transaction });
      await models.Notifications.destroy({ where: { user_id: seedUserIds }, transaction });
      await models.Announcements.destroy({ where: { admin_id: seedUserIds }, transaction });
      
      if (seedMemberIds.length > 0) {
        // Delete WorkoutExercises and WorkoutPlans first to satisfy foreign key constraints
        const wps = await models.WorkoutPlans.findAll({ where: { member_id: seedMemberIds }, transaction });
        const wpIds = wps.map(w => w.workout_plan_id);
        if (wpIds.length > 0) {
          await models.WorkoutExercises.destroy({ where: { workout_plan_id: wpIds }, transaction });
          await models.WorkoutPlans.destroy({ where: { workout_plan_id: wpIds }, transaction });
        }

        await models.CheckIns.destroy({ where: { member_id: seedMemberIds }, transaction });
        await models.Appointments.destroy({ where: { member_id: seedMemberIds }, transaction });
        await models.PtBookings.destroy({ where: { member_id: seedMemberIds }, transaction });
        await models.MemberTrainerPackages.destroy({ where: { member_id: seedMemberIds }, transaction });
        await models.ProgressTrackings.destroy({ where: { member_id: seedMemberIds }, transaction });
        await models.AIConsultations.destroy({ where: { member_id: seedMemberIds }, transaction });
        await models.MemberServices.destroy({ where: { member_id: seedMemberIds }, transaction });
        await models.MemberMemberships.destroy({ where: { member_id: seedMemberIds }, transaction });
        await models.Payments.destroy({ where: { member_id: seedMemberIds }, transaction });
      }
      
      if (seedTrainerIds.length > 0) {
        await models.CheckIns.destroy({ where: { trainer_id: seedTrainerIds }, transaction });
        await models.PtBookings.destroy({ where: { trainer_id: seedTrainerIds }, transaction });
        await models.PtOffRequests.destroy({ where: { trainer_id: seedTrainerIds }, transaction });
        
        const schedules = await models.TrainerSchedules.findAll({ where: { trainer_id: seedTrainerIds }, transaction });
        const scheduleIds = schedules.map(s => s.schedule_id);
        if (scheduleIds.length > 0) {
          await models.Appointments.destroy({ where: { schedule_id: scheduleIds }, transaction });
        }
        await models.TrainerSchedules.destroy({ where: { trainer_id: seedTrainerIds }, transaction });
        await models.TrainerCertifications.destroy({ where: { trainer_id: seedTrainerIds }, transaction });
        await models.MemberTrainerPackages.destroy({ where: { trainer_id: seedTrainerIds }, transaction });
      }
      
      await models.Members.destroy({ where: { user_id: seedUserIds }, transaction });
      await models.Trainers.destroy({ where: { user_id: seedUserIds }, transaction });
      await models.Users.destroy({ where: { user_id: seedUserIds }, transaction });
      
      // Remove any leftover Boxing membership plans
      await models.MembershipPlans.destroy({ where: { sport_type: 'Boxing' }, transaction });
      
      console.log(`  👉 Đã dọn dẹp xong ${seedUsers.length} tài khoản seed cũ.`);
    }

    console.log('⏳ Bước 2: Chuẩn bị danh mục tĩnh (Roles, Services)...');
    
    const roles = [
      { role_id: 1, role_name: 'Member' },
      { role_id: 2, role_name: 'PT' },
      { role_id: 3, role_name: 'Admin' }
    ];
    for (const r of roles) {
      const exists = await models.Roles.findByPk(r.role_id, { transaction });
      if (!exists) {
        await models.Roles.create(r, { transaction });
      }
    }
    
    const defaultServices = [
      { service_id: 1, service_name: 'Bể bơi vô cực bốn mùa', service_type: 'Swimming', price: 100000, description: 'Bể bơi điều hòa nhiệt độ tiêu chuẩn Olympic.', status: 'Available' },
      { service_id: 2, service_name: 'Phòng xông hơi đá muối Sauna', service_type: 'Sauna', price: 150000, description: 'Xông hơi hồng ngoại giúp phục hồi cơ bắp sâu.', status: 'Available' },
      { service_id: 3, service_name: 'Tủ Locker thông minh cá nhân', service_type: 'Locker', price: 50000, description: 'Hệ thống tủ khóa bảo mật vân tay và mã số.', status: 'Available' }
    ];
    for (const s of defaultServices) {
      const exists = await models.Services.findByPk(s.service_id, { transaction });
      if (!exists) {
        await models.Services.create(s, { transaction });
      }
    }
    
    const passwordHash = await bcrypt.hash('Test@123', 10);
    
    console.log('⏳ Bước 3: Tạo người dùng Admin và PT/Trainers...');
    
    const admins = [];
    for (let i = 1; i <= 2; i++) {
      const email = `seed_admin_${i}@example.com`;
      const admin = await models.Users.create({
        full_name: `Admin Seed ${i}`,
        email,
        password_hash: passwordHash,
        phone_number: `099900000${i}`,
        gender: 'Male',
        date_of_birth: '1985-05-12',
        role_id: 3,
        status: 'Active',
        qr_token: crypto.randomBytes(32).toString('hex'),
        qr_created_at: formatDateForDB(new Date()),
        qr_is_active: true
      }, { transaction });
      admins.push(admin);
    }
    
    const specializations = ['Gym', 'Yoga'];
    const bios = [
      'Huấn luyện viên tận tâm, chuyên nghiệp, hỗ trợ học viên đạt mục tiêu thể hình mong muốn.',
      'Chuyên gia điều trị tư thế, phục hồi chấn thương và các bài tập dẻo dai cơ thể.',
      'Chuyên gia Cardio và thể lực cường độ cao, đem lại những bài tập bùng nổ năng lượng thú vị.',
      'Yêu thích âm nhạc và đem lại nguồn năng lượng tích cực qua các bài tập thể lực sôi động.'
    ];
    
    const trainers = [];
    for (let i = 1; i <= 10; i++) {
      const gender = i % 2 === 0 ? 'Female' : 'Male';
      const spec = specializations[i % specializations.length];
      const bio = bios[i % bios.length];
      const years = 1 + Math.floor(Math.random() * 14);
      
      const user = await models.Users.create({
        full_name: getRandomName(gender),
        email: `seed_trainer_${i}@example.com`,
        password_hash: passwordHash,
        phone_number: getRandomPhone(),
        gender,
        date_of_birth: `${1980 + i}-08-15`,
        role_id: 2,
        status: 'Active',
        qr_token: crypto.randomBytes(32).toString('hex'),
        qr_created_at: formatDateForDB(new Date()),
        qr_is_active: true
      }, { transaction });
      
      const trainer = await models.Trainers.create({
        user_id: user.user_id,
        specialization: spec,
        experience_years: years,
        experience_description: `Hơn ${years} năm giảng dạy cá nhân tại các trung tâm thể hình cao cấp.`,
        bio,
        rating: 4.5 + Math.random() * 0.5
      }, { transaction });
      
      trainers.push(trainer);
      
      await models.TrainerCertifications.create({
        trainer_id: trainer.trainer_id,
        certification_name: `Chứng chỉ HLV ${spec} Quốc Tế - Level ${i % 3 + 1}`,
        issued_by: 'Liên đoàn Thể thao Quốc gia',
        issued_date: '2024-01-10',
        expiry_date: '2029-01-10'
      }, { transaction });
    }

    console.log('⏳ Bước 4: Tạo hội viên (Members) - 80 người...');
    
    const members = [];
    for (let i = 1; i <= 80; i++) {
      const gender = i % 2 === 0 ? 'Female' : 'Male';
      const regDate = getRandomDateInMonth(i <= 45 ? 2025 : 2026, i <= 45 ? (i % 12 + 1) : (i % 7 + 1));
      const qrActive = i > 3;
      
      let status = 'Active';
      if (i === 1) status = 'Locked';
      if (i === 2) status = 'Inactive';
      
      const user = await models.Users.create({
        full_name: getRandomName(gender),
        email: `seed_member_${i}@example.com`,
        password_hash: passwordHash,
        phone_number: getRandomPhone(),
        gender,
        date_of_birth: `${1990 + (i % 15)}-03-24`,
        role_id: 1,
        status,
        created_at: formatDateForDB(regDate),
        qr_token: crypto.randomBytes(32).toString('hex'),
        qr_created_at: formatDateForDB(regDate),
        qr_is_active: qrActive
      }, { transaction });
      
      const height = 1.55 + (i % 30) * 0.01;
      const weight = 48 + (i % 40);
      
      const member = await models.Members.create({
        user_id: user.user_id,
        height,
        weight,
        fitness_goal: i % 2 === 0 ? 'Giảm mỡ toàn thân' : 'Tăng cơ, cải thiện sức bền',
        fitness_level: i % 3 === 0 ? 'Người mới bắt đầu' : 'Trung cấp',
        emergency_contact: getRandomPhone(),
        joined_date: formatDateOnlyForDB(regDate)
      }, { transaction });
      
      members.push(member);
    }

    console.log('⏳ Bước 5: Phân bổ và seeding doanh thu Payments (Khớp doanh thu mục tiêu)...');
    
    let totalGeneratedRevenue = 0;
    const monthlySummary = {};

    for (const year of [2025, 2026]) {
      monthlySummary[year] = {};
      const months = Object.keys(TARGET_REVENUE[year]);
      
      for (const mStr of months) {
        const month = parseInt(mStr);
        const targetAmount = TARGET_REVENUE[year][month];
        
        const paymentParts = distributeRevenueToPayments(targetAmount);
        let monthSum = 0;
        
        for (let idx = 0; idx < paymentParts.length; idx++) {
          const part = paymentParts[idx];
          const payDate = getRandomDateInMonth(year, month);
          const member = members[Math.floor(Math.random() * members.length)];
          const tCode = `SEEDPAY-${year}-${month}-${idx}-${Date.now() % 10000}`;
          
          await models.Payments.create({
            member_id: member.member_id,
            amount: part.amount,
            payment_type: 'Membership',
            payment_method: 'PayOS',
            payment_status: 'Paid',
            transaction_code: tCode,
            payment_date: formatDateForDB(payDate)
          }, { transaction });
          
          monthSum += part.amount;
          
          const durationMonths = part.duration;
          const endPayDate = new Date(payDate);
          endPayDate.setMonth(endPayDate.getMonth() + durationMonths);
          
          await models.MemberMemberships.create({
            member_id: member.member_id,
            membership_plan_id: part.planId,
            start_date: formatDateOnlyForDB(payDate),
            end_date: formatDateOnlyForDB(endPayDate),
            membership_status: 'Active'
          }, { transaction });
          
          if (part.ptPrice > 0) {
            const trainer = trainers[Math.floor(Math.random() * trainers.length)];
            const sessions = Math.floor(part.ptPrice / 250000);
            await models.MemberTrainerPackages.create({
              member_id: member.member_id,
              trainer_id: trainer.trainer_id,
              total_sessions: sessions,
              used_sessions: Math.min(sessions, Math.floor(Math.random() * (sessions - 2))),
              is_active: true,
              created_at: formatDateForDB(payDate)
            }, { transaction });
          }
          
          if (part.srvPrice > 0) {
            const srvId = (idx % 3) + 1;
            const srvEnd = new Date(payDate);
            srvEnd.setMonth(srvEnd.getMonth() + 1);
            await models.MemberServices.create({
              member_id: member.member_id,
              service_id: srvId,
              start_date: formatDateOnlyForDB(payDate),
              end_date: formatDateOnlyForDB(srvEnd),
              service_status: 'Active'
            }, { transaction });
          }
        }
        
        // Seed các payments lỗi/pending
        const pendingCount = 2 + Math.floor(Math.random() * 2);
        for (let pIdx = 0; pIdx < pendingCount; pIdx++) {
          const payDate = getRandomDateInMonth(year, month);
          const member = members[Math.floor(Math.random() * members.length)];
          await models.Payments.create({
            member_id: member.member_id,
            amount: 2500000,
            payment_type: 'Membership',
            payment_method: 'PayOS',
            payment_status: 'Pending',
            transaction_code: `SEEDPAY-PEND-${year}-${month}-${pIdx}`,
            payment_date: formatDateForDB(payDate)
          }, { transaction });
        }
        
        const failedCount = 1 + Math.floor(Math.random() * 2);
        for (let fIdx = 0; fIdx < failedCount; fIdx++) {
          const payDate = getRandomDateInMonth(year, month);
          const member = members[Math.floor(Math.random() * members.length)];
          await models.Payments.create({
            member_id: member.member_id,
            amount: 1800000,
            payment_type: 'Membership',
            payment_method: 'PayOS',
            payment_status: 'Failed',
            transaction_code: `SEEDPAY-FAIL-${year}-${month}-${fIdx}`,
            payment_date: formatDateForDB(payDate)
          }, { transaction });
        }
        
        if ((year === 2025 && [2, 5, 9, 12].includes(month)) || (year === 2026 && [3, 6].includes(month))) {
          const payDate = getRandomDateInMonth(year, month);
          const member = members[Math.floor(Math.random() * members.length)];
          await models.Payments.create({
            member_id: member.member_id,
            amount: 3200000,
            payment_type: 'Membership',
            payment_method: 'PayOS',
            payment_status: 'Failed',
            transaction_code: `SEEDPAY-REF-${year}-${month}`,
            payment_date: formatDateForDB(payDate)
          }, { transaction });
        }
        
        monthlySummary[year][month] = monthSum;
        totalGeneratedRevenue += monthSum;
      }
    }

    console.log('⏳ Bước 6: Tạo lịch sử Check-in và Check-out...');
    
    for (let cIdx = 0; cIdx < 300; cIdx++) {
      const m = members[Math.floor(Math.random() * members.length)];
      const checkinDate = getRandomDateInMonth(2025 + Math.floor(Math.random() * 2), Math.floor(1 + Math.random() * 7));
      
      await models.CheckIns.create({
        member_id: m.member_id,
        checkin_time: formatDateForDB(checkinDate)
      }, { transaction });
    }
    
    for (let cIdx = 0; cIdx < 50; cIdx++) {
      const t = trainers[Math.floor(Math.random() * trainers.length)];
      const checkinDate = getRandomDateInMonth(2026, Math.floor(1 + Math.random() * 7));
      const checkoutDate = new Date(checkinDate);
      checkoutDate.setHours(checkoutDate.getHours() + 4);
      
      await models.CheckIns.create({
        trainer_id: t.trainer_id,
        checkin_time: formatDateForDB(checkinDate),
        checkout_time: formatDateForDB(checkoutDate)
      }, { transaction });
    }
    
    const openCheckinPT1 = trainers[0];
    const openCheckinPT2 = trainers[1];
    
    const nowTime1 = new Date(2026, 6, 30, 14, 0, 0);
    const nowTime2 = new Date(2026, 6, 30, 15, 30, 0);
    
    await models.CheckIns.create({
      trainer_id: openCheckinPT1.trainer_id,
      checkin_time: formatDateForDB(nowTime1),
      checkout_time: null
    }, { transaction });
    
    await models.CheckIns.create({
      trainer_id: openCheckinPT2.trainer_id,
      checkin_time: formatDateForDB(nowTime2),
      checkout_time: null
    }, { transaction });

    console.log('⏳ Bước 7: Tạo Lịch biểu dạy, Đặt lịch PT và Nghỉ phép...');
    
    const dates = [];
    for (let day = 15; day <= 30; day++) {
      dates.push(`2026-07-${day}`);
    }
    
    const shifts = ['CA1', 'CA2', 'CA3', 'CA4', 'CA5', 'CA6', 'CA7'];
    const shiftTimes = {
      'CA1': { start: '05:00:00', end: '06:30:00' },
      'CA2': { start: '07:00:00', end: '08:30:00' },
      'CA3': { start: '09:00:00', end: '10:30:00' },
      'CA4': { start: '11:00:00', end: '12:30:00' },
      'CA5': { start: '14:00:00', end: '15:30:00' },
      'CA6': { start: '16:00:00', end: '17:30:00' },
      'CA7': { start: '18:00:00', end: '19:30:00' }
    };
    
    for (const trainer of trainers) {
      const trainerDates = dates.filter(() => Math.random() > 0.4);
      
      for (const d of trainerDates) {
        const isOff = Math.random() < 0.05;
        if (isOff) {
          await models.PtOffRequests.create({
            trainer_id: trainer.trainer_id,
            off_date: d,
            status: 'Approved'
          }, { transaction });
          continue;
        }
        
        const activeShifts = shifts.filter(() => Math.random() > 0.5);
        for (const sCode of activeShifts) {
          const times = shiftTimes[sCode];
          
          const sched = await models.TrainerSchedules.create({
            trainer_id: trainer.trainer_id,
            working_date: d,
            start_time: times.start,
            end_time: times.end,
            availability_status: 'Available'
          }, { transaction });
          
          const hasBooking = Math.random() > 0.6;
          if (hasBooking) {
            const member = members[Math.floor(Math.random() * members.length)];
            const bookingStatus = ['Pending', 'Approved', 'Rejected', 'Cancelled'][Math.floor(Math.random() * 4)];
            
            const booking = await models.PtBookings.create({
              member_id: member.member_id,
              trainer_id: trainer.trainer_id,
              session_date: d,
              shift_code: sCode,
              status: bookingStatus,
              note: 'Tập thể lực & Cardio nhẹ',
              reject_reason: bookingStatus === 'Rejected' ? 'HLV bận ca dạy khác' : null
            }, { transaction });
            
            if (bookingStatus === 'Approved') {
              await sched.update({ availability_status: 'Busy' }, { transaction });
              
              await models.Appointments.create({
                member_id: member.member_id,
                schedule_id: sched.schedule_id,
                status: 'Confirmed',
                note: 'Tập cơ đùi và cơ bụng'
              }, { transaction });
            }
          }
        }
      }
    }

    console.log('⏳ Bước 8: Tạo lộ trình tập luyện WorkoutPlans và InBody Progress...');
    
    for (let i = 0; i < 20; i++) {
      const m = members[i];
      const t = trainers[i % trainers.length];
      
      const plan = await models.WorkoutPlans.create({
        member_id: m.member_id,
        trainer_id: t.trainer_id,
        title: `Lộ trình luyện tập với HLV ${t.trainer_id}`,
        description: `Lộ trình được tạo tự động để giúp học viên giảm mỡ toàn thân và tăng cơ bắp cốt lõi.`,
        is_completed: i % 2 === 0
      }, { transaction });
      
      const exercises = ['Squat', 'Lat Pulldown', 'Bench Press', 'Plank', 'Leg Press'];
      for (const exName of exercises) {
        await models.WorkoutExercises.create({
          workout_plan_id: plan.workout_plan_id,
          exercise_name: exName,
          sets: 3,
          reps: 12,
          duration_minutes: 15,
          calories_burned: 120,
          rpe: 7
        }, { transaction });
      }
      
      const baseHeight = m.height || 1.70;
      const baseWeight = m.weight || 70;
      const records = [
        { date: '2025-10-15', w: baseWeight + 4, fat: 26, muscle: 28, note: 'Khởi đầu đo InBody tại quầy.' },
        { date: '2026-01-15', w: baseWeight + 2, fat: 24, muscle: 29, note: 'Kiểm soát tốt chế độ ăn uống.' },
        { date: '2026-04-15', w: baseWeight, fat: 22, muscle: 30, note: 'Cơ bắp phát triển, giảm mỡ đùi.' },
        { date: '2026-07-15', w: baseWeight - 2, fat: 20, muscle: 31, note: 'Thể lực cải thiện đáng kinh ngạc!' }
      ];
      
      for (const rec of records) {
        await models.ProgressTrackings.create({
          member_id: m.member_id,
          height: baseHeight,
          weight: rec.w,
          body_fat: rec.fat,
          muscle_mass: rec.muscle,
          recorded_date: formatDateForDB(new Date(rec.date)),
          note: rec.note
        }, { transaction });
      }
    }

    console.log('⏳ Bước 9: Tạo AI Consultations, Chats, Notifications và Reports...');
    
    const goals = ['Tăng cơ nhanh', 'Giảm cân lành mạnh', 'Tăng sức bền tim mạch', 'Giữ dáng khỏe đẹp'];
    const recommendations = [
      'Gợi ý chế độ ăn giàu protein (2.0g/kg), tập Gym cường độ cao 4 buổi/tuần, bổ sung Creatine.',
      'Gợi ý chế độ thâm hụt calo nhẹ (300 kcal/ngày), tham gia lớp Yoga xen kẽ 3 buổi/tuần.',
      'Gợi ý tập luyện HIIT tim mạch, đạp xe trong phòng tập và bơi lội bổ trợ 3 buổi/tuần.',
      'Gợi ý kết hợp tập tạ nhẹ toàn thân, Cardio cường độ trung bình và tham gia lớp Sauna phục hồi cơ bắp.'
    ];
    for (let i = 0; i < 40; i++) {
      const idx = i % goals.length;
      const m = members[i % members.length];
      const typeMap = ['Muscle Gain', 'Weight Loss', 'General Fitness', 'Relaxation'];
      await models.AIConsultations.create({
        member_id: m.member_id,
        guest_name: null,
        consultation_type: typeMap[idx],
        age: 20 + (i % 25),
        gender: i % 2 === 0 ? 'Female' : 'Male',
        height: m.height,
        weight: m.weight,
        fitness_goal: goals[idx],
        recommended_sport: idx === 1 ? 'Yoga' : 'Gym',
        recommended_membership: idx === 1 ? 'Yoga 6 Tháng' : 'Gym 12 Tháng',
        recommended_schedule: 'Thứ 2, 4, 6 lúc 18:00 - 19:30',
        recommendation_detail: recommendations[idx],
        created_at: formatDateForDB(new Date())
      }, { transaction });
    }
    
    for (let i = 0; i < 15; i++) {
      const mUser = members[i].user_id;
      const tUser = trainers[i % trainers.length].user_id;
      
      await models.ChatMessages.create({
        sender_id: mUser,
        receiver_id: tUser,
        message_content: 'Chào HLV, cho em hỏi thực đơn ngày mai nên ăn những món nào ạ?',
        sent_at: formatDateForDB(new Date(2026, 6, 28, 9, 30)),
        is_seen: true
      }, { transaction });
      
      await models.ChatMessages.create({
        sender_id: tUser,
        receiver_id: mUser,
        message_content: 'Chào em, ngày mai em ăn 200g ức gà rán tỏi kèm khoai tây luộc và rau luộc nhé. Tập trung thâm hụt nhẹ calo.',
        sent_at: formatDateForDB(new Date(2026, 6, 28, 10, 0)),
        is_seen: false
      }, { transaction });
    }
    
    const announcements = [
      { title: 'Thông báo: Bảo trì khu vực bể bơi bốn mùa', content: 'Khu vực bể bơi vô cực sẽ tạm ngưng hoạt động từ 22:00 ngày 01/08 đến 06:00 ngày 03/08 để vệ sinh định kỳ.' },
      { title: 'Chương trình ưu đãi ngày lễ Quốc Khánh 2/9', content: 'Giảm giá cực sốc lên tới 25% cho tất cả các gói tập 12 tháng tại FxFitness từ ngày 25/8 đến hết ngày 5/9!' },
      { title: 'Giải chạy Marathon phong trào FxFitness 2026', content: 'Đăng ký ngay tại quầy lễ tân để tham gia tranh tài cự ly 5km và 10km quanh bờ hồ thành phố vào chủ nhật tới!' }
    ];
    for (const a of announcements) {
      await models.Announcements.create({
        admin_id: admins[0].user_id,
        title: a.title,
        content: a.content,
        created_at: formatDateForDB(new Date())
      }, { transaction });
    }
    
    for (let i = 1; i <= 10; i++) {
      const isResolved = i <= 6;
      await models.Reports.create({
        reported_by: members[i % members.length].user_id,
        reported_user_id: i % 2 === 0 ? trainers[0].user_id : null,
        reported_service_id: i % 2 !== 0 ? 1 : null,
        title: i % 2 === 0 ? 'Phản ánh thái độ phục vụ của HLV' : 'Hệ thống xông hơi Sauna thỉnh thoảng quá nóng',
        reason: i % 2 === 0 ? 'HLV đứng bấm điện thoại trong giờ dạy cá nhân.' : 'Nhiệt độ phòng xông hơi đá muối tăng đột ngột khiến tôi bị bỏng nhẹ.',
        status: isResolved ? 'Resolved' : 'Pending',
        created_at: formatDateForDB(new Date(2026, 6, 20)),
        resolved_at: isResolved ? formatDateForDB(new Date(2026, 6, 22)) : null,
        admin_note: isResolved ? 'Đã nhắc nhở kỹ thuật viên căn chỉnh lại van nhiệt độ tự động.' : null,
        admin_reply: isResolved ? 'Cảm ơn hội viên đã phản hồi. Sự cố hệ thống Sauna đã được sửa chữa triệt để.' : null,
        user_rating: isResolved ? 5 : null
      }, { transaction });
    }
    
    for (let i = 0; i < 30; i++) {
      const uId = members[i % members.length].user_id;
      await models.Notifications.create({
        user_id: uId,
        title: 'Check-in thành công!',
        content: `Hệ thống xác nhận bạn đã vào phòng tập lúc 18:30 ngày ${30 - (i % 10)}/07/2026. Chúc tập vui vẻ!`,
        notification_type: 'MEMBER_CHECKED_IN',
        is_read: i % 2 === 0,
        created_at: formatDateForDB(new Date())
      }, { transaction });
    }

    console.log('⏳ Bước 10: Commit transaction cơ sở dữ liệu...');
    await transaction.commit();
    
    console.log('\n======================================================');
    console.log('✅ CHÚC MỪNG: Quá trình seed dữ liệu thành công rực rỡ!');
    console.log('======================================================');
    console.log(`- Số Users được tạo: ${admins.length + trainers.length + members.length}`);
    console.log(`  + Admin: ${admins.length}`);
    console.log(`  + Trainer: ${trainers.length}`);
    console.log(`  + Member: ${members.length}`);
    console.log(`- Doanh thu seed thành công: ${(totalGeneratedRevenue / 1000000).toFixed(0)} Triệu VNĐ`);
    console.log('\n📊 ĐỐI CHIẾU DOANH THU THEO THÁNG (Triệu VNĐ):');
    
    for (const year of [2025, 2026]) {
      console.log(`\nNăm ${year}:`);
      for (let month = 1; month <= 12; month++) {
        const target = TARGET_REVENUE[year][month] ? TARGET_REVENUE[year][month] / 1000000 : null;
        const actual = monthlySummary[year][month] ? monthlySummary[year][month] / 1000000 : null;
        if (target !== null) {
          const matchStr = target === actual ? '✅ KHỚP CHÍNH XÁC' : '❌ LỆCH';
          console.log(`  - Tháng ${month}: Mục tiêu = ${target}M | Thực tế = ${actual}M (${matchStr})`);
        }
      }
    }
    
    console.log('\n💡 CÁC CASE ĐẶC BIỆT ĐÃ SEED ĐỂ TEST UI:');
    console.log('- 3 tài khoản Member bị khóa QR (qr_is_active = false) để test scan báo lỗi thu hồi.');
    console.log('- 1 tài khoản Member bị cấm (Banned), 1 bị khóa (Inactive) để test filter Admin.');
    console.log('- Seed đầy đủ các ca tập PT trong 2 tuần qua gồm các trạng thái: Pending, Approved, Rejected, Cancelled.');
    console.log('- Lịch sử thanh toán chứa: pending (chờ thanh toán), failed (thanh toán lỗi) và refunded (đã hoàn tiền).');
    console.log('- 2 HLV có ca làm việc check-in chưa check-out vào ngày hôm nay (30/07/2026) để kiểm thử luồng check-out của PT.');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ THẤT BẠI: Quá trình seed gặp lỗi!', error);
    try {
      await transaction.rollback();
      console.log('🔄 Đã rollback transaction thành công.');
    } catch (rollbackError) {
      console.error('⚠️ Không thể rollback transaction (có thể đã tự động rollback):', rollbackError.message);
    }
    process.exit(1);
  }
}

run();
