import React, { useState, useEffect } from 'react';
import './MemberDashboard.css';

function MemberDashboard({
  token,
  userInfo,
  logout,
  avatarUrl,
  uploadAvatar,
  fileInputRef,
  profileData,
  fetchProfile
}) {
  const [activeTab, setActiveTab] = useState('tongquan');

  // --- MEMBER DASHBOARD STATE VARIABLES ---
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGender, setEditGender] = useState('Nam');
  const [editDob, setEditDob] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editGoals, setEditGoals] = useState([]);
  const [editLevel, setEditLevel] = useState('Người mới bắt đầu');
  const [editEmergency, setEditEmergency] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Interactive local states for Appointments, Workouts, Meals, Notifications
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [dbWorkoutPlans, setDbWorkoutPlans] = useState([]);
  const [dbMealPlans, setDbMealPlans] = useState([]);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('07:00');
  const [bookingType, setBookingType] = useState('PT Cá Nhân');
  const [bookingNote, setBookingNote] = useState('');
  const [isBookingLoading, setIsBookingLoading] = useState(false);

  // Password change states
  const [cpwOld, setCpwOld] = useState('');
  const [cpwNew, setCpwNew] = useState('');
  const [cpwConf, setCpwConf] = useState('');
  const [cpwAlert, setCpwAlert] = useState({ show: false, msg: '', ok: false });

  // Workout state: completion status per exercise ID
  const [completedExercises, setCompletedExercises] = useState({
    1: false, 2: false, 3: false, 4: false, 5: false
  });
  // Meal state: completion status per meal ID
  const [completedMeals, setCompletedMeals] = useState({
    'morning': false, 'noon': false, 'evening': false
  });

  // Notifications state
  const [notifications, setNotifications] = useState([]);

  // Weight history tracking state
  const [weightHistory, setWeightHistory] = useState([]);
  const [newHistoryWeight, setNewHistoryWeight] = useState('');
  const [newHistoryDate, setNewHistoryDate] = useState('');

  // Synchronize edit fields when profileData loads
  useEffect(() => {
    if (profileData) {
      setEditFullName(profileData.fullName || '');
      setEditPhone(profileData.phoneNumber || '');
      setEditGender(profileData.gender || 'Nam');
      
      if (profileData.dateOfBirth) {
        setEditDob(profileData.dateOfBirth.split('T')[0]);
      } else {
        setEditDob('');
      }

      if (profileData.memberInfo) {
        // height in DB is in meters, convert to cm (multiply by 100)
        setEditHeight(profileData.memberInfo.height ? Math.round(profileData.memberInfo.height * 100).toString() : '');
        setEditWeight(profileData.memberInfo.weight ? profileData.memberInfo.weight.toString() : '');
        
        const goalStr = profileData.memberInfo.fitness_goal || '';
        setEditGoals(goalStr ? goalStr.split(',').map(g => g.trim()) : []);
        setEditLevel(profileData.memberInfo.fitness_level || 'Người mới bắt đầu');
        setEditEmergency(profileData.memberInfo.emergency_contact || '');

        // Initialize notifications
        const pt = profileData.memberInfo.activePtName || 'Bùi Nguyễn Minh Tuệ';
        setNotifications([
          {
            id: 1,
            message: `Lịch hẹn tập thử với HLV ${pt !== 'Chưa đăng ký' ? pt : 'Bùi Nguyễn Minh Tuệ'} vào Thứ 3 lúc 7:00 đã được xác nhận.`,
            time: '2 giờ trước',
            unread: true
          },
          {
            id: 2,
            message: `Gói tập Gói Năm của bạn hiện đang kích hoạt (còn ${profileData.memberInfo.remainingDays || 287} ngày).`,
            time: '1 ngày trước',
            unread: false
          },
          {
            id: 3,
            message: 'Chào mừng hội viên mới! Bạn đã thiết lập thông tin sức khỏe thành công.',
            time: '2 ngày trước',
            unread: false
          }
        ]);

        // Initialize weight history
        const curW = profileData.memberInfo.weight || 65;
        setWeightHistory([
          { date: '15/05', weight: Number(curW) - 3 },
          { date: '22/05', weight: Number(curW) - 2 },
          { date: '29/05', weight: Number(curW) - 1 },
          { date: '05/06', weight: Number(curW) }
        ]);
      }
    }
  }, [profileData]);

  // Fetch live member appointments and plans from database
  const reloadMemberAppointments = () => {
    if (!token || token === 'mock-preview-token') return;
    fetch('/api/dashboard/member/appointments', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.appointments) {
          setAppointmentsList(data.appointments);
        }
      })
      .catch(err => console.error('Error fetching member appointments:', err));
  };

  const reloadPlans = () => {
    if (!token || token === 'mock-preview-token') return;
    fetch('/api/workout-plans', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDbWorkoutPlans(data);
        }
      })
      .catch(err => console.error('Error fetching workout plans:', err));

    fetch('/api/meal-plans', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDbMealPlans(data);
        }
      })
      .catch(err => console.error('Error fetching meal plans:', err));
  };

  useEffect(() => {
    reloadMemberAppointments();
    reloadPlans();
  }, [token]);

  // --- ACTIONS & HANDLERS ---
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileSuccessMsg('');
    setProfileErrorMsg('');
    setIsUpdatingProfile(true);

    if (!editFullName.trim()) {
      setProfileErrorMsg('Họ tên không được để trống!');
      setIsUpdatingProfile(false);
      return;
    }

    try {
      const heightInMeters = editHeight ? Number(editHeight) / 100 : null;
      const weightNum = editWeight ? Number(editWeight) : null;
      const goalsStr = editGoals.join(', ');

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: editFullName,
          phoneNumber: editPhone,
          gender: editGender,
          dateOfBirth: editDob,
          height: heightInMeters,
          weight: weightNum,
          fitnessGoal: goalsStr,
          fitnessLevel: editLevel,
          emergencyContact: editEmergency
        })
      });

      const data = await res.json();
      setIsUpdatingProfile(false);

      if (res.ok) {
        setProfileSuccessMsg('Cập nhật thông tin cá nhân thành công!');
        fetchProfile(token);
        if (weightNum && (!profileData?.memberInfo?.weight || profileData.memberInfo.weight !== weightNum)) {
          const dateStr = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
          setWeightHistory(prev => [...prev, { date: dateStr, weight: weightNum }]);
        }
      } else {
        setProfileErrorMsg(data.message || 'Cập nhật thông tin thất bại!');
      }
    } catch (err) {
      setIsUpdatingProfile(false);
      setProfileErrorMsg('Lỗi kết nối máy chủ!');
    }
  };

  const toggleEditGoal = (goal) => {
    if (editGoals.includes(goal)) {
      setEditGoals(editGoals.filter(g => g !== goal));
    } else {
      setEditGoals([...editGoals, goal]);
    }
  };

  const handleBookAppointment = (e) => {
    e.preventDefault();
    if (!bookingDate) {
      alert('Vui lòng chọn ngày hẹn!');
      return;
    }
    
    setIsBookingLoading(true);
    
    fetch('/api/dashboard/member/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        date: bookingDate,
        time: bookingTime,
        type: bookingType,
        note: bookingNote
      })
    })
      .then(res => {
        if (!res.ok) return res.json().then(err => { throw new Error(err.message); });
        return res.json();
      })
      .then(data => {
        alert(data.message || 'Đăng ký lịch tập thành công!');
        setIsBookingLoading(false);
        setBookingDate('');
        setBookingNote('');
        reloadMemberAppointments();
        
        const newNotif = {
          id: Date.now(),
          message: `Lịch hẹn tập mới lúc ${bookingTime} ngày ${bookingDate} đang chờ duyệt.`,
          time: 'Vừa xong',
          unread: true
        };
        setNotifications(prev => [newNotif, ...prev]);
        setActiveTab('tongquan');
      })
      .catch(err => {
        setIsBookingLoading(false);
        alert(err.message || 'Lỗi khi đăng ký lịch tập!');
      });
  };

  const handleCancelAppointment = (id) => {
    const ap = appointmentsList.find(a => a.id === id);
    if (!ap) return;
    
    const confirmCancel = window.confirm(`Bạn có chắc chắn muốn hủy lịch hẹn tập này?`);
    if (confirmCancel) {
      fetch(`/api/dashboard/member/appointments/${id}/cancel`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          alert(data.message || 'Đã hủy lịch hẹn thành công!');
          reloadMemberAppointments();
          
          const newNotif = {
            id: Date.now(),
            message: `Bạn đã hủy lịch hẹn tập thành công.`,
            time: 'Vừa xong',
            unread: true
          };
          setNotifications(prev => [newNotif, ...prev]);
        })
        .catch(err => {
          console.error(err);
          alert('Lỗi kết nối khi hủy lịch tập!');
        });
    }
  };

  const toggleExercise = (exId) => {
    setCompletedExercises(prev => ({
      ...prev,
      [exId]: !prev[exId]
    }));
  };

  const toggleMeal = (mealKey) => {
    setCompletedMeals(prev => ({
      ...prev,
      [mealKey]: !prev[mealKey]
    }));
  };

  const handleAddWeightHistory = (e) => {
    e.preventDefault();
    if (!newHistoryWeight || Number(newHistoryWeight) <= 0) {
      alert('Vui lòng nhập cân nặng hợp lệ!');
      return;
    }
    
    const dateStr = newHistoryDate 
      ? new Date(newHistoryDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
      : new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      
    const wNum = Number(newHistoryWeight);
    setWeightHistory(prev => [...prev, { date: dateStr, weight: wNum }]);
    setNewHistoryWeight('');
    setNewHistoryDate('');
    
    const updateProfileWeight = window.confirm(`Bạn có muốn cập nhật cân nặng ${wNum}kg này vào hồ sơ chính thức của mình không?`);
    if (updateProfileWeight) {
      setEditWeight(wNum.toString());
      fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: editFullName,
          phoneNumber: editPhone,
          gender: editGender,
          dateOfBirth: editDob,
          height: editHeight ? Number(editHeight) / 100 : null,
          weight: wNum,
          fitnessGoal: editGoals.join(', '),
          fitnessLevel: editLevel,
          emergencyContact: editEmergency
        })
      }).then(r => {
        if (r.ok) {
          fetchProfile(token);
        }
      });
    }
  };

  const markAllNotifsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };
  
  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const doChangePw = async (e) => {
    e.preventDefault();
    setCpwAlert({ show: false, msg: '', ok: false });

    if (cpwNew !== cpwConf) {
      setCpwAlert({ show: true, msg: 'Mật khẩu xác nhận không khớp!', ok: false });
      return;
    }

    try {
      const r = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword: cpwOld, newPassword: cpwNew }),
      });
      const d = await r.json();
      if (r.ok) {
        setCpwAlert({ show: true, msg: d.message + ' Đang cập nhật phiên...', ok: true });
        setCpwOld('');
        setCpwNew('');
        setCpwConf('');

        try {
          const email = userInfo && userInfo.email;
          if (!email) throw new Error('No email available');

          const lr = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: cpwNew }),
          });
          const ld = await lr.json();
          if (lr.ok) {
            localStorage.setItem('token', ld.token);
            localStorage.setItem('userInfo', JSON.stringify(ld.user));
            window.dispatchEvent(new Event('authChange'));
            setCpwAlert({ show: true, msg: 'Đổi mật khẩu thành công!', ok: true });
          } else {
            setCpwAlert({ show: true, msg: 'Đổi mật khẩu xong nhưng đăng nhập lại thất bại, đang đăng xuất...', ok: false });
            setTimeout(logout, 2000);
          }
        } catch (err) {
          console.error('Re-login after password change failed:', err);
          setCpwAlert({ show: true, msg: 'Đổi mật khẩu thành công nhưng có lỗi khi cập nhật phiên. Vui lòng đăng nhập lại.', ok: false });
          setTimeout(logout, 2000);
        }
      } else {
        setCpwAlert({ show: true, msg: d.message || 'Thay đổi mật khẩu thất bại!', ok: false });
      }
    } catch (err) {
      setCpwAlert({ show: true, msg: 'Lỗi kết nối máy chủ!', ok: false });
    }
  };

  const getCurrentDateString = () => {
    const now = new Date();
    const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const months = [
      'tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6',
      'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'
    ];
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} năm ${now.getFullYear()}`;
  };

  const totalExs = 5;
  const completedExsCount = Object.keys(completedExercises).filter(k => completedExercises[k]).length;
  const workoutProgressPct = Math.round((completedExsCount / totalExs) * 100);

  const mealsData = [
    { key: 'morning', name: 'Sáng', desc: 'Yến mạch + trứng luộc', kcal: 450, carbs: '45g', protein: '25g', fat: '10g' },
    { key: 'noon', name: 'Trưa', desc: 'Cơm gạo lứt + ức gà', kcal: 650, carbs: '60g', protein: '45g', fat: '12g' },
    { key: 'evening', name: 'Tối', desc: 'Salad + cá hồi', kcal: 520, carbs: '20g', protein: '35g', fat: '18g' }
  ];
  
  const eatenKcal = mealsData.reduce((sum, meal) => {
    return sum + (completedMeals[meal.key] ? meal.kcal : 0);
  }, 0);
  const targetKcal = 1620;

  const unreadNotifsCount = notifications.filter(n => n.unread).length;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tongquan':
        return (
          <>
            {/* Stat Cards */}
            <div className="member-stats-grid">
              <div className="member-stat-card">
                <span className="member-stat-label">Ngày còn lại</span>
                <span className="member-stat-value">{profileData?.memberInfo?.remainingDays ?? 287}</span>
                <i className="fa-solid fa-calendar member-stat-icon"></i>
              </div>
              <div className="member-stat-card">
                <span className="member-stat-label">Buổi tập tuần này</span>
                <span className="member-stat-value">{completedExsCount} / 5</span>
                <i className="fa-solid fa-dumbbell member-stat-icon"></i>
              </div>
              <div className="member-stat-card">
                <span className="member-stat-label">PT đang học</span>
                <span className="member-stat-value" style={{ fontSize: '1.15rem', marginTop: '6px' }}>
                  {profileData?.memberInfo?.activePtName || 'Chưa đăng ký'}
                </span>
                <i className="fa-solid fa-user-tie member-stat-icon"></i>
              </div>
              <div className="member-stat-card">
                <span className="member-stat-label">BMI hiện tại</span>
                <span className="member-stat-value">{profileData?.memberInfo?.bmi || '22.4'}</span>
                <i className="fa-solid fa-gauge-simple-high member-stat-icon"></i>
              </div>
            </div>

            {/* Grid Columns */}
            <div className="member-overview-grid">
              {/* Left Column: Upcoming Appointments */}
              <div className="member-card-panel">
                <div className="member-card-header">
                  <h3 className="member-card-title">Lịch hẹn sắp tới</h3>
                  <span className="member-link-action" onClick={() => setActiveTab('lichhen')}>Xem tất cả</span>
                </div>
                <div className="member-table-container">
                  <table className="member-table">
                    <thead>
                      <tr>
                        <th>Thời gian</th>
                        <th>HLV / Lớp</th>
                        <th>Loại</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointmentsList.filter(a => a.status !== 'cancelled').slice(0, 4).map((ap) => (
                        <tr key={ap.id}>
                          <td>{ap.time}</td>
                          <td>{ap.trainer}</td>
                          <td>{ap.type}</td>
                          <td>
                            <span className={`member-badge-status ${ap.status}`}>
                              {ap.status === 'confirmed' ? 'Xác nhận' : ap.status === 'pending' ? 'Chờ duyệt' : 'Đã hủy'}
                            </span>
                          </td>
                          <td>
                            <button className="member-action-cancel" onClick={() => handleCancelAppointment(ap.id)}>Hủy</button>
                          </td>
                        </tr>
                      ))}
                      {appointmentsList.filter(a => a.status !== 'cancelled').length === 0 && (
                        <tr>
                          <td colSpan="5" className="member-no-data">Không có lịch hẹn nào sắp tới</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Today's Menu */}
              <div className="member-card-panel">
                <div className="member-card-header">
                  <h3 className="member-card-title">Thực đơn hôm nay</h3>
                  <span className="member-link-action" onClick={() => setActiveTab('meal')}>Xem chi tiết</span>
                </div>
                <div className="member-menu-meal-list">
                  {mealsData.map((meal) => (
                    <div className="member-menu-meal-item" key={meal.key}>
                      <div>
                        <div className="member-meal-time">{meal.name}</div>
                        <div className="member-meal-desc">{meal.desc}</div>
                      </div>
                      <div className="member-meal-kcal">{meal.kcal} kcal</div>
                    </div>
                  ))}
                </div>
                <div className="member-menu-total-row">
                  <span className="member-menu-total-lbl">Tổng calories</span>
                  <span className="member-menu-total-val">{targetKcal.toLocaleString('vi-VN')}</span>
                </div>
              </div>
            </div>
          </>
        );

      case 'lichhen':
        return (
          <div className="member-booking-container">
            <div className="member-form-card">
              <h3 className="member-card-title" style={{ marginBottom: '20px' }}>Đăng ký lịch hẹn mới</h3>
              <form className="member-booking-form" onSubmit={handleBookAppointment}>
                <div className="member-form-group">
                  <label className="member-form-label">Chọn ngày tập</label>
                  <input 
                    type="date" 
                    className="member-form-input" 
                    value={bookingDate} 
                    onChange={(e) => setBookingDate(e.target.value)} 
                    min={new Date().toISOString().split('T')[0]}
                    required 
                  />
                </div>
                <div className="member-form-group">
                  <label className="member-form-label">Chọn khung giờ</label>
                  <select 
                    className="member-form-select" 
                    value={bookingTime} 
                    onChange={(e) => setBookingTime(e.target.value)}
                  >
                    <option value="07:00">07:00 - Sáng</option>
                    <option value="08:00">08:00 - Sáng</option>
                    <option value="09:00">09:00 - Sáng</option>
                    <option value="10:00">10:00 - Sáng</option>
                    <option value="14:00">14:00 - Chiều</option>
                    <option value="15:00">15:00 - Chiều</option>
                    <option value="16:00">16:00 - Chiều</option>
                    <option value="17:00">17:00 - Chiều</option>
                    <option value="18:00">18:00 - Tối</option>
                    <option value="19:00">19:00 - Tối</option>
                  </select>
                </div>
                <div className="member-form-group">
                  <label className="member-form-label">Loại hình tập luyện</label>
                  <select 
                    className="member-form-select" 
                    value={bookingType} 
                    onChange={(e) => setBookingType(e.target.value)}
                  >
                    <option value="PT Cá Nhân">PT Cá Nhân (1 kèm 1)</option>
                    <option value="Yoga">Lớp Yoga nhóm</option>
                    <option value="Cardio">Cardio & Giảm mỡ</option>
                    <option value="Zumba">Lớp Zumba nhóm</option>
                  </select>
                </div>
                <div className="member-form-group">
                  <label className="member-form-label">Ghi chú cho HLV</label>
                  <input 
                    type="text" 
                    className="member-form-input" 
                    placeholder="Ví dụ: Tập trung tập thân dưới, bài tập phục hồi..." 
                    value={bookingNote} 
                    onChange={(e) => setBookingNote(e.target.value)} 
                  />
                </div>
                <button 
                  type="submit" 
                  className="member-btn-submit" 
                  disabled={isBookingLoading}
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  {isBookingLoading ? 'Đang gửi...' : 'Gửi yêu cầu đặt lịch'}
                </button>
              </form>
            </div>

            <div className="member-card-panel">
              <h3 className="member-card-title" style={{ marginBottom: '20px' }}>Danh sách lịch hẹn</h3>
              <div className="member-table-container">
                <table className="member-table">
                  <thead>
                    <tr>
                      <th>Thời gian</th>
                      <th>HLV / Lớp</th>
                      <th>Loại</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointmentsList.map((ap) => (
                      <tr key={ap.id}>
                        <td>{ap.time}</td>
                        <td>{ap.trainer}</td>
                        <td>{ap.type}</td>
                        <td>
                          <span className={`member-badge-status ${ap.status}`}>
                            {ap.status === 'confirmed' ? 'Xác nhận' : ap.status === 'pending' ? 'Chờ duyệt' : 'Đã hủy'}
                          </span>
                        </td>
                        <td>
                          {ap.status !== 'cancelled' ? (
                            <button className="member-action-cancel" onClick={() => handleCancelAppointment(ap.id)}>Hủy</button>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Đã đóng</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'workout':
        return (
          <div className="member-workout-details">
            <div className="member-progress-wrapper">
              <div className="member-progress-label-row">
                <span className="member-progress-title">Tiến độ buổi tập hôm nay</span>
                <span className="member-progress-pct">{workoutProgressPct}%</span>
              </div>
              <div className="member-progress-bg">
                <div className="member-progress-fill" style={{ width: `${workoutProgressPct}%` }}></div>
              </div>
            </div>

            <div className="member-workout-meta">
              <span className="member-workout-meta-badge">Mục tiêu: {profileData?.memberInfo?.fitness_goal || 'Giảm cân'}</span>
              <span className="member-workout-meta-badge">Cấp độ: {profileData?.memberInfo?.fitness_level || 'Người mới bắt đầu'}</span>
            </div>

            <div className="member-workout-days">
              {dbWorkoutPlans.length > 0 ? (
                dbWorkoutPlans.map((plan) => (
                  <div className="member-workout-day-card" key={plan.workout_plan_id} style={{ marginBottom: '24px' }}>
                    <h4 className="member-workout-day-title">
                      <i className="fa-solid fa-dumbbell"></i> {plan.title.toUpperCase()}
                    </h4>
                    {plan.description && (
                      <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '6px 0 16px 28px' }}>
                        {plan.description}
                      </p>
                    )}
                    <div className="member-workout-ex-list">
                      {plan.WorkoutExercises && plan.WorkoutExercises.length > 0 ? (
                        plan.WorkoutExercises.map((ex, idx) => {
                          const key = `db-${plan.workout_plan_id}-${idx}`;
                          return (
                            <div className={`member-workout-ex-item ${completedExercises[key] ? 'completed' : ''}`} key={idx}>
                              <div className="member-workout-ex-left">
                                <input 
                                  type="checkbox" 
                                  className="member-workout-ex-checkbox"
                                  checked={!!completedExercises[key]}
                                  onChange={() => toggleExercise(key)}
                                />
                                <div>
                                  <div className="member-workout-ex-name">{ex.exercise_name}</div>
                                  <div className="member-workout-ex-specs">
                                    {ex.sets} hiệp x {ex.reps} lần {ex.duration_minutes ? `| ${ex.duration_minutes} phút` : ''} {ex.calories_burned ? `| Đốt ${ex.calories_burned} kcal` : ''}
                                  </div>
                                </div>
                              </div>
                              <i className={`fa-solid ${completedExercises[key] ? 'fa-circle-check' : 'fa-circle'}`} style={{ color: completedExercises[key] ? '#22c55e' : '#cbd5e1' }}></i>
                            </div>
                          );
                        })
                      ) : (
                        <div className="member-no-data" style={{ padding: '20px' }}>Chưa có bài tập chi tiết cho giáo án này</div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="member-workout-day-card">
                  <h4 className="member-workout-day-title">
                    <i className="fa-solid fa-calendar-day"></i> CHƯƠNG TRÌNH TẬP HÔM NAY (CARDIO & TOÀN THÂN - MẪU)
                  </h4>
                  <div className="member-workout-ex-list">
                    {[
                      { id: 1, name: 'Chạy bộ khởi động trên máy (Treadmill)', specs: '5-10 phút | Tốc độ nhẹ nhàng' },
                      { id: 2, name: 'Squat (Gánh đùi không tạ)', specs: '4 hiệp x 15 lần | Nghỉ 60s giữa hiệp' },
                      { id: 3, name: 'Incline Push-up (Hít đất chống cao)', specs: '3 hiệp x 12 lần | Nghỉ 45s' },
                      { id: 4, name: 'Dumbbell Row (Kéo tạ đôi tập lưng)', specs: '3 hiệp x 12 lần | Tạ 4-6kg mỗi bên' },
                      { id: 5, name: 'Plank giữ cơ bụng cơ bản', specs: '3 hiệp x 45 giây | Nghỉ 60s' }
                    ].map((ex) => (
                      <div className={`member-workout-ex-item ${completedExercises[ex.id] ? 'completed' : ''}`} key={ex.id}>
                        <div className="member-workout-ex-left">
                          <input 
                            type="checkbox" 
                            className="member-workout-ex-checkbox"
                            checked={!!completedExercises[ex.id]}
                            onChange={() => toggleExercise(ex.id)}
                          />
                          <div>
                            <div className="member-workout-ex-name">{ex.name}</div>
                            <div className="member-workout-ex-specs">{ex.specs}</div>
                          </div>
                        </div>
                        <i className={`fa-solid ${completedExercises[ex.id] ? 'fa-circle-check' : 'fa-circle'}`} style={{ color: completedExercises[ex.id] ? '#22c55e' : '#cbd5e1' }}></i>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'meal':
        return (
          <div className="member-meal-layout">
            <div className="member-meal-items-stack">
              <div className="member-progress-wrapper">
                <div className="member-progress-label-row">
                  <span className="member-progress-title">Năng lượng nạp vào hôm nay</span>
                  <span className="member-progress-pct">{eatenKcal} / {targetKcal} kcal</span>
                </div>
                <div className="member-progress-bg">
                  <div className="member-progress-fill" style={{ width: `${Math.min((eatenKcal / targetKcal) * 100, 100)}%` }}></div>
                </div>
              </div>

              {dbMealPlans.length > 0 ? (
                dbMealPlans.map((plan) => (
                  <div className="member-meal-plan-card completed" key={plan.meal_plan_id} style={{ borderLeft: '4px solid #10b981' }}>
                    <div className="member-meal-plan-body" style={{ paddingLeft: '8px' }}>
                      <div className="member-meal-plan-header">
                        <span className="member-meal-plan-title" style={{ color: '#10b981', fontWeight: 'bold' }}>{plan.title}</span>
                        <span className="member-meal-plan-kcal" style={{ background: '#d1fae5', color: '#065f46', padding: '3px 8px', borderRadius: '12px', fontSize: '0.78rem' }}>{plan.calories_per_day || 2000} kcal</span>
                      </div>
                      <div className="member-meal-plan-desc" style={{ marginTop: '8px', fontSize: '0.85rem', color: '#475569' }}>{plan.description}</div>
                      <div className="member-meal-plan-nutrients" style={{ marginTop: '10px', fontSize: '0.78rem', color: '#94a3b8', display: 'flex', gap: '12px' }}>
                        <span>HLV phân công: {plan.trainer?.user?.full_name || 'Hệ thống'}</span>
                        <span>Ngày giao: {plan.created_at ? new Date(plan.created_at).toLocaleDateString('vi-VN') : 'Mới'}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                mealsData.map((meal) => (
                  <div className={`member-meal-plan-card ${completedMeals[meal.key] ? 'completed' : ''}`} key={meal.key}>
                    <input 
                      type="checkbox" 
                      className="member-meal-plan-checkbox"
                      checked={!!completedMeals[meal.key]}
                      onChange={() => toggleMeal(meal.key)}
                    />
                    <div className="member-meal-plan-body">
                      <div className="member-meal-plan-header">
                        <span className="member-meal-plan-title">{meal.name}</span>
                        <span className="member-meal-plan-kcal">{meal.kcal} kcal</span>
                      </div>
                      <div className="member-meal-plan-desc">{meal.desc}</div>
                      <div className="member-meal-plan-nutrients">
                        <span>Carbs: {meal.carbs}</span>
                        <span>Protein: {meal.protein}</span>
                        <span>Fat: {meal.fat}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="member-calorie-ring-box">
              <div className="member-calorie-counter">
                <span className="member-calorie-counter-fill">{eatenKcal}</span>
                <span className="member-calorie-counter-lbl">Kcal Đã Nạp</span>
              </div>
              <div className="member-calorie-target-info">
                Mục tiêu dinh dưỡng ngày hôm nay: <span>{targetKcal} kcal</span>.
                {eatenKcal >= targetKcal ? (
                  <p style={{ color: '#22c55e', fontWeight: 'bold', marginTop: '10px' }}>🎉 Đã đạt mục tiêu calo ngày!</p>
                ) : (
                  <p style={{ marginTop: '10px' }}>Cần nạp thêm <span>{targetKcal - eatenKcal} kcal</span> nữa.</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'tiendo':
        {
          const bmiVal = Number(profileData?.memberInfo?.bmi || 22.4);
          let bmiPct = 50;
          if (bmiVal < 18.5) {
            bmiPct = (bmiVal / 18.5) * 25;
          } else if (bmiVal >= 18.5 && bmiVal < 25) {
            bmiPct = 25 + ((bmiVal - 18.5) / 6.5) * 35;
          } else if (bmiVal >= 25 && bmiVal < 30) {
            bmiPct = 60 + ((bmiVal - 25) / 5) * 20;
          } else {
            bmiPct = 80 + Math.min(((bmiVal - 30) / 10) * 20, 20);
          }

          let bmiFeedback = 'Cân nặng bình thường';
          let bmiFeedbackColor = '#10b981';
          if (bmiVal < 18.5) {
            bmiFeedback = 'Hơi gầy - Cần bổ sung dinh dưỡng';
            bmiFeedbackColor = '#3b82f6';
          } else if (bmiVal >= 25 && bmiVal < 30) {
            bmiFeedback = 'Thừa cân - Nên duy trì thâm hụt calo nhẹ';
            bmiFeedbackColor = '#f59e0b';
          } else if (bmiVal >= 30) {
            bmiFeedback = 'Béo phì - Cần kiểm soát ăn uống & nâng tập';
            bmiFeedbackColor = '#ef4444';
          }

          const maxW = Math.max(...weightHistory.map(w => w.weight), 100);

          return (
            <div className="member-progress-layout">
              <div>
                <div className="member-card-panel" style={{ marginBottom: '24px' }}>
                  <h3 className="member-card-title">Chỉ số BMI của bạn</h3>
                  <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <span style={{ fontSize: '3rem', fontWeight: 900, color: bmiFeedbackColor }}>{bmiVal}</span>
                    <div style={{ fontWeight: 700, color: bmiFeedbackColor, marginTop: '4px' }}>{bmiFeedback}</div>
                  </div>

                  <div className="member-bmi-indicator-bar">
                    <div className="member-bmi-pointer" style={{ left: `${bmiPct}%` }}></div>
                  </div>
                  <div className="member-bmi-labels">
                    <span>Gầy (&lt;18.5)</span>
                    <span>Bình thường (18.5-25)</span>
                    <span>Béo phì (&gt;30)</span>
                  </div>
                </div>

                <div className="member-card-panel">
                  <h3 className="member-card-title" style={{ marginBottom: '16px' }}>Cập nhật cân nặng mới</h3>
                  <form onSubmit={handleAddWeightHistory} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="member-form-group">
                      <label className="member-form-label">Cân nặng (kg)</label>
                      <input 
                        type="number" 
                        className="member-form-input" 
                        step="0.1" 
                        placeholder="Nhập số cân nặng" 
                        value={newHistoryWeight}
                        onChange={(e) => setNewHistoryWeight(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="member-form-group">
                      <label className="member-form-label">Ngày ghi nhận</label>
                      <input 
                        type="date" 
                        className="member-form-input" 
                        value={newHistoryDate}
                        onChange={(e) => setNewHistoryDate(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="member-btn-submit" style={{ width: '100%' }}>Lưu số đo mới</button>
                  </form>
                </div>
              </div>

              <div>
                <div className="member-card-panel">
                  <h3 className="member-card-title">Lịch sử cân nặng</h3>
                  <div className="member-bar-chart">
                    {weightHistory.map((h, idx) => {
                      const barHeight = Math.round((h.weight / maxW) * 120);
                      return (
                        <div className="member-chart-column" key={idx}>
                          <div className="member-chart-bar-fill" style={{ height: `${barHeight}px` }}>
                            <span className="member-chart-bar-lbl">{h.weight}</span>
                          </div>
                          <span className="member-chart-x-label">{h.date}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="member-progress-history-list">
                    {[...weightHistory].reverse().map((h, idx) => (
                      <div className="member-history-item" key={idx}>
                        <span className="member-history-date">{h.date}</span>
                        <span className="member-history-val">{h.weight} kg</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        }

      case 'thongbao':
        return (
          <div className="member-card-panel">
            <div className="member-card-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
              <h3 className="member-card-title">Thông báo của bạn</h3>
              {unreadNotifsCount > 0 && (
                <span className="member-link-action" onClick={markAllNotifsRead}>Đánh dấu tất cả đã đọc</span>
              )}
            </div>
            <div className="member-notif-list" style={{ marginTop: '20px' }}>
              {notifications.map((n) => (
                <div className={`member-notif-item ${n.unread ? 'unread' : ''}`} key={n.id}>
                  <div className="member-notif-icon">
                    <i className={`fa-solid ${n.unread ? 'fa-envelope-open-text' : 'fa-envelope'}`}></i>
                  </div>
                  <div className="member-notif-body">
                    <div className="member-notif-message">{n.message}</div>
                    <div className="member-notif-time">{n.time}</div>
                  </div>
                  <button className="member-notif-btn-clear" onClick={() => clearNotification(n.id)}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="member-no-data" style={{ padding: '40px 20px' }}>Hộp thư thông báo trống</div>
              )}
            </div>
          </div>
        );

      case 'hoso':
        return (
          <div className="member-card-panel">
            <h3 className="member-card-title" style={{ marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>Hồ sơ hội viên</h3>
            
            {profileSuccessMsg && (
              <div className="alert ok" style={{ display: 'flex', marginBottom: '20px' }}>
                <i className="fa-solid fa-circle-check"></i>
                <span>{profileSuccessMsg}</span>
              </div>
            )}
            {profileErrorMsg && (
              <div className="alert err" style={{ display: 'flex', marginBottom: '20px' }}>
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{profileErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="member-form-grid">
                <div className="member-form-group">
                  <label className="member-form-label">Họ và Tên</label>
                  <input 
                    type="text" 
                    className="member-form-input" 
                    value={editFullName} 
                    onChange={(e) => setEditFullName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="member-form-group">
                  <label className="member-form-label">Số điện thoại</label>
                  <input 
                    type="text" 
                    className="member-form-input" 
                    value={editPhone} 
                    onChange={(e) => setEditPhone(e.target.value)} 
                  />
                </div>
                <div className="member-form-group">
                  <label className="member-form-label">Giới tính</label>
                  <select 
                    className="member-form-select" 
                    value={editGender} 
                    onChange={(e) => setEditGender(e.target.value)}
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div className="member-form-group">
                  <label className="member-form-label">Ngày sinh</label>
                  <input 
                    type="date" 
                    className="member-form-input" 
                    value={editDob} 
                    onChange={(e) => setEditDob(e.target.value)} 
                  />
                </div>
                <div className="member-form-group">
                  <label className="member-form-label">Chiều cao (cm)</label>
                  <input 
                    type="number" 
                    className="member-form-input" 
                    placeholder="Ví dụ: 175" 
                    value={editHeight} 
                    onChange={(e) => setEditHeight(e.target.value)} 
                  />
                </div>
                <div className="member-form-group">
                  <label className="member-form-label">Cân nặng (kg)</label>
                  <input 
                    type="number" 
                    className="member-form-input" 
                    placeholder="Ví dụ: 68" 
                    value={editWeight} 
                    onChange={(e) => setEditWeight(e.target.value)} 
                  />
                </div>
                <div className="member-form-group">
                  <label className="member-form-label">Cấp độ thể chất</label>
                  <select 
                    className="member-form-select" 
                    value={editLevel} 
                    onChange={(e) => setEditLevel(e.target.value)}
                  >
                    <option value="Người mới bắt đầu">Người mới bắt đầu (chưa tập bao giờ)</option>
                    <option value="Trung cấp">Trung cấp (đã tập dưới 1 năm)</option>
                    <option value="Nâng cao">Nâng cao (tập trên 1 năm / chuyên nghiệp)</option>
                  </select>
                </div>
                <div className="member-form-group">
                  <label className="member-form-label">Liên hệ khẩn cấp (SĐT)</label>
                  <input 
                    type="text" 
                    className="member-form-input" 
                    placeholder="SĐT người thân khi cần" 
                    value={editEmergency} 
                    onChange={(e) => setEditEmergency(e.target.value)} 
                  />
                </div>
                <div className="member-form-group full-width">
                  <label className="member-form-label">Mục tiêu luyện tập</label>
                  <div className="member-goals-container">
                    {[
                      'Giảm cân', 
                      'Tăng cơ', 
                      'Cải thiện sức bền', 
                      'Linh hoạt & Dẻo dai', 
                      'Sức khỏe tổng thể'
                    ].map((g) => (
                      <span 
                        key={g} 
                        className={`member-goal-tag ${editGoals.includes(g) ? 'selected' : ''}`}
                        onClick={() => toggleEditGoal(g)}
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button type="submit" className="member-btn-submit" disabled={isUpdatingProfile}>
                {isUpdatingProfile ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
              </button>
            </form>

            {/* Change Password Sub-section */}
            <h3 className="member-card-title" style={{ marginTop: '40px', marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <i className="fa-solid fa-lock" style={{ marginRight: '8px', color: 'var(--orange)' }}></i> Thay đổi mật khẩu tài khoản
            </h3>
            {cpwAlert.show && (
              <div className={`alert ${cpwAlert.ok ? 'ok' : 'err'}`} style={{ display: 'flex', marginBottom: '20px' }}>
                <i className={`fa-solid ${cpwAlert.ok ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
                <span>{cpwAlert.msg}</span>
              </div>
            )}
            <form onSubmit={doChangePw} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
              <div className="member-form-group">
                <label className="member-form-label">Mật khẩu cũ</label>
                <input 
                  type="password" 
                  className="member-form-input" 
                  placeholder="Nhập mật khẩu hiện tại" 
                  value={cpwOld} 
                  onChange={(e) => setCpwOld(e.target.value)} 
                  required 
                />
              </div>
              <div className="member-form-group">
                <label className="member-form-label">Mật khẩu mới</label>
                <input 
                  type="password" 
                  className="member-form-input" 
                  placeholder="Tối thiểu 6 ký tự" 
                  value={cpwNew} 
                  onChange={(e) => setCpwNew(e.target.value)} 
                  required 
                />
              </div>
              <div className="member-form-group">
                <label className="member-form-label">Xác nhận mật khẩu mới</label>
                <input 
                  type="password" 
                  className="member-form-input" 
                  placeholder="Nhập lại mật khẩu mới" 
                  value={cpwConf} 
                  onChange={(e) => setCpwConf(e.target.value)} 
                  required 
                />
              </div>
              <button type="submit" className="member-btn-submit">Thay đổi mật khẩu</button>
            </form>
          </div>
        );

      default:
        return <div>Vui lòng chọn tab hợp lệ.</div>;
    }
  };

  return (
    <div className="member-dashboard-container">
      {/* LEFT SIDEBAR */}
      <aside className="member-sidebar">
        <div className="member-sidebar-top">
          {/* Brand Area */}
          <div className="member-logo-area" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/'); window.dispatchEvent(new Event('popstate')); }}>
            <button className="member-logo-back">
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-dumbbell" style={{ color: 'var(--orange)', fontSize: '1.25rem' }}></i>
              <span className="member-logo-text">FX <span style={{ color: 'var(--orange)' }}>FITNESS</span></span>
            </div>
          </div>

          {/* Profile card summary */}
          <div className="member-profile-summary">
            <div className="member-avatar-circle" onClick={() => fileInputRef.current.click()} style={{ cursor: 'pointer' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" />
              ) : (
                userInfo?.fullName ? userInfo.fullName.charAt(0).toUpperCase() : 'M'
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={uploadAvatar} 
            />
            <div className="member-profile-info">
              <div className="member-profile-name" title={userInfo?.fullName}>
                {userInfo?.fullName || 'Hội viên'}
              </div>
              <span className="member-package-badge">
                {profileData?.memberInfo?.planName || 'Gói Năm'}
              </span>
            </div>
          </div>

          {/* Menu Options */}
          <ul className="member-menu-list">
            <li>
              <button 
                className={`member-menu-item ${activeTab === 'tongquan' ? 'active' : ''}`}
                onClick={() => setActiveTab('tongquan')}
              >
                <i className="fa-solid fa-chart-pie"></i> Tổng quan
              </button>
            </li>
            <li>
              <button 
                className={`member-menu-item ${activeTab === 'lichhen' ? 'active' : ''}`}
                onClick={() => setActiveTab('lichhen')}
              >
                <i className="fa-solid fa-calendar-days"></i> Lịch hẹn
              </button>
            </li>
            <li>
              <button 
                className={`member-menu-item ${activeTab === 'workout' ? 'active' : ''}`}
                onClick={() => setActiveTab('workout')}
              >
                <i className="fa-solid fa-dumbbell"></i> Workout Plan
              </button>
            </li>
            <li>
              <button 
                className={`member-menu-item ${activeTab === 'meal' ? 'active' : ''}`}
                onClick={() => setActiveTab('meal')}
              >
                <i className="fa-solid fa-bowl-food"></i> Meal Plan
              </button>
            </li>
            <li>
              <button 
                className={`member-menu-item ${activeTab === 'tiendo' ? 'active' : ''}`}
                onClick={() => setActiveTab('tiendo')}
              >
                <i className="fa-solid fa-person-running"></i> Tiến độ
              </button>
            </li>
            <li>
              <button 
                className={`member-menu-item ${activeTab === 'thongbao' ? 'active' : ''}`}
                onClick={() => setActiveTab('thongbao')}
              >
                <i className="fa-solid fa-bell"></i> Thông báo
              </button>
            </li>
            <li>
              <button 
                className={`member-menu-item ${activeTab === 'hoso' ? 'active' : ''}`}
                onClick={() => setActiveTab('hoso')}
              >
                <i className="fa-solid fa-user-gear"></i> Hồ sơ
              </button>
            </li>
          </ul>
        </div>

        {/* Logout bottom */}
        <div className="member-logout-area">
          <button className="member-btn-logout" onClick={logout}>
            <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
          </button>
        </div>
      </aside>

      {/* RIGHT CONTENT PANEL */}
      <main className="member-content-area">
        {/* Header row */}
        <header className="member-header">
          <div>
            <h2 className="member-welcome-title">Xin chào, {userInfo?.fullName || 'Hội viên'}</h2>
            <p className="member-date-subtitle">{getCurrentDateString()}</p>
          </div>

          {/* Notification icon */}
          <button className="member-bell-btn" onClick={() => setActiveTab('thongbao')}>
            <i className="fa-regular fa-bell"></i>
            {unreadNotifsCount > 0 && (
              <span className="member-bell-badge">{unreadNotifsCount}</span>
            )}
          </button>
        </header>

        {/* Render Tab Contents */}
        {renderTabContent()}
      </main>
    </div>
  );
}

export default MemberDashboard;
