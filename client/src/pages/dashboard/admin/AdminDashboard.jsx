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
  const [editPkgTitle, setEditPkgTitle] = useState('');
  const [editPkgPrice, setEditPkgPrice] = useState(0);
  const [editPkgMonths, setEditPkgMonths] = useState(1);
  const [editPkgFeatures, setEditPkgFeatures] = useState('');

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
  };

  useEffect(() => {
    reloadAllAdminData();
  }, [token]);

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
        features: editPkgFeatures
      })
    })
      .then(res => res.json())
      .then(data => {
        showToast(data.message || 'Cập nhật gói tập thành công!');
        setShowEditPackage(null);
        reloadAllAdminData();
      })
      .catch(err => console.error('Error saving package:', err));
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
    setEditPkgTitle(pkg.title);
    setEditPkgPrice(pkg.price);
    setEditPkgMonths(pkg.durationMonths);
    setEditPkgFeatures(pkg.features);
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
              <button className="admin-btn-add" onClick={() => alert('Chức năng thêm gói tập mới đang được phát triển...')}>
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'lichhen':
        return (
          <div className="admin-card-panel">
            <h3 className="admin-card-title" style={{ marginBottom: '20px' }}>Lịch hẹn tập luyện toàn hệ thống</h3>
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
                  {appointmentsList.map((app) => (
                    <tr key={app.id}>
                      <td className="admin-table-name">{app.memberName}</td>
                      <td>{app.ptName}</td>
                      <td>{app.type}</td>
                      <td>{app.time}</td>
                      <td>{app.date}</td>
                      <td>
                        <span className={`admin-complaint-status-badge ${app.status.toLowerCase() === 'scheduled' ? 'pending' : app.status.toLowerCase() === 'completed' ? 'resolved' : 'cancelled'}`}>
                          {app.status === 'Scheduled' ? 'Đã lên lịch' : app.status === 'Completed' ? 'Đã hoàn thành' : 'Đã hủy'}
                        </span>
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
                </tbody>
              </table>
            </div>
          </div>
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
        return (
          <div className="admin-card-panel">
            <h3 className="admin-card-title" style={{ marginBottom: '20px' }}>Báo cáo phân tích hệ thống</h3>
            <p className="admin-card-desc" style={{ marginBottom: '30px' }}>Xuất báo cáo chi tiết về tình hình hoạt động của FxFitness Center.</p>
            
            <div className="admin-form-grid" style={{ marginBottom: '30px' }}>
              <div className="admin-card-panel" style={{ backgroundColor: '#f8fafc', textAlign: 'center' }}>
                <i className="fa-solid fa-chart-line" style={{ fontSize: '2rem', color: 'var(--orange)', marginBottom: '10px' }}></i>
                <h4 style={{ margin: '0 0 8px 0' }}>Báo cáo Tài chính Tháng</h4>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px 0' }}>Dữ liệu chi tiết doanh số bán gói tập, hoa hồng cho HLV và doanh thu thực tế.</p>
                <button className="admin-btn-submit" style={{ width: '100%' }} onClick={() => alert('Đang xuất tệp Excel Báo Cáo Tài Chính...')}>
                  Xuất Báo Cáo Tài Chính
                </button>
              </div>

              <div className="admin-card-panel" style={{ backgroundColor: '#f8fafc', textAlign: 'center' }}>
                <i className="fa-solid fa-users-gear" style={{ fontSize: '2rem', color: '#10b981', marginBottom: '10px' }}></i>
                <h4 style={{ margin: '0 0 8px 0' }}>Báo cáo Tần suất Lớp học</h4>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px 0' }}>Đo lường các khung giờ vàng tập luyện và tỷ lệ hoàn thành lịch hẹn PT.</p>
                <button className="admin-btn-submit" style={{ width: '100%', backgroundColor: '#10b981' }} onClick={() => alert('Đang xuất tệp Excel Báo Cáo Tần Suất...')}>
                  Xuất Báo Cáo Lịch Trình
                </button>
              </div>
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

      {/* MODAL 2: EDIT PACKAGE DETAILS */}
      {showEditPackage && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box">
            <h3 className="admin-modal-title">Chỉnh sửa Gói Tập Thành Viên</h3>
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

              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label className="admin-form-label">Giá bán (VND)</label>
                  <input 
                    type="number" 
                    className="admin-form-input" 
                    value={editPkgPrice}
                    onChange={(e) => setEditPkgPrice(e.target.value)}
                    required 
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Thời hạn (tháng)</label>
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
                <button type="button" className="admin-btn-cancel" onClick={() => setShowEditPackage(null)}>
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
