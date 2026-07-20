import React, { useState, useEffect, useRef, useCallback } from 'react';
import './AdminDashboard.css';
import jsQR from 'jsqr';


function AdminDashboard({ token, userInfo, logout }) {
  // Navigation State
  const [activeTab, setActiveTab] = useState('tongquan');

  // Selected chart year
  const [selectedYear, setSelectedYear] = useState('2025');
  const [timeRangeType, setTimeRangeType] = useState('month');
  const [selectedPeriod, setSelectedPeriod] = useState('ALL');

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
  const [analyticsData, setAnalyticsData] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // --- Check-in State Variables ---
  const [checkinsList, setCheckinsList] = useState([]);
  const [checkinSearchQuery, setCheckinSearchQuery] = useState('');
  const [manualMemberId, setManualMemberId] = useState('');
  const [isCheckinSubmitting, setIsCheckinSubmitting] = useState(false);
  const [selectedCheckin, setSelectedCheckin] = useState(null);

  // --- QR Camera Scanner States ---
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [qrScanStatus, setQrScanStatus] = useState('idle'); // idle | scanning | processing | success | error
  const [qrScanMessage, setQrScanMessage] = useState('');
  const [qrScanResult, setQrScanResult] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);

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
  const fetchOffRequests = () => {
    if (!token || token === 'mock-preview-token') return;
    fetch('/api/dashboard/admin/off-requests', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (data && data.requests) setOffRequestsList(data.requests); })
      .catch(err => console.error('Error fetching off requests:', err));
  };

  const fetchCheckinsList = () => {
    if (!token || token === 'mock-preview-token') return;
    fetch('/api/dashboard/admin/checkins', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.checkins) setCheckinsList(data.checkins);
      })
      .catch(err => console.error('Error fetching checkins:', err));
  };

  const handlePerformCheckIn = (memberId) => {
    if (!memberId) return;
    setIsCheckinSubmitting(true);
    fetch('/api/dashboard/admin/checkin/perform', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ memberId })
    })
      .then(res => {
        if (!res.ok) return res.json().then(err => { throw new Error(err.message); });
        return res.json();
      })
      .then(data => {
        showToast(data.message || 'Check-in thành công!');
        setManualMemberId('');
        fetchCheckinsList();
        setIsCheckinSubmitting(false);
      })
      .catch(err => {
        setIsCheckinSubmitting(false);
        alert(err.message || 'Lỗi khi thực hiện check-in!');
      });
  };

  // Hàm thực hiện check-in sau khi quét được QR (bỏ qua broadcast lập tức)
  const performCheckinFromQr = async (memberId) => {
    setQrScanStatus('processing');
    setQrScanMessage('Đang xác nhận check-in...');
    try {
      const res = await fetch('/api/checkout/public-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, skipBroadcast: true })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setQrScanStatus('success');
        setQrScanResult(data.checkIn);
        setQrScanMessage('CHECK-IN THÀNH CÔNG!');
        fetchCheckinsList();
      } else {
        setQrScanStatus('error');
        setQrScanMessage(data.message || 'Check-in thất bại!');
      }
    } catch (err) {
      setQrScanStatus('error');
      setQrScanMessage('Lỗi kết nối máy chủ!');
    }
  };

  // Hàm gửi yêu cầu phát thông báo hoàn thành check-in tới member
  const notifyCheckinComplete = async (memberId) => {
    try {
      await fetch('/api/checkout/notify-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId })
      });
    } catch (err) {
      console.error('Error notifying checkin complete:', err);
    }
  };


  // Dừng camera
  const stopQrScanner = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Mở camera và bắt đầu quét QR
  const startQrScanner = async () => {
    setQrScannerOpen(true);
    setQrScanStatus('scanning');
    setQrScanMessage('');
    setQrScanResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280, min: 640 }, height: { ideal: 720, min: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const scanFrame = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });
          if (code && code.data) {
            // Đã detect được QR, parse lấy memberId
            stopQrScanner();
            let memberId = null;
            try {
              const url = new URL(code.data);
              memberId = url.searchParams.get('memberId');
            } catch {
              // Nếu không phải URL, thử parse trực tiếp như số memberId
              if (/^\d+$/.test(code.data.trim())) {
                memberId = code.data.trim();
              }
            }
            if (memberId) {
              performCheckinFromQr(memberId);
            } else {
              setQrScanStatus('error');
              setQrScanMessage('Mã QR không hợp lệ! Vui lòng thử lại.');
            }
            return;
          }
        }
        animFrameRef.current = requestAnimationFrame(scanFrame);
      };
      animFrameRef.current = requestAnimationFrame(scanFrame);
    } catch (err) {
      setQrScanStatus('error');
      setQrScanMessage('Không thể mở camera! Vui lòng cấp quyền truy cập camera cho trình duyệt.');
    }
  };

  const closeQrScanner = () => {
    // Nếu quét thành công mà đóng scanner, tự động phát thông báo check-in cho hội viên
    if (qrScanStatus === 'success' && qrScanResult && qrScanResult.memberId) {
      notifyCheckinComplete(qrScanResult.memberId);
    }
    stopQrScanner();
    setQrScannerOpen(false);
    setQrScanStatus('idle');
    setQrScanMessage('');
    setQrScanResult(null);
  };

  const reloadNotifications = () => {
    if (!token || token === 'mock-preview-token') return;
    fetch('/api/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.notifications) {
          const mapped = data.notifications.map(n => ({
            id: n.notification_id,
            message: n.content,
            title: n.title,
            type: n.notification_type,
            unread: !n.is_read,
            time: n.created_at ? new Date(n.created_at.replace('Z', '')).toLocaleString('vi-VN') : 'Vừa xong'
          }));
          setNotifications(mapped);
        }
      })
      .catch(err => console.error('Error fetching notifications:', err));
  };

  const markAllNotifsRead = () => {
    if (!token) return;
    fetch('/api/notifications/read-all', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (res.ok) {
          setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
        }
      })
      .catch(err => console.error('Error marking all notifications read:', err));
  };

  const clearNotification = (id) => {
    if (!token) return;
    fetch(`/api/notifications/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (res.ok) {
          setNotifications(prev => prev.filter(n => n.id !== id));
        }
      })
      .catch(err => console.error('Error deleting notification:', err));
  };

  const handleNotificationClick = (n) => {
    // Mark as read
    if (n.unread) {
      fetch(`/api/notifications/${n.id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (res.ok) {
            setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, unread: false } : item));
          }
        })
        .catch(err => console.error('Error marking notification read:', err));
    }

    // Switch tab
    if (n.type && (n.type.includes('OFF_REQUEST') || n.type.includes('OFF'))) {
      setActiveTab('hlv');
    }
  };

  const reloadAllAdminData = () => {
    if (!token || token === 'mock-preview-token') return;

    fetch('/api/dashboard/admin/stats', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (data && data.stats) setStats(data.stats); })
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
      .catch(err => console.error('Error fetching admin trainers:', err));

    fetch('/api/dashboard/admin/plans', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (data && data.plans) setPlansList(data.plans); })
      .catch(err => console.error('Error fetching admin plans:', err));

    fetch('/api/dashboard/admin/appointments', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (data && data.appointments) setAppointmentsList(data.appointments); })
      .catch(err => console.error('Error fetching admin appointments:', err));

    fetch('/api/admin/services', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (data && data.services) setServicesList(data.services); })
      .catch(err => console.error('Error fetching admin services:', err));

    fetch('/api/dashboard/admin/homepage-config', {
      headers: { Authorization: `Bearer ${token}` }
    })
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

    fetch('/api/dashboard/admin/analytics', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (data) setAnalyticsData(data); })
      .catch(err => console.error('Error fetching admin analytics:', err));

    /* fetch('/api/dashboard/admin/off-requests', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (data && data.requests) setOffRequestsList(data.requests); })
      .catch(err => console.error('Error fetching off requests:', err)); */

    fetchOffRequests();
    reloadNotifications();
    fetchCheckinsList();
  };
  useEffect(() => {
    reloadAllAdminData();
  }, [token, activeTab]);

  useEffect(() => {
    if (!token || token === 'mock-preview-token') return;
    
    const streamUrl = `/api/notifications/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(streamUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.connected) {
          console.log('[SSE Admin] Connected to notification stream.');
          return;
        }

        const newNotif = {
          id: data.notification_id,
          message: data.content,
          title: data.title,
          type: data.notification_type,
          unread: !data.is_read,
          time: data.created_at ? new Date(data.created_at.replace('Z', '')).toLocaleString('vi-VN') : 'Vừa xong'
        };

        setNotifications(prev => {
          if (prev.some(n => n.id === newNotif.id)) return prev;
          return [newNotif, ...prev];
        });

        // Realtime auto-refresh on Off request / booking events
        if (['OFF_REQUEST_CREATED', 'OFF_REQUEST_APPROVED', 'OFF_REQUEST_REJECTED', 'OFF_REQUEST_CANCELLED', 'NEW_OFF_REQUEST'].includes(data.type || newNotif.type)) {
          fetchOffRequests();
        }

        if (data.type === 'MEMBER_CHECKED_IN') {
          fetchCheckinsList();
        }

      } catch (err) {
        console.error('[SSE Admin] Error processing stream message:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('[SSE Admin] Stream connection error:', err);
    };

    return () => {
      eventSource.close();
      console.log('[SSE Admin] Closed stream connection.');
    };
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
    const reason = window.prompt('Nhập lý do từ chối:');
    if (reason === null) return;
    fetch(`/api/dashboard/admin/off-requests/${id}/reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ reason: reason || 'Không có lý do' })
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
    const rev = analyticsData?.revenue || { total: 48500000, membership: 35000000, service: 13500000 };
    const pkgs = analyticsData?.packages || [];
    const srvs = analyticsData?.services || [];
    const tns = analyticsData?.trainers || [];
    const monthlyAnalytics = analyticsData?.monthlyAnalytics || [];
    const weeklyAnalytics = analyticsData?.weeklyAnalytics || [];

    let currentRev = { ...rev };
    if (selectedPeriod !== 'ALL') {
      if (timeRangeType === 'month') {
        const found = monthlyAnalytics.find(m => m.monthKey === selectedPeriod);
        if (found) {
          currentRev = {
            total: found.total,
            membership: found.membership,
            service: found.service
          };
        }
      } else {
        const found = weeklyAnalytics.find(w => w.weekStart === selectedPeriod);
        if (found) {
          currentRev = {
            total: found.total,
            membership: found.membership,
            service: found.service
          };
        }
      }
    }

    // Calculate split percentages
    const membershipPct = currentRev.total > 0 ? Math.round((currentRev.membership / currentRev.total) * 100) : 0;
    const servicePct = currentRev.total > 0 ? Math.round((currentRev.service / currentRev.total) * 100) : 0;

    switch (activeTab) {
      case 'tongquan':
        return (
          <div className="admin-analytics-container">
            {/* Header Description */}
            <div className="admin-card-panel analytics-header-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <h3 className="admin-card-title">Tổng quan hoạt động hệ thống</h3>
                  <p className="admin-card-desc">Dữ liệu doanh thu thực tế từ cổng thanh toán PayOS và thống kê hoạt động hệ thống.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="admin-btn-submit" onClick={() => setActiveTab('baocao')}>
                    <i className="fa-solid fa-chart-line" style={{ marginRight: '8px' }}></i> Xem Báo Cáo Tài Chính
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

                <div className="admin-card-panel" style={{ marginTop: '30px', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                  <h4 className="analytics-section-title" style={{ fontSize: '0.95rem', marginBottom: '8px' }}>Chỉ số sức khỏe hệ thống</h4>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                    Tỷ lệ hài lòng của học viên đối với chất lượng HLV đạt <strong>★ {tns.length > 0 ? (tns.reduce((acc, t) => acc + Number(t.rating), 0) / tns.length).toFixed(1) : "5.0"} / 5.0</strong>.
                  </p>
                  <button className="admin-btn-submit" style={{ width: '100%', backgroundColor: '#0f172a' }} onClick={() => setActiveTab('checkin')}>
                    Xem lịch sử Check-in
                  </button>
                </div>
              </div>
            </div>
          </div>
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
                    <tr key={req.requestId}>
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
                          onClick={() => handleApproveOffRequest(req.requestId)}
                        >
                          Duyệt
                        </button>
                        <button 
                          className="admin-btn-cancel" 
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={() => handleRejectOffRequest(req.requestId)}
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
      case 'baocao':
        const selectedPeriodData = selectedPeriod === 'ALL'
          ? (timeRangeType === 'month' ? monthlyAnalytics : weeklyAnalytics)
          : (timeRangeType === 'month'
              ? monthlyAnalytics.filter(m => m.monthKey === selectedPeriod)
              : weeklyAnalytics.filter(w => w.weekStart === selectedPeriod));

        // Max values for bar charts
        const maxVal = Math.max(...selectedPeriodData.map(x => x.total), 1);

        return (
          <div className="admin-analytics-container">
            {/* Header Description & Main Toolbar */}
            <div className="admin-card-panel analytics-header-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                  <h3 className="admin-card-title">Báo cáo tài chính & Biểu đồ phân tích</h3>
                  <p className="admin-card-desc">Thống kê chi tiết doanh số bán gói tập, cơ cấu doanh thu và phân bổ chi phí hoạt động từ dữ liệu thực tế.</p>
                </div>
                
                {/* Export & Toolbar Actions */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Time Range Selector: Month vs Week */}
                  <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <button
                      onClick={() => { setTimeRangeType('month'); setSelectedPeriod('ALL'); }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.82rem',
                        transition: 'all 0.2s',
                        backgroundColor: timeRangeType === 'month' ? '#ffffff' : 'transparent',
                        color: timeRangeType === 'month' ? 'var(--orange)' : '#64748b',
                        boxShadow: timeRangeType === 'month' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      Theo Tháng
                    </button>
                    <button
                      onClick={() => { setTimeRangeType('week'); setSelectedPeriod('ALL'); }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.82rem',
                        transition: 'all 0.2s',
                        backgroundColor: timeRangeType === 'week' ? '#ffffff' : 'transparent',
                        color: timeRangeType === 'week' ? 'var(--orange)' : '#64748b',
                        boxShadow: timeRangeType === 'week' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      Theo Tuần
                    </button>
                  </div>

                  {/* Dropdown for Period Selection */}
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    style={{
                      height: '36px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#334155',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    {timeRangeType === 'month' ? (
                      <>
                        <option value="ALL">Tất cả các tháng</option>
                        {monthlyAnalytics.map(m => (
                          <option key={m.monthKey} value={m.monthKey}>Tháng {m.monthKey.slice(5)}/{m.monthKey.slice(0,4)}</option>
                        ))}
                      </>
                    ) : (
                      <>
                        <option value="ALL">Tất cả các tuần</option>
                        {weeklyAnalytics.map(w => (
                          <option key={w.weekStart} value={w.weekStart}>Tuần từ {new Date(w.weekStart).toLocaleDateString('vi-VN')}</option>
                        ))}
                      </>
                    )}
                  </select>

                  <button className="admin-btn-submit" style={{ height: '36px', display: 'flex', alignItems: 'center' }} onClick={() => alert('Đang xuất báo cáo tài chính...')}>
                    <i className="fa-solid fa-file-excel" style={{ marginRight: '8px' }}></i> Xuất Excel
                  </button>
                </div>
              </div>
            </div>

            {/* Row 1: Cards Row */}
            <div className="admin-stats-grid analytics-stats-grid">
              <div className="admin-stat-card orange">
                <div className="admin-stat-label">Doanh thu thời kỳ</div>
                <div className="admin-stat-value">{currentRev.total?.toLocaleString('vi-VN')} đ</div>
                <div className="admin-stat-subtext">
                  Tổng thu từ giao dịch <span style={{ fontWeight: 'bold' }}>Thành công</span>
                </div>
                <div className="admin-stat-icon-wrap">
                  <i className="fa-solid fa-sack-dollar"></i>
                </div>
              </div>

              <div className="admin-stat-card green">
                <div className="admin-stat-label">Doanh thu Gói tập</div>
                <div className="admin-stat-value">{currentRev.membership?.toLocaleString('vi-VN')} đ</div>
                <div className="admin-stat-subtext">
                  Chiếm <span style={{ fontWeight: 'bold' }}>{membershipPct}%</span> cơ cấu doanh số
                </div>
                <div className="admin-stat-icon-wrap">
                  <i className="fa-solid fa-id-card"></i>
                </div>
              </div>

              <div className="admin-stat-card purple">
                <div className="admin-stat-label">Doanh thu Dịch vụ & PT</div>
                <div className="admin-stat-value">{currentRev.service?.toLocaleString('vi-VN')} đ</div>
                <div className="admin-stat-subtext">
                  Chiếm <span style={{ fontWeight: 'bold' }}>{servicePct}%</span> cơ cấu doanh số
                </div>
                <div className="admin-stat-icon-wrap">
                  <i className="fa-solid fa-bell-concierge"></i>
                </div>
              </div>
            </div>

            {/* Row 2: Donut Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
              
              {/* Donut Chart 1: Cơ cấu doanh thu */}
              <div className="admin-card-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '30px', minHeight: '320px' }}>
                <h4 className="analytics-section-title" style={{ width: '100%', textAlign: 'left', marginBottom: '24px' }}>
                  <i className="fa-solid fa-chart-pie" style={{ color: 'var(--orange)', marginRight: '8px' }}></i> Cơ cấu doanh thu thời kỳ
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {/* Conic Gradient Donut */}
                  <div style={{
                    width: '160px',
                    height: '160px',
                    borderRadius: '50%',
                    background: currentRev.total > 0
                      ? `conic-gradient(var(--orange) 0% ${membershipPct}%, #10b981 ${membershipPct}% 100%)`
                      : '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: '110px',
                      height: '110px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>Tổng thu</span>
                      <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#1e293b', marginTop: '2px' }}>{currentRev.total?.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>

                  {/* Legends */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--orange)', display: 'inline-block' }}></span>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Gói tập hội viên</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: '750', color: '#1e293b' }}>
                          {currentRev.membership?.toLocaleString('vi-VN')}đ ({membershipPct}%)
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Dịch vụ & PT</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: '750', color: '#1e293b' }}>
                          {currentRev.service?.toLocaleString('vi-VN')}đ ({servicePct}%)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Donut Chart 2: Cơ cấu chi tiêu */}
              <div className="admin-card-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '30px', minHeight: '320px' }}>
                <h4 className="analytics-section-title" style={{ width: '100%', textAlign: 'left', marginBottom: '24px' }}>
                  <i className="fa-solid fa-chart-pie" style={{ color: '#3b82f6', marginRight: '8px' }}></i> Phân bổ chi phí thời kỳ
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {/* Conic Gradient Donut (Lương PT 64% - Vận hành 25% - Marketing 11%) */}
                  <div style={{
                    width: '160px',
                    height: '160px',
                    borderRadius: '50%',
                    background: currentRev.total > 0
                      ? `conic-gradient(#3b82f6 0% 64%, #ec4899 64% 89%, #eab308 89% 100%)`
                      : '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: '110px',
                      height: '110px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>Tổng chi</span>
                      <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#1e293b', marginTop: '2px' }}>{Math.round(currentRev.total * 0.6).toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>

                  {/* Legends */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'inline-block' }}></span>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Lương HLV / PT (64%)</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '750', color: '#1e293b' }}>
                          {Math.round(currentRev.total * 0.6 * 0.64).toLocaleString('vi-VN')}đ
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ec4899', display: 'inline-block' }}></span>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Chi phí vận hành (25%)</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '750', color: '#1e293b' }}>
                          {Math.round(currentRev.total * 0.6 * 0.25).toLocaleString('vi-VN')}đ
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#eab308', display: 'inline-block' }}></span>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Quảng cáo & MKT (11%)</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '750', color: '#1e293b' }}>
                          {Math.round(currentRev.total * 0.6 * 0.11).toLocaleString('vi-VN')}đ
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Row 3: CSS Bar Chart */}
            <div className="admin-card-panel" style={{ marginBottom: '30px' }}>
              <div className="admin-card-header">
                <div>
                  <h3 className="admin-card-title">
                    <i className="fa-solid fa-chart-column" style={{ color: 'var(--orange)', marginRight: '8px' }}></i> Biểu đồ doanh thu chi tiết
                  </h3>
                  <p className="admin-card-desc">
                    {timeRangeType === 'month' ? 'Phân tích tổng doanh số phát sinh theo từng tháng (Đơn vị: VNĐ)' : 'Phân tích tổng doanh số phát sinh theo từng tuần (Đơn vị: VNĐ)'}
                  </p>
                </div>
              </div>

              {/* CSS Bar Chart */}
              <div className="admin-chart-wrapper" style={{ marginTop: '20px' }}>
                <div className="admin-chart-bars" style={{ height: '240px' }}>
                  {selectedPeriodData.map((item, idx) => {
                    const pct = Math.round((item.total / maxVal) * 100);
                    const labelStr = timeRangeType === 'month'
                      ? `Tháng ${item.monthKey.slice(5)}/${item.monthKey.slice(0,4)}`
                      : `Tuần ${new Date(item.weekStart).toLocaleDateString('vi-VN').slice(0, 5)}`;
                    
                    return (
                      <div key={idx} className="admin-chart-col">
                        <div 
                          className="admin-chart-bar active" 
                          style={{ height: `${pct}%` }}
                          data-value={`${(item.total / 1000000).toFixed(2)}M`}
                        ></div>
                        <span className="admin-chart-label" style={{ fontSize: '0.7rem' }}>{labelStr}</span>
                      </div>
                    );
                  })}
                  {selectedPeriodData.length === 0 && (
                    <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontWeight: '600' }}>
                      Không có dữ liệu doanh thu trong khoảng thời gian này.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Row 4: Doanh thu vs Lợi nhuận ròng */}
            <div className="admin-card-panel">
              <h4 className="analytics-section-title" style={{ marginBottom: '10px' }}>
                <i className="fa-solid fa-chart-line" style={{ color: '#10b981', marginRight: '8px' }}></i> So sánh Doanh thu & Lợi nhuận ròng thực tế
              </h4>
              <p className="admin-card-desc" style={{ marginBottom: '24px' }}>Dữ liệu đối chiếu doanh thu tổng và lợi nhuận thực thu sau khi khấu trừ 60% chi phí vận hành.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(selectedPeriodData.length, 1)}, 1fr)`, gap: '15px', height: '220px', alignItems: 'end', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
                  {selectedPeriodData.map((item, idx) => {
                    const revPct = Math.round((item.total / maxVal) * 100);
                    const profitPct = Math.round((item.profit / maxVal) * 100);
                    const labelStr = timeRangeType === 'month'
                      ? `Tháng ${item.monthKey.slice(5)}/${item.monthKey.slice(0,4)}`
                      : `Tuần ${new Date(item.weekStart).toLocaleDateString('vi-VN').slice(0, 5)}`;
                    
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'end', gap: '4px' }}>
                        {/* Dual Bars */}
                        <div style={{ display: 'flex', alignItems: 'end', gap: '4px', height: '80%', width: '100%', justifyContent: 'center' }}>
                          {/* Revenue Bar */}
                          <div 
                            style={{ 
                              width: '12px', 
                              height: `${revPct}%`, 
                              backgroundColor: '#ffe8d6', 
                              borderTopLeftRadius: '3px', 
                              borderTopRightRadius: '3px'
                            }}
                            title={`Doanh thu: ${item.total.toLocaleString('vi-VN')}đ`}
                          />
                          {/* Profit Bar */}
                          <div 
                            style={{ 
                              width: '12px', 
                              height: `${profitPct}%`, 
                              backgroundColor: '#10b981', 
                              borderTopLeftRadius: '3px', 
                              borderTopRightRadius: '3px'
                            }}
                            title={`Lợi nhuận: ${item.profit.toLocaleString('vi-VN')}đ`}
                          />
                        </div>
                        <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#64748b' }}>{labelStr}</span>
                      </div>
                    );
                  })}
                  {selectedPeriodData.length === 0 && (
                    <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontWeight: '600' }}>
                      Không có dữ liệu phân tích trong khoảng thời gian này.
                    </div>
                  )}
                </div>

                {/* Legend for Row 4 */}
                <div style={{ display: 'flex', gap: '20px', fontSize: '0.82rem', fontWeight: 'bold', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', backgroundColor: '#ffe8d6', borderRadius: '3px', display: 'inline-block' }}></span>
                    <span style={{ color: '#64748b' }}>Doanh thu (VNĐ)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '3px', display: 'inline-block' }}></span>
                    <span style={{ color: '#64748b' }}>Lợi nhuận ròng (VNĐ)</span>
                  </div>
                </div>
              </div>
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

      case 'thongbao':
        return (
          <div className="admin-card-panel" style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <div className="admin-card-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="admin-card-title" style={{ margin: 0, textTransform: 'none', fontSize: '1.25rem', fontWeight: 'bold' }}>Thông báo hệ thống</h3>
              {notifications.filter(n => n.unread).length > 0 && (
                <span className="admin-link-action" style={{ color: 'var(--orange)', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem' }} onClick={markAllNotifsRead}>Đánh dấu tất cả đã đọc</span>
              )}
            </div>
            <div className="admin-notif-list" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.map((n) => (
                <div className={`admin-notif-item ${n.unread ? 'unread' : ''}`} key={n.id} onClick={() => handleNotificationClick(n)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: n.unread ? '#fff8f1' : '#f8fafc', borderRadius: '8px', border: n.unread ? '1px solid #ffedd5' : '1px solid #e2e8f0', transition: 'all 0.2s', cursor: 'pointer' }}>
                  <div className="admin-notif-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: n.unread ? '#ffedd5' : '#cbd5e1', color: n.unread ? 'var(--orange)' : '#64748b', fontSize: '1.1rem' }}>
                    <i className={`fa-solid ${n.unread ? 'fa-envelope-open-text' : 'fa-envelope'}`}></i>
                  </div>
                  <div className="admin-notif-body" style={{ flex: 1, marginLeft: '16px' }}>
                    <div className="admin-notif-message" style={{ fontSize: '0.95rem', fontWeight: n.unread ? 'bold' : 'normal', color: 'var(--text)' }}>{n.message}</div>
                    <div className="admin-notif-time" style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>{n.time}</div>
                  </div>
                  <button className="admin-notif-btn-clear" style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem', padding: '8px' }} onClick={() => clearNotification(n.id)}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="admin-no-data" style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.95rem' }}>Hộp thư thông báo trống</div>
              )}
            </div>
          </div>
        );

      case 'checkin':
        return (
          <>
            <div className="admin-card-panel" style={{ padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <h3 className="admin-card-title" style={{ fontSize: '1.4rem', margin: 0, color: '#1e293b' }}>
                    QUẢN LÝ VÀO PHÒNG TẬP (CHECK-IN)
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                    Quét mã QR từ email của hội viên để thực hiện check-in.
                  </p>
                </div>
                {/* Nút Quét QR lớn nổi bật */}
                <button
                  type="button"
                  onClick={startQrScanner}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '14px 28px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f97316, #ef4444)',
                    color: '#ffffff', border: 'none',
                    fontWeight: '800', fontSize: '1.05rem',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(249,115,22,0.45)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    letterSpacing: '0.02em'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(249,115,22,0.55)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(249,115,22,0.45)'; }}
                >
                  <i className="fa-solid fa-camera" style={{ fontSize: '1.15rem' }}></i>
                  Quét mã Check-in
                </button>
              </div>

              {/* Checkin History Table */}
              <div style={{
                backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0',
                borderRadius: '16px', padding: '24px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                display: 'flex', flexDirection: 'column', minHeight: '400px',
                marginBottom: '30px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#1e293b' }}>
                    <i className="fa-solid fa-list-check" style={{ color: 'var(--orange)', marginRight: '8px' }}></i> Lịch Sử Check-in Hôm Nay
                  </h4>
                  <div className="admin-search-wrap" style={{ width: '220px', height: '36px', padding: '0 10px' }}>
                    <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '0.8rem' }}></i>
                    <input
                      type="text" className="admin-search-input" placeholder="Tìm hội viên..."
                      value={checkinSearchQuery}
                      onChange={(e) => setCheckinSearchQuery(e.target.value)}
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div style={{ overflowY: 'auto', flex: 1, maxHeight: '500px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 8px', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Hội viên</th>
                        <th style={{ padding: '12px 8px', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>ID Hội viên</th>
                        <th style={{ padding: '12px 8px', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Thời gian vào</th>
                        <th style={{ padding: '12px 8px', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', textAlign: 'center' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checkinsList
                        .filter(c => {
                          const query = checkinSearchQuery.toLowerCase();
                          return c.memberName.toLowerCase().includes(query) ||
                                 c.email.toLowerCase().includes(query) ||
                                 c.phone.toLowerCase().includes(query) ||
                                 String(c.memberId).includes(query);
                        })
                        .map((c, index) => {
                          const checkinDate = new Date(c.checkinTime);
                          return (
                            <tr key={c.checkinId || index} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.88rem' }}>
                              <td style={{ padding: '12px 8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#ffedd5', color: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                    {c.memberName.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: '700', color: '#1e293b' }}>{c.memberName}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.phone}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '12px 8px', fontWeight: '600', color: '#475569' }}>#{c.memberId}</td>
                              <td style={{ padding: '12px 8px', color: '#334155' }}>
                                <div><strong style={{ color: 'var(--orange)' }}>{checkinDate.toLocaleTimeString('vi-VN')}</strong></div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{checkinDate.toLocaleDateString('vi-VN')}</div>
                              </td>
                              <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedCheckin(c)}
                                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                                  onMouseOver={(e) => e.target.style.borderColor = 'var(--orange)'}
                                  onMouseOut={(e) => e.target.style.borderColor = '#cbd5e1'}
                                >
                                  Xem chi tiết
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      {checkinsList.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '40px 10px', color: '#94a3b8', fontSize: '0.9rem' }}>
                            Chưa có dữ liệu check-in trong ngày hôm nay.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ── QR CAMERA SCANNER MODAL ── */}
            {qrScannerOpen && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 9999, padding: '20px'
              }}>
                <div style={{
                  backgroundColor: '#ffffff', borderRadius: '24px',
                  width: '95%', maxWidth: '720px',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
                  overflow: 'hidden', position: 'relative'
                }}>
                  {/* Header */}
                  <div style={{
                    background: 'linear-gradient(135deg, #f97316, #ef4444)',
                    padding: '22px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <i className="fa-solid fa-camera" style={{ color: '#fff', fontSize: '1.3rem' }}></i>
                      </div>
                      <div>
                        <div style={{ color: '#fff', fontWeight: '800', fontSize: '1.25rem', letterSpacing: '0.3px' }}>Quét mã QR Check-in</div>
                        <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.88rem', marginTop: '2px' }}>Đưa mã QR từ điện thoại của hội viên vào giữa khung camera lớn dưới đây</div>
                      </div>
                    </div>
                    <button onClick={closeQrScanner} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>

                  {/* Camera area */}
                  <div style={{ padding: '24px', position: 'relative' }}>
                    {/* Video + khung ngắm */}
                    {qrScanStatus === 'scanning' && (
                      <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#0f172a', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                        <video
                          ref={videoRef}
                          style={{ width: '100%', display: 'block', height: '460px', maxHeight: '70vh', objectFit: 'cover' }}
                          playsInline
                          muted
                        />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                        {/* Khung ngắm QR LỚN (290px x 290px) */}
                        <div style={{
                          position: 'absolute', top: '50%', left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '290px', height: '290px',
                          border: '2px solid rgba(249, 115, 22, 0.6)',
                          borderRadius: '20px',
                          boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.65)'
                        }}>
                          {/* Góc khung nổi bật */}
                          {[
                            { top: '-4px', left: '-4px', borderRight: 'none', borderBottom: 'none' },
                            { top: '-4px', right: '-4px', borderLeft: 'none', borderBottom: 'none' },
                            { bottom: '-4px', left: '-4px', borderRight: 'none', borderTop: 'none' },
                            { bottom: '-4px', right: '-4px', borderLeft: 'none', borderTop: 'none' }
                          ].map((corner, i) => (
                            <div key={i} style={{
                              position: 'absolute', width: '36px', height: '36px',
                              border: '4px solid #f97316', borderRadius: '6px',
                              boxShadow: '0 0 10px rgba(249, 115, 22, 0.8)',
                              ...corner
                            }} />
                          ))}
                          {/* Scanning line animation */}
                          <div style={{
                            position: 'absolute', left: 0, right: 0, height: '3px',
                            background: 'linear-gradient(90deg, transparent, #f97316, #ef4444, transparent)',
                            boxShadow: '0 0 12px #f97316',
                            animation: 'scanLine 1.6s linear infinite'
                          }} />
                        </div>
                        <div style={{ position: 'absolute', bottom: '16px', left: 0, right: 0, textAlign: 'center' }}>
                          <span style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)', color: '#fff', padding: '8px 20px', borderRadius: '30px', fontSize: '0.9rem', fontWeight: '700', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                            <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: '8px', color: '#f97316' }}></i>
                            Đang quét mã QR... Căn giữa mã vào ô ngắm
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Processing */}
                    {qrScanStatus === 'processing' && (
                      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '3rem', color: '#f97316', marginBottom: '16px' }}></i>
                        <p style={{ color: '#475569', fontWeight: '600', margin: 0 }}>{qrScanMessage}</p>
                      </div>
                    )}

                    {/* Success */}
                    {qrScanStatus === 'success' && (
                      <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                        <div style={{
                          width: '80px', height: '80px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          margin: '0 auto 16px auto',
                          boxShadow: '0 8px 24px rgba(16,185,129,0.4)'
                        }}>
                          <i className="fa-solid fa-circle-check" style={{ fontSize: '2.5rem', color: '#fff' }}></i>
                        </div>
                        <h3 style={{ color: '#059669', fontWeight: '800', fontSize: '1.4rem', margin: '0 0 8px 0' }}>CHECK-IN THÀNH CÔNG!</h3>
                        {qrScanResult && (
                          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '14px', margin: '12px 0', textAlign: 'left' }}>
                            <div style={{ fontSize: '0.85rem', color: '#166534', fontWeight: '600' }}>
                              <div><i className="fa-solid fa-user" style={{ width: '16px', marginRight: '8px' }}></i>{qrScanResult.memberName || 'Hội viên'}</div>
                              <div style={{ marginTop: '6px' }}><i className="fa-solid fa-clock" style={{ width: '16px', marginRight: '8px' }}></i>
                                {new Date(qrScanResult.checkinTime).toLocaleTimeString('vi-VN')} - {new Date(qrScanResult.checkinTime).toLocaleDateString('vi-VN')}
                              </div>
                            </div>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                          <button onClick={() => {
                            if (qrScanResult && qrScanResult.memberId) {
                              notifyCheckinComplete(qrScanResult.memberId);
                            }
                            setQrScanStatus('scanning');
                            setQrScanResult(null);
                            startQrScanner();
                          }}
                            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '2px solid #f97316', backgroundColor: '#fff', color: '#f97316', fontWeight: '700', cursor: 'pointer' }}>
                            <i className="fa-solid fa-rotate-right" style={{ marginRight: '6px' }}></i>Quét tiếp
                          </button>
                          <button onClick={closeQrScanner}
                            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>
                            Xác nhận
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Error */}
                    {qrScanStatus === 'error' && (
                      <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                        <div style={{
                          width: '80px', height: '80px', borderRadius: '50%',
                          backgroundColor: '#fef2f2', border: '3px solid #f87171',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          margin: '0 auto 16px auto'
                        }}>
                          <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '2.5rem', color: '#ef4444' }}></i>
                        </div>
                        <h3 style={{ color: '#dc2626', fontWeight: '700', fontSize: '1.15rem', margin: '0 0 8px 0' }}>Có lỗi xảy ra!</h3>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 20px 0' }}>{qrScanMessage}</p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button onClick={() => { closeQrScanner(); startQrScanner(); }}
                            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #f97316, #ef4444)', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>
                            <i className="fa-solid fa-rotate-right" style={{ marginRight: '6px' }}></i>Thử lại
                          </button>
                          <button onClick={closeQrScanner}
                            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', backgroundColor: '#fff', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>
                            Đóng
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CSS for scan line animation */}
            <style>{`
              @keyframes scanLine {
                0% { top: 0; }
                50% { top: calc(100% - 2px); }
                100% { top: 0; }
              }
            `}</style>
          </>
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
                className={`admin-menu-item ${activeTab === 'checkin' ? 'active' : ''}`}
                onClick={() => setActiveTab('checkin')}
              >
                <i className="fa-solid fa-qrcode"></i> Quản lý Check-in
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

            <button className="admin-icon-btn" style={{ position: 'relative' }} onClick={() => setActiveTab('thongbao')}>
              <i className="fa-regular fa-bell"></i>
              {notifications.filter(n => n.unread).length > 0 && (
                <span className="admin-bell-badge" style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: 'var(--orange)', color: '#fff', fontSize: '0.65rem', minWidth: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {notifications.filter(n => n.unread).length}
                </span>
              )}
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

      {/* MODAL: CHECK-IN DETAILS (BẢNG MẪU CHI TIẾT LƯỢT CHECK-IN) */}
      {selectedCheckin && (() => {
        const checkinDate = new Date(selectedCheckin.checkinTime);
        return (
          <div className="admin-modal-overlay" style={{ zIndex: 9999 }}>
            <div className="admin-modal-box" style={{ maxWidth: '650px', width: '90%', padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              
              {/* Header */}
              <div style={{ 
                background: 'linear-gradient(135deg, #1e293b, #0f172a)', 
                padding: '24px 30px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: '2px solid var(--orange)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '45px', 
                    height: '45px', 
                    borderRadius: '12px', 
                    backgroundColor: 'rgba(249, 115, 22, 0.15)', 
                    color: 'var(--orange)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '1.25rem' 
                  }}>
                    <i className="fa-solid fa-address-card"></i>
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '850', color: '#ffffff', letterSpacing: '0.5px' }}>
                      CHI TIẾT LƯỢT CHECK-IN
                    </h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                      Thông tin xác thực lượt vào phòng tập của hội viên
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setSelectedCheckin(null)}
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    border: 'none', 
                    fontSize: '1.15rem', 
                    cursor: 'pointer', 
                    color: '#94a3b8',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#94a3b8'; }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '30px', backgroundColor: '#f8fafc', overflowY: 'auto' }}>
                
                {/* Member Card Header */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '20px', 
                  backgroundColor: '#ffffff', 
                  padding: '20px', 
                  borderRadius: '16px', 
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  marginBottom: '24px'
                }}>
                  <div style={{ 
                    width: '70px', 
                    height: '70px', 
                    borderRadius: '50%', 
                    backgroundColor: '#fff7ed', 
                    border: '2px solid #ffedd5',
                    color: 'var(--orange)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontWeight: '800', 
                    fontSize: '1.75rem',
                    boxShadow: '0 4px 10px rgba(249, 115, 22, 0.1)'
                  }}>
                    {selectedCheckin.memberName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b' }}>
                      {selectedCheckin.memberName}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '700', 
                        padding: '3px 10px', 
                        borderRadius: '20px', 
                        backgroundColor: '#eff6ff', 
                        color: '#3b82f6',
                        border: '1px solid #dbeafe'
                      }}>
                        Member ID: #{selectedCheckin.memberId}
                      </span>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '700', 
                        padding: '3px 10px', 
                        borderRadius: '20px', 
                        backgroundColor: '#ecfdf5', 
                        color: '#10b981',
                        border: '1px solid #d1fae5',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                        Check-in Thành công
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details Table */}
                <div style={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: '16px', 
                  border: '1px solid #e2e8f0', 
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{ padding: '16px 20px', backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '0.85rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <i className="fa-solid fa-clipboard-list" style={{ marginRight: '8px', color: 'var(--orange)' }}></i> Bảng thông tin chi tiết
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 20px', color: '#64748b', fontWeight: '600', width: '35%' }}>Hội viên</td>
                        <td style={{ padding: '14px 20px', color: '#1e293b', fontWeight: '700' }}>{selectedCheckin.memberName}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 20px', color: '#64748b', fontWeight: '600' }}>ID Hội viên</td>
                        <td style={{ padding: '14px 20px', color: '#0f172a', fontWeight: '800', fontFamily: 'monospace', fontSize: '1.05rem' }}>#{selectedCheckin.memberId}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 20px', color: '#64748b', fontWeight: '600' }}>Địa chỉ Email</td>
                        <td style={{ padding: '14px 20px', color: '#1e293b', fontWeight: '500' }}>{selectedCheckin.email}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 20px', color: '#64748b', fontWeight: '600' }}>Số điện thoại</td>
                        <td style={{ padding: '14px 20px', color: '#1e293b', fontWeight: '600' }}>{selectedCheckin.phone}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 20px', color: '#64748b', fontWeight: '600' }}>Thời gian vào</td>
                        <td style={{ padding: '14px 20px', color: 'var(--orange)', fontWeight: '800', fontSize: '1.05rem' }}>
                          {checkinDate.toLocaleTimeString('vi-VN')}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '14px 20px', color: '#64748b', fontWeight: '600' }}>Ngày Check-in</td>
                        <td style={{ padding: '14px 20px', color: '#1e293b', fontWeight: '700' }}>
                          {checkinDate.toLocaleDateString('vi-VN')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Decorative Ticket Stub */}
                <div style={{
                  marginTop: '24px',
                  borderTop: '2px dashed #cbd5e1',
                  paddingTop: '20px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <div style={{
                    backgroundColor: '#ffffff',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    border: '1.5px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    width: '100%',
                    maxWidth: '400px',
                    position: 'relative'
                  }}>
                    <i className="fa-solid fa-ticket" style={{ fontSize: '2.5rem', color: '#cbd5e1' }}></i>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>FX FITNESS PASS</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginTop: '2px' }}>Cửa vào: PHÒNG TẬP CHÍNH (MAIN GYM)</div>
                      <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <i className="fa-solid fa-circle-check"></i> Xác nhận bởi hệ thống
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div style={{ 
                padding: '20px 30px', 
                borderTop: '1px solid #e2e8f0', 
                display: 'flex', 
                justifyContent: 'flex-end', 
                backgroundColor: '#ffffff' 
              }}>
                <button 
                  type="button" 
                  className="admin-btn-submit"
                  onClick={() => setSelectedCheckin(null)}
                  style={{ 
                    padding: '10px 30px', 
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    background: 'linear-gradient(135deg, #f97316, #ef4444)',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)',
                    cursor: 'pointer'
                  }}
                >
                  Đóng chi tiết
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default AdminDashboard;
