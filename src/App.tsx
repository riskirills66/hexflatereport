import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import MemberLogin from './components/MemberLogin';
import WebReportDashboard from './components/WebReportDashboard';

function App() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isMemberAuthenticated, setIsMemberAuthenticated] = useState(false);
  const [adminAuthSeed, setAdminAuthSeed] = useState('');
  const [memberAuthSeed, setMemberAuthSeed] = useState('');

  useEffect(() => {
    // Check if admin is already authenticated
    const storedAdminAuthSeed = localStorage.getItem('adminAuthSeed');
    if (storedAdminAuthSeed) {
      setIsAdminAuthenticated(true);
      setAdminAuthSeed(storedAdminAuthSeed);
    }

    // Check if member is already authenticated
    const storedMemberAuthSeed = localStorage.getItem('memberAuthSeed');
    if (storedMemberAuthSeed) {
      setIsMemberAuthenticated(true);
      setMemberAuthSeed(storedMemberAuthSeed);
    }
  }, []);

  const handleAdminLoginSuccess = (newAuthSeed: string) => {
    setIsAdminAuthenticated(true);
    setAdminAuthSeed(newAuthSeed);
  };

  const handleMemberLoginSuccess = (newAuthSeed: string) => {
    setIsMemberAuthenticated(true);
    setMemberAuthSeed(newAuthSeed);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('adminAuthSeed');
    localStorage.removeItem('adminSessionKey');
    setIsAdminAuthenticated(false);
    setAdminAuthSeed('');
  };

  const handleMemberLogout = () => {
    localStorage.removeItem('memberAuthSeed');
    localStorage.removeItem('memberSessionKey');
    setIsMemberAuthenticated(false);
    setMemberAuthSeed('');
  };

  return (
    <div className="App">
      <Routes>
        {/* Admin Routes */}
        <Route 
          path="/adminlogin" 
          element={
            isAdminAuthenticated ? (
              <Navigate to="/admin" replace />
            ) : (
              <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />
            )
          } 
        />
        <Route 
          path="/admin" 
          element={
            isAdminAuthenticated ? (
              <AdminDashboard 
                authSeed={adminAuthSeed}
                onLogout={handleAdminLogout}
              />
            ) : (
              <Navigate to="/adminlogin" replace />
            )
          } 
        />

        {/* Member Routes */}
        <Route 
          path="/login" 
          element={
            isMemberAuthenticated ? (
              <Navigate to="/webreport" replace />
            ) : (
              <MemberLogin onLoginSuccess={handleMemberLoginSuccess} />
            )
          } 
        />
        <Route 
          path="/webreport" 
          element={
            isMemberAuthenticated ? (
              <WebReportDashboard 
                authSeed={memberAuthSeed}
                onLogout={handleMemberLogout}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        {/* Default Route - Redirect to login */}
        <Route 
          path="/" 
          element={<Navigate to="/login" replace />}
        />
        
        <Route 
          path="*" 
          element={<Navigate to="/login" replace />} 
        />
      </Routes>
    </div>
  );
}

export default App;
