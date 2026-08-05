import { useState, useEffect } from 'react';
import { getUserPermissions } from '../utils/api';

const PermissionsDisplay = ({ userId, token }) => {
  const [permissionsData, setPermissionsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        const data = await getUserPermissions(userId, token);
        setPermissionsData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token && userId) {
      fetchPermissions();
    }
  }, [token, userId]);

  const getRoleColor = (role) => {
    const colors = {
      dev: '#ff6b6b',
      admin: '#f59f00',
      owner: '#4c6ef5',
      staff: '#15aabf',
      customer: '#68c281',
    };
    return colors[role] || '#6c757d';
  };

  const formatPermissionName = (permission) => {
    return permission
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="permissions-component">
        <div className="section-header">
          <h2>Permissions & Role</h2>
        </div>
        <p>Loading permissions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="permissions-component">
        <div className="section-header">
          <h2>Permissions & Role</h2>
        </div>
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (!permissionsData) {
    return (
      <div className="permissions-component">
        <div className="section-header">
          <h2>Permissions & Role</h2>
        </div>
        <p>Unable to load permissions</p>
      </div>
    );
  }

  return (
    <div className="permissions-component">
      <div className="section-header">
        <h2>Permissions & Role</h2>
      </div>

      <div className="permissions-content">
        <div className="permission-field">
          <label>Current Role</label>
          <div className="role-badge" style={{ backgroundColor: getRoleColor(permissionsData.role) }}>
            {permissionsData.role.toUpperCase()}
          </div>
        </div>

        <div className="permission-field">
          <label>Account Status</label>
          <p className="status-badge">{permissionsData.status}</p>
        </div>

        {permissionsData.businessId && (
          <div className="permission-field">
            <label>Business ID</label>
            <p className="mono-text">{permissionsData.businessId}</p>
          </div>
        )}

        <div className="permission-field full-width">
          <label>Permissions</label>
          {permissionsData.permissions && permissionsData.permissions.length > 0 ? (
            <div className="permissions-list">
              {permissionsData.permissions.map((permission, idx) => (
                <div key={idx} className="permission-item">
                  <span className="permission-icon">✓</span>
                  <span>{formatPermissionName(permission)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-permissions">No permissions assigned</p>
          )}
        </div>

        <div className="permission-info">
          <small>
            Your permissions are determined by your role. Contact your administrator if you believe you need additional permissions.
          </small>
        </div>
      </div>
    </div>
  );
};

export default PermissionsDisplay;
