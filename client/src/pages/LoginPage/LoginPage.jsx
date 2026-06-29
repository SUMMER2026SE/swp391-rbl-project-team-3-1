import React, { useState, useEffect, useRef } from 'react';
import './LoginPage.css';
import MemberDashboard from '../dashboard/member/MemberDashboard';
import TrainerDashboard from '../dashboard/trainer/TrainerDashboard';
import AdminDashboard from '../dashboard/admin/AdminDashboard';

// Helper: notify App.jsx that auth state changed (same-tab)
const notifyAuthChange = () => window.dispatchEvent(new Event('authChange'));

function LoginPage() {
  // Navigation & Authentication states
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userInfo, setUserInfo] = useState(JSON.parse(localStorage.getItem('userInfo') || 'null'));
  const [currentCard, setCurrentCard] = useState('login'); // 'login', 'forgot', 'reset'

  // Input states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const [resetPw1, setResetPw1] = useState('');
  const [resetPw2, setResetPw2] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetUserId, setResetUserId] = useState('');

  const [cpwOld, setCpwOld] = useState('');
  const [cpwNew, setCpwNew] = useState('');
  const [cpwConf, setCpwConf] = useState('');

  // First-time password change (admin) states
  const [tempPassword, setTempPassword] = useState('');
  const [firstNewPw, setFirstNewPw] = useState('');
  const [firstConfPw, setFirstConfPw] = useState('');
  const [firstAlert, setFirstAlert] = useState({ show: false, msg: '', ok: false });
  const [isFirstChangeLoading, setIsFirstChangeLoading] = useState(false);

  // Profile fields (from server)
  const [avatarUrl, setAvatarUrl] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [activeTab, setActiveTab] = useState('tongquan');

  // Alerts
  const [loginAlert, setLoginAlert] = useState({ show: false, msg: '', ok: false });
  const [forgotAlert, setForgotAlert] = useState({ show: false, msg: '', ok: false });
  const [resetAlert, setResetAlert] = useState({ show: false, msg: '', ok: false });
  const [cpwAlert, setCpwAlert] = useState({ show: false, msg: '', ok: false });

  // Dev mode for forgot password reset link
  const [devLink, setDevLink] = useState('');

  const fileInputRef = useRef(null);

  // Initialize: check reset params in URL, or validate existing session
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const tkn = params.get('token');
    const uid = params.get('userId');

    if (action === 'reset-password' && tkn && uid) {
      setResetToken(tkn);
      setResetUserId(uid);
      setCurrentCard('reset');
    } else if (action === 'verify-email' && tkn && uid) {
      // Auto trigger verification
      fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tkn, userId: uid })
      })
      .then(res => res.json())
      .then(data => {
        setLoginAlert({ show: true, msg: data.message || 'Kích hoạt thành công!', ok: true });
        // Xóa param khỏi url
        window.history.replaceState({}, document.title, window.location.pathname);
      })
      .catch(err => {
        setLoginAlert({ show: true, msg: 'Không thể kết nối đến máy chủ để kích hoạt tài khoản!', ok: false });
      });
    } else {
      const t = localStorage.getItem('token');
      if (t) {
        // Verify token is still valid before trusting it
        fetch('/api/profile', {
          headers: { Authorization: `Bearer ${t}` },
        })
          .then((r) => {
            if (r.ok) {
              setToken(t);
              return r.json().then((d) => {
                if (d.profile) {
                  setProfileData(d.profile);
                  if (d.profile.avatarUrl) {
                    setAvatarUrl(d.profile.avatarUrl);
                  }
                }
              });
            } else {
              // Token expired or invalid — clear it
              localStorage.removeItem('token');
              localStorage.removeItem('userInfo');
              setToken('');
              setUserInfo(null);
              notifyAuthChange();
            }
          })
          .catch((err) => console.error('Lỗi khi xác thực phiên:', err));
      }
    }
  }, []);

  // Fetch user profile from Backend
  const fetchProfile = (sessionToken) => {
    fetch('/api/profile', {
      headers: { Authorization: `Bearer ${sessionToken}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setProfileData(d.profile);
          if (d.profile.avatarUrl) {
            setAvatarUrl(d.profile.avatarUrl);
          }
        }
      })
      .catch((err) => console.error('Lỗi khi tải thông tin cá nhân:', err));
  };

  const showCard = (card) => setCurrentCard(card);
  const backToLogin = () => setCurrentCard('login');

  const clearAndLogin = () => {
    window.history.pushState({}, '', window.location.pathname);
    setResetPw1('');
    setResetPw2('');
    setCurrentCard('login');
  };

  // Helper: redirect to correct page based on role after login
  const redirectByRole = (roleId) => {
    // Hiện tại chỉ có trang chủ, mở rộng sau khi có trang admin/trainer riêng
    // roleId=3 → Admin, roleId=2 → Trainer, roleId=1 → Member
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new Event('popstate'));
  };

  // Sign out
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    setToken('');
    setUserInfo(null);
    setAvatarUrl('');
    window.history.pushState({}, '', window.location.pathname);
    notifyAuthChange(); // ← tell App.jsx to re-render
  };

  // Handle Login submission
  const doLogin = async (e) => {
    e.preventDefault();
    setLoginAlert({ show: false, msg: '', ok: false });

    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPw }),
      });
      const d = await r.json();
      if (r.ok) {
        // Nếu server trả về cờ yêu cầu đổi mật khẩu lần đầu
        if (d.mustChangePassword) {
          setTempPassword(loginPw);
          setFirstNewPw('');
          setFirstConfPw('');
          setCurrentCard('firstChange');
          setLoginAlert({ show: true, msg: d.message || 'Vui lòng đổi mật khẩu lần đầu.', ok: true });
          return;
        }

        // must_change_password = 0: login thành công → redirect về trang theo role
        localStorage.setItem('token', d.token);
        localStorage.setItem('userInfo', JSON.stringify(d.user));
        setToken(d.token);
        setUserInfo(d.user);
        fetchProfile(d.token);
        notifyAuthChange();
        redirectByRole(d.user.roleId);
      } else {
        setLoginAlert({ show: true, msg: d.message || 'Đăng nhập thất bại!', ok: false });
      }
    } catch (err) {
      setLoginAlert({ show: true, msg: 'Không thể kết nối đến máy chủ FxFitness!', ok: false });
    }
  };

  // Handle first-time password change (admin)
  const doFirstChange = async (e) => {
    e.preventDefault();
    setFirstAlert({ show: false, msg: '', ok: false });

    if (firstNewPw !== firstConfPw) {
      setFirstAlert({ show: true, msg: 'Mật khẩu xác nhận không khớp!', ok: false });
      return;
    }

    setIsFirstChangeLoading(true);
    try {
      const r = await fetch('/api/auth/first-change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, oldPassword: tempPassword, newPassword: firstNewPw }),
      });
      const d = await r.json();
      if (r.ok) {
        // Hiển thị thông báo thành công rõ ràng
        setFirstAlert({ show: true, msg: '✅ Cập nhật mật khẩu thành công! Đang chuyển về trang đăng nhập...', ok: true });
        // Sau 2 giây tự động chuyển về trang login
        setTimeout(() => {
          setCurrentCard('login');
          setFirstNewPw('');
          setFirstConfPw('');
          setTempPassword('');
          setLoginPw('');
          setFirstAlert({ show: false, msg: '', ok: false });
          setIsFirstChangeLoading(false);
          setLoginAlert({ show: true, msg: 'Mật khẩu đã được cập nhật thành công. Vui lòng đăng nhập bằng mật khẩu mới.', ok: true });
        }, 2000);
      } else {
        setFirstAlert({ show: true, msg: d.message || 'Đổi mật khẩu thất bại!', ok: false });
        setIsFirstChangeLoading(false);
      }
    } catch (err) {
      setFirstAlert({ show: true, msg: 'Lỗi kết nối máy chủ!', ok: false });
      setIsFirstChangeLoading(false);
    }
  };


  // Handle Forgot Password submission
  const doForgot = async (e) => {
    e.preventDefault();
    setIsForgotLoading(true);
    setForgotAlert({ show: false, msg: '', ok: false });
    setDevLink('');

    try {
      const r = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const d = await r.json();
      if (r.ok) {
        setForgotAlert({ show: true, msg: d.message, ok: true });
        if (d.resetLink) setDevLink(d.resetLink);
      } else {
        setForgotAlert({ show: true, msg: d.message || 'Có lỗi xảy ra!', ok: false });
      }
    } catch (err) {
      setForgotAlert({ show: true, msg: 'Lỗi kết nối máy chủ!', ok: false });
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Handle Reset Password submission
  const doReset = async (e) => {
    e.preventDefault();
    setResetAlert({ show: false, msg: '', ok: false });

    if (resetPw1 !== resetPw2) {
      setResetAlert({ show: true, msg: 'Mật khẩu xác nhận không khớp!', ok: false });
      return;
    }

    try {
      const r = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, userId: resetUserId, newPassword: resetPw1 }),
      });
      const d = await r.json();
      if (r.ok) {
        setResetAlert({ show: true, msg: d.message + ' Đang chuyển hướng...', ok: true });
        setTimeout(clearAndLogin, 3000);
      } else {
        setResetAlert({ show: true, msg: d.message || 'Lỗi đặt lại mật khẩu!', ok: false });
      }
    } catch (err) {
      setResetAlert({ show: true, msg: 'Không thể kết nối đến máy chủ!', ok: false });
    }
  };

  // Handle Change Password submission
  const doChangePw = async (e) => {
    e.preventDefault();
    setCpwAlert({ show: false, msg: '', ok: false });

    if (cpwNew !== cpwConf) {
      setCpwAlert({ show: true, msg: 'Mật khẩu xác nhận không khớp!', ok: false });
      return;
    }

    if (!token) {
      setCpwAlert({ show: true, msg: 'Phiên làm việc đã hết hạn!', ok: false });
      logout();
      return;
    }

    try {
      const r = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword: cpwOld, newPassword: cpwNew }),
      });
      const d = await r.json();
      if (r.ok) {
        setCpwAlert({ show: true, msg: d.message + ' Đang cập nhật phiên...', ok: true });
        setCpwOld('');
        setCpwNew('');
        setCpwConf('');

        // Re-login to get fresh token with new password
        try {
          const email = userInfo && userInfo.email;
          if (!email) throw new Error('No email available');

          const lr = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: cpwNew }),
          });
          const ld = await lr.json();
          if (lr.ok) {
            localStorage.setItem('token', ld.token);
            localStorage.setItem('userInfo', JSON.stringify(ld.user));
            setToken(ld.token);
            setUserInfo(ld.user);
            fetchProfile(ld.token);
            notifyAuthChange();
            setCpwAlert({ show: true, msg: 'Đổi mật khẩu thành công!', ok: true });
          } else {
            setCpwAlert({ show: true, msg: 'Đổi mật khẩu xong nhưng đăng nhập lại thất bại, đang đăng xuất...', ok: false });
            setTimeout(logout, 2000);
          }
        } catch (err) {
          console.error('Re-login after password change failed:', err);
          setCpwAlert({ show: true, msg: 'Đổi mật khẩu thành công nhưng có lỗi khi cập nhật phiên. Vui lòng đăng nhập lại.', ok: false });
          setTimeout(logout, 2000);
        }
      } else {
        setCpwAlert({ show: true, msg: d.message || 'Thay đổi mật khẩu thất bại!', ok: false });
      }
    } catch (err) {
      setCpwAlert({ show: true, msg: 'Lỗi kết nối máy chủ!', ok: false });
    }
  };

  // Handle Avatar Upload
  const uploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!token) {
      alert('Bạn cần đăng nhập trước!');
      logout();
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const r = await fetch('/api/profile/avatar', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const d = await r.json();
      if (r.ok) {
        setAvatarUrl(d.avatarUrl);
        alert('Đổi ảnh đại diện thành công!');
      } else {
        alert(d.message || 'Đổi avatar thất bại!');
      }
    } catch (err) {
      alert('Không thể kết nối server!');
    }
  };

  // Navigate back to HomePage
  const backToHome = (e) => {
    e.preventDefault();
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new Event('popstate'));
  };

  // Parse role label from userInfo
  const getRoleText = () => {
    if (!userInfo) return 'HỘI VIÊN';
    const roleId = userInfo.roleId;
    if (roleId === 3) return 'ADMIN';
    if (roleId === 2) return 'TRAINER';
    return 'MEMBER';
  };

  // ─── Authenticated Dashboard ───────────────────────────────────────────────
  if (token) {
    if (userInfo?.roleId === 1) {
      return (
        <MemberDashboard
          token={token}
          userInfo={userInfo}
          logout={logout}
          avatarUrl={avatarUrl}
          uploadAvatar={uploadAvatar}
          fileInputRef={fileInputRef}
          profileData={profileData}
          fetchProfile={fetchProfile}
        />
      );
    }

    if (userInfo?.roleId === 2) {
      return (
        <TrainerDashboard
          token={token}
          userInfo={userInfo}
          logout={logout}
          avatarUrl={avatarUrl}
          uploadAvatar={uploadAvatar}
          fileInputRef={fileInputRef}
          profileData={profileData}
          fetchProfile={fetchProfile}
        />
      );
    }

    if (userInfo?.roleId === 3) {
      return (
        <AdminDashboard
          token={token}
          userInfo={userInfo}
          logout={logout}
          avatarUrl={avatarUrl}
          uploadAvatar={uploadAvatar}
          fileInputRef={fileInputRef}
          profileData={profileData}
          fetchProfile={fetchProfile}
        />
      );
    }

    return (
      <div className="loginpage-container">
        <div className="dash-shell" id="dashShell">
          <div className="dash-card">
            <div className="dash-header">
              <div className="dash-brand">
                <a href="/" onClick={backToHome} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'inherit', textDecoration: 'none' }}>
                  <i className="fa-solid fa-dumbbell"></i>
                  <div>
                    <h2>Bảng Điều Khiển</h2>
                    <p>Hệ thống hội viên FxFitness Center</p>
                  </div>
                </a>
              </div>
              <button className="btn-logout" onClick={logout}>
                <i className="fa-solid fa-power-off"></i> Đăng xuất
              </button>
            </div>

            <div className="dash-grid">
              <div>
                <div className="profile-card">
                  <div className="p-avatar" id="avatarBox">
                    {avatarUrl ? (
                      <img
                        id="avatarImg"
                        src={avatarUrl}
                        alt="Avatar"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      />
                    ) : (
                      <i className="fa-solid fa-user-ninja" id="avatarIcon"></i>
                    )}
                  </div>

                  <input
                    type="file"
                    id="avatarInput"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={uploadAvatar}
                  />

                  <button className="avatar-upload-btn" onClick={() => fileInputRef.current.click()}>
                    <i className="fa-solid fa-camera"></i> Đổi ảnh đại diện
                  </button>
                  <div className="p-name" id="dName">
                    {userInfo ? userInfo.fullName : 'Hội Viên FxFitness'}
                  </div>
                  <div className="p-role" id="dRole">
                    {getRoleText()}
                  </div>
                </div>

                <div className="info-list">
                  <div className="info-row">
                    <i className="fa-solid fa-envelope"></i>
                    <div>
                      <div className="i-lbl">Email Hệ thống</div>
                      <div className="i-val" id="dEmail">
                        {userInfo ? userInfo.email : 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="info-row">
                    <i className="fa-solid fa-shield"></i>
                    <div>
                      <div className="i-lbl">Trạng thái bảo mật</div>
                      <div className="i-val" style={{ color: 'var(--orange)' }}>
                        Đã kết nối JWT
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="cpw-title">
                  <i className="fa-solid fa-user-shield"></i> Thay Đổi Mật Khẩu
                </div>

                {cpwAlert.show && (
                  <div className={`alert ${cpwAlert.ok ? 'ok' : 'err'}`} style={{ display: 'flex' }}>
                    <i className={`fa-solid ${cpwAlert.ok ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
                    <span>{cpwAlert.msg}</span>
                  </div>
                )}

                <form id="fCpw" onSubmit={doChangePw}>
                  <div className="field">
                    <div className="field-head"><span className="lbl">Mật khẩu hiện tại</span></div>
                    <div className="inp-wrap">
                      <input type="password" placeholder="Nhập mật khẩu cũ" value={cpwOld} onChange={(e) => setCpwOld(e.target.value)} required />
                    </div>
                  </div>
                  <div className="field">
                    <div className="field-head"><span className="lbl">Mật khẩu mới</span></div>
                    <div className="inp-wrap">
                      <input type="password" placeholder="Tối thiểu 6 ký tự" value={cpwNew} onChange={(e) => setCpwNew(e.target.value)} required />
                    </div>
                  </div>
                  <div className="field">
                    <div className="field-head"><span className="lbl">Xác nhận mật khẩu mới</span></div>
                    <div className="inp-wrap">
                      <input type="password" placeholder="Nhập lại mật khẩu mới" value={cpwConf} onChange={(e) => setCpwConf(e.target.value)} required />
                    </div>
                  </div>
                  <button className="btn-primary" type="submit" style={{ marginTop: '4px' }}>
                    Cập Nhật Mật Khẩu
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Login / Forgot / Reset Forms ─────────────────────────────────────────
  return (
    <div className="loginpage-container">
      <div className="shell" id="authShell">
        {/* LEFT */}
        <div className="left">
          <div className="oval"></div>
          <div className="triangle"></div>
          <div className="left-body">
            <h1 className="heading" onClick={backToHome} style={{ cursor: 'pointer' }}>
              CHÀO MỪNG<br />TRỞ LẠI
            </h1>
            <p className="sub" onClick={backToHome} style={{ cursor: 'pointer' }}>Fx Fitness Center</p>
            <div className="gym-photo">
              <img src="/gym_login.png" alt="Fx Fitness Center" />
              <div className="photo-arrow" onClick={backToHome}>
                <i className="fa-solid fa-chevron-right"></i>
              </div>
            </div>
            <p className="gym-caption">
              Đánh thức sức mạnh tiềm ẩn của bạn với cơ sở vật chất hiện đại và
              đội ngũ huấn luyện viên chuyên nghiệp.
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="right">
          <div className="form-box">
            <div className="tabs">
              <button className="tab active" id="tabLogin">Đăng Nhập</button>
            </div>

            {/* LOGIN */}
            {currentCard === 'login' && (
              <div id="secLogin">
                {loginAlert.show && (
                  <div className={`alert ${loginAlert.ok ? 'ok' : 'err'}`} style={{ display: 'flex' }}>
                    <i className={`fa-solid ${loginAlert.ok ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
                    <span>{loginAlert.msg}</span>
                  </div>
                )}
                <form id="fLogin" onSubmit={doLogin}>
                  <div className="field">
                    <div className="field-head"><span className="lbl">Email</span></div>
                    <div className="inp-wrap">
                      <input type="email" placeholder="ví dụ: ten@email.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                    </div>
                  </div>
                  <div className="field">
                    <div className="field-head">
                      <span className="lbl">Mật Khẩu</span>
                      <a className="forgot" onClick={() => showCard('forgotCard')}>Quên mật khẩu?</a>
                    </div>
                    <div className="inp-wrap">
                      <input
                        type={showPw ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginPw}
                        onChange={(e) => setLoginPw(e.target.value)}
                        required
                      />
                      <span className="eye" onClick={() => setShowPw(!showPw)}>
                        <i className={`fa-regular ${showPw ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                      </span>
                    </div>
                  </div>
                  <button className="btn-primary" type="submit">Đăng Nhập</button>
                </form>
                <button className="btn-secondary" onClick={backToHome} style={{ marginTop: '16px' }}>
                  <i className="fa-solid fa-arrow-left"></i> Trở về Trang Chủ
                </button>
              </div>
            )}

            {/* FORGOT */}
            {currentCard === 'forgotCard' && (
              <div id="forgotCard">
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text)', marginBottom: '6px' }}>Quên Mật Khẩu?</h2>
                <p style={{ color: '#999', fontSize: '0.88rem', marginBottom: '24px' }}>Nhập email để nhận link khôi phục.</p>
                {forgotAlert.show && (
                  <div className={`alert ${forgotAlert.ok ? 'ok' : 'err'}`} style={{ display: 'flex' }}>
                    <i className={`fa-solid ${forgotAlert.ok ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
                    <span>{forgotAlert.msg}</span>
                  </div>
                )}
                <form id="fForgot" onSubmit={doForgot}>
                  <div className="field">
                    <div className="field-head"><span className="lbl">Địa chỉ Email</span></div>
                    <div className="inp-wrap">
                      <input type="email" placeholder="Nhập email để khôi phục" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required />
                    </div>
                  </div>
                  <button className="btn-primary" type="submit" disabled={isForgotLoading}>
                    {isForgotLoading ? 'Đang xử lý...' : 'Gửi Yêu Cầu Khôi Phục'}
                  </button>
                </form>
                <button className="btn-secondary" onClick={backToLogin}>
                  <i className="fa-solid fa-arrow-left"></i> Quay lại Đăng nhập
                </button>
                {devLink && (
                  <div id="devBox" className="dev-box">
                    <h4><i className="fa-solid fa-bug"></i> Dev Mode</h4>
                    <p>Link reset (local test):</p>
                    <code>{devLink}</code>
                    <button className="btn-primary" style={{ marginTop: '12px', padding: '10px' }} onClick={() => { window.location.href = devLink; }}>
                      Đi tới Link Reset
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* RESET */}
            {currentCard === 'reset' && (
              <div id="resetCard">
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text)', marginBottom: '6px' }}>Đặt Lại Mật Khẩu</h2>
                <p style={{ color: '#999', fontSize: '0.88rem', marginBottom: '24px' }}>Thiết lập mật khẩu bảo vệ mới.</p>
                {resetAlert.show && (
                  <div className={`alert ${resetAlert.ok ? 'ok' : 'err'}`} style={{ display: 'flex' }}>
                    <i className={`fa-solid ${resetAlert.ok ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
                    <span>{resetAlert.msg}</span>
                  </div>
                )}
                <form id="fReset" onSubmit={doReset}>
                  <div className="field">
                    <div className="field-head"><span className="lbl">Mật khẩu mới</span></div>
                    <div className="inp-wrap">
                      <input type="password" placeholder="Tối thiểu 6 ký tự" value={resetPw1} onChange={(e) => setResetPw1(e.target.value)} required />
                    </div>
                  </div>
                  <div className="field">
                    <div className="field-head"><span className="lbl">Xác nhận mật khẩu mới</span></div>
                    <div className="inp-wrap">
                      <input type="password" placeholder="Nhập lại mật khẩu mới" value={resetPw2} onChange={(e) => setResetPw2(e.target.value)} required />
                    </div>
                  </div>
                  <button className="btn-primary" type="submit">Cập Nhật Mật Khẩu</button>
                </form>
                <button className="btn-secondary" onClick={clearAndLogin}>Hủy & Về Đăng nhập</button>
              </div>
            )}

            {/* FIRST-TIME CHANGE (Admin) */}
            {currentCard === 'firstChange' && (
              <div id="firstChangeCard">
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text)', marginBottom: '6px' }}>Đổi Mật Khẩu Lần Đầu</h2>
                <p style={{ color: '#999', fontSize: '0.88rem', marginBottom: '24px' }}>Tài khoản admin yêu cầu đổi mật khẩu lần đầu. Vui lòng nhập mật khẩu mới.</p>
                {firstAlert.show && (
                  <div className={`alert ${firstAlert.ok ? 'ok' : 'err'}`} style={{ display: 'flex' }}>
                    <i className={`fa-solid ${firstAlert.ok ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
                    <span>{firstAlert.msg}</span>
                  </div>
                )}
                <form id="fFirstChange" onSubmit={doFirstChange}>
                  <div className="field">
                    <div className="field-head"><span className="lbl">Email</span></div>
                    <div className="inp-wrap">
                      <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                    </div>
                  </div>
                  <div className="field">
                    <div className="field-head"><span className="lbl">Mật khẩu mới</span></div>
                    <div className="inp-wrap">
                      <input type="password" placeholder="Tối thiểu 6 ký tự" value={firstNewPw} onChange={(e) => setFirstNewPw(e.target.value)} required />
                    </div>
                  </div>
                  <div className="field">
                    <div className="field-head"><span className="lbl">Xác nhận mật khẩu mới</span></div>
                    <div className="inp-wrap">
                      <input type="password" placeholder="Nhập lại mật khẩu mới" value={firstConfPw} onChange={(e) => setFirstConfPw(e.target.value)} required />
                    </div>
                  </div>
                  <button className="btn-primary" type="submit" disabled={isFirstChangeLoading}>
                    {isFirstChangeLoading ? 'Đang xử lý...' : 'Cập Nhật Mật Khẩu'}
                  </button>
                </form>
                <button className="btn-secondary" disabled={isFirstChangeLoading} onClick={() => { setCurrentCard('login'); setTempPassword(''); setFirstNewPw(''); setFirstConfPw(''); }}>Hủy & Về Đăng nhập</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;