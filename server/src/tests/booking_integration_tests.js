const assert = require('assert');
const { models, sequelize } = require('../config/db');
const dashboardController = require('../controllers/dashboardController');
const bookingController = require('../controllers/bookingController');

// Mock response creator
const makeMockRes = () => {
  const res = {
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (data) {
      this.body = data;
      return this;
    },
    statusCode: 200,
    body: null
  };
  return res;
};

async function testSuite() {
  console.log('🧪 Starting PT Session Booking Integration Test Suite...\n');

  let testUserMember = null;
  let testMember = null;
  let testUserTrainer = null;
  let testTrainer = null;
  let testPackage = null;
  let createdBookingIds = [];

  try {
    // ==========================================================
    // SETUP: Clean up any old test records & create fresh ones
    // ==========================================================
    console.log('🧹 Cleaning up any old test records...');
    
    const oldUsers = await models.Users.findAll({
      where: { email: ['test_member@gym.com', 'test_pt@gym.com', 'test_member_con@gym.com'] }
    });

    // 1. First destroy all child/dependent records of test members, trainers and users
    for (const u of oldUsers) {
      await models.Notifications.destroy({ where: { user_id: u.user_id } });
      
      const member = await models.Members.findOne({ where: { user_id: u.user_id } });
      if (member) {
        await models.PtBookings.destroy({ where: { member_id: member.member_id } });
        await models.MemberTrainerPackages.destroy({ where: { member_id: member.member_id } });
        await models.WorkoutPlans.destroy({ where: { member_id: member.member_id } });
      }
      
      const trainer = await models.Trainers.findOne({ where: { user_id: u.user_id } });
      if (trainer) {
        await models.PtBookings.destroy({ where: { trainer_id: trainer.trainer_id } });
        await models.MemberTrainerPackages.destroy({ where: { trainer_id: trainer.trainer_id } });
        await models.PtOffRequests.destroy({ where: { trainer_id: trainer.trainer_id } });
        await models.WorkoutPlans.destroy({ where: { trainer_id: trainer.trainer_id } });
      }
    }

    // 2. Now destroy parent records (Members, Trainers, Users) safely
    for (const u of oldUsers) {
      const member = await models.Members.findOne({ where: { user_id: u.user_id } });
      if (member) await member.destroy();
      const trainer = await models.Trainers.findOne({ where: { user_id: u.user_id } });
      if (trainer) await trainer.destroy();
      await u.destroy();
    }

    console.log('🌱 Seeding fresh test accounts...');
    // Create HLV User
    testUserTrainer = await models.Users.create({
      full_name: 'TEST PT Bùi Nguyễn Minh Tuệ',
      email: 'test_pt@gym.com',
      password_hash: 'mock',
      role_id: 2, // PT
      status: 'Active'
    });
    testTrainer = await models.Trainers.create({
      user_id: testUserTrainer.user_id,
      specialization: 'Fitness & Bodybuilding',
      bio: 'Test PT bio',
      rating: 5.0
    });

    // Create Member User
    testUserMember = await models.Users.create({
      full_name: 'TEST Member Trương Kiều Ngọc Diễm',
      email: 'test_member@gym.com',
      password_hash: 'mock',
      role_id: 1, // Member
      status: 'Active'
    });
    testMember = await models.Members.create({
      user_id: testUserMember.user_id,
      gender: 'Female',
      date_of_birth: '1995-05-15',
      fitness_level: 'Intermediate'
    });

    // Create Active Gói Tập (10 buổi)
    testPackage = await models.MemberTrainerPackages.create({
      member_id: testMember.member_id,
      trainer_id: testTrainer.trainer_id,
      total_sessions: 10,
      used_sessions: 0,
      is_active: true
    });

    console.log(`- Created Test Trainer ID: ${testTrainer.trainer_id}`);
    console.log(`- Created Test Member ID: ${testMember.member_id}`);
    console.log(`- Created Test Package ID: ${testPackage.package_id}\n`);

    // ==========================================================
    // CASE 1: Đặt lịch thành công ca Free (Nhóm BOOK / VIEW)
    // ==========================================================
    console.log('▶ Case 1: Đặt lịch ca Free hợp lệ...');
    const req1 = {
      user: { userId: testUserMember.user_id, role: 'Member', roleId: 1 },
      body: {
        date: '2026-07-20', // T2 tuần kế tiếp
        time: '18:00 - 19:30',
        trainerId: testTrainer.trainer_id,
        note: 'TEST_SESSION'
      }
    };
    const res1 = makeMockRes();
    await dashboardController.createMemberAppointment(req1, res1);

    if (res1.statusCode !== 201) {
      console.error('Case 1 Failed! Response:', res1.body);
    }
    assert.strictEqual(res1.statusCode, 201, 'Should return 201 Created');
    assert.ok(res1.body.appointment, 'Should return created appointment object');
    const appointment1 = res1.body.appointment;
    createdBookingIds.push(appointment1.id);

    // Verify in DB
    const dbBooking1 = await models.PtBookings.findByPk(appointment1.id);
    assert.strictEqual(dbBooking1.status, 'Pending', 'Status should be Pending');
    assert.strictEqual(dbBooking1.shift_code, 'CA7', 'Should map 18:00 to CA7');
    console.log('✅ Case 1 Passed.\n');

    // ==========================================================
    // CASE 2: Chặn đặt ca trùng lặp (Nhóm BOOK)
    // ==========================================================
    console.log('▶ Case 2: Chặn đặt lịch trùng ca...');
    const req2 = {
      user: { userId: testUserMember.user_id, role: 'Member', roleId: 1 },
      body: {
        date: '2026-07-20',
        time: '18:00 - 19:30',
        trainerId: testTrainer.trainer_id,
        note: 'TEST_SESSION'
      }
    };
    const res2 = makeMockRes();
    await dashboardController.createMemberAppointment(req2, res2);

    assert.strictEqual(res2.statusCode, 400, 'Should block duplicate slot with 400');
    console.log('✅ Case 2 Passed.\n');

    // ==========================================================
    // CASE 3: Chặn đặt lịch vào ngày HLV nghỉ phép (Nhóm BOOK)
    // ==========================================================
    console.log('▶ Case 3: Chặn đặt lịch khi HLV đăng ký nghỉ phép...');
    // Seed an Approved day off for HLV
    await models.PtOffRequests.create({
      trainer_id: testTrainer.trainer_id,
      off_date: '2026-07-21',
      status: 'Approved',
      reason: 'TEST_OFF'
    });

    const req3 = {
      user: { userId: testUserMember.user_id, role: 'Member', roleId: 1 },
      body: {
        date: '2026-07-21',
        time: '09:00 - 10:30',
        trainerId: testTrainer.trainer_id,
        note: 'TEST_SESSION'
      }
    };
    const res3 = makeMockRes();
    await dashboardController.createMemberAppointment(req3, res3);

    assert.strictEqual(res3.statusCode, 400, 'Should block booking on PT Off day');
    console.log('✅ Case 3 Passed.\n');

    // ==========================================================
    // CASE 4: Kiểm tra phân quyền xem lịch biểu (Nhóm VIEW)
    // ==========================================================
    console.log('▶ Case 4: Kiểm tra xem danh sách lịch hẹn hội viên...');
    const req4 = {
      user: { userId: testUserMember.user_id, role: 'Member', roleId: 1 }
    };
    const res4 = makeMockRes();
    await dashboardController.getMemberAppointments(req4, res4);

    assert.strictEqual(res4.statusCode, 200);
    assert.ok(Array.isArray(res4.body.appointments), 'Should return appointments list');
    const matched = res4.body.appointments.find(a => a.id === appointment1.id);
    assert.ok(matched, 'Should find the booking we just created');
    assert.strictEqual(matched.status, 'pending', 'Status should map to lowercase pending');
    console.log('✅ Case 4 Passed.\n');

    // ==========================================================
    // CASE 5: HLV Duyệt booking, trừ buổi tập (Nhóm APPROVE/REJECT)
    // ==========================================================
    console.log('▶ Case 5: HLV duyệt lịch hẹn, kiểm tra số buổi...');
    const req5 = {
      user: { userId: testUserTrainer.user_id, role: 'Trainer', roleId: 2 },
      params: { id: appointment1.id }
    };
    const res5 = makeMockRes();
    await bookingController.approveBooking(req5, res5);

    assert.strictEqual(res5.statusCode, 200, 'Approve should succeed');
    
    // Verify booking status & sessions decrement
    const updatedBooking1 = await models.PtBookings.findByPk(appointment1.id);
    assert.strictEqual(updatedBooking1.status, 'Approved', 'Status should be Approved');

    const updatedPackage = await models.MemberTrainerPackages.findByPk(testPackage.package_id);
    assert.strictEqual(updatedPackage.used_sessions, 1, 'used_sessions should increment to 1');
    console.log('✅ Case 5 Passed.\n');

    // ==========================================================
    // CASE 6: Chặn tự hủy lịch đã duyệt (Nhóm CANCEL)
    // ==========================================================
    console.log('▶ Case 6: Chặn tự hủy trực tiếp đối với ca tập đã được duyệt...');
    const req6 = {
      user: { userId: testUserMember.user_id, role: 'Member', roleId: 1 },
      params: { id: appointment1.id }
    };
    const res6 = makeMockRes();
    await bookingController.cancelBooking(req6, res6); // This endpoint is only for Pending bookings

    assert.strictEqual(res6.statusCode, 400, 'Should block cancellation with 400');
    console.log('✅ Case 6 Passed.\n');

    // ==========================================================
    // CASE 7: Yêu cầu hủy lịch đã duyệt -> Duyệt hủy & Hoàn trả buổi (Nhóm CANCEL / APPROVE)
    // ==========================================================
    console.log('▶ Case 7: Gửi yêu cầu hủy ca tập đã duyệt và HLV xác nhận hủy...');
    // Member requests cancel
    const req7a = {
      user: { userId: testUserMember.user_id, role: 'Member', roleId: 1 },
      params: { id: appointment1.id },
      body: { reason: 'Bận việc gia đình' }
    };
    const res7a = makeMockRes();
    await dashboardController.requestMemberAppointmentCancel(req7a, res7a);

    assert.strictEqual(res7a.statusCode, 200, 'Request cancel should succeed');
    
    const dbBookingCancel = await models.PtBookings.findByPk(appointment1.id);
    assert.strictEqual(dbBookingCancel.status, 'CancelPending', 'Should change status to CancelPending');
    assert.strictEqual(dbBookingCancel.cancel_requested_by, 'MEMBER');

    // Trainer responds and accepts cancel
    const req7b = {
      user: { userId: testUserTrainer.user_id, role: 'Trainer', roleId: 2 },
      params: { id: appointment1.id },
      body: { action: 'accept' }
    };
    const res7b = makeMockRes();
    await dashboardController.respondTrainerAppointmentCancel(req7b, res7b);

    assert.strictEqual(res7b.statusCode, 200, 'Accept cancel should succeed');

    const dbBookingFinal = await models.PtBookings.findByPk(appointment1.id);
    assert.strictEqual(dbBookingFinal.status, 'Cancelled', 'Should change status to Cancelled');

    // Session should be refunded
    const finalPackage = await models.MemberTrainerPackages.findByPk(testPackage.package_id);
    assert.strictEqual(finalPackage.used_sessions, 0, 'used_sessions should decrease back to 0');
    console.log('✅ Case 7 Passed.\n');

    // ==========================================================
    // CASE 8: Concurrency check (Nhóm CONCURRENCY)
    // ==========================================================
    console.log('▶ Case 8: Kiểm tra tranh chấp đặt lịch đồng thời...');
    // Create another member to simulate concurrency
    const testUserMember2 = await models.Users.create({
      full_name: 'TEST Member Concurrency',
      email: 'test_member_con@gym.com',
      password_hash: 'mock',
      role_id: 1,
      status: 'Active'
    });
    const testMember2 = await models.Members.create({
      user_id: testUserMember2.user_id,
      gender: 'Male',
      date_of_birth: '1990-01-01'
    });
    await models.MemberTrainerPackages.create({
      member_id: testMember2.member_id,
      trainer_id: testTrainer.trainer_id,
      total_sessions: 10,
      used_sessions: 0,
      is_active: true
    });

    const bodyConc = {
      date: '2026-07-22',
      time: '14:00 - 15:30',
      trainerId: testTrainer.trainer_id,
      note: 'TEST_SESSION'
    };

    const call1 = dashboardController.createMemberAppointment({
      user: { userId: testUserMember.user_id, role: 'Member', roleId: 1 },
      body: bodyConc
    }, makeMockRes());

    const call2 = dashboardController.createMemberAppointment({
      user: { userId: testUserMember2.user_id, role: 'Member', roleId: 1 },
      body: bodyConc
    }, makeMockRes());

    const [resConc1, resConc2] = await Promise.all([call1, call2]);
    
    // One must succeed and one must fail
    const statuses = [resConc1.statusCode, resConc2.statusCode];
    assert.ok(statuses.includes(201), 'At least one request must succeed (201)');
    assert.ok(statuses.includes(400), 'At least one request must fail (400)');
    
    console.log(`- Concurrency responses: Request A: ${resConc1.statusCode}, Request B: ${resConc2.statusCode}`);

    // Verify only one booking exists in DB for this slot
    const count = await models.PtBookings.count({
      where: {
        trainer_id: testTrainer.trainer_id,
        session_date: '2026-07-22',
        shift_code: 'CA5' // 14:00 maps to CA5
      }
    });
    assert.strictEqual(count, 1, 'Only exactly 1 booking record should be inserted for this slot');

    // Clean up concurrency elements
    await models.MemberTrainerPackages.destroy({ where: { member_id: testMember2.member_id } });
    await models.Members.destroy({ where: { member_id: testMember2.member_id } });
    await testUserMember2.destroy();
    console.log('✅ Case 8 Passed.\n');

  } catch (err) {
    console.error('❌ Integration Test Suite Failed:', err);
    process.exit(1);
  } finally {
    // ==========================================================
    // TEARDOWN: Clean up all seeded test data
    // ==========================================================
    console.log('🧹 Teardown: cleaning up test data...');
    try {
      const oldUsers = await models.Users.findAll({
        where: { email: ['test_member@gym.com', 'test_pt@gym.com', 'test_member_con@gym.com'] }
      });
      for (const u of oldUsers) {
        await models.Notifications.destroy({ where: { user_id: u.user_id } });
        
        const member = await models.Members.findOne({ where: { user_id: u.user_id } });
        if (member) {
          await models.PtBookings.destroy({ where: { member_id: member.member_id } });
          await models.MemberTrainerPackages.destroy({ where: { member_id: member.member_id } });
          await models.WorkoutPlans.destroy({ where: { member_id: member.member_id } });
        }
        const trainer = await models.Trainers.findOne({ where: { user_id: u.user_id } });
        if (trainer) {
          await models.PtBookings.destroy({ where: { trainer_id: trainer.trainer_id } });
          await models.MemberTrainerPackages.destroy({ where: { trainer_id: trainer.trainer_id } });
          await models.PtOffRequests.destroy({ where: { trainer_id: trainer.trainer_id } });
          await models.WorkoutPlans.destroy({ where: { trainer_id: trainer.trainer_id } });
        }
      }
      
      for (const u of oldUsers) {
        const member = await models.Members.findOne({ where: { user_id: u.user_id } });
        if (member) await member.destroy();
        const trainer = await models.Trainers.findOne({ where: { user_id: u.user_id } });
        if (trainer) await trainer.destroy();
        await u.destroy();
      }
      console.log('✨ Teardown complete. DB returned to pristine state.');
    } catch (cleanErr) {
      console.error('⚠️ Teardown error:', cleanErr.message);
    }
    console.log('\n🎉 PT Session Booking Integration Test Suite Completed Successfully!');
    process.exit(0);
  }
}

testSuite();
