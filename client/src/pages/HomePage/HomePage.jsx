import React, { useState, useEffect } from 'react';
import './HomePage.css';

function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userInfo, setUserInfo] = useState(JSON.parse(localStorage.getItem('userInfo') || 'null'));

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

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
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
            <a href="#trainers" onClick={(e) => handleAnchorClick(e, '#trainers')}>
              Huấn Luyện Viên
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
          <div className="service-card reveal reveal-delay-1">
            <div className="service-icon">
              <i className="fas fa-dumbbell"></i>
            </div>
            <h3 className="service-name">Gym</h3>
            <p className="service-desc">
              Trang thiết bị hiện đại, không gian rộng rãi đáp ứng mọi nhu cầu tập luyện thể hình.
            </p>
          </div>

          <div className="service-card reveal reveal-delay-2">
            <div className="service-icon">
              <i className="fas fa-person-praying"></i>
            </div>
            <h3 className="service-name">Yoga</h3>
            <p className="service-desc">
              Lớp học đa dạng từ cơ bản đến nâng cao, giúp cân bằng thân – tâm – trí.
            </p>
          </div>

          <div className="service-card reveal reveal-delay-3">
            <div className="service-icon">
              <i className="fas fa-user-tie"></i>
            </div>
            <h3 className="service-name">PT Cá Nhân</h3>
            <p className="service-desc">
              Lộ trình tập luyện thiết kế riêng biệt, đồng hành cùng huấn luyện viên chuyên nghiệp.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* PRICING SECTION                            */}
      {/* ========================================== */}
      <section className="section-pricing" id="pricing">
        <div className="section-header reveal">
          <h2 className="section-title">Gói Tập</h2>
        </div>

        <div className="pricing-grid">
          {/* Monthly Plan */}
          <div className="pricing-card reveal reveal-delay-1">
            <p className="plan-name">Gói Tháng</p>
            <div className="plan-price">
              <div className="price-amount">
                5.000đ<span className="price-period">/tháng</span>
              </div>
            </div>
            <div className="plan-divider"></div>
            <ul className="plan-features">
              <li>
                <i className="fas fa-check-circle"></i> Truy cập đầy đủ thiết bị
              </li>
              <li>
                <i className="fas fa-check-circle"></i> Tủ đồ cá nhân
              </li>
              <li>
                <i className="fas fa-check-circle"></i> Miễn phí giữ xe
              </li>
              <li className="disabled">
                <i className="fas fa-circle"></i> Tham gia lớp Yoga
              </li>
            </ul>
            <button
              onClick={() => goToCheckout('monthly')}
              className="btn-plan"
            >
              Mua Ngay
            </button>
          </div>

          {/* 3-Month Plan (Featured) */}
          <div className="pricing-card featured reveal reveal-delay-2">
            <div className="popular-badge">Phổ biến nhất</div>
            <p className="plan-name featured-name">Gói 3 Tháng</p>
            <div className="plan-price">
              <div className="price-amount">
                10.000đ<span className="price-period">/3 tháng</span>
              </div>
            </div>
            <div className="plan-divider"></div>
            <ul className="plan-features">
              <li>
                <i className="fas fa-check-circle"></i> Truy cập đầy đủ thiết bị
              </li>
              <li>
                <i className="fas fa-check-circle"></i> Tủ đồ VIP
              </li>
              <li>
                <i className="fas fa-check-circle"></i> Miễn phí giữ xe
              </li>
              <li>
                <i className="fas fa-check-circle"></i> Tham gia lớp Yoga
              </li>
              <li>
                <i className="fas fa-check-circle"></i> Đo Inbody miễn phí 1 lần
              </li>
            </ul>
            <button
              onClick={() => goToCheckout('quarterly')}
              className="btn-plan btn-featured"
            >
              MUA NGAY
            </button>
          </div>

          {/* Annual Plan */}
          <div className="pricing-card reveal reveal-delay-3">
            <p className="plan-name">Gói Năm</p>
            <div className="plan-price">
              <div className="price-amount">
                15.000đ<span className="price-period">/năm</span>
              </div>
            </div>
            <div className="plan-divider"></div>
            <ul className="plan-features">
              <li>
                <i className="fas fa-check-circle"></i> Mọi quyền lợi của Gói 3 Tháng
              </li>
              <li>
                <i className="fas fa-check-circle"></i> Tặng thêm 1 tháng tập
              </li>
              <li>
                <i className="fas fa-check-circle"></i> Tặng 2 buổi cùng PT
              </li>
              <li>
                <i className="fas fa-check-circle"></i> Đo Inbody định kỳ
              </li>
            </ul>
            <button
              onClick={() => goToCheckout('annual')}
              className="btn-plan"
            >
              Mua Ngay
            </button>
          </div>
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
