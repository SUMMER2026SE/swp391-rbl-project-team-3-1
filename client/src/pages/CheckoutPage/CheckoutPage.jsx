import React, { useState, useEffect } from 'react';
import './CheckoutPage.css';

// ─── Dữ liệu gói tập mặc định (fallback nếu API chưa có data) ────────────────
const FALLBACK_PLANS = [
  {
    planId: 'monthly',
    planName: 'Gói Tháng',
    durationMonths: 1,
    price: 499000,
    features: ['Truy cập đầy đủ thiết bị', 'Tủ đồ cá nhân', 'Miễn phí giữ xe'],
    featured: false,
  },
  {
    planId: 'quarterly',
    planName: 'Gói 3 Tháng',
    durationMonths: 3,
    price: 1299000,
    features: ['Truy cập đầy đủ thiết bị', 'Tủ đồ VIP', 'Miễn phí giữ xe', 'Tham gia lớp Yoga', 'Đo Inbody miễn phí 1 lần'],
    featured: true,
  },
  {
    planId: 'annual',
    planName: 'Gói Năm',
    durationMonths: 12,
    price: 3999000,
    features: ['Mọi quyền lợi Gói 3 Tháng', 'Tặng thêm 1 tháng tập', 'Tặng 2 buổi cùng PT', 'Đo Inbody định kỳ'],
    featured: false,
  },
];

// ─── Fallback trainers (nếu DB chưa có trainer) ────────────────────────────────
const FALLBACK_TRAINERS = [
  { userId: 't1', fullName: 'Nguyễn Văn Hùng', specialization: 'Giảm Cân', rating: 4.9, avatarUrl: null },
  { userId: 't2', fullName: 'Trần Thị Mai',    specialization: 'Yoga',    rating: 4.8, avatarUrl: null },
  { userId: 't3', fullName: 'Lê Minh Khoa',    specialization: 'Tăng Cơ', rating: 5.0, avatarUrl: null },
  { userId: 't4', fullName: 'Phạm Thu Hà',     specialization: 'Pilates', rating: 4.7, avatarUrl: null },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (n) => n?.toLocaleString('vi-VN') + 'đ';

const getPeriodLabel = (months) => {
  if (months === 1)  return '/tháng';
  if (months === 12) return '/năm';
  return `/${months} tháng`;
};

const getInitials = (name = '') =>
  name.split(' ').slice(-2).map(w => w[0]?.toUpperCase()).join('');

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
function CheckoutPage() {
  // ── Data states ────────────────────────────────────────────────────
  const [plans, setPlans]       = useState(FALLBACK_PLANS);
  const [trainers, setTrainers] = useState([]);
  const [isLoadingTrainers, setIsLoadingTrainers] = useState(true);

  // ── Selection states ───────────────────────────────────────────────
  const [selectedPlan, setSelectedPlan]       = useState(null);   // plan object
  const [selectedTrainer, setSelectedTrainer] = useState(null);   // trainer object | null
  const [showPlanPicker, setShowPlanPicker]   = useState(false);

  // ── Modal states ───────────────────────────────────────────────────
  const [showRegModal, setShowRegModal] = useState(false);
  const [regSuccess, setRegSuccess]     = useState(false);

  // ── Registration form ───────────────────────────────────────────────
  const [regFullName,  setRegFullName]  = useState('');
  const [regEmail,     setRegEmail]     = useState('');
  const [regPhone,     setRegPhone]     = useState('');
  const [regPw,        setRegPw]        = useState('');
  const [regConfPw,    setRegConfPw]    = useState('');
  const [showRegPw,    setShowRegPw]    = useState(false);
  const [showRegConf,  setShowRegConf]  = useState(false);
  const [regAlert,     setRegAlert]     = useState({ show: false, msg: '', ok: false });
  const [isRegLoading, setIsRegLoading] = useState(false);

  // ── Init: read plan from URL / localStorage ─────────────────────────
  useEffect(() => {
    const params  = new URLSearchParams(window.location.search);
    const planKey = params.get('plan');   // e.g. 'monthly', 'quarterly', 'annual'
    const storedPlan = localStorage.getItem('checkoutPlan');

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

          // Match plan from URL param or localStorage
          const matchId = planKey || storedPlan;
          const matched = apiPlans.find(p =>
            String(p.planId) === matchId ||
            p.planName.toLowerCase().includes(matchId?.toLowerCase() || '')
          );
          setSelectedPlan(matched || apiPlans[0]);
        } else {
          // fallback
          const matchIdx = planKey === 'annual' ? 2 : planKey === 'quarterly' ? 1 : 0;
          setSelectedPlan(FALLBACK_PLANS[matchIdx]);
        }
      })
      .catch(() => {
        const matchIdx = planKey === 'annual' ? 2 : planKey === 'quarterly' ? 1 : 0;
        setSelectedPlan(FALLBACK_PLANS[matchIdx]);
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
  }, []);

  // ── Navigation helpers ─────────────────────────────────────────────
  const goHome = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new Event('popstate'));
  };
  const goLogin = () => {
    window.history.pushState({}, '', '/login');
    window.dispatchEvent(new Event('popstate'));
  };

  // ── Registration submit ────────────────────────────────────────────
  const doRegister = async (e) => {
    e.preventDefault();
    setRegAlert({ show: false, msg: '', ok: false });

    if (!regFullName.trim()) {
      setRegAlert({ show: true, msg: 'Vui lòng nhập họ và tên!', ok: false }); return;
    }
    if (!regEmail.trim()) {
      setRegAlert({ show: true, msg: 'Vui lòng nhập email!', ok: false }); return;
    }
    if (!regPhone.trim()) {
      setRegAlert({ show: true, msg: 'Vui lòng nhập số điện thoại!', ok: false }); return;
    }
    if (regPw.length < 6) {
      setRegAlert({ show: true, msg: 'Mật khẩu phải từ 6 ký tự trở lên!', ok: false }); return;
    }
    if (regPw !== regConfPw) {
      setRegAlert({ show: true, msg: 'Mật khẩu xác nhận không khớp!', ok: false }); return;
    }

    setIsRegLoading(true);
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regFullName.trim(),
          email: regEmail.trim(),
          password: regPw,
          phoneNumber: regPhone.trim(),
        }),
      });
      const d = await r.json();
      if (r.ok || r.status === 201) {
        setRegSuccess(true);
      } else {
        setRegAlert({ show: true, msg: d.message || 'Đăng ký thất bại!', ok: false });
      }
    } catch {
      setRegAlert({ show: true, msg: 'Không thể kết nối đến máy chủ!', ok: false });
    } finally {
      setIsRegLoading(false);
    }
  };

  // ─── Computed values ───────────────────────────────────────────────
  const planPrice   = selectedPlan?.price || 0;
  const totalPrice  = planPrice;

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
        <div className="co-step done">
          <div className="step-bubble"><i className="fa-solid fa-check"></i></div>
          <span className="step-label">Chọn Gói</span>
        </div>
        <div className="co-step active">
          <div className="step-bubble">2</div>
          <span className="step-label">Hoàn Tất Đăng Ký</span>
        </div>
        <div className="co-step">
          <div className="step-bubble">3</div>
          <span className="step-label">Thanh Toán</span>
        </div>
      </div>

      {/* ── PAGE HEADER ── */}
      <div style={{ padding: '28px 40px 0', maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text)', margin: 0 }}>
          Hoàn Tất Đăng Ký
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4, marginBottom: 0 }}>
          Vui lòng kiểm tra lại thông tin và tiến hành thanh toán.
        </p>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="co-main">

        {/* ════════════ LEFT COLUMN ════════════ */}
        <div className="co-left">

          {/* ── SECTION 1: GÓI TẬP ĐÃ CHỌN ── */}
          <div className="co-section">
            <div className="co-section-header">
              <div className="co-section-title">
                <i className="fa-solid fa-tag"></i> Gói Tập Đã Chọn
              </div>
              <button className="btn-change-plan" onClick={() => setShowPlanPicker(v => !v)}>
                <i className="fa-solid fa-pen"></i>
                {showPlanPicker ? 'Ẩn bớt' : 'Thay đổi gói'}
              </button>
            </div>

            <div className="co-section-body">
              {/* Selected plan display */}
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

          {/* ── SECTION 2: CHỌN HUẤN LUYỆN VIÊN ── */}
          <div className="co-section">
            <div className="co-section-header">
              <div className="co-section-title">
                <i className="fa-solid fa-user-tie"></i> Chọn Huấn Luyện Viên
              </div>
              <span className="trainer-optional-label">Tùy chọn</span>
            </div>

            <div className="co-section-body">
              {isLoadingTrainers ? (
                <div className="trainers-grid">
                  {[1,2,3,4].map(i => (
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

        </div>

        {/* ════════════ RIGHT COLUMN: PAYMENT SUMMARY ════════════ */}
        <div className="co-right">
          <div className="pay-summary-card">
            <div className="pay-summary-header">
              <i className="fa-solid fa-receipt"></i>
              <h3>Thanh Toán</h3>
            </div>

            <div className="pay-summary-body">
              <div className="pay-row">
                <span className="label">{selectedPlan?.planName || '—'}</span>
                <span className="value">{fmt(planPrice)}</span>
              </div>

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
              <div className="pay-total-row">
                <span className="total-label">Tổng cộng</span>
                <span className="total-value">{fmt(totalPrice)}</span>
              </div>

              <button
                className="btn-confirm-pay"
                disabled={!selectedPlan}
                onClick={() => { setRegAlert({ show: false, msg: '', ok: false }); setShowRegModal(true); }}
              >
                <i className="fa-solid fa-arrow-right"></i>
                Tiếp Theo: Đăng Ký Tài Khoản
              </button>

              <p className="pay-note">
                <i className="fa-solid fa-circle-info"></i>
                Sau khi đăng ký, tài khoản Member sẽ được tạo và kích hoạt trong vòng 5 phút sau khi thanh toán hoàn tất.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* ════════════ REGISTRATION MODAL ════════════ */}
      {showRegModal && (
        <div className="reg-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !isRegLoading) setShowRegModal(false); }}>
          <div className="reg-modal">

            {regSuccess ? (
              /* ── Success screen ── */
              <div className="success-screen">
                <div className="success-icon-wrap">
                  <i className="fa-solid fa-check"></i>
                </div>
                <h3>Đăng Ký Thành Công!</h3>
                <p>
                  Tài khoản của bạn đã được tạo thành công.<br />
                  Vui lòng đăng nhập và hoàn tất thanh toán để kích hoạt gói tập.
                </p>
                <button className="btn-go-login" onClick={goLogin}>
                  <i className="fa-solid fa-right-to-bracket"></i>
                  Đăng Nhập Ngay
                </button>
              </div>
            ) : (
              <>
                {/* ── Header ── */}
                <div className="reg-modal-header">
                  <div className="rm-icon">
                    <i className="fa-solid fa-user-plus"></i>
                  </div>
                  <h2>Tạo Tài Khoản Thành Viên</h2>
                  <p>Điền thông tin bên dưới để đăng ký và trở thành hội viên FxFitness.</p>
                </div>

                {/* ── Body ── */}
                <div className="reg-modal-body">
                  {/* Plan strip */}
                  {selectedPlan && (
                    <div className="reg-plan-strip">
                      <i className="fa-solid fa-tag"></i>
                      <div>
                        <div className="rps-name">{selectedPlan.planName}</div>
                        <div className="rps-price">{fmt(selectedPlan.price)}{getPeriodLabel(selectedPlan.durationMonths)}</div>
                      </div>
                    </div>
                  )}

                  {/* Alert */}
                  {regAlert.show && (
                    <div className={`reg-alert ${regAlert.ok ? 'ok' : 'err'}`}>
                      <i className={`fa-solid ${regAlert.ok ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
                      <span>{regAlert.msg}</span>
                    </div>
                  )}

                  <form id="fRegister" onSubmit={doRegister}>
                    {/* Họ và tên */}
                    <div className="reg-field">
                      <label>Họ và Tên</label>
                      <div className="reg-inp-wrap">
                        <i className="fa-solid fa-user inp-icon"></i>
                        <input
                          type="text"
                          placeholder="Nhập họ và tên đầy đủ"
                          value={regFullName}
                          onChange={e => setRegFullName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="reg-field">
                      <label>Email (dùng để đăng nhập)</label>
                      <div className="reg-inp-wrap">
                        <i className="fa-solid fa-envelope inp-icon"></i>
                        <input
                          type="email"
                          placeholder="ví dụ: ten@email.com"
                          value={regEmail}
                          onChange={e => setRegEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Số điện thoại */}
                    <div className="reg-field">
                      <label>Số Điện Thoại</label>
                      <div className="reg-inp-wrap">
                        <i className="fa-solid fa-phone inp-icon"></i>
                        <input
                          type="tel"
                          placeholder="0xxxxxxxxx"
                          value={regPhone}
                          onChange={e => setRegPhone(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Mật khẩu */}
                    <div className="reg-field">
                      <label>Mật Khẩu</label>
                      <div className="reg-inp-wrap">
                        <i className="fa-solid fa-lock inp-icon"></i>
                        <input
                          type={showRegPw ? 'text' : 'password'}
                          placeholder="Tối thiểu 6 ký tự"
                          value={regPw}
                          onChange={e => setRegPw(e.target.value)}
                          required
                        />
                        <button type="button" className="eye-btn" onClick={() => setShowRegPw(v => !v)}>
                          <i className={`fa-regular ${showRegPw ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                        </button>
                      </div>
                    </div>

                    {/* Xác nhận mật khẩu */}
                    <div className="reg-field">
                      <label>Xác Nhận Mật Khẩu</label>
                      <div className="reg-inp-wrap">
                        <i className="fa-solid fa-lock inp-icon"></i>
                        <input
                          type={showRegConf ? 'text' : 'password'}
                          placeholder="Nhập lại mật khẩu"
                          value={regConfPw}
                          onChange={e => setRegConfPw(e.target.value)}
                          required
                        />
                        <button type="button" className="eye-btn" onClick={() => setShowRegConf(v => !v)}>
                          <i className={`fa-regular ${showRegConf ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* ── Footer ── */}
                <div className="reg-modal-footer">
                  <button
                    className="btn-reg-cancel"
                    disabled={isRegLoading}
                    onClick={() => setShowRegModal(false)}
                  >
                    Hủy
                  </button>
                  <button
                    className="btn-reg-submit"
                    form="fRegister"
                    type="submit"
                    disabled={isRegLoading}
                  >
                    {isRegLoading
                      ? <><i className="fa-solid fa-spinner fa-spin"></i> Đang xử lý...</>
                      : <><i className="fa-solid fa-user-plus"></i> Đăng Ký Ngay</>
                    }
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default CheckoutPage;
