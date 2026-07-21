const { models } = require('../config/db');
const jwt = require('jsonwebtoken');
const geminiConfig = require('../config/geminiConfig');

// Native fetch helper to request Gemini API
async function generateGeminiAdvice({ guestName, age, gender, height, weight, bmi, fitnessGoal, consultationType }) {
  if (!geminiConfig.isConfigured()) {
    console.log('⚠️ GEMINI_API_KEY is not defined in environment variables. Activating rule-based fallback.');
    return null;
  }

  const promptText = `Bạn là một chuyên gia dinh dưỡng và huấn luyện viên thể hình chuyên nghiệp của trung tâm FX Fitness.
Hãy phân tích số liệu sức khỏe sau của khách hàng và đưa ra tư vấn phù hợp bằng tiếng Việt.
Thông tin khách hàng:
- Tên: ${guestName || 'Hội viên'}
- Tuổi: ${age || 'Không cung cấp'} tuổi
- Giới tính: ${gender || 'Khác'}
- Chiều cao: ${height} cm
- Cân nặng: ${weight} kg
- Chỉ số BMI: ${bmi}
- Mục tiêu tập luyện: ${fitnessGoal || 'Cải thiện sức khỏe'}
- Loại hình tư vấn: ${consultationType || 'BMI'}

Hãy trả về kết quả định dạng JSON duy nhất, KHÔNG chứa các ký tự định dạng Markdown (\`\`\`json) hay bất kỳ văn bản giải thích nào ngoài JSON. Cấu trúc JSON bắt buộc phải khớp chính xác với mẫu sau:
{
  "recommended_sport": "tên môn thể thao phù hợp nhất (ví dụ: Gym, Yoga, Cardio, Bơi lội...)",
  "recommended_membership": "tên gói tập đề xuất (chọn 1 trong 3 gói: 'Gói Tháng', 'Gói 3 Tháng', 'Gói Năm')",
  "recommended_schedule": "lịch trình tập luyện gợi ý trong tuần ngắn gọn (ví dụ: Thứ 2: Cardio, Thứ 4: Yoga, Thứ 6: Chạy bộ...)",
  "recommendation_detail": "lời khuyên cụ thể về dinh dưỡng, chế độ sinh hoạt và lưu ý khi tập luyện phù hợp với chỉ số BMI của họ, viết khoảng 150-200 từ mang tính khích lệ."
}`;

  try {
    let textResult = await geminiConfig.generateContent(promptText);
    if (!textResult) return null;

    // Clean up potential markdown wrapper from model output
    textResult = textResult.trim();
    if (textResult.startsWith('```json')) {
      textResult = textResult.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (textResult.startsWith('```')) {
      textResult = textResult.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const parsedJson = JSON.parse(textResult);
    return parsedJson;
  } catch (error) {
    console.error('❌ Failed to call or parse Gemini API:', error.message);
    return null;
  }
}

// Rule-based fallback advisory engine
function getRuleBasedAdvice({ age, gender, height, weight, bmi, fitnessGoal }) {
  let recommended_sport = 'Gym đa năng';
  let recommended_membership = 'Gói 3 Tháng';
  let recommended_schedule = 'Thứ 2: Full-body Cardio, Thứ 4: Squat & Core, Thứ 6: Đạp xe bơi lội';
  let recommendation_detail = '';

  if (bmi < 18.5) {
    recommended_sport = 'Gym (Tăng cơ kháng lực)';
    recommended_membership = 'Gói 3 Tháng';
    recommended_schedule = 'Thứ 2: Ngực - Tay sau, Thứ 4: Chân - Mông đùi, Thứ 6: Lưng - Bả vai';
    recommendation_detail = `Chỉ số BMI của bạn là ${bmi} (Hơi gầy). Bạn cần ưu tiên các bài tập kháng lực với tạ để kích thích phát triển thớ cơ, tránh các buổi tập cardio dài gây thâm hụt năng lượng lớn. Hãy bổ sung dinh dưỡng thặng dư calo (đặc biệt nạp đủ protein 1.6-2g/kg trọng lượng cơ thể) và nghỉ ngơi điều độ để đạt hiệu quả tăng cân, tăng cơ tối ưu nhé!`;
  } else if (bmi >= 18.5 && bmi < 25) {
    recommended_sport = 'Gym & Bơi lội thể lực';
    recommended_membership = 'Gói Năm';
    recommended_schedule = 'Thứ 2: Tập thể lực toàn thân, Thứ 4: Bơi tự do giải tỏa cơ, Thứ 6: Yoga dẻo dai';
    recommendation_detail = `Chỉ số BMI của bạn là ${bmi} (Bình thường lý tưởng). Hãy tiếp tục rèn luyện đa dạng để duy trì cơ bắp săn chắc và tối ưu hóa chức năng tim mạch. Một chế độ ăn đầy đủ đa lượng dưỡng chất kết hợp lối sống lành mạnh sẽ giữ cơ thể bạn luôn tràn đầy năng lượng tích cực mỗi ngày.`;
  } else if (bmi >= 25 && bmi < 30) {
    recommended_sport = 'HIIT & Cardio cường độ cao';
    recommended_membership = 'Gói 3 Tháng';
    recommended_schedule = 'Thứ 2: HIIT đốt calo, Thứ 4: Tập đùi bụng đai mỡ, Thứ 6: Đạp xe nhanh dốc';
    recommendation_detail = `Chỉ số BMI của bạn là ${bmi} (Thừa cân nhẹ). Bạn nên thiết lập chế độ ăn thâm hụt calo nhẹ từ 300 - 500 kcal mỗi ngày, cắt giảm đường và chất béo xấu. Tập trung vào tập luyện HIIT/Cardio đan xen các buổi kháng lực để đốt mỡ mà vẫn giữ được cơ bắp khỏe khoắn.`;
  } else {
    recommended_sport = 'Đi bộ máy dốc & Yoga nhẹ nhàng';
    recommended_membership = 'Gói Năm';
    recommended_schedule = 'Thứ 2: Đi bộ chậm trên dốc, Thứ 4: Đạp xe tĩnh lực, Thứ 6: Yoga phục hồi khớp';
    recommendation_detail = `Chỉ số BMI của bạn là ${bmi} (Thuộc nhóm béo phì). Hãy bắt đầu một cách chậm rãi để bảo vệ hệ khớp gối và cột sống khỏi chấn thương. Bạn nên tập các bài nhẹ nhàng kết hợp chế độ ăn kiêng kỷ luật, bổ sung nhiều xơ xanh, giảm muối và tránh tinh bột hấp thụ nhanh. Hãy tin tưởng vào hành trình dài hạn này!`;
  }

  return { recommended_sport, recommended_membership, recommended_schedule, recommendation_detail };
}

exports.consult = async (req, res) => {
  try {
    const { guestName, age, gender, height, weight, fitnessGoal, consultationType } = req.body;

    if (!height || Number(height) <= 0) {
      return res.status(400).json({ message: 'Vui lòng cung cấp chiều cao hợp lệ!' });
    }
    if (!weight || Number(weight) <= 0) {
      return res.status(400).json({ message: 'Vui lòng cung cấp cân nặng hợp lệ!' });
    }

    const heightVal = Number(height);
    const weightVal = Number(weight);
    const ageVal = age ? Number(age) : null;

    // Calculate BMI (height is input as cm in UI, convert to meters for standard formula)
    const heightInMeters = heightVal / 100;
    const bmiVal = Math.round((weightVal / (heightInMeters * heightInMeters)) * 100) / 100;

    // Optional decode of Member identity
    let memberId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (token && token !== 'mock-preview-token') {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'BiMatSieuCap_SWP391');
          if (decoded && decoded.userId) {
            const member = await models.Members.findOne({ where: { user_id: decoded.userId } });
            if (member) {
              memberId = member.member_id;
            }
          }
        } catch (err) {
          console.log('Optional token decode failed:', err.message);
        }
      }
    }

    // Try requesting Gemini AI advice
    let advice = await generateGeminiAdvice({
      guestName: memberId ? null : guestName,
      age: ageVal,
      gender,
      height: heightVal,
      weight: weightVal,
      bmi: bmiVal,
      fitnessGoal,
      consultationType
    });

    // Fallback if Gemini fails or is not key-configured
    if (!advice) {
      advice = getRuleBasedAdvice({
        age: ageVal,
        gender,
        height: heightVal,
        weight: weightVal,
        bmi: bmiVal,
        fitnessGoal
      });
    }

    // Save consultation record into Database
    // Note: Do NOT specify bmi column because it is computed by SQL Server database
    const newConsult = await models.AIConsultations.create({
      member_id: memberId,
      guest_name: memberId ? null : (guestName || 'Hội viên'),
      consultation_type: consultationType || 'BMI',
      age: ageVal,
      gender: gender || 'Khác',
      height: heightInMeters, // store in meters to align with database
      weight: weightVal,
      recommended_sport: advice.recommended_sport,
      recommended_membership: advice.recommended_membership,
      recommended_schedule: advice.recommended_schedule,
      recommendation_detail: advice.recommendation_detail
    });

    return res.status(200).json({
      message: 'Tư vấn sức khỏe thành công!',
      consultation: {
        id: newConsult.consultation_id,
        bmi: bmiVal,
        height: heightVal,
        weight: weightVal,
        ...advice
      }
    });

  } catch (error) {
    console.error('❌ Error in AI Consultation:', error);
    return res.status(500).json({
      message: 'Lỗi máy chủ khi lấy tư vấn AI!',
      error: error.message
    });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const member = await models.Members.findOne({ where: { user_id: userId } });
    if (!member) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin hội viên!' });
    }

    const history = await models.AIConsultations.findAll({
      where: { member_id: member.member_id },
      order: [['created_at', 'DESC']]
    });

    const mappedHistory = history.map(item => {
      // In database height is stored as meters, convert back to cm for UI
      const hCm = item.height ? Math.round(item.height * 100) : 170;
      // Calculate BMI on the fly since bmi is database computed and virtual
      const hM = item.height || 1.7;
      const bmiVal = item.weight && hM ? Math.round((item.weight / (hM * hM)) * 100) / 100 : 22.4;

      return {
        id: item.consultation_id,
        consultationType: item.consultation_type,
        age: item.age,
        gender: item.gender,
        height: hCm,
        weight: item.weight,
        bmi: bmiVal,
        recommendedSport: item.recommended_sport,
        recommendedMembership: item.recommended_membership,
        recommendedSchedule: item.recommended_schedule,
        recommendationDetail: item.recommendation_detail,
        createdAt: item.created_at
      };
    });

    return res.status(200).json({ history: mappedHistory });

  } catch (error) {
    console.error('❌ Error getting AI consultation history:', error);
    return res.status(500).json({
      message: 'Lỗi server khi lấy lịch sử tư vấn AI!',
      error: error.message
    });
  }
};

exports.chat = async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Vui lòng cung cấp nội dung tin nhắn!' });
    }

    // 1. Decode optional Authorization JWT token to get current logged-in Member
    let memberId = null;
    let memberInfo = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (token && token !== 'mock-preview-token') {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'BiMatSieuCap_SWP391');
          if (decoded && decoded.userId) {
            const user = await models.Users.findByPk(decoded.userId);
            const member = await models.Members.findOne({ where: { user_id: decoded.userId } });
            if (member) {
              memberId = member.member_id;
              memberInfo = {
                member_id: member.member_id,
                full_name: user?.full_name || 'Hội viên',
                email: user?.email,
                phone: user?.phone_number
              };
            }
          }
        } catch (err) {
          console.log('Optional chat token decode failed:', err.message);
        }
      }
    }

    // 2. Fetch System Database Data
    // a. Membership Plans
    const membershipPlans = await models.MembershipPlans.findAll({
      where: { status: 'Active' }
    });

    // b. Services
    const services = await models.Services.findAll({
      where: { status: 'Available' }
    });

    // c. Member specific memberships, PT packages, and PT available schedules
    let memberMemberships = [];
    let memberTrainerPackages = [];
    let trainerSchedulesData = [];

    const { Op } = require('sequelize');
    const { SHIFT_DEFINITIONS } = require('../constants/shifts');

    if (memberId) {
      memberMemberships = await models.MemberMemberships.findAll({
        where: { member_id: memberId, membership_status: 'Active' },
        include: [{ model: models.MembershipPlans, as: 'membership_plan' }]
      });

      memberTrainerPackages = await models.MemberTrainerPackages.findAll({
        where: { member_id: memberId, is_active: true },
        include: [
          {
            model: models.Trainers,
            as: 'trainer',
            include: [{ model: models.Users, as: 'user', attributes: ['full_name', 'email', 'phone_number'] }]
          }
        ]
      });

      // Calculate upcoming 7 days date strings (YYYY-MM-DD)
      const today = new Date();
      const next7Days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        next7Days.push(`${year}-${month}-${day}`);
      }

      for (const pkg of memberTrainerPackages) {
        if (!pkg.trainer) continue;
        const trainerId = pkg.trainer_id;
        const trainerName = pkg.trainer?.user?.full_name || `HLV ID ${trainerId}`;

        // Fetch off requests for trainer
        const offReqs = await models.PtOffRequests.findAll({
          where: {
            trainer_id: trainerId,
            off_date: { [Op.in]: next7Days },
            status: { [Op.in]: ['Pending', 'Approved'] }
          }
        });

        // Fetch bookings for trainer
        const bookings = await models.PtBookings.findAll({
          where: {
            trainer_id: trainerId,
            session_date: { [Op.in]: next7Days },
            status: { [Op.in]: ['Pending', 'Approved', 'CancelPending'] }
          }
        });

        const dailySchedules = next7Days.map(dateStr => {
          const isOff = offReqs.some(r => r.off_date === dateStr);
          if (isOff) {
            return { date: dateStr, freeShifts: [], note: 'HLV nghỉ làm' };
          }
          const freeShifts = SHIFT_DEFINITIONS.filter(shift => {
            const hasBooking = bookings.some(b => b.session_date === dateStr && b.shift_code === shift.shiftCode);
            return !hasBooking;
          }).map(s => `${s.shiftCode} (${s.start}-${s.end})`);

          return { date: dateStr, freeShifts };
        });

        trainerSchedulesData.push({
          trainerId,
          trainerName,
          specialization: pkg.trainer.specialization || 'Fitness & Thể hình',
          experienceYears: pkg.trainer.experience_years || 1,
          phone: pkg.trainer.user?.phone_number || 'Chưa cập nhật',
          schedules: dailySchedules
        });
      }
    }

    // 3. Build Database Context Text for Grounding Prompt
    const todayStr = new Date().toISOString().split('T')[0];
    let dbContextText = `--- BẮT ĐẦU DỮ LIỆU THỰC TẾ TRONG HỆ THỐNG DATABASE FX FITNESS (NGÀY HÔM NAY: ${todayStr}) ---\n\n`;

    dbContextText += `1. DANH SÁCH GÓI TẬP (MEMBERSHIP PLANS) TRONG DATABASE:\n`;
    if (membershipPlans.length > 0) {
      membershipPlans.forEach(p => {
        const formattedPrice = Number(p.price).toLocaleString('vi-VN') + ' VNĐ';
        dbContextText += `- Gói tập: "${p.plan_name}" | Môn tập: ${p.sport_type} | Thời hạn: ${p.duration_months} tháng | Giá: ${formattedPrice} | Mô tả: ${p.description || 'Không có'}\n`;
      });
    } else {
      dbContextText += `(Hiện chưa có gói tập nào trong database)\n`;
    }

    dbContextText += `\n2. DANH SÁCH GÓI DỊCH VỤ (SERVICES) TRONG DATABASE:\n`;
    if (services.length > 0) {
      services.forEach(s => {
        const formattedPrice = s.price ? Number(s.price).toLocaleString('vi-VN') + ' VNĐ' : 'Liên hệ';
        dbContextText += `- Dịch vụ: "${s.service_name}" | Loại dịch vụ: ${s.service_type || 'Tổng hợp'} | Giá: ${formattedPrice} | Mô tả: ${s.description || 'Không có'}\n`;
      });
    } else {
      dbContextText += `(Hiện chưa có gói dịch vụ nào trong database)\n`;
    }

    dbContextText += `\n3. THÔNG TIN HỘI VIÊN VÀ CÁC GÓI / HLV CÁ NHÂN CỦA HỘI VIÊN ĐANG HỎI:\n`;
    if (memberInfo) {
      dbContextText += `Trạng thái đăng nhập: Đã xác thực người dùng.\n`;
      dbContextText += `Tên hội viên: ${memberInfo.full_name}\n`;

      dbContextText += `Gói tập hội viên đang sở hữu (MemberMemberships):\n`;
      if (memberMemberships.length > 0) {
        memberMemberships.forEach(m => {
          const planName = m.membership_plan?.plan_name || 'Gói tập';
          const startDate = m.start_date;
          const endDate = m.end_date;
          const endDateObj = new Date(endDate);
          const nowObj = new Date();
          const diffTime = endDateObj - nowObj;
          const remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
          dbContextText += `  + Gói: "${planName}" | Từ: ${startDate} đến: ${endDate} | Trạng thái: ${m.membership_status} | Thời hạn còn lại: ${remainingDays} ngày.\n`;
        });
      } else {
        dbContextText += `  + Hội viên hiện chưa đăng ký gói tập membership nào hoặc gói tập đã hết hạn.\n`;
      }

      dbContextText += `Huấn luyện viên cá nhân (PT) đang quản lý hội viên (MemberTrainerPackages):\n`;
      if (memberTrainerPackages.length > 0) {
        memberTrainerPackages.forEach(pkg => {
          const trainerName = pkg.trainer?.user?.full_name || 'HLV';
          const total = pkg.total_sessions;
          const used = pkg.used_sessions;
          const remaining = total - used;
          dbContextText += `  + HLV quản lý: "${trainerName}" | Tổng số buổi: ${total} | Đã tập: ${used} buổi | Số buổi còn lại: ${remaining} buổi.\n`;
        });
      } else {
        dbContextText += `  + Hội viên hiện chưa đăng ký hoặc chưa phân công HLV cá nhân (PT) nào.\n`;
      }

      if (trainerSchedulesData.length > 0) {
        dbContextText += `Giờ rảnh / Ca rảnh của HLV đang quản lý hội viên trong 7 ngày tới:\n`;
        trainerSchedulesData.forEach(t => {
          dbContextText += `  * HLV ${t.trainerName} (Chuyên môn: ${t.specialization}, SĐT: ${t.phone}):\n`;
          t.schedules.forEach(s => {
            if (s.note) {
              dbContextText += `    - Ngày ${s.date}: PT xin nghỉ (${s.note})\n`;
            } else if (s.freeShifts.length > 0) {
              dbContextText += `    - Ngày ${s.date}: Ca rảnh: [${s.freeShifts.join(', ')}]\n`;
            } else {
              dbContextText += `    - Ngày ${s.date}: Đã kín tất cả ca tập\n`;
            }
          });
        });
      }
    } else {
      dbContextText += `Trạng thái đăng nhập: Chưa đăng nhập (Khách hàng vãng lai).\n`;
      dbContextText += `Lưu ý: Nếu khách hàng hỏi về thời hạn gói tập còn lại của tôi, HLV nào đang quản lý tôi, hoặc giờ rảnh của PT quản lý tôi, hãy thông báo rằng người dùng cần ĐĂNG NHẬP vào tài khoản hội viên để hệ thống kiểm tra thông tin cá nhân.\n`;
    }

    dbContextText += `--- KẾT THÚC DỮ LIỆU THỰC TẾ TRONG HỆ THỐNG DATABASE ---\n`;

    // 4. Gemini API Call
    if (geminiConfig.isConfigured()) {
      const promptText = `Bạn là Trợ lý AI chính thức của trung tâm FX Fitness Center.
Nhiệm vụ của bạn là tư vấn và trả lời câu hỏi của khách hàng.

${dbContextText}

QUY TẮC BẮT BUỘC (STRICT GROUNDING RULES):
1. CHỈ được phép đọc và sử dụng dữ liệu thực tế trong khối "DỮ LIỆU THỰC TẾ TRONG HỆ THỐNG DATABASE" ở trên.
2. TUYỆT ĐỐI KHÔNG tự bịa đặt thông tin, không sáng tạo gói tập/giá tiền không có trong database, không dùng kiến thức ngoài hệ thống.
3. Trả lời chi tiết, chính xác các thắc mắc:
   - Các gói tập, gói dịch vụ có trong hệ thống kèm giá tiền và thời hạn.
   - Thời hạn gói tập còn lại của người dùng (nếu người dùng đã đăng nhập).
   - Huấn luyện viên (PT) nào đang quản lý người dùng (nếu đã đăng nhập).
   - Giờ rảnh / ca rảnh của PT đang quản lý người dùng đó trong tuần.
4. Nếu người dùng chưa đăng nhập mà hỏi thông tin cá nhân (thời hạn gói, PT quản lý, ca rảnh PT), hãy lịch sự nhắc họ đăng nhập tài khoản.
5. Nếu câu hỏi không có thông tin trong Database hoặc hỏi về chủ đề không liên quan đến phòng tập (thời tiết, tin tức, v.v.), hãy lịch sự trả lời rằng bạn là Trợ lý FX Fitness và chỉ hỗ trợ thông tin trong hệ thống phòng tập FX Fitness.
6. Trả lời bằng tiếng Việt thân thiện, rõ ràng, trình bày định dạng Markdown đẹp mắt (dùng bold **, danh sách -).

Lịch sử trò chuyện gần đây:
${(history || []).slice(-6).map(h => `${h.sender === 'user' ? 'Khách hàng' : 'Trợ lý'}: ${h.text}`).join('\n')}
Khách hàng: ${message}
Trợ lý:`;

      const aiResponse = await geminiConfig.generateContent(promptText);
      if (aiResponse) {
        return res.status(200).json({ response: aiResponse });
      }
    } else {
      console.log('⚠️ GEMINI_API_KEY is not defined. Using database-driven rule fallback for chatbot.');
    }

    // 5. Smart Fallback Engine based directly on retrieved DB context
    const lowerMsg = message.toLowerCase();
    let reply = "Xin chào! Tôi là Trợ lý AI của FX Fitness. Tôi có thể giúp gì cho bạn về các gói tập, dịch vụ hoặc lịch trình luyện tập hôm nay?";

    if (lowerMsg.includes("thời hạn") || lowerMsg.includes("của tôi") || lowerMsg.includes("còn bao lâu") || lowerMsg.includes("hạn gói")) {
      if (!memberInfo) {
        reply = "Bạn vui lòng **đăng nhập vào tài khoản hội viên** để tôi có thể tra cứu chính xác thời hạn gói tập còn lại của bạn nhé!";
      } else if (memberMemberships.length > 0) {
        reply = `Thông tin thời hạn gói tập của hội viên **${memberInfo.full_name}**:\n`;
        memberMemberships.forEach(m => {
          const planName = m.membership_plan?.plan_name || 'Gói tập';
          const endDateObj = new Date(m.end_date);
          const nowObj = new Date();
          const remainingDays = Math.max(0, Math.ceil((endDateObj - nowObj) / (1000 * 60 * 60 * 24)));
          reply += `- Gói **${planName}**: Ngày kết thúc **${m.end_date}** (Còn lại **${remainingDays} ngày** sử dụng).\n`;
        });
      } else {
        reply = `Tài khoản của hội viên **${memberInfo.full_name}** hiện chưa đăng ký gói tập membership nào hoặc gói tập đã hết hạn.`;
      }
    } else if (lowerMsg.includes("giờ rảnh") || lowerMsg.includes("ca rảnh") || lowerMsg.includes("rảnh") || lowerMsg.includes("lịch pt")) {
      if (!memberInfo) {
        reply = "Bạn vui lòng **đăng nhập** để tra cứu lịch làm việc và giờ rảnh của Huấn luyện viên cá nhân quản lý bạn.";
      } else if (trainerSchedulesData.length > 0) {
        reply = `Lịch ca rảnh trong 7 ngày tới của PT quản lý bạn:\n`;
        trainerSchedulesData.forEach(t => {
          reply += `\n💪 **HLV ${t.trainerName}** (SĐT: ${t.phone}):\n`;
          t.schedules.slice(0, 3).forEach(s => {
            if (s.note) {
              reply += `- Ngày ${s.date}: PT nghỉ làm.\n`;
            } else if (s.freeShifts.length > 0) {
              reply += `- Ngày ${s.date}: Ca rảnh (${s.freeShifts.join(', ')}).\n`;
            } else {
              reply += `- Ngày ${s.date}: Đã kín lịch.\n`;
            }
          });
        });
      } else {
        reply = `Hội viên **${memberInfo.full_name}** chưa đăng ký gói tập với HLV nên chưa thể tra cứu giờ rảnh của PT.`;
      }
    } else if (lowerMsg.includes("huấn luyện viên") || lowerMsg.includes("pt") || lowerMsg.includes("quản lý") || lowerMsg.includes("hlv")) {
      if (!memberInfo) {
        reply = "Bạn vui lòng **đăng nhập vào tài khoản hội viên** để kiểm tra Huấn luyện viên (PT) đang trực tiếp quản lý bạn nhé!";
      } else if (memberTrainerPackages.length > 0) {
        reply = `Hội viên **${memberInfo.full_name}** hiện đang được đồng hành bởi:\n`;
        memberTrainerPackages.forEach(pkg => {
          const trainerName = pkg.trainer?.user?.full_name || 'HLV';
          const remaining = pkg.total_sessions - pkg.used_sessions;
          reply += `- **HLV ${trainerName}**: Tổng **${pkg.total_sessions} buổi**, đã hoàn thành **${pkg.used_sessions} buổi**, còn lại **${remaining} buổi** tập.\n`;
        });
      } else {
        reply = `Hội viên **${memberInfo.full_name}** hiện chưa đăng ký hoặc chưa được phân công HLV cá nhân nào.`;
      }
    } else if (lowerMsg.includes("gói tập") || lowerMsg.includes("goi tap") || lowerMsg.includes("giá") || lowerMsg.includes("chi phí") || lowerMsg.includes("bao nhiêu tiền")) {
      if (membershipPlans.length > 0) {
        reply = "Hiện tại hệ thống FX Fitness đang cung cấp các gói tập sau:\n";
        membershipPlans.forEach((p, idx) => {
          const priceStr = Number(p.price).toLocaleString('vi-VN') + ' VNĐ';
          reply += `${idx + 1}. **${p.plan_name}** (${p.sport_type}): **${priceStr}** cho **${p.duration_months} tháng**. ${p.description || ''}\n`;
        });
        if (services.length > 0) {
          reply += "\nCác gói dịch vụ đi kèm:\n";
          services.forEach(s => {
            const sPrice = s.price ? Number(s.price).toLocaleString('vi-VN') + ' VNĐ' : 'Liên hệ';
            reply += `- **${s.service_name}**: ${sPrice} (${s.description || ''})\n`;
          });
        }
      } else {
        reply = "Hiện tại hệ thống chưa cập nhật danh sách gói tập công khai.";
      }
    } else if (lowerMsg.includes("dịch vụ") || lowerMsg.includes("dich vu")) {
      if (services.length > 0) {
        reply = "FX Fitness hiện đang cung cấp các dịch vụ luyện tập:\n";
        services.forEach(s => {
          const sPrice = s.price ? Number(s.price).toLocaleString('vi-VN') + ' VNĐ' : 'Liên hệ';
          reply += `- **${s.service_name}** (${s.service_type || 'Dịch vụ'}): Giá **${sPrice}**. ${s.description || ''}\n`;
        });
      } else {
        reply = "Danh sách dịch vụ hiện đang được cập nhật trong hệ thống.";
      }
    } else if (lowerMsg.includes("xin chào") || lowerMsg.includes("hello") || lowerMsg.includes("hi")) {
      reply = `Xin chào${memberInfo ? ' ' + memberInfo.full_name : ''}! Tôi là Trợ lý AI của FX Fitness Center. Tôi có thể giúp gì cho bạn hôm nay?`;
    }

    return res.status(200).json({ response: reply });

  } catch (error) {
    console.error('❌ Error in AI Chatbot Controller:', error);
    return res.status(500).json({
      message: 'Lỗi máy chủ khi xử lý tin nhắn Chatbot!',
      error: error.message
    });
  }
};
