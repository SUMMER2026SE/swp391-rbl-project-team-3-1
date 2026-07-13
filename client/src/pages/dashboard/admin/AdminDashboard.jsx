import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

function AdminDashboard({ token, userInfo, logout }) {
  // Navigation State
  const [activeTab, setActiveTab] = useState('tongquan');

  // Selected chart year
  const [selectedYear, setSelectedYear] = useState('2025');

  // --- Live API Sync States ---
  const [stats, setStats] = useState({
    totalMembers: 1248,
    totalRevenue: 48500000,
    activeTrainers: 8,
    appointmentsToday: 34
  });

  const [usersList, setUsersList] = useState([]);
  const [trainersList, setTrainersList] = useState([]);
  const [packagesList, setPackagesList] = useState([]);
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [complaintsList, setComplaintsList] = useState([]);
  const [coreSports, setCoreSports] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);

  const isAppointmentPast = (ap) => {
    if (!ap) return false;
    if (ap.endDateTime) {
      return new Date(ap.endDateTime) < new Date();
    }
    let dateStr = ap.workingDate;
    let timeStr = ap.endTime || '00:00';

    if (!dateStr && ap.date && ap.date !== 'N/A') {
      const parts = ap.date.split('/');
      if (parts.length === 3) {
        dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    
    if (!ap.endTime && ap.time) {
      const matches = ap.time.match(/(\d{2}):(\d{2})/g);
      if (matches && matches.length >= 2) {
        timeStr = matches[1];
      } else if (matches && matches.length === 1) {
        timeStr = matches[0];
      }
    }

    if (dateStr) {
      return new Date(`${dateStr}T${timeStr}`) < new Date();
    }
    return false;
  };

  const renderAppointmentStatus = (ap) => {
    const isPast = isAppointmentPast(ap);
    const statusLower = (ap.status || '').toLowerCase();
    if (isPast && (statusLower === 'scheduled' || statusLower === 'confirmed')) {
      return <span className="admin-complaint-status-badge resolved">Đã hoàn thành</span>;
    }
    if (statusLower === 'scheduled') {
      return <span className="admin-complaint-status-badge pending">Đã lên lịch</span>;
    }
    if (statusLower === 'rejected') {
      return <span className="admin-complaint-status-badge rejected">Bị từ chối</span>;
    }
    return <span className="admin-complaint-status-badge cancelled">Đã hủy</span>;
  };

  const upcomingAppointments = appointmentsList
    .filter(ap => {
      const statusLower = (ap.status || '').toLowerCase();
      return !isAppointmentPast(ap) && statusLower !== 'cancelled' && statusLower !== 'rejected';
    })
    .sort((a, b) => {
      const timeA = a.startDateTime ? new Date(a.startDateTime).getTime() : 0;
      const timeB = b.startDateTime ? new Date(b.startDateTime).getTime() : 0;
      return timeA - timeB;
    });

  const historyAppointments = appointmentsList
    .filter(ap => {
      const statusLower = (ap.status || '').toLowerCase();
      return isAppointmentPast(ap) || statusLower === 'cancelled' || statusLower === 'rejected';
    })
    .sort((a, b) => {
      const timeA = a.startDateTime ? new Date(a.startDateTime).getTime() : 0;
      const timeB = b.startDateTime ? new Date(b.startDateTime).getTime() : 0;
      return timeB - timeA;
    });

  // --- UI State ---
  const [toastMessage, setToastMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Add PT Modal State
  const [showAddPT, setShowAddPT] = useState(false);
  const [newPtName, setNewPtName] = useState('');
  const [newPtEmail, setNewPtEmail] = useState('');
  const [newPtSpecialty, setNewPtSpecialty] = useState('');
  const [newPtExpYears, setNewPtExpYears] = useState(1);
  const [newPtBio, setNewPtBio] = useState('');
  const [createdPTDetails, setCreatedPTDetails] = useState(null);

  // Edit Package Modal State
  const [showEditPackage, setShowEditPackage] = useState(null);
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [editPkgTitle, setEditPkgTitle] = useState('');
  const [editPkgPrice, setEditPkgPrice] = useState(0);
  const [editPkgMonths, setEditPkgMonths] = useState(1);
  const [editPkgFeatures, setEditPkgFeatures] = useState('');
  const [editPkgSportType, setEditPkgSportType] = useState('Gym');

  // Toast notification helper
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Fetch all admin tables from backend
  const reloadAllAdminData = () => {
    if (!token) return;

    fetch('/api/dashboard/admin/stats', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (data) setStats(data); })
      .catch(err => console.error('Error fetching admin stats:', err));

    fetch('/api/dashboard/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (data && data.users) setUsersList(data.users); })
      .catch(err => console.error('Error fetching admin users:', err));

    fetch('/api/dashboard/admin/trainers', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (data && data.trainers) setTrainersList(data.trainers); })
      .catch(err => console.error('Error fetching trainers:', err));

    fetch('/api/dashboard/admin/plans', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (data && data.plans) setPackagesList(data.plans); })
      .catch(err => console.error('Error fetching plans:', err));

    fetch('/api/dashboard/admin/appointments', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (data && data.appointments) setAppointmentsList(data.appointments); })
      .catch(err => console.error('Error fetching appointments:', err));

    fetch('/api/dashboard/admin/services', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (data && data.services) setServicesList(data.services); })
      .catch(err => console.error('Error fetching services:', err));

    fetch('/api/dashboard/admin/complaints', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (data && data.complaints) setComplaintsList(data.complaints); })
      .catch(err => console.error('Error fetching complaints:', err));

    fetch('/api/checkout/homepage-config')
      .then(res => res.json())
      .then(data => { if (data && data.coreSports) setCoreSports(data.coreSports); })
      .catch(err => console.error('Error fetching homepage config:', err));

    fetch('/api/dashboard/admin/analytics', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (data) setAnalyticsData(data); })
      .catch(err => console.error('Error fetching admin analytics:', err));
  };

  useEffect(() => {
    reloadAllAdminData();
  }, [token, activeTab]);

  // Actions connecting to SQL Server Backend
  const toggleUserStatus = (userId) => {
    fetch(`/api/dashboard/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        showToast(data.message || 'Cập nhật trạng thái thành công!');
        reloadAllAdminData();
      })
      .catch(err => console.error('Error toggling status:', err));
  };

  const handleCreatePT = (e) => {
    e.preventDefault();
    if (!newPtName || !newPtEmail) return;

    fetch('/api/dashboard/admin/trainers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: newPtName,
        email: newPtEmail,
        specialty: newPtSpecialty,
        expYears: newPtExpYears,
        bio: newPtBio
      })
    })
      .then(res => {
        if (!res.ok) return res.json().then(d => { throw new Error(d.message); });
        return res.json();
      })
      .then(data => {
        setCreatedPTDetails({
          name: newPtName,
          email: newPtEmail,
          password: data.temporaryPassword,
          emailSent: data.emailSent
        });
        setNewPtName('');
        setNewPtEmail('');
        setNewPtSpecialty('');
        setNewPtExpYears(1);
        setNewPtBio('');
      })
      .catch(err => {
        showToast(err.message || 'Lỗi khi tạo mới tài khoản PT!');
      });
  };

  const handleSavePackage = (e) => {
    e.preventDefault();
    if (showAddPackage) {
      fetch(`/api/dashboard/admin/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editPkgTitle,
          price: editPkgPrice,
          durationMonths: editPkgMonths,
          features: editPkgFeatures,
          sportType: editPkgSportType
        })
      })
        .then(res => res.json())
        .then(data => {
          showToast(data.message || 'Tạo gói tập thành công!');
          setShowAddPackage(false);
          reloadAllAdminData();
        })
        .catch(err => console.error('Error creating package:', err));
    } else {
      fetch(`/api/dashboard/admin/plans/${showEditPackage}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editPkgTitle,
          price: editPkgPrice,
          durationMonths: editPkgMonths,
          features: editPkgFeatures,
          sportType: editPkgSportType
        })
      })
        .then(res => res.json())
        .then(data => {
          showToast(data.message || 'Cập nhật gói tập thành công!');
          setShowEditPackage(null);
          reloadAllAdminData();
        })
        .catch(err => console.error('Error saving package:', err));
    }
  };

  const togglePackageStatus = (pkgId, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    fetch(`/api/dashboard/admin/plans/${pkgId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: nextStatus })
    })
      .then(res => res.json())
      .then(data => {
        showToast(`Đã ${nextStatus === 'Active' ? 'mở khóa' : 'khóa'} gói tập thành công!`);
        reloadAllAdminData();
      })
      .catch(err => console.error('Error toggling package status:', err));
  };

  const cancelAppointment = (appointmentId) => {
    fetch(`/api/dashboard/admin/appointments/${appointmentId}/cancel`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        showToast(data.message || 'Hủy lịch hẹn thành công!');
        reloadAllAdminData();
      })
      .catch(err => console.error('Error cancelling appointment:', err));
  };

  const toggleServiceStatus = (serviceId) => {
    fetch(`/api/dashboard/admin/services/${serviceId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        showToast(data.message || 'Cập nhật dịch vụ thành công!');
        reloadAllAdminData();
      })
      .catch(err => console.error('Error toggling service:', err));
  };

  const resolveComplaint = (complaintId, actionType = 'Resolved') => {
    fetch(`/api/dashboard/admin/complaints/${complaintId}/resolve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: actionType })
    })
      .then(res => res.json())
      .then(data => {
        showToast(data.message || 'Cập nhật khiếu nại thành công!');
        reloadAllAdminData();
      })
      .catch(err => console.error('Error resolving complaint:', err));
  };

  const openEditPkgModal = (pkg) => {
    setShowEditPackage(pkg.id);
    setShowAddPackage(false);
    setEditPkgTitle(pkg.title);
    setEditPkgPrice(pkg.price);
    setEditPkgMonths(pkg.durationMonths);
    setEditPkgFeatures(pkg.features);
    setEditPkgSportType(pkg.sportType || 'Gym');
  };

  const openAddPkgModal = () => {
    setShowAddPackage(true);
    setShowEditPackage(null);
    setEditPkgTitle('');
    setEditPkgPrice(0);
    setEditPkgMonths(1);
    setEditPkgFeatures('');
    setEditPkgSportType('Gym');
  };

  const saveHomepageSport = (index, name, description, file) => {
    const formData = new FormData();
    const updatedSports = [...coreSports];
    updatedSports[index].name = name;
    updatedSports[index].description = description;

    formData.append('coreSports', JSON.stringify(updatedSports));
    formData.append('updateIndex', index);
    if (file) {
      formData.append('image', file);
    }

    fetch(`/api/dashboard/admin/homepage-config`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        showToast(data.message || 'Cập nhật trang chủ thành công!');
        reloadAllAdminData();
      })
      .catch(err => console.error('Error saving homepage config:', err));
  };

  // Formatting date string Vietnamese
  const getCurrentDateString = () => {
    const d = new Date();
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return `${days[d.getDay()]}, Ngày ${d.getDate()} Tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
  };

  // Filtered users for main table
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Chart data for 2025 & 2024
  const chartData = {
    '2025': [
      { month: 'T1', val: 25 }, { month: 'T2', val: 28 }, { month: 'T3', val: 32 }, 
      { month: 'T4', val: 30 }, { month: 'T5', val: 35 }, { month: 'T6', val: 40 }, 
      { month: 'T7', val: 38 }, { month: 'T8', val: 42 }, { month: 'T9', val: 48 }, 
      { month: 'T10', val: 45 }, { month: 'T11', val: 52 }, { month: 'T12', val: 68 }
    ],
    '2024': [
      { month: 'T1', val: 18 }, { month: 'T2', val: 20 }, { month: 'T3', val: 22 }, 
      { month: 'T4', val: 25 }, { month: 'T5', val: 28 }, { month: 'T6', val: 30 }, 
      { month: 'T7', val: 29 }, { month: 'T8', val: 32 }, { month: 'T9', val: 35 }, 
      { month: 'T10', val: 38 }, { month: 'T11', val: 40 }, { month: 'T12', val: 45 }
    ]
  };

  // Render tab contents
  const renderTabContent = () => {
    switch (activeTab) {
      case 'tongquan':
        return (
          <>
            {/* Stat Cards Row */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card orange">
                <div className="admin-stat-label">Tổng học viên</div>
                <div className="admin-stat-value">{stats.totalMembers?.toLocaleString('vi-VN')}</div>
                <div className="admin-stat-subtext">
                  <span className="trend-up">+12%</span> so với tháng trước
                </div>
                <div className="admin-stat-icon-wrap">
                  <i className="fa-solid fa-users"></i>
                </div>
              </div>

              <div className="admin-stat-card green">
                <div className="admin-stat-label">Doanh thu tháng</div>
                <div className="admin-stat-value">{stats.totalRevenue?.toLocaleString('vi-VN')}đ</div>
                <div className="admin-stat-subtext">
                  <span className="trend-up">+8%</span> chỉ tiêu đề ra
                </div>
                <div className="admin-stat-icon-wrap">
                  <i className="fa-solid fa-wallet"></i>
                </div>
              </div>

              <div className="admin-stat-card purple">
                <div className="admin-stat-label">PT đang hoạt động</div>
                <div className="admin-stat-value">{stats.activeTrainers?.toLocaleString('vi-VN')}</div>
                <div className="admin-stat-subtext">
                  <span className="trend-neutral">Ổn định</span> nhân lực
                </div>
                <div className="admin-stat-icon-wrap">
                  <i className="fa-solid fa-person-running"></i>
                </div>
              </div>

              <div className="admin-stat-card rose">
                <div className="admin-stat-label">Lịch hẹn hôm nay</div>
                <div className="admin-stat-value">{stats.appointmentsToday?.toLocaleString('vi-VN')}</div>
                <div className="admin-stat-subtext">
                  <span className="trend-alert">3 slot trống</span> phòng hướng dẫn
                </div>
                <div className="admin-stat-icon-wrap">
                  <i className="fa-solid fa-calendar-check"></i>
                </div>
              </div>
            </div>

            {/* Middle Grid: Revenue chart and Campaign card */}
            <div className="admin-overview-grid">
              <div className="admin-card-panel">
                <div className="admin-card-header">
                  <div>
                    <h3 className="admin-card-title">Doanh thu bán gói tập</h3>
                    <p className="admin-card-desc">Thống kê doanh số theo đơn vị Triệu VNĐ</p>
                  </div>
                  <div className="admin-toggle-years">
                    <button 
                      className={`admin-toggle-btn ${selectedYear === '2024' ? 'active' : ''}`}
                      onClick={() => setSelectedYear('2024')}
                    >
                      2024
                    </button>
                    <button 
                      className={`admin-toggle-btn ${selectedYear === '2025' ? 'active' : ''}`}
                      onClick={() => setSelectedYear('2025')}
                    >
                      2025
                    </button>
                  </div>
                </div>

                {/* CSS Bar Chart */}
                <div className="admin-chart-wrapper">
                  <div className="admin-chart-bars">
                    {chartData[selectedYear].map((item, idx) => {
                      const pct = Math.round((item.val / 70) * 100);
                      return (
                        <div key={idx} className="admin-chart-col">
                          <div 
                            className={`admin-chart-bar ${idx === 11 ? 'active' : ''}`} 
                            style={{ height: `${pct}%` }}
                            data-value={`${item.val}M`}
                          ></div>
                          <span className="admin-chart-label">{item.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <div className="admin-campaign-card">
                  <div className="admin-campaign-header">
                    <span className="admin-campaign-tag">Chiến dịch mới</span>
                    <h3 className="admin-campaign-title">THÁNG VÀNG ƯU ĐÃI</h3>
                    <p className="admin-campaign-desc">
                      Chiến dịch tập trung đẩy mạnh phân khúc gói **Premium Platinum** mang lại hiệu suất chuyển đổi tăng vọt 15% trong tuần đầu kích hoạt.
                    </p>
                  </div>
                  <button className="admin-campaign-btn" onClick={() => setActiveTab('baocao')}>
                    Xem báo cáo <i className="fa-solid fa-arrow-right-long"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Preview: Quick Users List */}
            <div className="admin-card-panel">
              <div className="admin-card-header">
                <h3 className="admin-card-title">Xem nhanh tài khoản người dùng</h3>
                <span className="admin-link-action" onClick={() => setActiveTab('nguoidung')}>Xem tất cả</span>
              </div>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Người dùng</th>
                      <th>Email</th>
                      <th>Vai trò</th>
                      <th>Ngày gia nhập</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.slice(0, 4).map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="admin-table-user-cell">
                            <div className={`admin-table-avatar ${user.role === 'TRAINER' ? 'trainer' : user.role === 'GUEST' ? 'guest' : ''}`}>
                              {user.name.charAt(0)}
                            </div>
                            <span className="admin-table-name">{user.name}</span>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`admin-role-badge-cell ${user.role.toLowerCase()}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>{user.joinDate}</td>
                        <td>
                          {user.status !== '—' ? (
                            <span className={`admin-status-dot-wrap ${user.status.toLowerCase()}`}>
                              <span className={`admin-status-dot ${user.status.toLowerCase()}`}></span>
                              {user.status}
                            </span>
                          ) : '—'}
                        </td>
                        <td>
                          {user.role !== 'GUEST' ? (
                            <button 
                              className={`admin-action-link ${user.status === 'Inactive' ? 'unlock' : ''}`}
                              onClick={() => toggleUserStatus(user.id)}
                            >
                              {user.status === 'Inactive' ? 'Mở khóa' : 'Khóa'}
                            </button>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );

      case 'nguoidung':
        return (
          <div className="admin-card-panel">
            <h3 className="admin-card-title" style={{ marginBottom: '20px' }}>Quản lý người dùng hệ thống</h3>
            
            {/* Filtering toolbar */}
            <div className="admin-table-filters">
              <div className="admin-table-filters-left">
                <div className="admin-filter-search">
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <input 
                    type="text" 
                    className="admin-filter-search-input" 
                    placeholder="Tìm kiếm người dùng, email..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select 
                  className="admin-filter-select"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="ALL">Tất cả vai trò</option>
                  <option value="MEMBER">Hội viên (Member)</option>
                  <option value="TRAINER">Huấn luyện viên (PT)</option>
                  <option value="GUEST">Khách vãng lai (Guest)</option>
                </select>
              </div>

              <button className="admin-btn-add" onClick={() => setShowAddPT(true)}>
                <i className="fa-solid fa-plus"></i> Thêm PT Mới
              </button>
            </div>

            {/* Main Users Table */}
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Ngày gia nhập</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="admin-table-user-cell">
                          <div className={`admin-table-avatar ${user.role === 'TRAINER' ? 'trainer' : user.role === 'GUEST' ? 'guest' : ''}`}>
                            {user.name.charAt(0)}
                          </div>
                          <span className={`admin-table-name ${user.nameColor === 'red' ? 'inactive' : ''}`}>{user.name}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`admin-role-badge-cell ${user.role.toLowerCase()}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>{user.joinDate}</td>
                      <td>
                        {user.status !== '—' ? (
                          <span className={`admin-status-dot-wrap ${user.status.toLowerCase()}`}>
                            <span className={`admin-status-dot ${user.status.toLowerCase()}`}></span>
                            {user.status}
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        {user.role !== 'GUEST' ? (
                          <button 
                            className={`admin-action-link ${user.status === 'Inactive' ? 'unlock' : ''}`}
                            onClick={() => toggleUserStatus(user.id)}
                          >
                            {user.status === 'Inactive' ? 'Mở khóa' : 'Khóa'}
                          </button>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        Không tìm thấy người dùng phù hợp với bộ lọc
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="admin-table-footer">
              <span className="admin-table-info-text">
                Hiển thị {filteredUsers.length} trên {usersList.length} người dùng
              </span>
              <div className="admin-pagination">
                <button className="admin-page-btn"><i className="fa-solid fa-chevron-left"></i></button>
                <button className="admin-page-btn active">1</button>
                <button className="admin-page-btn">2</button>
                <button className="admin-page-btn">3</button>
                <button className="admin-page-btn"><i className="fa-solid fa-chevron-right"></i></button>
              </div>
            </div>
          </div>
        );

      case 'hlv':
        return (
          <div className="admin-card-panel">
            <h3 className="admin-card-title" style={{ marginBottom: '20px' }}>Danh sách Huấn Luyện Viên (PT)</h3>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Huấn luyện viên</th>
                    <th>Chuyên môn</th>
                    <th>Kinh nghiệm</th>
                    <th>Số học viên</th>
                    <th>Đánh giá</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {trainersList.map((pt) => (
                    <tr key={pt.id}>
                      <td>
                        <div className="admin-table-user-cell">
                          <div className="admin-table-avatar trainer">
                            {pt.name.charAt(0)}
                          </div>
                          <div>
                            <span className="admin-table-name">{pt.name}</span>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{pt.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--orange)' }}>{pt.specialty}</td>
                      <td>{pt.expYears} năm</td>
                      <td>{pt.activeMembers} học viên</td>
                      <td style={{ color: '#f59e0b' }}>
                        ★ {pt.rating}
                      </td>
                      <td>
                        <button className="admin-action-link unlock" onClick={() => {
                          alert(`Đang tải chi tiết hồ sơ & lịch dạy của HLV ${pt.name}...`);
                        }}>
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'goitap':
        return (
          <div className="admin-card-panel">
            <div className="admin-card-header">
              <h3 className="admin-card-title">Quản lý gói tập thành viên</h3>
              <button className="admin-btn-add" onClick={openAddPkgModal}>
                <i className="fa-solid fa-plus"></i> Tạo Gói Tập
              </button>
            </div>
            
            <div className="admin-packages-grid">
              {packagesList.map((pkg) => (
                <div key={pkg.id} className="admin-package-card">
                  <div>
                    <h4 className="admin-package-title">{pkg.title}</h4>
                    <div className="admin-package-price">
                      {pkg.price.toLocaleString('vi-VN')}đ <span>/{pkg.durationMonths} tháng</span>
                    </div>
                    
                    <div style={{ marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                      <div className="admin-package-detail-row">
                        <span>Số buổi PT kèm riêng:</span>
                        <span className="admin-package-detail-val">{pkg.ptSessions} buổi</span>
                      </div>
                      <div className="admin-package-detail-row" style={{ flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
                        <span>Đặc quyền nổi bật:</span>
                        <span style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>{pkg.features}</span>
                      </div>
                    </div>
                  </div>

                  <div className="admin-package-actions">
                    <button className="admin-package-btn-edit" onClick={() => openEditPkgModal(pkg)}>
                      <i className="fa-regular fa-pen-to-square"></i> Chỉnh sửa
                    </button>
                    <button 
                      className={`admin-package-btn-edit ${pkg.status === 'Active' ? 'delete' : 'active'}`} 
                      style={{marginLeft: '10px', backgroundColor: pkg.status === 'Active' ? '#fecdd3' : '#d1fae5', color: pkg.status === 'Active' ? '#e11d48' : '#059669', borderColor: 'transparent'}}
                      onClick={() => togglePackageStatus(pkg.id, pkg.status)}
                    >
                      <i className={`fa-solid ${pkg.status === 'Active' ? 'fa-lock' : 'fa-lock-open'}`}></i> {pkg.status === 'Active' ? 'Khóa' : 'Mở khóa'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'lichhen':
        return (
          <>
            <div className="admin-card-panel" style={{ marginBottom: '30px' }}>
              <h3 className="admin-card-title" style={{ marginBottom: '20px' }}>Lịch hẹn sắp tới toàn hệ thống</h3>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Học viên</th>
                      <th>Huấn luyện viên (PT)</th>
                      <th>Nội dung tập</th>
                      <th>Khung giờ</th>
                      <th>Ngày hẹn</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingAppointments.map((app) => (
                      <tr key={app.id}>
                        <td className="admin-table-name">{app.memberName}</td>
                        <td>{app.ptName}</td>
                        <td>{app.type}</td>
                        <td>{app.time}</td>
                        <td>{app.date}</td>
                        <td>
                          {renderAppointmentStatus(app)}
                        </td>
                        <td>
                          {app.status === 'Scheduled' && (
                            <button className="admin-action-link" onClick={() => cancelAppointment(app.id)}>
                              Hủy hẹn
                            </button>
                          )}
                          {app.status !== 'Scheduled' && <span>—</span>}
                        </td>
                      </tr>
                    ))}
                    {upcomingAppointments.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                          Không có lịch hẹn sắp tới nào trên toàn hệ thống
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="admin-card-panel">
              <h3 className="admin-card-title" style={{ marginBottom: '20px' }}>Lịch sử lịch hẹn toàn hệ thống</h3>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Học viên</th>
                      <th>Huấn luyện viên (PT)</th>
                      <th>Nội dung tập</th>
                      <th>Khung giờ</th>
                      <th>Ngày hẹn</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyAppointments.map((app) => (
                      <tr key={app.id}>
                        <td className="admin-table-name">{app.memberName}</td>
                        <td>{app.ptName}</td>
                        <td>{app.type}</td>
                        <td>{app.time}</td>
                        <td>{app.date}</td>
                        <td>
                          {renderAppointmentStatus(app)}
                        </td>
                        <td>
                          <span>—</span>
                        </td>
                      </tr>
                    ))}
                    {historyAppointments.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                          Chưa có lịch sử lịch hẹn nào trên toàn hệ thống
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );

      case 'dichvu':
        return (
          <div className="admin-card-panel">
            <h3 className="admin-card-title" style={{ marginBottom: '20px' }}>Dịch vụ & Tiện ích đi kèm FxFitness</h3>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tên dịch vụ</th>
                    <th>Mô tả tiện ích</th>
                    <th>Trạng thái hoạt động</th>
                    <th>Thao tác điều khiển</th>
                  </tr>
                </thead>
                <tbody>
                  {servicesList.map((srv) => (
                    <tr key={srv.id}>
                      <td className="admin-table-name">{srv.title}</td>
                      <td>{srv.description}</td>
                      <td>
                        <span className={`admin-status-dot-wrap ${srv.active ? 'active' : 'inactive'}`}>
                          <span className={`admin-status-dot ${srv.active ? 'active' : 'inactive'}`}></span>
                          {srv.active ? 'Đang hoạt động' : 'Tạm ngưng cung cấp'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className={`admin-action-link ${srv.active ? '' : 'unlock'}`} 
                          onClick={() => toggleServiceStatus(srv.id)}
                        >
                          {srv.active ? 'Tạm dừng' : 'Kích hoạt'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'khieunai':
        return (
          <div className="admin-card-panel">
            <h3 className="admin-card-title" style={{ marginBottom: '24px' }}>Báo cáo phản hồi & Khiếu nại từ Hội viên</h3>
            
            <div className="admin-complaint-list">
              {complaintsList.map((c) => (
                <div key={c.id} className="admin-complaint-card">
                  <div className="admin-complaint-main">
                    <div className="admin-complaint-user">Hội viên: {c.memberName}</div>
                    <div className="admin-complaint-date">Ngày báo cáo: {c.date}</div>
                    <div className="admin-complaint-text">"{c.content}"</div>
                  </div>
                  <div className="admin-complaint-actions">
                    <span className={`admin-complaint-status-badge ${c.status === 'Pending' ? 'pending' : c.status === 'Resolved' ? 'resolved' : 'cancelled'}`}>
                      {c.status === 'Pending' ? 'Đang chờ xử lý' : c.status === 'Resolved' ? 'Đã giải quyết xong' : 'Đã hủy bỏ'}
                    </span>
                    {c.status === 'Pending' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="admin-btn-submit" 
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          onClick={() => resolveComplaint(c.id, 'Resolved')}
                        >
                          Giải Quyết
                        </button>
                        <button 
                          className="admin-btn-cancel" 
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          onClick={() => resolveComplaint(c.id, 'Cancelled')}
                        >
                          Bỏ Qua
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'baocao':
        const rev = analyticsData?.revenue || { total: 48500000, membership: 35000000, service: 13500000 };
        const pkgs = analyticsData?.packages || [];
        const srvs = analyticsData?.services || [];
        const tns = analyticsData?.trainers || [];

        // Calculate split percentages
        const membershipPct = rev.total > 0 ? Math.round((rev.membership / rev.total) * 100) : 0;
        const servicePct = rev.total > 0 ? Math.round((rev.service / rev.total) * 100) : 0;

        return (
          <div className="admin-analytics-container">
            {/* Header Description */}
            <div className="admin-card-panel analytics-header-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <h3 className="admin-card-title">Báo cáo hiệu quả kinh doanh</h3>
                  <p className="admin-card-desc">Dữ liệu doanh thu thực tế từ cổng thanh toán PayOS và thống kê hoạt động hệ thống.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="admin-btn-submit" onClick={() => alert('Đang xuất toàn bộ dữ liệu báo cáo phân tích ra file Excel...')}>
                    <i className="fa-solid fa-file-excel" style={{ marginRight: '8px' }}></i> Xuất Báo Cáo Tổng Hợp
                  </button>
                </div>
              </div>
            </div>

            {/* Financial Overview Row */}
            <div className="admin-stats-grid analytics-stats-grid">
              <div className="admin-stat-card orange">
                <div className="admin-stat-label">Tổng doanh thu hệ thống</div>
                <div className="admin-stat-value">{rev.total?.toLocaleString('vi-VN')} đ</div>
                <div className="admin-stat-subtext">
                  Tổng tiền thực thu từ giao dịch <span style={{ fontWeight: 'bold' }}>Thành công</span>
                </div>
                <div className="admin-stat-icon-wrap">
                  <i className="fa-solid fa-sack-dollar"></i>
                </div>
              </div>

              <div className="admin-stat-card green">
                <div className="admin-stat-label">Doanh thu Gói tập thành viên</div>
                <div className="admin-stat-value">{rev.membership?.toLocaleString('vi-VN')} đ</div>
                <div className="admin-stat-subtext">
                  Chiếm <span style={{ fontWeight: 'bold' }}>{membershipPct}%</span> tổng cơ cấu doanh số
                </div>
                <div className="admin-stat-icon-wrap">
                  <i className="fa-solid fa-id-card"></i>
                </div>
              </div>

              <div className="admin-stat-card purple">
                <div className="admin-stat-label">Doanh thu Dịch vụ & Tiện ích</div>
                <div className="admin-stat-value">{rev.service?.toLocaleString('vi-VN')} đ</div>
                <div className="admin-stat-subtext">
                  Chiếm <span style={{ fontWeight: 'bold' }}>{servicePct}%</span> tổng cơ cấu doanh số
                </div>
                <div className="admin-stat-icon-wrap">
                  <i className="fa-solid fa-bell-concierge"></i>
                </div>
              </div>
            </div>

            {/* Revenue Split Chart */}
            <div className="admin-card-panel split-chart-panel">
              <h4 className="analytics-section-title">Cơ cấu nguồn doanh thu</h4>
              <div className="split-progress-wrapper">
                <div className="split-progress-bar">
                  <div className="split-bar-membership" style={{ width: `${membershipPct}%` }}></div>
                  <div className="split-bar-service" style={{ width: `${servicePct}%` }}></div>
                </div>
                <div className="split-legends">
                  <div className="split-legend-item">
                    <span className="legend-dot membership"></span>
                    <span className="legend-label">Gói tập hội viên:</span>
                    <span className="legend-value">{rev.membership?.toLocaleString('vi-VN')}đ ({membershipPct}%)</span>
                  </div>
                  <div className="split-legend-item">
                    <span className="legend-dot service"></span>
                    <span className="legend-label">Dịch vụ bổ sung:</span>
                    <span className="legend-value">{rev.service?.toLocaleString('vi-VN')}đ ({servicePct}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Two-Column Analytics Layout */}
            <div className="analytics-details-grid">
              {/* Left Column: Popular Packages and Services */}
              <div className="analytics-left-col">
                {/* Popular Packages Card */}
                <div className="admin-card-panel analytics-table-panel">
                  <h4 className="analytics-section-title"><i className="fa-solid fa-tags" style={{ color: 'var(--orange)', marginRight: '8px' }}></i> Gói tập bán chạy nhất</h4>
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Tên gói tập</th>
                          <th style={{ textAlign: 'right' }}>Đơn giá</th>
                          <th style={{ textAlign: 'center' }}>Số lượt mua</th>
                          <th style={{ textAlign: 'right' }}>Doanh số</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pkgs.map((pkg, idx) => (
                          <tr key={pkg.id}>
                            <td className="admin-table-name">
                              <span className="analytics-table-index">{idx + 1}</span> {pkg.name}
                            </td>
                            <td style={{ textAlign: 'right' }}>{pkg.price?.toLocaleString('vi-VN')}đ</td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{pkg.count}</td>
                            <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>{pkg.totalRevenue?.toLocaleString('vi-VN')}đ</td>
                          </tr>
                        ))}
                        {pkgs.length === 0 && (
                          <tr>
                            <td colSpan="4" style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>Chưa có dữ liệu giao dịch gói tập.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Popular Services Card */}
                <div className="admin-card-panel analytics-table-panel" style={{ marginTop: '30px' }}>
                  <h4 className="analytics-section-title"><i className="fa-solid fa-gem" style={{ color: '#10b981', marginRight: '8px' }}></i> Dịch vụ đi kèm bán chạy nhất</h4>
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Tên dịch vụ</th>
                          <th style={{ textAlign: 'right' }}>Đơn giá</th>
                          <th style={{ textAlign: 'center' }}>Số lượt mua</th>
                          <th style={{ textAlign: 'right' }}>Doanh số</th>
                        </tr>
                      </thead>
                      <tbody>
                        {srvs.map((srv, idx) => (
                          <tr key={srv.id}>
                            <td className="admin-table-name">
                              <span className="analytics-table-index service-idx">{idx + 1}</span> {srv.name}
                            </td>
                            <td style={{ textAlign: 'right' }}>{srv.price?.toLocaleString('vi-VN')}đ</td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{srv.count}</td>
                            <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>{srv.totalRevenue?.toLocaleString('vi-VN')}đ</td>
                          </tr>
                        ))}
                        {srvs.length === 0 && (
                          <tr>
                            <td colSpan="4" style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>Chưa có dữ liệu giao dịch dịch vụ.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column: Trainers Leaderboard */}
              <div className="analytics-right-col">
                <div className="admin-card-panel trainer-leaderboard-panel">
                  <h4 className="analytics-section-title"><i className="fa-solid fa-crown" style={{ color: '#f59e0b', marginRight: '8px' }}></i> Xếp hạng HLV (PT) được thuê nhiều nhất</h4>
                  <p className="admin-card-desc" style={{ marginBottom: '20px' }}>Xếp hạng dựa trên tổng số lượng học viên trực thuộc lộ trình luyện tập.</p>

                  <div className="leaderboard-list">
                    {tns.map((trainer, idx) => {
                      let medalClass = "";
                      let medalIcon = null;
                      if (idx === 0) {
                        medalClass = "gold";
                        medalIcon = <i className="fa-solid fa-medal gold-medal"></i>;
                      } else if (idx === 1) {
                        medalClass = "silver";
                        medalIcon = <i className="fa-solid fa-medal silver-medal"></i>;
                      } else if (idx === 2) {
                        medalClass = "bronze";
                        medalIcon = <i className="fa-solid fa-medal bronze-medal"></i>;
                      }

                      return (
                        <div key={trainer.id} className={`leaderboard-item ${medalClass}`}>
                          <div className="leaderboard-left">
                            <div className="leaderboard-position">
                              {medalIcon || <span className="leaderboard-num">{idx + 1}</span>}
                            </div>
                            <div className="leaderboard-avatar-circle">
                              {trainer.name?.charAt(0)}
                            </div>
                            <div className="leaderboard-info">
                              <span className="leaderboard-name">{trainer.name}</span>
                              <span className="leaderboard-specialty">{trainer.specialty} • Kinh nghiệm: {trainer.experienceYears} năm</span>
                            </div>
                          </div>
                          <div className="leaderboard-right">
                            <div className="leaderboard-stat">
                              <span className="stat-num">{trainer.hiredCount}</span>
                              <span className="stat-label">Học viên</span>
                            </div>
                            <div className="leaderboard-divider"></div>
                            <div className="leaderboard-stat">
                              <span className="stat-num">{trainer.sessionCount}</span>
                              <span className="stat-label">Buổi dạy</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {tns.length === 0 && (
                      <div style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                        Chưa ghi nhận hoạt động HLV.
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick actions panel */}
                <div className="admin-card-panel" style={{ marginTop: '30px', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                  <h4 className="analytics-section-title" style={{ fontSize: '0.95rem', marginBottom: '8px' }}>Chỉ số sức khỏe hệ thống</h4>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                    Tỷ lệ hài lòng của học viên đối với chất lượng HLV đạt <strong>★ {tns.length > 0 ? (tns.reduce((acc, t) => acc + Number(t.rating), 0) / tns.length).toFixed(1) : "5.0"} / 5.0</strong>. Số lượng phản hồi chưa giải quyết: <strong>{complaintsList.filter(c => c.status === 'Pending').length} khiếu nại</strong>.
                  </p>
                  <button className="admin-btn-submit" style={{ width: '100%', backgroundColor: '#0f172a' }} onClick={() => setActiveTab('khieunai')}>
                    Xử lý khiếu nại ngay
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'trangchu':
        return (
          <div className="admin-card-panel">
            <h3 className="admin-card-title" style={{ marginBottom: '20px' }}>Cấu hình nội dung Trang Chủ</h3>
            <p className="admin-card-desc" style={{ marginBottom: '30px' }}>Thay đổi các thẻ dịch vụ cốt lõi hiển thị ở trang chủ (Gym, Yoga, Boxing).</p>

            <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr', gap: '30px' }}>
              {coreSports.map((sport, index) => (
                <div key={index} className="admin-card-panel" style={{ backgroundColor: '#f8fafc', position: 'relative' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--orange)' }}>Thẻ #{index + 1}: {sport.name}</h4>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '300px' }}>
                      <div className="admin-form-group">
                        <label className="admin-form-label">Tên Bộ Môn</label>
                        <input 
                          type="text" 
                          className="admin-form-input" 
                          defaultValue={sport.name} 
                          id={`sportName-${index}`}
                        />
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-form-label">Mô tả ngắn</label>
                        <textarea 
                          className="admin-form-input" 
                          rows="3" 
                          defaultValue={sport.description}
                          id={`sportDesc-${index}`}
                        ></textarea>
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-form-label">Tải ảnh nền mới (Bỏ trống nếu giữ nguyên)</label>
                        <input 
                          type="file" 
                          className="admin-form-input" 
                          accept="image/*"
                          id={`sportImg-${index}`}
                        />
                      </div>
                      <button 
                        className="admin-btn-submit" 
                        onClick={() => {
                          const name = document.getElementById(`sportName-${index}`).value;
                          const desc = document.getElementById(`sportDesc-${index}`).value;
                          const fileInput = document.getElementById(`sportImg-${index}`);
                          saveHomepageSport(index, name, desc, fileInput.files[0]);
                        }}
                      >
                        Lưu Thay Đổi Thẻ Này
                      </button>
                    </div>
                    <div style={{ width: '250px' }}>
                      <label className="admin-form-label">Ảnh hiện tại:</label>
                      <div style={{ width: '100%', height: '200px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#e2e8f0', backgroundImage: `url(${sport.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return <div>Vui lòng chọn tab hợp lệ.</div>;
    }
  };

  return (
    <div className="admin-dashboard-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#1e293b',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
            zIndex: 9999,
            fontWeight: '600',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderLeft: '4px solid var(--orange)'
          }}
        >
          <i className="fa-solid fa-circle-check" style={{ color: 'var(--orange)' }}></i>
          {toastMessage}
        </div>
      )}

      {/* LEFT SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          {/* Brand Logo */}
          <div className="admin-logo-area" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/'); window.dispatchEvent(new Event('popstate')); }}>
            <button className="admin-logo-back">
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-dumbbell" style={{ color: 'var(--orange)', fontSize: '1.25rem' }}></i>
              <span className="admin-logo-text">FX <span style={{ color: 'var(--orange)' }}>FITNESS</span></span>
            </div>
          </div>

          {/* Admin Avatar & Role Info */}
          <div className="admin-profile-summary">
            <div className="admin-avatar-circle">AD</div>
            <div className="admin-profile-info">
              <div className="admin-profile-name" title={userInfo?.fullName || 'Admin FxFitness'}>
                {userInfo?.fullName || 'Admin FxFitness'}
              </div>
              <span className="admin-role-badge">
                Quản trị viên
              </span>
            </div>
          </div>

          {/* Sidebar Menu Items */}
          <ul className="admin-menu-list">
            <li>
              <button 
                className={`admin-menu-item ${activeTab === 'tongquan' ? 'active' : ''}`}
                onClick={() => setActiveTab('tongquan')}
              >
                <i className="fa-solid fa-chart-pie"></i> Tổng quan
              </button>
            </li>
            <li>
              <button 
                className={`admin-menu-item ${activeTab === 'nguoidung' ? 'active' : ''}`}
                onClick={() => setActiveTab('nguoidung')}
              >
                <i className="fa-solid fa-user-group"></i> Người dùng
              </button>
            </li>
            <li>
              <button 
                className={`admin-menu-item ${activeTab === 'hlv' ? 'active' : ''}`}
                onClick={() => setActiveTab('hlv')}
              >
                <i className="fa-solid fa-person-running"></i> Huấn luyện viên
              </button>
            </li>
            <li>
              <button 
                className={`admin-menu-item ${activeTab === 'trangchu' ? 'active' : ''}`}
                onClick={() => setActiveTab('trangchu')}
              >
                <i className="fa-solid fa-house"></i> Trang Chủ
              </button>
            </li>
            <li>
              <button 
                className={`admin-menu-item ${activeTab === 'goitap' ? 'active' : ''}`}
                onClick={() => setActiveTab('goitap')}
              >
                <i className="fa-solid fa-tags"></i> Gói tập
              </button>
            </li>
            <li>
              <button 
                className={`admin-menu-item ${activeTab === 'lichhen' ? 'active' : ''}`}
                onClick={() => setActiveTab('lichhen')}
              >
                <i className="fa-solid fa-calendar-check"></i> Lịch hẹn
              </button>
            </li>
            <li>
              <button 
                className={`admin-menu-item ${activeTab === 'dichvu' ? 'active' : ''}`}
                onClick={() => setActiveTab('dichvu')}
              >
                <i className="fa-solid fa-gem"></i> Dịch vụ
              </button>
            </li>
            <li>
              <button 
                className={`admin-menu-item ${activeTab === 'khieunai' ? 'active' : ''}`}
                onClick={() => setActiveTab('khieunai')}
              >
                <i className="fa-solid fa-circle-exclamation"></i> Khiếu nại
              </button>
            </li>
            <li>
              <button 
                className={`admin-menu-item ${activeTab === 'baocao' ? 'active' : ''}`}
                onClick={() => setActiveTab('baocao')}
              >
                <i className="fa-solid fa-chart-simple"></i> Báo cáo
              </button>
            </li>
          </ul>
        </div>

        {/* Logout bottom */}
        <div className="admin-logout-area">
          <button className="admin-btn-logout" onClick={logout}>
            <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT PANEL */}
      <main className="admin-content-area">
        {/* Header bar */}
        <header className="admin-header">
          <div>
            <h2 className="admin-welcome-title">Quản Trị Hệ Thống</h2>
            <p className="admin-date-subtitle">{getCurrentDateString()}</p>
          </div>

          <div className="admin-header-right">
            <div className="admin-search-wrap">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input type="text" className="admin-search-input" placeholder="Tìm kiếm nhanh..." />
            </div>

            <button className="admin-icon-btn" onClick={() => { setActiveTab('khieunai'); alert('Chuyển hướng đến danh sách báo cáo khiếu nại...'); }}>
              <i className="fa-regular fa-bell"></i>
            </button>

            <button className="admin-icon-btn" onClick={() => alert('Chức năng cài đặt chung đang được phát triển...')}>
              <i className="fa-solid fa-gear"></i>
            </button>

            <div className="admin-top-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e2e8f0', fontWeight: 'bold', color: '#475569' }}>
              AD
            </div>
          </div>
        </header>

        {/* Render Tab Contents */}
        {renderTabContent()}
      </main>

      {/* MODAL 1: ADD NEW PT */}
      {showAddPT && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box">
            <h3 className="admin-modal-title">Thêm mới Huấn Luyện Viên (PT)</h3>
            <form onSubmit={handleCreatePT}>
              <div className="admin-form-group">
                <label className="admin-form-label">Họ và Tên</label>
                <input 
                  type="text" 
                  className="admin-form-input" 
                  placeholder="Nhập họ và tên PT"
                  value={newPtName}
                  onChange={(e) => setNewPtName(e.target.value)}
                  required 
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Email tài khoản</label>
                <input 
                  type="email" 
                  className="admin-form-input" 
                  placeholder="nhap.email@fx.com"
                  value={newPtEmail}
                  onChange={(e) => setNewPtEmail(e.target.value)}
                  required 
                />
              </div>

              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label className="admin-form-label">Chuyên môn chính</label>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    placeholder="Bodybuilding, Yoga, Cardio..."
                    value={newPtSpecialty}
                    onChange={(e) => setNewPtSpecialty(e.target.value)}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Số năm kinh nghiệm</label>
                  <input 
                    type="number" 
                    className="admin-form-input" 
                    min="1"
                    value={newPtExpYears}
                    onChange={(e) => setNewPtExpYears(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Giới thiệu ngắn (Bio)</label>
                <textarea 
                  className="admin-form-textarea" 
                  placeholder="Kinh nghiệm, bằng cấp và triết lý..."
                  value={newPtBio}
                  onChange={(e) => setNewPtBio(e.target.value)}
                />
              </div>

              <div className="admin-form-actions">
                <button type="button" className="admin-btn-cancel" onClick={() => setShowAddPT(false)}>
                  Hủy Bỏ
                </button>
                <button type="submit" className="admin-btn-submit">
                  Tạo Tài Khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL FOR PT CREATION */}
      {createdPTDetails && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box" style={{ maxWidth: '450px', textAlign: 'center' }}>
            <div style={{ color: '#10b981', fontSize: '3.5rem', marginBottom: '16px' }}>
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <h3 className="admin-modal-title" style={{ border: 'none', padding: 0, marginBottom: '8px' }}>Tạo Tài Khoản PT Thành Công!</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>
              Tài khoản huấn luyện viên đã được khởi tạo thành công trên hệ thống.
            </p>
            
            <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'left', marginBottom: '24px' }}>
              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Họ tên PT</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#1e293b', marginTop: '2px' }}>{createdPTDetails.name}</div>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Email đăng nhập</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#1e293b', marginTop: '2px' }}>{createdPTDetails.email}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Mật khẩu tạm thời</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '1.25rem', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--orange)', letterSpacing: '1px' }}>
                    {createdPTDetails.password}
                  </span>
                  <button 
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdPTDetails.password);
                      showToast('Đã sao chép mật khẩu!');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <i className="fa-regular fa-copy"></i> Sao chép
                  </button>
                </div>
              </div>
            </div>
            
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 24px 0', lineHeight: '1.4' }}>
              {createdPTDetails.emailSent 
                ? '✓ Mật khẩu này đã được gửi đến email thực của PT.' 
                : '⚠ Không gửi được email (chưa cấu hình hoặc lỗi SMTP). Mật khẩu chỉ hiển thị một lần ở đây.'}
            </p>

            <button 
              type="button"
              className="admin-btn-submit" 
              style={{ width: '100%', padding: '12px' }}
              onClick={() => {
                setCreatedPTDetails(null);
                setShowAddPT(false);
                reloadAllAdminData();
              }}
            >
              Hoàn Tất
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Package Modal */}
      {(showEditPackage !== null || showAddPackage) && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box">
            <button type="button" className="admin-modal-close" onClick={() => {setShowEditPackage(null); setShowAddPackage(false);}}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            <h3 className="admin-modal-title">{showAddPackage ? 'Tạo Gói Tập Mới' : 'Cập nhật gói tập'}</h3>
            <form onSubmit={handleSavePackage}>
              <div className="admin-form-group">
                <label className="admin-form-label">Tên gói tập</label>
                <input 
                  type="text" 
                  className="admin-form-input" 
                  value={editPkgTitle}
                  onChange={(e) => setEditPkgTitle(e.target.value)}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Bộ môn (Sport Type)</label>
                <input 
                  type="text" 
                  className="admin-form-input" 
                  value={editPkgSportType}
                  onChange={(e) => setEditPkgSportType(e.target.value)}
                  required
                  placeholder="VD: Gym, Yoga, Boxing"
                />
              </div>
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label className="admin-form-label">Giá (VNĐ)</label>
                  <input 
                    type="number" 
                    className="admin-form-input" 
                    value={editPkgPrice}
                    onChange={(e) => setEditPkgPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Thời hạn (Tháng)</label>
                  <input 
                    type="number" 
                    className="admin-form-input" 
                    value={editPkgMonths}
                    onChange={(e) => setEditPkgMonths(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Mô tả đặc quyền và tính năng</label>
                <textarea 
                  className="admin-form-textarea" 
                  value={editPkgFeatures}
                  onChange={(e) => setEditPkgFeatures(e.target.value)}
                  required 
                />
              </div>

              <div className="admin-form-actions">
                <button type="button" className="admin-btn-cancel" onClick={() => { setShowEditPackage(null); setShowAddPackage(false); }}>
                  Hủy Bỏ
                </button>
                <button type="submit" className="admin-btn-submit">
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
