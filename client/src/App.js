import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import Profile from './pages/Profile';
import Businesses from './components/Businesses';
import Discover from './components/Discover';
import Events from './components/Events';
import Services from './components/Services';
import Staff from './components/Staff';
import Customers from './components/Customers';
import Appointments from './components/Appointments';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import Unauthorized from './pages/Unauthorized';
import './index.css';
import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { token, user, isAuthenticated } = useAuth();

  // Allow all roles to access dashboard (role-specific variants handled inside component)
  // Allow all roles to access profile and appointments
  // Businesses: owner/admin/dev only
  // Staff: owner/admin/dev only
  // Customers: owner/admin/staff/dev only

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/unauthorized" element={<Unauthorized userRole={user?.role} />} />
      
      {/* Dashboard - All roles */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard user={user} token={token} />
          </ProtectedRoute>
        }
      />
      
      {/* Profile - All roles */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      
      {/* Businesses - owner/admin/dev only */}
      <Route
        path="/businesses"
        element={
          <RoleProtectedRoute 
            element={<Businesses token={token} />}
            allowedRoles={['dev', 'admin', 'owner']}
          />
        }
      />

      <Route
        path="/discover"
        element={
          <ProtectedRoute>
            <Discover />
          </ProtectedRoute>
        }
      />
      
      {/* Services - all roles (filtering handled in component) */}
      <Route
        path="/services"
        element={
          <ProtectedRoute>
            <Services token={token} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <Events />
          </ProtectedRoute>
        }
      />
      
      {/* Staff - owner/admin/dev only */}
      <Route
        path="/staff"
        element={
          <RoleProtectedRoute 
            element={<Staff token={token} />}
            allowedRoles={['dev', 'admin', 'owner']}
          />
        }
      />
      
      {/* Customers - owner/admin/staff/dev only */}
      <Route
        path="/customers"
        element={
          <RoleProtectedRoute 
            element={<Customers token={token} />}
            allowedRoles={['dev', 'admin', 'owner', 'staff']}
          />
        }
      />
      
      {/* Appointments - all roles */}
      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <Appointments token={token} />
          </ProtectedRoute>
        }
      />
      
      {/* Default route */}
      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function AppShell() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <Router>
      <div className="app-container">
        <Header user={user} onLogout={logout} isAuthenticated={isAuthenticated} />
        <main className="content">
          <AppRoutes />
        </main>
        <Footer />
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
