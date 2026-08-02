import { NavLink, Link } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const Header = ({ user: userProp, onLogout: onLogoutProp, isAuthenticated: isAuthProp }) => {
  const auth = useContext(AuthContext);
  const user = (auth && auth.user) || userProp;
  const isAuthenticated = (auth && auth.isAuthenticated) ?? isAuthProp;
  const onLogout = (auth && auth.logout) || onLogoutProp;

  const navClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

  return (
    <header className="app-header">
      <div className="header-left">
        <Link to={isAuthenticated ? '/dashboard' : '/login'} className="brand-link">
          <h1>Reserva <span>(Dev)</span></h1>
        </Link>
      </div>
      <nav className="header-nav">
        {isAuthenticated ? (
          <>
            <NavLink to="/dashboard" className={navClass}>Dashboard</NavLink>
            <NavLink to="/businesses" className={navClass}>Businesses</NavLink>
            <NavLink to="/services" className={navClass}>Services</NavLink>
            <NavLink to="/staff" className={navClass}>Staff</NavLink>
            <NavLink to="/customers" className={navClass}>Customers</NavLink>
            <NavLink to="/appointments" className={navClass}>Appointments</NavLink>
            <span className="user-chip">{user?.name || 'Dev user'}</span>
            <button className="btn small" onClick={onLogout}>Logout</button>
          </>
        ) : (
          <NavLink to="/login" className={navClass}>Login</NavLink>
        )}
      </nav>
    </header>
  );
};

export default Header;
