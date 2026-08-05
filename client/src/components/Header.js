import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import AuthContext from '../context/AuthContext';
import '../styles/Header.css';

const Header = ({ user: userProp, onLogout: onLogoutProp, isAuthenticated: isAuthProp }) => {
  const auth = useContext(AuthContext);
  const user = (auth && auth.user) || userProp;
  const isAuthenticated = (auth && auth.isAuthenticated) ?? isAuthProp;
  const onLogout = (auth && auth.logout) || onLogoutProp;
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    setShowUserMenu(false);
    navigate('/login');
  };

  const handleProfile = () => {
    navigate('/profile');
    setShowUserMenu(false);
  };

  const navClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

  /**
   * Check if user can access a route based on their role
   * Returns true if user can access, false otherwise
   */
  const canAccess = (requiredRoles) => {
    if (!user) return false;
    // Dev role can access everything
    if (user.role === 'dev') return true;
    // Check if user's role is in required roles
    return requiredRoles.includes(user.role);
  };

  const isCustomer = user?.role === 'customer';

  return (
    <header className="app-header">
      <div className="header-left">
        <Link to={isAuthenticated ? '/dashboard' : '/login'} className="brand-link">
          <h1>
            Reserva 
            {user?.role === 'dev' && <span className="dev-badge">(Dev)</span>}
            {user?.role === 'admin' && <span className="admin-badge">(Admin)</span>}
            {user?.role === 'owner' && <span className="owner-badge">(Owner)</span>}
            {user?.role === 'staff' && <span className="staff-badge">(Staff)</span>}
            {user?.role === 'customer' && <span className="customer-badge">(Customer)</span>}
          </h1>
        </Link>
      </div>
      <nav className="header-nav">
        {isAuthenticated ? (
          <>
            {isCustomer ? (
              <>
                {!user?.businessId && <NavLink to="/discover" className={navClass}>Discover</NavLink>}
                <NavLink to="/services" className={navClass}>Services</NavLink>
                {user?.businessId && <NavLink to="/events" className={navClass}>Events</NavLink>}
                <NavLink to="/appointments" className={navClass}>Appointments</NavLink>
                <NavLink to="/profile" className={navClass}>Profile</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/dashboard" className={navClass}>Dashboard</NavLink>

                {canAccess(['dev', 'admin', 'owner']) && (
                  <NavLink to="/businesses" className={navClass}>Businesses</NavLink>
                )}

                {!user?.businessId && (
                  <NavLink to="/discover" className={navClass}>Discover</NavLink>
                )}

                <NavLink to="/services" className={navClass}>Services</NavLink>

                {user?.businessId && <NavLink to="/events" className={navClass}>Events</NavLink>}

                {canAccess(['dev', 'admin', 'owner']) && (
                  <NavLink to="/staff" className={navClass}>Staff</NavLink>
                )}

                {canAccess(['dev', 'admin', 'owner', 'staff']) && (
                  <NavLink to="/customers" className={navClass}>Customers</NavLink>
                )}

                <NavLink to="/appointments" className={navClass}>Appointments</NavLink>
              </>
            )}

            <div className="user-menu-container">
              <button
                className="user-chip"
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-label="User menu"
                aria-expanded={showUserMenu}
              >
                {user?.name || 'User'}
                <span className="menu-icon">v</span>
              </button>
              {showUserMenu && (
                <div className="user-menu-dropdown">
                  <div className="menu-user-info">
                    <strong>{user?.name}</strong>
                    <small>{user?.role?.toUpperCase()}</small>
                  </div>
                  <hr className="menu-divider" />
                  <Link to="/profile" className="menu-item" onClick={handleProfile}>
                    My Profile
                  </Link>
                  <hr className="menu-divider" />
                  <button className="menu-item logout-item" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <NavLink to="/login" className={navClass}>Login</NavLink>
            <NavLink to="/signup" className={navClass}>Sign Up</NavLink>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
