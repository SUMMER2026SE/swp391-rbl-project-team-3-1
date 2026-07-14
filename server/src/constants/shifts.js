/**
 * SHIFT_DEFINITIONS — 7 ca tập cố định mỗi ngày.
 * Phòng gym mở 5:00, đóng 20:00. Mỗi ca 1h30, giữa 2 ca nghỉ 30 phút (trừ nghỉ trưa 1h30).
 * 
 * Dùng chung cho Backend và Frontend.
 * Khi cần đổi giờ mở/đóng cửa hoặc thời lượng ca, chỉ sửa file này.
 */
const SHIFT_DEFINITIONS = [
  { shiftCode: 'CA1', start: '05:00', end: '06:30', label: 'Ca 1 (05:00 - 06:30)' },
  { shiftCode: 'CA2', start: '07:00', end: '08:30', label: 'Ca 2 (07:00 - 08:30)' },
  { shiftCode: 'CA3', start: '09:00', end: '10:30', label: 'Ca 3 (09:00 - 10:30)' },
  { shiftCode: 'CA4', start: '11:00', end: '12:30', label: 'Ca 4 (11:00 - 12:30)' },
  // Nghỉ trưa 12:30 – 14:00
  { shiftCode: 'CA5', start: '14:00', end: '15:30', label: 'Ca 5 (14:00 - 15:30)' },
  { shiftCode: 'CA6', start: '16:00', end: '17:30', label: 'Ca 6 (16:00 - 17:30)' },
  { shiftCode: 'CA7', start: '18:00', end: '19:30', label: 'Ca 7 (18:00 - 19:30)' },
];

module.exports = { SHIFT_DEFINITIONS };
