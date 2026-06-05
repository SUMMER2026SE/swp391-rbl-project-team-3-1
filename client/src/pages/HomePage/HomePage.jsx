import React, { useState, useEffect } from 'react';
import './HomePage.css';

function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userInfo, setUserInfo] = useState(JSON.parse(localStorage.getItem('userInfo') || 'null'));

  useEffect(() => {
    const handleAuthChange = () => {
      setToken(localStorage.getItem('token') || '');
      setUserInfo(JSON.parse(localStorage.getItem('userInfo') || 'null'));
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
                499.000đ<span className="price-period">/tháng</span>
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
                1.299.000đ<span className="price-period">/3 tháng</span>
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
                3.999.000đ<span className="price-period">/năm</span>
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
    </div>
  );
}

export default HomePage;
