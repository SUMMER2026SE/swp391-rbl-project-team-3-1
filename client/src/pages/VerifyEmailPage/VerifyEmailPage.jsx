import React, { useEffect, useState } from 'react';
import './VerifyEmailPage.css';

function VerifyEmailPage() {
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('Đang xác thực email của bạn...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Không tìm thấy mã xác thực!');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Xác thực email thành công! Bạn có thể đăng nhập.');
        } else {
          setStatus('error');
          setMessage(data.message || 'Xác thực email thất bại!');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Lỗi kết nối tới máy chủ!');
      }
    };

    verifyEmail();
  }, []);

  const goHome = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new Event('popstate'));
  };

  const goLogin = () => {
    window.history.pushState({}, '', '/login');
    window.dispatchEvent(new Event('popstate'));
  };

  return (
    <div className="verify-page">
      <nav className="verify-navbar">
        <div className="verify-nav-brand" onClick={goHome} style={{ cursor: 'pointer' }}>
          <i className="fa-solid fa-dumbbell brand-icon"></i>
          <span className="brand-name">FX <span>FITNESS</span></span>
        </div>
      </nav>

      <div className="verify-container">
        <div className="verify-card">
          {status === 'verifying' && (
            <div className="verify-content verifying">
              <i className="fa-solid fa-spinner fa-spin verify-icon spinner"></i>
              <h2>Đang Xác Thực...</h2>
              <p>{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="verify-content success">
              <div className="icon-wrap">
                <i className="fa-solid fa-circle-check verify-icon"></i>
              </div>
              <h2>Thành Công!</h2>
              <p>{message}</p>
              <div className="verify-actions">
                <button className="btn-verify-primary" onClick={goLogin}>
                  <i className="fa-solid fa-right-to-bracket"></i> Đăng Nhập Ngay
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="verify-content error">
              <div className="icon-wrap">
                <i className="fa-solid fa-circle-xmark verify-icon"></i>
              </div>
              <h2>Oops! Có Lỗi Xảy Ra</h2>
              <p>{message}</p>
              <div className="verify-actions">
                <button className="btn-verify-secondary" onClick={goHome}>
                  <i className="fa-solid fa-house"></i> Về Trang Chủ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyEmailPage;
