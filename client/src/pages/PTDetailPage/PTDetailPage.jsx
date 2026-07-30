import React, { useState, useEffect } from 'react';
import './PTDetailPage.css';

const TIME_SLOTS = [
  { start: '05:00:00', end: '06:30:00', label: '05:00 - 06:30' },
  { start: '07:00:00', end: '08:30:00', label: '07:00 - 08:30' },
  { start: '09:00:00', end: '10:30:00', label: '09:00 - 10:30' },
  { start: '11:00:00', end: '12:30:00', label: '11:00 - 12:30' },
  { start: '14:00:00', end: '15:30:00', label: '14:00 - 15:30' },
  { start: '16:00:00', end: '17:30:00', label: '16:00 - 17:30' },
  { start: '18:00:00', end: '19:30:00', label: '18:00 - 19:30' },
  { start: '20:00:00', end: '21:30:00', label: '20:00 - 21:30' },
];

const getLocalDateString = (dateObj) => {
  const d = dateObj || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function PTDetailPage() {
  const [trainers, setTrainers] = useState([]);
  const [selectedPT, setSelectedPT] = useState(null);
  
  // Timetable states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch('/api/checkout/trainers')
      .then(res => res.json())
      .then(data => {
        if (data.trainers && data.trainers.length > 0) {
          setTrainers(data.trainers);
          setSelectedPT(data.trainers[0]);
        }
      })
      .catch(err => console.error('Error fetching trainers:', err));
  }, []);

  useEffect(() => {
    if (selectedPT) {
      fetchSchedules();
    }
  }, [selectedPT, currentDate]);

  const fetchSchedules = async () => {
    setIsLoadingSchedule(true);
    try {
      // Fetch 1 month around current date just to be safe
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - 15);
      const end = new Date(currentDate);
      end.setDate(currentDate.getDate() + 15);
      const startStr = getLocalDateString(start);
      const endStr = getLocalDateString(end);
      const res = await fetch(`/api/checkout/trainers/${selectedPT.userId}/schedule?startDate=${startStr}&endDate=${endStr}`);
      const data = await res.json();
      if (data.schedules) {
        setSchedules(data.schedules);
      }
    } catch (err) {
      console.error('Error fetching schedule', err);
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  const goHome = (e) => {
    e.preventDefault();
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new Event('popstate'));
  };

  const getDaysOfWeek = (date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  if (trainers.length === 0) {
    return <div style={{ padding: '100px', textAlign: 'center' }}>Đang tải thông tin Huấn Luyện Viên...</div>;
  }

  const daysOfWeek = getDaysOfWeek(currentDate);

  const isSlotBooked = (dateStr, startTime) => {
    return schedules.some(s => s.workingDate === dateStr && s.startTime.startsWith(startTime) && (s.status === 'Booked' || s.status === 'Busy' || s.status === 'Off'));
  };

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
                  {selectedPT.certifications && selectedPT.certifications.length > 0 ? (
                    selectedPT.certifications.map(cert => (
                      <li key={cert.id}><i className="fa-solid fa-check"></i> {cert.name} (Cấp bởi: {cert.issuedBy})</li>
                    ))
                  ) : (
                    <li><i className="fa-solid fa-check"></i> Chứng chỉ cá nhân chuyên nghiệp</li>
                  )}
                </ul>
              </div>

              {/* SCHEDULE / TIMETABLE */}
              <div className="pt-schedule" style={{ marginTop: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3><i className="fa-solid fa-calendar-alt" style={{color: '#3b82f6'}}></i> Lịch làm việc (Tham khảo)</h3>
                  <div className="week-controls" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button onClick={handlePrevWeek} style={{ cursor: 'pointer', padding: '5px 10px', borderRadius: '4px', border: '1px solid #ccc' }}><i className="fa-solid fa-chevron-left"></i> Tuần trước</button>
                    <span style={{ fontWeight: 'bold' }}>{daysOfWeek[0].toLocaleDateString('vi-VN')} - {daysOfWeek[6].toLocaleDateString('vi-VN')}</span>
                    <button onClick={handleNextWeek} style={{ cursor: 'pointer', padding: '5px 10px', borderRadius: '4px', border: '1px solid #ccc' }}>Tuần sau <i className="fa-solid fa-chevron-right"></i></button>
                  </div>
                </div>
                
                {isLoadingSchedule ? (
                  <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải lịch...</div>
                ) : (
                  <div className="timetable-container" style={{ marginTop: '20px', overflowX: 'auto' }}>
                    <table className="timetable" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>Ca \ Ngày</th>
                          {daysOfWeek.map((day, idx) => (
                            <th key={idx} style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                              {day.toLocaleDateString('vi-VN', { weekday: 'short' })} <br/>
                              {day.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {TIME_SLOTS.map((slot, sIdx) => (
                          <tr key={sIdx}>
                            <td style={{ padding: '10px', border: '1px solid #e2e8f0', fontWeight: 'bold', background: '#f8fafc' }}>{slot.label}</td>
                            {daysOfWeek.map((day, dIdx) => {
                              const dateStr = getLocalDateString(day);
                              const booked = isSlotBooked(dateStr, slot.start.substring(0,5));
                              
                              const [slotH, slotM, slotS] = slot.start.split(':').map(Number);
                              const slotDate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), slotH, slotM, slotS || 0);
                              const isPast = slotDate < new Date();
                              
                              let bg = '#dcfce7';
                              let color = '#166534';
                              let text = 'Rảnh';
                              
                              if (isPast) {
                                bg = '#f1f5f9';
                                color = '#94a3b8';
                                text = 'Đã qua';
                              } else if (booked) {
                                bg = '#e2e8f0';
                                color = '#64748b';
                                text = 'Bận';
                              }

                              return (
                                <td key={dIdx} style={{ 
                                  padding: '10px', 
                                  border: '1px solid #e2e8f0',
                                  background: bg,
                                  color: color,
                                  cursor: 'default'
                                }}>
                                  {text}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p style={{fontSize: '0.85rem', color: '#64748b', marginTop: '10px'}}>
                  *Màu xanh lá là các ca HLV đang rảnh, bạn có thể chọn HLV này nếu thời gian phù hợp với bạn.
                </p>
              </div>
            </div>

            {/* FEEDBACKS SECTION */}
            <div className="pt-transformations">
              <h3 className="transform-title">Học Viên Tiêu Biểu (Feedback)</h3>
              <p className="transform-desc">Đánh giá thực tế từ những học viên đã đồng hành cùng {selectedPT.fullName}.</p>
              
              <div className="transform-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {(selectedPT.feedbacks || []).map(fb => (
                  <div key={fb.id} className="transform-card" style={{ display: 'flex', flexDirection: 'column', padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                      <img src={fb.imageUrl} alt={fb.user} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', marginRight: '15px' }} />
                      <div>
                        <h4 style={{ margin: '0 0 5px 0' }}>{fb.user}</h4>
                        <div style={{ color: '#fbbf24', fontSize: '0.9rem' }}>
                          {[...Array(fb.rating)].map((_, i) => <i key={i} className="fa-solid fa-star"></i>)}
                        </div>
                      </div>
                    </div>
                    <p style={{ fontStyle: 'italic', color: '#475569', flex: 1 }}>"{fb.text}"</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <button 
                className="btn-hire-pt"
                onClick={(e) => {
                  e.preventDefault();
                  localStorage.setItem('checkoutPT', selectedPT.userId);
                  window.history.pushState({}, '', `/checkout?hirePT=${selectedPT.userId}`);
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
