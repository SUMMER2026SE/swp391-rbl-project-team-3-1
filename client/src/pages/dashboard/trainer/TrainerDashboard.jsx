import React, { useState, useEffect } from 'react';
import './TrainerDashboard.css';
import { SHIFT_DEFINITIONS } from '../../../constants/shifts';

const SHIFT_MAP = {
  'CA1': '05:00 - 06:30',
  'CA2': '07:00 - 08:30',
  'CA3': '09:00 - 10:30',
  'CA4': '11:00 - 12:30',
  'CA5': '14:00 - 15:30',
  'CA6': '16:00 - 17:30',
  'CA7': '18:00 - 19:30',
};

// Helper to format Date to YYYY-MM-DD
const getTodayDateString = (dateObj) => {
  const today = dateObj || new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Dynamic date calculation helper for the weekly calendar (Monday to Sunday)
const getWeekDays = (refDateStr) => {
  const current = refDateStr ? new Date(refDateStr) : new Date();
  const day = current.getDay();
  const monday = new Date(current);
  monday.setDate(monday.getDate() - day + (day === 0 ? -6 : 1));

  const days = [];
  const dayLabels = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday);
    nextDay.setDate(monday.getDate() + i);
    const dayStr = String(nextDay.getDate()).padStart(2, '0');
    const monthStr = String(nextDay.getMonth() + 1).padStart(2, '0');
    const yearStr = nextDay.getFullYear();
    const fullDateStr = `${yearStr}-${monthStr}-${dayStr}`;
    days.push({
      key: fullDateStr,
      lbl: dayLabels[i],
      num: `${dayStr}/${monthStr}`,
      dateStr: fullDateStr
    });
  }
  return days;
};

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

  // Teaching schedule - default to current date string (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [scheduleList, setScheduleList] = useState([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(900); // 15 minutes in seconds

  // Booking requests pending PT confirmation
  const [bookingRequests, setBookingRequests] = useState([]);
  const [cancelRequests, setCancelRequests] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [offQuota, setOffQuota] = useState({ used: 0, remaining: 4, limit: 4 });
  const [myOffRequests, setMyOffRequests] = useState([]);
  const [selectedOffDate, setSelectedOffDate] = useState('');
  const [selectedCancelRequest, setSelectedCancelRequest] = useState(null);
  const [isCancelRespondLoading, setIsCancelRespondLoading] = useState(false);
  const [trainerCancelModalOpen, setTrainerCancelModalOpen] = useState(false);
  const [trainerCancelAppointmentId, setTrainerCancelAppointmentId] = useState(null);
  const [trainerCancelReason, setTrainerCancelReason] = useState('');
  const [isTrainerCancelSubmitting, setIsTrainerCancelSubmitting] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);

  const reloadNotifications = () => {
    if (!token) return;
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
            time: n.created_at ? new Date(n.created_at).toLocaleString('vi-VN') : 'Vừa xong'
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

  // Set up real-time notification stream via SSE
  useEffect(() => {
    if (!token) return;
    
    const streamUrl = `/api/notifications/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(streamUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.connected) {
          console.log('[SSE PT] Connected to notification stream.');
          return;
        }

        const newNotif = {
          id: data.notification_id,
          message: data.content,
          title: data.title,
          type: data.notification_type,
          unread: !data.is_read,
          time: data.created_at ? new Date(data.created_at).toLocaleString('vi-VN') : 'Vừa xong'
        };

        setNotifications(prev => {
          if (prev.some(n => n.id === newNotif.id)) return prev;
          return [newNotif, ...prev];
        });

        // Realtime auto-refresh on booking/schedule events
        if (['NEW_OFF_REQUEST', 'OFF_REQUEST_CREATED', 'OFF_REQUEST_APPROVED', 'OFF_REQUEST_REJECTED', 'OFF_REQUEST_CANCELLED', 'BOOKING_CREATED', 'BOOKING_APPROVED', 'BOOKING_REJECTED', 'BOOKING_CANCELLED', 'SCHEDULE_SLOT_UPDATED'].includes(data.type || newNotif.type)) {
          reloadTrainerDashboardData();
          fetchBusySchedules();
          setRefreshTrigger(prev => prev + 1);
        }

      } catch (err) {
        console.error('[SSE PT] Error processing stream message:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('[SSE PT] Stream connection error:', err);
    };

    return () => {
      eventSource.close();
      console.log('[SSE PT] Closed stream connection.');
    };
  }, [token]);

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
  const [successModal, setSuccessModal] = useState({ show: false, message: '' });
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [workoutTemplates, setWorkoutTemplates] = useState([]);
  const [busySchedules, setBusySchedules] = useState([]);
  const [localSchedules, setLocalSchedules] = useState([]);
  const [busyWeekStart, setBusyWeekStart] = useState(new Date());

  const TIME_SLOTS = [
  { shiftCode: 'CA1', start: '05:00:00', end: '06:30:00', label: '05:00 - 06:30' },
  { shiftCode: 'CA2', start: '07:00:00', end: '08:30:00', label: '07:00 - 08:30' },
  { shiftCode: 'CA3', start: '09:00:00', end: '10:30:00', label: '09:00 - 10:30' },
  { shiftCode: 'CA4', start: '11:00:00', end: '12:30:00', label: '11:00 - 12:30' },
  { shiftCode: 'CA5', start: '14:00:00', end: '15:30:00', label: '14:00 - 15:30' },
  { shiftCode: 'CA6', start: '16:00:00', end: '17:30:00', label: '16:00 - 17:30' },
  { shiftCode: 'CA7', start: '18:00:00', end: '19:30:00', label: '18:00 - 19:30' }
];

  // Get progress tracking data from localStorage for a selected member
  const getMemberProgress = (member) => {
    if (!member) return { workoutPct: 0, mealPct: 0, completedExercises: {}, completedMeals: {}, hasCurrentWorkout: false, currentMeals: [] };

    const isTodayOrFuture = (dateVal) => {
      if (!dateVal) return false;
      const planDate = new Date(dateVal);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      planDate.setHours(0, 0, 0, 0);
      return planDate >= today;
    };

    try {
      const saved = localStorage.getItem(`member_progress_${member.id}`);
      const completedExercises = saved ? (JSON.parse(saved).completedExercises || {}) : {};
      const completedMeals = saved ? (JSON.parse(saved).completedMeals || {}) : {};

      // Calculate Workout Plan Progress (only if the plan is current or future)
      let workoutPct = 0;
      let hasCurrentWorkout = false;
      if (member.workoutPlanId && member.workoutExercisesCount > 0 && isTodayOrFuture(member.workoutCreatedAt)) {
        hasCurrentWorkout = true;
        if (member.isCompleted) {
          workoutPct = 100;
        } else {
          let checkedCount = 0;
          for (let idx = 0; idx < member.workoutExercisesCount; idx++) {
            const key = `db-${member.workoutPlanId}-${idx}`;
            if (completedExercises[key]) {
              checkedCount++;
            }
          }
          workoutPct = Math.round((checkedCount / member.workoutExercisesCount) * 100);
        }
      }

      return { workoutPct, mealPct: 0, completedExercises, completedMeals: {}, hasCurrentWorkout, currentMeals: [] };
    } catch (e) {
      console.error('Error reading member progress from localStorage:', e);
    }
    return { workoutPct: 0, mealPct: 0, completedExercises: {}, completedMeals: {}, hasCurrentWorkout: false, currentMeals: [] };
  };

  // Certifications & Progress Tracking States
  const [certifications, setCertifications] = useState([]);
  const [newCertName, setNewCertName] = useState('');
  const [progressRecords, setProgressRecords] = useState([]);
  const [newProgress, setNewProgress] = useState({ height: '', weight: '', bodyFat: '', muscleMass: '', note: '' });
  const [showProgressForm, setShowProgressForm] = useState(false);

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

    fetch('/api/bookings/pt/pending', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.bookings) {
          const pendingMapped = data.bookings.map(b => ({
            id: b.bookingId,
            name: b.memberName,
            time: SHIFT_MAP[b.shiftCode] || b.shiftCode,
            shiftCode: b.shiftCode,
            date: b.sessionDate,
            note: b.note,
            createdAt: b.createdAt
          }));
          setBookingRequests(pendingMapped);
        }
      })
      .catch(err => console.error('Error fetching PT pending bookings:', err));

    fetch('/api/dashboard/trainer/off-requests/quota', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data) {
          setOffQuota({
            used: data.used || 0,
            remaining: data.remaining !== undefined ? data.remaining : 4,
            limit: data.limit || 4
          });
          if (data.requests) {
            setMyOffRequests(data.requests);
          }
        }
      })
      .catch(err => console.error('Error fetching off quota:', err));

    fetch('/api/certifications', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.certifications) {
          setCertifications(data.certifications);
        }
      })
      .catch(err => console.error('Error fetching certifications:', err));

    fetch('/api/workout-plans/templates', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setWorkoutTemplates(data);
        }
      })
      .catch(err => console.error('Error fetching workout templates:', err));


  };

  useEffect(() => {
    reloadTrainerDashboardData();
    reloadNotifications();
  }, [token]);

  useEffect(() => {
    if (selectedMember && activeTab === 'hocvien') {
      fetch(`/api/progress/${selectedMember.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.progress) {
            setProgressRecords(data.progress);
          }
        })
        .catch(err => console.error('Error fetching progress:', err));
    }
  }, [selectedMember, activeTab, token]);

  const fetchBusySchedules = () => {
    if (!token) return;

    // Normalize busyWeekStart to Monday
    const start = new Date(busyWeekStart);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const startStr = getTodayDateString(start);
    const endStr = getTodayDateString(end);

    fetch(`/api/bookings/trainer/me/schedule?from=${startStr}&to=${endStr}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.schedule) {
          setLocalSchedules(data.schedule);
          
          const list = [];
          data.schedule.forEach(day => {
            day.shifts.forEach(shift => {
              if (shift.status === 'Approved' || shift.status === 'CancelPending' || shift.status === 'Cancelled') {
                list.push({
                  id: shift.bookingId,
                  date: day.date,
                  time: `${shift.start} - ${shift.end}`,
                  member: shift.memberName || 'Hội viên',
                  type: 'Đặt lịch tập cá nhân',
                  status: shift.status,
                  cancelRequestedBy: shift.cancelRequestedBy,
                  cancelReason: shift.cancelReason
                });
              }
            });
          });
          setScheduleList(list);
        }
      })
      .catch(err => console.error('Error fetching combined schedules:', err));
  };

  useEffect(() => {
    if (activeTab === 'quanlylich' || activeTab === 'lichday') {
      fetchBusySchedules();
    }
  }, [activeTab, busyWeekStart, token, refreshTrigger]);

  const handleToggleLocalSlot = (dateStr, startTime, endTime) => {
    const [yr, mo, dy] = dateStr.split('-').map(Number);
    const [h, m, s] = startTime.split(':').map(Number);
    const slotDate = new Date(yr, mo - 1, dy, h, m, s || 0);
    if (slotDate < new Date()) {
      alert('Không thể thay đổi lịch của thời gian đã qua!');
      return;
    }

    const existingIdx = localSchedules.findIndex(s => 
      s.workingDate === dateStr && s.startTime.startsWith(startTime.substring(0,5))
    );

    if (existingIdx > -1) {
      const updated = [...localSchedules];
      const currentStatus = updated[existingIdx].status;
      if (currentStatus === 'Busy') {
        updated[existingIdx] = {
          ...updated[existingIdx],
          status: 'Available'
        };
      } else {
        updated[existingIdx] = {
          ...updated[existingIdx],
          status: 'Busy'
        };
      }
      setLocalSchedules(updated);
    } else {
      setLocalSchedules([
        ...localSchedules,
        {
          workingDate: dateStr,
          startTime: startTime,
          endTime: endTime,
          status: 'Busy'
        }
      ]);
    }
  };

  const handleSaveSchedules = () => {
    if (!token) return;
    const start = new Date(busyWeekStart);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const busySlots = localSchedules
      .filter(s => s.status === 'Busy')
      .map(s => ({
        date: s.workingDate,
        startTime: s.startTime,
        endTime: s.endTime
      }));

    fetch('/api/dashboard/trainer/schedule/bulk-save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        startDate: getTodayDateString(start),
        endDate: getTodayDateString(end),
        busySlots
      })
    })
      .then(async res => {
        const data = await res.json();
        if (res.ok) {
          alert('Đã lưu lịch bận thành công!');
          fetchBusySchedules();
        } else {
          alert(data.message || 'Lỗi khi lưu lịch bận!');
        }
      })
      .catch(err => console.error('Error saving schedules:', err));
  };

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
    if (!window.confirm('Bạn có chắc chắn muốn xác nhận (Approve) yêu cầu đặt lịch này?')) return;
    fetch(`/api/bookings/pt/${reqId}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) return res.json().then(err => { throw new Error(err.message); });
        return res.json();
      })
      .then(data => {
        alert(data.message || 'Đã xác nhận lịch dạy thành công!');
        reloadTrainerDashboardData();
        setRefreshTrigger(prev => prev + 1); // Refresh calendar TKB
      })
      .catch(err => alert(err.message || 'Lỗi khi xác nhận lịch dạy!'));
  };

  const handleRejectAppointment = (reqId) => {
    const reason = window.prompt('Nhập lý do từ chối yêu cầu đặt lịch này:');
    if (reason === null) return; // User clicked Cancel
    
    fetch(`/api/bookings/pt/${reqId}/reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ reason: reason || 'HLV bận ca này' })
    })
      .then(res => {
        if (!res.ok) return res.json().then(err => { throw new Error(err.message); });
        return res.json();
      })
      .then(data => {
        alert(data.message || 'Đã từ chối yêu cầu đặt lịch!');
        reloadTrainerDashboardData();
        setRefreshTrigger(prev => prev + 1); // Refresh calendar TKB
      })
      .catch(err => alert(err.message || 'Lỗi khi từ chối yêu cầu!'));
  };

  const handleRegisterOffRequest = () => {
    if (!selectedOffDate) {
      alert('Vui lòng chọn ngày muốn xin nghỉ!');
      return;
    }
    if (offQuota.remaining <= 0) {
      alert('Bạn đã hết lượt xin nghỉ phép trong tháng này!');
      return;
    }

    fetch('/api/dashboard/trainer/off-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ dates: [selectedOffDate] })
    })
      .then(res => {
        if (!res.ok) return res.json().then(err => { throw new Error(err.message); });
        return res.json();
      })
      .then(data => {
        alert(data.message || 'Đã gửi yêu cầu nghỉ phép thành công!');
        setSelectedOffDate('');
        reloadTrainerDashboardData();
        fetchBusySchedules();
        setRefreshTrigger(prev => prev + 1);
      })
      .catch(err => alert(err.message || 'Lỗi khi gửi yêu cầu nghỉ phép!'));
  };

  const handleCancelOffRequest = (reqId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy yêu cầu nghỉ phép này?')) return;
    fetch(`/api/dashboard/trainer/off-requests/${reqId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) return res.json().then(err => { throw new Error(err.message); });
        return res.json();
      })
      .then(data => {
        alert(data.message || 'Đã hủy yêu cầu thành công!');
        reloadTrainerDashboardData();
        fetchBusySchedules();
        setRefreshTrigger(prev => prev + 1);
      })
      .catch(err => alert(err.message || 'Lỗi khi hủy yêu cầu!'));
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
      setActiveTab('quanlylich');
    } else {
      setActiveTab('lichday');
    }
  };

  const handleRespondCancelRequest = (reqId, action) => {
    setIsCancelRespondLoading(true);
    fetch(`/api/dashboard/trainer/appointments/${reqId}/cancel-respond`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ action })
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message || 'Đã xử lý yêu cầu thành công!');
        setSelectedCancelRequest(null);
        reloadTrainerDashboardData();
        fetchBusySchedules();
        setRefreshTrigger(prev => prev + 1);
      })
      .catch(err => {
        console.error('Error responding to cancel request:', err);
        alert('Có lỗi xảy ra khi phản hồi yêu cầu hủy lịch!');
      })
      .finally(() => {
        setIsCancelRespondLoading(false);
      });
  };

  const handleTrainerCancelClick = (id) => {
    setTrainerCancelAppointmentId(id);
    setTrainerCancelReason('');
    setTrainerCancelModalOpen(true);
  };

  const submitTrainerCancellationRequest = () => {
    if (!trainerCancelAppointmentId || !trainerCancelReason.trim()) return;

    setIsTrainerCancelSubmitting(true);
    fetch(`/api/dashboard/trainer/appointments/${trainerCancelAppointmentId}/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ reason: trainerCancelReason })
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.message || 'Lỗi server'); });
        }
        return res.json();
      })
      .then(data => {
        alert(data.message || 'Đã gửi yêu cầu hủy lịch dạy thành công!');
        setTrainerCancelModalOpen(false);
        setTrainerCancelReason('');
        setTrainerCancelAppointmentId(null);
        reloadTrainerDashboardData();
        fetchBusySchedules();
        setRefreshTrigger(prev => prev + 1);
      })
      .catch(err => {
        console.error(err);
        alert(err.message || 'Có lỗi xảy ra khi gửi yêu cầu hủy lịch!');
      })
      .finally(() => {
        setIsTrainerCancelSubmitting(false);
      });
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
        setSuccessModal({
          show: true,
          message: data.message || `Đã giao giáo án "${templateName}" thành công!`
        });
        reloadTrainerDashboardData();
      })
      .catch(err => console.error('Error assigning workout:', err));
  };

  const handleAssignCustomWorkout = (e) => {
    e.preventDefault();
    if (!customWorkoutName.trim()) return;
    handleAssignWorkoutTemplate(customWorkoutName);
    setCustomWorkoutName('');
  };

  const handleToggleMemberExercise = (memberId, planId, exerciseIdx) => {
    try {
      const key = `db-${planId}-${exerciseIdx}`;
      const saved = localStorage.getItem(`member_progress_${memberId}`);
      const parsed = saved ? JSON.parse(saved) : {};
      const completedExercises = parsed.completedExercises || {};
      
      completedExercises[key] = !completedExercises[key];
      
      localStorage.setItem(`member_progress_${memberId}`, JSON.stringify({
        ...parsed,
        completedExercises
      }));
      
      // Force refresh of the component state
      setRefreshTrigger(prev => prev + 1);
    } catch (e) {
      console.error('Error toggling member exercise:', e);
    }
  };

  const handleFinishProgress = (member, progressData) => {
    if (!member) return;

    const hasActiveWorkout = progressData.hasCurrentWorkout;

    if (!hasActiveWorkout) {
      alert('Học viên này hiện tại chưa có giáo án nào đang kích hoạt!');
      return;
    }

    const isWorkoutDone = progressData.workoutPct === 100;

    if (!isWorkoutDone) {
      alert('Học viên chưa hoàn thành đủ 100% tiến độ bài tập!');
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn kết thúc tiến độ của học viên ${member.name} không?\n\nGiáo án hiện tại sẽ được lưu trữ vào Lịch sử và tiến độ hôm nay của hội viên sẽ được cài lại mặc định.`)) {
      return;
    }

    fetch('/api/dashboard/trainer/finish-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ memberId: member.id })
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.message); });
        }
        return res.json();
      })
      .then(data => {
        alert(data.message || 'Đã kết thúc tiến độ học viên thành công!');
        try {
          localStorage.removeItem(`member_progress_${member.id}`);
        } catch (e) {
          console.error('Error clearing member progress from localStorage:', e);
        }
        setSelectedMember(null);
        reloadTrainerDashboardData();
      })
      .catch(err => {
        console.error('Error finishing progress:', err);
        alert(err.message || 'Lỗi server khi kết thúc tiến độ!');
      });
  };

  const handleStartSession = () => {
    setIsSessionActive(true);
    setSessionTimer(900); // 15 mins simulation
    alert('Bắt đầu buổi tập thành công! Đồng hồ đếm ngược đang kích hoạt.');
  };

  const handlePrevWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    setSelectedDate(getTodayDateString(d));
  };

  const handleNextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    setSelectedDate(getTodayDateString(d));
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

  const handleAddCertification = (e) => {
    e.preventDefault();
    if (!newCertName.trim()) return;

    fetch('/api/certifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ certificationName: newCertName })
    })
      .then(res => res.json())
      .then(data => {
        if (data.certification) {
          setCertifications([data.certification, ...certifications]);
          setNewCertName('');
          alert('Đã thêm chứng chỉ mới!');
        }
      })
      .catch(err => console.error('Error adding certification:', err));
  };

  const handleDeleteCertification = (id) => {
    if (!window.confirm('Xóa chứng chỉ này?')) return;
    fetch(`/api/certifications/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(() => {
        setCertifications(certifications.filter(c => c.certification_id !== id));
      })
      .catch(err => console.error('Error deleting certification:', err));
  };

  const handleAddProgress = (e) => {
    e.preventDefault();
    if (!selectedMember) return;

    fetch('/api/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        memberId: selectedMember.id,
        ...newProgress
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.progress) {
          setProgressRecords([data.progress, ...progressRecords]);
          setNewProgress({ height: '', weight: '', bodyFat: '', muscleMass: '', note: '' });
          setShowProgressForm(false);
          alert('Đã ghi nhận tiến độ!');

          // Update selected member's basic stats if changed
          if (newProgress.weight || newProgress.height) {
            setSelectedMember({
              ...selectedMember,
              weight: newProgress.weight || selectedMember.weight,
              height: newProgress.height || selectedMember.height
            });
            reloadTrainerDashboardData(); // Refresh list
          }
        }
      })
      .catch(err => console.error('Error adding progress:', err));
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
                  {scheduleList.filter(s => s.date === selectedDate).length}
                </span>
                <div className="trainer-stat-subtext">
                  Còn lại {scheduleList.filter(s => s.date === selectedDate).length - (isSessionActive ? 1 : 0)} buổi dạy
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
                        <th>Ngày còn lại</th>
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
                          <td>{m.remainingDays} ngày</td>
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
                  <div className="trainer-calendar-days-row" style={{ gridTemplateColumns: 'repeat(7, 1fr)', maxWidth: '100%' }}>
                    {getWeekDays(selectedDate).map(d => (
                      <div
                        key={d.key}
                        className={`trainer-calendar-day-header ${selectedDate === d.dateStr ? 'active' : ''}`}
                        onClick={() => setSelectedDate(d.dateStr)}
                      >
                        <div className="trainer-calendar-day-name">{d.lbl}</div>
                        <div className="trainer-calendar-day-num">{d.num}</div>
                      </div>
                    ))}
                  </div>

                  <div className="trainer-schedule-slots-stack">
                    {scheduleList.filter(s => s.date === selectedDate).map((item) => (
                      <div key={item.id} className={`trainer-schedule-card ${item.active ? 'active' : ''}`}>
                        <div>
                          <div className="trainer-schedule-time">{item.time}</div>
                          <div className="trainer-schedule-member">{item.member}</div>
                        </div>
                        <span className="trainer-schedule-type">{item.type}</span>
                      </div>
                    ))}
                    {scheduleList.filter(s => s.date === selectedDate).length === 0 && (
                      <div className="trainer-no-data" style={{ padding: '30px 10px' }}>Trống lịch dạy cho ngày này</div>
                    )}
                    <div className="trainer-btn-add-slot" onClick={() => { setActiveTab('lichday'); alert('Bạn đang được chuyển đến trang đặt lịch dạy...'); }}>
                      <i className="fa-solid fa-plus"></i> Thêm giờ dạy mới
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        );

      case 'hocvien':
        {
          const progress = selectedMember ? getMemberProgress(selectedMember) : { workoutPct: 0, mealPct: 0, completedExercises: {}, completedMeals: {} };
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
                          <div className="trainer-member-card-info" style={{ color: 'var(--orange)', fontWeight: 'bold' }}>Còn lại: {m.remainingDays} ngày</div>
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
                          <div style={{ fontWeight: 'bold', color: 'var(--orange)', marginTop: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{progress.hasCurrentWorkout ? selectedMember.workoutAssigned : 'Chưa phân công'}</span>
                            {progress.hasCurrentWorkout && (
                              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Hoàn thành {progress.workoutPct}%</span>
                            )}
                          </div>
                          {progress.hasCurrentWorkout && (
                            <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                              <div style={{ width: `${progress.workoutPct}%`, height: '100%', backgroundColor: 'var(--orange)', borderRadius: '3px', transition: 'width 0.3s ease' }}></div>
                            </div>
                          )}
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                          <button
                            type="button"
                            className="trainer-btn-submit"
                            style={{
                              padding: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              background: 'linear-gradient(135deg, var(--orange) 0%, #f97316 100%)',
                              border: 'none',
                              color: '#fff',
                              borderRadius: '8px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              boxShadow: '0 4px 10px rgba(249, 115, 22, 0.2)',
                              transition: 'transform 0.2s ease',
                              width: '100%',
                              margin: 0
                            }}
                            onClick={() => setShowProgressModal(true)}
                          >
                            <i className="fa-solid fa-square-poll-vertical"></i> Theo dõi tiến độ
                          </button>
                          
                          <button
                            type="button"
                            className="trainer-btn-submit"
                            disabled={progress.workoutPct < 100 || selectedMember.isCompleted}
                            style={{
                              padding: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              background: selectedMember.isCompleted
                                ? '#e2e8f0'
                                : progress.workoutPct < 100
                                ? '#cbd5e1'
                                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              border: 'none',
                              color: (progress.workoutPct < 100 || selectedMember.isCompleted) ? '#94a3b8' : '#fff',
                              borderRadius: '8px',
                              fontWeight: 'bold',
                              cursor: (progress.workoutPct < 100 || selectedMember.isCompleted) ? 'not-allowed' : 'pointer',
                              boxShadow: (progress.workoutPct < 100 || selectedMember.isCompleted) ? 'none' : '0 4px 10px rgba(16, 185, 129, 0.2)',
                              transition: 'transform 0.2s ease',
                              width: '100%',
                              margin: 0
                            }}
                            onClick={() => handleFinishProgress(selectedMember, progress)}
                            title={selectedMember.isCompleted ? "Buổi tập đã hoàn thành & kết thúc" : progress.workoutPct < 100 ? "Cần hoàn thành 100% bài tập để kết thúc tiến độ" : "Kết thúc tiến độ giáo án"}
                          >
                            <i className="fa-solid fa-circle-check"></i> {selectedMember.isCompleted ? "Đã kết thúc tiến độ" : "Kết thúc tiến độ"}
                          </button>
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
                          {workoutTemplates.map((temp, idx) => (
                            <div
                              key={idx}
                              className={`trainer-template-card ${customWorkoutName === temp.title ? 'active' : ''}`}
                              onClick={() => setCustomWorkoutName(temp.title)}
                            >
                              <div className="trainer-template-card-title">{temp.title}</div>
                              <div className="trainer-template-card-desc">{temp.description || temp.desc}</div>
                            </div>
                          ))}
                          {workoutTemplates.length === 0 && (
                            <div style={{ fontSize: '0.86rem', color: '#94a3b8', padding: '10px' }}>Không có giáo án mẫu cho môn của bạn</div>
                          )}
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


                  </div>
                </div>
              )}
            </div>
          );
        }

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
                        Học viên <span className="name">{req.name}</span> đăng ký buổi tập lúc <span className="time">{req.time}</span>{req.date ? <> ngày <span className="date" style={{ color: 'var(--orange)', fontWeight: 'bold' }}>{req.date.includes('-') ? req.date.split('-').reverse().join('/') : req.date}</span></> : ''}. <br />
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

            {cancelRequests.length > 0 && (
              <div className="trainer-appointment-requests" style={{ marginTop: '20px', borderLeft: '4px solid #ef4444' }}>
                <h3 className="trainer-card-title" style={{ color: '#ef4444' }}>Yêu cầu hủy lịch hẹn chờ duyệt</h3>
                {cancelRequests.map((req) => {
                  let reqTimeStr = 'Hôm nay';
                  if (req.cancelRequestedAt) {
                    reqTimeStr = new Date(req.cancelRequestedAt).toLocaleDateString('vi-VN');
                  }
                  const dateStr = req.date && req.date.includes('-') ? req.date.split('-').reverse().join('/') : req.date;

                  return (
                    <div className="trainer-request-row" key={req.id}>
                      <div className="trainer-request-member-info">
                        <div className="trainer-request-avatar" style={{ backgroundColor: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fa-solid fa-calendar-times"></i>
                        </div>
                        <div className="trainer-request-text">
                          Học viên <span className="name" style={{ fontWeight: 'bold' }}>{req.name}</span> gửi yêu cầu hủy lịch hẹn ngày <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{reqTimeStr}</span>. <br />
                          <span style={{ fontSize: '0.85rem' }}>Lịch dạy ngày <span style={{ fontWeight: 'bold' }}>{dateStr}</span>, ca <span style={{ fontWeight: 'bold' }}>{req.time}</span>.</span>
                        </div>
                      </div>
                      <div className="trainer-request-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span 
                          onClick={() => setSelectedCancelRequest(req)} 
                          style={{ color: 'var(--orange)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.88rem' }}
                        >
                          Xem chi tiết
                        </span>
                        <button className="trainer-btn-confirm" onClick={() => handleRespondCancelRequest(req.id, 'accept')}>Chấp nhận</button>
                        <button className="trainer-btn-reject" onClick={() => handleRespondCancelRequest(req.id, 'reject')}>Từ chối</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="trainer-card-panel">
              <h3 className="trainer-card-title" style={{ marginBottom: '20px' }}>Lịch dạy tuần chi tiết</h3>

              {/* Interactive Calendar Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  className="trainer-banner-btn-white"
                  style={{ padding: '8px 16px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1' }}
                  onClick={handlePrevWeek}
                >
                  <i className="fa-solid fa-chevron-left"></i> Tuần trước
                </button>
                <input
                  type="date"
                  className="trainer-form-input"
                  style={{ width: '160px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                <button
                  type="button"
                  className="trainer-banner-btn-white"
                  style={{ padding: '8px 16px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1' }}
                  onClick={handleNextWeek}
                >
                  Tuần sau <i className="fa-solid fa-chevron-right"></i>
                </button>
                <button
                  type="button"
                  className="trainer-link-action"
                  style={{ fontWeight: 'bold', marginLeft: 'auto', border: 'none', background: 'none' }}
                  onClick={() => setSelectedDate(getTodayDateString())}
                >
                  <i className="fa-solid fa-calendar-day"></i> Về hôm nay
                </button>
              </div>

              <div className="trainer-weekly-calendar">
                <div className="trainer-calendar-days-row" style={{ gridTemplateColumns: 'repeat(7, 1fr)', maxWidth: '100%' }}>
                  {getWeekDays(selectedDate).map(d => (
                    <div
                      key={d.key}
                      className={`trainer-calendar-day-header ${selectedDate === d.dateStr ? 'active' : ''}`}
                      onClick={() => setSelectedDate(d.dateStr)}
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
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheduleList.filter(s => s.date === selectedDate).map((item) => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 'bold', color: 'var(--orange)' }}>{item.time}</td>
                          <td className="trainer-table-name">{item.member}</td>
                          <td>{item.type}</td>
                          <td>
                            {item.status === 'CancelPending' ? (
                              <span className="member-badge-status pending" style={{ backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>Chờ duyệt hủy</span>
                            ) : (
                              <span className="member-badge-status confirmed">Đã lên lịch</span>
                            )}
                          </td>
                          <td>
                            {item.status === 'CancelPending' ? (
                            item.cancelRequestedBy === 'MEMBER' ? (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <span 
                                    onClick={() => setSelectedCancelRequest({
                                      id: item.id,
                                      name: item.member,
                                      date: item.date,
                                      time: item.time,
                                      cancelReason: item.cancelReason,
                                      cancelRequestedAt: null
                                    })}
                                    style={{ color: 'var(--orange)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.82rem', marginRight: '6px' }}
                                  >
                                    Xem lý do
                                  </span>
                                  <button 
                                    onClick={() => handleRespondCancelRequest(item.id, 'accept')}
                                    style={{ padding: '4px 8px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                                  >
                                    Đồng ý
                                  </button>
                                  <button 
                                    onClick={() => handleRespondCancelRequest(item.id, 'reject')}
                                    style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                                  >
                                    Từ chối
                                  </button>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>Đang chờ duyệt hủy</span>
                              )
                            ) : item.status === 'Completed' ? null : (
                              <button 
                                onClick={() => handleTrainerCancelClick(item.id)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.88rem' }}
                              >
                                Yêu cầu hủy
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {scheduleList.filter(s => s.date === selectedDate).length === 0 && (
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

      case 'quanlylich':
        {
          const startOfWeek = new Date(busyWeekStart);
          const day = startOfWeek.getDay();
          const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
          startOfWeek.setDate(diff);

          const days = [];
          for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            days.push(d);
          }

          const handlePrevBusyWeek = () => {
            const newDate = new Date(busyWeekStart);
            newDate.setDate(busyWeekStart.getDate() - 7);
            setBusyWeekStart(newDate);
          };

          const handleNextBusyWeek = () => {
            const newDate = new Date(busyWeekStart);
            newDate.setDate(busyWeekStart.getDate() + 7);
            setBusyWeekStart(newDate);
          };


          return (
            <div className="trainer-plan-builder">
              {/* Quota phép card */}
              <div className="trainer-card-panel" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <div>
                  <h3 className="trainer-card-title" style={{ margin: 0, color: '#1e40af' }}>Hạn mức nghỉ phép (Quota)</h3>
                  <p style={{ margin: '5px 0 0', fontSize: '0.9rem', color: '#1e3a8a' }}>
                    Đã đăng ký tháng này: <strong>{offQuota.used} / {offQuota.limit} ngày</strong> (Còn lại: <strong>{offQuota.remaining} ngày</strong>)
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.8rem', color: '#2563eb' }}>
                  <i className="fa-solid fa-umbrella-beach"></i>
                </div>
              </div>

              <div className="trainer-card-panel">
                <h3 className="trainer-card-title" style={{ marginBottom: '10px' }}>Thời khóa biểu của bạn</h3>
                <p style={{ fontSize: '0.86rem', color: '#64748b', marginBottom: '20px' }}>
                  Lịch trình làm việc tự động hiển thị ca dạy cho Member và ca xin nghỉ (Off). Huấn luyện viên đi làm đủ ca/ngày và không được tự ý đổi trạng thái lịch rảnh ↔ bận.
                </p>

                {/* Calendar Week Navigation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <button
                    type="button"
                    className="trainer-banner-btn-white"
                    style={{ padding: '8px 16px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                    onClick={handlePrevBusyWeek}
                  >
                    <i className="fa-solid fa-chevron-left"></i> Tuần trước
                  </button>
                  <span style={{ fontWeight: 'bold', fontSize: '0.92rem' }}>
                    Tuần từ {days[0].toLocaleDateString('vi-VN')} đến {days[6].toLocaleDateString('vi-VN')}
                  </span>
                  <button
                    type="button"
                    className="trainer-banner-btn-white"
                    style={{ padding: '8px 16px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                    onClick={handleNextBusyWeek}
                  >
                    Tuần sau <i className="fa-solid fa-chevron-right"></i>
                  </button>
                </div>

                <div className="trainer-weekly-calendar" style={{ overflowX: 'auto' }}>
                  <table className="trainer-table" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'center' }}>
                    <thead>
                      <tr>
                        <th style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px', width: '12.5%' }}>Ca \ Ngày</th>
                        {days.map((day, idx) => (
                          <th key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px', width: '12.5%' }}>
                            {day.toLocaleDateString('vi-VN', { weekday: 'short' })} <br />
                            {day.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {TIME_SLOTS.map((slot, sIdx) => (
                        <tr key={sIdx}>
                          <td style={{ background: '#f8fafc', border: '1px solid #e2e8f0', fontWeight: 'bold', padding: '10px' }}>{slot.label}</td>
                          {days.map((day, dIdx) => {
                            const dateStr = getTodayDateString(day);
                            const daySchedule = localSchedules.find(s => s.date === dateStr);

                            const shiftInfo = daySchedule?.shifts?.find(sh => sh.shiftCode === slot.shiftCode);
                            const shiftStatus = shiftInfo ? shiftInfo.status : 'Free';
                            const memberName = shiftInfo?.memberName;

                            const [slotH, slotM, slotS] = slot.start.split(':').map(Number);
                            const slotDate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), slotH, slotM, slotS || 0);
                            const isPast = slotDate < new Date();

                            let bg = '#ffffff'; // White default - Free
                            let color = '#1e293b';
                            let text = 'Rảnh';
                            let cursor = 'default';

                            if (isPast) {
                              bg = '#f1f5f9'; color = '#94a3b8'; text = 'Đã qua';
                            } else if (shiftStatus === 'Off') {
                              const isApproved = daySchedule?.offStatus === 'Approved';
                              bg = '#cbd5e1'; color = '#475569';
                              text = isApproved ? 'Nghỉ (Đã duyệt)' : 'Nghỉ (Chờ duyệt)';
                            } else if (shiftStatus === 'Pending') {
                              bg = '#ffedd5'; color = '#c2410c';
                              text = `Chờ duyệt: ${memberName || 'Học viên'}`;
                            } else if (shiftStatus === 'Approved') {
                              bg = '#dcfce7'; color = '#166534';
                              text = `Dạy: ${memberName || 'Học viên'}`;
                            } else if (shiftStatus === 'CancelPending') {
                              bg = '#fee2e2'; color = '#b91c1c';
                              text = `Chờ hủy: ${memberName || 'Học viên'}`;
                            }

                            return (
                              <td
                                key={dIdx}
                                style={{
                                  padding: '12px',
                                  border: '1px solid #e2e8f0',
                                  background: bg,
                                  color: color,
                                  cursor: cursor,
                                  fontWeight: '500',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {text}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '16px', height: '16px', backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #e2e8f0' }}></div>
                      <span>Ca rảnh</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '16px', height: '16px', backgroundColor: '#ffedd5', borderRadius: '4px', border: '1px solid #fed7aa' }}></div>
                      <span>Đặt ca chờ duyệt</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '16px', height: '16px', backgroundColor: '#dcfce7', borderRadius: '4px', border: '1px solid #bbf7d0' }}></div>
                      <span>Lịch dạy (Đã duyệt)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '16px', height: '16px', backgroundColor: '#fee2e2', borderRadius: '4px', border: '1px solid #fca5a5' }}></div>
                      <span>Đặt ca chờ hủy</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '16px', height: '16px', backgroundColor: '#cbd5e1', borderRadius: '4px', border: '1px solid #94a3b8' }}></div>
                      <span>PT Nghỉ phép (Đã duyệt/Chờ duyệt)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '16px', height: '16px', backgroundColor: '#f1f5f9', borderRadius: '4px', border: '1px solid #cbd5e1' }}></div>
                      <span>Ca đã qua</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Đăng ký ngày nghỉ phép */}
              <div className="trainer-card-panel" style={{ marginTop: '20px' }}>
                <h3 className="trainer-card-title" style={{ marginBottom: '15px' }}>Đăng ký ngày nghỉ phép (Day Off)</h3>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="date"
                    value={selectedOffDate}
                    onChange={(e) => setSelectedOffDate(e.target.value)}
                    style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', minWidth: '200px' }}
                  />
                  <button
                    type="button"
                    onClick={handleRegisterOffRequest}
                    className="trainer-btn-submit"
                    style={{ padding: '10px 24px', background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    disabled={offQuota.remaining <= 0}
                  >
                    <i className="fa-solid fa-plane"></i> Gửi yêu cầu nghỉ phép
                  </button>
                </div>
                {offQuota.remaining <= 0 && (
                  <p style={{ color: '#ef4444', fontSize: '0.84rem', marginTop: '10px', margin: '10px 0 0' }}>
                    * Bạn đã hết lượt xin nghỉ phép trong tháng này (Hạn mức 4 ngày/tháng).
                  </p>
                )}
              </div>

              {/* Bảng lịch sử đăng ký nghỉ phép */}
              {myOffRequests.length > 0 && (
                <div className="trainer-card-panel" style={{ marginTop: '20px' }}>
                  <h3 className="trainer-card-title" style={{ marginBottom: '15px' }}>Lịch sử yêu cầu nghỉ phép</h3>
                  <div className="trainer-table-container" style={{ overflowX: 'auto' }}>
                    <table className="trainer-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                          <th style={{ padding: '12px' }}>Ngày nghỉ</th>
                          <th style={{ padding: '12px' }}>Trạng thái</th>
                          <th style={{ padding: '12px' }}>Lý do từ chối</th>
                          <th style={{ padding: '12px' }}>Thời gian tạo</th>
                          <th style={{ padding: '12px' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myOffRequests.map((req) => (
                          <tr key={req.request_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--orange)' }}>
                              {req.off_date.includes('-') ? req.off_date.split('-').reverse().join('/') : req.off_date}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span className={`status-badge ${req.status.toLowerCase()}`} style={{
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                backgroundColor: req.status === 'Approved' ? '#dcfce7' : req.status === 'Pending' ? '#ffedd5' : req.status === 'Rejected' ? '#fee2e2' : '#f1f5f9',
                                color: req.status === 'Approved' ? '#15803d' : req.status === 'Pending' ? '#b45309' : req.status === 'Rejected' ? '#b91c1c' : '#475569'
                              }}>
                                {req.status === 'Approved' ? 'Đã duyệt' : req.status === 'Pending' ? 'Chờ duyệt' : req.status === 'Rejected' ? 'Từ chối' : 'Đã hủy'}
                              </span>
                            </td>
                            <td style={{ padding: '12px', color: '#64748b' }}>
                              {req.reject_reason || '-'}
                            </td>
                            <td style={{ padding: '12px', color: '#94a3b8', fontSize: '0.85rem' }}>
                              {req.created_at ? new Date(req.created_at).toLocaleString('vi-VN') : '-'}
                            </td>
                            <td style={{ padding: '12px' }}>
                              {req.status === 'Pending' && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelOffRequest(req.request_id)}
                                  style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                                >
                                  Hủy yêu cầu
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        }

      case 'workout':
        return (
          <div className="trainer-card-panel">
            <h3 className="trainer-card-title" style={{ marginBottom: '20px' }}>Kho giáo án luyện tập mẫu (Workout Templates)</h3>
            <div className="trainer-plan-template-list" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {workoutTemplates.map((temp, idx) => (
                <div key={idx} className="trainer-template-card" style={{ cursor: 'default' }}>
                  <div className="trainer-template-card-title" style={{ color: 'var(--orange)' }}>{temp.title}</div>
                  <div className="trainer-template-card-desc" style={{ fontSize: '0.84rem', lineHeight: '1.4', marginTop: '6px' }}>
                    {temp.description || temp.desc}
                    {temp.exercises && temp.exercises.length > 0 && (
                      <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#64748b' }}>
                        <strong>Bài tập:</strong> {temp.exercises.map(e => `${e.exercise_name} (${e.sets}x${e.reps})`).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {workoutTemplates.length === 0 && (
                <div style={{ padding: '20px', color: '#94a3b8', textAlign: 'center' }}>Không có giáo án mẫu cho bộ môn này</div>
              )}
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

            {/* Certifications Section */}
            <h3 className="trainer-card-title" style={{ marginTop: '40px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <i className="fa-solid fa-award" style={{ marginRight: '8px', color: '#f59e0b' }}></i> Chứng chỉ chuyên môn
            </h3>

            <form onSubmit={handleAddCertification} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <input
                type="text"
                className="trainer-form-input"
                placeholder="Tên chứng chỉ mới (vd: NASM CPT, Yoga Alliance 200hr)"
                style={{ flex: 1 }}
                value={newCertName}
                onChange={(e) => setNewCertName(e.target.value)}
                required
              />
              <button type="submit" className="trainer-btn-submit" style={{ backgroundColor: '#10b981', padding: '10px 20px' }}>Thêm chứng chỉ</button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {certifications.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>Chưa có chứng chỉ nào được thêm.</div>
              ) : (
                certifications.map(cert => (
                  <div key={cert.certification_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fffbeb', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                        <i className="fa-solid fa-medal"></i>
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{cert.certification_name}</div>
                        {cert.issued_date && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Ngày cấp: {new Date(cert.issued_date).toLocaleDateString('vi-VN')}</div>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCertification(cert.certification_id)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}
                      title="Xóa chứng chỉ"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                ))
              )}
            </div>

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

      case 'thongbao':
        return (
          <div className="trainer-card-panel" style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <div className="trainer-card-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="trainer-card-title" style={{ margin: 0, textTransform: 'none', fontSize: '1.25rem', fontWeight: 'bold' }}>Thông báo của bạn</h3>
              {unreadNotifsCount > 0 && (
                <span className="trainer-link-action" style={{ color: 'var(--orange)', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem' }} onClick={markAllNotifsRead}>Đánh dấu tất cả đã đọc</span>
              )}
            </div>
            <div className="trainer-notif-list" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.map((n) => (
                <div className={`trainer-notif-item ${n.unread ? 'unread' : ''}`} key={n.id} onClick={() => handleNotificationClick(n)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: n.unread ? '#fff8f1' : '#f8fafc', borderRadius: '8px', border: n.unread ? '1px solid #ffedd5' : '1px solid #e2e8f0', transition: 'all 0.2s', cursor: 'pointer' }}>
                  <div className="trainer-notif-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: n.unread ? '#ffedd5' : '#cbd5e1', color: n.unread ? 'var(--orange)' : '#64748b', fontSize: '1.1rem' }}>
                    <i className={`fa-solid ${n.unread ? 'fa-envelope-open-text' : 'fa-envelope'}`}></i>
                  </div>
                  <div className="trainer-notif-body" style={{ flex: 1, marginLeft: '16px' }}>
                    <div className="trainer-notif-message" style={{ fontSize: '0.95rem', fontWeight: n.unread ? 'bold' : 'normal', color: 'var(--text)' }}>{n.message}</div>
                    <div className="trainer-notif-time" style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>{n.time}</div>
                  </div>
                  <button className="trainer-notif-btn-clear" style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem', padding: '8px' }} onClick={() => clearNotification(n.id)}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="trainer-no-data" style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.95rem' }}>Hộp thư thông báo trống</div>
              )}
            </div>
          </div>
        );

      default:
        return <div>Vui lòng chọn tab hợp lệ.</div>;
    }
  };

  const unreadNotifsCount = notifications.filter(n => n.unread).length;

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
                className={`trainer-menu-item ${activeTab === 'quanlylich' ? 'active' : ''}`}
                onClick={() => setActiveTab('quanlylich')}
              >
                <i className="fa-solid fa-calendar-minus"></i> Quản lý lịch
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

            <button className="trainer-icon-btn" style={{ position: 'relative' }} onClick={() => setActiveTab('thongbao')}>
              <i className="fa-regular fa-bell"></i>
              {unreadNotifsCount > 0 && (
                <span className="trainer-bell-badge" style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: 'var(--orange)', color: '#fff', fontSize: '0.65rem', minWidth: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {unreadNotifsCount}
                </span>
              )}
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

      {successModal.show && (
        <div className="trainer-success-modal-overlay">
          <div className="trainer-success-modal-box">
            <div className="trainer-success-modal-icon">
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <h4 className="trainer-success-modal-title">Giao thành công!</h4>
            <p className="trainer-success-modal-msg">{successModal.message}</p>
            <button className="trainer-success-modal-btn" onClick={() => setSuccessModal({ show: false, message: '' })}>
              Đồng ý
            </button>
          </div>
        </div>
      )}

      {/* Progress Details Modal */}
      {showProgressModal && selectedMember && (() => {
        const progress = getMemberProgress(selectedMember);
        return (
          <div className="trainer-success-modal-overlay" style={{ zIndex: 1000 }}>
            <div className="trainer-success-modal-box" style={{ maxWidth: '600px', width: '90%', padding: '30px', textAlign: 'left', borderRadius: '16px', background: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                <h3 className="trainer-card-title" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, textTransform: 'none' }}>
                  <i className="fa-solid fa-square-poll-vertical" style={{ color: 'var(--orange)' }}></i>
                  Tiến độ của {selectedMember.name}
                </h3>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#94a3b8', cursor: 'pointer' }}
                  onClick={() => setShowProgressModal(false)}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '450px', overflowY: 'auto', paddingRight: '6px' }}>

                {/* Workout Section */}
                <div style={{ backgroundColor: '#fff8f1', borderRadius: '12px', padding: '16px', border: '1px solid #ffedd5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fa-solid fa-dumbbell"></i>
                      Bài tập ({progress.hasCurrentWorkout ? selectedMember.workoutAssigned : 'Chưa phân công'})
                    </h4>
                    <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#ea580c', backgroundColor: '#ffedd5', padding: '2px 8px', borderRadius: '12px' }}>
                      {progress.workoutPct}%
                    </span>
                  </div>

                  {progress.hasCurrentWorkout ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {selectedMember.workoutExercises && selectedMember.workoutExercises.length > 0 ? (
                        selectedMember.workoutExercises.map((ex, idx) => {
                          const isDone = selectedMember.isCompleted || progress.completedExercises[`db-${selectedMember.workoutPlanId}-${idx}`];
                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                if (selectedMember.isCompleted) {
                                  alert('Giáo án đã kết thúc tiến độ, không thể thay đổi!');
                                  return;
                                }
                                handleToggleMemberExercise(selectedMember.id, selectedMember.workoutPlanId, idx);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 12px',
                                backgroundColor: '#fff',
                                borderRadius: '8px',
                                border: '1px solid #f1f5f9',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                                userSelect: 'none'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fafafa'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                                <i className={isDone ? "fa-solid fa-circle-check" : "fa-regular fa-circle"} style={{ color: isDone ? '#10b981' : '#cbd5e1', fontSize: '1.15rem' }}></i>
                                <div>
                                  <div style={{ fontSize: '0.88rem', fontWeight: 'bold', color: isDone ? '#94a3b8' : 'var(--text)', textDecoration: isDone ? 'line-through' : 'none' }}>
                                    {ex.name}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    {ex.sets} sets x {ex.reps} reps
                                  </div>
                                </div>
                              </div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isDone ? '#10b981' : '#64748b', backgroundColor: isDone ? '#e6f4ea' : '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                {isDone ? 'Hoàn thành' : 'Chưa tập'}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', padding: '10px' }}>Giáo án chưa có danh sách chi tiết bài tập.</div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', padding: '10px' }}>Chưa có giáo án cho ngày hôm nay / tương lai.</div>
                  )}
                </div>

              </div>

              <div style={{ marginTop: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                {progress.hasCurrentWorkout && (
                  <button
                    type="button"
                    disabled={progress.workoutPct < 100 || selectedMember.isCompleted}
                    style={{
                      padding: '10px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: selectedMember.isCompleted
                        ? '#e2e8f0'
                        : progress.workoutPct < 100
                        ? '#cbd5e1'
                        : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      color: (progress.workoutPct < 100 || selectedMember.isCompleted) ? '#94a3b8' : '#fff',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: (progress.workoutPct < 100 || selectedMember.isCompleted) ? 'not-allowed' : 'pointer',
                      boxShadow: (progress.workoutPct < 100 || selectedMember.isCompleted) ? 'none' : '0 4px 10px rgba(16, 185, 129, 0.2)',
                      transition: 'transform 0.2s ease',
                      margin: 0,
                      flex: 1
                    }}
                    onClick={() => {
                      handleFinishProgress(selectedMember, progress);
                      setShowProgressModal(false);
                    }}
                    title={selectedMember.isCompleted ? "Buổi tập đã hoàn thành & kết thúc" : progress.workoutPct < 100 ? "Cần hoàn thành 100% bài tập để kết thúc tiến độ" : "Kết thúc tiến độ giáo án"}
                  >
                    <i className="fa-solid fa-circle-check"></i> {selectedMember.isCompleted ? "Đã kết thúc tiến độ" : "Kết thúc tiến độ"}
                  </button>
                )}
                <button
                  type="button"
                  className="trainer-success-modal-btn"
                  style={{
                    margin: 0,
                    padding: '10px 24px',
                    flex: progress.hasCurrentWorkout ? 1 : 'none',
                    width: progress.hasCurrentWorkout ? 'auto' : '120px',
                    marginLeft: progress.hasCurrentWorkout ? '0' : 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={() => setShowProgressModal(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Cancellation Request Details Modal */}
      {selectedCancelRequest && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            padding: '24px',
            position: 'relative'
          }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fa-solid fa-circle-exclamation"></i> Chi tiết yêu cầu hủy lịch hẹn
            </h3>
            
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '16px',
              fontSize: '0.9rem',
              color: '#334155',
              lineHeight: '1.6'
            }}>
              <div><strong>Học viên:</strong> {selectedCancelRequest.name}</div>
              <div><strong>Thời gian học:</strong> Ngày {selectedCancelRequest.date && selectedCancelRequest.date.includes('-') ? selectedCancelRequest.date.split('-').reverse().join('/') : selectedCancelRequest.date}, ca {selectedCancelRequest.time}</div>
              <div style={{ marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                <strong>Lý do hủy:</strong>
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  marginTop: '6px',
                  fontStyle: 'italic',
                  color: '#475569',
                  minHeight: '80px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedCancelRequest.cancelReason || 'Không có lý do chi tiết.'}
                </div>
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#94a3b8', textAlign: 'right' }}>
                Yêu cầu lúc: {selectedCancelRequest.cancelRequestedAt ? new Date(selectedCancelRequest.cancelRequestedAt).toLocaleDateString('vi-VN') : 'N/A'}
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              marginTop: '20px'
            }}>
              <button
                type="button"
                onClick={() => setSelectedCancelRequest(null)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: '#475569',
                  transition: 'background-color 0.2s'
                }}
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => handleRespondCancelRequest(selectedCancelRequest.id, 'reject')}
                disabled={isCancelRespondLoading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'background-color 0.2s'
                }}
              >
                Từ chối hủy
              </button>
              <button
                type="button"
                onClick={() => handleRespondCancelRequest(selectedCancelRequest.id, 'accept')}
                disabled={isCancelRespondLoading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'background-color 0.2s'
                }}
              >
                Chấp nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}
      {/* PT Cancellation Request Modal */}
      {trainerCancelModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            padding: '24px',
            position: 'relative'
          }}>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#0f172a'
            }}>
              Lý do hủy lịch dạy
            </h3>
            <p style={{
              margin: '0 0 16px 0',
              fontSize: '0.88rem',
              color: '#64748b',
              lineHeight: '1.5'
            }}>
              Vui lòng nhập lý do hủy lịch dạy. Yêu cầu hủy sẽ được gửi đến Học viên của bạn để xét duyệt.
            </p>
            <textarea
              placeholder="Nhập lý do hủy lịch dạy..."
              value={trainerCancelReason}
              onChange={(e) => setTrainerCancelReason(e.target.value)}
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1.5px solid #e2e8f0',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                outline: 'none',
                resize: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--orange)'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              marginTop: '20px'
            }}>
              <button
                type="button"
                onClick={() => {
                  setTrainerCancelModalOpen(false);
                  setTrainerCancelReason('');
                  setTrainerCancelAppointmentId(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: '#475569',
                  transition: 'background-color 0.2s'
                }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={submitTrainerCancellationRequest}
                disabled={isTrainerCancelSubmitting || !trainerCancelReason.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: !trainerCancelReason.trim() ? '#cbd5e1' : 'var(--orange)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: !trainerCancelReason.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  transition: 'background-color 0.2s'
                }}
              >
                {isTrainerCancelSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainerDashboard;
