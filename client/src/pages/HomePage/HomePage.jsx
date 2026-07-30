import React, { useState, useEffect } from 'react';
import './HomePage.css';

function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userInfo, setUserInfo] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('userInfo') || 'null');
    } catch (e) {
      console.error('Error parsing userInfo:', e);
      return null;
    }
  });

  const [plans, setPlans] = useState([]);
  const [services, setServices] = useState([]);
  const [coreSports, setCoreSports] = useState([]);
  const [heroTitle, setHeroTitle] = useState('Bứt Phá Giới Hạn');
  const [heroSubtitle, setHeroSubtitle] = useState('Hệ thống quản lý phòng gym thông minh, tối ưu hóa quy trình tập luyện và trải nghiệm khách hàng đẳng cấp.');

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

  // States for AI Consultation Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiName, setAiName] = useState('');
  const [aiAge, setAiAge] = useState('');
  const [aiGender, setAiGender] = useState('Nam');
  const [aiHeight, setAiHeight] = useState('');
  const [aiWeight, setAiWeight] = useState('');
  const [aiGoal, setAiGoal] = useState('Giảm cân');
  const [isConsulting, setIsConsulting] = useState(false);
  const [consultResult, setConsultResult] = useState(null);
  const [consultError, setConsultError] = useState('');

  useEffect(() => {
    const handleAuthChange = () => {
      setToken(localStorage.getItem('token') || '');
      try {
        setUserInfo(JSON.parse(localStorage.getItem('userInfo') || 'null'));
      } catch (e) {
        console.error('Error parsing userInfo:', e);
        setUserInfo(null);
      }
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
        if (data) {
          if (data.coreSports && data.coreSports.length > 0) setCoreSports(data.coreSports);
          if (data.heroTitle) setHeroTitle(data.heroTitle);
          if (data.heroSubtitle) setHeroSubtitle(data.heroSubtitle);
        }
      })
      .catch(err => console.error('Error fetching homepage config:', err));
  }, []);

  // Navigate to checkout with selected plan
  const goToCheckout = (planKey) => {
    localStorage.setItem('checkoutPlan', planKey);
    window.history.pushState({}, '', `/checkout?plan=${planKey}`);
    window.dispatchEvent(new Event('popstate'));
  };

  // Navigate to checkout with selected service
  const goToServiceCheckout = (serviceId) => {
    localStorage.removeItem('checkoutPlan');
    window.history.pushState({}, '', `/checkout?service=${serviceId}`);
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

  // Gửi thông số lên AI để nhận tư vấn
  const handleAiConsultSubmit = async (e) => {
    e.preventDefault();
    setConsultError('');
    setIsConsulting(true);
    setConsultResult(null);

    try {
      const res = await fetch('/api/ai/consult', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guestName: aiName || 'Khách',
          age: Number(aiAge) || 20,
          gender: aiGender,
          height: Number(aiHeight),
          weight: Number(aiWeight),
          fitnessGoal: aiGoal,
          consultationType: 'BMI'
        })
      });

      const data = await res.json();
      setIsConsulting(false);

      if (res.ok && data.consultation) {
        setConsultResult(data.consultation);
      } else {
        setConsultError(data.message || 'Lỗi phân tích từ AI. Vui lòng thử lại!');
      }
    } catch (err) {
      setIsConsulting(false);
      setConsultError('Không thể kết nối đến server!');
    }
  };

  // Đăng ký gói tập được đề xuất
  const handleRegisterRecommended = () => {
    const recommendedSport = consultResult?.recommended_sport || '';
    // Tìm gói tập phù hợp với môn thể thao được đề xuất
    const matchedPlan = plans.find(p => 
      p.sportType.toLowerCase().includes(recommendedSport.toLowerCase()) || 
      recommendedSport.toLowerCase().includes(p.sportType.toLowerCase())
    ) || plans[0];
    
    setShowAiModal(false);
    setConsultResult(null);
    setConsultError('');
    if (matchedPlan) {
      goToCheckout(matchedPlan.planId);
    } else {
      const targetElement = document.querySelector('#pricing');
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
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
          <h1 className="hero-title">{heroTitle || 'Bứt Phá Giới Hạn'}</h1>
          <p className="hero-subtitle">
            {heroSubtitle || 'Hệ thống quản lý phòng gym thông minh, tối ưu hóa quy trình tập luyện và trải nghiệm khách hàng đẳng cấp.'}
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
          {/* Gym Card */}
          <div 
            className="service-card reveal reveal-delay-1" 
            style={{ 
              backgroundImage: "url('/assets/images/gym.png')", 
              cursor: 'pointer',
              border: '1.5px solid rgba(249, 115, 22, 0.25)'
            }}
            onClick={() => {
              window.history.pushState({}, '', '/services/gym');
              window.dispatchEvent(new Event('popstate'));
            }}
          >
            <div className="service-overlay" style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.5) 60%, transparent 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '36px 28px', height: '100%' }}>
              <div className="service-icon" style={{ marginBottom: '8px' }}>
                <i className="fa-solid fa-dumbbell" style={{ color: 'var(--orange)', fontSize: '2rem' }}></i>
              </div>
              <h3 className="service-name" style={{ color: 'var(--white)' }}>Luyện Tập Gym</h3>
              <p className="service-desc" style={{ fontSize: '0.9rem', textAlign: 'center' }}>Hệ thống thiết bị hiện đại nhập khẩu, khu vực tạ tự do rộng rãi, phù hợp mọi mục tiêu tăng cơ giảm mỡ.</p>
              <button 
                className="btn-primary-nav" 
                style={{ 
                  marginTop: '12px', 
                  fontSize: '0.8rem', 
                  padding: '6px 16px', 
                  borderRadius: '20px',
                  boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
                  border: 'none',
                  background: 'var(--orange)'
                }}
              >
                Tìm hiểu ngay
              </button>
            </div>
          </div>

          {/* Yoga Card */}
          <div 
            className="service-card reveal reveal-delay-2" 
            style={{ 
              backgroundImage: "url('/assets/images/yoga.png')", 
              cursor: 'pointer',
              border: '1.5px solid rgba(249, 115, 22, 0.25)'
            }}
            onClick={() => {
              window.history.pushState({}, '', '/services/yoga');
              window.dispatchEvent(new Event('popstate'));
            }}
          >
            <div className="service-overlay" style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.5) 60%, transparent 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '36px 28px', height: '100%' }}>
              <div className="service-icon" style={{ marginBottom: '8px' }}>
                <i className="fa-solid fa-spa" style={{ color: 'var(--orange)', fontSize: '2rem' }}></i>
              </div>
              <h3 className="service-name" style={{ color: 'var(--white)' }}>Lớp Yoga & Thiền</h3>
              <p className="service-desc" style={{ fontSize: '0.9rem', textAlign: 'center' }}>Lớp học đa dạng từ cơ bản đến nâng cao, không gian yên tĩnh giúp cân bằng thân tâm trí.</p>
              <button 
                className="btn-primary-nav" 
                style={{ 
                  marginTop: '12px', 
                  fontSize: '0.8rem', 
                  padding: '6px 16px', 
                  borderRadius: '20px',
                  boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
                  border: 'none',
                  background: 'var(--orange)'
                }}
              >
                Tìm hiểu ngay
              </button>
            </div>
          </div>

          {/* AI Consultation Card */}
          <div 
            className="service-card reveal reveal-delay-3" 
            style={{ 
              backgroundImage: "url('/ai_consult_bg.png')",
              border: '1.5px solid rgba(249, 115, 22, 0.25)',
              cursor: 'pointer'
            }}
            onClick={() => setShowAiModal(true)}
          >
            <div className="service-overlay" style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.5) 60%, transparent 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '36px 28px', height: '100%' }}>
              <div className="service-icon" style={{ marginBottom: '8px' }}>
                <i className="fa-solid fa-robot" style={{ color: 'var(--orange)', fontSize: '2rem' }}></i>
              </div>
              <h3 className="service-name" style={{ color: 'var(--white)' }}>Tư vấn sức khỏe AI</h3>
              <p className="service-desc" style={{ fontSize: '0.9rem', textAlign: 'center' }}>Tính chỉ số BMI, phân tích thể trạng và nhận lộ trình tập luyện & dinh dưỡng cá nhân hóa miễn phí.</p>
              <button 
                className="btn-primary-nav" 
                style={{ 
                  marginTop: '12px', 
                  fontSize: '0.8rem', 
                  padding: '6px 16px', 
                  borderRadius: '20px',
                  boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
                  border: 'none',
                  background: 'var(--orange)'
                }}
              >
                Trải nghiệm ngay
              </button>
            </div>
          </div>
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

        {['VIP', 'Combo', 'Gym', 'Yoga'].map((sport) => {
          const sportPlans = plans
            .filter(p => p.sportType === sport && p.price >= 100000)
            .sort((a, b) => b.durationMonths - a.durationMonths); // Higher durations / Premium to the top
          if (sportPlans.length === 0) return null;
          
          const displayTitles = {
            Gym: 'Gói Tập Gym',
            Yoga: 'Gói Tập Yoga',
            Combo: 'Gói Tập Combo',
            VIP: 'Gói Tập VIP'
          };
          
          return (
            <div key={sport} style={{ marginBottom: '60px' }}>
              <h3 style={{ textAlign: 'center', marginBottom: '30px', fontFamily: 'Barlow Condensed', fontSize: '2rem', color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {displayTitles[sport] || sport}
              </h3>
              <div className={`pricing-grid grid-${sportPlans.length}`}>
                {sportPlans.map((plan, index) => {
                  const isFeatured = plan.durationMonths === 6;

                  // Determine package image variation (3, 6, 12)
                  const sportKey = (plan.sportType || 'Gym').toLowerCase();
                  let prefix = sportKey === 'combo' || sportKey === 'vip' ? 'vip' : sportKey;
                  let suffix = '6';
                  if (plan.durationMonths <= 3) {
                    suffix = '3';
                  } else if (plan.durationMonths >= 12) {
                    suffix = '12';
                  }

                  const bgImg = `/assets/images/${prefix}_package_${suffix}.png`;

                  return (
                    <div 
                      key={plan.planId} 
                      className={`pricing-card image-card reveal reveal-delay-${(index % 3) + 1} ${isFeatured ? 'featured' : ''}`}
                      style={{ backgroundImage: `url('${bgImg}')` }}
                    >
                      {/* DEFAULT BANNER FRONT VIEW */}
                      <div className="pricing-card-banner">
                        {isFeatured && <div className="popular-badge">Khuyên Dùng</div>}
                        <div className="banner-sport-icon">
                          <i className={plan.sportType === 'Yoga' ? 'fa-solid fa-spa' : 'fa-solid fa-dumbbell'}></i>
                        </div>
                        <p className="banner-plan-name">{plan.planName}</p>
                        <span className="banner-duration-badge">{plan.durationMonths} Tháng</span>
                      </div>

                       {/* HOVER CONTENT OVERLAY VIEW */}
                       <div className="pricing-card-content">
                         <p className={`plan-name ${isFeatured ? 'featured-name' : ''}`}>{plan.planName}</p>
                         <div className="plan-price">
                          <div className="price-amount" style={{ fontSize: '1.8rem' }}>
                            {plan.price.toLocaleString('vi-VN')}đ
                            <span className="price-period" style={{ fontSize: '0.85rem', color: '#64748b' }}>
                              /{plan.durationMonths} tháng
                            </span>
                          </div>
                          {plan.durationMonths > 1 && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--orange)', marginTop: '4px', fontWeight: 'bold' }}>
                              (~{Math.round(plan.price / plan.durationMonths).toLocaleString('vi-VN')}đ/tháng)
                            </div>
                          )}
                        </div>
                        <div className="plan-divider"></div>
                        <ul className="plan-features" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                          <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <i className="fas fa-check-circle" style={{ color: 'var(--orange)', marginTop: '4px' }}></i>
                            <span>Bộ môn: <strong>{plan.sportType === 'VIP' || plan.sportType === 'Combo' ? 'Gym & Yoga (VIP)' : plan.sportType}</strong></span>
                          </li>
                          {plan.description && plan.description.split('\n').map((line, lIdx) => {
                            if (!line.trim()) return null;
                            return (
                              <li key={lIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                <i className="fas fa-check-circle" style={{ color: 'var(--orange)', marginTop: '4px' }}></i>
                                <span>{line}</span>
                              </li>
                            );
                          })}
                        </ul>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                          <button
                            onClick={() => goToCheckout(plan.planId)}
                            className={`btn-plan ${isFeatured ? 'btn-featured' : ''}`}
                          >
                            Mua Ngay
                          </button>
                          {/* PT add-on: chỉ hiện cho gói Gym */}
                          {plan.sportType === 'Gym' && (
                            <button
                              onClick={() => {
                                window.history.pushState({}, '', `/checkout?plan=${plan.planId}&addPT=true`);
                                window.dispatchEvent(new Event('popstate'));
                              }}
                              className="btn-plan"
                              style={{
                                borderColor: 'var(--orange)',
                                color: 'var(--orange)',
                                background: 'rgba(249,115,22,0.07)',
                                fontSize: '0.82rem',
                              }}
                            >
                              <i className="fa-solid fa-dumbbell" style={{ marginRight: '6px', fontSize: '0.82rem' }}></i>
                              Mua Kèm PT Tập Kèm
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
          {services.filter(s => s.serviceName !== "Dịch vụ PT (Huấn luyện viên cá nhân)").sort((a,b) => {
            const isAPT = a.serviceName.includes('PT') ? -1 : 1;
            const isBPT = b.serviceName.includes('PT') ? -1 : 1;
            if (isAPT !== isBPT) return isAPT - isBPT;
            return a.price - b.price;
          }).map((srv, index) => (
            <div key={srv.serviceId} className={`pricing-card reveal reveal-delay-${(index % 3) + 1}`} style={{ display: 'flex', flexDirection: 'column', borderTop: `4px solid ${srv.serviceName.includes('PT') ? '#f59e0b' : '#3b82f6'}` }}>
              <p className="plan-name" style={{ color: srv.serviceName.includes('PT') ? '#f59e0b' : '#3b82f6', fontSize: '1.2rem' }}>{srv.serviceName}</p>
              <div className="plan-price" style={{ marginTop: '10px' }}>
                <div className="price-amount" style={{ fontSize: '1.6rem' }}>
                  {srv.price.toLocaleString('vi-VN')}đ
                </div>
              </div>
              <div className="plan-divider" style={{ margin: '15px 0' }}></div>
              <ul className="plan-features" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <i className="fas fa-check-circle" style={{ color: srv.serviceName.includes('PT') ? '#f59e0b' : '#3b82f6', marginTop: '4px' }}></i> 
                  <span>Phân loại: <strong>{srv.serviceName.includes('PT') ? 'Huấn Luyện Viên' : 'Tiện Ích'}</strong></span>
                </li>
                {srv.description && srv.description.split('\n').map((line, lIdx) => {
                  if (!line.trim()) return null;
                  return (
                    <li key={lIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <i className="fas fa-check-circle" style={{ color: srv.serviceName.includes('PT') ? '#f59e0b' : '#3b82f6', marginTop: '4px' }}></i>
                      <span>{line}</span>
                    </li>
                  );
                })}
              </ul>
              {srv.serviceName.includes('PT') ? (
                <button
                  onClick={() => {
                    window.history.pushState({}, '', '/pt-details');
                    window.dispatchEvent(new Event('popstate'));
                  }}
                  className="btn-plan"
                  style={{ marginTop: 'auto', borderColor: '#f59e0b', color: '#f59e0b' }}
                  onMouseEnter={(e) => { e.target.style.backgroundColor = '#f59e0b'; e.target.style.color = 'white'; }}
                  onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#f59e0b'; }}
                >
                  Xem Chi Tiết PT
                </button>
              ) : (
                <button
                  onClick={() => goToServiceCheckout(srv.serviceId)}
                  className="btn-plan"
                  style={{ marginTop: 'auto', borderColor: '#3b82f6', color: '#3b82f6' }}
                  onMouseEnter={(e) => { e.target.style.backgroundColor = '#3b82f6'; e.target.style.color = 'white'; }}
                  onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#3b82f6'; }}
                >
                  Mua Ngay
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

      {/* AI CONSULTATION MODAL OVERLAY */}
      {showAiModal && (
        <div className="ai-modal-overlay">
          <div className="ai-modal-card">
            <button className="ai-modal-close" onClick={() => { setShowAiModal(false); setConsultResult(null); setConsultError(''); }}>
              <i className="fa-solid fa-xmark"></i>
            </button>

            {!consultResult ? (
              <>
                <h2 className="ai-results-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <i className="fa-solid fa-robot"></i> Tư vấn sức khỏe AI
                </h2>
                <p className="setup-modal-subtitle" style={{ color: '#94a3b8' }}>
                  Nhập thông số cơ thể của bạn để AI tính toán BMI và gợi ý chế độ tập luyện, dinh dưỡng phù hợp nhất.
                </p>

                {consultError && (
                  <div className="setup-alert-error animate-fade-in" style={{ marginBottom: '20px' }}>
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{consultError}</span>
                  </div>
                )}

                <form onSubmit={handleAiConsultSubmit} className="setup-form">
                  <div className="setup-field">
                    <label style={{ color: '#94a3b8' }}>Họ và tên của bạn</label>
                    <input
                      type="text"
                      className="ai-input"
                      placeholder="Nguyễn Văn A"
                      value={aiName}
                      onChange={(e) => setAiName(e.target.value)}
                      required
                      disabled={isConsulting}
                    />
                  </div>

                  <div className="setup-form-row">
                    <div className="setup-field">
                      <label style={{ color: '#94a3b8' }}>Tuổi</label>
                      <input
                        type="number"
                        className="ai-input"
                        placeholder="22"
                        value={aiAge}
                        onChange={(e) => setAiAge(e.target.value)}
                        required
                        disabled={isConsulting}
                      />
                    </div>

                    <div className="setup-field">
                      <label style={{ color: '#94a3b8' }}>Giới tính</label>
                      <div className="setup-gender-buttons" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        {['Nam', 'Nữ', 'Khác'].map((g) => (
                          <button
                            key={g}
                            type="button"
                            className={`ai-gender-btn ${aiGender === g ? 'active' : ''}`}
                            onClick={() => setAiGender(g)}
                            disabled={isConsulting}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="setup-form-row">
                    <div className="setup-field">
                      <label style={{ color: '#94a3b8' }}>Chiều cao (cm)</label>
                      <input
                        type="number"
                        className="ai-input"
                        placeholder="170"
                        value={aiHeight}
                        onChange={(e) => setAiHeight(e.target.value)}
                        required
                        disabled={isConsulting}
                      />
                    </div>
                    <div className="setup-field">
                      <label style={{ color: '#94a3b8' }}>Cân nặng (kg)</label>
                      <input
                        type="number"
                        className="ai-input"
                        placeholder="65"
                        value={aiWeight}
                        onChange={(e) => setAiWeight(e.target.value)}
                        required
                        disabled={isConsulting}
                      />
                    </div>
                  </div>

                  <div className="setup-field">
                    <label style={{ color: '#94a3b8' }}>Mục tiêu tập luyện</label>
                    <select
                      className="ai-input"
                      value={aiGoal}
                      onChange={(e) => setAiGoal(e.target.value)}
                      disabled={isConsulting}
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="Giảm cân">Giảm cân</option>
                      <option value="Tăng cơ">Tăng cơ</option>
                      <option value="Cải thiện sức bền">Cải thiện sức bền</option>
                      <option value="Linh hoạt & Dẻo dai">Linh hoạt & Dẻo dai</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="setup-submit-btn"
                    style={{ background: 'linear-gradient(135deg, var(--orange) 0%, #ea580c 100%)', boxShadow: '0 4px 15px rgba(249,115,22,0.3)', border: 'none' }}
                    disabled={isConsulting}
                  >
                    {isConsulting ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> AI ĐANG PHÂN TÍCH...
                      </>
                    ) : (
                      'NHẬN ĐỀ XUẤT LỘ TRÌNH'
                    )}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 className="ai-results-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <i className="fa-solid fa-circle-check" style={{ color: '#10b981' }}></i> Kết quả phân tích AI
                </h2>

                <div className="ai-result-card">
                  <div className="ai-bmi-section">
                    <span className="ai-recommend-label" style={{ marginBottom: '8px' }}>Chỉ số BMI của bạn</span>
                    <span className="ai-bmi-score" style={{ color: 
                      Number(consultResult.bmi) < 18.5 ? '#3b82f6' :
                      Number(consultResult.bmi) < 25 ? '#10b981' :
                      Number(consultResult.bmi) < 30 ? '#f59e0b' : '#ef4444'
                    }}>
                      {consultResult.bmi}
                    </span>
                    <span className="ai-bmi-badge" style={{ 
                      backgroundColor: 
                        Number(consultResult.bmi) < 18.5 ? 'rgba(59, 130, 246, 0.2)' :
                        Number(consultResult.bmi) < 25 ? 'rgba(16, 185, 129, 0.2)' :
                        Number(consultResult.bmi) < 30 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color:
                        Number(consultResult.bmi) < 18.5 ? '#3b82f6' :
                        Number(consultResult.bmi) < 25 ? '#10b981' :
                        Number(consultResult.bmi) < 30 ? '#f59e0b' : '#ef4444'
                    }}>
                      {
                        Number(consultResult.bmi) < 18.5 ? 'Cân nặng thấp (Gầy)' :
                        Number(consultResult.bmi) < 25 ? 'Bình thường' :
                        Number(consultResult.bmi) < 30 ? 'Thừa cân' : 'Béo phì'
                      }
                    </span>
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <h4 style={{ color: 'var(--orange)', fontFamily: 'Barlow Condensed', fontSize: '1.2rem', marginBottom: '8px', textTransform: 'uppercase' }}>
                      <i className="fa-solid fa-notes-medical"></i> Nhận xét & lời khuyên từ AI
                    </h4>
                    <p className="ai-advice-text">{consultResult.recommendation_detail}</p>
                  </div>
                </div>

                <div className="ai-result-card" style={{ borderLeft: '4px solid var(--orange)' }}>
                  <h4 style={{ color: 'var(--orange)', fontFamily: 'Barlow Condensed', fontSize: '1.2rem', marginBottom: '12px', textTransform: 'uppercase' }}>
                    <i className="fa-solid fa-trophy"></i> Lộ trình & Gói tập đề xuất
                  </h4>
                  
                  <div className="ai-recommend-row">
                    <span className="ai-recommend-label">Bộ môn phù hợp</span>
                    <span className="ai-recommend-value" style={{ color: 'var(--orange)' }}>{consultResult.recommended_sport}</span>
                  </div>
                  
                  <div className="ai-recommend-row">
                    <span className="ai-recommend-label">Gói tập khuyên dùng</span>
                    <span className="ai-recommend-value">{consultResult.recommended_membership}</span>
                  </div>

                  <div className="ai-recommend-row" style={{ borderBottom: 'none' }}>
                    <span className="ai-recommend-label">Lịch tập đề xuất</span>
                    <span className="ai-recommend-value" style={{ fontStyle: 'italic' }}>{consultResult.recommended_schedule}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    onClick={() => { setConsultResult(null); setConsultError(''); }}
                    className="ai-gender-btn"
                    style={{ flex: 1, padding: '12px' }}
                  >
                    Tính lại
                  </button>
                  <button
                    onClick={handleRegisterRecommended}
                    className="setup-submit-btn"
                    style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, var(--orange) 0%, #ea580c 100%)', border: 'none' }}
                  >
                    Đăng ký gói đề xuất ngay
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

export default HomePage;
