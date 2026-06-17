import React, { useState, useEffect } from 'react';
import './PTDetailPage.css';

function PTDetailPage() {
  const [trainers, setTrainers] = useState([]);
  const [selectedPT, setSelectedPT] = useState(null);

  useEffect(() => {
    // Scroll to top when mounted
    window.scrollTo(0, 0);

    fetch('/api/checkout/trainers')
      .then(res => res.json())
      .then(data => {
        if (data.trainers && data.trainers.length > 0) {
          setTrainers(data.trainers);
          setSelectedPT(data.trainers[0]); // Select first PT by default
        }
      })
      .catch(err => console.error('Error fetching trainers:', err));
  }, []);

  const goHome = (e) => {
    e.preventDefault();
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new Event('popstate'));
  };

  if (trainers.length === 0) {
    return <div style={{ padding: '100px', textAlign: 'center' }}>Đang tải thông tin Huấn Luyện Viên...</div>;
  }

  return (
    <div className="pt-detail-container">
      {/* NAVBAR */}
      <nav className="navbar scrolled">
        <a href="/" onClick={goHome} className="nav-logo">
          <div className="nav-logo-mark">
            <span className="nav-logo-fx">FX</span>
            <span className="nav-logo-chevron">
              <i className="fas fa-chevron-right"></i>
            </span>
          </div>
          <span className="nav-logo-text">FX FITNESS</span>
        </a>
        <a href="/" onClick={goHome} className="btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
          Trở về Trang Chủ
        </a>
      </nav>

      {/* HEADER SECTION */}
      <header className="pt-header">
        <div className="pt-header-content">
          <h1>Đội Ngũ Huấn Luyện Viên</h1>
          <p>Lựa chọn người đồng hành để phá vỡ mọi giới hạn bản thân.</p>
        </div>
      </header>

      <div className="pt-content">
        {/* SIDEBAR - LIST OF PTs */}
        <aside className="pt-sidebar">
          <h3>Chọn Huấn Luyện Viên</h3>
          <ul className="pt-list">
            {trainers.map(pt => (
              <li 
                key={pt.userId} 
                className={selectedPT?.userId === pt.userId ? 'active' : ''}
                onClick={() => setSelectedPT(pt)}
              >
                <div className="pt-list-avatar">
                  {pt.avatarUrl ? (
                    <img src={pt.avatarUrl} alt={pt.fullName} />
                  ) : (
                    <i className="fa-solid fa-user"></i>
                  )}
                </div>
                <div className="pt-list-info">
                  <h4>{pt.fullName}</h4>
                  <span>{pt.specialization}</span>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        {/* MAIN DETAIL SECTION */}
        {selectedPT && (
          <main className="pt-main">
            <div className="pt-profile-card">
              <div className="pt-profile-header">
                <div className="pt-profile-avatar-large">
                  {selectedPT.avatarUrl ? (
                    <img src={selectedPT.avatarUrl} alt={selectedPT.fullName} />
                  ) : (
                    <i className="fa-solid fa-user"></i>
                  )}
                </div>
                <div className="pt-profile-title">
                  <h2>{selectedPT.fullName}</h2>
                  <div className="pt-rating">
                    <i className="fa-solid fa-star"></i> {selectedPT.rating} / 5.0
                  </div>
                  <p className="pt-spec">{selectedPT.specialization}</p>
                  <p className="pt-exp"><i className="fa-solid fa-briefcase"></i> {selectedPT.experienceYears} năm kinh nghiệm</p>
                </div>
              </div>
              
              <div className="pt-bio">
                <h3>Giới thiệu</h3>
                <p>{selectedPT.bio || 'Huấn luyện viên chuyên nghiệp với nhiều năm kinh nghiệm trong lĩnh vực thể hình, giúp hàng trăm học viên đạt được thân hình mơ ước.'}</p>
              </div>

              {/* CERTIFICATES */}
              <div className="pt-certificates">
                <h3><i className="fa-solid fa-certificate" style={{color: 'var(--orange)'}}></i> Bằng cấp & Chứng chỉ</h3>
                <ul>
                  <li><i className="fa-solid fa-check"></i> Chứng chỉ NASM Certified Personal Trainer</li>
                  <li><i className="fa-solid fa-check"></i> Chuyên gia Dinh dưỡng Thể thao (ISSA)</li>
                  <li><i className="fa-solid fa-check"></i> Sơ cấp cứu y tế CPR/AED</li>
                </ul>
              </div>

              {/* SCHEDULE */}
              <div className="pt-schedule">
                <h3><i className="fa-solid fa-calendar-alt" style={{color: '#3b82f6'}}></i> Lịch làm việc</h3>
                <div className="schedule-grid">
                  <div className="schedule-item">Thứ 2 - Thứ 6 <br/><span>06:00 - 14:00</span></div>
                  <div className="schedule-item">Thứ 7 - CN <br/><span>08:00 - 18:00</span></div>
                </div>
                <p style={{fontSize: '0.85rem', color: '#64748b', marginTop: '10px'}}>
                  *Lịch có thể điều chỉnh tùy theo gói đăng ký.
                </p>
              </div>
            </div>

            {/* BEFORE AND AFTER SECTION */}
            <div className="pt-transformations">
              <h3 className="transform-title">Học Viên Tiêu Biểu (Before & After)</h3>
              <p className="transform-desc">Kết quả thực tế từ những học viên đã đồng hành cùng {selectedPT.fullName}.</p>
              
              <div className="transform-grid">
                <div className="transform-card">
                  <img src="/assets/images/pt_ba_1.png" alt="Before and After 1" />
                  <div className="transform-info">
                    <h4>Anh Tuấn - Giảm 12kg mỡ thừa</h4>
                    <p>Thời gian: 4 tháng</p>
                  </div>
                </div>
                <div className="transform-card">
                  <img src="/assets/images/pt_ba_2.png" alt="Before and After 2" />
                  <div className="transform-info">
                    <h4>Chị Lan - Độ dáng chuẩn fitness</h4>
                    <p>Thời gian: 6 tháng</p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <button 
                className="btn-hire-pt"
                onClick={(e) => {
                  e.preventDefault();
                  localStorage.setItem('checkoutPT', selectedPT.userId);
                  window.history.pushState({}, '', '/checkout');
                  window.dispatchEvent(new Event('popstate'));
                }}
              >
                Đăng ký tập cùng {selectedPT.fullName}
              </button>
            </div>
          </main>
        )}
      </div>

      {/* FOOTER */}
      <footer className="footer" style={{ marginTop: 'auto' }}>
        <div className="footer-logo">
          <span className="footer-logo-text">Fx Fitness</span>
          <span className="footer-copy">© 2026 Fx Fitness Center.</span>
        </div>
      </footer>
    </div>
  );
}

export default PTDetailPage;
