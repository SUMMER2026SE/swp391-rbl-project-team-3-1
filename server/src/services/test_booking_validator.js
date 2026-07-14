const { validateBooking } = require('./bookingValidator');

// Mock setup
const mockToday = new Date('2026-07-13T10:00:00'); // T2, 10:00 AM

const activePackage = {
  total_sessions: 12,
  used_sessions: 5,
  is_active: true
};

const exhaustedPackage = {
  total_sessions: 12,
  used_sessions: 12,
  is_active: true
};

const inactivePackage = {
  total_sessions: 12,
  used_sessions: 5,
  is_active: false
};

const tests = [
  {
    name: 'Case 1: Đặt ca hợp lệ (tương lai)',
    params: {
      trainerId: 1,
      memberId: 2,
      sessionDate: '2026-07-13',
      shiftCode: 'CA4', // 11:00 - 12:30 (tương lai so với 10:00 AM)
      existingBookings: [],
      offRequests: [],
      trainerPackage: activePackage,
      today: mockToday
    },
    expected: { valid: true }
  },
  {
    name: 'Case 2: Không có gói tập',
    params: {
      trainerId: 1,
      memberId: 2,
      sessionDate: '2026-07-13',
      shiftCode: 'CA4',
      existingBookings: [],
      offRequests: [],
      trainerPackage: null,
      today: mockToday
    },
    expected: { valid: false, reason: 'Hội viên không có gói tập đăng ký với HLV này.' }
  },
  {
    name: 'Case 3: Gói tập không kích hoạt',
    params: {
      trainerId: 1,
      memberId: 2,
      sessionDate: '2026-07-13',
      shiftCode: 'CA4',
      existingBookings: [],
      offRequests: [],
      trainerPackage: inactivePackage,
      today: mockToday
    },
    expected: { valid: false, reason: 'Gói tập với HLV đã hết hạn hoặc bị khóa.' }
  },
  {
    name: 'Case 4: Dùng hết số buổi tập',
    params: {
      trainerId: 1,
      memberId: 2,
      sessionDate: '2026-07-13',
      shiftCode: 'CA4',
      existingBookings: [],
      offRequests: [],
      trainerPackage: exhaustedPackage,
      today: mockToday
    },
    expected: { valid: false, reason: 'Hội viên đã dùng hết số buổi tập trong gói.' }
  },
  {
    name: 'Case 5: Đặt ca đã qua trong quá khứ (ngày trước đó)',
    params: {
      trainerId: 1,
      memberId: 2,
      sessionDate: '2026-07-12',
      shiftCode: 'CA4',
      existingBookings: [],
      offRequests: [],
      trainerPackage: activePackage,
      today: mockToday
    },
    expected: { valid: false, reason: 'Không thể đặt lịch tập cho thời gian trong quá khứ.' }
  },
  {
    name: 'Case 6: Đặt ca đã qua trong hôm nay',
    params: {
      trainerId: 1,
      memberId: 2,
      sessionDate: '2026-07-13',
      shiftCode: 'CA2', // 07:00 - 08:30 (quá khứ so với 10:00 AM)
      existingBookings: [],
      offRequests: [],
      trainerPackage: activePackage,
      today: mockToday
    },
    expected: { valid: false, reason: 'Không thể đặt lịch tập cho thời gian trong quá khứ.' }
  },
  {
    name: 'Case 7: PT nghỉ phép chờ duyệt (Pending_Off)',
    params: {
      trainerId: 1,
      memberId: 2,
      sessionDate: '2026-07-14',
      shiftCode: 'CA4',
      existingBookings: [],
      offRequests: [
        { trainer_id: 1, off_date: '2026-07-14', status: 'Pending' }
      ],
      trainerPackage: activePackage,
      today: mockToday
    },
    expected: { valid: false, reason: 'HLV đã đăng ký nghỉ hoặc đang chờ duyệt nghỉ vào ngày này.' }
  },
  {
    name: 'Case 8: PT nghỉ phép đã duyệt (Off)',
    params: {
      trainerId: 1,
      memberId: 2,
      sessionDate: '2026-07-14',
      shiftCode: 'CA4',
      existingBookings: [],
      offRequests: [
        { trainer_id: 1, off_date: '2026-07-14', status: 'Approved' }
      ],
      trainerPackage: activePackage,
      today: mockToday
    },
    expected: { valid: false, reason: 'HLV đã đăng ký nghỉ hoặc đang chờ duyệt nghỉ vào ngày này.' }
  },
  {
    name: 'Case 9: Trùng lịch với hội viên khác (đã được Approved)',
    params: {
      trainerId: 1,
      memberId: 2,
      sessionDate: '2026-07-14',
      shiftCode: 'CA4',
      existingBookings: [
        { trainer_id: 1, session_date: '2026-07-14', shift_code: 'CA4', status: 'Approved' }
      ],
      offRequests: [],
      trainerPackage: activePackage,
      today: mockToday
    },
    expected: { valid: false, reason: 'Ca tập này đã có hội viên khác đặt hoặc đang chờ duyệt.' }
  },
  {
    name: 'Case 10: Trùng lịch với hội viên khác (chờ duyệt - Pending)',
    params: {
      trainerId: 1,
      memberId: 2,
      sessionDate: '2026-07-14',
      shiftCode: 'CA4',
      existingBookings: [
        { trainer_id: 1, session_date: '2026-07-14', shift_code: 'CA4', status: 'Pending' }
      ],
      offRequests: [],
      trainerPackage: activePackage,
      today: mockToday
    },
    expected: { valid: false, reason: 'Ca tập này đã có hội viên khác đặt hoặc đang chờ duyệt.' }
  }
];

function runTests() {
  console.log('🧪 Running Booking Validator Unit Tests...');
  let failed = 0;

  tests.forEach(t => {
    const res = validateBooking(t.params);
    if (res.valid === t.expected.valid && (res.valid || res.reason === t.expected.reason)) {
      console.log(`✅ [PASS] ${t.name}`);
    } else {
      console.error(`❌ [FAIL] ${t.name}`);
      console.error(`   Expected: valid=${t.expected.valid}, reason="${t.expected.reason}"`);
      console.error(`   Got:      valid=${res.valid}, reason="${res.reason}"`);
      failed++;
    }
  });

  if (failed === 0) {
    console.log('🎉 All Booking Validator unit tests passed!');
    process.exit(0);
  } else {
    console.error(`💥 ${failed} tests failed!`);
    process.exit(1);
  }
}

runTests();
