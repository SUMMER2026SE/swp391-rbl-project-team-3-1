import React, { useEffect } from 'react';
import './YogaDetail.css';

function YogaDetail() {
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
    setTimeout(() => {
      const el = document.getElementById('pricing');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  };

  return (
    <div className="yoga-detail-container">
      {/* HEADER NAVBAR */}
      <header className="detail-header">
        <a href="/" onClick={handleGoHome} className="detail-back-btn">
          <i className="fa-solid fa-arrow-left"></i> QUAY LẠI TRANG CHỦ
        </a>
        <span className="detail-header-logo">FX FITNESS / YOGA</span>
      </header>

      {/* HERO SECTION */}
      <section className="yoga-hero">
        <div className="yoga-hero-overlay"></div>
        <div className="yoga-hero-content">
          <div className="detail-tag" style={{ background: '#10b981' }}>TĨNH LẶNG & PHỤC HỒI</div>
          <h1 className="yoga-title">BỘ MÔN YOGA & TÂM TRÍ</h1>
          <p className="yoga-subtitle">
            Cân bằng thân - tâm - trí, tìm lại sự an yên trong tâm hồn và khôi phục sự linh hoạt tối đa cho cơ thể của bạn.
          </p>
        </div>
      </section>

      {/* CONTENT WRAPPER */}
      <main className="detail-main-content">
        {/* WHAT IS YOGA */}
        <section className="intro-section">
          <div className="intro-text">
            <h2>Yoga Là Gì?</h2>
            <p>
              Yoga là một phương pháp luyện tập lâu đời có nguồn gốc từ Ấn Độ cổ đại, kết hợp hài hòa giữa tư thế 
              (Asana), kỹ thuật thở (Pranayama) và thiền định (Dhyana). Đây không chỉ đơn thuần là các bài tập uốn dẻo 
              mà là một triết lý sống giúp con người hòa quyện thể chất và tinh thần làm một.
            </p>
            <p>
              Tại các lớp học Yoga của FX Fitness, bạn sẽ được hướng dẫn tỉ mỉ từ những bài tập thở cơ bản, cách kiểm soát 
              chuyển động của khớp xương đến những chuỗi tư thế nâng cao thử thách trọng lực, giúp giải phóng hoàn toàn 
              năng lượng tiêu cực tích tụ lâu ngày.
            </p>
          </div>
          <div className="intro-card-visual" style={{ border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div className="visual-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981' }}>
              <i className="fas fa-person-praying" style={{ color: '#10b981' }}></i>
            </div>
            <h3 style={{ color: '#10b981' }}>Sự Bình Yên Nội Tâm</h3>
            <p>Hơi thở sâu và tư thế chuẩn xác là chìa khóa thấu hiểu tiếng nói cơ thể.</p>
          </div>
        </section>

        {/* BENEFITS GRID */}
        <section className="benefits-section">
          <h2 className="section-title-center">Yoga Mang Lại Những Lợi Ích Gì Cho Con Người?</h2>
          <p className="section-subtitle-center">Khám phá sức mạnh của việc kết nối nhịp thở với từng chuyển động dẻo dai</p>

          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
                <i className="fa-solid fa-arrows-up-down-left-right"></i>
              </div>
              <h3>Tăng Độ Linh Hoạt</h3>
              <p>
                Kéo giãn sâu các bó cơ và dây chằng bị căng cứng do thói quen ngồi nhiều, gia tăng biên độ vận động cho toàn cơ thể.
              </p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
                <i className="fa-solid fa-face-smile"></i>
              </div>
              <h3>Giải Tỏa Căng Thẳng</h3>
              <p>
                Hạ thấp nồng độ hormone Cortisol (gây stress), đưa hệ thần kinh về trạng thái thư giãn sâu, làm dịu tâm trí lo âu.
              </p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
                <i className="fa-solid fa-accessibility"></i>
              </div>
              <h3>Cải Thiện Tư Thế</h3>
              <p>
                Định hình lại cột sống, sửa các tật lệch vai, gù lưng, giúp vóc dáng thon gọn, bước đi thanh thoát và tự tin hơn.
              </p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
                <i className="fa-solid fa-lungs"></i>
              </div>
              <h3>Tăng Dung Tích Phổi</h3>
              <p>
                Kỹ thuật thở Pranayama giúp trao đổi oxy tối đa, thanh lọc buồng phổi và tăng cường chức năng hệ hô hấp.
              </p>
            </div>
          </div>
        </section>

        {/* WHY FX FITNESS */}
        <section className="features-section">
          <h2>Tại Sao Nên Chọn Tập Yoga Tại FX Fitness?</h2>
          <div className="features-list">
            <div className="feature-item">
              <span className="feature-number" style={{ color: 'rgba(16, 185, 129, 0.25)' }}>01</span>
              <div>
                <h4>Giáo Viên Chuẩn Ấn Độ & Việt Nam</h4>
                <p>Đội ngũ Master có chứng chỉ quốc tế Yoga Alliance, giàu kinh nghiệm sư phạm và thấu hiểu học viên.</p>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-number" style={{ color: 'rgba(16, 185, 129, 0.25)' }}>02</span>
              <div>
                <h4>Phòng Tập Yên Tĩnh & Chuẩn Zen</h4>
                <p>Không gian cách âm tuyệt đối với tiếng nhạc thiền du dương và hương thơm thảo mộc tự nhiên dịu nhẹ.</p>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-number" style={{ color: 'rgba(16, 185, 129, 0.25)' }}>03</span>
              <div>
                <h4>Đa Dạng Loại Hình Lớp Học</h4>
                <p>Từ Hatha Yoga, Vinyasa Yoga, Yin Yoga đến các lớp trị liệu chuyên biệt cột sống, đau vai gáy.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="detail-cta" style={{ borderColor: '#10b981' }}>
          <h2>KHÁM PHÁ SỰ TĨNH LẶNG TRONG TÂM HỒN</h2>
          <p>Tham gia các lớp Yoga đa dạng tại FX Fitness để tái tạo năng lượng tích cực cho cuộc sống.</p>
          <div className="cta-actions">
            <button onClick={handleChoosePlan} className="cta-btn-primary" style={{ background: '#10b981', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)' }} onMouseOver={(e) => e.target.style.background = '#059669'} onMouseOut={(e) => e.target.style.background = '#10b981'}>
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

export default YogaDetail;
