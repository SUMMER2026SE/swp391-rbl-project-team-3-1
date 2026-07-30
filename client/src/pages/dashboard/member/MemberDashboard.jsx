import React, { useState, useEffect } from 'react';
import './MemberDashboard.css';
import WorkoutPlansAndServices from './components/WorkoutPlansAndServices';
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

const TIME_SLOTS = [
  { start: '05:00:00', end: '06:30:00', label: '05:00 - 06:30' },
  { start: '07:00:00', end: '08:30:00', label: '07:00 - 08:30' },
  { start: '09:00:00', end: '10:30:00', label: '09:00 - 10:30' },
  { start: '11:00:00', end: '12:30:00', label: '11:00 - 12:30' },
  { start: '14:00:00', end: '15:30:00', label: '14:00 - 15:30' },
  { start: '16:00:00', end: '17:30:00', label: '16:00 - 17:30' },
  { start: '18:00:00', end: '19:30:00', label: '18:00 - 19:30' },
];

const getLocalDateString = (dateObj) => {
  const d = dateObj || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

  // --- Check-in State Variables ---
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [lastCheckinTime, setLastCheckinTime] = useState(null);
  const [memberCheckinHistory, setMemberCheckinHistory] = useState([]);
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  const [isSendingQr, setIsSendingQr] = useState(false);
  const [qrSendStatus, setQrSendStatus] = useState(null); // null | 'success' | 'error'
  const [qrSendMessage, setQrSendMessage] = useState('');
  const [memberQrCodeUrl, setMemberQrCodeUrl] = useState('');
  const [isQrLoading, setIsQrLoading] = useState(false);
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [regenerateError, setRegenerateError] = useState('');
  const [regenerateSuccess, setRegenerateSuccess] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [expandedPackageId, setExpandedPackageId] = useState(null);

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
  const [cancellationModalOpen, setCancellationModalOpen] = useState(false);
  const [cancellationAppointmentId, setCancellationAppointmentId] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isCancellationSubmitting, setIsCancellationSubmitting] = useState(false);
  const [selectedPTCancelRequest, setSelectedPTCancelRequest] = useState(null);
  const [dbWorkoutPlans, setDbWorkoutPlans] = useState([]);
  const [plansLoaded, setPlansLoaded] = useState(false);
  const [workoutSubTab, setWorkoutSubTab] = useState('today');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingType, setBookingType] = useState('PT Cá Nhân');
  const [bookingNote, setBookingNote] = useState('');
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [bookingShiftCode, setBookingShiftCode] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Active trainers list & chosen trainer state
  const [trainersList, setTrainersList] = useState([]);
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [trainerSchedules, setTrainerSchedules] = useState([]);
  const [isTrainerScheduleLoading, setIsTrainerScheduleLoading] = useState(false);

  // Password change states
  const [cpwOld, setCpwOld] = useState('');
  const [cpwNew, setCpwNew] = useState('');
  const [cpwConf, setCpwConf] = useState('');
  const [cpwAlert, setCpwAlert] = useState({ show: false, msg: '', ok: false });

  // Workout state: completion status per exercise ID
  const [completedExercises, setCompletedExercises] = useState({
    1: false, 2: false, 3: false, 4: false, 5: false
  });


  // --- AI MEAL PLAN STATES ---
  const [aiMealAge, setAiMealAge] = useState('25');
  const [aiMealGender, setAiMealGender] = useState('Nam');
  const [aiMealHeight, setAiMealHeight] = useState('');
  const [aiMealWeight, setAiMealWeight] = useState('');
  const [aiMealMode, setAiMealMode] = useState('pt_workout'); // 'pt_workout' | 'goal'
  const [aiMealSport, setAiMealSport] = useState('Gym'); // 'Gym' | 'Yoga'
  const [aiMealGoal, setAiMealGoal] = useState('Tăng cơ'); // 'Tăng cơ' | 'Giảm mỡ' | 'Dẻo dai' | 'Sức bền'
  const [aiMealResult, setAiMealResult] = useState(null);
  const [selectedHistoryMeal, setSelectedHistoryMeal] = useState(null);
  const [aiMealLoading, setAiMealLoading] = useState(false);
  const [aiMealLoadingStep, setAiMealLoadingStep] = useState('');
  const [aiMealError, setAiMealError] = useState('');

  const calculateHistoryCalories = (item) => {
    if (!item) return 2000;
    try {
      const parsed = JSON.parse(item.recommendedSchedule);
      if (parsed && parsed.target_calories) return parsed.target_calories;
    } catch (e) {}

    let h = item.height || 170;
    let w = item.weight || 65;
    let a = item.age || 25;
    let g = item.gender || 'Nam';
    
    let bmr = 10 * w + 6.25 * h - 5 * a;
    if (g === 'Nam') {
      bmr += 5;
    } else {
      bmr -= 161;
    }
    let tdee = Math.round(bmr * 1.375);
    
    if (item.fitnessGoal && item.fitnessGoal.toLowerCase().includes('giáo án')) {
      return Math.round(tdee + 250);
    } else if (item.fitnessGoal && (item.fitnessGoal.toLowerCase().includes('tăng cơ') || item.fitnessGoal.toLowerCase().includes('gym'))) {
      return Math.round(tdee + 300);
    } else if (item.fitnessGoal && (item.fitnessGoal.toLowerCase().includes('giảm mỡ'))) {
      return Math.round(tdee - 350);
    } else if (item.fitnessGoal && (item.fitnessGoal.toLowerCase().includes('dẻo dai') || item.fitnessGoal.toLowerCase().includes('yoga'))) {
      return Math.round(tdee - 100);
    }
    return tdee;
  };

  const syncMealPlanMetricsWithProfile = () => {
    if (profileData && profileData.memberInfo) {
      const info = profileData.memberInfo;
      if (info.height) setAiMealHeight(Math.round(info.height * 100).toString());
      if (info.weight) setAiMealWeight(info.weight.toString());
      if (info.fitness_goal) {
        if (info.fitness_goal.includes('Tăng cơ')) setAiMealGoal('Tăng cơ');
        else if (info.fitness_goal.includes('Giảm cân') || info.fitness_goal.includes('Giảm mỡ')) setAiMealGoal('Giảm mỡ');
        else if (info.fitness_goal.includes('Dẻo dai') || info.fitness_goal.includes('Linh hoạt')) setAiMealGoal('Dẻo dai');
        else if (info.fitness_goal.includes('Sức bền')) setAiMealGoal('Sức bền');
      }
    }
    if (userInfo) {
      if (userInfo.gender) setAiMealGender(userInfo.gender);
      if (userInfo.date_of_birth || userInfo.dateOfBirth) {
        const dobStr = userInfo.date_of_birth || userInfo.dateOfBirth;
        const birthDate = new Date(dobStr);
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
        setAiMealAge(calculatedAge.toString());
      }
    }
  };

  const handleGenerateMealPlan = async (e) => {
    if (e) e.preventDefault();
    setAiMealError('');
    setAiMealResult(null);
    setAiMealLoading(true);

    if (!aiMealHeight || Number(aiMealHeight) <= 0) {
      setAiMealError('Chiều cao không hợp lệ!');
      setAiMealLoading(false);
      return;
    }
    if (!aiMealWeight || Number(aiMealWeight) <= 0) {
      setAiMealError('Cân nặng không hợp lệ!');
      setAiMealLoading(false);
      return;
    }

    const steps = [
      'Đang gửi dữ liệu phân tích...',
      'Đang đối chiếu bài tập với PT & số đo...',
      'AI đang tính toán lượng Calories & tỷ lệ Macro...',
      'AI đang thiết kế thực đơn chi tiết từng bữa...',
      'Đang chuẩn bị hiển thị thực đơn...'
    ];

    let currentStepIdx = 0;
    setAiMealLoadingStep(steps[0]);
    const stepInterval = setInterval(() => {
      currentStepIdx++;
      if (currentStepIdx < steps.length) {
        setAiMealLoadingStep(steps[currentStepIdx]);
      }
    }, 1100);

    try {
      const res = await fetch('/api/ai/meal-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          height: aiMealHeight,
          weight: aiMealWeight,
          age: aiMealAge,
          gender: aiMealGender,
          mode: aiMealMode,
          sport: aiMealSport,
          goal: aiMealGoal
        })
      });

      clearInterval(stepInterval);
      const data = await res.json();
      setAiMealLoading(false);

      if (res.ok) {
        setAiMealResult(data.mealPlan);
        reloadAiHistory();
      } else {
        setAiMealError(data.message || 'Yêu cầu thực đơn AI thất bại!');
      }
    } catch (err) {
      clearInterval(stepInterval);
      setAiMealLoading(false);
      setAiMealError('Không thể kết nối đến máy chủ AI!');
    }
  };

  useEffect(() => {
    syncMealPlanMetricsWithProfile();
  }, [profileData, userInfo]);

  useEffect(() => {
    const activeSports = Array.from(new Set((profileData?.memberInfo?.memberships || []).filter(m => m.status === 'Active').map(m => m.sportType).filter(Boolean)));
    if (activeSports.length > 0 && !activeSports.includes(aiMealSport)) {
      setAiMealSport(activeSports[0]);
    }
  }, [profileData]);

  // Fetch trainer schedule
  useEffect(() => {
    if (selectedTrainerId && activeTab === 'lichhen') {
      const fetchSchedules = async () => {
        setIsTrainerScheduleLoading(true);
        try {
          const start = new Date(currentWeekStart);
          start.setDate(currentWeekStart.getDate() - 15);
          const end = new Date(currentWeekStart);
          end.setDate(currentWeekStart.getDate() + 15);

          const startStr = getLocalDateString(start);
          const endStr = getLocalDateString(end);
          const res = await fetch(`/api/checkout/trainers/${selectedTrainerId}/schedule?startDate=${startStr}&endDate=${endStr}`);
          const data = await res.json();
          if (data.schedules) {
            setTrainerSchedules(data.schedules);
          }
        } catch (err) {
          console.error('Error fetching trainer schedules', err);
        } finally {
          setIsTrainerScheduleLoading(false);
        }
      };
      fetchSchedules();
    }
  }, [selectedTrainerId, currentWeekStart, activeTab, refreshTrigger]);

  // Load completed exercises from localStorage when memberInfo is available
  useEffect(() => {
    const memberId = profileData?.memberInfo?.member_id;
    if (memberId) {
      try {
        const saved = localStorage.getItem(`member_progress_${memberId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.completedExercises) setCompletedExercises(parsed.completedExercises);
        } else {
          setCompletedExercises({});
        }
      } catch (e) {
        console.error('Error loading progress from localStorage:', e);
      }
    }
  }, [profileData]);

  // Save to localStorage whenever completedExercises changes
  useEffect(() => {
    const memberId = profileData?.memberInfo?.member_id;
    if (memberId) {
      try {
        localStorage.setItem(`member_progress_${memberId}`, JSON.stringify({
          completedExercises
        }));
      } catch (e) {
        console.error('Error saving progress to localStorage:', e);
      }
    }
  }, [completedExercises, profileData]);

  // Reset progress when there are no active plans for today
  useEffect(() => {
    const memberId = profileData?.memberInfo?.member_id;
    if (memberId && plansLoaded) {
      const activeWorkouts = dbWorkoutPlans.filter(plan => !plan.created_at || isToday(plan.created_at));

      if (activeWorkouts.length === 0) {
        setCompletedExercises({});
      }
    }
  }, [plansLoaded, dbWorkoutPlans, profileData]);

  // Notifications state
  const [notifications, setNotifications] = useState([]);


  const fetchCheckinHistory = () => {
    if (!token || token === 'mock-preview-token') return;
    fetch('/api/dashboard/member/checkins', {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.checkins) {
          setMemberCheckinHistory(data.checkins);
          if (data.checkins.length > 0) {
            setLastCheckinTime(data.checkins[0].checkinTime);
          }
        }
      })
      .catch(err => console.error('Error fetching checkin history:', err));
  };

  useEffect(() => {
    if (activeTab === 'tongquan') {
      fetchCheckinHistory();
    }
  }, [activeTab]);

  const fetchMemberQrCode = async () => {
    if (!token || token === 'mock-preview-token') return;
    setIsQrLoading(true);
    try {
      const res = await fetch('/api/dashboard/member/checkin/qr-code', {
        headers: {
          Authorization: 'Bearer ' + token
        }
      });
      const data = await res.json();
      if (res.ok && data.qrCodeUrl) {
        setMemberQrCodeUrl(data.qrCodeUrl);
      } else {
        console.error('Error fetching member QR:', data.message);
      }
    } catch (err) {
      console.error('Error fetching member QR:', err);
    } finally {
      setIsQrLoading(false);
    }
  };

  const handleRegenerateQr = async () => {
    if (!token || token === 'mock-preview-token') return;
    setRegenerateError('');
    setRegenerateSuccess('');
    setIsRegenerating(true);
    try {
      const res = await fetch('/api/dashboard/member/checkin/qr-code/regenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({ password: confirmPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRegenerateSuccess(data.message || 'Cấp lại mã QR thành công!');
        setMemberQrCodeUrl(data.qrCodeUrl);
        setConfirmPassword('');
        setTimeout(() => {
          setRegenerateModalOpen(false);
          setRegenerateSuccess('');
        }, 1500);
      } else {
        setRegenerateError(data.message || 'Cấp lại mã QR thất bại!');
      }
    } catch (err) {
      setRegenerateError('Lỗi kết nối máy chủ!');
    } finally {
      setIsRegenerating(false);
    }
  };

  useEffect(() => {
    if (checkinModalOpen) {
      fetchMemberQrCode();
    }
  }, [checkinModalOpen]);

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
            time: n.created_at ? new Date(n.created_at).toLocaleString('vi-VN') : 'Vừa xong'
          }));
          setNotifications(mapped);
        }
      })
      .catch(err => console.error('Error fetching notifications:', err));
  };

  // Set up real-time notification stream via SSE
  useEffect(() => {
    if (!token || token === 'mock-preview-token') return;
    
    const streamUrl = `/api/notifications/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(streamUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.connected) {
          console.log('[SSE] Connected to notification stream.');
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
        if (['BOOKING_CREATED', 'BOOKING_APPROVED', 'BOOKING_REJECTED', 'BOOKING_CANCELLED', 'BOOKING_CANCEL_REQUESTED', 'BOOKING_CANCEL_ACCEPTED', 'BOOKING_CANCEL_REJECTED', 'SCHEDULE_SLOT_UPDATED'].includes(data.type || newNotif.type)) {
          reloadMemberAppointments();
          setRefreshTrigger(prev => prev + 1);
        }

        if (['plan_completed', 'PLAN_COMPLETED'].includes(data.type || newNotif.type)) {
          reloadPlans();
        }

        if (data.type === 'MEMBER_CHECKED_IN') {
          setLastCheckinTime(data.checkinTime);
          setJustCheckedIn(true);
          setCheckinModalOpen(true);
          fetchCheckinHistory();
        }

      } catch (err) {
        console.error('[SSE] Error processing stream message:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('[SSE] Stream connection error:', err);
    };

    return () => {
      eventSource.close();
      console.log('[SSE] Closed stream connection.');
    };
  }, [token]);

  // Weight history tracking state
  const [weightHistory, setWeightHistory] = useState([]);
  const [newHistoryWeight, setNewHistoryWeight] = useState('');
  const [newHistoryDate, setNewHistoryDate] = useState('');

  // AI Consultation state variables
  const [aiHistory, setAiHistory] = useState([]);
  const [aiAge, setAiAge] = useState('25');
  const [aiGender, setAiGender] = useState('Nam');
  const [aiHeight, setAiHeight] = useState('');
  const [aiWeight, setAiWeight] = useState('');
  const [aiFitnessGoal, setAiFitnessGoal] = useState('Tăng cơ');
  const [aiConsultationType, setAiConsultationType] = useState('General Fitness');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLoadingStep, setAiLoadingStep] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState('');

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
    if (isAppointmentPast(ap) && ap.status === 'confirmed') {
      return <span className="member-badge-status confirmed">Đã hoàn thành</span>;
    }
    return (
      <span className={`member-badge-status ${ap.status}`}>
        {ap.status === 'confirmed' ? 'Xác nhận' : ap.status === 'pending' ? 'Chờ duyệt' : ap.status === 'rejected' ? 'Bị từ chối' : 'Đã hủy'}
      </span>
    );
  };

  const upcomingAppointments = appointmentsList
    .filter(ap => !isAppointmentPast(ap) && ap.status !== 'cancelled' && ap.status !== 'rejected')
    .sort((a, b) => {
      const timeA = a.startDateTime ? new Date(a.startDateTime).getTime() : 0;
      const timeB = b.startDateTime ? new Date(b.startDateTime).getTime() : 0;
      return timeA - timeB;
    });

  const historyAppointments = appointmentsList
    .filter(ap => isAppointmentPast(ap) || ap.status === 'cancelled' || ap.status === 'rejected')
    .sort((a, b) => {
      const timeA = a.startDateTime ? new Date(a.startDateTime).getTime() : 0;
      const timeB = b.startDateTime ? new Date(b.startDateTime).getTime() : 0;
      return timeB - timeA;
    });

  // Synchronize edit fields when profileData loads
  useEffect(() => {
    if (profileData) {
      setEditFullName(profileData.fullName || '');
      setEditPhone(profileData.phoneNumber || '');
      setEditGender(profileData.gender || 'Nam');
      setAiGender(profileData.gender || 'Nam');

      if (profileData.dateOfBirth) {
        setEditDob(profileData.dateOfBirth.split('T')[0]);
        const birthYear = new Date(profileData.dateOfBirth).getFullYear();
        const currentYear = new Date().getFullYear();
        setAiAge((currentYear - birthYear).toString());
      } else {
        setEditDob('');
      }

      if (profileData.memberInfo) {
        // height in DB is in meters, convert to cm (multiply by 100)
        const hCm = profileData.memberInfo.height ? Math.round(profileData.memberInfo.height * 100).toString() : '';
        const wKg = profileData.memberInfo.weight ? profileData.memberInfo.weight.toString() : '';
        setEditHeight(hCm);
        setEditWeight(wKg);
        setAiHeight(hCm);
        setAiWeight(wKg);

        const goalStr = profileData.memberInfo.fitness_goal || '';
        setEditGoals(goalStr ? goalStr.split(',').map(g => g.trim()) : []);
        if (goalStr) {
          const firstGoal = goalStr.split(',')[0].trim();
          setAiFitnessGoal(firstGoal);
        }
        setEditLevel(profileData.memberInfo.fitness_level || 'Người mới bắt đầu');
        setEditEmergency(profileData.memberInfo.emergency_contact || '');

        // Initialize notifications (now handled by API fetch and SSE)
        reloadNotifications();

        // Initialize weight history
        const curW = profileData.memberInfo.weight || 65;
        const getRelativeDateString = (daysAgo) => {
          const d = new Date();
          d.setDate(d.getDate() - daysAgo);
          return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        };
        setWeightHistory([
          { date: getRelativeDateString(28), weight: Number(curW) - 3 },
          { date: getRelativeDateString(21), weight: Number(curW) - 2 },
          { date: getRelativeDateString(14), weight: Number(curW) - 1 },
          { date: getRelativeDateString(7), weight: Number(curW) }
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
    setPlansLoaded(false);
    fetch('/api/workout-plans', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(workouts => {
        if (Array.isArray(workouts)) {
          setDbWorkoutPlans(workouts);
        }
        setPlansLoaded(true);
      })
      .catch(err => {
        console.error('Error fetching plans:', err);
        setPlansLoaded(true);
      });
  };

  const reloadAiHistory = () => {
    if (!token || token === 'mock-preview-token') return;
    fetch('/api/ai/history', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.history) {
          setAiHistory(data.history);
        }
      })
      .catch(err => console.error('Error fetching AI history:', err));
  };

  const fetchTrainersList = () => {
    if (!token || token === 'mock-preview-token') return;
    fetch('/api/dashboard/member/my-trainers', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.trainers) {
          setTrainersList(data.trainers);
          if (data.trainers.length > 0) {
            setSelectedTrainerId(data.trainers[0].trainerId);
          } else {
            setSelectedTrainerId('');
          }
        }
      })
      .catch(err => console.error('Error fetching trainers:', err));
  };

  useEffect(() => {
    reloadMemberAppointments();
    reloadPlans();
    reloadAiHistory();
    fetchTrainersList();
    reloadNotifications();
  }, [token]);

  // --- ACTIONS & HANDLERS ---
  const handleAiConsult = async (e) => {
    e.preventDefault();
    setAiError('');
    setAiResult(null);
    setAiLoading(true);

    if (!aiHeight || Number(aiHeight) <= 0) {
      setAiError('Chiều cao không hợp lệ!');
      setAiLoading(false);
      return;
    }
    if (!aiWeight || Number(aiWeight) <= 0) {
      setAiError('Cân nặng không hợp lệ!');
      setAiLoading(false);
      return;
    }

    const steps = [
      'Đang gửi thông tin phân tích...',
      'AI đang tính toán chỉ số cơ thể & BMI...',
      'AI đang lập lộ trình dinh dưỡng & rèn luyện...',
      'Đang chuẩn bị hiển thị kết quả...'
    ];

    let currentStepIdx = 0;
    setAiLoadingStep(steps[0]);
    const stepInterval = setInterval(() => {
      currentStepIdx++;
      if (currentStepIdx < steps.length) {
        setAiLoadingStep(steps[currentStepIdx]);
      }
    }, 1200);

    try {
      const res = await fetch('/api/ai/consult', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          age: aiAge,
          gender: aiGender,
          height: aiHeight,
          weight: aiWeight,
          fitnessGoal: aiFitnessGoal,
          consultationType: aiConsultationType
        })
      });

      clearInterval(stepInterval);
      const data = await res.json();
      setAiLoading(false);

      if (res.ok) {
        setAiResult(data.consultation);
        reloadAiHistory();
      } else {
        setAiError(data.message || 'Yêu cầu tư vấn thất bại!');
      }
    } catch (err) {
      clearInterval(stepInterval);
      setAiLoading(false);
      setAiError('Không thể kết nối đến máy chủ AI!');
    }
  };

  const handleApplyAiMetricsToProfile = async () => {
    if (!aiResult) return;
    const confirmApply = window.confirm(`Bạn có muốn áp dụng chiều cao ${aiResult.height}cm và cân nặng ${aiResult.weight}kg này vào hồ sơ chính thức của mình không?`);
    if (confirmApply) {
      try {
        const heightInMeters = Number(aiResult.height) / 100;
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
            weight: Number(aiResult.weight),
            fitnessGoal: aiFitnessGoal,
            fitnessLevel: editLevel,
            emergencyContact: editEmergency
          })
        });
        if (res.ok) {
          alert('Cập nhật chỉ số hồ sơ thành công!');
          fetchProfile(token);
        } else {
          alert('Không thể cập nhật hồ sơ!');
        }
      } catch (err) {
        alert('Lỗi kết nối máy chủ khi cập nhật hồ sơ!');
      }
    }
  };

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
        note: bookingNote,
        trainerId: selectedTrainerId
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

    setCancellationAppointmentId(id);
    setCancellationReason('');
    setCancellationModalOpen(true);
  };

  const submitCancellationRequest = () => {
    if (!cancellationAppointmentId || !cancellationReason.trim()) return;

    setIsCancellationSubmitting(true);
    fetch(`/api/dashboard/member/appointments/${cancellationAppointmentId}/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ reason: cancellationReason })
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.message || 'Lỗi server'); });
        }
        return res.json();
      })
      .then(data => {
        alert(data.message || 'Đã gửi yêu cầu hủy lịch hẹn thành công!');
        setCancellationModalOpen(false);
        setCancellationReason('');
        setCancellationAppointmentId(null);
        reloadMemberAppointments();

        const newNotif = {
          id: Date.now(),
          message: `Bạn đã gửi yêu cầu hủy lịch hẹn tập. Đang chờ HLV phản hồi.`,
          time: 'Vừa xong',
          unread: true
        };
        setNotifications(prev => [newNotif, ...prev]);
      })
      .catch(err => {
        console.error(err);
        alert(err.message || 'Có lỗi xảy ra khi gửi yêu cầu hủy lịch!');
      })
      .finally(() => {
        setIsCancellationSubmitting(false);
      });
  };

  const handleRespondPTCancel = (id, action) => {
    fetch(`/api/dashboard/member/appointments/${id}/cancel-respond`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ action })
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message || 'Đã phản hồi yêu cầu thành công!');
        reloadMemberAppointments();
      })
      .catch(err => {
        console.error('Error responding to PT cancel request:', err);
        alert('Có lỗi xảy ra khi phản hồi yêu cầu hủy!');
      });
  };

  const toggleExercise = (exId) => {
    setCompletedExercises(prev => ({
      ...prev,
      [exId]: !prev[exId]
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
    if (!token || token === 'mock-preview-token') {
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
      return;
    }
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
    if (!token || token === 'mock-preview-token') {
      setNotifications(prev => prev.filter(n => n.id !== id));
      return;
    }
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
    if (n.type && (n.type.includes('BOOKING') || n.type.includes('APPOINTMENT'))) {
      setActiveTab('lichhen');
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

  const getCurrentDateString = () => {
    const now = new Date();
    const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const months = [
      'tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6',
      'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'
    ];
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} năm ${now.getFullYear()}`;
  };

  // Helper to check if a date is today or in the future
  const isToday = (dateVal) => {
    if (!dateVal) return false;
    const planDate = new Date(dateVal);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    planDate.setHours(0, 0, 0, 0);
    return planDate >= today;
  };

  // Filter workout plans
  const latestWorkoutPlan = dbWorkoutPlans.length > 0 ? dbWorkoutPlans[0] : null;
  const todayWorkoutPlans = latestWorkoutPlan && isToday(latestWorkoutPlan.created_at) ? [latestWorkoutPlan] : [];
  const historyWorkoutPlans = dbWorkoutPlans.filter(plan => plan !== latestWorkoutPlan || !isToday(plan.created_at));

  // Dynamic exercises count from today's plans
  let totalExs = 0;
  todayWorkoutPlans.forEach(plan => {
    if (plan.WorkoutExercises) {
      totalExs += plan.WorkoutExercises.length;
    }
  });
  if (totalExs === 0) totalExs = 5; // Fallback if no plans yet

  let completedExsCount = 0;
  todayWorkoutPlans.forEach(plan => {
    if (plan.WorkoutExercises) {
      plan.WorkoutExercises.forEach((ex, idx) => {
        const key = `db-${plan.workout_plan_id}-${idx}`;
        if (plan.is_completed || completedExercises[key]) {
          completedExsCount++;
        }
      });
    }
  });
  const workoutProgressPct = Math.round((completedExsCount / totalExs) * 100);

  const todayMealPlans = [];
  const historyMealPlans = [];
  const targetKcal = 0;
  const eatenKcal = 0;

  const memberships = profileData?.memberInfo?.memberships || [];
  const activeMemberships = memberships.filter(m => m.status === 'Active');
  const registeredSports = Array.from(new Set(activeMemberships.map(m => m.sportType).filter(Boolean)));

  const unreadNotifsCount = notifications.filter(n => n.unread).length;

  const getThisWeekRange = () => {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { monday, sunday };
  };

  const { monday: thisWeekMonday, sunday: thisWeekSunday } = getThisWeekRange();

  const thisWeekAppts = appointmentsList.filter(ap => {
    if (ap.status !== 'confirmed' && ap.status !== 'Approved') return false;
    
    let apDate = null;
    if (ap.workingDate) {
      apDate = new Date(ap.workingDate + 'T00:00:00');
    } else if (ap.date && ap.date !== 'N/A') {
      const parts = ap.date.split('/');
      if (parts.length === 3) {
        apDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
      }
    } else if (ap.startDateTime) {
      apDate = new Date(ap.startDateTime);
    }
    
    if (!apDate || isNaN(apDate.getTime())) return false;
    return apDate >= thisWeekMonday && apDate <= thisWeekSunday;
  });

  const thisWeekConfirmedCount = thisWeekAppts.length;
  const thisWeekCompletedPtCount = thisWeekAppts.filter(ap => isAppointmentPast(ap)).length;
  const totalCompletedWeek = Math.max(completedExsCount, thisWeekCompletedPtCount);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tongquan':
        // memberships is defined in parent scope
        return (
          <>
            {/* Stat Cards */}
            <div className="member-stats-grid">
              <div className="member-stat-card">
                <span className="member-stat-label">Buổi tập tuần này</span>
                <span className="member-stat-value">
                  {thisWeekConfirmedCount > 0
                    ? `${totalCompletedWeek} / ${thisWeekConfirmedCount}`
                    : `${completedExsCount} / 5`}
                </span>
                {thisWeekConfirmedCount > 0 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--orange)', marginTop: '2px', fontWeight: 'bold' }}>
                    Đã hẹn {thisWeekConfirmedCount} buổi với PT
                  </span>
                )}
                <i className="fa-solid fa-dumbbell member-stat-icon"></i>
              </div>
              <div className="member-stat-card">
                <span className="member-stat-label">PT đang học</span>
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {trainersList.length > 0 ? (
                    trainersList.map((t, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="member-stat-value" style={{ fontSize: '1rem', fontWeight: '700', lineHeight: '1.2' }}>
                          {t.fullName}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', fontWeight: '500' }}>
                          {t.specialization}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="member-stat-value" style={{ fontSize: '1.15rem' }}>
                      {profileData?.memberInfo?.activePtName || 'Chưa đăng ký'}
                    </span>
                  )}
                </div>
                <i className="fa-solid fa-user-tie member-stat-icon"></i>
              </div>
              <div className="member-stat-card">
                <span className="member-stat-label">BMI hiện tại</span>
                <span className="member-stat-value">{profileData?.memberInfo?.bmi || '22.4'}</span>
                <i className="fa-solid fa-gauge-simple-high member-stat-icon"></i>
              </div>
            </div>

            {/* Gói tập đã đăng ký Accordion Panel */}
            <div className="member-packages-panel" style={{ marginBottom: '24px' }}>
              <h3 className="member-packages-title">
                <i className="fa-solid fa-address-card" style={{ color: 'var(--orange)' }}></i> Gói tập đã đăng ký
              </h3>
              {memberships.length > 0 ? (
                <div className="member-packages-list">
                  {memberships.map((m) => {
                    const isOpen = expandedPackageId === m.memberMembershipId;
                    const renderStatusBadge = (status) => {
                      if (status === 'Active') {
                        return <span className="member-package-badge-active">Đang hoạt động</span>;
                      } else if (status === 'Expired') {
                        return <span className="member-package-badge-expired">Hết hạn</span>;
                      } else {
                        return <span className="member-package-badge-cancelled">{status}</span>;
                      }
                    };

                    return (
                      <div className={`member-package-item ${isOpen ? 'open' : ''}`} key={m.memberMembershipId}>
                        <div
                          className="member-package-item-header"
                          onClick={() => setExpandedPackageId(isOpen ? null : m.memberMembershipId)}
                        >
                          <div className="member-package-item-name">
                            <i className="fa-solid fa-dumbbell" style={{ color: isOpen ? 'var(--orange)' : '#64748b' }}></i>
                            {m.planName}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {renderStatusBadge(m.status)}
                            <i className="fa-solid fa-chevron-down member-package-item-arrow"></i>
                          </div>
                        </div>
                        {isOpen && (
                          <div className="member-package-item-details">
                            <div className="member-package-details-grid">
                              <div className="member-package-detail-col">
                                <span className="member-package-detail-label">Ngày bắt đầu</span>
                                <span className="member-package-detail-value">{m.startDate}</span>
                              </div>
                              <div className="member-package-detail-col">
                                <span className="member-package-detail-label">Ngày kết thúc</span>
                                <span className="member-package-detail-value">{m.endDate}</span>
                              </div>
                              <div className="member-package-detail-col">
                                <span className="member-package-detail-label">Bộ môn</span>
                                <span className="member-package-detail-value">{m.sportType}</span>
                              </div>
                              <div className="member-package-detail-col">
                                <span className="member-package-detail-label">Thời hạn gói</span>
                                <span className="member-package-detail-value">{m.durationMonths} tháng</span>
                              </div>
                              <div className="member-package-detail-col">
                                <span className="member-package-detail-label">Huấn luyện viên</span>
                                <span className="member-package-detail-value" style={{ fontWeight: '700', color: '#0f172a' }}>{m.trainerName || 'Chưa đăng ký'}</span>
                              </div>
                            </div>
                            {m.description && (
                              <div className="member-package-detail-col" style={{ marginTop: '4px' }}>
                                <span className="member-package-detail-label">Mô tả gói tập</span>
                                <span className="member-package-detail-value" style={{ fontWeight: 'normal', color: '#64748b', fontSize: '0.86rem' }}>
                                  {m.description}
                                </span>
                              </div>
                            )}
                            <div className="member-package-remaining-box">
                              <span className="member-package-remaining-text">Số ngày còn lại của gói tập:</span>
                              <span className="member-package-remaining-value">{m.remainingDays} ngày</span>
                            </div>
                            {(m.status === 'Active' || m.status === 'Expired') && (
                              <button
                                className="member-package-btn-renew"
                                onClick={() => {
                                  window.history.pushState(
                                    {},
                                    '',
                                    `/checkout?plan=${m.planId}&renewMembershipId=${m.memberMembershipId}&sportType=${encodeURIComponent(m.sportType)}`
                                  );
                                  window.dispatchEvent(new Event('popstate'));
                                }}
                              >
                                <i className="fa-solid fa-arrows-rotate"></i> Gia hạn gói tập
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="member-no-data" style={{ padding: '20px' }}>
                  Bạn chưa đăng ký bất kỳ gói tập nào trong hệ thống!
                </div>
              )}
            </div>

            {/* Full Width Column: Upcoming Appointments */}
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
                    {upcomingAppointments.slice(0, 4).map((ap) => (
                      <tr key={ap.id}>
                        <td>{ap.time}</td>
                        <td>{ap.trainer}</td>
                        <td>{ap.type}</td>
                        <td>
                          <span className={`member-badge-status ${ap.status}`}>
                            {ap.status === 'confirmed' ? 'Xác nhận' : 
                             ap.status === 'pending' ? 'Chờ duyệt' : 
                             ap.status === 'rejected' ? 'Bị từ chối' : 
                             ap.status === 'cancelpending' ? (ap.cancelRequestedBy === 'TRAINER' ? 'HLV xin hủy' : 'Chờ duyệt hủy') : 'Đã hủy'}
                          </span>
                        </td>
                        <td>
                          {ap.status === 'cancelpending' ? (
                            ap.cancelRequestedBy === 'TRAINER' ? (
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span 
                                  onClick={() => setSelectedPTCancelRequest(ap)}
                                  style={{ color: 'var(--orange)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.82rem', marginRight: '6px' }}
                                >
                                  Xem lý do
                                </span>
                                <button 
                                  onClick={() => handleRespondPTCancel(ap.id, 'accept')}
                                  style={{ padding: '4px 8px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                                >
                                  Đồng ý
                                </button>
                                <button 
                                  onClick={() => handleRespondPTCancel(ap.id, 'reject')}
                                  style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                                >
                                  Từ chối
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>Đang chờ duyệt hủy</span>
                            )
                          ) : ap.status === 'cancelled' || ap.status === 'rejected' ? null : (
                            <button className="member-action-cancel" onClick={() => handleCancelAppointment(ap.id)}>Hủy</button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {upcomingAppointments.length === 0 && (
                      <tr>
                        <td colSpan="5" className="member-no-data">Không có lịch hẹn nào sắp tới</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );

      case 'goitap_dichvu':
        return <WorkoutPlansAndServices profileData={profileData} />;

      case 'lichhen':
        return (
          <div className="member-booking-container">
            <div className="member-form-card">
              <h3 className="member-card-title" style={{ marginBottom: '20px' }}>Đăng ký lịch hẹn mới</h3>
              <form className="member-booking-form" onSubmit={handleBookAppointment}>

                <div className="member-form-group">
                  <label className="member-form-label">Chọn Huấn Luyện Viên (PT) để xem lịch</label>
                  <select
                    className="member-form-select"
                    value={selectedTrainerId}
                    onChange={(e) => setSelectedTrainerId(e.target.value)}
                    required
                    disabled={trainersList.length === 0}
                  >
                    {trainersList.length > 0 ? (
                      trainersList.map(t => (
                        <option key={t.trainerId} value={t.trainerId}>
                          {t.fullName} ({t.specialization})
                        </option>
                      ))
                    ) : (
                      <option value="">Bạn chưa có HLV trong gói tập đã đăng ký!</option>
                    )}
                  </select>
                </div>

                {selectedTrainerId && (
                  <div className="member-form-group" style={{ marginTop: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <label className="member-form-label" style={{ margin: 0 }}>Thời khóa biểu (Click vào ca trống để chọn)</label>
                      <div className="week-controls" style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" onClick={() => {
                          const d = new Date(currentWeekStart);
                          d.setDate(d.getDate() - 7);
                          setCurrentWeekStart(d);
                        }} style={{ padding: '4px 8px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                          <i className="fa-solid fa-chevron-left"></i> Tuần trước
                        </button>
                        <button type="button" onClick={() => {
                          const d = new Date(currentWeekStart);
                          d.setDate(d.getDate() + 7);
                          setCurrentWeekStart(d);
                        }} style={{ padding: '4px 8px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                          Tuần sau <i className="fa-solid fa-chevron-right"></i>
                        </button>
                      </div>
                    </div>

                    <div className="timetable-container" style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                      <table className="timetable" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.85rem' }}>
                        <thead>
                          <tr>
                            <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', background: '#f8fafc' }}>Ca \ Ngày</th>
                            {[0, 1, 2, 3, 4, 5, 6].map(i => {
                              const d = new Date(currentWeekStart);
                              const day = d.getDay();
                              const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                              d.setDate(diff + i);
                              return (
                                <th key={i} style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                  {d.toLocaleDateString('vi-VN', { weekday: 'short' })} <br />
                                  {d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {TIME_SLOTS.map((slot, sIdx) => (
                            <tr key={sIdx}>
                              <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', fontWeight: 'bold', background: '#f8fafc' }}>{slot.label}</td>
                              {[0, 1, 2, 3, 4, 5, 6].map(dIdx => {
                                const d = new Date(currentWeekStart);
                                const day = d.getDay();
                                const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                                d.setDate(diff + dIdx);
                                const dateStr = getLocalDateString(d);

                                const isBooked = trainerSchedules.some(s => s.workingDate === dateStr && s.startTime.startsWith(slot.start.substring(0, 5)) && (s.status === 'Booked' || s.status === 'Busy' || s.status === 'Off'));

                                const [slotH, slotM, slotS] = slot.start.split(':').map(Number);
                                const slotDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), slotH, slotM, slotS || 0);
                                const isPast = slotDate < new Date();
                                const isSelected = bookingDate === dateStr && bookingTime === slot.start.substring(0, 5);

                                let bg = '#dcfce7';
                                let color = '#166534';
                                let text = 'Trống';
                                let cursor = 'pointer';

                                if (isPast) {
                                  bg = '#f1f5f9'; color = '#94a3b8'; text = 'Đã qua'; cursor = 'not-allowed';
                                } else if (isBooked) {
                                  bg = '#e2e8f0'; color = '#64748b'; text = 'Bận'; cursor = 'not-allowed';
                                }

                                if (isSelected) {
                                  bg = '#3b82f6'; color = '#ffffff'; text = 'Đang chọn';
                                }

                                return (
                                  <td key={dIdx} onClick={() => {
                                    if (!isBooked && !isPast) {
                                      setBookingDate(dateStr);
                                      setBookingTime(slot.start.substring(0, 5));
                                    }
                                  }} style={{
                                    padding: '8px',
                                    borderBottom: '1px solid #e2e8f0',
                                    borderRight: '1px solid #e2e8f0',
                                    background: bg,
                                    color: color,
                                    cursor: cursor,
                                    transition: 'all 0.2s ease',
                                    boxShadow: isSelected ? 'inset 0 0 0 2px #2563eb' : 'none'
                                  }}>
                                    {text}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {isTrainerScheduleLoading && <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '8px' }}>Đang tải lịch trình...</p>}
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '8px' }}>
                      Đã chọn: <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{bookingDate ? new Date(bookingDate).toLocaleDateString('vi-VN') : 'Chưa chọn'}</span> lúc <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{bookingTime || 'Chưa chọn'}</span>
                    </p>
                  </div>
                )}
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
                {trainersList.length === 0 && (
                  <p style={{ color: '#ef4444', fontSize: '0.82rem', fontWeight: 'bold', margin: '4px 0 0 0' }}>
                    * Bạn chỉ được đặt lịch với HLV mà mình đăng ký gói tập. Vui lòng đăng ký gói tập có kèm HLV trước.
                  </p>
                )}
                <button
                  type="submit"
                  className="member-btn-submit"
                  disabled={isBookingLoading || trainersList.length === 0}
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  {isBookingLoading ? 'Đang gửi...' : 'Gửi yêu cầu đặt lịch'}
                </button>
              </form>
            </div>

            <div className="member-card-panel" style={{ marginBottom: '30px' }}>
              <h3 className="member-card-title" style={{ marginBottom: '20px' }}>Danh sách lịch hẹn sắp tới</h3>
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
                    {upcomingAppointments.map((ap) => (
                      <tr key={ap.id}>
                        <td>{ap.time}</td>
                        <td>{ap.trainer}</td>
                        <td>{ap.type}</td>
                        <td>
                          <span className={`member-badge-status ${ap.status}`}>
                            {ap.status === 'confirmed' ? 'Xác nhận' : 
                             ap.status === 'pending' ? 'Chờ duyệt' : 
                             ap.status === 'rejected' ? 'Bị từ chối' : 
                             ap.status === 'cancelpending' ? (ap.cancelRequestedBy === 'TRAINER' ? 'HLV xin hủy' : 'Chờ duyệt hủy') : 'Đã hủy'}
                          </span>
                        </td>
                        <td>
                          {ap.status === 'cancelpending' ? (
                            ap.cancelRequestedBy === 'TRAINER' ? (
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span 
                                  onClick={() => setSelectedPTCancelRequest(ap)}
                                  style={{ color: 'var(--orange)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.82rem', marginRight: '6px' }}
                                >
                                  Xem lý do
                                </span>
                                <button 
                                  onClick={() => handleRespondPTCancel(ap.id, 'accept')}
                                  style={{ padding: '4px 8px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                                >
                                  Đồng ý
                                </button>
                                <button 
                                  onClick={() => handleRespondPTCancel(ap.id, 'reject')}
                                  style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                                >
                                  Từ chối
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>Đang chờ duyệt hủy</span>
                            )
                          ) : ap.status === 'cancelled' || ap.status === 'rejected' ? null : (
                            <button className="member-action-cancel" onClick={() => handleCancelAppointment(ap.id)}>Hủy</button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {upcomingAppointments.length === 0 && (
                      <tr>
                        <td colSpan="5" className="member-no-data">Không có lịch hẹn nào sắp tới</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="member-card-panel">
              <h3 className="member-card-title" style={{ marginBottom: '20px' }}>Lịch sử lịch hẹn</h3>
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
                    {historyAppointments.map((ap) => (
                      <tr key={ap.id}>
                        <td>{ap.time}</td>
                        <td>{ap.trainer}</td>
                        <td>{ap.type}</td>
                        <td>
                          {renderAppointmentStatus(ap)}
                        </td>
                        <td>
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Đã đóng</span>
                        </td>
                      </tr>
                    ))}
                    {historyAppointments.length === 0 && (
                      <tr>
                        <td colSpan="5" className="member-no-data">Chưa có lịch sử lịch hẹn</td>
                      </tr>
                    )}
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

            {/* Subtabs control */}
            <div className="member-subtabs">
              <button
                type="button"
                className={`member-subtab-btn ${workoutSubTab === 'today' ? 'active' : ''}`}
                onClick={() => setWorkoutSubTab('today')}
              >
                Hôm nay
              </button>
              <button
                type="button"
                className={`member-subtab-btn ${workoutSubTab === 'history' ? 'active' : ''}`}
                onClick={() => setWorkoutSubTab('history')}
              >
                Lịch sử giáo án ({historyWorkoutPlans.length})
              </button>
            </div>

            <div className="member-workout-days">
              {workoutSubTab === 'today' ? (
                todayWorkoutPlans.length > 0 ? (
                  todayWorkoutPlans.map((plan) => (
                    <div className="member-workout-day-card" key={plan.workout_plan_id} style={{ marginBottom: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
                        <h4 className="member-workout-day-title" style={{ margin: 0 }}>
                          <i className="fa-solid fa-dumbbell"></i> {plan.title.toUpperCase()}
                        </h4>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8', background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', fontWeight: '600' }}>
                          Ngày giao: {plan.created_at ? new Date(plan.created_at).toLocaleDateString('vi-VN') : 'Mới'}
                        </span>
                      </div>
                      {plan.description && (
                        <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '6px 0 16px 28px' }}>
                          {plan.description}
                        </p>
                      )}
                      <div className="member-workout-ex-list">
                        {plan.WorkoutExercises && plan.WorkoutExercises.length > 0 ? (
                          plan.WorkoutExercises.map((ex, idx) => {
                            const key = `db-${plan.workout_plan_id}-${idx}`;
                            const isDone = plan.is_completed || completedExercises[key];
                            return (
                              <div className={`member-workout-ex-item ${isDone ? 'completed' : ''}`} key={idx}>
                                <div className="member-workout-ex-left" style={{ paddingLeft: '8px' }}>
                                  <div>
                                    <div className="member-workout-ex-name">{ex.exercise_name}</div>
                                    <div className="member-workout-ex-specs">
                                      {ex.sets} hiệp x {ex.reps} lần {ex.duration_minutes ? `| ${ex.duration_minutes} phút` : ''} {ex.calories_burned ? `| Đốt ${ex.calories_burned} kcal` : ''}
                                    </div>
                                  </div>
                                </div>
                                <i className={`fa-solid ${isDone ? 'fa-circle-check' : 'fa-circle'}`} style={{ color: isDone ? '#22c55e' : '#cbd5e1', fontSize: '1.2rem' }}></i>
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
                  <div className="member-workout-day-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <i className="fa-solid fa-dumbbell" style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '16px' }}></i>
                    <h4 className="member-workout-day-title" style={{ justifyContent: 'center' }}>
                      Chưa có giáo án cho ngày hôm nay
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '8px' }}>
                      Hôm nay bạn chưa có giáo án tập luyện nào mới được giao. Vui lòng kiểm tra tab "Lịch sử giáo án" hoặc liên hệ HLV.
                    </p>
                  </div>
                )
              ) : (
                historyWorkoutPlans.length > 0 ? (
                  historyWorkoutPlans.map((plan) => (
                    <div className="member-workout-day-card" key={plan.workout_plan_id} style={{ marginBottom: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
                        <h4 className="member-workout-day-title" style={{ margin: 0 }}>
                          <i className="fa-solid fa-dumbbell"></i> {plan.title.toUpperCase()}
                        </h4>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', background: '#e2e8f0', padding: '4px 10px', borderRadius: '6px', fontWeight: '700' }}>
                          Ngày giao: {plan.created_at ? new Date(plan.created_at).toLocaleDateString('vi-VN') : 'Lịch sử'}
                        </span>
                      </div>
                      {plan.description && (
                        <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '6px 0 16px 28px' }}>
                          {plan.description}
                        </p>
                      )}
                      <div className="member-workout-ex-list">
                        {plan.WorkoutExercises && plan.WorkoutExercises.length > 0 ? (
                          plan.WorkoutExercises.map((ex, idx) => {
                            return (
                              <div className="member-workout-ex-item" key={idx} style={{ borderLeftColor: '#cbd5e1' }}>
                                <div className="member-workout-ex-left">
                                  <i className="fa-solid fa-circle" style={{ fontSize: '0.45rem', color: '#94a3b8', marginRight: '10px', marginLeft: '4px' }}></i>
                                  <div>
                                    <div className="member-workout-ex-name">{ex.exercise_name}</div>
                                    <div className="member-workout-ex-specs">
                                      {ex.sets} hiệp x {ex.reps} lần {ex.duration_minutes ? `| ${ex.duration_minutes} phút` : ''} {ex.calories_burned ? `| Đốt ${ex.calories_burned} kcal` : ''}
                                    </div>
                                  </div>
                                </div>
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
                  <div className="member-workout-day-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '16px' }}></i>
                    <h4 className="member-workout-day-title" style={{ justifyContent: 'center' }}>
                      Lịch sử giáo án trống
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '8px' }}>
                      Bạn chưa có giáo án tập luyện cũ nào trong lịch sử.
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        );


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
                <div className={`member-notif-item ${n.unread ? 'unread' : ''}`} key={n.id} onClick={() => handleNotificationClick(n)} style={{ cursor: 'pointer' }}>
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

      case 'tuvan_ai':
        {
          const renderBmiGauge = (bmiVal) => {
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

            return (
              <div className="member-card-panel" style={{ marginTop: '20px' }}>
                <h3 className="member-card-title">Chỉ số BMI tư vấn</h3>
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
            );
          };

          return (
            <div className="member-ai-consultation-layout">
              {/* Form & Current result column */}
              <div className="ai-main-column">
                <div className="member-card-panel">
                  <div className="member-card-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                    <h3 className="member-card-title">
                      <i className="fa-solid fa-robot" style={{ marginRight: '8px', color: 'var(--orange)' }}></i>
                      Trợ lý Sức khỏe AI thông minh
                    </h3>
                  </div>

                  {aiError && (
                    <div className="alert err" style={{ display: 'flex', marginTop: '16px' }}>
                      <i className="fa-solid fa-circle-exclamation"></i>
                      <span>{aiError}</span>
                    </div>
                  )}

                  <form onSubmit={handleAiConsult} className="ai-consult-form" style={{ marginTop: '20px' }}>
                    <div className="member-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                      <div className="member-form-group">
                        <label className="member-form-label">Tuổi (năm)</label>
                        <input
                          type="number"
                          className="member-form-input"
                          value={aiAge}
                          onChange={(e) => setAiAge(e.target.value)}
                          required
                          disabled={aiLoading}
                        />
                      </div>
                      <div className="member-form-group">
                        <label className="member-form-label">Giới tính</label>
                        <select
                          className="member-form-select"
                          value={aiGender}
                          onChange={(e) => setAiGender(e.target.value)}
                          disabled={aiLoading}
                        >
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>
                      <div className="member-form-group">
                        <label className="member-form-label">Chiều cao (cm)</label>
                        <input
                          type="number"
                          className="member-form-input"
                          placeholder="170"
                          value={aiHeight}
                          onChange={(e) => setAiHeight(e.target.value)}
                          required
                          disabled={aiLoading}
                        />
                      </div>
                      <div className="member-form-group">
                        <label className="member-form-label">Cân nặng (kg)</label>
                        <input
                          type="number"
                          className="member-form-input"
                          placeholder="65"
                          value={aiWeight}
                          onChange={(e) => setAiWeight(e.target.value)}
                          required
                          disabled={aiLoading}
                        />
                      </div>
                      <div className="member-form-group">
                        <label className="member-form-label">Mục tiêu luyện tập</label>
                        <select
                          className="member-form-select"
                          value={aiFitnessGoal}
                          onChange={(e) => setAiFitnessGoal(e.target.value)}
                          disabled={aiLoading}
                        >
                          <option value="Giảm cân">Giảm cân</option>
                          <option value="Tăng cơ">Tăng cơ</option>
                          <option value="Cải thiện sức bền">Cải thiện sức bền</option>
                          <option value="Linh hoạt & Dẻo dai">Linh hoạt & Dẻo dai</option>
                          <option value="Sức khỏe tổng thể">Sức khỏe tổng thể</option>
                        </select>
                      </div>
                      <div className="member-form-group">
                        <label className="member-form-label">Phương thức tư vấn</label>
                        <select
                          className="member-form-select"
                          value={aiConsultationType}
                          onChange={(e) => setAiConsultationType(e.target.value)}
                          disabled={aiLoading}
                        >
                          <option value="BMI">Chỉ số BMI thể chất</option>
                          <option value="General Fitness">Luyện tập thể hình</option>
                          <option value="Weight Loss">Kế hoạch giảm mỡ</option>
                          <option value="Muscle Gain">Kế hoạch tăng cơ</option>
                          <option value="Relaxation">Yoga & Phục hồi</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="member-btn-submit"
                      style={{ width: '100%', marginTop: '20px', padding: '12px' }}
                      disabled={aiLoading}
                    >
                      {aiLoading ? (
                        <span><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Đang xử lý...</span>
                      ) : 'Nhận tư vấn sức khỏe từ AI'}
                    </button>
                  </form>
                </div>

                {aiLoading && (
                  <div className="member-card-panel" style={{ marginTop: '20px', textAlign: 'center', padding: '40px 20px' }}>
                    <div className="ai-pulse-loader">
                      <i className="fa-solid fa-robot fa-bounce" style={{ fontSize: '3rem', color: 'var(--orange)' }}></i>
                    </div>
                    <h4 style={{ marginTop: '20px', color: '#1e293b' }}>{aiLoadingStep}</h4>
                    <p style={{ color: '#94a3b8', fontSize: '0.86rem', marginTop: '8px' }}>Quá trình phân tích chỉ số có thể mất vài giây...</p>
                  </div>
                )}

                {aiResult && !aiLoading && (
                  <div className="ai-results-wrapper animate-slide-up" style={{ marginTop: '20px' }}>
                    {renderBmiGauge(Number(aiResult.bmi))}

                    <div className="member-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: '20px', gap: '16px' }}>
                      <div className="member-stat-card" style={{ borderLeft: '4px solid var(--orange)' }}>
                        <span className="member-stat-label">Môn thể thao khuyên dùng</span>
                        <span className="member-stat-value" style={{ fontSize: '1.25rem', marginTop: '10px', color: '#1e293b' }}>{aiResult.recommended_sport}</span>
                        <i className="fa-solid fa-person-running member-stat-icon"></i>
                      </div>
                      <div className="member-stat-card" style={{ borderLeft: '4px solid #10b981' }}>
                        <span className="member-stat-label">Gói tập đề xuất</span>
                        <span className="member-stat-value" style={{ fontSize: '1.25rem', marginTop: '10px', color: '#1e293b' }}>{aiResult.recommended_membership}</span>
                        <i className="fa-solid fa-address-card member-stat-icon"></i>
                      </div>
                    </div>

                    <div className="member-card-panel" style={{ marginTop: '20px' }}>
                      <h4 className="member-card-title"><i className="fa-solid fa-calendar-alt" style={{ marginRight: '8px', color: 'var(--orange)' }}></i>Lịch trình rèn luyện tuần gợi ý</h4>
                      <p style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', marginTop: '12px', fontSize: '0.9rem', color: '#334155', fontWeight: '500', borderLeft: '3px solid var(--orange)' }}>
                        {aiResult.recommended_schedule}
                      </p>
                    </div>

                    <div className="member-card-panel" style={{ marginTop: '20px' }}>
                      <h4 className="member-card-title"><i className="fa-solid fa-heart-pulse" style={{ marginRight: '8px', color: '#ef4444' }}></i>Lời khuyên chi tiết từ AI</h4>
                      <p style={{ marginTop: '12px', fontSize: '0.9rem', color: '#475569', lineHeight: '1.6', textAlign: 'justify' }}>
                        {aiResult.recommendation_detail}
                      </p>
                    </div>

                    <button
                      onClick={handleApplyAiMetricsToProfile}
                      className="member-btn-submit"
                      style={{ width: '100%', marginTop: '20px', backgroundColor: '#3b82f6', border: 'none', padding: '12px' }}
                    >
                      <i className="fa-solid fa-user-check" style={{ marginRight: '8px' }}></i> Áp dụng chỉ số cơ thể vào Hồ sơ chính thức
                    </button>
                  </div>
                )}
              </div>

              {/* History Sidebar column */}
              <div className="ai-history-column">
                <div className="member-card-panel" style={{ height: '100%', minHeight: '350px' }}>
                  <h3 className="member-card-title" style={{ marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                    <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '8px', color: '#64748b' }}></i>
                    Lịch sử tư vấn
                  </h3>
                  <div className="ai-history-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px', overflowY: 'auto' }}>
                    {aiHistory.filter(item => item.consultationType !== 'Meal Plan').map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className={`ai-history-item ${aiResult?.id === item.id ? 'active' : ''}`}
                        onClick={() => {
                          setAiResult({
                            id: item.id,
                            bmi: item.bmi,
                            height: item.height,
                            weight: item.weight,
                            recommended_sport: item.recommendedSport,
                            recommended_membership: item.recommendedMembership,
                            recommended_schedule: item.recommendedSchedule,
                            recommendation_detail: item.recommendationDetail
                          });
                        }}
                        style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b' }}>
                          <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                          <span style={{ fontWeight: '600', color: 'var(--orange)' }}>{item.consultationType}</span>
                        </div>
                        <div style={{ fontWeight: 'bold', marginTop: '6px', fontSize: '0.86rem', color: '#1e293b' }}>
                          BMI: {item.bmi} ({item.weight}kg / {item.height}cm)
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Môn: {item.recommendedSport}
                        </div>
                      </div>
                    ))}
                    {aiHistory.filter(item => item.consultationType !== 'Meal Plan').length === 0 && (
                      <div style={{ color: '#94a3b8', fontSize: '0.86rem', textAlign: 'center', marginTop: '30px' }}>Chưa có lịch sử tư vấn nào</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        }

      case 'ai_meal':
        {
          const parseMeals = (item) => {
            if (!item) return null;
            if (item.meals) return item.meals;
            if (item.recommendedSchedule) {
              try {
                return JSON.parse(item.recommendedSchedule);
              } catch (e) {
                return {
                  breakfast: "Theo lịch trình: " + item.recommendedSchedule,
                  lunch: "Tham khảo chế độ dinh dưỡng",
                  dinner: "Liên hệ HLV hoặc AI tư vấn thêm",
                  snack_drinks: "Uống đủ nước, bổ sung khoáng chất"
                };
              }
            }
            return null;
          };

          const meals = parseMeals(aiMealResult);

          return (
            <div className="member-ai-meal-layout">
              {/* Form & Current result column */}
              <div className="ai-meal-main-column">
                <div className="member-card-panel">
                  <div className="member-card-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="member-card-title">
                      <i className="fa-solid fa-robot" style={{ marginRight: '8px', color: '#10b981' }}></i>
                      Trợ lý Dinh dưỡng AI tối ưu
                    </h3>
                    <button
                      type="button"
                      onClick={syncMealPlanMetricsWithProfile}
                      className="sync-profile-btn"
                      title="Đồng bộ chỉ số thể chất từ Hồ sơ của bạn"
                    >
                      <i className="fa-solid fa-rotate"></i> Đồng bộ Hồ sơ
                    </button>
                  </div>

                  {aiMealError && (
                    <div className="alert err" style={{ display: 'flex', marginTop: '16px' }}>
                      <i className="fa-solid fa-circle-exclamation"></i>
                      <span>{aiMealError}</span>
                    </div>
                  )}

                  <form onSubmit={handleGenerateMealPlan} className="ai-consult-form" style={{ marginTop: '20px' }}>
                    <div className="member-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                      <div className="member-form-group">
                        <label className="member-form-label">Tuổi (năm)</label>
                        <input
                          type="number"
                          className="member-form-input"
                          value={aiMealAge}
                          onChange={(e) => setAiMealAge(e.target.value)}
                          required
                          disabled={aiMealLoading}
                        />
                      </div>
                      <div className="member-form-group">
                        <label className="member-form-label">Giới tính</label>
                        <select
                          className="member-form-select"
                          value={aiMealGender}
                          onChange={(e) => setAiMealGender(e.target.value)}
                          disabled={aiMealLoading}
                        >
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>
                      <div className="member-form-group">
                        <label className="member-form-label">Chiều cao (cm)</label>
                        <input
                          type="number"
                          className="member-form-input"
                          placeholder="170"
                          value={aiMealHeight}
                          onChange={(e) => setAiMealHeight(e.target.value)}
                          required
                          disabled={aiMealLoading}
                        />
                      </div>
                      <div className="member-form-group">
                        <label className="member-form-label">Cân nặng (kg)</label>
                        <input
                          type="number"
                          className="member-form-input"
                          placeholder="65"
                          value={aiMealWeight}
                          onChange={(e) => setAiMealWeight(e.target.value)}
                          required
                          disabled={aiMealLoading}
                        />
                      </div>
                    </div>

                    {/* Mode Tabs */}
                    <div className="ai-meal-mode-tabs" style={{ marginTop: '20px' }}>
                      <button
                        type="button"
                        className={`mode-tab-btn ${aiMealMode === 'pt_workout' ? 'active' : ''}`}
                        onClick={() => setAiMealMode('pt_workout')}
                        disabled={aiMealLoading}
                      >
                        <i className="fa-solid fa-dumbbell"></i> Theo Giáo Án PT Giao
                      </button>
                      <button
                        type="button"
                        className={`mode-tab-btn ${aiMealMode === 'goal' ? 'active' : ''}`}
                        onClick={() => setAiMealMode('goal')}
                        disabled={aiMealLoading}
                      >
                        <i className="fa-solid fa-bullseye"></i> Theo Nhu Cầu Cá Nhân
                      </button>
                    </div>

                    {/* Mode dependent selection */}
                    <div className="ai-meal-mode-options" style={{ marginTop: '16px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      {aiMealMode === 'pt_workout' ? (
                        <div>
                          <label className="member-form-label" style={{ fontWeight: '700', marginBottom: '8px', display: 'block' }}>Giáo án luyện tập được PT giao hôm nay:</label>
                          {todayWorkoutPlans && todayWorkoutPlans.length > 0 ? (
                            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
                              {todayWorkoutPlans.slice(0, 1).map((p) => {
                                const isCompleted = p.is_completed || workoutProgressPct === 100;
                                return (
                                  <div key={p.workout_plan_id}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                      <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--orange)' }}>{p.title}</span>
                                      <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: isCompleted ? '#166534' : '#92400e', backgroundColor: isCompleted ? '#d1fae5' : '#fef3c7', padding: '2px 8px', borderRadius: '12px' }}>
                                        {isCompleted ? 'Hoàn thành' : 'Đang thực hiện'}
                                      </span>
                                    </div>
                                    <p style={{ margin: '0 0 12px 0', fontSize: '0.84rem', color: '#64748b' }}>
                                      {p.description || 'Chưa có mô tả chi tiết giáo án.'}
                                    </p>

                                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginBottom: '16px' }}>
                                      <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '8px' }}>DANH SÁCH BÀI TẬP:</span>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {p.WorkoutExercises && p.WorkoutExercises.map((ex, exIdx) => {
                                          const key = `db-${p.workout_plan_id}-${exIdx}`;
                                          const exDone = p.is_completed || completedExercises[key];
                                          return (
                                            <div key={exIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem' }}>
                                              <i className={exDone ? "fa-solid fa-circle-check" : "fa-regular fa-circle"} style={{ color: exDone ? '#10b981' : '#cbd5e1', fontSize: '1rem' }}></i>
                                              <span style={{ textDecoration: exDone ? 'line-through' : 'none', color: exDone ? '#94a3b8' : '#334155', fontWeight: '500' }}>
                                                {ex.exercise_name} ({ex.sets} hiệp x {ex.reps} lần {ex.duration_minutes ? `| ${ex.duration_minutes} phút` : ''})
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    <div style={{ background: isCompleted ? '#f0fdf4' : '#fffbeb', border: `1px solid ${isCompleted ? '#bbf7d0' : '#fef3c7'}`, padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      <i className={`fa-solid ${isCompleted ? 'fa-circle-check' : 'fa-triangle-exclamation'}`} style={{ color: isCompleted ? '#10b981' : '#d97706', fontSize: '1.25rem' }}></i>
                                      <div>
                                        <div style={{ fontSize: '0.84rem', fontWeight: 'bold', color: isCompleted ? '#166534' : '#92400e' }}>
                                          Tiến độ: {completedExsCount} / {totalExs} bài tập ({workoutProgressPct}%)
                                        </div>
                                        <div style={{ fontSize: '0.76rem', color: isCompleted ? '#15803d' : '#b45309', marginTop: '2px', lineHeight: '1.3' }}>
                                          {isCompleted 
                                            ? 'Tuyệt vời! Bạn đã hoàn thành 100% bài tập hôm nay. Nhấp nút phía dưới để đồng bộ dữ liệu cho AI phân tích thực đơn.' 
                                            : 'Yêu cầu: Bạn cần hoàn thành (tick đủ) tất cả các bài tập của giáo án hôm nay để được mở khóa chức năng gợi ý thực đơn hồi phục của AI.'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div style={{ background: '#ffffff', padding: '24px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', textAlign: 'center', color: '#94a3b8' }}>
                              <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: '10px', display: 'block' }}></i>
                              Hôm nay bạn chưa được PT giao giáo án tập luyện nào.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <label className="member-form-label">Chọn nhu cầu / mục tiêu sức khỏe của bạn:</label>
                          <div className="ai-meal-goals-grid">
                            {[
                              { key: 'Tăng cơ', label: 'Tăng cơ & Phát triển thể chất', icon: 'fa-cubes' },
                              { key: 'Giảm mỡ', label: 'Giảm mỡ & Thâm hụt Calo nhẹ', icon: 'fa-fire-flame-curved' },
                              { key: 'Dẻo dai', label: 'Dẻo dai & Thanh lọc cơ thể', icon: 'fa-leaf' },
                              { key: 'Sức bền', label: 'Sức bền & Năng lượng kéo dài', icon: 'fa-bolt' }
                            ].map((g) => (
                              <button
                                key={g.key}
                                type="button"
                                className={`goal-btn ${aiMealGoal === g.key ? 'active' : ''}`}
                                onClick={() => setAiMealGoal(g.key)}
                                disabled={aiMealLoading}
                              >
                                <i className={`fa-solid ${g.icon}`}></i> {g.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="member-btn-submit ai-meal-submit-btn"
                      style={{ width: '100%', marginTop: '20px', padding: '14px', background: (aiMealMode === 'pt_workout' && (workoutProgressPct < 100 || todayWorkoutPlans.length === 0)) ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)', border: 'none', fontSize: '1rem', fontWeight: 'bold' }}
                      disabled={aiMealLoading || (aiMealMode === 'pt_workout' && (workoutProgressPct < 100 || !todayWorkoutPlans || todayWorkoutPlans.length === 0))}
                    >
                      {aiMealLoading ? (
                        <span><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Đang xử lý thực đơn...</span>
                      ) : (aiMealMode === 'pt_workout' && todayWorkoutPlans.length === 0) ? (
                        <span><i className="fa-solid fa-lock" style={{ marginRight: '8px' }}></i> Chưa được giao giáo án hôm nay</span>
                      ) : (aiMealMode === 'pt_workout' && workoutProgressPct < 100) ? (
                        <span><i className="fa-solid fa-lock" style={{ marginRight: '8px' }}></i> Hãy hoàn thành giáo án để mở khóa</span>
                      ) : (
                        <span><i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: '8px' }}></i> Gợi ý thực đơn dinh dưỡng AI</span>
                      )}
                    </button>
                  </form>
                </div>

                {aiMealLoading && (
                  <div className="member-card-panel" style={{ marginTop: '20px', textAlign: 'center', padding: '40px 20px' }}>
                    <div className="ai-pulse-loader">
                      <i className="fa-solid fa-bowl-food fa-bounce" style={{ fontSize: '3.5rem', color: '#10b981' }}></i>
                    </div>
                    <h4 style={{ marginTop: '20px', color: '#1e293b' }}>{aiMealLoadingStep}</h4>
                    <p style={{ color: '#94a3b8', fontSize: '0.86rem', marginTop: '8px' }}>Hệ thống đang phân tích khẩu phần & nhu cầu calo tối ưu...</p>
                  </div>
                )}

                {aiMealResult && !aiMealLoading && (
                  <div className="ai-results-wrapper animate-slide-up" style={{ marginTop: '20px' }}>
                    {/* Calo and Macro Summary */}
                    <div className="member-card-panel" style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderLeft: '4px solid #10b981' }}>
                      <h4 className="member-card-title" style={{ color: '#0f172a' }}>Chỉ số Dinh dưỡng Đề xuất</h4>
                      <div className="ai-meal-macro-summary" style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', marginTop: '16px' }}>
                        <div className="ai-meal-calories-box">
                          <span className="cal-val">{aiMealResult.target_calories || aiMealResult.targetCalories || 2000}</span>
                          <span className="cal-lbl">Kcal / Ngày</span>
                        </div>
                        <div className="ai-meal-macros-bars" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 'bold', color: '#475569' }}>
                              <span>💪 Protein (Chất đạm)</span>
                              <span>{aiMealResult.macro_protein_pct || aiMealResult.macroProteinPct || 25}%</span>
                            </div>
                            <div className="macro-bar-bg"><div className="macro-bar-fill protein" style={{ width: `${aiMealResult.macro_protein_pct || aiMealResult.macroProteinPct || 25}%` }}></div></div>
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 'bold', color: '#475569' }}>
                              <span>🌾 Carbs (Tinh bột)</span>
                              <span>{aiMealResult.macro_carbs_pct || aiMealResult.macroCarbsPct || 50}%</span>
                            </div>
                            <div className="macro-bar-bg"><div className="macro-bar-fill carbs" style={{ width: `${aiMealResult.macro_carbs_pct || aiMealResult.macroCarbsPct || 50}%` }}></div></div>
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 'bold', color: '#475569' }}>
                              <span>🥑 Fats (Chất béo)</span>
                              <span>{aiMealResult.macro_fat_pct || aiMealResult.macroFatPct || 25}%</span>
                            </div>
                            <div className="macro-bar-bg"><div className="macro-bar-fill fat" style={{ width: `${aiMealResult.macro_fat_pct || aiMealResult.macroFatPct || 25}%` }}></div></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Meals Grid */}
                    {meals && (
                      <div className="ai-meals-grid" style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                        <div className="member-card-panel meal-card-interactive" style={{ borderLeft: '4px solid #f59e0b', background: '#fff' }}>
                          <h4 style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>
                            <i className="fa-solid fa-egg"></i> Bữa Sáng
                          </h4>
                          <p style={{ marginTop: '10px', fontSize: '0.88rem', color: '#334155', lineHeight: '1.5' }}>{meals.breakfast}</p>
                        </div>
                        <div className="member-card-panel meal-card-interactive" style={{ borderLeft: '4px solid #10b981', background: '#fff' }}>
                          <h4 style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>
                            <i className="fa-solid fa-bowl-food"></i> Bữa Trưa
                          </h4>
                          <p style={{ marginTop: '10px', fontSize: '0.88rem', color: '#334155', lineHeight: '1.5' }}>{meals.lunch}</p>
                        </div>
                        <div className="member-card-panel meal-card-interactive" style={{ borderLeft: '4px solid #3b82f6', background: '#fff' }}>
                          <h4 style={{ color: '#2563eb', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>
                            <i className="fa-solid fa-fish"></i> Bữa Tối
                          </h4>
                          <p style={{ marginTop: '10px', fontSize: '0.88rem', color: '#334155', lineHeight: '1.5' }}>{meals.dinner}</p>
                        </div>
                        <div className="member-card-panel meal-card-interactive" style={{ borderLeft: '4px solid #8b5cf6', background: '#fff' }}>
                          <h4 style={{ color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>
                            <i className="fa-solid fa-wine-glass-empty"></i> Bữa Phụ & Uống
                          </h4>
                          <p style={{ marginTop: '10px', fontSize: '0.88rem', color: '#334155', lineHeight: '1.5' }}>{meals.snack_drinks || meals.snack || "Sinh tố hạt hoặc Whey protein bổ sung."}</p>
                        </div>
                      </div>
                    )}

                    {/* Scientific Advice */}
                    <div className="member-card-panel" style={{ marginTop: '20px', borderLeft: '4px solid #6366f1', background: '#fff' }}>
                      <h4 className="member-card-title" style={{ color: '#4f46e5' }}>
                        <i className="fa-solid fa-lightbulb" style={{ marginRight: '8px' }}></i> Lời khuyên Khoa học từ AI
                      </h4>
                      <p style={{ marginTop: '12px', fontSize: '0.9rem', color: '#475569', lineHeight: '1.6', textAlign: 'justify' }}>
                        {aiMealResult.scientific_advice || aiMealResult.scientificAdvice}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* History Sidebar column */}
              <div className="ai-meal-history-column">
                <div className="member-card-panel" style={{ height: '100%', minHeight: '350px' }}>
                  <h3 className="member-card-title" style={{ marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                    <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '8px', color: '#64748b' }}></i>
                    Thực đơn đã lưu
                  </h3>
                  <div className="ai-history-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '580px', overflowY: 'auto' }}>
                    {aiHistory.filter(item => item.consultationType === 'Meal Plan').map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className={`ai-history-item ${aiMealResult?.id === item.id ? 'active' : ''}`}
                        onClick={() => {
                          let mealsData = null;
                          if (item.recommendedSchedule) {
                            try {
                              mealsData = JSON.parse(item.recommendedSchedule);
                            } catch(e) {
                              mealsData = { breakfast: item.recommendedSchedule };
                            }
                          }
                          setAiMealResult({
                            id: item.id,
                            bmi: item.bmi,
                            height: item.height,
                            weight: item.weight,
                            age: item.age,
                            gender: item.gender,
                            fitnessGoal: item.fitnessGoal,
                            target_calories: item.recommendedSport ? 2300 : 1900,
                            macro_protein_pct: 25,
                            macro_carbs_pct: 50,
                            macro_fat_pct: 25,
                            meals: mealsData,
                            scientific_advice: item.recommendationDetail,
                            createdAt: item.createdAt
                          });
                          setSelectedHistoryMeal(item);
                        }}
                        style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b' }}>
                          <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                          <span style={{ fontWeight: '800', color: '#10b981' }}>Meal Plan</span>
                        </div>
                        <div style={{ fontWeight: 'bold', marginTop: '8px', fontSize: '0.88rem', color: 'var(--orange)', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {item.fitnessGoal 
                            ? (item.fitnessGoal.startsWith('Giáo án') || item.fitnessGoal.startsWith('Nhu cầu') 
                                ? item.fitnessGoal 
                                : `Nhu cầu: ${item.fitnessGoal}`)
                            : 'Tư vấn Dinh dưỡng'}
                        </div>
                      </div>
                    ))}
                    {aiHistory.filter(item => item.consultationType === 'Meal Plan').length === 0 && (
                      <div style={{ color: '#94a3b8', fontSize: '0.86rem', textAlign: 'center', marginTop: '30px' }}>Chưa có thực đơn AI nào được tạo</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        }

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
              <button
                type="button"
                className="member-checkin-btn"
                onClick={() => setCheckinModalOpen(true)}
              >
                <i className="fa-solid fa-qrcode"></i> Check-in
              </button>
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
                className={`member-menu-item ${activeTab === 'goitap_dichvu' ? 'active' : ''}`}
                onClick={() => setActiveTab('goitap_dichvu')}
              >
                <i className="fa-solid fa-rectangle-list"></i> Gói tập và dịch vụ
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
                className={`member-menu-item ${activeTab === 'ai_meal' ? 'active' : ''}`}
                onClick={() => setActiveTab('ai_meal')}
              >
                <i className="fa-solid fa-robot" style={{ color: '#10b981' }}></i> AI Meal Plan
              </button>
            </li>
            <li>
              <button
                className={`member-menu-item ${activeTab === 'tuvan_ai' ? 'active' : ''}`}
                onClick={() => setActiveTab('tuvan_ai')}
              >
                <i className="fa-solid fa-robot" style={{ color: 'var(--orange)' }}></i> Tư vấn AI
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
            {/* ── MEMBER CHECK-IN MODAL – GỬI QR VỀ GMAIL ── */}
      {checkinModalOpen && (
        <div className="member-qr-modal-overlay">
          <div className="member-qr-modal-container" style={{ maxWidth: '420px', fontFamily: '"Be Vietnam Pro", sans-serif' }}>
            <button
              type="button"
              className="member-qr-modal-close"
              onClick={() => {
                setCheckinModalOpen(false);
                setJustCheckedIn(false);
                setQrSendStatus(null);
                setQrSendMessage('');
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #f97316, #ef4444)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px auto',
                boxShadow: '0 8px 20px rgba(249,115,22,0.35)'
              }}>
                <i className="fa-solid fa-qrcode" style={{ fontSize: '1.8rem', color: '#fff' }}></i>
              </div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>
                NHẬN MÃ QR CHECK-IN
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: '1.5' }}>
                Đưa mã QR cố định dưới đây cho lễ tân quét để xác nhận vào phòng tập.
              </p>
            </div>

            {/* Ảnh QR tĩnh */}
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              {isQrLoading ? (
                <div style={{ padding: '40px 0' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#f97316' }}></i>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '10px' }}>Đang tải mã QR...</p>
                </div>
              ) : memberQrCodeUrl ? (
                <div style={{ display: 'inline-block', padding: '12px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <img src={memberQrCodeUrl} alt="My QR Code" style={{ width: '200px', height: '200px', display: 'block' }} />
                </div>
              ) : (
                <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>Không thể tải mã QR!</p>
              )}
            </div>

            {/* Nút cấp lại QR */}
            <button
              type="button"
              onClick={() => setRegenerateModalOpen(true)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #475569, #334155)',
                color: '#ffffff',
                border: 'none',
                fontWeight: '700',
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(71,85,105,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                marginBottom: '20px'
              }}
            >
              <i className="fa-solid fa-arrows-rotate"></i> Cấp lại mã QR mới
            </button>

            {/* Lịch sử check-in */}
            <div style={{ textAlign: 'left' }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '6px' }}></i> Lịch sử vào phòng tập
              </h4>
              <div style={{ maxHeight: '110px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {memberCheckinHistory.slice(0, 3).map((h, index) => {
                  const checkinDate = new Date(h.checkinTime);
                  return (
                    <div key={h.checkinId || index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#334155', padding: '6px 10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontWeight: '600' }}><i className="fa-regular fa-calendar-check" style={{ color: '#10b981', marginRight: '6px' }}></i> Ngày {checkinDate.toLocaleDateString('vi-VN')}</span>
                      <span style={{ fontWeight: '700', color: 'var(--orange)' }}>Giờ: {checkinDate.toLocaleTimeString('vi-VN')}</span>
                    </div>
                  );
                })}
                {memberCheckinHistory.length === 0 && (
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center', padding: '10px' }}>Chưa có lịch sử check-in</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SUCCESS MODAL KHI CHECK-IN THÀNH CÔNG ── */}
      {justCheckedIn && (
        <div className="member-qr-modal-overlay" style={{ zIndex: 999999 }}>
          <div className="animate-scale-in" style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            width: '95%',
            maxWidth: '560px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
            padding: '40px',
            position: 'relative',
            textAlign: 'center',
            border: '2.5px solid #10b981',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}>
            {/* Decorative background gradients */}
            <div style={{
              position: 'absolute',
              top: '-150px',
              left: '-150px',
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-150px',
              right: '-150px',
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />

            {/* Checkmark circle */}
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              border: '4px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
              fontSize: '3rem',
              margin: '0 auto 24px auto',
              boxShadow: '0 10px 25px rgba(16,185,129,0.2)'
            }}>
              <i className="fa-solid fa-circle-check"></i>
            </div>

            <h3 style={{ 
              color: '#065f46', 
              fontWeight: '900', 
              fontSize: '1.75rem', 
              margin: '0 0 12px 0', 
              letterSpacing: '0.5px' 
            }}>
              CHECK-IN THÀNH CÔNG!
            </h3>
            
            <p style={{ 
              fontSize: '1.05rem', 
              color: '#334155', 
              margin: '0 0 16px 0', 
              fontWeight: '600', 
              lineHeight: '1.6',
              fontFamily: '"Be Vietnam Pro", sans-serif' 
            }}>
              Hệ thống đã xác nhận bạn vào phòng tập.<br/>
              Cảm ơn và chúc bạn có một buổi tập luyện thật tuyệt vời! 💪
            </p>

            {lastCheckinTime && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#f0fdf4',
                border: '1.5px solid #d1fae5',
                padding: '10px 20px',
                borderRadius: '30px',
                fontSize: '0.92rem',
                color: '#166534',
                fontWeight: '700',
                marginBottom: '30px'
              }}>
                <i className="fa-solid fa-clock"></i>
                Thời gian vào: {new Date(lastCheckinTime).toLocaleTimeString('vi-VN')} - {new Date(lastCheckinTime).toLocaleDateString('vi-VN')}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setJustCheckedIn(false);
                  setCheckinModalOpen(false);
                }}
                style={{
                  padding: '14px 60px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: '800',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(16,185,129,0.3)',
                  letterSpacing: '0.05em',
                  transition: 'transform 0.15s, box-shadow 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(16,185,129,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(16,185,129,0.3)'; }}
              >
                XÁC NHẬN
              </button>
            </div>
          </div>
        </div>
      )}

      {cancellationModalOpen && (
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
              Lý do hủy lịch hẹn tập
            </h3>
            <p style={{
              margin: '0 0 16px 0',
              fontSize: '0.88rem',
              color: '#64748b',
              lineHeight: '1.5'
            }}>
              Vui lòng nhập lý do hủy lịch hẹn tập. Yêu cầu hủy sẽ được gửi đến Huấn luyện viên của bạn để xét duyệt.
            </p>
            <textarea
              placeholder="Nhập lý do hủy lịch hẹn..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
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
                  setCancellationModalOpen(false);
                  setCancellationReason('');
                  setCancellationAppointmentId(null);
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
                onClick={submitCancellationRequest}
                disabled={isCancellationSubmitting || !cancellationReason.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: !cancellationReason.trim() ? '#cbd5e1' : 'var(--orange)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: !cancellationReason.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  transition: 'background-color 0.2s'
                }}
              >
                {isCancellationSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* PT Cancellation Request Details Modal (for Member) */}
      {selectedPTCancelRequest && (
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
              <i className="fa-solid fa-circle-exclamation"></i> HLV yêu cầu hủy lịch dạy
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
              <div><strong>Huấn luyện viên:</strong> {selectedPTCancelRequest.trainer}</div>
              <div><strong>Thời gian học:</strong> {selectedPTCancelRequest.time}</div>
              <div style={{ marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                <strong>Lý do xin hủy của HLV:</strong>
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
                  {selectedPTCancelRequest.cancelReason || 'Không có lý do chi tiết.'}
                </div>
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#94a3b8', textAlign: 'right' }}>
                Yêu cầu lúc: {selectedPTCancelRequest.cancelRequestedAt ? new Date(selectedPTCancelRequest.cancelRequestedAt).toLocaleDateString('vi-VN') : 'N/A'}
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
                onClick={() => setSelectedPTCancelRequest(null)}
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
                onClick={() => {
                  handleRespondPTCancel(selectedPTCancelRequest.id, 'reject');
                  setSelectedPTCancelRequest(null);
                }}
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
                onClick={() => {
                  handleRespondPTCancel(selectedPTCancelRequest.id, 'accept');
                  setSelectedPTCancelRequest(null);
                }}
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
                Đồng ý hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedHistoryMeal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#1e293b' }}>
                  Chi tiết Thực đơn Dinh dưỡng
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Ngày tạo: {new Date(selectedHistoryMeal.createdAt).toLocaleDateString('vi-VN')} {new Date(selectedHistoryMeal.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <button
                onClick={() => setSelectedHistoryMeal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '50%',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Info Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>PHÂN LOẠI TƯ VẤN:</span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 'bold', color: 'var(--orange)' }}>
                    {selectedHistoryMeal.fitnessGoal 
                      ? (selectedHistoryMeal.fitnessGoal.startsWith('Giáo án') || selectedHistoryMeal.fitnessGoal.startsWith('Nhu cầu') 
                          ? selectedHistoryMeal.fitnessGoal 
                          : `Nhu cầu: ${selectedHistoryMeal.fitnessGoal}`)
                      : 'Tư vấn Dinh dưỡng'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>MỤC TIÊU NĂNG LƯỢNG TỐI ƯU:</span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 'bold', color: '#10b981' }}>
                    {calculateHistoryCalories(selectedHistoryMeal)} Kcal / ngày
                  </span>
                </div>
              </div>

              {/* Meals Table/List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 'bold', color: '#334155' }}>
                  <i className="fa-solid fa-utensils" style={{ marginRight: '8px', color: '#10b981' }}></i>
                  Thực đơn bữa ăn chi tiết trong ngày:
                </h4>
                
                {/* Breakfast */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #f1f5f9',
                  borderLeft: '4px solid #f59e0b',
                  borderRadius: '8px'
                }}>
                  <div style={{ color: '#d97706', fontSize: '1.2rem', display: 'flex', alignItems: 'flex-start', paddingTop: '2px' }}>
                    <i className="fa-solid fa-egg"></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', fontSize: '0.88rem', color: '#d97706', marginBottom: '4px' }}>Bữa Sáng:</strong>
                    <p style={{ margin: 0, fontSize: '0.86rem', color: '#334155', lineHeight: '1.5' }}>
                      {(() => {
                        try {
                          const parsed = JSON.parse(selectedHistoryMeal.recommendedSchedule);
                          return parsed.breakfast;
                        } catch (e) {
                          return selectedHistoryMeal.recommendedSchedule;
                        }
                      })()}
                    </p>
                  </div>
                </div>

                {/* Lunch */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #f1f5f9',
                  borderLeft: '4px solid #10b981',
                  borderRadius: '8px'
                }}>
                  <div style={{ color: '#059669', fontSize: '1.2rem', display: 'flex', alignItems: 'flex-start', paddingTop: '2px' }}>
                    <i className="fa-solid fa-bowl-food"></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', fontSize: '0.88rem', color: '#059669', marginBottom: '4px' }}>Bữa Trưa:</strong>
                    <p style={{ margin: 0, fontSize: '0.86rem', color: '#334155', lineHeight: '1.5' }}>
                      {(() => {
                        try {
                          const parsed = JSON.parse(selectedHistoryMeal.recommendedSchedule);
                          return parsed.lunch || 'Tham khảo chế độ dinh dưỡng';
                        } catch (e) {
                          return 'Tham khảo chế độ dinh dưỡng';
                        }
                      })()}
                    </p>
                  </div>
                </div>

                {/* Dinner */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #f1f5f9',
                  borderLeft: '4px solid #3b82f6',
                  borderRadius: '8px'
                }}>
                  <div style={{ color: '#2563eb', fontSize: '1.2rem', display: 'flex', alignItems: 'flex-start', paddingTop: '2px' }}>
                    <i className="fa-solid fa-fish"></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', fontSize: '0.88rem', color: '#2563eb', marginBottom: '4px' }}>Bữa Tối:</strong>
                    <p style={{ margin: 0, fontSize: '0.86rem', color: '#334155', lineHeight: '1.5' }}>
                      {(() => {
                        try {
                          const parsed = JSON.parse(selectedHistoryMeal.recommendedSchedule);
                          return parsed.dinner || 'Liên hệ HLV hoặc AI tư vấn thêm';
                        } catch (e) {
                          return 'Liên hệ HLV hoặc AI tư vấn thêm';
                        }
                      })()}
                    </p>
                  </div>
                </div>

                {/* Snack / Drinks */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #f1f5f9',
                  borderLeft: '4px solid #8b5cf6',
                  borderRadius: '8px'
                }}>
                  <div style={{ color: '#7c3aed', fontSize: '1.2rem', display: 'flex', alignItems: 'flex-start', paddingTop: '2px' }}>
                    <i className="fa-solid fa-wine-glass-empty"></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', fontSize: '0.88rem', color: '#7c3aed', marginBottom: '4px' }}>Bữa Phụ & Uống:</strong>
                    <p style={{ margin: 0, fontSize: '0.86rem', color: '#334155', lineHeight: '1.5' }}>
                      {(() => {
                        try {
                          const parsed = JSON.parse(selectedHistoryMeal.recommendedSchedule);
                          return parsed.snack_drinks || parsed.snack || 'Uống đủ nước, bổ sung khoáng chất';
                        } catch (e) {
                          return 'Uống đủ nước, bổ sung khoáng chất';
                        }
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Scientific Advice */}
              {selectedHistoryMeal.recommendationDetail && (
                <div style={{
                  padding: '14px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderLeft: '4px solid #6366f1',
                  borderRadius: '8px'
                }}>
                  <strong style={{ display: 'block', fontSize: '0.88rem', color: '#4f46e5', marginBottom: '6px' }}>
                    <i className="fa-solid fa-lightbulb" style={{ marginRight: '6px' }}></i> Lời khuyên Khoa học từ AI:
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.86rem', color: '#475569', lineHeight: '1.6', textAlign: 'justify' }}>
                    {selectedHistoryMeal.recommendationDetail}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'flex-end',
              background: '#f8fafc',
              borderBottomLeftRadius: '16px',
              borderBottomRightRadius: '16px'
            }}>
              <button
                onClick={() => setSelectedHistoryMeal(null)}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#64748b',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#475569'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#64748b'; }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL XÁC NHẬN MẬT KHẨU CẤP LẠI QR ── */}
      {regenerateModalOpen && (
        <div className="member-qr-modal-overlay" style={{ zIndex: 999999 }}>
          <div className="member-qr-modal-container" style={{ maxWidth: '380px', padding: '30px', fontFamily: '"Be Vietnam Pro", sans-serif' }}>
            <button
              type="button"
              className="member-qr-modal-close"
              onClick={() => {
                setRegenerateModalOpen(false);
                setConfirmPassword('');
                setRegenerateError('');
                setRegenerateSuccess('');
              }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '1.25rem',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', textAlign: 'center' }}>
              XÁC NHẬN MẬT KHẨU
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#64748b', textAlign: 'center', lineHeight: '1.5' }}>
              Vui lòng nhập mật khẩu hiện tại để xác nhận cấp lại mã QR mới. Mã QR cũ sẽ bị vô hiệu hóa ngay lập tức.
            </p>
            <input
              type="password"
              placeholder="Nhập mật khẩu của bạn"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.9rem',
                marginBottom: '15px',
                boxSizing: 'border-box'
              }}
            />

            {regenerateError && (
              <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '15px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <i className="fa-solid fa-circle-exclamation"></i> {regenerateError}
              </div>
            )}

            {regenerateSuccess && (
              <div style={{ color: '#16a34a', backgroundColor: '#f0fdf4', border: '1px solid #86efac', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '15px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <i className="fa-solid fa-circle-check"></i> {regenerateSuccess}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setRegenerateModalOpen(false);
                  setConfirmPassword('');
                  setRegenerateError('');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  color: '#475569',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isRegenerating || !confirmPassword}
                onClick={handleRegenerateQr}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #f97316, #ef4444)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: '700',
                  cursor: (!confirmPassword || isRegenerating) ? 'not-allowed' : 'pointer',
                  opacity: (!confirmPassword || isRegenerating) ? 0.7 : 1
                }}
              >
                {isRegenerating ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MemberDashboard;

