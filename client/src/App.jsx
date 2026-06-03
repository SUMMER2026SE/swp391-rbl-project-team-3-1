import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage/HomePage';
import LoginPage from './pages/LoginPage/LoginPage';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    // Lắng nghe sự kiện di chuyển lịch sử trang (back/forward hoặc pushState tự định nghĩa)
    window.addEventListener('popstate', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // Điều hướng đơn giản (Simple State Routing)
  if (currentPath === '/login') {
    return <LoginPage />;
  }

  return <HomePage />;
}

export default App;
