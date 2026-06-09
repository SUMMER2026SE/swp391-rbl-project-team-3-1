import React, { useState, useEffect, useRef } from 'react';
import './LoginPage.css';

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

  // Profile fields (from server)
  const [avatarUrl, setAvatarUrl] = useState('');

  // Alerts
  const [loginAlert, setLoginAlert] = useState({ show: false, msg: '', ok: false });
  const [forgotAlert, setForgotAlert] = useState({ show: false, msg: '', ok: false });
  const [resetAlert, setResetAlert] = useState({ show: false, msg: '', ok: false });
  const [cpwAlert, setCpwAlert] = useState({ show: false, msg: '', ok: false });

  // Dev mode for forgot password reset link
  const [devLink, setDevLink] = useState('');

  const fileInputRef = useRef(null);

  // Tabs & Lists state
  const [activeTab, setActiveTab] = useState('profile');
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [members, setMembers] = useState([]);

  // Workout form state
  const [isCreatingWorkout, setIsCreatingWorkout] = useState(false);
  const [editingWorkoutId, setEditingWorkoutId] = useState(null);
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutDesc, setWorkoutDesc] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [workoutExercises, setWorkoutExercises] = useState([]);

  // Meal form state
  const [isCreatingMeal, setIsCreatingMeal] = useState(false);
  const [editingMealId, setEditingMealId] = useState(null);
  const [mealTitle, setMealTitle] = useState('');
  const [mealDesc, setMealDesc] = useState('');
  const [mealCalories, setMealCalories] = useState('');
  const [selectedMealMemberId, setSelectedMealMemberId] = useState('');

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
                if (d.profile && d.profile.avatarUrl) {
                  setAvatarUrl(d.profile.avatarUrl);
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
        if (d.profile && d.profile.avatarUrl) {
          setAvatarUrl(d.profile.avatarUrl);
        }
      })
      .catch((err) => console.error('Lỗi khi tải thông tin cá nhân:', err));
  };

  // Fetch lists when authenticated
  const fetchWorkouts = async () => {
    try {
      const r = await fetch('/api/workout-plans', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        const d = await r.json();
        setWorkoutPlans(d);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách kế hoạch tập:', err);
    }
  };

  const fetchMeals = async () => {
    try {
      const r = await fetch('/api/meal-plans', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        const d = await r.json();
        setMealPlans(d);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách kế hoạch ăn:', err);
    }
  };

  const fetchMembers = async () => {
    try {
      const r = await fetch('/api/workout-plans/members', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        const d = await r.json();
        setMembers(d);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách hội viên:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchWorkouts();
      fetchMeals();
      if (userInfo && (userInfo.roleId === 2 || userInfo.roleId === 3)) {
        fetchMembers();
      }
    }
  }, [token, userInfo]);

  const showCard = (card) => setCurrentCard(card);
  const backToLogin = () => setCurrentCard('login');

  const clearAndLogin = () => {
    window.history.pushState({}, '', window.location.pathname);
    setResetPw1('');
    setResetPw2('');
    setCurrentCard('login');
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
        localStorage.setItem('token', d.token);
        localStorage.setItem('userInfo', JSON.stringify(d.user));
        setToken(d.token);
        setUserInfo(d.user);
        fetchProfile(d.token);
        notifyAuthChange(); // ← tell App.jsx to re-render to dashboard
      } else {
        setLoginAlert({ show: true, msg: d.message || 'Đăng nhập thất bại!', ok: false });
      }
    } catch (err) {
      setLoginAlert({ show: true, msg: 'Không thể kết nối đến máy chủ FxFitness!', ok: false });
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

  // Exercise input managers
  const addExerciseRow = () => {
    setWorkoutExercises([
      ...workoutExercises,
      { exercise_name: '', sets: 3, reps: 10, rpe: 8, duration_minutes: 0, calories_burned: 0 }
    ]);
  };

  const removeExerciseRow = (index) => {
    setWorkoutExercises(workoutExercises.filter((_, i) => i !== index));
  };

  const handleExerciseChange = (index, field, value) => {
    const updated = [...workoutExercises];
    updated[index][field] = value;
    setWorkoutExercises(updated);
  };

  // Workout handlers
  const saveWorkoutPlan = async (e) => {
    e.preventDefault();
    if (!selectedMemberId || !workoutTitle) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    const payload = {
      memberId: parseInt(selectedMemberId),
      title: workoutTitle,
      description: workoutDesc,
      exercises: workoutExercises
    };

    const url = editingWorkoutId ? `/api/workout-plans/${editingWorkoutId}` : '/api/workout-plans';
    const method = editingWorkoutId ? 'PUT' : 'POST';

    try {
      const r = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const d = await r.json();
      if (r.ok) {
        alert(d.message || 'Lưu kế hoạch tập luyện thành công!');
        setIsCreatingWorkout(false);
        setEditingWorkoutId(null);
        setWorkoutTitle('');
        setWorkoutDesc('');
        setSelectedMemberId('');
        setWorkoutExercises([]);
        fetchWorkouts();
      } else {
        alert(d.message || 'Lỗi khi lưu kế hoạch tập luyện!');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ!');
    }
  };

  const startEditWorkout = (plan) => {
    setIsCreatingWorkout(true);
    setEditingWorkoutId(plan.workout_plan_id);
    setWorkoutTitle(plan.title || '');
    setWorkoutDesc(plan.description || '');
    setSelectedMemberId(plan.member_id || '');
    setWorkoutExercises(plan.WorkoutExercises || []);
  };

  const startCreateWorkout = () => {
    setIsCreatingWorkout(true);
    setEditingWorkoutId(null);
    setWorkoutTitle('');
    setWorkoutDesc('');
    setSelectedMemberId(members[0]?.member_id || '');
    setWorkoutExercises([{ exercise_name: '', sets: 3, reps: 10, rpe: 8, duration_minutes: 0, calories_burned: 0 }]);
  };

  const deleteWorkoutPlan = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa kế hoạch tập luyện này?')) return;
    try {
      const r = await fetch(`/api/workout-plans/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await r.json();
      if (r.ok) {
        alert(d.message || 'Xóa thành công!');
        fetchWorkouts();
      } else {
        alert(d.message || 'Lỗi khi xóa!');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ!');
    }
  };

  // Meal handlers
  const saveMealPlan = async (e) => {
    e.preventDefault();
    if (!selectedMealMemberId || !mealTitle) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    const payload = {
      memberId: parseInt(selectedMealMemberId),
      title: mealTitle,
      description: mealDesc,
      calories_per_day: parseInt(mealCalories) || 0
    };

    const url = editingMealId ? `/api/meal-plans/${editingMealId}` : '/api/meal-plans';
    const method = editingMealId ? 'PUT' : 'POST';

    try {
      const r = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const d = await r.json();
      if (r.ok) {
        alert(d.message || 'Lưu kế hoạch ăn uống thành công!');
        setIsCreatingMeal(false);
        setEditingMealId(null);
        setMealTitle('');
        setMealDesc('');
        setMealCalories('');
        setSelectedMealMemberId('');
        fetchMeals();
      } else {
        alert(d.message || 'Lỗi khi lưu kế hoạch ăn uống!');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ!');
    }
  };

  const startEditMeal = (plan) => {
    setIsCreatingMeal(true);
    setEditingMealId(plan.meal_plan_id);
    setMealTitle(plan.title || '');
    setMealDesc(plan.description || '');
    setMealCalories(plan.calories_per_day || '');
    setSelectedMealMemberId(plan.member_id || '');
  };

  const startCreateMeal = () => {
    setIsCreatingMeal(true);
    setEditingMealId(null);
    setMealTitle('');
    setMealDesc('');
    setMealCalories('');
    setSelectedMealMemberId(members[0]?.member_id || '');
  };

  const deleteMealPlan = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa kế hoạch ăn uống này?')) return;
    try {
      const r = await fetch(`/api/meal-plans/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await r.json();
      if (r.ok) {
        alert(d.message || 'Xóa thành công!');
        fetchMeals();
      } else {
        alert(d.message || 'Lỗi khi xóa!');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ!');
    }
  };

  // ─── Workspace Views ───────────────────────────────────────────────────────
  const renderProfileTab = () => {
    return (
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
    );
  };

  const renderWorkoutTab = () => {
    const isPTOrAdmin = userInfo && (userInfo.roleId === 2 || userInfo.roleId === 3);

    if (isCreatingWorkout) {
      return (
        <div className="form-card">
          <div className="form-title-row">
            <h4>{editingWorkoutId ? 'Chỉnh Sửa Kế Hoạch Tập Luyện' : 'Tạo Kế Hoạch Tập Luyện Mới'}</h4>
            <button type="button" className="btn-close-form" onClick={() => { setIsCreatingWorkout(false); setEditingWorkoutId(null); }}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <form onSubmit={saveWorkoutPlan}>
            {!editingWorkoutId && (
              <div className="field">
                <div className="field-head"><span className="lbl">Chọn Hội Viên</span></div>
                <select
                  className="form-select"
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  required
                >
                  <option value="">-- Chọn hội viên --</option>
                  {members.map((m) => (
                    <option key={m.member_id} value={m.member_id}>
                      {m.fullName} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {editingWorkoutId && (
              <div className="field">
                <div className="field-head"><span className="lbl">Hội Viên</span></div>
                <div className="inp-wrap">
                  <input
                    type="text"
                    value={workoutPlans.find(p => p.workout_plan_id === editingWorkoutId)?.member?.user?.full_name || ''}
                    disabled
                    style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                  />
                </div>
              </div>
            )}

            <div className="field">
              <div className="field-head"><span className="lbl">Tiêu Đề Kế Hoạch</span></div>
              <div className="inp-wrap">
                <input
                  type="text"
                  placeholder="Ví dụ: Kế hoạch tăng cơ 4 tuần"
                  value={workoutTitle}
                  onChange={(e) => setWorkoutTitle(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <div className="field-head"><span className="lbl">Mô Tả Chi Tiết</span></div>
              <textarea
                className="form-textarea"
                placeholder="Nhập mô tả hoặc lưu ý cho hội viên..."
                value={workoutDesc}
                onChange={(e) => setWorkoutDesc(e.target.value)}
              />
            </div>

            <div className="exercises-form-section">
              <div className="exercises-section-header">
                <h5>Danh Sách Bài Tập</h5>
                <button type="button" className="btn-add-exercise" onClick={addExerciseRow}>
                  <i className="fa-solid fa-plus"></i> Thêm Bài Tập
                </button>
              </div>

              <div className="exercise-inputs-grid">
                {workoutExercises.length > 0 && (
                  <div className="exercise-input-header-row">
                    <label>Tên bài tập</label>
                    <label>Số Set</label>
                    <label>Số Rep</label>
                    <label>Số RPE (1-10)</label>
                    <label>Time nghỉ (phút)</label>
                    <label>Calo (Kcal)</label>
                    <label></label>
                  </div>
                )}
                {workoutExercises.map((ex, idx) => (
                  <div key={idx} className="exercise-input-row">
                    <input
                      type="text"
                      placeholder="Tên bài tập"
                      value={ex.exercise_name || ''}
                      onChange={(e) => handleExerciseChange(idx, 'exercise_name', e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Số Set"
                      min="1"
                      value={ex.sets || 3}
                      onChange={(e) => handleExerciseChange(idx, 'sets', e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Số Rep"
                      min="1"
                      value={ex.reps || 10}
                      onChange={(e) => handleExerciseChange(idx, 'reps', e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      placeholder="RPE (1-10)"
                      min="1"
                      max="10"
                      value={ex.rpe || ''}
                      onChange={(e) => handleExerciseChange(idx, 'rpe', e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Time nghỉ (phút)"
                      min="0"
                      value={ex.duration_minutes || 0}
                      onChange={(e) => handleExerciseChange(idx, 'duration_minutes', e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Calo (Kcal)"
                      min="0"
                      value={ex.calories_burned || 0}
                      onChange={(e) => handleExerciseChange(idx, 'calories_burned', e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-remove-exercise"
                      onClick={() => removeExerciseRow(idx)}
                      title="Xóa bài tập này"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                ))}

                {workoutExercises.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>
                    Chưa có bài tập nào được thêm. Nhấp "Thêm Bài Tập" ở trên.
                  </p>
                )}
              </div>
            </div>

            <div className="form-actions-row">
              <button type="button" className="btn-form-cancel" onClick={() => { setIsCreatingWorkout(false); setEditingWorkoutId(null); }}>
                Hủy bỏ
              </button>
              <button type="submit" className="btn-form-save">
                Lưu Kế Hoạch
              </button>
            </div>
          </form>
        </div>
      );
    }

    return (
      <div>
        <div className="workspace-title-row">
          <h3>Kế Hoạch Tập Luyện</h3>
          {isPTOrAdmin && (
            <button className="btn-form-save" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.88rem' }} onClick={startCreateWorkout}>
              <i className="fa-solid fa-plus"></i> Tạo kế hoạch mới
            </button>
          )}
        </div>

        {workoutPlans.length === 0 ? (
          <div className="empty-state">
            <i className="fa-solid fa-calendar-xmark"></i>
            <p>Hiện tại chưa có kế hoạch tập luyện nào được chỉ định.</p>
          </div>
        ) : (
          <div className="plans-grid">
            {workoutPlans.map((plan) => (
              <div className="plan-card" key={plan.workout_plan_id}>
                <div className="plan-card-header">
                  <div className="plan-card-title">{plan.title}</div>
                  <div className="plan-card-meta">
                    <span>
                      <i className="fa-solid fa-user"></i>
                      Hội viên: {plan.member?.user?.full_name || 'N/A'}
                    </span>
                    <span>
                      <i className="fa-solid fa-user-tie"></i>
                      PT: {plan.trainer?.user?.full_name || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="plan-card-desc">{plan.description || 'Không có mô tả thêm.'}</div>

                <div className="plan-card-stats">
                  <div className="workout-stats-row">
                    <span>
                      <i className="fa-solid fa-dumbbell"></i>
                      {plan.WorkoutExercises?.length || 0} bài tập
                    </span>
                    <span>
                      <i className="fa-solid fa-fire"></i>
                      {plan.WorkoutExercises?.reduce((acc, curr) => acc + (curr.calories_burned || 0), 0) || 0} kcal
                    </span>
                  </div>
                </div>

                {plan.WorkoutExercises && plan.WorkoutExercises.length > 0 && (
                  <div className="plan-exercises-list">
                    <h5>Chi Tiết Bài Tập:</h5>
                    {plan.WorkoutExercises.map((ex) => (
                      <div className="exercise-mini-item" key={ex.workout_exercise_id}>
                        <span>{ex.exercise_name}</span>
                        <span className="ex-details">
                          {ex.sets} hiệp x {ex.reps} lần (RPE: {ex.rpe || 'N/A'}) {ex.duration_minutes ? `(${ex.duration_minutes} phút)` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {isPTOrAdmin && (
                  <div className="plan-card-actions">
                    <button className="btn-card-action btn-edit" onClick={() => startEditWorkout(plan)}>
                      <i className="fa-solid fa-pen"></i> Sửa
                    </button>
                    <button className="btn-card-action btn-delete" onClick={() => deleteWorkoutPlan(plan.workout_plan_id)}>
                      <i className="fa-solid fa-trash"></i> Xóa
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderMealTab = () => {
    const isPTOrAdmin = userInfo && (userInfo.roleId === 2 || userInfo.roleId === 3);

    if (isCreatingMeal) {
      return (
        <div className="form-card">
          <div className="form-title-row">
            <h4>{editingMealId ? 'Chỉnh Sửa Kế Hoạch Ăn Uống' : 'Tạo Kế Hoạch Ăn Uống Mới'}</h4>
            <button type="button" className="btn-close-form" onClick={() => { setIsCreatingMeal(false); setEditingMealId(null); }}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <form onSubmit={saveMealPlan}>
            {!editingMealId && (
              <div className="field">
                <div className="field-head"><span className="lbl">Chọn Hội Viên</span></div>
                <select
                  className="form-select"
                  value={selectedMealMemberId}
                  onChange={(e) => setSelectedMealMemberId(e.target.value)}
                  required
                >
                  <option value="">-- Chọn hội viên --</option>
                  {members.map((m) => (
                    <option key={m.member_id} value={m.member_id}>
                      {m.fullName} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {editingMealId && (
              <div className="field">
                <div className="field-head"><span className="lbl">Hội Viên</span></div>
                <div className="inp-wrap">
                  <input
                    type="text"
                    value={mealPlans.find(p => p.meal_plan_id === editingMealId)?.member?.user?.full_name || ''}
                    disabled
                    style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                  />
                </div>
              </div>
            )}

            <div className="field">
              <div className="field-head"><span className="lbl">Tiêu Đề Kế Hoạch</span></div>
              <div className="inp-wrap">
                <input
                  type="text"
                  placeholder="Ví dụ: Kế hoạch ăn giảm mỡ bụng"
                  value={mealTitle}
                  onChange={(e) => setMealTitle(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <div className="field-head"><span className="lbl">Mục Tiêu Calo Mỗi Ngày (Kcal)</span></div>
              <div className="inp-wrap">
                <input
                  type="number"
                  placeholder="Ví dụ: 1800"
                  value={mealCalories}
                  onChange={(e) => setMealCalories(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <div className="field-head"><span className="lbl">Mô Tả Chế Độ Dinh Dưỡng</span></div>
              <textarea
                className="form-textarea"
                placeholder="Nhập chi tiết các bữa ăn hoặc lưu ý dinh dưỡng cho hội viên..."
                value={mealDesc}
                onChange={(e) => setMealDesc(e.target.value)}
              />
            </div>

            <div className="form-actions-row">
              <button type="button" className="btn-form-cancel" onClick={() => { setIsCreatingMeal(false); setEditingMealId(null); }}>
                Hủy bỏ
              </button>
              <button type="submit" className="btn-form-save">
                Lưu Kế Hoạch
              </button>
            </div>
          </form>
        </div>
      );
    }

    return (
      <div>
        <div className="workspace-title-row">
          <h3>Kế Hoạch Ăn Uống</h3>
          {isPTOrAdmin && (
            <button className="btn-form-save" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.88rem' }} onClick={startCreateMeal}>
              <i className="fa-solid fa-plus"></i> Tạo kế hoạch mới
            </button>
          )}
        </div>

        {mealPlans.length === 0 ? (
          <div className="empty-state">
            <i className="fa-solid fa-calendar-xmark"></i>
            <p>Hiện tại chưa có kế hoạch ăn uống nào được chỉ định.</p>
          </div>
        ) : (
          <div className="plans-grid">
            {mealPlans.map((plan) => (
              <div className="plan-card" key={plan.meal_plan_id}>
                <div className="plan-card-header">
                  <div className="plan-card-title">{plan.title}</div>
                  <div className="plan-card-meta">
                    <span>
                      <i className="fa-solid fa-user"></i>
                      Hội viên: {plan.member?.user?.full_name || 'N/A'}
                    </span>
                    <span>
                      <i className="fa-solid fa-user-tie"></i>
                      PT: {plan.trainer?.user?.full_name || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="plan-card-desc">{plan.description || 'Không có mô tả thêm.'}</div>

                <div className="plan-card-stats">
                  <div className="workout-stats-row" style={{ gridTemplateColumns: '1fr' }}>
                    <span>
                      <i className="fa-solid fa-fire-flame-curved"></i>
                      Calo mục tiêu: <strong>{plan.calories_per_day || 0} kcal / ngày</strong>
                    </span>
                  </div>
                </div>

                {isPTOrAdmin && (
                  <div className="plan-card-actions">
                    <button className="btn-card-action btn-edit" onClick={() => startEditMeal(plan)}>
                      <i className="fa-solid fa-pen"></i> Sửa
                    </button>
                    <button className="btn-card-action btn-delete" onClick={() => deleteMealPlan(plan.meal_plan_id)}>
                      <i className="fa-solid fa-trash"></i> Xóa
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ─── Authenticated Dashboard ───────────────────────────────────────────────
  if (token) {
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

            <div className="dash-main-container">
              <div className="dash-left-sidebar">
                <div className="sidebar-menu">
                  <button
                    type="button"
                    className={`sidebar-item ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                  >
                    <i className="fa-solid fa-user"></i> Trang cá nhân
                  </button>
                  <button
                    type="button"
                    className={`sidebar-item ${activeTab === 'workout' ? 'active' : ''}`}
                    onClick={() => setActiveTab('workout')}
                  >
                    <i className="fa-solid fa-dumbbell"></i> Kế hoạch tập
                  </button>
                  <button
                    type="button"
                    className={`sidebar-item ${activeTab === 'meal' ? 'active' : ''}`}
                    onClick={() => setActiveTab('meal')}
                  >
                    <i className="fa-solid fa-utensils"></i> Kế hoạch ăn
                  </button>
                </div>
              </div>

              <div className="dash-workspace">
                {activeTab === 'profile' && renderProfileTab()}
                {activeTab === 'workout' && renderWorkoutTab()}
                {activeTab === 'meal' && renderMealTab()}
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
              <div className="gym-placeholder">
                <i className="fa-solid fa-dumbbell"></i>
                <span>Fx Fitness Center</span>
              </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;