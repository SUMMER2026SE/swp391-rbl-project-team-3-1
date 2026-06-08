import React, { useState, useEffect } from 'react';
import './TrainerDashboard.css';

function TrainerDashboard({
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

  // --- TRAINER PROFILE STATES ---
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGender, setEditGender] = useState('Nam');
  const [editDob, setEditDob] = useState('');
  const [editSpecialization, setEditSpecialization] = useState('');
  const [editExpYears, setEditExpYears] = useState('');
  const [editExpDesc, setEditExpDesc] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Password change states
  const [cpwOld, setCpwOld] = useState('');
  const [cpwNew, setCpwNew] = useState('');
  const [cpwConf, setCpwConf] = useState('');
  const [cpwAlert, setCpwAlert] = useState({ show: false, msg: '', ok: false });

  // --- PT INTERACTIVE STATES ---
  const [membersList, setMembersList] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);

  // Teaching schedule - default to current day
  const [selectedDay, setSelectedDay] = useState(new Date().getDate().toString().padStart(2, '0'));
  const [scheduleList, setScheduleList] = useState([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(900); // 15 minutes in seconds

  // Booking requests pending PT confirmation
  const [bookingRequests, setBookingRequests] = useState([]);

  // Chat conversations (keep static mockup as fallback, but support member ID mapping)
  const [activeChatMemberId, setActiveChatMemberId] = useState(1);
  const [chatInput, setChatInput] = useState('');
  const [conversations, setConversations] = useState({
    1: [
      { sender: 'receiver', text: 'Chào anh Tuệ, lịch ngày mai em tập lúc 7:30 đúng không ạ?', time: '09:15 AM' },
      { sender: 'sender', text: 'Đúng rồi Vũ ơi. Mai tập trung bài Cardio nhé, ngủ sớm đi nhé!', time: '09:30 AM' },
      { sender: 'receiver', text: 'Dạ vâng anh, mai em qua đúng giờ.', time: '09:32 AM' }
    ],
    2: [
      { sender: 'receiver', text: 'Anh Tuệ ơi, thực đơn cơm gạo lứt thay bằng khoai lang được không anh?', time: 'Hôm qua' },
      { sender: 'sender', text: 'Được chứ Bích, khoai lang luộc lượng tinh bột tương đương nhé.', time: 'Hôm qua' }
    ],
    3: [
      { sender: 'sender', text: 'Nam hôm nay tập rất tốt, ráng duy trì nhé.', time: '2 ngày trước' },
      { sender: 'receiver', text: 'Cảm ơn anh Tuệ nhiều ạ!', time: '2 ngày trước' }
    ]
  });

  // Assign plans builders inputs
  const [customWorkoutName, setCustomWorkoutName] = useState('');
  const [customMealName, setCustomMealName] = useState('');

  // Fetch Trainer dashboard data from backend
  const reloadTrainerDashboardData = () => {
    if (!token) return;

    fetch('/api/dashboard/trainer/members', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.members) {
          setMembersList(data.members);
          if (selectedMember) {
            const updated = data.members.find(m => m.id === selectedMember.id);
            if (updated) setSelectedMember(updated);
          } else if (data.members.length > 0 && !activeChatMemberId) {
            setActiveChatMemberId(data.members[0].id);
          }
        }
      })
      .catch(err => console.error('Error fetching trainer members:', err));

    fetch('/api/dashboard/trainer/appointments', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.appointments) {
          const pending = data.appointments.filter(a => a.status === 'Pending');
          const scheduled = data.appointments.filter(a => a.status === 'Scheduled' || a.status === 'Completed');
          setBookingRequests(pending);
          setScheduleList(scheduled);
        }
      })
      .catch(err => console.error('Error fetching trainer appointments:', err));
  };

  useEffect(() => {
    reloadTrainerDashboardData();
  }, [token]);

  // Synchronize profileData on load
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

      if (profileData.trainerInfo) {
        setEditSpecialization(profileData.trainerInfo.specialization || '');
        setEditExpYears(profileData.trainerInfo.experience_years ? profileData.trainerInfo.experience_years.toString() : '');
        setEditExpDesc(profileData.trainerInfo.experience_description || '');
        setEditBio(profileData.trainerInfo.bio || '');
      }
    }
  }, [profileData]);

  // Session timer countdown effect
  useEffect(() => {
    let interval = null;
    if (isSessionActive && sessionTimer > 0) {
      interval = setInterval(() => {
        setSessionTimer(prev => prev - 1);
      }, 1000);
    } else if (sessionTimer === 0) {
      setIsSessionActive(false);
      alert('Buổi tập đã hoàn thành thành công!');
    }
    return () => clearInterval(interval);
  }, [isSessionActive, sessionTimer]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- ACTIONS & HANDLERS ---
  const handleTrainerProfileUpdate = async (e) => {
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
          specialization: editSpecialization,
          experienceYears: editExpYears ? Number(editExpYears) : null,
          experienceDescription: editExpDesc,
          bio: editBio
        })
      });

      const data = await res.json();
      setIsUpdatingProfile(false);

      if (res.ok) {
        setProfileSuccessMsg('Cập nhật hồ sơ huấn luyện viên thành công!');
        fetchProfile(token);
      } else {
        setProfileErrorMsg(data.message || 'Cập nhật hồ sơ thất bại!');
      }
    } catch (err) {
      setIsUpdatingProfile(false);
      setProfileErrorMsg('Lỗi kết nối máy chủ!');
    }
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

  const handleConfirmAppointment = (reqId) => {
    fetch(`/api/dashboard/trainer/appointments/${reqId}/confirm`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ action: 'confirm' })
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message || 'Đã xác nhận lịch dạy thành công!');
        reloadTrainerDashboardData();
      })
      .catch(err => console.error('Error confirming appointment:', err));
  };

  const handleRejectAppointment = (reqId) => {
    if (window.confirm('Bạn có chắc chắn muốn từ chối yêu cầu đặt lịch này?')) {
      fetch(`/api/dashboard/trainer/appointments/${reqId}/confirm`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'reject' })
      })
        .then(res => res.json())
        .then(data => {
          alert(data.message || 'Đã từ chối lịch dạy!');
          reloadTrainerDashboardData();
        })
        .catch(err => console.error('Error rejecting appointment:', err));
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const newMsg = { sender: 'sender', text: chatInput, time: timeStr };

    setConversations(prev => ({
      ...prev,
      [activeChatMemberId]: [...(prev[activeChatMemberId] || []), newMsg]
    }));

    setChatInput('');

    setTimeout(() => {
      const activeMember = membersList.find(m => m.id === activeChatMemberId);
      const memberName = activeMember ? activeMember.name : 'Học viên';
      const responseTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const responseMsg = {
        sender: 'receiver',
        text: `Dạ vâng HLV, em đã nhận được tin nhắn và sẽ chuẩn bị cho buổi tập tiếp theo.`,
        time: responseTime
      };
      
      setConversations(prev => ({
        ...prev,
        [activeChatMemberId]: [...(prev[activeChatMemberId] || []), responseMsg]
      }));
    }, 1500);
  };

  const handleAssignWorkoutTemplate = (templateName) => {
    if (!selectedMember) {
      alert('Vui lòng chọn học viên trước!');
      return;
    }

    fetch('/api/dashboard/trainer/assign-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        memberId: selectedMember.id,
        type: 'workout',
        name: templateName
      })
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message || `Đã giao giáo án "${templateName}"!`);
        reloadTrainerDashboardData();
      })
      .catch(err => console.error('Error assigning workout:', err));
  };

  const handleAssignMealTemplate = (templateName) => {
    if (!selectedMember) {
      alert('Vui lòng chọn học viên trước!');
      return;
    }

    fetch('/api/dashboard/trainer/assign-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        memberId: selectedMember.id,
        type: 'meal',
        name: templateName
      })
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message || `Đã giao thực đơn "${templateName}"!`);
        reloadTrainerDashboardData();
      })
      .catch(err => console.error('Error assigning meal:', err));
  };

  const handleAssignCustomWorkout = (e) => {
    e.preventDefault();
    if (!customWorkoutName.trim()) return;
    handleAssignWorkoutTemplate(customWorkoutName);
    setCustomWorkoutName('');
  };

  const handleAssignCustomMeal = (e) => {
    e.preventDefault();
    if (!customMealName.trim()) return;
    handleAssignMealTemplate(customMealName);
    setCustomMealName('');
  };

  const handleStartSession = () => {
    setIsSessionActive(true);
    setSessionTimer(900); // 15 mins simulation
    alert('Bắt đầu buổi tập thành công! Đồng hồ đếm ngược đang kích hoạt.');
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

  // Render Tabs
  const renderTabContent = () => {
    switch (activeTab) {
      case 'tongquan':
        return (
          <>
            {/* Stat Cards Row */}
            <div className="trainer-stats-grid">
              <div className="trainer-stat-card">
                <span className="trainer-stat-label">Tổng học viên</span>
                <span className="trainer-stat-value">{membersList.length}</span>
                <div className="trainer-stat-subtext">
                  <span className="trend">+2 tháng này</span> So với tháng trước
                </div>
                <div className="trainer-stat-icon-wrap">
                  <i className="fa-solid fa-users"></i>
                </div>
              </div>
              <div className="trainer-stat-card">
                <span className="trainer-stat-label">Lịch dạy hôm nay</span>
                <span className="trainer-stat-value">
                  {scheduleList.filter(s => s.day === selectedDay).length}
                </span>
                <div className="trainer-stat-subtext">
                  Còn lại {scheduleList.filter(s => s.day === selectedDay).length - (isSessionActive ? 1 : 0)} buổi dạy
                </div>
                <div className="trainer-stat-icon-wrap">
                  <i className="fa-solid fa-calendar-check"></i>
                </div>
              </div>
              <div className="trainer-stat-card">
                <span className="trainer-stat-label">Đánh giá trung bình</span>
                <span className="trainer-stat-value" style={{ color: '#eab308' }}>
                  {profileData?.trainerInfo?.rating || 4.8} <i className="fa-solid fa-star" style={{ fontSize: '1.25rem' }}></i>
                </span>
                <div className="trainer-stat-subtext">
                  Đánh giá từ cơ sở dữ liệu hệ thống
                </div>
                <div className="trainer-stat-icon-wrap">
                  <i className="fa-solid fa-ranking-star"></i>
                </div>
              </div>
            </div>

            {/* Overview Layout Columns */}
            <div className="trainer-overview-grid">
              {/* Left Panel: Members list */}
              <div className="trainer-card-panel">
                <div className="trainer-card-header">
                  <h3 className="trainer-card-title">Danh sách học viên đang quản lý</h3>
                  <span className="trainer-link-action" onClick={() => setActiveTab('hocvien')}>Xem tất cả</span>
                </div>
                <div className="trainer-table-container">
                  <table className="trainer-table">
                    <thead>
                      <tr>
                        <th>STT</th>
                        <th>Tên học viên</th>
                        <th>Gói tập</th>
                        <th>Mục tiêu</th>
                        <th>Buổi còn lại</th>
                        <th>Tiến độ</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {membersList.slice(0, 5).map((m, idx) => (
                        <tr key={m.id}>
                          <td>0{idx + 1}</td>
                          <td className="trainer-table-name">{m.name}</td>
                          <td>{m.planName}</td>
                          <td>
                            <span className={`trainer-table-goal-badge ${m.goal.includes('Giảm') ? 'weight-loss' : m.goal.includes('bền') ? 'strength' : 'flexibility'}`}>
                              {m.goal}
                            </span>
                          </td>
                          <td>{m.remainingSessions} buổi</td>
                          <td>
                            <div className="trainer-table-progress-wrap">
                              <div className="trainer-table-progress-bg">
                                <div className="trainer-table-progress-fill" style={{ width: `${m.progress}%` }}></div>
                              </div>
                              <span className="trainer-table-progress-text">{m.progress}%</span>
                            </div>
                          </td>
                          <td>
                            <button 
                              className="trainer-table-action-btn"
                              title="Kiểm tra chi tiết & Giao bài"
                              onClick={() => { setSelectedMember(m); setActiveTab('hocvien'); }}
                            >
                              <i className="fa-regular fa-eye"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Panel: Teaching Schedule */}
              <div className="trainer-card-panel">
                <div className="trainer-card-header">
                  <h3 className="trainer-card-title">Lịch dạy tuần này</h3>
                  <span className="trainer-link-action" onClick={() => setActiveTab('lichday')}>Xem chi tiết</span>
                </div>
                <div className="trainer-weekly-calendar">
                  <div className="trainer-calendar-days-row">
                    {[
                      { key: '08', lbl: 'T2', num: '08' },
                      { key: '09', lbl: 'T3', num: '09' },
                      { key: '10', lbl: 'T4', num: '10' },
                      { key: '11', lbl: 'T5', num: '11' }
                    ].map(d => (
                      <div 
                        key={d.key} 
                        className={`trainer-calendar-day-header ${selectedDay === d.key ? 'active' : ''}`}
                        onClick={() => setSelectedDay(d.key)}
                      >
                        <div className="trainer-calendar-day-name">{d.lbl}</div>
                        <div className="trainer-calendar-day-num">{d.num}</div>
                      </div>
                    ))}
                  </div>

                  <div className="trainer-schedule-slots-stack">
                    {scheduleList.filter(s => s.day === selectedDay).map((item) => (
                      <div key={item.id} className={`trainer-schedule-card ${item.active ? 'active' : ''}`}>
                        <div>
                          <div className="trainer-schedule-time">{item.time}</div>
                          <div className="trainer-schedule-member">{item.member}</div>
                        </div>
                        <span className="trainer-schedule-type">{item.type}</span>
                      </div>
                    ))}
                    {scheduleList.filter(s => s.day === selectedDay).length === 0 && (
                      <div className="trainer-no-data" style={{ padding: '30px 10px' }}>Trống lịch dạy cho ngày này</div>
                    )}
                    <div className="trainer-btn-add-slot" onClick={() => { setActiveTab('lichday'); alert('Bạn đang được chuyển đến trang đặt lịch dạy...'); }}>
                      <i className="fa-solid fa-plus"></i> Thêm giờ dạy mới
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Orange banner for next session */}
            <div className="trainer-next-session-banner">
              <div className="trainer-banner-left">
                <span className="trainer-banner-tag">Buổi tập tiếp theo</span>
                <h2 className="trainer-banner-title">Sẵn sàng cho buổi tập của Lan Phạm?</h2>
                <p className="trainer-banner-desc">
                  Buổi tập sẽ bắt đầu trong khung giờ 15:00. Mục tiêu tập luyện hôm nay: 
                  Tập trung cải thiện linh hoạt khớp vai, kéo giãn cơ liên sườn và bài tập bổ trợ core nhẹ nhàng.
                </p>
                <div className="trainer-banner-actions">
                  {!isSessionActive ? (
                    <button className="trainer-banner-btn-white" onClick={handleStartSession}>
                      Bắt đầu buổi tập
                    </button>
                  ) : (
                    <button className="trainer-banner-btn-white" style={{ background: '#d1fae5', color: '#065f46' }} disabled>
                      🟢 Buổi tập đang diễn ra
                    </button>
                  )}
                  <button className="trainer-banner-btn-outline" onClick={() => {
                    const lan = membersList.find(m => m.name === 'Phạm Thị Lan');
                    if (lan) {
                      setSelectedMember(lan);
                      setActiveTab('hocvien');
                    }
                  }}>
                    Xem chi tiết bài tập
                  </button>
                </div>
              </div>

              <div className="trainer-banner-right">
                <div className="trainer-banner-right-lbl">Khung giờ</div>
                <div className="trainer-banner-right-val">
                  {isSessionActive ? `⏳ ${formatTimer(sessionTimer)}` : '15:00 - Chiều'}
                </div>
                <div className="trainer-banner-progress-wrap">
                  <div className="trainer-banner-progress-bar">
                    <div 
                      className="trainer-banner-progress-fill" 
                      style={{ width: isSessionActive ? `${Math.round(((900 - sessionTimer)/900) * 100)}%` : '25%' }}
                    ></div>
                  </div>
                  <span className="trainer-banner-progress-lbl">Tiến trình gói tập: 25%</span>
                </div>
              </div>
            </div>
          </>
        );

      case 'hocvien':
        return (
          <div className="trainer-members-layout">
            {!selectedMember ? (
              <div className="trainer-card-panel">
                <h3 className="trainer-card-title" style={{ marginBottom: '20px' }}>Học viên của bạn</h3>
                <div className="trainer-members-grid">
                  {membersList.map((m) => (
                    <div 
                      key={m.id} 
                      className="trainer-member-card"
                      onClick={() => setSelectedMember(m)}
                    >
                      <div className="trainer-member-card-avatar">
                        {m.name.charAt(0)}
                      </div>
                      <div className="trainer-member-card-body">
                        <div className="trainer-member-card-name">{m.name}</div>
                        <div className="trainer-member-card-info">Gói: {m.planName} | Mục tiêu: {m.goal}</div>
                        <div className="trainer-member-card-info" style={{ color: 'var(--orange)', fontWeight: 'bold' }}>Còn lại: {m.remainingSessions} buổi</div>
                      </div>
                      <i className="fa-solid fa-chevron-right" style={{ color: '#cbd5e1' }}></i>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="trainer-detail-inspection">
                {/* Left card: Member detailed profile metrics */}
                <div className="trainer-detail-sidebar">
                  <div className="trainer-card-panel" style={{ textAlign: 'center' }}>
                    <button 
                      className="trainer-link-action" 
                      style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}
                      onClick={() => setSelectedMember(null)}
                    >
                      <i className="fa-solid fa-arrow-left"></i> Quay lại
                    </button>
                    <div className="trainer-member-card-avatar" style={{ width: '80px', height: '80px', margin: '0 auto 16px', fontSize: '2rem' }}>
                      {selectedMember.name.charAt(0)}
                    </div>
                    <h3 className="trainer-member-card-name" style={{ fontSize: '1.25rem' }}>{selectedMember.name}</h3>
                    <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '4px 0 16px' }}>Hội viên đang quản lý</p>
                    
                    <span className="trainer-table-goal-badge" style={{ marginBottom: '20px' }}>
                      Mục tiêu: {selectedMember.goal}
                    </span>

                    <div className="trainer-health-metric-row">
                      <div className="trainer-health-box">
                        <div className="trainer-health-lbl">Cân nặng</div>
                        <div className="trainer-health-val">{selectedMember.weight} kg</div>
                      </div>
                      <div className="trainer-health-box">
                        <div className="trainer-health-lbl">Chiều cao</div>
                        <div className="trainer-health-val">{selectedMember.height} cm</div>
                      </div>
                      <div className="trainer-health-box">
                        <div className="trainer-health-lbl">Chỉ số BMI</div>
                        <div className="trainer-health-val">{selectedMember.bmi}</div>
                      </div>
                    </div>
                  </div>

                  <div className="trainer-card-panel">
                    <h4 className="trainer-card-title" style={{ marginBottom: '14px' }}>Chế độ đang kích hoạt</h4>
                    <div style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'bold' }}>GIÁO ÁN LUYỆN TẬP</div>
                        <div style={{ fontWeight: 'bold', color: 'var(--orange)', marginTop: '2px' }}>{selectedMember.workoutAssigned || 'Chưa phân công'}</div>
                      </div>
                      <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9' }} />
                      <div>
                        <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'bold' }}>THỰC ĐƠN DINH DƯỠNG</div>
                        <div style={{ fontWeight: 'bold', color: '#10b981', marginTop: '2px' }}>{selectedMember.mealAssigned || 'Chưa phân công'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right panel: Assigning Workout and Meal plan */}
                <div className="trainer-detail-main">
                  <div className="trainer-card-panel">
                    <h3 className="trainer-card-title" style={{ marginBottom: '16px' }}>Giao giáo án luyện tập (Workout Plan)</h3>
                    <div style={{ marginBottom: '20px' }}>
                      <label className="trainer-form-label">Chọn giáo án mẫu nhanh</label>
                      <div className="trainer-plan-template-list" style={{ marginTop: '8px' }}>
                        {[
                          { title: 'HIIT Đốt Mỡ Nâng Cao', desc: 'Đốt mỡ cường độ cao cho người thừa cân nhẹ.' },
                          { title: 'Full Body Khởi Đầu', desc: 'Khởi động cơ xương khớp cho người mới bắt đầu.' },
                          { title: 'Powerlifting Cơ Bản', desc: 'Tập trung xây dựng sức mạnh cơ bắp thô.' }
                        ].map((temp, idx) => (
                          <div 
                            key={idx} 
                            className="trainer-template-card"
                            onClick={() => handleAssignWorkoutTemplate(temp.title)}
                          >
                            <div className="trainer-template-card-title">{temp.title}</div>
                            <div className="trainer-template-card-desc">{temp.desc}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <form onSubmit={handleAssignCustomWorkout} style={{ display: 'flex', gap: '12px' }}>
                      <input 
                        type="text" 
                        className="trainer-form-input" 
                        placeholder="Nhập tên giáo án tùy chỉnh mới..." 
                        style={{ flex: 1 }}
                        value={customWorkoutName}
                        onChange={(e) => setCustomWorkoutName(e.target.value)}
                        required 
                      />
                      <button type="submit" className="trainer-btn-submit" style={{ padding: '10px 20px' }}>Giao giáo án</button>
                    </form>
                  </div>

                  <div className="trainer-card-panel">
                    <h3 className="trainer-card-title" style={{ marginBottom: '16px' }}>Thiết lập thực đơn dinh dưỡng (Meal Plan)</h3>
                    <div style={{ marginBottom: '20px' }}>
                      <label className="trainer-form-label">Chọn thực đơn mẫu dinh dưỡng</label>
                      <div className="trainer-plan-template-list" style={{ marginTop: '8px' }}>
                        {[
                          { title: 'Chế độ giảm cân thâm hụt 500kcal', desc: 'Giàu đạm, ít tinh bột nhanh.' },
                          { title: 'Ăn kiêng Low-Carb cơ bản', desc: 'Giảm thiểu tinh bột xấu, tăng chất béo tốt.' },
                          { title: 'Tăng cơ nạc (Lean Bulking)', desc: 'Dư thừa 200kcal, ưu tiên đạm tinh khiết.' }
                        ].map((temp, idx) => (
                          <div 
                            key={idx} 
                            className="trainer-template-card"
                            onClick={() => handleAssignMealTemplate(temp.title)}
                          >
                            <div className="trainer-template-card-title">{temp.title}</div>
                            <div className="trainer-template-card-desc">{temp.desc}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <form onSubmit={handleAssignCustomMeal} style={{ display: 'flex', gap: '12px' }}>
                      <input 
                        type="text" 
                        className="trainer-form-input" 
                        placeholder="Nhập tên thực đơn dinh dưỡng tùy chỉnh..." 
                        style={{ flex: 1 }}
                        value={customMealName}
                        onChange={(e) => setCustomMealName(e.target.value)}
                        required 
                      />
                      <button type="submit" className="trainer-btn-submit" style={{ padding: '10px 20px', backgroundColor: '#10b981' }}>Giao thực đơn</button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'lichday':
        return (
          <div className="trainer-plan-builder">
            {bookingRequests.length > 0 && (
              <div className="trainer-appointment-requests">
                <h3 className="trainer-card-title">Yêu cầu đăng ký lịch dạy chờ duyệt</h3>
                {bookingRequests.map((req) => (
                  <div className="trainer-request-row" key={req.id}>
                    <div className="trainer-request-member-info">
                      <div className="trainer-request-avatar">{req.name.charAt(0)}</div>
                      <div className="trainer-request-text">
                        Học viên <span className="name">{req.name}</span> đăng ký buổi tập lúc <span className="time">{req.time}</span>. <br />
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Ghi chú: "{req.note}"</span>
                      </div>
                    </div>
                    <div className="trainer-request-actions">
                      <button className="trainer-btn-confirm" onClick={() => handleConfirmAppointment(req.id)}>Xác nhận</button>
                      <button className="trainer-btn-reject" onClick={() => handleRejectAppointment(req.id)}>Từ chối</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="trainer-card-panel">
              <h3 className="trainer-card-title" style={{ marginBottom: '20px' }}>Lịch dạy tuần chi tiết</h3>
              <div className="trainer-weekly-calendar">
                <div className="trainer-calendar-days-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', maxWidth: '600px' }}>
                  {[
                    { key: '08', lbl: 'Thứ Hai', num: '08/06' },
                    { key: '09', lbl: 'Thứ Ba', num: '09/06' },
                    { key: '10', lbl: 'Thứ Tư', num: '10/06' },
                    { key: '11', lbl: 'Thứ Năm', num: '11/06' }
                  ].map(d => (
                    <div 
                      key={d.key} 
                      className={`trainer-calendar-day-header ${selectedDay === d.key ? 'active' : ''}`}
                      onClick={() => setSelectedDay(d.key)}
                    >
                      <div className="trainer-calendar-day-name">{d.lbl}</div>
                      <div className="trainer-calendar-day-num">{d.num}</div>
                    </div>
                  ))}
                </div>

                <div className="trainer-table-container" style={{ marginTop: '20px' }}>
                  <table className="trainer-table">
                    <thead>
                      <tr>
                        <th>Khung giờ dạy</th>
                        <th>Học viên đăng ký</th>
                        <th>Hình thức lớp học</th>
                        <th>Trạng thái lớp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheduleList.filter(s => s.day === selectedDay).map((item) => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 'bold', color: 'var(--orange)' }}>{item.time}</td>
                          <td className="trainer-table-name">{item.member}</td>
                          <td>{item.type}</td>
                          <td>
                            <span className="member-badge-status confirmed">Đã lên lịch</span>
                          </td>
                        </tr>
                      ))}
                      {scheduleList.filter(s => s.day === selectedDay).length === 0 && (
                        <tr>
                          <td colSpan="4" className="trainer-no-data" style={{ padding: '40px 10px' }}>Hôm nay không có giờ dạy nào lên lịch sẵn</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'workout':
        return (
          <div className="trainer-card-panel">
            <h3 className="trainer-card-title" style={{ marginBottom: '20px' }}>Kho giáo án luyện tập mẫu (Workout Templates)</h3>
            <div className="trainer-plan-template-list" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {[
                { title: 'HIIT Đốt Mỡ Nâng Cao', desc: 'Đốt mỡ cường độ cao cho người thừa cân nhẹ. Bao gồm 5 bài tập nhảy dây, squats, plank, burpees và chạy nước rút.' },
                { title: 'Full Body Khởi Đầu', desc: 'Khởi động cơ xương khớp cho người mới bắt đầu. Các bài tập không tạ chống mỏi lưng vai gáy và săn đùi.' },
                { title: 'Powerlifting Cơ Bản', desc: 'Tập trung xây dựng sức mạnh cơ bắp thô. Các bài squats, deadlifts nặng, bench press 3x5 reps.' },
                { title: 'Yoga dẻo dai khớp vai', desc: 'Các tư thế vặn xoắn và giãn cơ mở rộng khớp vai giúp cơ bắp linh hoạt và phục hồi đau nhức cơ.' },
                { title: 'Cardio Core trung cấp', desc: 'Các bài tập bụng core, plank đi bộ, leo núi giúp săn chắc múi bụng và tăng sức bền cơ trọng tâm.' }
              ].map((temp, idx) => (
                <div key={idx} className="trainer-template-card" style={{ cursor: 'default' }}>
                  <div className="trainer-template-card-title" style={{ color: 'var(--orange)' }}>{temp.title}</div>
                  <div className="trainer-template-card-desc" style={{ fontSize: '0.84rem', lineHeight: '1.4', marginTop: '6px' }}>{temp.desc}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'meal':
        return (
          <div className="trainer-card-panel">
            <h3 className="trainer-card-title" style={{ marginBottom: '20px' }}>Kho thực đơn dinh dưỡng mẫu (Meal Templates)</h3>
            <div className="trainer-plan-template-list" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {[
                { title: 'Chế độ giảm cân thâm hụt 500kcal', desc: 'Giàu đạm, ít tinh bột nhanh. Sáng ức gà chiên không dầu, trưa cơm gạo lứt cá hồi, tối salad xanh.' },
                { title: 'Ăn kiêng Low-Carb cơ bản', desc: 'Giảm thiểu tinh bột xấu, tăng chất béo tốt. Ưu tiên thịt bò, trứng luộc, quả bơ, rau xanh các bữa chính.' },
                { title: 'Tăng cơ nạc (Lean Bulking)', desc: 'Dư thừa nhẹ 200kcal, ưu tiên đạm tinh khiết cho sự phát triển của thớ cơ. Sử dụng yến mạch, whey protein hỗ trợ.' }
              ].map((temp, idx) => (
                <div key={idx} className="trainer-template-card" style={{ cursor: 'default' }}>
                  <div className="trainer-template-card-title" style={{ color: '#10b981' }}>{temp.title}</div>
                  <div className="trainer-template-card-desc" style={{ fontSize: '0.84rem', lineHeight: '1.4', marginTop: '6px' }}>{temp.desc}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'chat':
        {
          const activeMemberChat = membersList.find(m => m.id === activeChatMemberId);
          const currentConversation = conversations[activeChatMemberId] || [];

          return (
            <div className="trainer-chat-layout">
              {/* Sidebar with associated members */}
              <div className="trainer-chat-sidebar">
                <div className="trainer-chat-sidebar-header">Nhắn tin học viên</div>
                {membersList.map((m) => {
                  const history = conversations[m.id] || [];
                  const lastMsg = history[history.length - 1]?.text || 'Chưa có tin nhắn mới';
                  return (
                    <div 
                      key={m.id} 
                      className={`trainer-chat-user-row ${activeChatMemberId === m.id ? 'active' : ''}`}
                      onClick={() => setActiveChatMemberId(m.id)}
                    >
                      <div className="trainer-chat-user-avatar">{m.name.charAt(0)}</div>
                      <div className="trainer-chat-user-body">
                        <div className="trainer-chat-user-name">{m.name}</div>
                        <div className="trainer-chat-user-lastmsg">{lastMsg}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat bubbles container */}
              <div className="trainer-chat-body">
                <div className="trainer-chat-body-header">
                  <div className="trainer-chat-user-avatar">{activeMemberChat?.name.charAt(0)}</div>
                  <span>Cuộc trò chuyện với {activeMemberChat?.name}</span>
                </div>

                <div className="trainer-chat-bubbles-container">
                  {currentConversation.map((msg, idx) => (
                    <div className={`trainer-chat-bubble ${msg.sender}`} key={idx}>
                      <div>{msg.text}</div>
                      <div className="trainer-chat-bubble-time">{msg.time}</div>
                    </div>
                  ))}
                  {currentConversation.length === 0 && (
                    <div className="trainer-no-data" style={{ margin: 'auto' }}>Hãy mở lời chào học viên mới của bạn!</div>
                  )}
                </div>

                <form className="trainer-chat-input-row" onSubmit={handleSendMessage}>
                  <input 
                    type="text" 
                    className="trainer-chat-input" 
                    placeholder="Nhập tin nhắn nhắn gửi học viên..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    required 
                  />
                  <button type="submit" className="trainer-chat-btn-send">
                    <i className="fa-solid fa-paper-plane"></i>
                  </button>
                </form>
              </div>
            </div>
          );
        }

      case 'hoso':
        return (
          <div className="trainer-card-panel">
            <h3 className="trainer-card-title" style={{ marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>Hồ sơ huấn luyện viên</h3>

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

            <form onSubmit={handleTrainerProfileUpdate} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="trainer-form-grid">
                <div className="trainer-form-group">
                  <label className="trainer-form-label">Họ và Tên</label>
                  <input 
                    type="text" 
                    className="trainer-form-input" 
                    value={editFullName} 
                    onChange={(e) => setEditFullName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="trainer-form-group">
                  <label className="trainer-form-label">Số điện thoại</label>
                  <input 
                    type="text" 
                    className="trainer-form-input" 
                    value={editPhone} 
                    onChange={(e) => setEditPhone(e.target.value)} 
                  />
                </div>
                <div className="trainer-form-group">
                  <label className="trainer-form-label">Giới tính</label>
                  <select 
                    className="trainer-form-select" 
                    value={editGender} 
                    onChange={(e) => setEditGender(e.target.value)}
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div className="trainer-form-group">
                  <label className="trainer-form-label">Ngày sinh</label>
                  <input 
                    type="date" 
                    className="trainer-form-input" 
                    value={editDob} 
                    onChange={(e) => setEditDob(e.target.value)} 
                  />
                </div>
                <div className="trainer-form-group">
                  <label className="trainer-form-label">Chuyên môn (Specialization)</label>
                  <input 
                    type="text" 
                    className="trainer-form-input" 
                    placeholder="Ví dụ: Yoga, Thể lực, Giảm cân nhanh..." 
                    value={editSpecialization} 
                    onChange={(e) => setEditSpecialization(e.target.value)} 
                  />
                </div>
                <div className="trainer-form-group">
                  <label className="trainer-form-label">Số năm kinh nghiệm</label>
                  <input 
                    type="number" 
                    className="trainer-form-input" 
                    placeholder="Số năm tập luyện/dạy" 
                    value={editExpYears} 
                    onChange={(e) => setEditExpYears(e.target.value)} 
                  />
                </div>
                <div className="trainer-form-group full-width">
                  <label className="trainer-form-label">Chi tiết kinh nghiệm giảng dạy</label>
                  <textarea 
                    className="trainer-form-textarea" 
                    placeholder="Mô tả cụ thể về thế mạnh, giải thưởng, quá trình công tác..." 
                    value={editExpDesc} 
                    onChange={(e) => setEditExpDesc(e.target.value)}
                  />
                </div>
                <div className="trainer-form-group full-width">
                  <label className="trainer-form-label">Tiểu sử (Bio)</label>
                  <textarea 
                    className="trainer-form-textarea" 
                    placeholder="Lời nhắn gửi hoặc triết lý rèn luyện thể chất cá nhân..." 
                    value={editBio} 
                    onChange={(e) => setEditBio(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="trainer-btn-submit" disabled={isUpdatingProfile}>
                {isUpdatingProfile ? 'Đang cập nhật...' : 'Cập nhật hồ sơ'}
              </button>
            </form>

            {/* Change Password Section */}
            <h3 className="trainer-card-title" style={{ marginTop: '40px', marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <i className="fa-solid fa-lock" style={{ marginRight: '8px', color: 'var(--orange)' }}></i> Thay đổi mật khẩu tài khoản
            </h3>
            {cpwAlert.show && (
              <div className={`alert ${cpwAlert.ok ? 'ok' : 'err'}`} style={{ display: 'flex', marginBottom: '20px' }}>
                <i className={`fa-solid ${cpwAlert.ok ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
                <span>{cpwAlert.msg}</span>
              </div>
            )}
            <form onSubmit={doChangePw} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
              <div className="trainer-form-group">
                <label className="trainer-form-label">Mật khẩu cũ</label>
                <input 
                  type="password" 
                  className="trainer-form-input" 
                  placeholder="Nhập mật khẩu hiện tại" 
                  value={cpwOld} 
                  onChange={(e) => setCpwOld(e.target.value)} 
                  required 
                />
              </div>
              <div className="trainer-form-group">
                <label className="trainer-form-label">Mật khẩu mới</label>
                <input 
                  type="password" 
                  className="trainer-form-input" 
                  placeholder="Tối thiểu 6 ký tự" 
                  value={cpwNew} 
                  onChange={(e) => setCpwNew(e.target.value)} 
                  required 
                />
              </div>
              <div className="trainer-form-group">
                <label className="trainer-form-label">Xác nhận mật khẩu mới</label>
                <input 
                  type="password" 
                  className="trainer-form-input" 
                  placeholder="Nhập lại mật khẩu mới" 
                  value={cpwConf} 
                  onChange={(e) => setCpwConf(e.target.value)} 
                  required 
                />
              </div>
              <button type="submit" className="trainer-btn-submit">Thay đổi mật khẩu</button>
            </form>
          </div>
        );

      default:
        return <div>Vui lòng chọn tab hợp lệ.</div>;
    }
  };

  return (
    <div className="trainer-dashboard-container">
      {/* LEFT SIDEBAR */}
      <aside className="trainer-sidebar">
        <div className="trainer-sidebar-top">
          {/* Brand Logo */}
          <div className="trainer-logo-area" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/'); window.dispatchEvent(new Event('popstate')); }}>
            <button className="trainer-logo-back">
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-dumbbell" style={{ color: 'var(--orange)', fontSize: '1.25rem' }}></i>
              <span className="trainer-logo-text">FX <span style={{ color: 'var(--orange)' }}>FITNESS</span></span>
            </div>
          </div>

          {/* Trainer summary */}
          <div className="trainer-profile-summary">
            <div className="trainer-avatar-circle" onClick={() => fileInputRef.current.click()} style={{ cursor: 'pointer' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" />
              ) : (
                userInfo?.fullName ? userInfo.fullName.charAt(0).toUpperCase() : 'T'
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={uploadAvatar} 
            />
            <div className="trainer-profile-info">
              <div className="trainer-profile-name" title={userInfo?.fullName}>
                {userInfo?.fullName || 'HLV FxFitness'}
              </div>
              <span className="trainer-role-badge">
                Huấn Luyện Viên
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <ul className="trainer-menu-list">
            <li>
              <button 
                className={`trainer-menu-item ${activeTab === 'tongquan' ? 'active' : ''}`}
                onClick={() => setActiveTab('tongquan')}
              >
                <i className="fa-solid fa-chart-pie"></i> Tổng quan
              </button>
            </li>
            <li>
              <button 
                className={`trainer-menu-item ${activeTab === 'hocvien' ? 'active' : ''}`}
                onClick={() => setActiveTab('hocvien')}
              >
                <i className="fa-solid fa-user-group"></i> Học viên
              </button>
            </li>
            <li>
              <button 
                className={`trainer-menu-item ${activeTab === 'lichday' ? 'active' : ''}`}
                onClick={() => setActiveTab('lichday')}
              >
                <i className="fa-solid fa-calendar-days"></i> Lịch dạy
              </button>
            </li>
            <li>
              <button 
                className={`trainer-menu-item ${activeTab === 'workout' ? 'active' : ''}`}
                onClick={() => setActiveTab('workout')}
              >
                <i className="fa-solid fa-dumbbell"></i> Workout Plans
              </button>
            </li>
            <li>
              <button 
                className={`trainer-menu-item ${activeTab === 'meal' ? 'active' : ''}`}
                onClick={() => setActiveTab('meal')}
              >
                <i className="fa-solid fa-bowl-food"></i> Meal Plans
              </button>
            </li>
            <li>
              <button 
                className={`trainer-menu-item ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                <i className="fa-solid fa-comments"></i> Chat
              </button>
            </li>
            <li>
              <button 
                className={`trainer-menu-item ${activeTab === 'hoso' ? 'active' : ''}`}
                onClick={() => setActiveTab('hoso')}
              >
                <i className="fa-solid fa-user-gear"></i> Hồ sơ
              </button>
            </li>
          </ul>
        </div>

        {/* Logout bottom */}
        <div className="trainer-logout-area">
          <button className="trainer-btn-logout" onClick={logout}>
            <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
          </button>
        </div>
      </aside>

      {/* RIGHT CONTENT PANEL */}
      <main className="trainer-content-area">
        {/* Header row */}
        <header className="trainer-header">
          <div>
            <h2 className="trainer-welcome-title">Dashboard Huấn Luyện Viên</h2>
            <p className="trainer-date-subtitle">{getCurrentDateString()}</p>
          </div>

          <div className="trainer-header-right">
            <div className="trainer-search-wrap">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input type="text" className="trainer-search-input" placeholder="Tìm kiếm..." />
            </div>

            <button className="trainer-icon-btn" onClick={() => { setActiveTab('chat'); alert('Mở tin nhắn học viên...'); }}>
              <i className="fa-regular fa-bell"></i>
            </button>

            <button className="trainer-icon-btn" onClick={() => setActiveTab('hoso')}>
              <i className="fa-solid fa-gear"></i>
            </button>

            <div className="trainer-top-avatar" onClick={() => setActiveTab('hoso')} style={{ cursor: 'pointer' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" />
              ) : (
                <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--orange)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {userInfo?.fullName ? userInfo.fullName.charAt(0).toUpperCase() : 'T'}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Active view */}
        {renderTabContent()}
      </main>
    </div>
  );
}

export default TrainerDashboard;
