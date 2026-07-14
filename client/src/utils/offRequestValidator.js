// offRequestValidator.js

/**
 * Lấy Thứ 2 của tuần chứa ngày d
 */
function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Kiểm tra xem ngày d có thuộc tuần cuối cùng của tháng (tháng của chính ngày d) không.
 * Tuần cuối cùng của tháng là tuần chứa ngày cuối cùng của tháng đó.
 */
function isLastWeekOfMonth(d) {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  const mondayOfThisWeek = getMonday(d);
  const mondayOfLastWeek = getMonday(lastDayOfMonth);
  
  return mondayOfThisWeek.getTime() === mondayOfLastWeek.getTime();
}

/**
 * Tính số ngày cách nhau giữa 2 ngày (bỏ qua giờ phút giây)
 */
function diffDays(date1, date2) {
  const d1 = new Date(date1); d1.setHours(0, 0, 0, 0);
  const d2 = new Date(date2); d2.setHours(0, 0, 0, 0);
  return Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
}

/**
 * Validate yêu cầu xin nghỉ
 * @param {Array<string>} requestedDates - mảng các ngày yêu cầu ['YYYY-MM-DD']
 * @param {Array<Object>} existingRequests - mảng các yêu cầu đã có [{ off_date: 'YYYY-MM-DD', status: 'Pending'|'Approved' }]
 * @param {Date} today - ngày hiện tại (mặc định là hôm nay, dùng để mock trong test)
 * @returns { valid: boolean, reason?: string }
 */
function validateOffRequest(requestedDates, existingRequests, today = new Date(), approvedBookings = []) {
  if (!requestedDates || requestedDates.length === 0) {
    return { valid: false, reason: 'Danh sách ngày yêu cầu trống.' };
  }

  // Kiểm tra tất cả các ngày phải thuộc cùng 1 tháng
  const firstReqDate = new Date(requestedDates[0]);
  const reqTargetMonth = firstReqDate.getMonth();
  const reqTargetYear = firstReqDate.getFullYear();

  for (const dStr of requestedDates) {
    const d = new Date(dStr);
    if (d.getMonth() !== reqTargetMonth || d.getFullYear() !== reqTargetYear) {
      return { valid: false, reason: 'Tất cả các ngày đăng ký trong cùng một lượt phải thuộc cùng một tháng.' };
    }
  }

  // Chuyển today về timezone local ở múi 0:00 để so sánh chính xác
  today = new Date(today);
  today.setHours(0, 0, 0, 0);

  const currentMonday = getMonday(today);
  const nextMonday = new Date(currentMonday);
  nextMonday.setDate(nextMonday.getDate() + 7);
  const nextNextMonday = new Date(nextMonday);
  nextNextMonday.setDate(nextNextMonday.getDate() + 7);

  // Lọc chỉ lấy các request đang hợp lệ (Pending, Approved)
  const validExisting = existingRequests.filter(r => r.status === 'Pending' || r.status === 'Approved');
  
  // Clone array để mô phỏng tích lũy khi user request nhiều ngày cùng lúc
  let simulatedExisting = [...validExisting];

  for (const reqDateStr of requestedDates) {
    const reqDate = new Date(reqDateStr);
    reqDate.setHours(0, 0, 0, 0);
    const reqYear = reqDate.getFullYear();
    const reqMonth = reqDate.getMonth();

    // 0. Chặn nếu ngày này đã có Approved Booking của member với PT
    const hasApprovedBooking = approvedBookings.some(b => {
      const bD = new Date(b.session_date);
      return bD.getFullYear() === reqYear &&
             bD.getMonth() === reqMonth &&
             bD.getDate() === reqDate.getDate();
    });

    if (hasApprovedBooking) {
      return { valid: false, reason: `Ngày ${reqDateStr} đã có lịch dạy đã xác nhận (Approved) với học viên.` };
    }

    // 1. Phải đăng ký trước tối thiểu 2 ngày
    const daysAhead = diffDays(reqDate, today);
    if (daysAhead < 2) {
      return { valid: false, reason: `Ngày ${reqDateStr} phải cách hôm nay tối thiểu 2 ngày.` };
    }

    // 2. Không được đăng ký cho ngày đã qua
    if (reqDate < today) {
      return { valid: false, reason: `Ngày ${reqDateStr} là ngày trong quá khứ.` };
    }

    // 3. Chỉ được đăng ký cho tuần hiện tại và tuần kế tiếp
    if (reqDate < currentMonday || reqDate >= nextNextMonday) {
      return { valid: false, reason: `Ngày ${reqDateStr} chỉ được thuộc tuần hiện tại hoặc tuần kế tiếp.` };
    }

    // 4. Trùng lặp ngày đã xin
    const isDuplicate = simulatedExisting.some(r => {
      const d = new Date(r.off_date);
      d.setHours(0,0,0,0);
      return d.getTime() === reqDate.getTime();
    });
    if (isDuplicate) {
      return { valid: false, reason: `Ngày ${reqDateStr} đã tồn tại trong lịch xin nghỉ.` };
    }

    // --- Tính toán logic cộng dồn quota theo tháng chứa ngày reqDate ---
    
    // Lấy tất cả ngày nghỉ (đã có + mô phỏng) trong cùng tháng của reqDate
    const offsInMonth = simulatedExisting.filter(r => {
      const d = new Date(r.off_date);
      return d.getFullYear() === reqYear && d.getMonth() === reqMonth;
    });

    const usedInMonth = offsInMonth.length;
    if (usedInMonth >= 4) {
      return { valid: false, reason: `Đã hết giới hạn 4 ngày off trong tháng ${reqMonth + 1}/${reqYear}.` };
    }
    const remainingMonth = 4 - usedInMonth;

    // Lấy tất cả ngày nghỉ trong tuần chứa reqDate
    const reqMonday = getMonday(reqDate);
    const usedThisWeek = offsInMonth.filter(r => {
      return getMonday(r.off_date).getTime() === reqMonday.getTime();
    }).length;

    // Lấy tất cả ngày nghỉ trong tuần liền trước (nhưng chỉ tính cùng tháng)
    const prevWeekMonday = new Date(reqMonday);
    prevWeekMonday.setDate(prevWeekMonday.getDate() - 7);
    const usedPrevWeek = offsInMonth.filter(r => {
      return getMonday(r.off_date).getTime() === prevWeekMonday.getTime();
    }).length;

    let base = 1;

    // Kế thừa tuần trước nếu tuần trước nằm trong CÙNG tháng và chưa off
    if (usedPrevWeek === 0) {
      base = 2;
    }

    // Rule B: Tuần cuối tháng và cả tháng (trước tuần này) chưa off ngày nào
    const isLastWeek = isLastWeekOfMonth(reqDate);
    const usedInMonthBeforeThisWeek = usedInMonth - usedThisWeek;
    if (isLastWeek && usedInMonthBeforeThisWeek === 0) {
      base = 4;
    }

    const maxForThisWeek = Math.min(base - usedThisWeek, remainingMonth);

    if (maxForThisWeek <= 0) {
      return { valid: false, reason: `Đăng ký ngày ${reqDateStr} vượt quá giới hạn ngày off của tuần này.` };
    }

    // Đẩy vào mô phỏng để tính cho ngày tiếp theo trong mảng requestedDates
    simulatedExisting.push({ off_date: reqDateStr, status: 'Pending' });
  }

  return { valid: true };
}

export {
  validateOffRequest,
  getMonday,
  isLastWeekOfMonth,
  diffDays
};
