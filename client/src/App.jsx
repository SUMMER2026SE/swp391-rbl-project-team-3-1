import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage/HomePage';
import LoginPage from './pages/LoginPage/LoginPage';

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

  if (token) return <LoginPage />;
  if (currentPath === '/login') return <LoginPage />;
  return <HomePage />;
}

export default App;