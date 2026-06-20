import React, { useEffect } from 'react';
import './PtDetail.css';

function PtDetail() {
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
    <div className="pt-detail-container">
      {/* HEADER NAVBAR */}
      <header className="detail-header">
        <a href="/" onClick={handleGoHome} className="detail-back-btn">
          <i className="fa-solid fa-arrow-left"></i> QUAY LẠI TRANG CHỦ
        </a>
        <span className="detail-header-logo">FX FITNESS / PT CÁ NHÂN</span>
      </header>

      {/* HERO SECTION */}
      <section className="pt-hero">
        <div className="pt-hero-overlay"></div>
        <div className="pt-hero-content">
          <div className="detail-tag" style={{ background: '#eab308', color: '#000' }}>CHUYÊN NGHIỆP & HIỆU QUẢ</div>
          <h1 className="pt-title">HUẤN LUYỆN VIÊN CÁ NHÂN</h1>
          <p className="pt-subtitle">
            Đồng hành 1-kèm-1 cùng chuyên gia thể hình hàng đầu. Thiết kế lộ trình riêng biệt để bứt phá mục tiêu nhanh nhất và an toàn nhất.
          </p>
        </div>
      </section>

      {/* CONTENT WRAPPER */}
      <main className="detail-main-content">
        {/* WHAT IS PT */}
        <section className="intro-section">
          <div className="intro-text">
            <h2>PT Cá Nhân (Personal Trainer) Là Gì?</h2>
            <p>
              PT cá nhân là huấn luyện viên thể hình chuyên nghiệp đồng hành trực tiếp cùng bạn trong suốt quá trình tập luyện. 
              Nhiệm vụ của PT không chỉ là đứng bên cạnh hô nhịp, mà là đo đạc chỉ số cơ thể, xây dựng giáo án tập luyện 
              riêng biệt, tư vấn thực đơn dinh dưỡng cá nhân hóa và điều chỉnh kỹ thuật chuyển động chuẩn xác nhất.
            </p>
            <p>
              Tại FX Fitness, đội ngũ PT là những huấn luyện viên được đào tạo chuyên sâu về giải phẫu học cơ thể, 
              khoa học dinh dưỡng và y học thể thao, sẵn sàng cam kết chất lượng đầu ra cho hành trình thay đổi vóc dáng của bạn.
            </p>
          </div>
          <div className="intro-card-visual" style={{ border: '1px solid rgba(234, 179, 8, 0.2)' }}>
            <div className="visual-icon-wrap" style={{ background: 'rgba(234, 179, 8, 0.15)', borderColor: '#eab308' }}>
              <i className="fas fa-user-tie" style={{ color: '#eab308' }}></i>
            </div>
            <h3 style={{ color: '#eab308' }}>Lộ Trình Tối Ưu</h3>
            <p>Sự hướng dẫn chuẩn xác của chuyên gia giúp bạn đi đúng hướng và tránh chấn thương.</p>
          </div>
        </section>

        {/* BENEFITS GRID */}
        <section className="benefits-section">
          <h2 className="section-title-center">Tập Cùng PT Giúp Gì Cho Con Người?</h2>
          <p className="section-subtitle-center">Lý do vì sao tập cùng huấn luyện viên cá nhân đem lại hiệu quả vượt trội gấp 3 lần</p>

          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon" style={{ background: 'rgba(234, 179, 8, 0.08)', color: '#eab308' }}>
                <i className="fa-solid fa-clipboard-list"></i>
              </div>
              <h3>Giáo Án Cá Nhân Hóa</h3>
              <p>
                Không dùng chung một bài tập cho tất cả. PT thiết kế riêng dựa trên thể trạng, bệnh lý xương khớp và mục tiêu của riêng bạn.
              </p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon" style={{ background: 'rgba(234, 179, 8, 0.08)', color: '#eab308' }}>
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <h3>An Toàn Tuyệt Đối</h3>
              <p>
                Được giám sát và căn chỉnh góc độ xương khớp khi nâng tạ nặng, giảm thiểu tối đa các chấn thương không đáng có.
              </p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon" style={{ background: 'rgba(234, 179, 8, 0.08)', color: '#eab308' }}>
                <i className="fa-solid fa-utensils"></i>
              </div>
              <h3>Thiết Kế Thực Đơn Dinh Dưỡng</h3>
              <p>
                PT tính toán chi tiết chỉ số calo nạp/xả (TDEE/BMR), lên thực đơn ăn uống hàng ngày phù hợp với sở thích và công việc của bạn.
              </p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon" style={{ background: 'rgba(234, 179, 8, 0.08)', color: '#eab308' }}>
                <i className="fa-solid fa-fire"></i>
              </div>
              <h3>Động Lực Vượt Giới Hạn</h3>
              <p>
                Luôn có người sát cánh thúc đẩy, cổ vũ tinh thần khi mệt mỏi, giúp bạn duy trì kỷ luật thép để về đích thành công.
              </p>
            </div>
          </div>
        </section>

        {/* WHY FX FITNESS */}
        <section className="features-section">
          <h2>Tại Sao Nên Chọn Đội Ngũ PT Tại FX Fitness?</h2>
          <div className="features-list">
            <div className="feature-item">
              <span className="feature-number" style={{ color: 'rgba(234, 179, 8, 0.25)' }}>01</span>
              <div>
                <h4>Đội Ngũ HLV Có Bằng Cấp Quốc Tế</h4>
                <p>PT tại FX Fitness sở hữu các chứng chỉ danh giá như NASM, ACE hay các bằng cử nhân Thể Dục Thể Thao uy tín.</p>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-number" style={{ color: 'rgba(234, 179, 8, 0.25)' }}>02</span>
              <div>
                <h4>Đánh Giá Thể Chất Định Kỳ</h4>
                <p>Hàng tuần học viên được đo Inbody, chụp ảnh theo dõi sự thay đổi của cơ thể để linh hoạt điều chỉnh bài tập.</p>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-number" style={{ color: 'rgba(234, 179, 8, 0.25)' }}>03</span>
              <div>
                <h4>Cam Kết Đầu Ra Bằng Văn Bản</h4>
                <p>Chúng tôi tự tin khẳng định hiệu quả thay đổi vóc dáng rõ rệt nếu học viên tuân thủ đúng giáo án đề ra.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="detail-cta" style={{ borderColor: '#eab308' }}>
          <h2>BẮT ĐẦU LỘ TRÌNH 1-KÈM-1 ĐẲNG CẤP</h2>
          <p>Đăng ký nhận ngay 1 buổi tập thử và kiểm tra tư thế vận động miễn phí cùng Huấn Luyện Viên Cá Nhân.</p>
          <div className="cta-actions">
            <button onClick={handleChoosePlan} className="cta-btn-primary" style={{ background: '#eab308', color: '#000', fontWeight: '800', boxShadow: '0 8px 24px rgba(234, 179, 8, 0.3)' }} onMouseOver={(e) => e.target.style.background = '#ca8a04'} onMouseOut={(e) => { e.target.style.background = '#eab308'; e.target.style.color = '#000'; }}>
              MUA GÓI TẬP CÓ PT
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

export default PtDetail;
