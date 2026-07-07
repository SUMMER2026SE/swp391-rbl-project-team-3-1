const { models, sequelize } = require('../src/config/db');

async function updateDB() {
    try {
        console.log('🔄 Bắt đầu cập nhật cơ sở dữ liệu (Gói tập & Dịch vụ)...');
        await sequelize.transaction(async (t) => {
            // 1. Vô hiệu hóa tất cả gói tập cũ để không bị trùng lặp hiển thị
            await models.MembershipPlans.update(
                { status: 'Inactive' },
                { where: { status: 'Active' }, transaction: t }
            );

            // 2. Tạo các gói tập mới: Gym, Yoga, Boxing (3, 6, 12 tháng)
            const newPlans = [
                { plan_name: 'Gym 3 Tháng', duration_months: 3, price: 1500000, status: 'Active', sport_type: 'Gym', description: 'Trải nghiệm phòng tập đẳng cấp với đầy đủ thiết bị hiện đại nhất.' },
                { plan_name: 'Gym 6 Tháng', duration_months: 6, price: 2800000, status: 'Active', sport_type: 'Gym', description: 'Gói phổ biến nhất, tiết kiệm chi phí và xây dựng thói quen lâu dài.' },
                { plan_name: 'Gym 12 Tháng', duration_months: 12, price: 5000000, status: 'Active', sport_type: 'Gym', description: 'Cam kết thay đổi vóc dáng toàn diện với mức giá ưu đãi tốt nhất.' },
                
                { plan_name: 'Yoga 3 Tháng', duration_months: 3, price: 1800000, status: 'Active', sport_type: 'Yoga', description: 'Thả lỏng tâm trí, rèn luyện sự dẻo dai cơ thể cùng các master yoga.' },
                { plan_name: 'Yoga 6 Tháng', duration_months: 6, price: 3200000, status: 'Active', sport_type: 'Yoga', description: 'Tìm lại sự cân bằng, phù hợp cho người mới bắt đầu.' },
                { plan_name: 'Yoga 12 Tháng', duration_months: 12, price: 6000000, status: 'Active', sport_type: 'Yoga', description: 'Hành trình 1 năm đánh thức năng lượng tĩnh lặng bên trong bạn.' },

                { plan_name: 'Boxing 3 Tháng', duration_months: 3, price: 2000000, status: 'Active', sport_type: 'Boxing', description: 'Giải tỏa stress, đốt mỡ cực nhanh và học kỹ năng tự vệ cơ bản.' },
                { plan_name: 'Boxing 6 Tháng', duration_months: 6, price: 3600000, status: 'Active', sport_type: 'Boxing', description: 'Tăng cường phản xạ và sức bền một cách tối đa.' },
                { plan_name: 'Boxing 12 Tháng', duration_months: 12, price: 6500000, status: 'Active', sport_type: 'Boxing', description: 'Trở thành phiên bản mạnh mẽ nhất của chính mình.' }
            ];
            await models.MembershipPlans.bulkCreate(newPlans, { transaction: t });
            console.log('✅ Đã cập nhật xong Gói Tập (MembershipPlans)');

            // 3. Vô hiệu hóa các dịch vụ thuê PT cũ
            await models.Services.update(
                { status: 'Unavailable' },
                { where: { service_type: 'Huấn luyện' }, transaction: t }
            );

            // 4. Tạo các gói Thuê PT mới
            const newPTServices = [
                { service_name: 'Thuê PT (10 buổi)', service_type: 'Huấn luyện', description: 'Tập luyện 1 kèm 1 theo lộ trình cơ bản, làm quen kỹ thuật.', price: 5000000, status: 'Available' },
                { service_name: 'Thuê PT (20 buổi)', service_type: 'Huấn luyện', description: 'Lộ trình chuyên sâu, cải thiện vóc dáng rõ rệt.', price: 9000000, status: 'Available' },
                { service_name: 'Thuê PT dài hạn (3 tháng)', service_type: 'Huấn luyện', description: 'Đồng hành 3 tháng liên tục, xây dựng chế độ dinh dưỡng chuyên biệt.', price: 12000000, status: 'Available' },
                { service_name: 'Thuê PT dài hạn (6 tháng)', service_type: 'Huấn luyện', description: 'Thay đổi toàn diện, phá vỡ giới hạn bản thân cùng PT.', price: 22000000, status: 'Available' },
                { service_name: 'Thuê PT dài hạn (9 tháng)', service_type: 'Huấn luyện', description: 'Gói cam kết hình thể dài hạn, tối ưu hóa sức khỏe trọn vẹn.', price: 30000000, status: 'Available' }
            ];
            await models.Services.bulkCreate(newPTServices, { transaction: t });
            console.log('✅ Đã cập nhật xong Dịch vụ Thuê PT (Services)');
        });
        console.log('🎉 Cập nhật database thành công!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Cập nhật database thất bại:', error);
        process.exit(1);
    }
}

updateDB();
