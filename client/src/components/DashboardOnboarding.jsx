import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import BusinessForm from './BusinessForm';

const DashboardOnboarding = ({ user }) => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [showBusinessForm, setShowBusinessForm] = useState(false);

  const handleBusinessCreated = (result) => {
    if (result?.token && auth?.login) {
      auth.login(result.token);
    }
    navigate('/dashboard');
  };

  return (
    <div className="card dashboard-card">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Welcome</p>
          <h2>Choose Your Next Step</h2>
          <p>
            Your account is ready, {user?.name}. You can create a business and become its owner,
            or keep this account ready for exploring businesses and bookings.
          </p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-stat-card highlight">
          <div className="stat-content">
            <h3>Create a Business</h3>
            <p>Set up your business now and this account will become the owner account.</p>
            <button className="btn small" type="button" onClick={() => setShowBusinessForm((value) => !value)}>
              {showBusinessForm ? 'Hide form' : 'Create business'}
            </button>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-content">
            <h3>Explore as a Customer</h3>
            <p>
              Browse businesses, services, and events before choosing which business to join.
            </p>
            <Link className="btn small" to="/discover">Start exploring</Link>
          </div>
        </div>
      </div>

      {showBusinessForm && (
        <div className="dashboard-section">
          <h3>Create your business</h3>
          <BusinessForm token={auth?.token} onCreated={handleBusinessCreated} />
        </div>
      )}
    </div>
  );
};

export default DashboardOnboarding;