import React, { useEffect } from 'react';
import './GymDetail.css';

function GymDetail() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleGoHome = (e) => {
    e.preventDefault();
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new Event('popstate'));
  };

  const handleChoosePlan = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new Event('popstate'));
    // Cho phép trang chủ load xong rồi scroll xuống pricing
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
        <span className="detail-header-logo">FX FITNESS / GYM</span>
      </header>

      {/* HERO SECTION */}
      <section className="gym-hero">
        <div className="gym-hero-overlay"></div>
        <div className="gym-hero-content">
          <div className="detail-tag">DỊCH VỤ TIÊU BIỂU</div>
          <h1 className="gym-title">BỘ MÔN GYM & CƠ THỂ HÌNH</h1>
          <p className="gym-subtitle">
            Khơi dậy sức mạnh tối đa trong bạn với hệ thống máy tập hiện đại nhập khẩu quốc tế và lộ trình bài bản.
          </p>
        </div>
      </section>

      {/* CONTENT WRAPPER */}
      <main className="detail-main-content">
        {/* WHAT IS GYM */}
        <section className="intro-section">
          <div className="intro-text">
            <h2>Tập Gym Là Gì?</h2>
            <p>
              Gym (viết tắt của Gymnastics) ban đầu có nghĩa là các hoạt động rèn luyện thể chất trong nhà. Ngày nay, 
              Gym được hiểu rộng rãi là bộ môn thể hình kết hợp giữa các bài tập tạ (Resistance Training), bài tập tim mạch 
              (Cardio) và chế độ dinh dưỡng lành mạnh nhằm tối ưu hóa lượng cơ bắp và lượng mỡ trong cơ thể.
            </p>
            <p>
              Tập Gym tại FX Fitness không chỉ là việc nâng tạ, mà là một quá trình khoa học giúp bạn hiểu rõ từng nhóm cơ, 
              tập luyện đúng kỹ thuật để xây dựng một thể hình cân đối, dẻo dai và tràn đầy sức sống.
            </p>
          </div>
          <div className="intro-card-visual">
            <div className="visual-icon-wrap">
              <i className="fas fa-dumbbell"></i>
            </div>
            <h3>Sức Mạnh Thể Chất</h3>
            <p>Rèn luyện bền bỉ mỗi ngày là chìa khóa mở khóa tiềm năng vô hạn của cơ thể.</p>
          </div>
        </section>

        {/* BENEFITS GRID */}
        <section className="benefits-section">
          <h2 className="section-title-center">Tập Gym Giúp Gì Cho Sức Khỏe Con Người?</h2>
          <p className="section-subtitle-center">Luyện tập đều đặn mang lại những biến chuyển tích cực cho cả thể chất lẫn tinh thần</p>

          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">
                <i className="fa-solid fa-child"></i>
              </div>
              <h3>Tăng Cường Cơ Bắp</h3>
              <p>
                Kích thích các sợi cơ phát triển thông qua bài tập kháng lực nặng, giúp cơ thể săn chắc, loại bỏ mỡ thừa tích tụ hiệu quả.
              </p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">
                <i className="fa-solid fa-heart-pulse"></i>
              </div>
              <h3>Bảo Vệ Tim Mạch</h3>
              <p>
                Cardio và các bài tập tạ đều giúp tăng cường lưu thông máu, ổn định huyết áp và giảm nguy cơ mắc các bệnh tim mạch hiểm nghèo.
              </p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">
                <i className="fa-solid fa-bone"></i>
              </div>
              <h3>Củng Cố Xương Khớp</h3>
              <p>
                Tăng mật độ xương thông qua các chuyển động chịu lực lực, giúp xương chắc khỏe và ngăn ngừa loãng xương khi về già.
              </p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">
                <i className="fa-solid fa-brain"></i>
              </div>
              <h3>Giải Tỏa Căng Thẳng</h3>
              <p>
                Tập luyện giải phóng hormone Endorphin - "liều thuốc hạnh phúc", giúp giảm stress, ngủ ngon hơn và cải thiện tâm trạng.
              </p>
            </div>
          </div>
        </section>

        {/* WHY FX FITNESS */}
        <section className="features-section">
          <h2>Tại Sao Nên Chọn Tập Gym Tại FX Fitness?</h2>
          <div className="features-list">
            <div className="feature-item">
              <span className="feature-number">01</span>
              <div>
                <h4>Thiết Bị Nhập Khẩu Đẳng Cấp</h4>
                <p>Hệ thống máy tập cơ lớn, tạ Dumbbell, máy chạy bộ đời mới từ các thương hiệu hàng đầu thế giới.</p>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-number">02</span>
              <div>
                <h4>Không Gian Rộng Rãi & Thông Thoáng</h4>
                <p>Diện tích phòng tập lớn, hệ thống điều hòa lọc khí liên tục giúp bạn luôn thoải mái trong suốt quá trình tập luyện.</p>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-number">03</span>
              <div>
                <h4>Máy Đo Chỉ Số InBody Miễn Phí</h4>
                <p>Hỗ trợ đo và phân tích lượng cơ, mỡ, nước trong cơ thể để bạn theo dõi sát sao tiến độ tập luyện của mình.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="detail-cta">
          <h2>BẮT ĐẦU THAY ĐỔI VÓC DÁNG NGAY HÔM NAY</h2>
          <p>Lựa chọn gói tập phù hợp với mục tiêu cá nhân và trải nghiệm dịch vụ chuẩn 5 sao tại FX Fitness.</p>
          <div className="cta-actions">
            <button onClick={handleChoosePlan} className="cta-btn-primary">
              MUA GÓI TẬP NGAY
            </button>
            <a href="/" onClick={handleGoHome} className="cta-btn-secondary">
              QUAY LẠI TRANG CHỦ
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
