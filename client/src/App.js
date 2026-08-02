import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Businesses from './components/Businesses';
import Services from './components/Services';
import Staff from './components/Staff';
import Customers from './components/Customers';
import Appointments from './components/Appointments';
import './index.css';
import { getCurrentUser } from './utils/api';
import { AuthProvider } from './context/AuthContext';

function ProtectedRoute({ children, isAuthenticated }) {
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!token) return setUser(null);
    // try to fetch current user with token
    getCurrentUser(token).then((u) => setUser(u)).catch(() => setUser(null));
  }, [token]);

  const handleLogin = (tok) => {
    localStorage.setItem('token', tok);
    setToken(tok);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthProvider>
      <Router>
      <div className="app-container">
        <Header user={user} onLogout={handleLogout} isAuthenticated={isAuthenticated} />
        <main className="content">
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Dashboard user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/businesses"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Businesses token={token} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/services"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Services token={token} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Staff token={token} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Customers token={token} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Appointments token={token} />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
