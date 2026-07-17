import React, { useState, useEffect } from 'react';

function PublicCheckinPage() {
  const [status, setStatus] = useState('confirm'); // confirm, processing, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [checkinDetails, setCheckinDetails] = useState(null);
  const [memberId, setMemberId] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('memberId');
    if (id) {
      setMemberId(id);
    } else {
      setStatus('error');
      setErrorMessage('Thiếu mã ID hội viên trong liên kết!');
    }
  }, []);

  const triggerCheckin = () => {
    if (!memberId) return;
    setStatus('processing');

    // Call public check-in API
    fetch('/api/checkout/public-checkin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ memberId })
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(data => {
            throw new Error(data.message || 'Không thể thực hiện check-in.');
          });
        }
        return res.json();
      })
      .then(data => {
        if (data.success) {
          setStatus('success');
          setCheckinDetails(data.checkIn);
        } else {
          throw new Error('Check-in thất bại.');
        }
      })
      .catch(err => {
        setStatus('error');
        setErrorMessage(err.message || 'Lỗi kết nối máy chủ!');
      });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#ffffff',
      fontFamily: '"Be Vietnam Pro", sans-serif',
      padding: '24px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '24px',
        padding: '40px 24px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        textAlign: 'center',
        border: '1px solid #334155'
      }}>
        {status === 'confirm' && (
          <div>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              fontSize: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
            }}>
              <i className="fa-solid fa-map-location-dot"></i>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#3b82f6', margin: '0 0 12px 0', textTransform: 'uppercase' }}>
              Xác nhận Check-in
            </h2>
            <p style={{ fontSize: '0.92rem', color: '#94a3b8', lineHeight: '1.6', margin: '0 0 28px 0' }}>
              Bạn đang thực hiện check-in vào phòng tập **FX FITNESS** cho hội viên **#{memberId}**. Vui lòng nhấn nút dưới đây để xác nhận.
            </p>
            <button
              onClick={triggerCheckin}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: '#f97316',
                color: '#ffffff',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#ea580c'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#f97316'}
            >
              XÁC NHẬN CHECK-IN
            </button>
          </div>
        )}

        {status === 'processing' && (
          <div>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              border: '4px solid #334155',
              borderTopColor: '#f97316',
              margin: '0 auto 24px auto',
              animation: 'spin 1s linear infinite'
            }}></div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 8px 0' }}>
              Đang xác nhận check-in...
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0 }}>
              Vui lòng giữ kết nối mạng ổn định.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              color: '#ffffff',
              fontSize: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
            }}>
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#10b981', margin: '0 0 12px 0', textTransform: 'uppercase' }}>
              Check-in Thành Công!
            </h2>
            <div style={{
              backgroundColor: '#0f172a',
              borderRadius: '16px',
              padding: '16px',
              margin: '20px 0',
              textAlign: 'left',
              border: '1px solid #1e293b'
            }}>
              <div style={{ marginBottom: '8px', fontSize: '0.9rem', color: '#94a3b8' }}>
                Hội viên: <strong style={{ color: '#ffffff' }}>{checkinDetails?.memberName || 'N/A'}</strong>
              </div>
              <div style={{ marginBottom: '8px', fontSize: '0.9rem', color: '#94a3b8' }}>
                Mã số: <strong style={{ color: '#ffffff' }}>#{checkinDetails?.memberId || 'N/A'}</strong>
              </div>
              <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                Giờ vào: <strong style={{ color: '#f97316' }}>{checkinDetails?.checkinTime ? new Date(checkinDetails.checkinTime).toLocaleTimeString('vi-VN') : 'Vừa xong'}</strong>
              </div>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.6', margin: '0 0 24px 0' }}>
              Chào mừng bạn đến với <strong>FX FITNESS</strong>. Chúc bạn có một buổi tập luyện hiệu quả và tràn đầy năng lượng!
            </p>
            <button
              onClick={() => window.close()}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: '#334155',
                color: '#ffffff',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#475569'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#334155'}
            >
              Đóng cửa sổ
            </button>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)'
            }}>
              <i className="fa-solid fa-circle-xmark"></i>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#ef4444', margin: '0 0 12px 0', textTransform: 'uppercase' }}>
              Check-in Thất Bại
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#94a3b8', lineHeight: '1.6', margin: '0 0 24px 0' }}>
              {errorMessage || 'Đã xảy ra lỗi không xác định. Vui lòng quét lại mã QR.'}
            </p>
            <button
              onClick={() => setStatus('confirm')}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: '#f97316',
                color: '#ffffff',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#ea580c'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#f97316'}
            >
              Thử lại
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default PublicCheckinPage;
