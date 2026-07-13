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
  const [heroTitle, setHeroTitle] = useState('Bứt Phá Giới Hạn');
  const [heroSubtitle, setHeroSubtitle] = useState('Hệ thống quản lý phòng gym thông minh, tối ưu hóa quy trình tập luyện và trải nghiệm khách hàng đẳng cấp.');
  const [paymentsList, setPaymentsList] = useState([]);
  const [offRequestsList, setOffRequestsList] = useState([]);

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
  const [paymentFilterType, setPaymentFilterType] = useState('ALL'); // ALL, DAY, MONTH, YEAR
  const [paymentFilterValue, setPaymentFilterValue] = useState(''); // Value for the filter (e.g. '2026-06-17')
  const [trainerSpecialtyFilter, setTrainerSpecialtyFilter] = useState('ALL'); // ALL, Yoga, Gym, Boxing
  const [trainerSortKey, setTrainerSortKey] = useState(null); // 'expYears', 'activeMembers', 'rating'
  const [trainerSortOrder, setTrainerSortOrder] = useState('desc'); // 'asc' or 'desc'
  
  // Add Account Modal State
  const [showAddPT, setShowAddPT] = useState(false);
  const [newPtRoleId, setNewPtRoleId] = useState('2'); // Default to Trainer (2)
  const [newPtName, setNewPtName] = useState('');
  const [newPtEmail, setNewPtEmail] = useState('');
  const [emailExistsError, setEmailExistsError] = useState('');
  const [newPtSpecialty, setNewPtSpecialty] = useState('Gym');
  const [newPtExpYears, setNewPtExpYears] = useState('');
  const [newPtBio, setNewPtBio] = useState('');
  const [newPtCertifications, setNewPtCertifications] = useState('');
  const [createdPTDetails, setCreatedPTDetails] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // HLV Profile Modal State
  const [showTrainerProfileModal, setShowTrainerProfileModal] = useState(false);
  const [selectedTrainerProfile, setSelectedTrainerProfile] = useState(null);
  const [selectedTrainerSchedules, setSelectedTrainerSchedules] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [scheduleFilter, setScheduleFilter] = useState('ALL'); // ALL, AVAILABLE, BOOKED, OFF

  // Edit Package Modal State
  const [showEditPackage, setShowEditPackage] = useState(null);
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [editPkgTitle, setEditPkgTitle] = useState('');
  const [editPkgPrice, setEditPkgPrice] = useState(0);
  const [editPkgMonths, setEditPkgMonths] = useState(1);
  const [editPkgFeatures, setEditPkgFeatures] = useState('');
  const [editPkgSportType, setEditPkgSportType] = useState('Gym');
  const [editPkgAttachedServices, setEditPkgAttachedServices] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [packageFilter, setPackageFilter] = useState('ALL');

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

    
      fetch('/api/checkout/services')
        .then(res => res.json())
        .then(data => { if (data && data.services) setAllServices(data.services); })
        .catch(err => console.error('Error fetching all services:', err));
    
      fetch('/api/checkout/homepage-config')
      .then(res => res.json())
      .then(data => { 
        if (data) {
          if (data.coreSports) setCoreSports(data.coreSports);
          if (data.heroTitle) setHeroTitle(data.heroTitle);
          if (data.heroSubtitle) setHeroSubtitle(data.heroSubtitle);
        }
      })
      .catch(err => console.error('Error fetching homepage config:', err));

    /* fetch('/api/dashboard/admin/payments', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (data && data.payments) setPaymentsList(data.payments); })
      .catch(err => console.error('Error fetching payments:', err)); */

    /* fetch('/api/dashboard/admin/off-requests', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (data && data.requests) setOffRequestsList(data.requests); })
      .catch(err => console.error('Error fetching off requests:', err)); */
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

  const handleApproveOffRequest = (id) => {
    fetch(`/api/dashboard/admin/off-requests/${id}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        showToast(data.message || 'Đã duyệt!');
        reloadAllAdminData();
      })
      .catch(err => console.error('Error approving off request:', err));
  };

  const handleRejectOffRequest = (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn từ chối yêu cầu nghỉ này?')) return;
    fetch(`/api/dashboard/admin/off-requests/${id}/reject`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        showToast(data.message || 'Đã từ chối!');
        reloadAllAdminData();
      })
      .catch(err => console.error('Error rejecting off request:', err));
  };

  const handleViewTrainerProfile = (trainerId) => {
    setLoadingProfile(true);
    fetch(`/api/dashboard/admin/trainers/${trainerId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Không thể tải thông tin hồ sơ HLV!');
        return res.json();
      })
      .then(data => {
        setSelectedTrainerProfile(data.trainer);
        setSelectedTrainerSchedules(data.schedules);
        setScheduleFilter('ALL');
        setShowTrainerProfileModal(true);
        setLoadingProfile(false);
      })
      .catch(err => {
        setLoadingProfile(false);
        alert(err.message || 'Lỗi khi tải hồ sơ HLV!');
      });
  };

  const handleSortTrainers = (key) => {
    if (trainerSortKey === key) {
      setTrainerSortOrder(trainerSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setTrainerSortKey(key);
      setTrainerSortOrder('desc'); // Default to descending when selecting new sort key
    }
  };

  const handleCheckEmailExists = (emailVal) => {
    if (!emailVal || !emailVal.includes('@')) return;
    fetch(`/api/dashboard/admin/check-email?email=${encodeURIComponent(emailVal)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.exists) {
          setEmailExistsError('Email này đã tồn tại trên hệ thống!');
        } else {
          setEmailExistsError('');
        }
      })
      .catch(err => console.error('Error checking email:', err));
  };

  const handleCreateAccount = (e) => {
    e.preventDefault();
    if (!newPtName || !newPtEmail || !newPtRoleId) return;
    if (emailExistsError) {
      alert('Email đã tồn tại! Vui lòng sử dụng email khác.');
      return;
    }

    setIsSubmitting(true);

    fetch('/api/dashboard/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        roleId: newPtRoleId,
        name: newPtName,
        email: newPtEmail,
        specialty: (newPtRoleId === '2') ? newPtSpecialty : undefined,
        expYears: (newPtRoleId === '2' && newPtExpYears) ? Number(newPtExpYears) : undefined,
        bio: (newPtRoleId === '2') ? newPtBio : undefined,
        certifications: (newPtRoleId === '2') ? newPtCertifications : undefined
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
          emailSent: data.emailSent,
          roleId: newPtRoleId
        });
        setNewPtName('');
        setNewPtEmail('');
        setNewPtRoleId('2');
        setEmailExistsError('');
        setNewPtSpecialty('Gym');
        setNewPtExpYears('');
        setNewPtBio('');
        setNewPtCertifications('');
        setIsSubmitting(false);
      })
      .catch(err => {
        setIsSubmitting(false);
        alert(err.message || 'Lỗi khi cấp tài khoản!');
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
          sportType: editPkgSportType,
          attachedServices: editPkgAttachedServices
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
          sportType: editPkgSportType,
          attachedServices: editPkgAttachedServices
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
      setEditPkgAttachedServices(pkg.attachedServices || []);
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
      setEditPkgAttachedServices([]);
  };

  const saveHomepageSport = (index, name, description, file) => {
    const formData = new FormData();
    const updatedSports = [...coreSports];
    updatedSports[index].name = name;
    updatedSports[index].description = description;

    formData.append('coreSports', JSON.stringify(updatedSports));
    formData.append('updateIndex', index);
    formData.append('heroTitle', heroTitle);
    formData.append('heroSubtitle', heroSubtitle);
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

  const saveHomepageHero = (title, subtitle) => {
    const formData = new FormData();
    formData.append('coreSports', JSON.stringify(coreSports));
    formData.append('heroTitle', title);
    formData.append('heroSubtitle', subtitle);

    fetch(`/api/dashboard/admin/homepage-config`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        showToast(data.message || 'Cập nhật Banner thành công!');
        reloadAllAdminData();
      })
      .catch(err => console.error('Error saving homepage hero config:', err));
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

  const filteredTrainers = trainersList
    .filter(t => {
      if (trainerSpecialtyFilter === 'ALL') return true;
      const spec = (t.specialty || '').toLowerCase();
      if (trainerSpecialtyFilter.toLowerCase() === 'gym' || trainerSpecialtyFilter.toLowerCase() === 'fitness & bodybuilding') {
        return spec.includes('gym') || spec.includes('fitness & bodybuilding');
      }
      return spec.includes(trainerSpecialtyFilter.toLowerCase());
    })
    .sort((a, b) => {
      if (!trainerSortKey) return 0;
      let valA = a[trainerSortKey];
      let valB = b[trainerSortKey];
      if (trainerSortKey === 'expYears' || trainerSortKey === 'activeMembers' || trainerSortKey === 'rating') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      }
      if (valA < valB) return trainerSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return trainerSortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const filteredPayments = paymentsList.filter(p => {
    if (paymentFilterType === 'ALL') return true;
    const paymentDate = new Date(p.paymentDate);
    
    if (paymentFilterType === 'DAY' && paymentFilterValue) {
      const filterDate = new Date(paymentFilterValue);
      return paymentDate.toDateString() === filterDate.toDateString();
    }
    if (paymentFilterType === 'MONTH' && paymentFilterValue) {
      const [year, month] = paymentFilterValue.split('-');
      return paymentDate.getFullYear() === parseInt(year) && (paymentDate.getMonth() + 1) === parseInt(month);
    }
    if (paymentFilterType === 'YEAR' && paymentFilterValue) {
      return paymentDate.getFullYear() === parseInt(paymentFilterValue);
    }
    return true;
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

  const sortedAndFilteredPackages = packagesList
    .filter(pkg => packageFilter === 'ALL' || pkg.sportType === packageFilter)
    .sort((a, b) => {
      const order = { 'Gym': 1, 'Yoga': 2, 'Boxing': 3, 'Combo': 4, 'VIP': 5 };
      const rankA = order[a.sportType] || 99;
      const rankB = order[b.sportType] || 99;
      
      if (rankA !== rankB) return rankA - rankB;
      // If same sport type, sort by price (or duration)
      return a.price - b.price;
    });

  // Render tab contents
  const renderTabContent = () => {
    switch (activeTab) {
      case 'tongquan':
        return (
          <>
            {/* Stat Cards Row */}
            <div className="admin-stats-grid">
              <div 
                className="admin-stat-card orange" 
                onClick={() => setActiveTab('nguoidung')} 
                style={{ cursor: 'pointer' }}
              >
                <div className="admin-stat-label">Tổng học viên</div>
                <div className="admin-stat-value">{stats.totalMembers?.toLocaleString('vi-VN')}</div>
                <div className="admin-stat-subtext">
                  <span className="trend-up">+12%</span> so với tháng trước
                </div>
                <div className="admin-stat-icon-wrap">
                  <i className="fa-solid fa-users"></i>
                </div>
              </div>

              <div 
                className="admin-stat-card green" 
                onClick={() => setActiveTab('baocao')} 
                style={{ cursor: 'pointer' }}
              >
                <div className="admin-stat-label">Doanh thu tháng</div>
                <div className="admin-stat-value">{stats.totalRevenue?.toLocaleString('vi-VN')}đ</div>
                <div className="admin-stat-subtext">
                  <span className="trend-up">+8%</span> chỉ tiêu đề ra
                </div>
                <div className="admin-stat-icon-wrap">
                  <i className="fa-solid fa-wallet"></i>
                </div>
              </div>

              <div 
                className="admin-stat-card purple" 
                onClick={() => setActiveTab('hlv')} 
                style={{ cursor: 'pointer' }}
              >
                <div className="admin-stat-label">Huấn luyện viên đang hoạt động</div>
                <div className="admin-stat-value">{stats.activeTrainers?.toLocaleString('vi-VN')}</div>
                <div className="admin-stat-subtext">
                  <span className="trend-neutral">Ổn định</span> nhân lực
                </div>
                <div className="admin-stat-icon-wrap">
                  <i className="fa-solid fa-person-running"></i>
                </div>
              </div>

              <div 
                className="admin-stat-card rose" 
                onClick={() => setActiveTab('lichhen')} 
                style={{ cursor: 'pointer' }}
              >
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

              <button className="admin-btn-add" onClick={() => {
                setNewPtRoleId('2');
                setNewPtName('');
                setNewPtEmail('');
                setEmailExistsError('');
                setNewPtSpecialty('Gym');
                setNewPtExpYears('');
                setNewPtBio('');
                setNewPtCertifications('');
                setShowAddPT(true);
              }}>
                <i className="fa-solid fa-plus"></i> Cấp Tài Khoản
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
            <div className="admin-card-header" style={{ marginBottom: '20px' }}>
              <div>
                <h3 className="admin-card-title">Danh sách Huấn Luyện Viên</h3>
                <p className="admin-card-desc">Quản lý đội ngũ Huấn Luyện Viên (HLV) và duyệt lịch nghỉ.</p>
              </div>
              <div className="admin-filters-area">
                <select 
                  className="admin-filter-select" 
                  value={trainerSpecialtyFilter} 
                  onChange={(e) => setTrainerSpecialtyFilter(e.target.value)}
                >
                  <option value="ALL">Tất cả bộ môn</option>
                  <option value="Yoga">Yoga</option>
                  <option value="Gym">Gym</option>
                  <option value="Boxing">Boxing</option>
                </select>
              </div>
            </div>

            <div className="admin-table-container" style={{ marginBottom: '40px' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Huấn luyện viên</th>
                    <th>Chuyên môn</th>
                    <th 
                      onClick={() => handleSortTrainers('expYears')} 
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      Kinh nghiệm 
                      <i 
                        className={`fa-solid ${trainerSortKey === 'expYears' ? (trainerSortOrder === 'asc' ? 'fa-arrow-up-short-wide' : 'fa-arrow-down-wide-short') : 'fa-sort'}`} 
                        style={{ marginLeft: '6px', color: trainerSortKey === 'expYears' ? 'var(--orange)' : '#94a3b8' }}
                      ></i>
                    </th>
                    <th 
                      onClick={() => handleSortTrainers('activeMembers')} 
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      Số học viên đang nhận 
                      <i 
                        className={`fa-solid ${trainerSortKey === 'activeMembers' ? (trainerSortOrder === 'asc' ? 'fa-arrow-up-short-wide' : 'fa-arrow-down-wide-short') : 'fa-sort'}`} 
                        style={{ marginLeft: '6px', color: trainerSortKey === 'activeMembers' ? 'var(--orange)' : '#94a3b8' }}
                      ></i>
                    </th>
                    <th 
                      onClick={() => handleSortTrainers('rating')} 
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      Đánh giá 
                      <i 
                        className={`fa-solid ${trainerSortKey === 'rating' ? (trainerSortOrder === 'asc' ? 'fa-arrow-up-short-wide' : 'fa-arrow-down-wide-short') : 'fa-sort'}`} 
                        style={{ marginLeft: '6px', color: trainerSortKey === 'rating' ? 'var(--orange)' : '#94a3b8' }}
                      ></i>
                    </th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrainers.map((pt) => (
                    <tr key={pt.id}>
                      <td>
                        <div 
                          className="admin-table-user-cell"
                          onClick={() => handleViewTrainerProfile(pt.id)}
                          style={{ cursor: 'pointer' }}
                          title="Xem chi tiết hồ sơ & lịch làm việc"
                        >
                          <div className="admin-table-avatar trainer">
                            {pt.name.charAt(0)}
                          </div>
                          <div>
                            <span 
                              className="admin-table-name"
                              style={{ transition: 'color 0.2s' }}
                              onMouseEnter={(e) => e.target.style.color = 'var(--orange)'}
                              onMouseLeave={(e) => e.target.style.color = ''}
                            >
                              {pt.name}
                            </span>
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
                  {filteredTrainers.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                        Không có huấn luyện viên nào phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* OFF REQUESTS SECTION */}
            <h3 className="admin-card-title" style={{ marginBottom: '20px', color: '#ef4444' }}>Yêu cầu Nghỉ Phép (Off Request)</h3>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Huấn luyện viên</th>
                    <th>Chuyên môn</th>
                    <th>Ngày xin nghỉ</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {offRequestsList.map((req) => (
                    <tr key={req.scheduleId}>
                      <td>
                        <span className="admin-table-name">{req.trainerName}</span>
                      </td>
                      <td style={{ color: 'var(--orange)' }}>{req.specialization}</td>
                      <td>{new Date(req.date).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <span className="admin-status-dot-wrap inactive">
                          <span className="admin-status-dot inactive"></span>
                          Chờ duyệt
                        </span>
                      </td>
                      <td>
                        <button 
                          className="admin-btn-submit" 
                          style={{ padding: '6px 12px', fontSize: '0.8rem', marginRight: '8px' }}
                          onClick={() => handleApproveOffRequest(req.scheduleId)}
                        >
                          Duyệt
                        </button>
                        <button 
                          className="admin-btn-cancel" 
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={() => handleRejectOffRequest(req.scheduleId)}
                        >
                          Từ chối
                        </button>
                      </td>
                    </tr>
                  ))}
                  {offRequestsList.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                        Không có yêu cầu nghỉ phép nào.
                      </td>
                    </tr>
                  )}
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
            
            
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {['ALL', 'Gym', 'Yoga', 'Boxing', 'Combo', 'VIP'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setPackageFilter(filter)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                      backgroundColor: packageFilter === filter ? 'var(--orange)' : '#ffffff',
                      color: packageFilter === filter ? '#ffffff' : '#475569',
                      borderColor: packageFilter === filter ? 'var(--orange)' : '#cbd5e1',
                    }}
                  >
                    {filter === 'ALL' ? 'Tất Cả' : filter}
                  </button>
                ))}
              </div>
              <div className="admin-packages-grid">

              {sortedAndFilteredPackages.map((pkg) => (
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
        return (
          <div className="admin-card-panel">
            <div className="admin-card-header" style={{ marginBottom: '20px' }}>
              <div>
                <h3 className="admin-card-title">Báo cáo Thanh toán Hệ thống</h3>
                <p className="admin-card-desc">Lịch sử giao dịch hội viên và doanh thu thực tế.</p>
              </div>
              <div className="admin-filters-area" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select 
                  className="admin-filter-select" 
                  value={paymentFilterType} 
                  onChange={(e) => {
                    setPaymentFilterType(e.target.value);
                    setPaymentFilterValue(''); 
                  }}
                >
                  <option value="ALL">Tất cả thời gian</option>
                  <option value="DAY">Theo ngày</option>
                  <option value="MONTH">Theo tháng</option>
                  <option value="YEAR">Theo năm</option>
                </select>

                {paymentFilterType === 'DAY' && (
                  <input 
                    type="date" 
                    className="admin-form-input" 
                    style={{ width: 'auto', padding: '6px 12px', minHeight: '38px' }}
                    value={paymentFilterValue}
                    onChange={(e) => setPaymentFilterValue(e.target.value)}
                  />
                )}
                {paymentFilterType === 'MONTH' && (
                  <input 
                    type="month" 
                    className="admin-form-input" 
                    style={{ width: 'auto', padding: '6px 12px', minHeight: '38px' }}
                    value={paymentFilterValue}
                    onChange={(e) => setPaymentFilterValue(e.target.value)}
                  />
                )}
                {paymentFilterType === 'YEAR' && (
                  <select 
                    className="admin-filter-select" 
                    value={paymentFilterValue}
                    onChange={(e) => setPaymentFilterValue(e.target.value)}
                  >
                    <option value="">Chọn năm</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                )}
              </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Ngày giao dịch</th>
                    <th>Nội dung thanh toán</th>
                    <th>Mã giao dịch</th>
                    <th>Trạng thái</th>
                    <th>Số tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.length > 0 ? filteredPayments.map((p) => (
                    <tr key={p.paymentId}>
                      <td>
                        <div className="admin-table-user-cell">
                          <div>
                            <span className="admin-table-name">{p.memberName}</span>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.memberEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td>{new Date(p.paymentDate).toLocaleString('vi-VN')}</td>
                      <td style={{ maxWidth: '250px', whiteSpace: 'normal' }}>
                        {p.paymentDescription || p.paymentType || 'Membership'}
                      </td>
                      <td><span style={{ fontFamily: 'monospace' }}>{p.transactionCode}</span></td>
                      <td>
                        <span className={`admin-status-dot-wrap ${p.paymentStatus === 'Paid' ? 'active' : 'inactive'}`}>
                          <span className={`admin-status-dot ${p.paymentStatus === 'Paid' ? 'active' : 'inactive'}`}></span>
                          {p.paymentStatus}
                        </span>
                      </td>
                      <td style={{ fontWeight: 'bold', color: 'var(--orange)' }}>
                        {p.amount.toLocaleString('vi-VN')}đ
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                        Không có dữ liệu giao dịch nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
               <h4 style={{ color: '#1e293b' }}>
                 Tổng cộng: <span style={{ color: 'var(--orange)', fontSize: '1.25rem' }}>
                   {filteredPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString('vi-VN')}đ
                 </span>
               </h4>
            </div>
          </div>
        );

      case 'trangchu':
        return (
          <div className="admin-card-panel">
            <h3 className="admin-card-title" style={{ marginBottom: '20px' }}>Cấu hình nội dung Trang Chủ</h3>
            <p className="admin-card-desc" style={{ marginBottom: '30px' }}>Thay đổi các tiêu đề chính và các thẻ dịch vụ cốt lõi hiển thị ở trang chủ (Gym, Yoga, Boxing).</p>

            {/* HERO SECTION CONFIG */}
            <div className="admin-card-panel" style={{ backgroundColor: '#fff7ed', border: '1px solid #ffedd5', marginBottom: '30px', padding: '24px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                <i className="fa-solid fa-heading"></i> Cấu hình Banner Trang Chủ (Hero Banner)
              </h4>
              <div className="admin-form-group">
                <label className="admin-form-label">Slogan Banner (Tiêu đề chính)</label>
                <input 
                  type="text" 
                  className="admin-form-input" 
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  style={{ fontWeight: '500' }}
                />
              </div>
              <div className="admin-form-group" style={{ marginTop: '16px' }}>
                <label className="admin-form-label">Mô tả Banner (Tiêu đề phụ)</label>
                <textarea 
                  className="admin-form-input" 
                  rows="3" 
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  style={{ lineHeight: '1.5' }}
                ></textarea>
              </div>
              <button 
                className="admin-btn-submit" 
                onClick={() => saveHomepageHero(heroTitle, heroSubtitle)}
                style={{ marginTop: '16px', padding: '10px 24px', fontWeight: 'bold' }}
              >
                Lưu Banner Trang Chủ
              </button>
            </div>

            <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#1e293b', fontWeight: 'bold' }}>
              <i className="fa-solid fa-cube"></i> Cấu hình thẻ Bộ môn cốt lõi
            </h4>

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

      {/* MODAL 1: PROVISION NEW ACCOUNT */}
      {showAddPT && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box">
            <h3 className="admin-modal-title">Cấp Tài Khoản Hệ Thống</h3>
            <form onSubmit={handleCreateAccount}>
              <div className="admin-form-group">
                <label className="admin-form-label">Vai Trò / Chức Vụ</label>
                <select
                  className="admin-form-input"
                  value={newPtRoleId}
                  onChange={(e) => setNewPtRoleId(e.target.value)}
                  style={{ width: '100%', height: '42px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }}
                  required
                >
                  <option value="2">Huấn luyện viên (Trainer/PT)</option>
                  <option value="3">Quản trị viên (Admin)</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Họ và Tên</label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="Nhập họ và tên người dùng"
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
                  onChange={(e) => {
                    setNewPtEmail(e.target.value);
                    if (emailExistsError) setEmailExistsError('');
                  }}
                  onBlur={(e) => handleCheckEmailExists(e.target.value)}
                  required
                />
                {emailExistsError && (
                  <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                    ⚠️ {emailExistsError}
                  </span>
                )}
              </div>

              {/* Trainer-specific fields */}
              {newPtRoleId === '2' && (
                <>
                  <div className="admin-form-grid">
                    <div className="admin-form-group">
                      <label className="admin-form-label">Chuyên môn</label>
                      <select
                        className="admin-form-input"
                        value={newPtSpecialty}
                        onChange={(e) => setNewPtSpecialty(e.target.value)}
                        style={{ width: '100%', height: '42px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }}
                        required
                      >
                        <option value="Gym">HLV Gym (PT)</option>
                        <option value="Yoga">HLV Yoga</option>
                        <option value="Boxing">HLV Boxing</option>
                      </select>
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Số năm kinh nghiệm (Không bắt buộc)</label>
                      <input
                        type="number"
                        className="admin-form-input"
                        min="0"
                        placeholder="Ví dụ: 3"
                        value={newPtExpYears}
                        onChange={(e) => setNewPtExpYears(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Bằng cấp / Chứng chỉ (Không bắt buộc)</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="Ví dụ: NASM-CPT, Liên đoàn Boxing..."
                      value={newPtCertifications}
                      onChange={(e) => setNewPtCertifications(e.target.value)}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Giới thiệu ngắn / Bio (Không bắt buộc)</label>
                    <textarea
                      className="admin-form-textarea"
                      placeholder="Kinh nghiệm, triết lý giảng dạy..."
                      value={newPtBio}
                      onChange={(e) => setNewPtBio(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="admin-form-actions">
                <button type="button" className="admin-btn-cancel" onClick={() => setShowAddPT(false)}>
                  Hủy Bỏ
                </button>
                <button type="submit" className="admin-btn-submit" disabled={!!emailExistsError || isSubmitting}>
                  {isSubmitting ? 'Đang xử lý...' : 'Cấp Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL FOR ACCOUNT CREATION */}
      {createdPTDetails && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box" style={{ maxWidth: '450px', textAlign: 'center' }}>
            <div style={{ color: '#10b981', fontSize: '3.5rem', marginBottom: '16px' }}>
               <i className="fa-solid fa-circle-check"></i>
            </div>
            <h3 className="admin-modal-title" style={{ border: 'none', padding: 0, marginBottom: '8px' }}>Cấp Tài Khoản Thành Công!</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>
              Tài khoản mới đã được khởi tạo ở trạng thái Inactive (chờ đổi mật khẩu lần đầu).
            </p>

            <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'left', marginBottom: '24px' }}>
              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Họ tên</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#1e293b', marginTop: '2px' }}>{createdPTDetails.name}</div>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Vai trò tài khoản</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#1e293b', marginTop: '2px' }}>
                  {createdPTDetails.roleId === '1' ? 'Hội viên (Member)' : createdPTDetails.roleId === '2' ? 'Huấn luyện viên (Trainer/PT)' : 'Quản trị viên (Admin)'}
                </div>
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
                ? '✓ Thông tin tài khoản đã được gửi đến email.'
                : '⚠ Không gửi được email (chưa cấu hình SMTP). Mật khẩu chỉ hiển thị một lần ở đây.'}
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
                <select 
                  className="admin-form-input" 
                  value={editPkgSportType}
                  onChange={(e) => setEditPkgSportType(e.target.value)}
                  required
                >
                  <option value="Gym">Gym</option>
                  <option value="Yoga">Yoga</option>
                  <option value="Boxing">Boxing</option>
                  <option value="Combo">Combo</option>
                  <option value="VIP">VIP</option>
                </select>
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
                <label className="admin-form-label">Dịch Vụ Đi Kèm</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  {allServices.filter(svc => !svc.serviceName.toUpperCase().includes('GÓI PT')).map(svc => {
                    const isChecked = editPkgAttachedServices.some(s => s.serviceId === svc.serviceId);
                    const attachedSvc = editPkgAttachedServices.find(s => s.serviceId === svc.serviceId);
                    const isPT = svc.serviceName.toLowerCase().includes('pt') || svc.serviceName.toLowerCase().includes('huấn luyện');
                    
                    return (
                      <div key={svc.serviceId} style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <input 
                          type="checkbox" 
                          id={`svc-${svc.serviceId}`}
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditPkgAttachedServices([...editPkgAttachedServices, { serviceId: svc.serviceId, serviceName: svc.serviceName, sessionCount: isPT ? 1 : null }]);
                            } else {
                              setEditPkgAttachedServices(editPkgAttachedServices.filter(s => s.serviceId !== svc.serviceId));
                            }
                          }}
                          style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--orange)' }}
                        />
                        <label htmlFor={`svc-${svc.serviceId}`} style={{ cursor: 'pointer', fontSize: '0.95rem', color: '#334155' }}>
                          {svc.serviceName} (+{svc.price.toLocaleString('vi-VN')}đ)
                        </label>
                        {isChecked && isPT && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Số buổi:</span>
                            <input 
                              type="number" 
                              min="1"
                              value={attachedSvc?.sessionCount || 1}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                setEditPkgAttachedServices(editPkgAttachedServices.map(s => 
                                  s.serviceId === svc.serviceId ? { ...s, sessionCount: val } : s
                                ));
                              }}
                              style={{ width: '60px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'center' }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
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

      {/* LOADING PROFILE OVERLAY */}
      {loadingProfile && (
        <div className="admin-modal-overlay" style={{ zIndex: 9999 }}>
          <div className="admin-modal-box" style={{ maxWidth: '250px', textAlign: 'center', padding: '24px' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: 'var(--orange)', marginBottom: '12px' }}></i>
            <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>Đang tải hồ sơ...</div>
          </div>
        </div>
      )}

      {/* MODAL: TRAINER PROFILE & SCHEDULE */}
      {showTrainerProfileModal && selectedTrainerProfile && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box" style={{ maxWidth: '950px', width: '90%', padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: '90vh' }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>Hồ Sơ Chi Tiết & Lịch Trực HLV</h3>
              <button 
                type="button" 
                onClick={() => { setShowTrainerProfileModal(false); setSelectedTrainerProfile(null); }}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ display: 'flex', flex: '1', overflow: 'hidden', minHeight: '400px' }}>
              {/* Left Column: Profile Card (35% width) */}
              <div style={{ width: '35%', borderRight: '1px solid #e2e8f0', padding: '24px', overflowY: 'auto', backgroundColor: '#ffffff' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ 
                    width: '90px', 
                    height: '90px', 
                    borderRadius: '50%', 
                    backgroundColor: 'var(--orange)', 
                    color: '#ffffff', 
                    fontSize: '2.2rem', 
                    fontWeight: 'bold', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 16px auto',
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2)'
                  }}>
                    {selectedTrainerProfile.name.charAt(0)}
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b' }}>{selectedTrainerProfile.name}</h4>
                  <span style={{ 
                    padding: '4px 12px', 
                    borderRadius: '20px', 
                    fontSize: '0.8rem', 
                    fontWeight: 'bold', 
                    backgroundColor: '#fff7ed', 
                    color: 'var(--orange)',
                    border: '1px solid #ffedd5'
                  }}>
                    {selectedTrainerProfile.specialty}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem', color: '#475569', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px', marginBottom: '20px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Email</span>
                    <span style={{ fontWeight: '500', color: '#1e293b' }}>{selectedTrainerProfile.email}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Số điện thoại</span>
                    <span style={{ fontWeight: '500', color: '#1e293b' }}>{selectedTrainerProfile.phone}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Kinh nghiệm</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--orange)' }}>{selectedTrainerProfile.expYears} năm</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Đánh giá</span>
                      <span style={{ fontWeight: 'bold', color: '#eab308' }}>★ {selectedTrainerProfile.rating}</span>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Thời gian làm việc</span>
                    <span style={{ fontWeight: '600', color: '#0f172a' }}>{selectedTrainerProfile.employmentDuration}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                      (Ngày gia nhập: {selectedTrainerProfile.joinDate ? new Date(selectedTrainerProfile.joinDate).toLocaleDateString('vi-VN') : '—'})
                    </span>
                  </div>
                </div>

                {selectedTrainerProfile.bio && (
                  <div style={{ marginBottom: '24px' }}>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '0.82rem', fontWeight: 'bold', color: '#1e293b', textTransform: 'uppercase' }}>Giới thiệu (Bio)</h5>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: '1.5', fontStyle: 'italic' }}>"{selectedTrainerProfile.bio}"</p>
                  </div>
                )}

                <div>
                  <h5 style={{ margin: '0 0 10px 0', fontSize: '0.82rem', fontWeight: 'bold', color: '#1e293b', textTransform: 'uppercase' }}>Bằng cấp & Chứng chỉ</h5>
                  {selectedTrainerProfile.certifications && selectedTrainerProfile.certifications.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {selectedTrainerProfile.certifications.map((c, i) => (
                        <div key={i} style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#1e293b' }}>{c.certification_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Cấp bởi: {c.issued_by}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Ngày cấp: {c.issued_date ? new Date(c.issued_date).toLocaleDateString('vi-VN') : '—'}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '16px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#94a3b8', fontSize: '0.8rem', border: '1px dashed #cbd5e1' }}>
                      Chưa cập nhật bằng cấp
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Timetable Schedule Visualizer (65% width) */}
              <div style={{ width: '65%', padding: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold', color: '#1e293b', textTransform: 'uppercase' }}>Thời khóa biểu (2 tháng tới)</h5>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['ALL', 'AVAILABLE', 'BOOKED', 'OFF'].map(filterType => {
                      const labels = { ALL: 'Tất cả', AVAILABLE: 'Trống', BOOKED: 'Đã đặt', OFF: 'Lịch nghỉ' };
                      return (
                        <button
                          key={filterType}
                          type="button"
                          onClick={() => setScheduleFilter(filterType)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            borderRadius: '6px',
                            border: '1px solid',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            borderColor: scheduleFilter === filterType ? 'var(--orange)' : '#cbd5e1',
                            backgroundColor: scheduleFilter === filterType ? 'var(--orange)' : '#ffffff',
                            color: scheduleFilter === filterType ? '#ffffff' : '#64748b'
                          }}
                        >
                          {labels[filterType]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Schedules List */}
                <div style={{ flex: '1', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
                  {selectedTrainerSchedules
                    .filter(s => {
                      if (scheduleFilter === 'ALL') return true;
                      if (scheduleFilter === 'AVAILABLE') return s.status === 'Available';
                      if (scheduleFilter === 'BOOKED') return s.status === 'Booked' || s.status === 'Busy';
                      if (scheduleFilter === 'OFF') return s.status === 'Off';
                      return true;
                    })
                    .map((s, idx) => {
                      const slotDate = new Date(`${s.date}T${s.startTime}`);
                      const isPast = slotDate < new Date();
                      
                      // Status styling
                      let statusText = 'Lịch Trống';
                      let badgeBg = '#e0f2fe';
                      let badgeColor = '#0369a1';
                      
                      if (isPast) {
                        statusText = 'Đã hoàn thành';
                        badgeBg = '#d1fae5'; // Muted Green
                        badgeColor = '#065f46';
                      } else if (s.status === 'Off') {
                        statusText = 'Lịch nghỉ (Off)';
                        badgeBg = '#f1f5f9'; // Grey
                        badgeColor = '#64748b';
                      } else if (s.status === 'Booked' || s.status === 'Busy') {
                        statusText = 'Đã đặt lịch';
                        badgeBg = '#ffedd5'; // Orange/Red
                        badgeColor = '#c2410c';
                      }

                      return (
                        <div 
                          key={idx} 
                          style={{ 
                            padding: '16px', 
                            backgroundColor: '#ffffff', 
                            borderRadius: '10px', 
                            border: '1px solid #e2e8f0', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'flex-start',
                            opacity: isPast ? 0.8 : 1,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#1e293b' }}>
                                {new Date(s.date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' })}
                              </span>
                              <span style={{ 
                                fontSize: '0.72rem', 
                                fontWeight: 'bold', 
                                padding: '2px 8px', 
                                borderRadius: '4px', 
                                backgroundColor: badgeBg, 
                                color: badgeColor 
                              }}>
                                {statusText}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <i className="fa-regular fa-clock"></i>
                              <span>{s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)}</span>
                            </div>

                            {/* Booking member details */}
                            {s.appointment && (
                              <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '6px', borderLeft: '3px solid var(--orange)', fontSize: '0.82rem' }}>
                                <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
                                  Học viên: {s.appointment.member?.name || 'N/A'}
                                </div>
                                {s.appointment.member?.phone && (
                                  <div style={{ color: '#64748b', marginBottom: '2px' }}>
                                    SĐT: {s.appointment.member.phone}
                                  </div>
                                )}
                                <div style={{ color: '#64748b', fontStyle: s.appointment.note ? 'normal' : 'italic' }}>
                                  Ghi chú: {s.appointment.note || 'Không có ghi chú.'}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                  {selectedTrainerSchedules.filter(s => {
                    if (scheduleFilter === 'ALL') return true;
                    if (scheduleFilter === 'AVAILABLE') return s.status === 'Available';
                    if (scheduleFilter === 'BOOKED') return s.status === 'Booked' || s.status === 'Busy';
                    if (scheduleFilter === 'OFF') return s.status === 'Off';
                    return true;
                  }).length === 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: '#94a3b8', flex: '1' }}>
                      <i className="fa-regular fa-calendar-times" style={{ fontSize: '2.5rem', marginBottom: '12px', color: '#cbd5e1' }}></i>
                      <div style={{ fontSize: '0.85rem' }}>Không tìm thấy lịch trực làm việc nào.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f8fafc' }}>
              <button 
                type="button" 
                className="admin-btn-submit"
                onClick={() => { setShowTrainerProfileModal(false); setSelectedTrainerProfile(null); }}
                style={{ padding: '8px 24px' }}
              >
                Đóng hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
