import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage/HomePage';
import LoginPage from './pages/LoginPage/LoginPage';
import CheckoutPage from './pages/CheckoutPage/CheckoutPage';
import MemberDashboard from './pages/dashboard/member/MemberDashboard';
import TrainerDashboard from './pages/dashboard/trainer/TrainerDashboard';
import AdminDashboard from './pages/dashboard/admin/AdminDashboard';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Lắng nghe thay đổi token từ LoginPage (login / logout)
  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem('token') || '');
    };

    window.addEventListener('storage', handleStorageChange);

    // Custom event để catch same-tab changes (vì 'storage' chỉ fire ở tab khác)
    window.addEventListener('authChange', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleStorageChange);
    };
  }, []);

  if (currentPath === '/login') return <LoginPage />;
  if (currentPath === '/checkout') return <CheckoutPage />;
  
  // Developer preview routes for dashboards without login
  if (currentPath === '/trainer-dashboard') {
    return (
      <TrainerDashboard
        token="mock-preview-token"
        userInfo={{
          id: 999,
          fullName: 'HLV Preview Nguyễn Văn A',
          email: 'hlv.preview@fxfitness.com',
          roleId: 2
        }}
        logout={() => {
          window.history.pushState({}, '', '/');
          window.dispatchEvent(new Event('popstate'));
        }}
        avatarUrl=""
        uploadAvatar={() => alert('Đang ở chế độ xem trước (Preview Mode).')}
        fileInputRef={{ current: null }}
        profileData={{
          specialization: 'Fitness, Bodybuilding, Giảm Cân',
          experienceYears: 5,
          description: 'Huấn luyện viên cá nhân chuyên nghiệp với nhiều năm kinh nghiệm thiết lập bài tập và dinh dưỡng.',
          bio: 'Không có gì là không thể nếu bạn có sự kiên trì!'
        }}
        fetchProfile={() => {}}
      />
    );
  }

  if (currentPath === '/member-dashboard') {
    return (
      <MemberDashboard
        token="mock-preview-token"
        userInfo={{
          id: 888,
          fullName: 'Hội Viên Preview Lê Văn B',
          email: 'hoivien.preview@fxfitness.com',
          roleId: 1
        }}
        logout={() => {
          window.history.pushState({}, '', '/');
          window.dispatchEvent(new Event('popstate'));
        }}
        avatarUrl=""
        uploadAvatar={() => alert('Đang ở chế độ xem trước (Preview Mode).')}
        fileInputRef={{ current: null }}
        profileData={{
          height: 175,
          weight: 70,
          gender: 'Nam',
          dob: '2000-01-01',
          goal: 'Tăng cơ giảm mỡ',
          fitness_level: 'Medium'
        }}
        fetchProfile={() => {}}
      />
    );
  }

  if (currentPath === '/admin-dashboard') {
    return (
      <AdminDashboard
        token="mock-preview-token"
        userInfo={{
          id: 777,
          fullName: 'Quản Trị Viên Preview',
          email: 'admin.preview@fxfitness.com',
          roleId: 3
        }}
        logout={() => {
          window.history.pushState({}, '', '/');
          window.dispatchEvent(new Event('popstate'));
        }}
      />
    );
  }

  return <HomePage />;
}

export default App;