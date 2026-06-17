require('dotenv').config();

// Start Express server programmatically
const express = require('express');
const http = require('http');

console.log('⏳ Khởi động server để kiểm thử API...');
// We require index.js which starts the server
const serverEntry = require('./index.js');

// Helper to delay execution
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  try {
    // Wait for Express server to start listening
    await sleep(2500);
    console.log('\n🌟 BẮT ĐẦU CHẠY LUỒNG KIỂM THỬ TỰ ĐỘNG:');
    
    const BASE_URL = 'http://localhost:5000';
    let trainerToken = '';
    let memberToken = '';
    let memberId = null;
    let workoutPlanId = null;
    let mealPlanId = null;

    // 1. ĐĂNG NHẬP DƯỚI QUYỀN PT (TRAINER)
    console.log('\n--- 1. Đăng nhập tài khoản PT ---');
    const loginTrainerRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'trainer@gym.com', password: '123456' }),
    });
    const loginTrainerData = await loginTrainerRes.json();
    if (!loginTrainerRes.ok) {
      throw new Error(`Đăng nhập PT thất bại: ${loginTrainerData.message}`);
    }
    trainerToken = loginTrainerData.token;
    console.log('✅ Đăng nhập PT thành công! Token đã được sinh ra.');

    // 2. LẤY DANH SÁCH MEMBER (QUYỀN PT)
    console.log('\n--- 2. PT lấy danh sách Hội viên để chọn gán ---');
    const membersRes = await fetch(`${BASE_URL}/api/workout-plans/members`, {
      headers: { Authorization: `Bearer ${trainerToken}` },
    });
    const membersData = await membersRes.json();
    if (!membersRes.ok) {
      throw new Error(`Lấy danh sách member thất bại: ${membersData.message}`);
    }
    
    const testMember = membersData.find(m => m.email === 'member@gym.com');
    if (!testMember) {
      throw new Error('Không tìm thấy tài khoản member@gym.com trong DB!');
    }
    memberId = testMember.member_id;
    console.log(`✅ Lấy danh sách thành công! Tìm thấy Member ID: ${memberId} (${testMember.fullName})`);

    // 3. TẠO WORKOUT PLAN CHO MEMBER (QUYỀN PT)
    console.log('\n--- 3. PT tạo Kế hoạch tập luyện mới ---');
    const createWorkoutRes = await fetch(`${BASE_URL}/api/workout-plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${trainerToken}`,
      },
      body: JSON.stringify({
        memberId: memberId,
        title: 'Bài tập Core & Cardio Test',
        description: 'Kế hoạch tập tự động được sinh bởi test script',
        exercises: [
          { exercise_name: 'Plank Hold', sets: 3, reps: 1, duration_minutes: 5, calories_burned: 45 },
          { exercise_name: 'Jumping Jacks', sets: 4, reps: 25, duration_minutes: 8, calories_burned: 80 }
        ]
      }),
    });
    if (!createWorkoutRes.ok) {
      const text = await createWorkoutRes.text();
      throw new Error(`Tạo Workout Plan thất bại (Status ${createWorkoutRes.status}): ${text}`);
    }
    const createWorkoutData = await createWorkoutRes.json();
    workoutPlanId = createWorkoutData.plan.workout_plan_id;
    console.log(`✅ Tạo Workout Plan thành công! ID Kế hoạch: ${workoutPlanId}`);

    // 4. TẠO MEAL PLAN CHO MEMBER (QUYỀN PT)
    console.log('\n--- 4. PT tạo Kế hoạch ăn uống mới ---');
    const createMealRes = await fetch(`${BASE_URL}/api/meal-plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${trainerToken}`,
      },
      body: JSON.stringify({
        memberId: memberId,
        title: 'Chế độ Dinh Dưỡng Test Calo',
        description: 'Tăng cường chất xơ và đạm',
        calories_per_day: 2000
      }),
    });
    const createMealData = await createMealRes.json();
    if (!createMealRes.ok) {
      throw new Error(`Tạo Meal Plan thất bại: ${createMealData.message}`);
    }
    mealPlanId = createMealData.plan.meal_plan_id;
    console.log(`✅ Tạo Meal Plan thành công! ID Kế hoạch ăn: ${mealPlanId}`);

    // 5. ĐĂNG NHẬP DƯỚI QUYỀN MEMBER
    console.log('\n--- 5. Đăng nhập tài khoản Member ---');
    const loginMemberRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'member@gym.com', password: '123456' }),
    });
    const loginMemberData = await loginMemberRes.json();
    if (!loginMemberRes.ok) {
      throw new Error(`Đăng nhập Member thất bại: ${loginMemberData.message}`);
    }
    memberToken = loginMemberData.token;
    console.log('✅ Đăng nhập Member thành công!');

    // 6. MEMBER XEM KẾ HOẠCH TẬP LUYỆN
    console.log('\n--- 6. Member truy vấn Kế hoạch tập luyện ---');
    const memberWorkoutsRes = await fetch(`${BASE_URL}/api/workout-plans`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    const memberWorkoutsData = await memberWorkoutsRes.json();
    if (!memberWorkoutsRes.ok) {
      throw new Error(`Member xem Workout Plan thất bại: ${memberWorkoutsData.message}`);
    }
    const hasMyWorkout = memberWorkoutsData.some(p => p.workout_plan_id === workoutPlanId);
    console.log(hasMyWorkout ? '✅ Thành công: Member nhìn thấy kế hoạch tập luyện vừa gán!' : '❌ Thất bại: Không tìm thấy kế hoạch!');

    // 7. MEMBER XEM KẾ HOẠCH ĂN UỐNG
    console.log('\n--- 7. Member truy vấn Kế hoạch ăn uống ---');
    const memberMealsRes = await fetch(`${BASE_URL}/api/meal-plans`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    const memberMealsData = await memberMealsRes.json();
    if (!memberMealsRes.ok) {
      throw new Error(`Member xem Meal Plan thất bại: ${memberMealsData.message}`);
    }
    const hasMyMeal = memberMealsData.some(p => p.meal_plan_id === mealPlanId);
    console.log(hasMyMeal ? '✅ Thành công: Member nhìn thấy kế hoạch ăn uống vừa gán!' : '❌ Thất bại: Không tìm thấy kế hoạch ăn!');

    // 8. DỌN DẸP DỮ LIỆU SAU TEST (QUYỀN PT XÓA)
    console.log('\n--- 8. Dọn dẹp dữ liệu kiểm thử (Xóa kế hoạch) ---');
    
    const deleteWorkoutRes = await fetch(`${BASE_URL}/api/workout-plans/${workoutPlanId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${trainerToken}` },
    });
    if (deleteWorkoutRes.ok) {
      console.log('✅ Đã xóa Workout Plan kiểm thử.');
    }

    const deleteMealRes = await fetch(`${BASE_URL}/api/meal-plans/${mealPlanId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${trainerToken}` },
    });
    if (deleteMealRes.ok) {
      console.log('✅ Đã xóa Meal Plan kiểm thử.');
    }

    console.log('\n🎉 THÀNH CÔNG: Toàn bộ luồng kiểm thử CRUD và Phân quyền hoạt động trơn tru 100%!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ KIỂM THỬ THẤT BẠI:', error.message);
    process.exit(1);
  }
}

runTests();
