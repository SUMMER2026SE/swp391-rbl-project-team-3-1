import React, { useState, useEffect } from 'react';
import './HomePage.css';

function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userInfo, setUserInfo] = useState(JSON.parse(localStorage.getItem('userInfo') || 'null'));

  const [plans, setPlans] = useState([]);
  const [services, setServices] = useState([]);
  const [coreSports, setCoreSports] = useState([]);

  // Trạng thái cho bảng thiết lập hồ sơ (Profile Setup Modal)
  const [showSetupModal, setShowSetupModal] = useState(localStorage.getItem('showProfileSetup') === 'true');
  const [setupHeight, setSetupHeight] = useState('170');
  const [setupWeight, setSetupWeight] = useState('65');
  const [setupGender, setSetupGender] = useState('Nam');
  const [setupDob, setSetupDob] = useState('');
  const [setupGoals, setSetupGoals] = useState(['Giảm cân']);
  const [setupLevel, setSetupLevel] = useState('Người mới bắt đầu');
  const [setupError, setSetupError] = useState('');
  const [isSavingSetup, setIsSavingSetup] = useState(false);

  useEffect(() => {
    const handleAuthChange = () => {
      setToken(localStorage.getItem('token') || '');
      setUserInfo(JSON.parse(localStorage.getItem('userInfo') || 'null'));
      setShowSetupModal(localStorage.getItem('showProfileSetup') === 'true');
    };
    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  useEffect(() => {
    // Navbar scroll effect
    const handleScroll = () => {
      if (window.scrollY > 60) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    // Scroll reveal animations
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.12 }
    );

    reveals.forEach((el) => observer.observe(el));

    return () => {
      reveals.forEach(r => observer.unobserve(r));
    };
  }, [plans, services]); // Depend on dynamic data so observer updates

  useEffect(() => {
    // Fetch Plans
    fetch('/api/checkout/plans')
      .then(res => res.json())
      .then(data => {
        if (data.plans) setPlans(data.plans);
      })
      .catch(err => console.error('Error fetching plans:', err));

    // Fetch Services
    fetch('/api/checkout/services')
      .then(res => res.json())
      .then(data => {
        if (data.services) setServices(data.services);
      })
      .catch(err => console.error('Error fetching services:', err));

    // Fetch Homepage config
    fetch('/api/checkout/homepage-config')
      .then(res => res.json())
      .then(data => {
        if (data.coreSports && data.coreSports.length > 0) setCoreSports(data.coreSports);
      })
      .catch(err => console.error('Error fetching homepage config:', err));
  }, []);

  // Navigate to checkout with selected plan
  const goToCheckout = (planKey) => {
    localStorage.setItem('checkoutPlan', planKey);
    window.history.pushState({}, '', `/checkout?plan=${planKey}`);
    window.dispatchEvent(new Event('popstate'));
  };

  // Smooth scroll handler for anchor links
  const handleAnchorClick = (e, targetId) => {
    e.preventDefault();
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Thay đổi lựa chọn mục tiêu (đa chọn)
  const toggleGoal = (goal) => {
    if (setupGoals.includes(goal)) {
      if (setupGoals.length > 1) {
        setSetupGoals(setupGoals.filter(g => g !== goal));
      }
    } else {
      setSetupGoals([...setupGoals, goal]);
    }
  };

  // Gửi thông tin thiết lập hồ sơ lên server
  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    setSetupError('');
    setIsSavingSetup(true);

    if (!setupHeight || Number(setupHeight) <= 0) {
      setSetupError('Chiều cao không hợp lệ!');
      setIsSavingSetup(false);
      return;
    }
    if (!setupWeight || Number(setupWeight) <= 0) {
      setSetupError('Cân nặng không hợp lệ!');
      setIsSavingSetup(false);
      return;
    }
    if (!setupDob) {
      setSetupError('Vui lòng chọn ngày sinh!');
      setIsSavingSetup(false);
      return;
    }

    try {
      // Chiều cao lưu trong DB dạng MÉT (ví dụ 1.70), còn UI nhập dạng CM (ví dụ 170)
      const heightInMeters = Number(setupHeight) / 100;
      const goalStr = setupGoals.join(', ');

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          height: heightInMeters,
          weight: Number(setupWeight),
          gender: setupGender,
          dateOfBirth: setupDob,
          fitnessGoal: goalStr,
          fitnessLevel: setupLevel
        })
      });

      const data = await res.json();
      setIsSavingSetup(false);
      if (res.ok) {
        localStorage.removeItem('showProfileSetup');
        setShowSetupModal(false);
        alert('Hồ sơ của bạn đã được thiết lập thành công! Hãy sẵn sàng bắt đầu tập luyện.');
      } else {
        setSetupError(data.message || 'Cập nhật thông tin thất bại!');
      }
    } catch (err) {
      setIsSavingSetup(false);
      setSetupError('Không thể kết nối đến server!');
    }
  };

  // Bỏ qua thiết lập hồ sơ
  const handleSetupSkip = () => {
    localStorage.removeItem('showProfileSetup');
    setShowSetupModal(false);
  };

  return (
    <div className="homepage-container">
      {/* ========================================== */}
      {/* NAVBAR                                     */}
      {/* ========================================== */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`} id="navbar">
        <a href="#home" onClick={(e) => handleAnchorClick(e, '#home')} className="nav-logo">
          <div className="nav-logo-mark">
            <span className="nav-logo-fx">FX</span>
            <span className="nav-logo-chevron">
              <i className="fas fa-chevron-right"></i>
            </span>
          </div>
          <span className="nav-logo-text">FX FITNESS</span>
        </a>

        <ul className="nav-links">
          <li>
            <a href="#home" onClick={(e) => handleAnchorClick(e, '#home')} className="active">
              Trang Chủ
            </a>
          </li>
          <li>
            <a href="#services" onClick={(e) => handleAnchorClick(e, '#services')}>
              Dịch Vụ
            </a>
          </li>
          <li>
            <a href="#pricing" onClick={(e) => handleAnchorClick(e, '#pricing')}>
              Gói Tập
            </a>
          </li>
          <li>
            <a href="#addons" onClick={(e) => handleAnchorClick(e, '#addons')}>
              Dịch Vụ Bổ Sung & PT
            </a>
          </li>
          {token && (
            <li>
              <a
                href="/login"
                onClick={(e) => {
                  e.preventDefault();
                  window.history.pushState({}, '', '/login');
                  window.dispatchEvent(new Event('popstate'));
                }}
              >
                Bảng Điều Khiển
              </a>
            </li>
          )}
        </ul>

        <div className="nav-actions">
          {token ? (
            <>
              <a
                href="/login"
                onClick={(e) => {
                  e.preventDefault();
                  window.history.pushState({}, '', '/login');
                  window.dispatchEvent(new Event('popstate'));
                }}
                className="btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <i className="fa-solid fa-user"></i> {userInfo ? userInfo.fullName : 'Tài Khoản'}
              </a>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('userInfo');
                  window.dispatchEvent(new Event('authChange'));
                }}
                className="btn-outline"
                style={{
                  background: 'transparent',
                  padding: '8px 22px',
                  cursor: 'pointer',
                }}
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <a
                href="/login"
                onClick={(e) => {
                  e.preventDefault();
                  window.history.pushState({}, '', '/login');
                  window.dispatchEvent(new Event('popstate'));
                }}
                className="btn-outline"
              >
                Đăng Nhập
              </a>
              <a href="#pricing" onClick={(e) => handleAnchorClick(e, '#pricing')} className="btn-primary-nav">
                Mua Gói Tập
              </a>
            </>
          )}
        </div>
      </nav>

      {/* ========================================== */}
      {/* HERO SECTION                               */}
      {/* ========================================== */}
      <section className="hero" id="home">
        <div className="hero-bg">
          <div className="hero-gym-visual">
            <div className="corridor">
              {/* Ceiling bar (orange horizontal accent) */}
              <div className="ceiling-bar"></div>
              {/* White ceiling strip lights */}
              <div className="ceiling-light ceiling-light-1"></div>
              <div className="ceiling-light ceiling-light-2"></div>
              <div className="ceiling-light ceiling-light-3"></div>
              {/* Small accent dots */}
              <div className="accent-dot" style={{ left: '35%', top: '14%' }}></div>
              <div className="accent-dot" style={{ left: '55%', top: '14%' }}></div>
              <div className="accent-dot" style={{ left: '50%', top: '20%' }}></div>
            </div>
            {/* Orange vertical accent pillars */}
            <div className="pillar-left"></div>
            <div className="pillar-right"></div>
          </div>
        </div>

        <div className="hero-content">
          <h1 className="hero-title">Bứt Phá Giới Hạn</h1>
          <p className="hero-subtitle">
            Hệ thống quản lý phòng gym thông minh, tối ưu hóa quy trình tập luyện và trải nghiệm khách hàng đẳng cấp.
          </p>
          <div className="hero-actions">
            <a href="#pricing" onClick={(e) => handleAnchorClick(e, '#pricing')} className="btn-hero-primary">
              Xem Gói Tập
            </a>
            <a href="#services" onClick={(e) => handleAnchorClick(e, '#services')} className="btn-hero-outline">
              Tìm Hiểu Thêm
            </a>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* SERVICES SECTION                           */}
      {/* ========================================== */}
      <section className="section-services" id="services">
        <div className="section-header reveal">
          <h2 className="section-title">Dịch Vụ Của Chúng Tôi</h2>
        </div>

        <div className="services-grid">
          {coreSports.length > 0 ? coreSports.map((sport, index) => (
            <div key={index} className={`service-card reveal reveal-delay-${(index % 3) + 1}`} style={{ backgroundImage: `url('${sport.image}')` }}>
              <div className="service-overlay">
                <h3 className="service-name">{sport.name}</h3>
                <p className="service-desc">{sport.description}</p>
              </div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', width: '100%', padding: '40px' }}>Đang tải dịch vụ...</div>
          )}
        </div>
      </section>

      {/* ========================================== */}
      {/* PRICING SECTION                            */}
      {/* ========================================== */}
      <section className="section-pricing" id="pricing">
        <div className="section-header reveal">
          <h2 className="section-title">Gói Tập</h2>
          <p style={{textAlign: 'center', marginTop: '10px', color: '#64748b'}}>Khám phá các lựa chọn phù hợp nhất cho mục tiêu của bạn.</p>
        </div>

        {(coreSports.length > 0 ? coreSports.map(s => s.name) : ['Gym', 'Yoga', 'Boxing']).map((sport) => {
          const sportPlans = plans.filter(p => p.sportType === sport).sort((a,b) => a.durationMonths - b.durationMonths);
          if (sportPlans.length === 0) return null;
          return (
            <div key={sport} style={{ marginBottom: '60px' }}>
              <h3 style={{ textAlign: 'center', marginBottom: '30px', fontFamily: 'Barlow Condensed', fontSize: '2rem', color: 'var(--orange)' }}>{sport}</h3>
              <div className="pricing-grid">
                {sportPlans.map((plan, index) => (
                  <div key={plan.planId} className={`pricing-card reveal reveal-delay-${(index % 3) + 1} ${plan.durationMonths === 6 ? 'featured' : ''}`}>
                    {plan.durationMonths === 6 && <div className="popular-badge">Phổ biến nhất</div>}
                    <p className={`plan-name ${plan.durationMonths === 6 ? 'featured-name' : ''}`}>{plan.planName}</p>
                    <div className="plan-price">
                      <div className="price-amount">
                        {plan.price.toLocaleString('vi-VN')}đ<span className="price-period">/{plan.durationMonths} tháng</span>
                      </div>
                    </div>
                    <div className="plan-divider"></div>
                    <ul className="plan-features">
                      <li><i className="fas fa-check-circle"></i> Truy cập bộ môn: <strong>{plan.sportType}</strong></li>
                      <li><i className="fas fa-check-circle"></i> {plan.description}</li>
                    </ul>
                    <button
                      onClick={() => goToCheckout(plan.planId)}
                      className={`btn-plan ${plan.durationMonths === 6 ? 'btn-featured' : ''}`}
                    >
                      Mua Ngay
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {plans.length === 0 && <p style={{textAlign: 'center', width: '100%'}}>Đang tải gói tập...</p>}
      </section>

      {/* ========================================== */}
      {/* ADD-ON SERVICES SECTION                    */}
      {/* ========================================== */}
      <section className="section-pricing" id="addons" style={{ backgroundColor: '#f1f5f9' }}>
        <div className="section-header reveal">
          <h2 className="section-title">Dịch Vụ Bổ Sung & Thuê PT</h2>
          <p style={{textAlign: 'center', marginTop: '10px', color: '#64748b'}}>Nâng tầm trải nghiệm tập luyện của bạn với các dịch vụ chuyên sâu.</p>
        </div>

        <div className="pricing-grid">
          {services.sort((a,b) => {
            const isAPT = a.serviceName.includes('PT') ? -1 : 1;
            const isBPT = b.serviceName.includes('PT') ? -1 : 1;
            if (isAPT !== isBPT) return isAPT - isBPT;
            return a.price - b.price;
          }).map((srv, index) => (
            <div key={srv.serviceId} className={`pricing-card reveal reveal-delay-${(index % 3) + 1}`} style={{ borderTop: `4px solid ${srv.serviceName.includes('PT') ? '#f59e0b' : '#3b82f6'}` }}>
              <p className="plan-name" style={{ color: srv.serviceName.includes('PT') ? '#f59e0b' : '#3b82f6', fontSize: '1.2rem' }}>{srv.serviceName}</p>
              <div className="plan-price" style={{ marginTop: '10px' }}>
                <div className="price-amount" style={{ fontSize: '1.6rem' }}>
                  {srv.price.toLocaleString('vi-VN')}đ
                </div>
              </div>
              <div className="plan-divider" style={{ margin: '15px 0' }}></div>
              <ul className="plan-features" style={{ flexGrow: 1 }}>
                <li><i className="fas fa-check-circle" style={{ color: srv.serviceName.includes('PT') ? '#f59e0b' : '#3b82f6' }}></i> Phân loại: <strong>{srv.sportType || 'Tiện ích'}</strong></li>
                <li><i className="fas fa-check-circle" style={{ color: srv.serviceName.includes('PT') ? '#f59e0b' : '#3b82f6' }}></i> {srv.description}</li>
              </ul>
              {srv.serviceName.includes('PT') && (
                <button
                  onClick={() => {
                    window.history.pushState({}, '', '/pt-details');
                    window.dispatchEvent(new Event('popstate'));
                  }}
                  className="btn-plan"
                  style={{ marginTop: '20px', borderColor: '#f59e0b', color: '#f59e0b' }}
                  onMouseEnter={(e) => { e.target.style.backgroundColor = '#f59e0b'; e.target.style.color = 'white'; }}
                  onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#f59e0b'; }}
                >
                  Xem Chi Tiết PT
                </button>
              )}
            </div>
          ))}
          {services.length === 0 && <p style={{textAlign: 'center', width: '100%'}}>Đang tải dịch vụ...</p>}
        </div>
      </section>

      {/* ========================================== */}
      {/* FOOTER                                     */}
      {/* ========================================== */}
      <footer className="footer">
        <div className="footer-logo">
          <span className="footer-logo-text">Fx Fitness</span>
          <span className="footer-copy">© 2026 Fx Fitness Center. Đánh thức sức mạnh tiềm ẩn.</span>
        </div>
        <div className="footer-links">
          <a href="#about">Về Chúng Tôi</a>
          <a href="#privacy">Chính Sách Bảo Mật</a>
          <a href="#terms">Điều Khoản</a>
          <a href="#contact">Liên Hệ</a>
        </div>
      </footer>

      {/* ONBOARDING PROFILE SETUP MODAL OVERLAY */}
      {showSetupModal && (
        <div className="setup-modal-overlay">
          <div className="setup-modal-card animate-slide-up">
            
            {/* Steps indicator */}
            <div className="setup-step-indicator">
              BƯỚC 1 / 1 — THIẾT LẬP HỒ SƠ
            </div>

            {/* Header */}
            <h2 className="setup-modal-title">Hãy cho chúng tôi biết về bạn</h2>
            <p className="setup-modal-subtitle">
              Thông tin này giúp chúng tôi tạo lộ trình luyện tập phù hợp nhất cho bạn
            </p>

            {setupError && (
              <div className="setup-alert-error animate-fade-in">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{setupError}</span>
              </div>
            )}

            <form onSubmit={handleSetupSubmit} className="setup-form">
              
              {/* Row for Height & Weight */}
              <div className="setup-form-row">
                <div className="setup-field">
                  <label>CHIỀU CAO (CM)</label>
                  <input
                    type="number"
                    placeholder="170"
                    value={setupHeight}
                    onChange={(e) => setSetupHeight(e.target.value)}
                    required
                    disabled={isSavingSetup}
                  />
                </div>
                <div className="setup-field">
                  <label>CÂN NẶNG (KG)</label>
                  <input
                    type="number"
                    placeholder="65"
                    value={setupWeight}
                    onChange={(e) => setSetupWeight(e.target.value)}
                    required
                    disabled={isSavingSetup}
                  />
                </div>
              </div>

              {/* Gender selection */}
              <div className="setup-field">
                <label>GIỚI TÍNH</label>
                <div className="setup-gender-buttons">
                  {['Nam', 'Nữ', 'Khác'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`setup-gender-btn ${setupGender === g ? 'active' : ''}`}
                      onClick={() => setSetupGender(g)}
                      disabled={isSavingSetup}
                    >
                      {g.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date of Birth */}
              <div className="setup-field">
                <label>NGÀY SINH</label>
                <input
                  type="date"
                  value={setupDob}
                  onChange={(e) => setSetupDob(e.target.value)}
                  required
                  disabled={isSavingSetup}
                />
              </div>

              {/* Fitness Goals (Multi-select tags) */}
              <div className="setup-field">
                <label>MỤC TIÊU LUYỆN TẬP</label>
                <div className="setup-goal-tags">
                  {['Giảm cân', 'Tăng cơ', 'Cải thiện sức bền', 'Linh hoạt & Dẻo dai', 'Sức khỏe tổng thể'].map((goal) => {
                    const isSelected = setupGoals.includes(goal);
                    return (
                      <button
                        key={goal}
                        type="button"
                        className={`setup-goal-tag ${isSelected ? 'active' : ''}`}
                        onClick={() => toggleGoal(goal)}
                        disabled={isSavingSetup}
                      >
                        {goal}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Current level selection cards */}
              <div className="setup-field">
                <label>CẤP ĐỘ HIỆN TẠI</label>
                <div className="setup-level-cards">
                  {[
                    {
                      name: 'Người mới bắt đầu',
                      desc: 'Chưa từng tập hoặc tập không thường xuyên',
                      icon: 'fa-solid fa-arrow-trend-up'
                    },
                    {
                      name: 'Trung cấp',
                      desc: 'Đã tập luyện đều đặn từ 6-12 tháng',
                      icon: 'fa-solid fa-bolt'
                    },
                    {
                      name: 'Nâng cao',
                      desc: 'Tập luyện cường độ cao trên 1 năm',
                      icon: 'fa-solid fa-person-running'
                    }
                  ].map((level) => {
                    const isSelected = setupLevel === level.name;
                    return (
                      <div
                        key={level.name}
                        className={`setup-level-card ${isSelected ? 'active' : ''}`}
                        onClick={() => !isSavingSetup && setSetupLevel(level.name)}
                      >
                        <div className="setup-level-icon-wrap">
                          <i className={level.icon}></i>
                        </div>
                        <div className="setup-level-text">
                          <h4>{level.name}</h4>
                          <p>{level.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <button
                type="submit"
                className="setup-submit-btn"
                disabled={isSavingSetup}
              >
                {isSavingSetup ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> ĐANG LƯU HỒ SƠ...
                  </>
                ) : (
                  'BẮT ĐẦU HÀNH TRÌNH'
                )}
              </button>

              <button
                type="button"
                className="setup-skip-btn"
                onClick={handleSetupSkip}
                disabled={isSavingSetup}
              >
                BỎ QUA, THIẾT LẬP SAU
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
