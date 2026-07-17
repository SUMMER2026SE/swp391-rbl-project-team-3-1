import { useCallback, useEffect, useState, useRef } from 'react';
import './CheckoutPage.css';

// ─── Dữ liệu gói tập mặc định (fallback nếu API chưa có data) ────────────────
const FALLBACK_PLANS = [
  {
    planId: 1,
    planName: 'Gym 3 Tháng',
    sportType: 'Gym',
    durationMonths: 3,
    price: 5000,
    features: ['Tập tự do khu vực Gym trong 3 tháng'],
    featured: false,
  },
  {
    planId: 2,
    planName: 'Gym 6 Tháng',
    sportType: 'Gym',
    durationMonths: 6,
    price: 10000,
    features: ['Tập tự do khu vực Gym trong 6 tháng'],
    featured: false,
  },
  {
    planId: 3,
    planName: 'Yoga 6 Tháng',
    sportType: 'Yoga',
    durationMonths: 6,
    price: 15000,
    features: ['Tham gia các lớp Yoga không giới hạn'],
    featured: true,
  },
  {
    planId: 4,
    planName: 'Boxing 12 Tháng',
    sportType: 'Boxing',
    durationMonths: 12,
    price: 30000,
    features: ['Gói tập Boxing chuyên nghiệp 1 năm'],
    featured: false,
  },
  {
    planId: 5,
    planName: 'Premium Toàn Diện 12 Tháng',
    sportType: 'Mixed',
    durationMonths: 12,
    price: 60000,
    features: ['Sử dụng tất cả dịch vụ Gym, Yoga, Boxing'],
    featured: false,
  },
];

// ─── Fallback trainers (nếu DB chưa có trainer) ────────────────────────────────
const FALLBACK_TRAINERS = [
  { userId: 't1', fullName: 'Nguyễn Văn Hùng', specialization: 'Giảm Cân', rating: 4.9, avatarUrl: null },
  { userId: 't2', fullName: 'Trần Thị Mai', specialization: 'Yoga', rating: 4.8, avatarUrl: null },
  { userId: 't3', fullName: 'Lê Minh Khoa', specialization: 'Tăng Cơ', rating: 5.0, avatarUrl: null },
  { userId: 't4', fullName: 'Phạm Thu Hà', specialization: 'Pilates', rating: 4.7, avatarUrl: null },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (n) => n?.toLocaleString('vi-VN') + 'đ';

const getPeriodLabel = (months) => {
  if (months === 1) return '/tháng';
  if (months === 12) return '/năm';
  return `/${months} tháng`;
};

const getInitials = (name = '') =>
  name.split(' ').slice(-2).map(w => w[0]?.toUpperCase()).join('');

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
function CheckoutPage() {
  // ── Auth states ────────────────────────────────────────────────────
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const isLoggedIn = !!token;

  // ── Step control ───────────────────────────────────────────────────
  const [step, setStep] = useState(1); // 1 = Chọn Gói, 2 = QR Code Payment, 3 = Register Account (Guest only)

  // ── Data states ────────────────────────────────────────────────────
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [trainers, setTrainers] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [isLoadingTrainers, setIsLoadingTrainers] = useState(true);

  // ── Selection states ───────────────────────────────────────────────
  const [selectedPlan, setSelectedPlan] = useState(null);   // plan object
  const [selectedTrainer, setSelectedTrainer] = useState(null);   // trainer object | null
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [isServiceOnly, setIsServiceOnly] = useState(false);

  // ── Form & Loading states ──────────────────────────────────────────
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPw, setRegPw] = useState('');
  const [regConfPw, setRegConfPw] = useState('');
  const [showRegPw, setShowRegPw] = useState(false);
  const [showRegConf, setShowRegConf] = useState(false);

  const [alert, setAlert] = useState({ show: false, msg: '', type: 'error' });
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [payosPayment, setPayosPayment] = useState(null);
  const [hasDetectedPayment, setHasDetectedPayment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  
  // OTP states
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputs = useRef([]);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // ── Init: read plan and service from URL / localStorage ─────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planKey = params.get('plan');   // e.g. 'monthly', 'quarterly', 'annual'
    const serviceKey = params.get('service');
    const storedPlan = localStorage.getItem('checkoutPlan');

    // Determine service-only flow: must have service parameter and user must be logged in
    const serviceOnlyFlow = isLoggedIn && !!serviceKey;
    setIsServiceOnly(serviceOnlyFlow);

    // 1. Try to load plans from API
    fetch('/api/checkout/plans')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.plans?.length) {
          const apiPlans = data.plans.map(p => ({
            ...p,
            features: p.description ? p.description.split('|') : ['Truy cập đầy đủ thiết bị'],
          }));
          setPlans(apiPlans);

          if (serviceOnlyFlow) {
            setSelectedPlan(null);
          } else {
            // Match plan from URL param or localStorage
            const matchId = planKey || storedPlan;
            const matched = apiPlans.find(p =>
              String(p.planId) === matchId ||
              p.planName.toLowerCase().includes(matchId?.toLowerCase() || '')
            );
            setSelectedPlan(matched || apiPlans[0]);
          }
        } else {
          if (serviceOnlyFlow) {
            setSelectedPlan(null);
          } else {
            // fallback
            const matchIdx = FALLBACK_PLANS.find(p => String(p.planId) === planKey);
            setSelectedPlan(matchIdx || FALLBACK_PLANS[0]);
          }
        }
      })
      .catch(() => {
        if (serviceOnlyFlow) {
          setSelectedPlan(null);
        } else {
          const matched = FALLBACK_PLANS.find(p => String(p.planId) === planKey);
          setSelectedPlan(matched || FALLBACK_PLANS[0]);
        }
      });

    // 2. Load trainers
    fetch('/api/checkout/trainers')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.trainers?.length) {
          setTrainers(data.trainers);
        } else {
          setTrainers(FALLBACK_TRAINERS);
        }
      })
      .catch(() => setTrainers(FALLBACK_TRAINERS))
      .finally(() => setIsLoadingTrainers(false));

    // 3. Load services and pre-select service from URL param if present
    fetch('/api/checkout/services')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.services?.length) {
          setServices(data.services);
          const serviceKey = new URLSearchParams(window.location.search).get('service');
          if (serviceKey) {
            const matchedSvc = data.services.find(s => String(s.serviceId) === serviceKey);
            if (matchedSvc) {
              setSelectedServices([matchedSvc.serviceId]);
            }
          }
        }
      })
      .catch(() => {});
  }, [isLoggedIn]);

  // Listen to auth changes
  useEffect(() => {
    const handleAuthChange = () => {
      setToken(localStorage.getItem('token') || '');
    };
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('authChange', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  // OTP Countdown timer
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const interval = setInterval(() => {
      setOtpCountdown(c => c - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [otpCountdown]);

  useEffect(() => {
    if (step !== 2 || (!selectedPlan && selectedServices.length === 0)) return;

    const createPayosPayment = async () => {
      setAlert({ show: false, msg: '', type: 'error' });
      setIsCreatingPayment(true);
      setPayosPayment(null);
      setHasDetectedPayment(false);

      try {
        const res = await fetch('/api/checkout/payos/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            planId: selectedPlan?.planId || null,
            services: selectedServices
          })
        });
        const data = await res.json();

        if (res.ok && data.payment) {
          setPayosPayment(data.payment);
        } else {
          setAlert({ show: true, msg: data.message || 'Khong the tao thanh toan payOS!', type: 'error' });
        }
      } catch {
        setAlert({ show: true, msg: 'Khong the ket noi toi payOS!', type: 'error' });
      } finally {
        setIsCreatingPayment(false);
      }
    };

    createPayosPayment();
  }, [step, selectedPlan, selectedServices]);

  // ── Navigation helpers ─────────────────────────────────────────────
  const goHome = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new Event('popstate'));
  };
  const goLogin = () => {
    window.history.pushState({}, '', '/login');
    window.dispatchEvent(new Event('popstate'));
  };

  // ── Payment simulation ─────────────────────────────────────────────
  const handleLoggedInCheckout = useCallback(async () => {
    setIsVerifyingPayment(true);
    try {
      const res = await fetch('/api/checkout/loggedIn-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: selectedPlan?.planId || null,
          trainerId: selectedTrainer?.userId || null,
          services: selectedServices,
          payosOrderCode: payosPayment?.orderCode
        })
      });
      const data = await res.json();
      setIsVerifyingPayment(false);
      if (res.ok) {
        setCheckoutSuccess(true);
      } else {
        setAlert({ show: true, msg: data.message || 'Thanh toán thất bại!', type: 'error' });
      }
    } catch {
      setIsVerifyingPayment(false);
      setAlert({ show: true, msg: 'Không thể kết nối tới server!', type: 'error' });
    }
  }, [payosPayment, selectedPlan, selectedTrainer, token]);

  // ── Guest Submit Registration ──────────────────────────────────────
  useEffect(() => {
    if (step !== 2 || !payosPayment?.orderCode || hasDetectedPayment) return;

    let isCancelled = false;
    let isChecking = false;

    const checkPayosStatus = async () => {
      if (isChecking || isCancelled) return;
      isChecking = true;

      try {
        const res = await fetch(`/api/checkout/payos/status/${payosPayment.orderCode}`);
        const data = await res.json();

        if (isCancelled || !res.ok || data.payment?.status !== 'PAID') return;

        setHasDetectedPayment(true);
        setAlert({ show: false, msg: '', type: 'error' });

        if (isLoggedIn) {
          await handleLoggedInCheckout();
        } else {
          setStep(3); // Go to step 3 to register!
        }
      } catch {
        // PayOS can take a moment to confirm the transaction; keep polling quietly.
      } finally {
        isChecking = false;
      }
    };

    checkPayosStatus();
    const intervalId = setInterval(checkPayosStatus, 3000);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [step, payosPayment?.orderCode, hasDetectedPayment, isLoggedIn, handleLoggedInCheckout]);

  const doGuestRegisterAndCheckout = async (e) => {
    e.preventDefault();
    setAlert({ show: false, msg: '', type: 'error' });

    if (!regEmail.trim()) {
      setAlert({ show: true, msg: 'Vui lòng nhập tên đăng nhập (Email)!', type: 'error' });
      return;
    }
    if (!regPhone.trim()) {
      setAlert({ show: true, msg: 'Vui lòng nhập số điện thoại!', type: 'error' });
      return;
    }
    if (regPw.length < 6) {
      setAlert({ show: true, msg: 'Mật khẩu phải từ 6 ký tự trở lên!', type: 'error' });
      return;
    }
    if (regPw !== regConfPw) {
      setAlert({ show: true, msg: 'Mật khẩu xác nhận không khớp!', type: 'error' });
      return;
    }

    if (!payosPayment?.orderCode) {
      setAlert({ show: true, msg: 'Thiếu mã giao dịch payOS. Vui lòng quay lại bước thanh toán!', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/checkout/guest-register-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: regEmail.trim(),
          fullName: regFullName.trim() || undefined,
          phoneNumber: regPhone.trim(),
          password: regPw,
          planId: selectedPlan?.planId || null,
          trainerId: selectedTrainer?.userId || null,
          services: selectedServices,
          serviceIds: selectedServices,
          payosOrderCode: payosPayment?.orderCode
        })
      });
      const data = await res.json();
      setIsSubmitting(false);
      if (res.ok) {
        if (data.needsVerification || data.requiresVerification) {
          // Go to Step 4 for OTP verification!
          setStep(4);
          setOtpDigits(['', '', '', '', '', '']);
          setOtpCountdown(60);
          setTimeout(() => {
            otpInputs.current[0]?.focus();
          }, 100);
        } else {
          // Auto-login (fallback if OTP is bypassed on server)
          localStorage.setItem('token', data.token);
          localStorage.setItem('userInfo', JSON.stringify(data.user));
          localStorage.setItem('showProfileSetup', 'true');
          setToken(data.token);
          window.dispatchEvent(new Event('authChange'));
          setCheckoutSuccess(true);
        }
      } else {
        setAlert({ show: true, msg: data.message || 'Đăng ký thất bại!', type: 'error' });
      }
    } catch {
      setIsSubmitting(false);
      setAlert({ show: true, msg: 'Không thể kết nối tới server để tạo tài khoản!', type: 'error' });
    }
  };

  // ─── OTP GRID HELPER FUNCTIONS ─────────────────────────────────────
  const handleOtpChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    const digit = cleaned.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (index < 5) {
      otpInputs.current[index + 1]?.focus();
    }

    // Auto-submit if all digits are entered
    if (newDigits.every(d => d !== '') && newDigits.join('').length === 6) {
      setTimeout(() => {
        triggerOtpSubmit(newDigits.join(''));
      }, 50);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        otpInputs.current[index - 1]?.focus();
      } else {
        const newDigits = [...otpDigits];
        newDigits[index] = '';
        setOtpDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    if (pasteData.length === 6) {
      const newDigits = pasteData.split('');
      setOtpDigits(newDigits);
      otpInputs.current[5]?.focus();
      // Auto-submit on paste
      setTimeout(() => {
        triggerOtpSubmit(pasteData);
      }, 50);
    } else if (pasteData.length > 0) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < pasteData.length; i++) {
        newDigits[i] = pasteData[i];
      }
      setOtpDigits(newDigits);
      otpInputs.current[Math.min(pasteData.length, 5)]?.focus();
    }
  };

  const triggerOtpSubmit = async (fullOtp) => {
    setAlert({ show: false, msg: '', type: 'error' });
    setIsVerifyingOtp(true);
    try {
      const res = await fetch('/api/checkout/verify-guest-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail.trim(),
          otp: fullOtp
        })
      });
      const data = await res.json();
      setIsVerifyingOtp(false);

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userInfo', JSON.stringify(data.user));
        localStorage.setItem('showProfileSetup', 'true');
        setToken(data.token);
        window.dispatchEvent(new Event('authChange'));
        setCheckoutSuccess(true);
      } else {
        setAlert({ show: true, msg: data.message || 'Xác thực OTP thất bại!', type: 'error' });
      }
    } catch {
      setIsVerifyingOtp(false);
      setAlert({ show: true, msg: 'Không thể kết nối tới server để xác thực OTP!', type: 'error' });
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setAlert({ show: true, msg: 'Vui lòng nhập đầy đủ mã OTP gồm 6 chữ số!', type: 'error' });
      return;
    }
    await triggerOtpSubmit(fullOtp);
  };

  const handleResendOtp = async () => {
    if (otpCountdown > 0) return;
    setAlert({ show: false, msg: '', type: 'error' });

    try {
      const res = await fetch('/api/checkout/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail.trim() })
      });
      const data = await res.json();

      if (res.ok) {
        setAlert({ show: true, msg: 'Mã OTP mới đã được gửi thành công!', type: 'success' });
        setOtpCountdown(60);
        setOtpDigits(['', '', '', '', '', '']);
        setTimeout(() => {
          otpInputs.current[0]?.focus();
        }, 100);
      } else {
        setAlert({ show: true, msg: data.message || 'Không thể gửi lại mã OTP!', type: 'error' });
      }
    } catch {
      setAlert({ show: true, msg: 'Không thể kết nối tới server!', type: 'error' });
    }
  };

  // ─── Computed values ───────────────────────────────────────────────
  const planPrice = selectedPlan?.price || 0;
  const servicesPrice = selectedServices.reduce((sum, svcId) => {
    const svc = services.find(s => s.serviceId === svcId);
    return sum + (svc ? svc.price : 0);
  }, 0);
  const totalPrice = planPrice + servicesPrice;

  const hasPTService = (selectedPlan?.includedServices || []).some(s => s.sportType === 'Huấn Luyện') || 
    selectedServices.some(svcId => {
      const svc = services.find(s => s.serviceId === svcId);
      return svc?.sportType === 'Huấn Luyện';
    });
  
  const includedServiceIds = selectedPlan?.includedServices?.map(s => s.serviceId) || [];

  const qrCodeUrl = payosPayment?.qrCode
    ? `https://quickchart.io/qr?size=240&text=${encodeURIComponent(payosPayment.qrCode)}`
    : '';

  // Render Success page if checkout/registration is complete
  if (checkoutSuccess) {
    return (
      <div className="checkout-page">
        <nav className="co-navbar">
          <div className="co-nav-brand" onClick={goHome}>
            <i className="fa-solid fa-dumbbell brand-icon"></i>
            <span className="brand-name">FX <span>FITNESS</span></span>
          </div>
        </nav>
        <div className="checkout-success-container">
          <div className="checkout-success-card">
            <div className="success-icon-wrap">
              <i className="fa-solid fa-check"></i>
            </div>
            <h2>Thanh Toán Thành Công!</h2>
            <p>Gói tập <strong>{selectedPlan?.planName}</strong> của bạn đã được kích hoạt thành công.</p>
            {selectedTrainer && (
              <p className="trainer-success-info">
                Huấn luyện viên đồng hành: <strong>{selectedTrainer.fullName}</strong>. Lộ trình tập luyện đã được tạo sẵn trong hệ thống.
              </p>
            )}
            <button className="btn-success-home" onClick={goHome}>
              <i className="fa-solid fa-house"></i> Về Trang Chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (regSuccess) {
    return (
      <div className="checkout-page">
        <nav className="co-navbar">
          <div className="co-nav-brand" onClick={goHome}>
            <i className="fa-solid fa-dumbbell brand-icon"></i>
            <span className="brand-name">FX <span>FITNESS</span></span>
          </div>
        </nav>
        <div className="checkout-success-container">
          <div className="checkout-success-card">
            <div className="success-icon-wrap" style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)' }}>
              <i className="fa-solid fa-envelope"></i>
            </div>
            <h2>Kiểm Tra Email Của Bạn!</h2>
            <p>Thanh toán gói <strong>{selectedPlan?.planName}</strong> thành công! 🎉</p>
            <p style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: 1.7 }}>
              Chúng tôi đã gửi một email xác thực đến <strong style={{ color: '#f97316' }}>{regEmail}</strong>.
              Vui lòng mở email và nhấn vào nút <strong>"Xác Thực Email"</strong> để kích hoạt tài khoản của bạn.
            </p>
            <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 12, padding: '16px 20px', margin: '20px 0', textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#ccc' }}>
                <i className="fa-solid fa-circle-info" style={{ color: '#f97316', marginRight: 8 }}></i>
                Sau khi xác thực, bạn sẽ nhận được email chào mừng kèm thông tin chi tiết gói tập.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button className="btn-success-home" onClick={goHome} style={{ flex: 1 }}>
                <i className="fa-solid fa-house"></i> Về Trang Chủ
              </button>
              <button className="btn-success-home" onClick={goLogin} style={{ flex: 1, background: 'var(--orange)' }}>
                <i className="fa-solid fa-right-to-bracket"></i> Đăng Nhập
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="checkout-page">
      {/* ── NAVBAR ── */}
      <nav className="co-navbar">
        <div className="co-nav-brand" onClick={goHome}>
          <i className="fa-solid fa-dumbbell brand-icon"></i>
          <span className="brand-name">FX <span>FITNESS</span></span>
        </div>
        <button className="co-nav-back" onClick={goHome}>
          <i className="fa-solid fa-arrow-left"></i> Về Trang Chủ
        </button>
      </nav>

      {/* ── STEP INDICATOR ── */}
      <div className="co-steps">
        <div className={`co-step ${step > 1 ? 'done' : 'active'}`}>
          <div className="step-bubble">{step > 1 ? <i className="fa-solid fa-check"></i> : 1}</div>
          <span className="step-label">Chọn Gói & HLV</span>
        </div>
        <div className={`co-step ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`}>
          <div className="step-bubble">{step > 2 ? <i className="fa-solid fa-check"></i> : 2}</div>
          <span className="step-label">Thanh Toán QR</span>
        </div>
        {!isLoggedIn && (
          <div className={`co-step ${step === 3 ? 'active' : step > 3 ? 'done' : ''}`}>
            <div className="step-bubble">{step > 3 ? <i className="fa-solid fa-check"></i> : 3}</div>
            <span className="step-label">Đăng Ký Tài Khoản</span>
          </div>
        )}
        {!isLoggedIn && (
          <div className={`co-step ${step === 4 ? 'active' : ''}`}>
            <div className="step-bubble">4</div>
            <span className="step-label">Xác Thực OTP</span>
          </div>
        )}
      </div>

      {/* ── PAGE HEADER ── */}
      <div style={{ padding: '28px 40px 0', maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text)', margin: 0 }}>
          {step === 1 ? 'Chọn Gói Tập & Huấn Luyện Viên' : step === 2 ? 'Thanh Toán Gói Tập qua PayOS' : step === 3 ? 'Đăng Ký Tài Khoản Thành Viên' : 'Xác Thực Mã OTP'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4, marginBottom: 0 }}>
          {step === 1
            ? 'Vui lòng kiểm tra gói tập bạn muốn đăng ký và tùy chọn huấn luyện viên đồng hành.'
            : step === 2
              ? 'Quét mã PayOS dưới đây hoặc mở trang thanh toán PayOS để hoàn tất giao dịch.'
              : step === 3
                ? 'Thiết lập mật khẩu và số điện thoại để tạo tài khoản đăng nhập.'
                : 'Nhập mã OTP được gửi về Gmail của bạn để xác thực tài khoản.'}
        </p>
      </div>

      {/* ── VERIFY PAYMENT LOADER OVERLAY ── */}
      {isVerifyingPayment && (
        <div className="payment-verify-overlay">
          <div className="verify-content">
            <i className="fa-solid fa-spinner fa-spin verify-spinner"></i>
            <h3>Đang kiểm tra giao dịch...</h3>
            <p>Hệ thống đang kiểm tra thanh toán của bạn trên ngân hàng. Vui lòng chờ trong giây lát.</p>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="co-main">

        {/* ════════════ LEFT COLUMN ════════════ */}
        <div className="co-left">
          {alert.show && (
            <div className={`reg-alert ${alert.type === 'success' ? 'ok' : 'err'}`} style={{ width: '100%', boxSizing: 'border-box' }}>
              <i className={`fa-solid ${alert.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
              <span>{alert.msg}</span>
            </div>
          )}

          {/* ── STEP 1: CHỌN GÓI & HLV ── */}
          {step === 1 && (
            <>
              {/* Selected plan details */}
              {!isServiceOnly && (
                <div className="co-section">
                  <div className="co-section-header">
                    <div className="co-section-title">
                      <i className="fa-solid fa-tag"></i> Gói Tập Đã Chọn
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="btn-change-plan" onClick={() => setShowPlanPicker(v => !v)}>
                        <i className="fa-solid fa-pen"></i>
                        {showPlanPicker ? 'Ẩn bớt' : 'Thay đổi gói'}
                      </button>
                      {selectedPlan && (
                        <button className="btn-change-plan" style={{ background: '#ef4444', color: '#fff', border: 'none' }} onClick={() => { setSelectedPlan(null); setSelectedTrainer(null); }}>
                          <i className="fa-solid fa-trash"></i> Bỏ chọn gói
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="co-section-body">
                    {!selectedPlan && (
                      <div className="selected-plan-card" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <p style={{ margin: 0 }}>Bạn chưa chọn gói tập. Hệ thống sẽ thanh toán cho các Dịch vụ bổ sung bên dưới.</p>
                      </div>
                    )}
                    {selectedPlan && (
                      <div className="selected-plan-card">
                        <div className="plan-info-left">
                          <p className="plan-name">{selectedPlan.planName}</p>
                          <p className="plan-price-tag">
                            {fmt(selectedPlan.price)}
                            <span className="period">{getPeriodLabel(selectedPlan.durationMonths)}</span>
                          </p>
                          <ul className="plan-features">
                            {(selectedPlan.features || []).slice(0, 4).map((f, i) => (
                              <li key={i}><i className="fa-solid fa-circle-check"></i>{f}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Plan picker grid */}
                    {showPlanPicker && (
                      <div className="plan-picker-grid" style={{ marginTop: 16 }}>
                        {plans.map(p => (
                          <div
                            key={p.planId}
                            className={`plan-picker-card${p.featured ? ' featured-pick' : ''}${selectedPlan?.planId === p.planId ? ' selected' : ''}`}
                            onClick={() => { setSelectedPlan(p); setShowPlanPicker(false); }}
                          >
                            {p.featured && <span className="pick-badge">Phổ biến nhất</span>}
                            <div className="pick-check"><i className="fa-solid fa-check"></i></div>
                            <p className="pick-name">{p.planName}</p>
                            <p className="pick-price">
                              {fmt(p.price)}
                              <span className="pick-period">{getPeriodLabel(p.durationMonths)}</span>
                            </p>
                            <p className="pick-duration">{p.durationMonths} tháng</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Trainer list details */}
              {!isServiceOnly && (
                <div className="co-section">
                  <div className="co-section-header">
                    <div className="co-section-title">
                      <i className="fa-solid fa-user-tie"></i> Chọn Huấn Luyện Viên
                    </div>
                    <span className="trainer-optional-label">Tùy chọn</span>
                  </div>

                  <div className="co-section-body">
                    {!hasPTService ? (
                      <div className="co-empty" style={{ backgroundColor: '#fdf2f8', color: '#be185d', borderColor: '#fbcfe8' }}>
                        <i className="fa-solid fa-circle-exclamation" style={{ color: '#be185d' }}></i>
                        Vui lòng chọn mua một Dịch vụ PT (bên dưới) trước khi được phép chọn Huấn luyện viên!
                      </div>
                    ) : isLoadingTrainers ? (
                      <div className="trainers-grid">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="trainer-skeleton">
                            <div className="sk-circle"></div>
                            <div className="sk-lines">
                              <div className="sk-line"></div>
                              <div className="sk-line short"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : trainers.length === 0 ? (
                      <div className="co-empty">
                        <i className="fa-solid fa-user-slash"></i>
                        Hiện chưa có huấn luyện viên.
                      </div>
                    ) : (
                      <>
                        <div className="trainers-grid">
                          {trainers.map(t => (
                            <div
                              key={t.userId}
                              className={`trainer-card${selectedTrainer?.userId === t.userId ? ' selected' : ''}`}
                              onClick={() => setSelectedTrainer(
                                selectedTrainer?.userId === t.userId ? null : t
                              )}
                            >
                              <div className="trainer-avatar">
                                {t.avatarUrl
                                  ? <img src={t.avatarUrl} alt={t.fullName} />
                                  : getInitials(t.fullName)
                                }
                              </div>
                              <div className="trainer-info">
                                <div className="trainer-name">{t.fullName}</div>
                                <div className="trainer-spec">{t.specialization || 'Gym tổng hợp'}</div>
                                <div className="trainer-rating">
                                  <i className="fa-solid fa-star"></i>
                                  {(t.rating || 4.5).toFixed(1)}
                                </div>
                              </div>
                              <div className="trainer-select-btn">
                                {selectedTrainer?.userId === t.userId
                                  ? <i className="fa-solid fa-check"></i>
                                  : <i className="fa-solid fa-plus"></i>
                                }
                              </div>
                            </div>
                          ))}
                        </div>
                        <div
                          className={`no-trainer-btn${selectedTrainer === null ? ' selected' : ''}`}
                          onClick={() => setSelectedTrainer(null)}
                        >
                          <i className="fa-solid fa-times" style={{ marginRight: 6 }}></i>
                          Chưa cần HLV lúc này
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Services selection */}
              {services.length > 0 && (
                <div className="co-section" style={{ marginTop: 0, border: 'none', padding: 0 }}>
                  <div className="co-section-header">
                    <div className="co-section-title">
                      <i className="fa-solid fa-concierge-bell"></i> Dịch Vụ Bổ Sung
                    </div>
                    <span className="trainer-optional-label">Tùy chọn</span>
                  </div>
                  <div className="co-section-body">
                    <div className="trainers-grid">
                      {services.map(svc => {
                        const isIncluded = includedServiceIds.includes(svc.serviceId);
                        const isSelected = selectedServices.includes(svc.serviceId) || isIncluded;

                        return (
                          <div
                            key={svc.serviceId}
                            className={`trainer-card${isSelected ? ' selected' : ''}`}
                            style={isIncluded ? { opacity: 0.7, cursor: 'default' } : {}}
                            onClick={() => {
                              if (isIncluded) return;
                              setSelectedServices(prev =>
                                prev.includes(svc.serviceId)
                                  ? prev.filter(id => id !== svc.serviceId)
                                  : [...prev, svc.serviceId]
                              );
                            }}
                          >
                            <div className="trainer-avatar" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', fontSize: '1.2rem' }}>
                              <i className={`fa-solid ${svc.sportType === 'Swimming' ? 'fa-person-swimming' : svc.sportType === 'Sauna' ? 'fa-hot-tub-person' : svc.sportType === 'Locker' ? 'fa-lock' : 'fa-mug-hot'}`}></i>
                            </div>
                            <div className="trainer-info">
                              <div className="trainer-name">{svc.serviceName}</div>
                              <div className="trainer-spec">{svc.description}</div>
                              <div className="trainer-rating" style={{ color: '#10b981' }}>
                                <i className="fa-solid fa-tag"></i>
                                {isIncluded ? 'Đã bao gồm trong gói' : fmt(svc.price)}
                              </div>
                            </div>
                            <div className="trainer-select-btn">
                              {isSelected
                                ? <i className="fa-solid fa-check"></i>
                                : <i className="fa-solid fa-plus"></i>
                              }
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── STEP 2: THANH TOÁN QR ── */}
          {step === 2 && (
            <div className="co-section">
              <div className="co-section-header">
                <div className="co-section-title">
                  <i className="fa-solid fa-qrcode"></i> Quét Mã PayOS Thanh Toán
                </div>
              </div>

              <div className="co-section-body qr-section-body">
                <div className="qr-container">
                  <div className="qr-image-wrapper">
                    {isCreatingPayment && (
                      <div className="payos-loading">
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <span>Đang tạo thanh toán PayOS...</span>
                      </div>
                    )}
                    {!isCreatingPayment && qrCodeUrl && (
                      <img src={qrCodeUrl} alt="PayOS QR Code" className="payos-qr-img" />
                    )}
                    <div className="qr-scan-guide">
                      <i className="fa-solid fa-expandscan"></i>
                      <span>Sử dụng ứng dụng Ngân hàng quét mã QR PayOS để thanh toán</span>
                    </div>
                    {payosPayment?.checkoutUrl && (
                      <a className="btn-payos-link" href={payosPayment.checkoutUrl} target="_blank" rel="noreferrer">
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                        Mở trang PayOS
                      </a>
                    )}
                  </div>

                  <div className="bank-details-wrapper">
                    <h3>Thông Tin PayOS</h3>
                    <div className="bank-details-grid">
                      <div className="bd-row">
                        <span className="bd-label">Ngân hàng:</span>
                        <span className="bd-value">{payosPayment?.bin || 'PayOS'}</span>
                      </div>
                      <div className="bd-row">
                        <span className="bd-label">Số tài khoản:</span>
                        <span className="bd-value highlight">{payosPayment?.accountNumber || 'Đang tạo...'}</span>
                      </div>
                      <div className="bd-row">
                        <span className="bd-label">Tên tài khoản:</span>
                        <span className="bd-value">{payosPayment?.accountName || 'Đang tạo...'}</span>
                      </div>
                      <div className="bd-row">
                        <span className="bd-label">Số tiền:</span>
                        <span className="bd-value highlight-price">{fmt(totalPrice)}</span>
                      </div>
                      <div className="bd-row">
                        <span className="bd-label">Mã đơn PayOS:</span>
                        <span className="bd-value highlight">{payosPayment?.orderCode || 'Đang tạo...'}</span>
                      </div>
                      <div className="bd-row">
                        <span className="bd-label">Nội dung:</span>
                        <span className="bd-value highlight-desc">{payosPayment?.description || 'Đang tạo...'}</span>
                      </div>
                    </div>

                    <div className="bank-notice">
                      <i className="fa-solid fa-circle-info"></i>
                      <span>Hệ thống sẽ tự động kiểm tra PayOS. Sau khi thanh toán thành công, bạn sẽ được chuyển sang bước tiếp theo.</span>
                    </div>

                    {/* Nút giả lập thanh toán dùng khi dev local */}
                    <button
                      type="button"
                      onClick={async () => {
                        setHasDetectedPayment(true);
                        setAlert({ show: false, msg: '', type: 'error' });
                        if (isLoggedIn) {
                          await handleLoggedInCheckout();
                        } else {
                          setStep(3); // Chuyển sang Bước 3 để điền thông tin đăng ký
                        }
                      }}
                      style={{
                        marginTop: '16px',
                        padding: '10px 16px',
                        backgroundColor: '#ff9800',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <i className="fa-solid fa-circle-play"></i>
                      ⚠️ [DEV] Giả Lập Thanh Toán Thành Công
                    </button>
                  </div>
                </div>

                <div className="qr-actions">
                  <button className="btn-back-step" onClick={() => setStep(1)}>
                    <i className="fa-solid fa-arrow-left"></i> Quay lại
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: ĐĂNG KÝ TÀI KHOẢN (GUEST ONLY) ── */}
          {step === 3 && !isLoggedIn && (
            <div className="co-section">
              <div className="co-section-header">
                <div className="co-section-title">
                  <i className="fa-solid fa-user-plus"></i> Đăng Ký Tài Khoản Hội Viên
                </div>
              </div>

              <div className="co-section-body">
                <form id="guestRegisterForm" onSubmit={doGuestRegisterAndCheckout}>
                  <div className="reg-field">
                    <label>Họ và tên</label>
                    <div className="reg-inp-wrap">
                      <i className="fa-solid fa-user inp-icon"></i>
                      <input
                        type="text"
                        placeholder="Nhập họ và tên đầy đủ"
                        value={regFullName}
                        onChange={e => setRegFullName(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="reg-field">
                    <label>Tên đăng nhập (Email)</label>
                    <div className="reg-inp-wrap">
                      <i className="fa-solid fa-envelope inp-icon"></i>
                      <input
                        type="email"
                        placeholder="Nhập email của bạn (ví dụ: name@gmail.com)"
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="reg-field">
                    <label>Số điện thoại</label>
                    <div className="reg-inp-wrap">
                      <i className="fa-solid fa-phone inp-icon"></i>
                      <input
                        type="tel"
                        placeholder="Nhập số điện thoại (ví dụ: 0987654321)"
                        value={regPhone}
                        onChange={e => setRegPhone(e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="reg-field">
                    <label>Mật khẩu</label>
                    <div className="reg-inp-wrap">
                      <i className="fa-solid fa-lock inp-icon"></i>
                      <input
                        type={showRegPw ? 'text' : 'password'}
                        placeholder="Tạo mật khẩu đăng nhập (Tối thiểu 6 ký tự)"
                        value={regPw}
                        onChange={e => setRegPw(e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                      <button type="button" className="eye-btn" onClick={() => setShowRegPw(!showRegPw)}>
                        <i className={`fa-regular ${showRegPw ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                      </button>
                    </div>
                  </div>

                  <div className="reg-field">
                    <label>Xác nhận mật khẩu</label>
                    <div className="reg-inp-wrap">
                      <i className="fa-solid fa-lock inp-icon"></i>
                      <input
                        type={showRegConf ? 'text' : 'password'}
                        placeholder="Nhập lại mật khẩu"
                        value={regConfPw}
                        onChange={e => setRegConfPw(e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                      <button type="button" className="eye-btn" onClick={() => setShowRegConf(!showRegConf)}>
                        <i className={`fa-regular ${showRegConf ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                      </button>
                    </div>
                  </div>

                  <div className="guest-reg-actions" style={{ display: 'flex', gap: '12px' }}>
                    <button
                      className="btn-back-step"
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={isSubmitting}
                      style={{ flex: 1 }}
                    >
                      <i className="fa-solid fa-arrow-left"></i> Quay lại
                    </button>
                    <button
                      className="btn-reg-submit"
                      type="submit"
                      disabled={isSubmitting}
                      style={{ flex: 1 }}
                    >
                      {isSubmitting
                        ? <><i className="fa-solid fa-spinner fa-spin"></i> Đang xử lý...</>
                        : <><i className="fa-solid fa-circle-check"></i> Hoàn Tất Đăng Ký</>
                      }
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── STEP 4: XÁC THỰC MÃ OTP (GUEST ONLY) ── */}
          {step === 4 && !isLoggedIn && (
            <div className="co-section">
              <div className="co-section-header">
                <div className="co-section-title">
                  <i className="fa-solid fa-key"></i> Xác Thực OTP Tài Khoản
                </div>
              </div>
              <div className="co-section-body">
                <form id="guestVerifyOtpForm" onSubmit={handleVerifyOtp}>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-mid)', marginBottom: '24px', lineHeight: '1.6', textAlign: 'center' }}>
                    Một mã xác thực OTP gồm <strong>6 chữ số</strong> đã được gửi về địa chỉ email:<br />
                    <strong style={{ color: 'var(--orange)', fontSize: '1rem' }}>{regEmail}</strong><br />
                    Vui lòng nhập mã để hoàn tất đăng ký tài khoản thành viên của bạn.
                  </p>

                  <div className="otp-container">
                    <label className="otp-label">Nhập mã xác thực OTP</label>
                    <div className="otp-grid">
                      {otpDigits.map((digit, index) => (
                        <input
                          key={index}
                          type="text"
                          pattern="[0-9]*"
                          inputMode="numeric"
                          maxLength="1"
                          value={digit}
                          ref={el => otpInputs.current[index] = el}
                          onChange={e => handleOtpChange(index, e.target.value)}
                          onKeyDown={e => handleOtpKeyDown(index, e)}
                          onPaste={handleOtpPaste}
                          disabled={isVerifyingOtp}
                          className="otp-input-box"
                        />
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0 12px' }}>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={otpCountdown > 0}
                      className="otp-resend-btn"
                    >
                      <i className="fa-solid fa-arrow-rotate-right"></i>
                      {otpCountdown > 0 ? `Gửi lại mã sau ${otpCountdown}s` : 'Gửi lại mã OTP qua Email'}
                    </button>
                  </div>

                  <div className="guest-reg-actions" style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    <button
                      className="btn-back-step"
                      type="button"
                      onClick={() => { setStep(3); setOtpDigits(['', '', '', '', '', '']); }}
                      disabled={isVerifyingOtp}
                      style={{ flex: 1 }}
                    >
                      <i className="fa-solid fa-arrow-left"></i> Quay lại
                    </button>
                    <button
                      className="btn-reg-submit"
                      type="submit"
                      disabled={isVerifyingOtp}
                      style={{ flex: 1 }}
                    >
                      {isVerifyingOtp
                        ? <><i className="fa-solid fa-spinner fa-spin"></i> Đang xử lý...</>
                        : <><i className="fa-solid fa-circle-check"></i> Xác Thực & Hoàn Tất</>
                      }
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* ════════════ RIGHT COLUMN: BILLING SUMMARY ════════════ */}
        <div className="co-right">
          <div className="pay-summary-card">
            <div className="pay-summary-header">
              <i className="fa-solid fa-receipt"></i>
              <h3>Hóa Đơn Thanh Toán</h3>
            </div>

            <div className="pay-summary-body">
              {!isServiceOnly && (
                <div className="pay-row">
                  <span className="label">Gói tập:</span>
                  <span className="value">{selectedPlan?.planName || 'Chỉ mua dịch vụ'}</span>
                </div>
              )}

              {selectedTrainer && (
                <div className="pay-trainer-row">
                  <div className="pay-trainer-avatar">
                    {selectedTrainer.avatarUrl
                      ? <img src={selectedTrainer.avatarUrl} alt={selectedTrainer.fullName} />
                      : getInitials(selectedTrainer.fullName)
                    }
                  </div>
                  <div className="pay-trainer-info">
                    <div className="pt-name">{selectedTrainer.fullName}</div>
                    <div className="pt-spec">{selectedTrainer.specialization || 'Huấn luyện viên'}</div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Kèm HLV
                  </span>
                </div>
              )}

              <div className="pay-divider"></div>

              {selectedServices.length > 0 && (
                <>
                  <div className="pay-row">
                    <span className="label">Dịch vụ ({selectedServices.length}):</span>
                    <span className="value" style={{ color: '#10b981' }}>+{fmt(servicesPrice)}</span>
                  </div>
                  <div className="pay-divider"></div>
                </>
              )}

              <div className="pay-total-row">
                <span className="total-label">Tổng thanh toán:</span>
                <span className="total-value">{fmt(totalPrice)}</span>
              </div>

              {step === 1 && (
                <button
                  className="btn-confirm-pay"
                  disabled={!selectedPlan && selectedServices.length === 0}
                  onClick={() => setStep(2)}
                >
                  <i className="fa-solid fa-arrow-right"></i>
                  Tiếp Tục Thanh Toán
                </button>
              )}

              {step === 3 && !isLoggedIn && (
                <button
                  className="btn-confirm-pay"
                  form="guestRegisterForm"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? <><i className="fa-solid fa-spinner fa-spin"></i> Đang xử lý...</>
                    : <><i className="fa-solid fa-circle-check"></i> Hoàn Tất Đăng Ký</>
                  }
                </button>
              )}

              {step === 4 && !isLoggedIn && (
                <button
                  className="btn-confirm-pay"
                  form="guestVerifyOtpForm"
                  type="submit"
                  disabled={isVerifyingOtp}
                >
                  {isVerifyingOtp
                    ? <><i className="fa-solid fa-spinner fa-spin"></i> Đang xác minh...</>
                    : <><i className="fa-solid fa-circle-check"></i> Xác Thực & Hoàn Tất</>
                  }
                </button>
              )}

              <p className="pay-note">
                <i className="fa-solid fa-circle-info"></i>
                Hội viên FxFitness được hưởng toàn bộ đặc quyền đi kèm gói tập. Mọi thắc mắc xin vui lòng liên hệ quầy lễ tân để được hỗ trợ.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

export default CheckoutPage;
