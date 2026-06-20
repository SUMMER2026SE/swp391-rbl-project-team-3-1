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

  // Trạng thái cho Tư vấn AI Guest (Guest AI Consultation)
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiName, setAiName] = useState('');
  const [aiAge, setAiAge] = useState('25');
  const [aiGender, setAiGender] = useState('Nam');
  const [aiHeight, setAiHeight] = useState('170');
  const [aiWeight, setAiWeight] = useState('65');
  const [aiFitnessGoal, setAiFitnessGoal] = useState('Tăng cơ');
  const [aiConsultationType, setAiConsultationType] = useState('BMI');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLoadingStep, setAiLoadingStep] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState('');

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

  // Navigate to service detail page
  const goToServiceDetail = (serviceKey) => {
    window.history.pushState({}, '', `/detail/${serviceKey}`);
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

  const handleGuestAiConsult = async (e) => {
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
      'Đang kết nối máy chủ tư vấn...',
      'AI đang tính toán chỉ số BMI thể hình...',
      'AI đang phân tích mục tiêu & thể chất...',
      'Đang tổng hợp lộ trình khuyến nghị...'
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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guestName: aiName || 'Khách truy cập',
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
      } else {
        setAiError(data.message || 'Yêu cầu tư vấn AI thất bại!');
      }
    } catch (err) {
      clearInterval(stepInterval);
      setAiLoading(false);
      setAiError('Không thể kết nối đến máy chủ AI!');
    }
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
        <div className="hero-bg"></div>

        <div className="hero-content">
          <h1 className="hero-title">Bứt Phá Giới Hạn</h1>
          <p className="hero-subtitle">
            Hệ thống quản lý phòng gym thông minh, tối ưu hóa quy trình tập luyện và trải nghiệm khách hàng đẳng cấp.
          </p>
          <div className="hero-actions">
            <a
              href="#pricing"
              onClick={(e) => handleAnchorClick(e, '#pricing')}
              className="btn-hero-primary"
            >
              MUA GÓI TẬP
            </a>
            <a
              href="#services"
              onClick={(e) => handleAnchorClick(e, '#services')}
              className="btn-hero-outline"
            >
              TÌM HIỂU THÊM
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
          <div 
            className="service-card reveal reveal-delay-1"
            onClick={() => goToServiceDetail('gym')}
            style={{ cursor: 'pointer' }}
          >
            <div className="service-icon">
              <i className="fas fa-dumbbell"></i>
            </div>
            <h3 className="service-name">Gym</h3>
            <p className="service-desc">
              Trang thiết bị hiện đại, không gian rộng rãi đáp ứng mọi nhu cầu tập luyện thể hình.
            </p>
            <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--orange)', marginTop: '8.5px', display: 'inline-block' }}>XEM CHI TIẾT →</span>
          </div>

          <div 
            className="service-card reveal reveal-delay-2"
            onClick={() => goToServiceDetail('yoga')}
            style={{ cursor: 'pointer' }}
          >
            <div className="service-icon">
              <i className="fas fa-person-praying"></i>
            </div>
            <h3 className="service-name">Yoga</h3>
            <p className="service-desc">
              Lớp học đa dạng từ cơ bản đến nâng cao, giúp cân bằng thân – tâm – trí.
            </p>
            <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--orange)', marginTop: '8.5px', display: 'inline-block' }}>XEM CHI TIẾT →</span>
          </div>

          <div 
            className="service-card reveal reveal-delay-3"
            onClick={() => goToServiceDetail('pt')}
            style={{ cursor: 'pointer' }}
          >
            <div className="service-icon">
              <i className="fas fa-user-tie"></i>
            </div>
            <h3 className="service-name">PT Cá Nhân</h3>
            <p className="service-desc">
              Lộ trình tập luyện thiết kế riêng biệt, đồng hành cùng huấn luyện viên chuyên nghiệp.
            </p>
            <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--orange)', marginTop: '8.5px', display: 'inline-block' }}>XEM CHI TIẾT →</span>
          </div>

          <div 
            className="service-card reveal reveal-delay-4"
            onClick={() => setShowAiModal(true)}
            style={{ cursor: 'pointer', border: '1px dashed var(--orange)' }}
          >
            <div className="service-icon" style={{ backgroundColor: '#fff8f1', color: 'var(--orange)' }}>
              <i className="fas fa-robot"></i>
            </div>
            <h3 className="service-name">Trợ lý Tư vấn AI</h3>
            <p className="service-desc">
              Nhập chỉ số thể chất của bạn để nhận phân tích BMI và lời khuyên tập luyện tức thời từ AI.
            </p>
            <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--orange)', marginTop: '8px', display: 'inline-block' }}>DÙNG THỬ NGAY →</span>
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
          {/* Gym 3-Month Plan */}
          <div className="pricing-card reveal reveal-delay-1">
            <p className="plan-name">Gói 3 Tháng (Gym)</p>
            <div className="plan-price">
              <div className="price-amount">
                5.000đ<span className="price-period">/3 tháng</span>
              </div>
            </div>
            <div className="plan-divider"></div>
            <ul className="plan-features">
              <li>
                <i className="fas fa-check-circle"></i> Truy cập đầy đủ thiết bị Gym
              </li>
              <li>
                <i className="fas fa-check-circle"></i> Tủ đồ cá nhân
              </li>
              <li>
                <i className="fas fa-check-circle"></i> Miễn phí giữ xe
              </li>
              <li className="disabled">
                <i className="fas fa-circle"></i> Chưa bao gồm lớp Yoga/Boxing
              </li>
            </ul>
            <button
              onClick={() => goToCheckout('Gym 3 Tháng')}
              className="btn-plan"
            >
              Mua Ngay
            </button>
          </div>

          {/* Gym 6-Month Plan (Featured) */}
          <div className="pricing-card featured reveal reveal-delay-2">
            <div className="popular-badge">Phổ biến nhất</div>
            <p className="plan-name featured-name">Gói 6 Tháng (Gym)</p>
            <div className="plan-price">
              <div className="price-amount">
                10.000đ<span className="price-period">/6 tháng</span>
              </div>
            </div>
            <div className="plan-divider"></div>
            <ul className="plan-features">
              <li>
                <i className="fas fa-check-circle"></i> Truy cập đầy đủ thiết bị Gym
              </li>
              <li>
                <i className="fas fa-check-circle"></i> Tủ đồ VIP riêng biệt
              </li>
              <li>
                <i className="fas fa-check-circle"></i> Miễn phí giữ xe
              </li>
              <li>
                <i className="fas fa-check-circle"></i> Hỗ trợ đo chỉ số Inbody miễn phí
              </li>
              <li>
                <i className="fas fa-check-circle"></i> Ưu tiên đặt lịch HLV
              </li>
            </ul>
            <button
              onClick={() => goToCheckout('Gym 6 Tháng')}
              className="btn-plan btn-featured"
            >
              MUA NGAY
            </button>
          </div>

          {/* Gym 12-Month Plan */}
          <div className="pricing-card reveal reveal-delay-3">
            <p className="plan-name">Gói 12 Tháng (Gym)</p>
            <div className="plan-price">
              <div className="price-amount">
                15.000đ<span className="price-period">/năm</span>
              </div>
            </div>
            <div className="plan-divider"></div>
            <ul className="plan-features">
              <li>
                <i className="fas fa-check-circle"></i> Toàn bộ quyền lợi của gói 6 tháng
              </li>
              <li>
                <i className="fas fa-check-circle"></i> Tặng 1 tháng tập luyện miễn phí
              </li>
              <li>
                <i className="fas fa-check-circle"></i> Tặng 2 buổi tập thử với PT riêng
              </li>
              <li>
                <i className="fas fa-check-circle"></i> Kiểm tra sức khỏe Inbody định kỳ
              </li>
            </ul>
            <button
              onClick={() => goToCheckout('Gym 12 Tháng')}
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
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={handleSetupSkip}
              disabled={isSavingSetup}
              title="Đóng"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
            
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

      {/* GUEST AI CONSULTATION MODAL OVERLAY */}
      {showAiModal && (
        <div className="setup-modal-overlay">
          <div className="setup-modal-card animate-slide-up" style={{ maxWidth: '650px' }}>
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={() => { setShowAiModal(false); setAiResult(null); setAiError(''); }}
              title="Đóng"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
            
            {/* Steps indicator */}
            <div className="setup-step-indicator" style={{ background: '#fff7ed', color: 'var(--orange)' }}>
              TRỢ LÝ SỨC KHỎE FX AI
            </div>

            {/* Header */}
            <h2 className="setup-modal-title">Tư vấn Sức khỏe AI</h2>
            <p className="setup-modal-subtitle">
              Nhập chỉ số thể chất của bạn để nhận phân tích BMI và lời khuyên tập luyện tức thì từ trí tuệ nhân tạo
            </p>

            {aiError && (
              <div className="setup-alert-error animate-fade-in" style={{ marginBottom: '16px' }}>
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{aiError}</span>
              </div>
            )}

            {aiLoading && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div className="ai-pulse-loader" style={{ display: 'inline-flex', alignItems: 'center', justify: 'center', width: '90px', height: '90px', borderRadius: '50%', background: '#fff6ed', animation: 'pulse-orange 1.8s infinite', margin: '0 auto' }}>
                  <i className="fa-solid fa-robot fa-bounce" style={{ fontSize: '3rem', color: 'var(--orange)' }}></i>
                </div>
                <h4 style={{ marginTop: '20px', color: '#1e293b' }}>{aiLoadingStep}</h4>
                <p style={{ color: '#94a3b8', fontSize: '0.86rem', marginTop: '8px' }}>Quá trình phân tích chỉ số có thể mất vài giây...</p>
              </div>
            )}

            {!aiLoading && !aiResult && (
              <form onSubmit={handleGuestAiConsult} className="setup-form">
                
                {/* Row for Name & Age */}
                <div className="setup-form-row">
                  <div className="setup-field">
                    <label>HỌ VÀ TÊN</label>
                    <input 
                      type="text" 
                      placeholder="Nguyễn Văn A" 
                      value={aiName} 
                      onChange={(e) => setAiName(e.target.value)} 
                    />
                  </div>
                  <div className="setup-field">
                    <label>TUỔI (NĂM)</label>
                    <input 
                      type="number" 
                      placeholder="25" 
                      value={aiAge} 
                      onChange={(e) => setAiAge(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                {/* Row for Gender & Type */}
                <div className="setup-form-row">
                  <div className="setup-field">
                    <label>GIỚI TÍNH</label>
                    <select 
                      className="member-form-select" 
                      value={aiGender} 
                      onChange={(e) => setAiGender(e.target.value)}
                      style={{ height: '48px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0 16px', background: '#f8fafc', fontWeight: '600', width: '100%' }}
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                  <div className="setup-field">
                    <label>PHƯƠNG THỨC TƯ VẤN</label>
                    <select 
                      className="member-form-select" 
                      value={aiConsultationType} 
                      onChange={(e) => setAiConsultationType(e.target.value)}
                      style={{ height: '48px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0 16px', background: '#f8fafc', fontWeight: '600', width: '100%' }}
                    >
                      <option value="BMI">Chỉ số BMI thể chất</option>
                      <option value="General Fitness">Luyện tập thể hình</option>
                      <option value="Weight Loss">Kế hoạch giảm mỡ</option>
                      <option value="Muscle Gain">Kế hoạch tăng cơ</option>
                      <option value="Relaxation">Yoga & Phục hồi</option>
                    </select>
                  </div>
                </div>

                {/* Row for Height & Weight */}
                <div className="setup-form-row">
                  <div className="setup-field">
                    <label>CHIỀU CAO (CM)</label>
                    <input 
                      type="number" 
                      placeholder="170" 
                      value={aiHeight} 
                      onChange={(e) => setAiHeight(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="setup-field">
                    <label>CÂN NẶNG (KG)</label>
                    <input 
                      type="number" 
                      placeholder="65" 
                      value={aiWeight} 
                      onChange={(e) => setAiWeight(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="setup-field">
                  <label>MỤC TIÊU LUYỆN TẬP</label>
                  <select 
                    className="member-form-select" 
                    value={aiFitnessGoal} 
                    onChange={(e) => setAiFitnessGoal(e.target.value)}
                    style={{ height: '48px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0 16px', background: '#f8fafc', fontWeight: '600', width: '100%' }}
                  >
                    <option value="Giảm cân">Giảm cân</option>
                    <option value="Tăng cơ">Tăng cơ</option>
                    <option value="Cải thiện sức bền">Cải thiện sức bền</option>
                    <option value="Linh hoạt & Dẻo dai">Linh hoạt & Dẻo dai</option>
                    <option value="Sức khỏe tổng thể">Sức khỏe tổng thể</option>
                  </select>
                </div>

                <button type="submit" className="setup-submit-btn" style={{ marginBottom: '10px' }}>
                  NHẬN TƯ VẤN SỨC KHỎE
                </button>
              </form>
            )}

            {aiResult && !aiLoading && (
              <div className="ai-results-wrapper animate-slide-up" style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '8px', textAlign: 'left' }}>
                
                {/* BMI display card */}
                <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <h4 style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 'bold', textTransform: 'uppercase' }}>CHỈ SỐ BMI CỦA BẠN</h4>
                  <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--orange)', marginTop: '8px' }}>{aiResult.bmi}</div>
                  <div style={{ fontSize: '0.86rem', color: '#475569', fontWeight: '700', marginTop: '4px' }}>
                    ({aiResult.weight}kg / {aiResult.height}cm)
                  </div>
                </div>

                <div className="member-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
                  <div className="member-stat-card" style={{ borderLeft: '4px solid var(--orange)', padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 'bold' }}>MÔN TẬP GỢI Ý</span>
                    <h4 style={{ fontSize: '1.1rem', marginTop: '6px', color: '#1e293b' }}>{aiResult.recommended_sport}</h4>
                  </div>
                  <div className="member-stat-card" style={{ borderLeft: '4px solid #10b981', padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 'bold' }}>GÓI TẬP ĐỀ XUẤT</span>
                    <h4 style={{ fontSize: '1.1rem', marginTop: '6px', color: '#1e293b' }}>{aiResult.recommended_membership}</h4>
                  </div>
                </div>

                <div style={{ marginTop: '16px', padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '0.86rem', color: '#1e293b', fontWeight: 'bold' }}>LỊCH TRÌNH RÈN LUYỆN GỢI Ý</h4>
                  <p style={{ marginTop: '8px', fontSize: '0.86rem', color: '#ff7a00', fontWeight: '600' }}>{aiResult.recommended_schedule}</p>
                </div>

                <div style={{ marginTop: '16px', padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '0.86rem', color: '#1e293b', fontWeight: 'bold' }}>TƯ VẤN CHI TIẾT TỪ AI</h4>
                  <p style={{ marginTop: '8px', fontSize: '0.86rem', color: '#475569', lineHeight: '1.5', textAlign: 'justify' }}>{aiResult.recommendation_detail}</p>
                </div>

                <button 
                  onClick={() => setAiResult(null)} 
                  className="setup-submit-btn" 
                  style={{ marginTop: '20px', width: '100%' }}
                >
                  TƯ VẤN MỚI
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
