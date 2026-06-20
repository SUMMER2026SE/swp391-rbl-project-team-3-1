const { models } = require('../config/db');
const jwt = require('jsonwebtoken');

// Native fetch helper to request Gemini API
async function generateGeminiAdvice({ guestName, age, gender, height, weight, bmi, fitnessGoal, consultationType }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
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
    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(apiURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('❌ Gemini API response error:', response.status, errData);
      return null;
    }

    const data = await response.json();
    let textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text;
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      
      const promptText = `Bạn là một trợ lý ảo thông minh của trung tâm FX Fitness. Hãy trả lời câu hỏi của khách hàng một cách ngắn gọn, chuyên nghiệp, thân thiện bằng tiếng Việt.
Thông tin chính xác về FX Fitness:
- Các gói tập: 
  + Gói Tháng: 5.000đ/tháng (Truy cập đầy đủ thiết bị, Tủ đồ cá nhân, Miễn phí giữ xe).
  + Gói 3 Tháng: 10.000đ/3 tháng (Phổ biến nhất, Tủ đồ VIP, Miễn phí giữ xe, Tham gia lớp Yoga, Đo Inbody miễn phí 1 lần).
  + Gói Năm: 15.000đ/năm (Mọi quyền lợi của Gói 3 Tháng, Tặng thêm 1 tháng tập, Tặng 2 buổi cùng PT cá nhân, Đo Inbody định kỳ).
- Các dịch vụ cung cấp:
  + Gym: Trang thiết bị hiện đại, không gian rộng rãi đáp ứng mọi nhu cầu tập luyện.
  + Yoga: Lớp học đa dạng từ cơ bản đến nâng cao, giúp cân bằng thân - tâm - trí.
  + PT Cá Nhân: Lộ trình tập luyện thiết kế riêng biệt, đồng hành cùng huấn luyện viên chuyên nghiệp.
- Người dùng có thể xem chi tiết dịch vụ tại trang web, hoặc nhấn vào "Mua Ngay" ở phần Gói Tập.

Lịch sử trò chuyện gần đây:
${(history || []).slice(-6).map(h => `${h.sender === 'user' ? 'Khách hàng' : 'Trợ lý'}: ${h.text}`).join('\n')}
Khách hàng: ${message}
Trợ lý:`;

      const response = await fetch(apiURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textResult) {
          return res.status(200).json({ response: textResult.trim() });
        }
      } else {
        const errText = await response.text();
        console.error('❌ Gemini API Response Error:', response.status, errText);
      }
    } else {
      console.log('⚠️ GEMINI_API_KEY is not defined. Using rule-based fallback for chatbot.');
    }

    // Fallback rule-based matching if Gemini API fails or is not key-configured
    const lowerMsg = message.toLowerCase();
    let reply = "Xin chào! Tôi là Trợ lý ảo FX Fitness. Bạn cần tôi hỗ trợ thông tin gì về dịch vụ, gói tập hay lộ trình luyện tập hôm nay ạ?";
    
    if (lowerMsg.includes("giá") || lowerMsg.includes("gói tập") || lowerMsg.includes("goi tap") || lowerMsg.includes("chi phí") || lowerMsg.includes("bao nhiêu tiền") || lowerMsg.includes("bao nhieu")) {
      reply = "FX Fitness hiện đang cung cấp 3 gói tập ưu đãi:\n1. **Gói Tháng**: 5.000đ/tháng (Truy cập thiết bị, tủ đồ cá nhân, giữ xe miễn phí).\n2. **Gói 3 Tháng (Phổ biến)**: 10.000đ/3 tháng (Có tủ VIP, giữ xe miễn phí, lớp Yoga, đo Inbody miễn phí 1 lần).\n3. **Gói Năm**: 15.000đ/năm (Tất cả quyền lợi Gói 3 Tháng, tặng thêm 1 tháng tập, 2 buổi cùng PT cá nhân, đo Inbody định kỳ).\nBạn có thể nhấp trực tiếp vào nút 'Mua Ngay' trên trang chủ để đăng ký nhé!";
    } else if (lowerMsg.includes("dịch vụ") || lowerMsg.includes("dich vu") || lowerMsg.includes("gym") || lowerMsg.includes("yoga") || lowerMsg.includes("pt") || lowerMsg.includes("huấn luyện viên") || lowerMsg.includes("hlv")) {
      reply = "FX Fitness cung cấp các dịch vụ luyện tập chuyên nghiệp:\n- **Gym**: Trang thiết bị nhập khẩu hiện đại, khu vực tập tạ và cardio rộng rãi.\n- **Yoga**: Không gian yên tĩnh, lớp học đa dạng từ cơ bản tới nâng cao.\n- **PT Cá Nhân**: Lộ trình tập luyện và chế độ dinh dưỡng thiết kế riêng biệt, đồng hành sát sao 1-1.\nBạn có thể nhấn vào các thẻ dịch vụ trên trang chủ để xem chi tiết hoặc liên hệ tư vấn trực tiếp.";
    } else if (lowerMsg.includes("địa chỉ") || lowerMsg.includes("dia chi") || lowerMsg.includes("ở đâu") || lowerMsg.includes("o dau") || lowerMsg.includes("vị trí") || lowerMsg.includes("chi nhánh")) {
      reply = "FX Fitness Center tọa lạc tại các khu vực trung tâm thành phố với không gian tập luyện hiện đại đạt chuẩn. Quý khách vui lòng ghé thăm trực tiếp hoặc nhắn tin qua hotline để được hướng dẫn đường đi chi tiết nhất!";
    } else if (lowerMsg.includes("giờ mở cửa") || lowerMsg.includes("giờ hoạt động") || lowerMsg.includes("mở cửa") || lowerMsg.includes("gio mo cua")) {
      reply = "FX Fitness mở cửa phục vụ quý khách từ **5:00 sáng đến 22:00 tối** tất cả các ngày trong tuần (kể cả Thứ Bảy, Chủ Nhật và ngày lễ). Rất hân hạnh được đón tiếp bạn!";
    } else if (lowerMsg.includes("xin chào") || lowerMsg.includes("hello") || lowerMsg.includes("hi") || lowerMsg.includes("chào") || lowerMsg.includes("alo")) {
      reply = "Xin chào! Tôi là Trợ lý ảo của FX Fitness. Tôi có thể hỗ trợ gì cho hành trình rèn luyện sức khỏe của bạn hôm nay?";
    } else if (lowerMsg.includes("tạm biệt") || lowerMsg.includes("bye") || lowerMsg.includes("cảm ơn") || lowerMsg.includes("cam on") || lowerMsg.includes("thank")) {
      reply = "Cảm ơn bạn đã trò chuyện cùng tôi! Chúc bạn có những giờ phút tập luyện tràn đầy năng lượng tại FX Fitness. Hẹn gặp lại nhé!";
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
