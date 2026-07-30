const { models, sequelize } = require('./config/db');

const plansData = [
  {
    plan_name: 'Gym 3 Tháng',
    sport_type: 'Gym',
    duration_months: 3,
    price: 3000000,
    description: 'Truy cập đầy đủ thiết bị Gym. Tặng 2 buổi PT miễn phí (không chọn PT). Đo inbody định kỳ.',
    status: 'Active'
  },
  {
    plan_name: 'Gym 6 Tháng',
    sport_type: 'Gym',
    duration_months: 6,
    price: 5500000,
    description: 'Truy cập đầy đủ thiết bị Gym. Tặng 2 buổi PT miễn phí (không chọn PT). Đo inbody định kỳ.',
    status: 'Active'
  },
  {
    plan_name: 'Gym 12 Tháng',
    sport_type: 'Gym',
    duration_months: 12,
    price: 10000000,
    description: 'Truy cập đầy đủ thiết bị Gym. Tặng 2 buổi PT miễn phí (không chọn PT). Đo inbody định kỳ.',
    status: 'Active'
  },
  {
    plan_name: 'Yoga 3 Tháng',
    sport_type: 'Yoga',
    duration_months: 3,
    price: 3500000,
    description: 'Thoải mái tham gia các lớp Yoga hàng tuần. Tặng 2 buổi PT Yoga miễn phí (không chọn PT).',
    status: 'Active'
  },
  {
    plan_name: 'Yoga 6 Tháng',
    sport_type: 'Yoga',
    duration_months: 6,
    price: 6500000,
    description: 'Thoải mái tham gia các lớp Yoga hàng tuần. Tặng 2 buổi PT Yoga miễn phí (không chọn PT).',
    status: 'Active'
  },
  {
    plan_name: 'Yoga 12 Tháng',
    sport_type: 'Yoga',
    duration_months: 12,
    price: 12000000,
    description: 'Thoải mái tham gia các lớp Yoga hàng tuần. Tặng 2 buổi PT Yoga miễn phí (không chọn PT).',
    status: 'Active'
  }
];

const servicesData = [
  {
    service_name: 'Thuê Khăn (1 tháng)',
    service_type: 'Tiện ích',
    price: 200000,
    description: 'Cung cấp khăn sạch mỗi buổi tập.',
    status: 'Available'
  },
  {
    service_name: 'Gói Nước Uống (1 tháng)',
    service_type: 'Tiện ích',
    price: 150000,
    description: 'Sử dụng nước uống thả ga không giới hạn.',
    status: 'Available'
  },
  {
    service_name: 'Phòng Xông Hơi (1 tháng)',
    service_type: 'Tiện ích',
    price: 400000,
    description: 'Tự do sử dụng phòng xông hơi ướt/khô.',
    status: 'Available'
  },
  {
    service_name: 'Giãn cơ Massage (1 tháng)',
    service_type: 'Tiện ích',
    price: 1000000,
    description: 'Dịch vụ giãn cơ và massage sau các buổi tập.',
    status: 'Available'
  },
  {
    service_name: 'Thuê PT (15 buổi)',
    service_type: 'Huấn luyện',
    price: 7500000,
    description: 'Được quyền CHỌN huấn luyện viên riêng. Tập luyện 1 kèm 1 theo lộ trình thiết kế.',
    status: 'Available'
  },
  {
    service_name: 'Thuê PT (30 buổi)',
    service_type: 'Huấn luyện',
    price: 14000000,
    description: 'Được quyền CHỌN huấn luyện viên riêng. Tập luyện 1 kèm 1 theo lộ trình chuyên sâu.',
    status: 'Available'
  }
];

async function seedData() {
  try {
    console.log('Clearing old data...');
    // Xóa dữ liệu cũ nếu muốn (hoặc chỉ cập nhật)
    // Ở đây mình chọn chỉ thêm nếu chưa có, hoặc truncate. Vì có ràng buộc khóa ngoại nên truncate cần cẩn thận.
    // Xoá các plan và service nếu chưa có foreign key liên quan, hoặc update.
    // Mình sẽ tạo mới để nhanh gọn nếu DB trống hoặc update.
    
    // Tạm thời Disable checks for seeding (cần transaction hoặc cẩn thận với khóa ngoại)
    
    for (const plan of plansData) {
      const [record, created] = await models.MembershipPlans.findOrCreate({
        where: { plan_name: plan.plan_name },
        defaults: plan
      });
      if (!created) {
        await record.update(plan);
      }
    }
    console.log(`✅ Seeded ${plansData.length} Membership Plans.`);

    for (const srv of servicesData) {
      const [record, created] = await models.Services.findOrCreate({
        where: { service_name: srv.service_name },
        defaults: srv
      });
      if (!created) {
        await record.update(srv);
      }
    }
    console.log(`✅ Seeded ${servicesData.length} Services.`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    process.exit();
  }
}

seedData();
