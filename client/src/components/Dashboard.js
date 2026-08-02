import { Link } from 'react-router-dom';

const Dashboard = ({ user }) => {
  return (
    <div className="card dashboard-card">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Workspace</p>
          <h2>Dashboard</h2>
          <p>Welcome {user?.name || 'user'} — a compact control room for the app.</p>
        </div>
        <Link to="/businesses" className="btn small">Go to businesses</Link>
      </div>

      <div className="quick-grid">
        <Link to="/businesses" className="quick-card">
          <strong>Businesses</strong>
          <span>Create and review business records.</span>
        </Link>
        <Link to="/services" className="quick-card">
          <strong>Services</strong>
          <span>Manage services in the active business.</span>
        </Link>
        <Link to="/staff" className="quick-card">
          <strong>Staff</strong>
          <span>Check team members and create new ones.</span>
        </Link>
        <Link to="/customers" className="quick-card">
          <strong>Customers</strong>
          <span>Review customer entries and contacts.</span>
        </Link>
        <Link to="/appointments" className="quick-card">
          <strong>Appointments</strong>
          <span>Book and inspect appointment flow.</span>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
