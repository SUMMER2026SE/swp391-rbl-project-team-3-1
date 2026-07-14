const { models, sequelize } = require('../config/db');
const { validateBooking } = require('../services/bookingValidator');
const { SHIFT_DEFINITIONS } = require('../constants/shifts');
const { broadcastSSE } = require('./dashboardController');
const { Op } = require('sequelize');

// Helper to convert date to YYYY-MM-DD
const formatDate = (d) => {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 1. Get Member Trainer Packages
exports.getMemberTrainerPackages = async (req, res) => {
  try {
    const member = await models.Members.findOne({ where: { user_id: req.user.userId } });
    if (!member) {
      return res.status(404).json({ message: 'Hồ sơ hội viên không tồn tại.' });
    }

    let packages = await models.MemberTrainerPackages.findAll({
      where: { member_id: member.member_id, is_active: true },
      include: [
        {
          model: models.Trainers,
          as: 'trainer',
          include: [{ model: models.Users, as: 'user', attributes: ['full_name', 'avatar_url'] }]
        }
      ]
    });

    // Auto-seed package records if empty (backward compatibility & testability)
    if (packages.length === 0) {
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

      // Fallback to first active trainer if no previous interaction
      if (trainerIds.size === 0) {
        const firstTrainer = await models.Trainers.findOne();
        if (firstTrainer) {
          trainerIds.add(firstTrainer.trainer_id);
        }
      }

      for (const tId of trainerIds) {
        await models.MemberTrainerPackages.create({
          member_id: member.member_id,
          trainer_id: tId,
          total_sessions: 12,
          used_sessions: 0,
          is_active: true
        });
      }

      // Re-fetch packages after auto-seeding
      packages = await models.MemberTrainerPackages.findAll({
        where: { member_id: member.member_id, is_active: true },
        include: [
          {
            model: models.Trainers,
            as: 'trainer',
            include: [{ model: models.Users, as: 'user', attributes: ['full_name', 'avatar_url'] }]
          }
        ]
      });
    }

    const mapped = packages.map(pkg => ({
      packageId: pkg.package_id,
      trainerId: pkg.trainer_id,
      trainerName: pkg.trainer?.user?.full_name || 'HLV',
      avatarUrl: pkg.trainer?.user?.avatar_url,
      totalSessions: pkg.total_sessions,
      usedSessions: pkg.used_sessions,
      remainingSessions: pkg.total_sessions - pkg.used_sessions,
    }));

    return res.status(200).json({ packages: mapped });
  } catch (error) {
    console.error('Error fetching member packages:', error);
    return res.status(500).json({ message: 'Lỗi server khi tải gói tập HLV.' });
  }
};

// 2. Get Trainer Schedule (Combined Off & Booking)
exports.getTrainerSchedule = async (req, res) => {
  try {
    const { trainerId } = req.params;
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ message: 'Vui lòng cung cấp ngày bắt đầu (from) và kết thúc (to).' });
    }

    let tId = trainerId;
    let isOwner = false;
    let isAdmin = req.user.role === 'Admin' || req.user.roleId === 3;

    if (trainerId === 'me' || req.user.role === 'Trainer' || req.user.roleId === 2) {
      const currentTrainer = await models.Trainers.findOne({ where: { user_id: req.user.userId } });
      if (currentTrainer) {
        tId = currentTrainer.trainer_id;
        isOwner = true;
      } else if (trainerId === 'me') {
        return res.status(403).json({ message: 'Không tìm thấy hồ sơ HLV của bạn.' });
      }
    }

    // Fetch Off requests
    const offRequests = await models.PtOffRequests.findAll({
      where: {
        trainer_id: tId,
        off_date: { [Op.between]: [from, to] },
        status: { [Op.in]: ['Pending', 'Approved'] }
      }
    });

    // Fetch Bookings
    const bookings = await models.PtBookings.findAll({
      where: {
        trainer_id: tId,
        session_date: { [Op.between]: [from, to] },
        status: { [Op.in]: ['Pending', 'Approved'] }
      },
      include: [
        {
          model: models.Members,
          as: 'member',
          include: [{ model: models.Users, as: 'user', attributes: ['full_name'] }]
        }
      ]
    });

    // Generate list of dates in range
    const start = new Date(from);
    const end = new Date(to);
    const daysList = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      daysList.push(formatDate(d));
    }

    const schedule = daysList.map(dateStr => {
      // Tìm xem có Off request cho ngày này không
      const offReq = offRequests.find(r => r.off_date === dateStr);
      const isOff = !!offReq;
      const offStatus = offReq ? offReq.status : null;

      const shifts = SHIFT_DEFINITIONS.map(shift => {
        // Mặc định
        let status = 'Free';
        let bookingId = null;
        let memberName = null;

        if (isOff) {
          status = 'Off';
        } else {
          // Tìm xem có booking nào cho ca này không
          const booking = bookings.find(b => b.session_date === dateStr && b.shift_code === shift.shiftCode);
          if (booking) {
            status = booking.status; // 'Pending' | 'Approved'
            bookingId = booking.booking_id;
            // Chỉ hiển thị tên Member nếu người gọi là Admin hoặc chính Trainer đó
            if (isAdmin || isOwner) {
              memberName = booking.member?.user?.full_name || 'Hội viên';
            }
          }
        }

        return {
          shiftCode: shift.shiftCode,
          start: shift.start,
          end: shift.end,
          status,
          bookingId,
          memberName
        };
      });

      return {
        date: dateStr,
        isOff,
        offStatus,
        shifts
      };
    });

    return res.status(200).json({ trainerId: tId, schedule });
  } catch (error) {
    console.error('Error getting trainer schedule:', error);
    return res.status(500).json({ message: 'Lỗi server khi tải thời khóa biểu HLV.' });
  }
};

// 3. Create Booking (Member)
exports.createBooking = async (req, res) => {
  try {
    const { trainerId, sessionDate, shiftCode, note } = req.body;
    
    if (!trainerId || !sessionDate || !shiftCode) {
      return res.status(400).json({ message: 'Thiếu thông tin đặt lịch tập.' });
    }

    const member = await models.Members.findOne({ where: { user_id: req.user.userId } });
    if (!member) {
      return res.status(404).json({ message: 'Hồ sơ hội viên không tồn tại.' });
    }

    // Lấy package
    const trainerPackage = await models.MemberTrainerPackages.findOne({
      where: { member_id: member.member_id, trainer_id: trainerId, is_active: true }
    });

    // Lấy off requests & bookings của PT để validate
    const offRequests = await models.PtOffRequests.findAll({
      where: { trainer_id: trainerId, off_date: sessionDate }
    });

    const existingBookings = await models.PtBookings.findAll({
      where: { trainer_id: trainerId, session_date: sessionDate }
    });

    // Validate
    const validation = validateBooking({
      trainerId,
      memberId: member.member_id,
      sessionDate,
      shiftCode,
      existingBookings,
      offRequests,
      trainerPackage
    });

    if (!validation.valid) {
      return res.status(400).json({ message: validation.reason });
    }

    // Tạo booking
    const booking = await models.PtBookings.create({
      member_id: member.member_id,
      trainer_id: trainerId,
      session_date: sessionDate,
      shift_code: shiftCode,
      note: note || 'Đặt lịch tập cá nhân',
      status: 'Pending'
    });

    // Notify PT
    const trainer = await models.Trainers.findByPk(trainerId, {
      include: [{ model: models.Users, as: 'user' }]
    });

    if (trainer && trainer.user) {
      const memberUser = await models.Users.findByPk(req.user.userId);
      const memberName = memberUser?.full_name || 'Hội viên';
      
      const newNotif = await models.Notifications.create({
        user_id: trainer.user_id,
        title: 'Yêu cầu đặt lịch mới',
        content: `Học viên ${memberName} đã đặt lịch tập ca ${shiftCode} ngày ${sessionDate}`,
        notification_type: 'BOOKING_CREATED'
      });

      // Send via targeted SSE
      broadcastSSE({
        type: 'BOOKING_CREATED',
        userId: trainer.user_id,
        message: `Học viên ${memberName} đã đặt lịch tập ca ${shiftCode} ngày ${sessionDate}`,
        notification: newNotif
      });
    }

    // Broadcast update slot to anyone viewing the trainer's schedule
    broadcastSSE({
      type: 'SCHEDULE_SLOT_UPDATED',
      trainerId,
      sessionDate,
      shiftCode,
      status: 'Pending'
    });

    return res.status(201).json({ message: 'Đặt lịch tập thành công! Vui lòng chờ HLV duyệt.', booking });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Ca tập này vừa có người đặt, vui lòng chọn ca khác.' });
    }
    console.error('Error creating booking:', error);
    return res.status(500).json({ message: 'Lỗi server khi đặt lịch tập.' });
  }
};

// 4. Cancel Booking (Member)
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await models.Members.findOne({ where: { user_id: req.user.userId } });
    if (!member) {
      return res.status(404).json({ message: 'Hồ sơ hội viên không tồn tại.' });
    }

    const booking = await models.PtBookings.findOne({
      where: { booking_id: id, member_id: member.member_id }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu đặt lịch.' });
    }
    if (booking.status !== 'Pending') {
      return res.status(400).json({ message: 'Chỉ có thể hủy yêu cầu đặt lịch đang chờ duyệt.' });
    }

    booking.status = 'Cancelled';
    await booking.save();

    // Notify Trainer
    const trainer = await models.Trainers.findByPk(booking.trainer_id);
    if (trainer) {
      broadcastSSE({
        type: 'BOOKING_CANCELLED',
        userId: trainer.user_id,
        bookingId: id,
        message: `Yêu cầu đặt lịch ngày ${booking.session_date} đã bị học viên hủy.`
      });
    }

    // Broadcast update slot to anyone viewing schedule
    broadcastSSE({
      type: 'SCHEDULE_SLOT_UPDATED',
      trainerId: booking.trainer_id,
      sessionDate: booking.session_date,
      shiftCode: booking.shift_code,
      status: 'Free'
    });

    return res.status(200).json({ message: 'Đã hủy yêu cầu đặt lịch tập thành công.' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return res.status(500).json({ message: 'Lỗi server khi hủy lịch.' });
  }
};

// 5. Get Member Booking History
exports.getMemberBookingHistory = async (req, res) => {
  try {
    const member = await models.Members.findOne({ where: { user_id: req.user.userId } });
    if (!member) {
      return res.status(404).json({ message: 'Hồ sơ hội viên không tồn tại.' });
    }

    const bookings = await models.PtBookings.findAll({
      where: { member_id: member.member_id },
      include: [
        {
          model: models.Trainers,
          as: 'trainer',
          include: [{ model: models.Users, as: 'user', attributes: ['full_name'] }]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const mapped = bookings.map(b => ({
      bookingId: b.booking_id,
      trainerId: b.trainer_id,
      trainerName: b.trainer?.user?.full_name || 'HLV',
      sessionDate: b.session_date,
      shiftCode: b.shift_code,
      status: b.status,
      rejectReason: b.reject_reason,
      note: b.note,
      createdAt: b.created_at
    }));

    return res.status(200).json({ bookings: mapped });
  } catch (error) {
    console.error('Error getting member bookings:', error);
    return res.status(500).json({ message: 'Lỗi server.' });
  }
};

// 6. Get PT Pending Bookings
exports.getPtPendingBookings = async (req, res) => {
  try {
    const trainer = await models.Trainers.findOne({ where: { user_id: req.user.userId } });
    if (!trainer) {
      return res.status(403).json({ message: 'Chỉ HLV mới xem được yêu cầu đặt lịch.' });
    }

    const bookings = await models.PtBookings.findAll({
      where: { trainer_id: trainer.trainer_id, status: 'Pending' },
      include: [
        {
          model: models.Members,
          as: 'member',
          include: [{ model: models.Users, as: 'user', attributes: ['full_name'] }]
        }
      ],
      order: [['created_at', 'ASC']]
    });

    const mapped = bookings.map(b => ({
      bookingId: b.booking_id,
      memberId: b.member_id,
      memberName: b.member?.user?.full_name || 'Hội viên',
      sessionDate: b.session_date,
      shiftCode: b.shift_code,
      note: b.note,
      createdAt: b.created_at
    }));

    return res.status(200).json({ bookings: mapped });
  } catch (error) {
    console.error('Error fetching pending bookings:', error);
    return res.status(500).json({ message: 'Lỗi server.' });
  }
};

// 7. Approve Booking (Trainer)
exports.approveBooking = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const trainer = await models.Trainers.findOne({ where: { user_id: req.user.userId } });
    if (!trainer) {
      await t.rollback();
      return res.status(403).json({ message: 'Chỉ HLV mới thực hiện được.' });
    }

    const booking = await models.PtBookings.findOne({
      where: { booking_id: id, trainer_id: trainer.trainer_id },
      include: [{ model: models.Members, as: 'member' }],
      transaction: t
    });

    if (!booking) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu đặt lịch tập.' });
    }
    if (booking.status !== 'Pending') {
      await t.rollback();
      return res.status(400).json({ message: 'Chỉ có thể duyệt yêu cầu đặt lịch đang chờ duyệt.' });
    }

    // Lấy package để cập nhật và trừ buổi
    const trainerPackage = await models.MemberTrainerPackages.findOne({
      where: { member_id: booking.member_id, trainer_id: trainer.trainer_id, is_active: true },
      transaction: t
    });

    if (!trainerPackage) {
      await t.rollback();
      return res.status(400).json({ message: 'Hội viên không có gói tập đang hoạt động.' });
    }

    const remaining = trainerPackage.total_sessions - trainerPackage.used_sessions;
    if (remaining <= 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Hội viên đã dùng hết buổi tập.' });
    }

    // Thực hiện trừ buổi tập
    trainerPackage.used_sessions += 1;
    await trainerPackage.save({ transaction: t });

    // Cập nhật trạng thái booking
    booking.status = 'Approved';
    await booking.save({ transaction: t });

    await t.commit();

    // Notify Member
    if (booking.member) {
      const newNotif = await models.Notifications.create({
        user_id: booking.member.user_id,
        title: 'Yêu cầu đặt lịch được duyệt',
        content: `HLV đã duyệt yêu cầu đặt lịch ca ${booking.shift_code} ngày ${booking.session_date} của bạn.`,
        notification_type: 'BOOKING_APPROVED'
      });

      broadcastSSE({
        type: 'BOOKING_APPROVED',
        userId: booking.member.user_id,
        message: `Yêu cầu đặt lịch ca ${booking.shift_code} ngày ${booking.session_date} đã được xác nhận.`,
        notification: newNotif
      });
    }

    // Broadcast update slot to anyone viewing schedule
    broadcastSSE({
      type: 'SCHEDULE_SLOT_UPDATED',
      trainerId: booking.trainer_id,
      sessionDate: booking.session_date,
      shiftCode: booking.shift_code,
      status: 'Approved'
    });

    return res.status(200).json({ message: 'Đã duyệt yêu cầu đặt lịch thành công!' });
  } catch (error) {
    await t.rollback();
    console.error('Error approving booking:', error);
    return res.status(500).json({ message: 'Lỗi server khi duyệt yêu cầu đặt lịch.' });
  }
};

// 8. Reject Booking (Trainer)
exports.rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const trainer = await models.Trainers.findOne({ where: { user_id: req.user.userId } });
    if (!trainer) {
      return res.status(403).json({ message: 'Chỉ HLV mới thực hiện được.' });
    }

    const booking = await models.PtBookings.findOne({
      where: { booking_id: id, trainer_id: trainer.trainer_id },
      include: [{ model: models.Members, as: 'member' }]
    });

    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu đặt lịch tập.' });
    }
    if (booking.status !== 'Pending') {
      return res.status(400).json({ message: 'Chỉ có thể từ chối yêu cầu đặt lịch đang chờ duyệt.' });
    }

    booking.status = 'Rejected';
    booking.reject_reason = reason || 'HLV bận ca này';
    await booking.save();

    // Notify Member
    if (booking.member) {
      const newNotif = await models.Notifications.create({
        user_id: booking.member.user_id,
        title: 'Yêu cầu đặt lịch bị từ chối',
        content: `Yêu cầu đặt lịch ca ${booking.shift_code} ngày ${booking.session_date} bị từ chối. Lý do: ${booking.reject_reason}`,
        notification_type: 'BOOKING_REJECTED'
      });

      broadcastSSE({
        type: 'BOOKING_REJECTED',
        userId: booking.member.user_id,
        message: `Yêu cầu đặt lịch ca ${booking.shift_code} ngày ${booking.session_date} bị từ chối.`,
        notification: newNotif
      });
    }

    // Broadcast update slot to anyone viewing schedule
    broadcastSSE({
      type: 'SCHEDULE_SLOT_UPDATED',
      trainerId: booking.trainer_id,
      sessionDate: booking.session_date,
      shiftCode: booking.shift_code,
      status: 'Free'
    });

    return res.status(200).json({ message: 'Đã từ chối yêu cầu đặt lịch.' });
  } catch (error) {
    console.error('Error rejecting booking:', error);
    return res.status(500).json({ message: 'Lỗi server khi từ chối yêu cầu đặt lịch.' });
  }
};
