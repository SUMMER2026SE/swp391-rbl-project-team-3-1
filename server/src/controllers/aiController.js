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
        fitnessGoal: item.fitness_goal,
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

// POST /api/ai/meal-plan
// Generate scientific AI meal plan based on metrics and PT exercises/goals
exports.generateMealPlan = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { height, weight, age, gender, mode, sport, goal } = req.body;

    const member = await models.Members.findOne({
      where: { user_id: userId },
      include: [{ model: models.Users, as: 'user' }]
    });

    if (!member) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin hội viên!' });
    }

    // Determine metrics (fallback to member profile if not sent by UI)
    const heightVal = height ? Number(height) : (member.height ? Math.round(member.height * 100) : 170);
    const weightVal = weight ? Number(weight) : (member.weight || 65);
    
    let ageVal = 25;
    if (age) {
      ageVal = Number(age);
    } else if (member.user && member.user.date_of_birth) {
      const birthDate = new Date(member.user.date_of_birth);
      const today = new Date();
      ageVal = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        ageVal--;
      }
    }

    const genderVal = gender || (member.user ? member.user.gender : 'Nam') || 'Nam';
    const heightInMeters = heightVal / 100;
    const bmiVal = Math.round((weightVal / (heightInMeters * heightInMeters)) * 100) / 100;

    // Fetch member's PT workout plans & exercises
    const activeWorkoutPlans = await models.WorkoutPlans.findAll({
      where: { member_id: member.member_id },
      include: [{ model: models.WorkoutExercises, as: 'WorkoutExercises' }],
      order: [['created_at', 'DESC']],
      limit: 2
    });

    let workoutDescriptionText = "";
    if (activeWorkoutPlans && activeWorkoutPlans.length > 0) {
      workoutDescriptionText = activeWorkoutPlans.map(plan => {
        const exercisesText = plan.WorkoutExercises ? plan.WorkoutExercises.map(ex => {
          return `- ${ex.exercise_name}: ${ex.sets} hiệp x ${ex.reps} lần${ex.duration_minutes ? `, ${ex.duration_minutes} phút` : ''}${ex.calories_burned ? `, Đốt ${ex.calories_burned} kcal` : ''}`;
        }).join('\n') : "Chưa có bài tập chi tiết";
        return `Giáo án: ${plan.title}\nMô tả: ${plan.description || "Không có"}\nBài tập:\n${exercisesText}`;
      }).join('\n\n');
    } else {
      workoutDescriptionText = "Hội viên hiện chưa có giáo án tập luyện cụ thể nào từ PT.";
    }

    // Call Gemini API if configured
    let advice = null;
    if (geminiConfig.isConfigured()) {
      const promptText = `Bạn là một chuyên gia dinh dưỡng và bác sĩ thể thao chuyên nghiệp của trung tâm FX Fitness.
Nhiệm vụ của bạn là lập một thực đơn ăn uống khoa học và thực tế phù hợp với chỉ số cơ thể, chế độ tập luyện hiện tại của hội viên.

Thông tin thể chất hội viên:
- Tuổi: ${ageVal} tuổi
- Giới tính: ${genderVal}
- Chiều cao: ${heightVal} cm
- Cân nặng: ${weightVal} kg
- Chỉ số BMI: ${bmiVal}

Chế độ tập luyện hiện tại từ PT (giáo án tập):
${workoutDescriptionText}

Chế độ tư vấn thực đơn do hội viên yêu cầu:
- Phương thức chọn: Theo ${mode === 'pt_workout' ? 'giáo án được giao từ PT và đã hoàn thành 100% hôm nay' : mode === 'workout' ? `bài tập môn ${sport}` : `nhu cầu mục tiêu ${goal}`}

Yêu cầu thực đơn:
1. Thực đơn phải hoàn toàn thực tế với các nguyên liệu dễ kiếm, phổ biến tại Việt Nam.
2. Phải phù hợp logic:
   - Nếu là Boxing: Cần chế độ ăn dồi dào năng lượng (Carb hấp thu nhanh trước tập và Protein phục hồi), hỗ trợ sự bùng nổ cơ bắp và bù nước/khoáng.
   - Nếu là Yoga: Cần chế độ ăn thanh lọc, giàu chất xơ, vitamin, các thực phẩm lành mạnh (Plant-based, chất béo tốt như hạt, bơ) giúp cơ thể dẻo dai nhẹ nhàng.
   - Nếu là Gym: Cần giàu Protein để phát triển cơ bắp, chia nhỏ các bữa ăn khoa học.
   - Nếu là Tăng cơ: Thặng dư Calo nhẹ, protein cao (1.8g - 2.2g/kg), carb phức hợp.
   - Nếu là Giảm mỡ: Thâm hụt Calo (300-500 kcal dưới mức TDEE duy trì), giàu xơ, protein trung bình cao để giữ cơ, cắt giảm tinh bột nhanh và đường.
   - Nếu là Dẻo dai: Thực phẩm chống viêm, bổ sung chất béo omega-3, nước, vitamin.
   - Nếu là Sức bền: Tăng lượng glycogen lưu trữ bằng carb phức hợp, bổ sung điện giải.
3. THỰC ĐƠN PHẢI ĐA DẠNG, PHONG PHÚ VÀ NGẪU NHIÊN: Hãy liên tục đổi mới, ngẫu nhiên chọn các món ăn lành mạnh khác nhau (ví dụ: mực nhồi thịt nạc hấp, cá thu sốt cà chua nhạt, chả lá lốt bò áp chảo, salad bơ tôm sú, súp bí đỏ hạt sen, cháo yến mạch tôm, cá rô phi hấp gừng, canh chua cá lóc...) để người dùng không cảm thấy nhàm chán. Không lặp lại các món ăn rập khuôn cố định (như ức gà, khoai lang) trong mỗi lần gợi ý. Gợi ý phải linh hoạt dựa theo đặc thù bài tập của ngày hôm nay.

Hãy trả về kết quả dưới định dạng JSON duy nhất, KHÔNG chứa các ký tự định dạng Markdown (\`\`\`json) hay bất kỳ văn bản giải thích nào ngoài JSON. Cấu trúc JSON bắt buộc phải khớp chính xác với mẫu sau:
{
  "target_calories": 2100,
  "macro_protein_pct": 30,
  "macro_carbs_pct": 45,
  "macro_fat_pct": 25,
  "meals": {
    "breakfast": "mô tả chi tiết món ăn và lượng (ví dụ: 2 quả trứng ốp la, 1 lát bánh mì đen, 1 quả chuối tiêu)",
    "lunch": "mô tả chi tiết món ăn và lượng (ví dụ: 150g ức gà áp chảo, 1 củ khoai lang luộc, bông cải xanh luộc)",
    "dinner": "mô tả chi tiết món ăn và lượng (ví dụ: 120g cá hồi áp chảo hoặc cá thu, 1 bát nhỏ cơm gạo lứt, salad xà lách dầu giấm)",
    "snack_drinks": "mô tả chi tiết thức ăn nhẹ hoặc thức uống phù hợp (ví dụ: 1 ly whey protein hoặc 1 hộp sữa chua không đường kết hợp hạt điều)"
  },
  "scientific_advice": "lời khuyên khoa học cụ thể, giải thích vì sao thực đơn này phù hợp với chỉ số BMI ${bmiVal} và bài tập/nhu cầu của họ. Viết khoảng 120-150 từ ngắn gọn, thuyết phục, tạo động lực."
}
`;

      try {
        let textResult = await geminiConfig.generateContent(promptText);
        if (textResult) {
          textResult = textResult.trim();
          if (textResult.startsWith('```json')) {
            textResult = textResult.replace(/^```json/, '').replace(/```$/, '').trim();
          } else if (textResult.startsWith('```')) {
            textResult = textResult.replace(/^```/, '').replace(/```$/, '').trim();
          }
          advice = JSON.parse(textResult);
        }
      } catch (err) {
        console.error('❌ Failed to call or parse Gemini API for Meal Plan:', err.message);
      }
    }

    // Fallback if Gemini is not configured or fails
    if (!advice) {
      console.log('⚠️ Using rule-based fallback for Meal Plan generation.');
      advice = getRuleBasedMealPlan({
        age: ageVal,
        gender: genderVal,
        height: heightVal,
        weight: weightVal,
        bmi: bmiVal,
        mode,
        sport,
        goal
      });
    }

    // Save meal plan to AIConsultations table
    const newConsult = await models.AIConsultations.create({
      member_id: member.member_id,
      consultation_type: 'Meal Plan',
      age: ageVal,
      gender: genderVal,
      height: heightInMeters,
      weight: weightVal,
      fitness_goal: mode === 'pt_workout'
        ? (activeWorkoutPlans && activeWorkoutPlans[0]
            ? `Giáo án: ${activeWorkoutPlans[0].title} (${new Date(activeWorkoutPlans[0].created_at).toLocaleDateString('vi-VN')})`
            : 'Theo giáo án PT')
        : `Nhu cầu: ${goal}`,
      recommended_sport: sport || '',
      recommended_membership: mode === 'pt_workout' ? 'PT Workout Mode' : 'Goal Mode',
      recommended_schedule: JSON.stringify(advice.meals), // Store meals JSON string
      recommendation_detail: advice.scientific_advice // Store scientific advice
    });

    return res.status(200).json({
      message: 'Tạo thực đơn dinh dưỡng AI thành công!',
      mealPlan: {
        id: newConsult.consultation_id,
        bmi: bmiVal,
        height: heightVal,
        weight: weightVal,
        age: ageVal,
        gender: genderVal,
        fitnessGoal: newConsult.fitness_goal,
        target_calories: advice.target_calories,
        macro_protein_pct: advice.macro_protein_pct,
        macro_carbs_pct: advice.macro_carbs_pct,
        macro_fat_pct: advice.macro_fat_pct,
        meals: advice.meals,
        scientific_advice: advice.scientific_advice,
        createdAt: newConsult.created_at
      }
    });

  } catch (error) {
    console.error('❌ Error in generateMealPlan:', error);
    return res.status(500).json({
      message: 'Lỗi server khi tạo thực đơn AI!',
      error: error.message
    });
  }
};

// Helper rule-based fallback meal plan generator
function getRuleBasedMealPlan({ age, gender, height, weight, bmi, mode, sport, goal }) {
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  if (gender === 'Nam') {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  let tdee = Math.round(bmr * 1.375);
  let target_calories = tdee;
  
  let macro_protein_pct = 25;
  let macro_carbs_pct = 50;
  let macro_fat_pct = 25;

  let breakfast = "";
  let lunch = "";
  let dinner = "";
  let snack_drinks = "";
  let scientific_advice = "";

  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  let selectedOption = mode === 'pt_workout' ? 'pt_workout' : mode === 'workout' ? (sport || 'gym').toLowerCase() : (goal || 'tăng cơ').toLowerCase();

  if (selectedOption.includes('pt_workout')) {
    target_calories = Math.round(tdee + 250);
    macro_protein_pct = 30;
    macro_carbs_pct = 45;
    macro_fat_pct = 25;

    breakfast = pickRandom([
      "2 quả trứng luộc, 2 lát bánh mì đen nguyên cám, 1 quả chuối chín.",
      "1 bát cháo yến mạch tôm băm hành lá, 1 quả táo xanh giòn ngọt.",
      "1 cốc sinh tố whey protein chuối bơ thơm bùi, 1 nắm hạt hạnh nhân sấy mộc."
    ]);
    lunch = pickRandom([
      "180g ức gà áp chảo sốt tiêu đen, 1.5 bát cơm gạo lứt, bông cải xanh hấp.",
      "150g cá hồi áp chảo sốt chanh leo, 1 bát cơm lứt nhỏ, măng tây xào tỏi ít dầu.",
      "180g thịt bò áp chảo xốt tiêu, 1 củ khoai lang luộc ngọt bùi, salad rau mầm sốt dầu giấm."
    ]);
    dinner = pickRandom([
      "150g tôm sú hấp sả thơm, 1 bát cơm gạo lứt nhỏ, canh cải bẹ xanh nấu thịt băm thanh ngọt.",
      "150g phi lê cá chẽm áp chảo xốt bơ chanh, salad rau bina trộn dầu ô liu và quả bơ chín.",
      "150g thịt heo thăn nạc luộc thái mỏng, 1 bát canh bí đao nấu sườn heo nhạt, súp lơ luộc."
    ]);
    snack_drinks = pickRandom([
      "1 muỗng Whey Protein pha nước mát hoặc 1 hộp sữa tươi ít béo bổ sung sau buổi tập hoàn thành.",
      "1 hũ sữa chua Hy Lạp không đường kết hợp dâu tây chín mọng.",
      "1 quả táo đỏ cắt lát chấm 1 thìa canh bơ hạnh nhân mộc."
    ]);
    scientific_advice = `Chỉ số BMI của bạn là ${bmi}. Thực đơn phục hồi cơ bắp được thiết kế linh động sau khi bạn xuất sắc hoàn thành 100% giáo án do PT giao hôm nay. Cung cấp hàm lượng Protein cao và Carb hấp thụ chậm giúp đẩy nhanh tốc độ tái tổng hợp glycogen và phục hồi sợi cơ tổn thương một cách hoàn hảo.`;
  } else if (selectedOption.includes('tăng cơ') || selectedOption.includes('gym')) {
    target_calories = Math.round(tdee + 300);
    macro_protein_pct = 30;
    macro_carbs_pct = 45;
    macro_fat_pct = 25;

    breakfast = pickRandom([
      "3 lòng trắng trứng + 1 lòng đỏ trứng chiên ít dầu, 2 lát bánh mì nguyên cám, 1 quả chuối chín.",
      "1 bát phở bò chín tái ít bánh phở, rắc nhiều hành lá thơm, 1 cốc sữa đậu nành ấm ít đường.",
      "1 bát cháo yến mạch nấu với 100g thịt bò nạc băm, rắc tiêu và hành lá."
    ]);
    lunch = pickRandom([
      "180g ức gà áp chảo xắt hạt lựu, 1 bát cơm gạo lứt, 150g súp lơ xanh luộc chấm nước tương tỏi.",
      "180g thịt thăn bò xào măng tây và hành tây, 1 bát cơm gạo lứt lớn, canh cải cúc nấu tôm.",
      "180g phi lê cá thu sốt cà chua nhạt, 1.5 bát cơm lứt, cải thìa xào tỏi ít dầu."
    ]);
    dinner = pickRandom([
      "150g nạc vai heo luộc chấm nước mắm gừng, 1 củ khoai lang luộc, canh rau ngót nấu thịt băm.",
      "180g tôm rim sả ớt nhạt vị, 1 bát cơm lứt nhỏ, đĩa đậu cô ve luộc giòn ngọt.",
      "150g phi lê cá hồi nướng giấy bạc, salad xà lách dưa leo quả bơ sốt dầu giấm."
    ]);
    snack_drinks = pickRandom([
      "1 ly sữa tươi không đường + 30g hạt hạnh nhân hoặc óc chó chống đói xế chiều.",
      "1 muỗng Whey Protein pha nước mát kèm 1 quả chuối chín.",
      "2 quả trứng luộc lòng đào thơm ngậy bùi."
    ]);
    scientific_advice = `Chỉ số BMI của bạn là ${bmi}. Với mục tiêu tăng cơ bắp và rèn luyện Gym kháng lực, thực đơn này cung cấp thặng dư calo nhẹ và nạp protein chất lượng cao để kích thích tổng hợp protein trong cơ. Các nguồn carb phức hợp từ gạo lứt và khoai lang giúp duy trì năng lượng bền vững cho các buổi tập nâng tạ nặng mà PT giao cho bạn.`;
  } else if (selectedOption.includes('giảm mỡ') || selectedOption.includes('boxing')) {
    target_calories = Math.round(tdee - 350);
    macro_protein_pct = 35;
    macro_carbs_pct = 35;
    macro_fat_pct = 30;

    breakfast = pickRandom([
      "1 bát cháo yến mạch nấu với 80g thịt ức gà băm, rắc hành lá và tiêu thơm phức.",
      "1 quả trứng luộc, 1 lát bánh mì đen nguyên cám, 1/2 quả bơ chín thái lát.",
      "1 cốc sinh tố rau xanh (cải xoăn, táo xanh, cần tây, dưa chuột) rắc thêm hạt chia."
    ]);
    lunch = pickRandom([
      "150g cá quả hoặc cá rô phi phi lê áp chảo, 1 củ khoai lang nhỏ, 200g bắp cải luộc chín.",
      "150g ức gà hấp xé phay trộn hành tây dưa chuột bóp giấm táo, 1/2 bát cơm lứt.",
      "150g mực ống hấp hành gừng thơm, đĩa bầu luộc chấm muối vừng nhạt."
    ]);
    dinner = pickRandom([
      "1 bát canh đậu phụ nấu thịt nạc băm, salad rau cải xoong trộn cà chua bi dầu giấm.",
      "150g tôm sú hấp sả nhạt, đĩa rau muống luộc giòn dầm nước chanh mát.",
      "150g thịt thăn bò áp chảo, salad bắp cải tím hành tây dưa chuột sốt chanh leo."
    ]);
    snack_drinks = pickRandom([
      "1 hũ sữa chua Hy Lạp ít béo không đường kết hợp vài quả dâu tây chín mọng.",
      "1 quả dưa chuột thái lát ăn kèm 1 cốc trà xanh thanh mát.",
      "1/2 quả bưởi da xanh mọng nước giúp tiêu hóa tốt."
    ]);
    scientific_advice = `Chỉ số BMI của bạn là ${bmi}. Thực đơn được tối ưu hóa thâm hụt calo lành mạnh giúp đốt cháy mỡ thừa hiệu quả đồng thời bảo toàn khối lượng cơ nạc. Hàm lượng protein cao hỗ trợ đẩy mạnh quá trình trao đổi chất và tăng cảm giác no lâu, giúp bạn tập luyện boxing hay cardio cường độ cao bền bỉ hơn.`;
  } else if (selectedOption.includes('dẻo dai') || selectedOption.includes('yoga')) {
    target_calories = Math.round(tdee - 100);
    macro_protein_pct = 20;
    macro_carbs_pct = 50;
    macro_fat_pct = 30;

    breakfast = pickRandom([
      "1 ly sinh tố bơ, chuối xay với sữa hạnh nhân không đường, rắc thêm 1 thìa cafe hạt chia.",
      "1 đĩa salad trái cây (táo, chuối, dâu tây, kiwi) trộn sữa chua không đường và yến mạch nướng.",
      "2 lát bánh mì đen phết bơ đậu phộng mộc phết chuối tiêu cắt lát mỏng."
    ]);
    lunch = pickRandom([
      "150g đậu phụ kho nấm rơm chay, 1 bát cơm gạo lứt, 1 bát canh rong biển thanh mát.",
      "1 bát canh chua chay nấu dứa, cà chua, đậu phụ và dọc mùng, 1 bát cơm lứt.",
      "1 đĩa gỏi cuốn chay (rau thơm, bún lứt, đậu phụ chiên không dầu cuốn bánh tráng) chấm sốt tương đen."
    ]);
    dinner = pickRandom([
      "120g tôm sú hấp gừng, 1 đĩa bông cải xanh luộc chấm muối vừng, 1/2 quả bơ chín thái lát.",
      "150g nấm bào ngư xào dầu hào ít dầu, 1 bát súp bí đỏ hạt sen thanh đạm ngọt mát.",
      "150g cá hồi hấp xì dầu hành gừng, đĩa rau mồng tơi luộc thanh nhiệt."
    ]);
    snack_drinks = pickRandom([
      "1 ly nước dừa tươi nguyên chất hoặc 1 ly nước ép cần tây thanh lọc cơ thể.",
      "1 nắm hạt điều sấy mộc nguyên vị giòn ngậy (khoảng 25g).",
      "1 cốc chè dưỡng nhan mát lành ít đường."
    ]);
    scientific_advice = `Chỉ số BMI của bạn là ${bmi}. Để bổ trợ cho các bài tập Yoga dẻo dai và phục hồi cơ thể, thực đơn ưu tiên các nhóm thực phẩm chống viêm tự nhiên, giàu nước, vitamin và omega-3 có lợi cho khớp gối. Chế độ ăn nhẹ nhàng, dễ tiêu hóa này giúp cơ thể bạn thanh thoát, dẻo dai hơn khi thực hiện các động tác uốn dẻo khớp xương.`;
  } else {
    // Sức bền / Cải thiện sức khỏe tổng thể
    target_calories = Math.round(tdee);
    macro_protein_pct = 22;
    macro_carbs_pct = 55;
    macro_fat_pct = 23;

    breakfast = pickRandom([
      "1 đĩa mì Ý xốt bò bằm vừa phải (khoảng 80g bò nạc), 1 quả táo xanh giòn.",
      "1 bát súp ngô gà xé phay nóng hổi, 1 lát bánh mì đen nguyên cám.",
      "1 bát cháo đậu đen nấu nhạt thanh vị, 1 quả trứng luộc chín."
    ]);
    lunch = pickRandom([
      "150g phi lê cá hồi áp chảo sốt chanh leo, 1.5 bát cơm gạo lứt thơm, canh rau cải ngọt nấu tôm.",
      "180g gà kho sả ớt bỏ da giòn thơm, 1.5 bát cơm lứt, canh mướp đắng nhồi thịt nạc.",
      "150g nạc thăn heo luộc chấm mắm tỏi, 1 củ khoai tây hầm cà rốt và bí đỏ ngọt thơm."
    ]);
    dinner = pickRandom([
      "150g cá thu nướng muối ớt đậm đà, 1 bát cơm gạo lứt, đĩa ngọn su su xào tỏi ít dầu.",
      "150g thịt thăn bò áp chảo sốt vang đỏ nhạt, salad xà lách cà chua bi dưa chuột giòn mát.",
      "180g tôm rim nhạt thơm tỏi, 1 bát canh rau dền nấu thịt băm, đĩa đậu bắp luộc."
    ]);
    snack_drinks = pickRandom([
      "1 ly nước điện giải bù khoáng và 1 quả chuối tiêu trước khi chạy bộ hoặc đạp xe 30 phút.",
      "1 hũ sữa chua ít đường trộn hạt chia và yến mạch giòn.",
      "1 quả lê tươi ngọt thanh, mọng nước."
    ]);
    scientific_advice = `Chỉ số BMI của bạn là ${bmi}. Để duy trì sức bền trong các bài tập kéo dài, thực đơn này tập trung cung cấp lượng carbohydrate phức hợp phong phú giúp làm đầy kho glycogen trong gan và cơ bắp. Các chất béo tốt từ cá hồi hỗ trợ đắc lực cho hoạt động của hệ tim mạch dẻo dai.`;
  }

  return {
    target_calories,
    macro_protein_pct,
    macro_carbs_pct,
    macro_fat_pct,
    meals: {
      breakfast,
      lunch,
      dinner,
      snack_drinks
    },
    scientific_advice
  };
}

