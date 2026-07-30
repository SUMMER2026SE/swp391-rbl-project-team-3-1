import React, { useEffect } from 'react';
import './YogaDetail.css';

function YogaDetail() {
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
    <div className="yoga-detail-container">
      {/* HEADER NAVBAR */}
      <header className="detail-header">
        <a href="/" onClick={handleGoHome} className="detail-back-btn">
          <i className="fa-solid fa-arrow-left"></i> QUAY LẠI TRANG CHỦ
        </a>
        <span className="detail-header-logo">FX FITNESS / YOGA SERVICE</span>
      </header>

      {/* BREADCRUMB */}
      <div className="detail-breadcrumb">
        <a href="/" onClick={handleGoHome}>Trang chủ</a>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Dịch vụ Yoga</span>
      </div>

      {/* HERO BANNER SECTION */}
      <section className="yoga-hero">
        <div className="yoga-hero-overlay"></div>
        <div className="yoga-hero-content">
          <div className="detail-tag">PHÒNG TẬP YOGA CHUẨN QUỐC TẾ</div>
          <h1 className="yoga-title">BỘ MÔN YOGA &amp; TÂM TRÍ</h1>
          <p className="yoga-subtitle">
            Cân bằng thân – tâm – trí, tìm lại sự an yên trong tâm hồn và khôi phục sự linh hoạt tối đa cho cơ thể.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="detail-main-content">

        {/* INTRO + STATS */}
        <section className="intro-stats-section">
          <div className="intro-text-block">
            <h2>Giới thiệu Phòng Yoga</h2>
            <p>
              Lớp Yoga tại FX Fitness đem đến không gian thiền định yên tĩnh biệt lập, tránh xa ồn ào đô thị.
              Các bài tập thở, chuyển động khớp và chuỗi tư thế Asana được thiết kế tinh tế giúp thư giãn hệ cơ xương,
              tăng tuần hoàn máu và đào thải độc tố cơ thể.
            </p>
            <p>
              Dưới sự dẫn dắt của các giáo viên dày dặn kinh nghiệm với chứng chỉ quốc tế RYT 200/500,
              bạn sẽ dễ dàng làm quen với Yoga từ những bước đầu tiên.
            </p>
          </div>
          <div className="stats-bar yoga-stats">
            <div className="stat-item">
              <span className="stat-num">12+</span>
              <span className="stat-label">Lớp học mỗi tuần</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-num">200m²</span>
              <span className="stat-label">Phòng tập rộng rãi</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-num">RYT 500</span>
              <span className="stat-label">Chứng chỉ quốc tế</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-num">100%</span>
              <span className="stat-label">HLV chất lượng cao</span>
            </div>
          </div>
        </section>

        {/* GALLERY SECTION */}
        <section className="gallery-section">
          <h3 className="sub-section-title">Hình ảnh lớp học Yoga</h3>
          <div className="gallery-grid">
            <div className="gallery-item">
              <img
                src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=700&q=80"
                alt="Lớp học Yoga"
              />
              <div className="gallery-caption">Tập luyện cùng giáo viên chuyên nghiệp</div>
            </div>
            <div className="gallery-item">
              <img
                src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=700&q=80"
                alt="Không gian thiền định"
              />
              <div className="gallery-caption">Không gian thiền định yên tĩnh</div>
            </div>
            <div className="gallery-item">
              <img
                src="https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&w=700&q=80"
                alt="Trang bị Yoga"
              />
              <div className="gallery-caption">Thảm tập và phụ kiện đầy đủ</div>
            </div>
          </div>
        </section>

        {/* EQUIPMENT / FACILITIES */}
        <section className="equipment-details-section">
          <h2>Dụng cụ &amp; Không gian tiêu chuẩn</h2>
          <p className="section-desc">Chúng tôi trang bị mọi phụ kiện cần thiết giúp bạn tối ưu hóa từng động tác uốn dẻo.</p>

          <div className="equipment-grid">
            <div className="equipment-card yoga-card">
              <div className="eq-icon yoga-icon">
                <i className="fa-solid fa-spa"></i>
              </div>
              <h3>Dụng cụ tập luyện</h3>
              <ul>
                <li>Thảm tập 4 lớp cao cấp chống trơn trượt</li>
                <li>Khử khuẩn thảm 100% sau mỗi buổi học</li>
                <li>Khăn lau mồ hôi kháng khuẩn cá nhân</li>
              </ul>
            </div>

            <div className="equipment-card yoga-card">
              <div className="eq-icon yoga-icon">
                <i className="fa-solid fa-toolbox"></i>
              </div>
              <h3>Phụ kiện hỗ trợ</h3>
              <ul>
                <li>Yoga Block – gạch xốp hỗ trợ tư thế khó</li>
                <li>Yoga Ring – vòng mở vai, giãn lưng</li>
                <li>Resistance Band – dây kháng lực tăng dẻo dai</li>
              </ul>
            </div>

            <div className="equipment-card yoga-card">
              <div className="eq-icon yoga-icon">
                <i className="fa-solid fa-wind"></i>
              </div>
              <h3>Không gian &amp; Ánh sáng</h3>
              <ul>
                <li>Gương 3 chiều toàn cảnh tự sửa dáng</li>
                <li>Ánh sáng tự nhiên nhẹ nhàng, thoáng mát</li>
                <li>Không gian yên tĩnh biệt lập hoàn toàn</li>
              </ul>
            </div>
          </div>
        </section>

        {/* INSTRUCTORS */}
        <section className="instructors-section">
          <h2>Đội ngũ Huấn luyện viên Yoga</h2>
          <div className="instructor-highlight">
            <div className="instructor-icon">
              <i className="fa-solid fa-user-graduate"></i>
            </div>
            <div className="instructor-info">
              <h4>100% Giáo viên Yoga chất lượng cao</h4>
              <p>
                Tất cả HLV đứng lớp tại FX Fitness đều có trên 2 năm kinh nghiệm thực tế,
                sở hữu chứng chỉ quốc tế uy tín (Yoga Alliance RYT 200/500), nhiệt tình và tận tâm
                chỉnh sửa từng tư thế cho học viên.
              </p>
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="benefits-section yoga-benefits">
          <h2 className="section-title-center">Lợi ích vượt trội từ Yoga</h2>
          <div className="benefits-grid-custom">
            <div className="benefit-item yoga-benefit-item">
              <div className="benefit-icon-wrap yoga-icon-wrap">
                <i className="fa-solid fa-person-running"></i>
              </div>
              <h4>Tăng Độ Linh Hoạt</h4>
              <p>Kéo giãn tối đa các nhóm cơ bị bó cứng do thói quen ngồi nhiều của dân văn phòng.</p>
            </div>
            <div className="benefit-item yoga-benefit-item">
              <div className="benefit-icon-wrap yoga-icon-wrap">
                <i className="fa-solid fa-brain"></i>
              </div>
              <h4>Giải Tỏa Căng Thẳng</h4>
              <p>Hơi thở sâu làm dịu hệ thần kinh, giảm stress và cải thiện chất lượng giấc ngủ.</p>
            </div>
            <div className="benefit-item yoga-benefit-item">
              <div className="benefit-icon-wrap yoga-icon-wrap">
                <i className="fa-solid fa-leaf"></i>
              </div>
              <h4>Cải Thiện Tư Thế</h4>
              <p>Chỉnh sửa cột sống, mở vai và giảm đau mỏi lưng cổ vai gáy một cách rõ rệt.</p>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="detail-cta yoga-cta">
          <h2>TRẢI NGHIỆM LỚP HỌC YOGA ĐẲNG CẤP</h2>
          <p>Tham gia lớp học ngay hôm nay để lấy lại sự cân bằng hoàn hảo cho cuộc sống của bạn.</p>
          <div className="cta-actions">
            <button
              onClick={handleChoosePlan}
              className="cta-btn-primary yoga-cta-primary"
            >
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

export default YogaDetail;
