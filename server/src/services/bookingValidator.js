const { SHIFT_DEFINITIONS } = require('../constants/shifts');

/**
 * Validate Member booking request with a PT
 * @param {Object} params
 * @param {number} params.trainerId
 * @param {number} params.memberId
 * @param {string} params.sessionDate - 'YYYY-MM-DD'
 * @param {string} params.shiftCode - 'CA1'..'CA7'
 * @param {Array<Object>} params.existingBookings - existing active bookings [{ trainer_id, session_date, shift_code, status }]
 * @param {Array<Object>} params.offRequests - PT off requests [{ trainer_id, off_date, status }]
 * @param {Object} params.trainerPackage - { total_sessions, used_sessions, is_active }
 * @param {Date} [params.today] - current date for mocking
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateBooking({
  trainerId,
  memberId,
  sessionDate,
  shiftCode,
  existingBookings = [],
  offRequests = [],
  trainerPackage,
  today = new Date()
}) {
  // 1. Kiểm tra gói tập
  if (!trainerPackage) {
    return { valid: false, reason: 'Hội viên không có gói tập đăng ký với HLV này.' };
  }
  if (!trainerPackage.is_active) {
    return { valid: false, reason: 'Gói tập với HLV đã hết hạn hoặc bị khóa.' };
  }
  const remaining = trainerPackage.total_sessions - trainerPackage.used_sessions;
  if (remaining <= 0) {
    return { valid: false, reason: 'Hội viên đã dùng hết số buổi tập trong gói.' };
  }

  // 2. Kiểm tra ca tập hợp lệ
  const shift = SHIFT_DEFINITIONS.find(s => s.shiftCode === shiftCode);
  if (!shift) {
    return { valid: false, reason: 'Ca tập không hợp lệ.' };
  }

  // 3. Kiểm tra ngày/giờ trong quá khứ
  const dateObj = new Date(sessionDate);
  if (isNaN(dateObj.getTime())) {
    return { valid: false, reason: 'Ngày tập không hợp lệ.' };
  }

  const [startH, startM] = shift.start.split(':').map(Number);
  const targetDateTime = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), startH, startM, 0, 0);
  
  if (targetDateTime < today) {
    return { valid: false, reason: 'Không thể đặt lịch tập cho thời gian trong quá khứ.' };
  }

  // 4. Kiểm tra PT nghỉ phép (Pending hoặc Approved)
  const isPtOff = offRequests.some(req => {
    if (Number(req.trainer_id) !== Number(trainerId)) return false;
    if (req.status !== 'Pending' && req.status !== 'Approved') return false;
    
    // So sánh ngày
    const reqD = new Date(req.off_date);
    const sesD = new Date(sessionDate);
    return reqD.getFullYear() === sesD.getFullYear() &&
           reqD.getMonth() === sesD.getMonth() &&
           reqD.getDate() === sesD.getDate();
  });

  if (isPtOff) {
    return { valid: false, reason: 'HLV đã đăng ký nghỉ hoặc đang chờ duyệt nghỉ vào ngày này.' };
  }

  // 5. Kiểm tra trùng lịch dạy (đã có member khác đặt ca này)
  const isSlotOccupied = existingBookings.some(b => {
    if (Number(b.trainer_id) !== Number(trainerId)) return false;
    if (b.status !== 'Pending' && b.status !== 'Approved' && b.status !== 'CancelPending') return false;
    if (b.shift_code !== shiftCode) return false;

    const bD = new Date(b.session_date);
    const sesD = new Date(sessionDate);
    return bD.getFullYear() === sesD.getFullYear() &&
           bD.getMonth() === sesD.getMonth() &&
           bD.getDate() === sesD.getDate();
  });

  if (isSlotOccupied) {
    return { valid: false, reason: 'Ca tập này đã có hội viên khác đặt hoặc đang chờ duyệt.' };
  }

  return { valid: true };
}

module.exports = { validateBooking };
