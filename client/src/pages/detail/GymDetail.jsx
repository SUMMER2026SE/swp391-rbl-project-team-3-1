import React, { useEffect } from 'react';
import './GymDetail.css';

function GymDetail() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleGoHome = (e) => {
    if (e) e.preventDefault();
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new Event('popstate'));
  };

  const handleChoosePlan = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new Event('popstate'));
    setTimeout(() => {
      const el = document.getElementById('pricing');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  };

  return (
    <div className="gym-detail-container">
      {/* HEADER NAVBAR */}
      <header className="detail-header">
        <a href="/" onClick={handleGoHome} className="detail-back-btn">
          <i className="fa-solid fa-arrow-left"></i> QUAY LẠI TRANG CHỦ
        </a>
        <span className="detail-header-logo">FX FITNESS / GYM SERVICE</span>
      </header>

      {/* BREADCRUMB */}
      <div className="detail-breadcrumb">
        <a href="/" onClick={handleGoHome}>Trang chủ</a>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Dịch vụ Gym</span>
      </div>

      {/* HERO BANNER SECTION */}
      <section className="gym-hero">
        <div className="gym-hero-overlay"></div>
        <div className="gym-hero-content">
          <div className="detail-tag">KHU VỰC TẬP GYM CHUYÊN NGHIỆP</div>
          <h1 className="gym-title">BỘ MÔN GYM &amp; HÌNH THỂ</h1>
          <p className="gym-subtitle">
            Khơi dậy nguồn năng lượng và sức mạnh tối đa của cơ thể với trang thiết bị chuẩn quốc tế.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="detail-main-content">

        {/* INTRO + STATS */}
        <section className="intro-stats-section">
          <div className="intro-text-block">
            <h2>Giới thiệu Không gian Gym</h2>
            <p>
              Khu vực tập Gym tại FX Fitness Center được thiết kế rộng rãi, thoáng đãng với hệ thống
              lưu thông khí tươi liên tục. Chúng tôi cam kết mang lại không gian tập luyện lý tưởng,
              sạch sẽ và an toàn nhất cho tất cả hội viên từ người mới bắt đầu đến vận động viên chuyên nghiệp.
            </p>
            <p>
              Tập Gym khoa học với lộ trình kháng lực phù hợp giúp tăng cơ nạc, đốt mỡ thừa, cải thiện tư thế
              và tăng sức mạnh cốt lõi cho cơ thể.
            </p>
          </div>
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-num">40+</span>
              <span className="stat-label">Thiết bị hiện đại</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-num">500m²</span>
              <span className="stat-label">Diện tích tập luyện</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-num">5h–20h</span>
              <span className="stat-label">Giờ mở cửa hàng ngày</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-num">15+</span>
              <span className="stat-label">PT chuyên nghiệp</span>
            </div>
          </div>
        </section>

        {/* PHOTO GALLERY */}
        <section className="gallery-section">
          <h3 className="sub-section-title">Hình ảnh thực tế phòng tập</h3>
          <div className="gallery-grid">
            <div className="gallery-item">
              <img
                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=700&q=80"
                alt="Sàn tập Gym rộng rãi"
              />
              <div className="gallery-caption">Sàn tập rộng rãi chuẩn 5 sao</div>
            </div>
            <div className="gallery-item">
              <img
                src="https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=700&q=80"
                alt="Khu Cardio hiện đại"
              />
              <div className="gallery-caption">Khu Cardio hiện đại view thành phố</div>
            </div>
            <div className="gallery-item">
              <img
                src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=700&q=80"
                alt="Khu tạ tự do"
              />
              <div className="gallery-caption">Khu tạ tự do phong phú</div>
            </div>
          </div>
        </section>

        {/* EQUIPMENT SECTION */}
        <section className="equipment-details-section">
          <h2>Hệ thống trang thiết bị đẳng cấp</h2>
          <p className="section-desc">Hơn 40 thiết bị nhập khẩu hiện đại, tối ưu cho mọi nhóm cơ trên cơ thể.</p>

          <div className="equipment-grid">
            <div className="equipment-card">
              <div className="eq-icon">
                <i className="fa-solid fa-dumbbell"></i>
              </div>
              <h3>Free Weights</h3>
              <ul>
                <li>3 bộ tạ tay đầy đủ trọng lượng</li>
                <li>Dàn tạ Olympic tiêu chuẩn</li>
                <li>Băng ghế tập đa năng điều chỉnh độ dốc</li>
              </ul>
            </div>

            <div className="equipment-card">
              <div className="eq-icon">
                <i className="fa-solid fa-heart-pulse"></i>
              </div>
              <h3>Cardio Zone</h3>
              <ul>
                <li>Treadmill – máy chạy bộ thông minh</li>
                <li>StairMaster – máy leo cầu thang giảm mỡ</li>
                <li>Exercise Bike – xe đạp tập tĩnh lực</li>
              </ul>
            </div>

            <div className="equipment-card">
              <div className="eq-icon">
                <i className="fa-solid fa-sliders"></i>
              </div>
              <h3>Tiện ích &amp; Không gian</h3>
              <ul>
                <li>Máy khối Selectorized chuyên nghiệp</li>
                <li>Khu giãn cơ trải thảm êm ái</li>
                <li>Không gian rộng rãi, thông thoáng tự nhiên</li>
              </ul>
            </div>
          </div>
        </section>



        {/* BENEFITS */}
        <section className="benefits-section">
          <h2 className="section-title-center">Lợi ích tuyệt vời khi tập Gym</h2>
          <div className="benefits-grid-custom">
            <div className="benefit-item">
              <div className="benefit-icon-wrap">
                <i className="fa-solid fa-fire"></i>
              </div>
              <h4>Tăng Cường Cơ Bắp</h4>
              <p>Kích thích phát triển các nhóm cơ lớn giúp cơ thể săn chắc, khỏe mạnh và bền bỉ.</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon-wrap">
                <i className="fa-solid fa-bolt"></i>
              </div>
              <h4>Đốt Cháy Mỡ Thừa</h4>
              <p>Tập luyện tiêu hao calo lớn, hỗ trợ giảm cân an toàn và giữ vóc dáng cân đối.</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon-wrap">
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <h4>Bảo Vệ Xương Khớp</h4>
              <p>Tập tạ đúng cách tăng mật độ xương và hỗ trợ khớp hoạt động linh hoạt lâu dài.</p>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="detail-cta">
          <h2>BẮT ĐẦU HÀNH TRÌNH THAY ĐỔI NGAY HÔM NAY</h2>
          <p>Lựa chọn gói tập phù hợp và bắt đầu tập luyện cùng FX Fitness Center.</p>
          <div className="cta-actions">
            <button onClick={handleChoosePlan} className="cta-btn-primary">
              Đăng ký tập ngay
            </button>
            <a href="/" onClick={handleGoHome} className="cta-btn-secondary">
              Quay lại Trang chủ
            </a>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="detail-footer">
        <span>© 2026 FX Fitness Center. Đánh thức sức mạnh tiềm ẩn.</span>
      </footer>
    </div>
  );
}

export default GymDetail;
