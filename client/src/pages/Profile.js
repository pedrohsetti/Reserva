import { useContext, useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import ChangePassword from '../components/ChangePassword';
import DeleteAccount from '../components/DeleteAccount';
import PermissionsDisplay from '../components/PermissionsDisplay';
import { fetchWithAuth, getCurrentUser } from '../utils/api';
import '../styles/Profile.css';

const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const buildAvailabilityDraft = (staff) => ({
  workingHours: dayNames.reduce((hours, day) => {
    hours[day] = {
      start: staff?.workingHours?.[day]?.start || '',
      end: staff?.workingHours?.[day]?.end || '',
    };
    return hours;
  }, {}),
  daysOff: (staff?.daysOff || []).map((date) => new Date(date).toISOString().slice(0, 10)).join(', '),
});

const Profile = () => {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [staffProfile, setStaffProfile] = useState(null);
  const [availabilityDraft, setAvailabilityDraft] = useState(buildAvailabilityDraft(null));
  const [availabilitySaving, setAvailabilitySaving] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const data = await getCurrentUser(token);
        setProfileData(data);
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchUserData();
    }
  }, [token]);

  useEffect(() => {
    const loadStaffProfile = async () => {
      if (user?.role !== 'staff' || !token) {
        setStaffProfile(null);
        return;
      }

      try {
        const response = await fetchWithAuth('/api/staff/me', token);
        if (!response.ok) {
          throw new Error('Failed to load staff availability');
        }
        const data = await response.json();
        setStaffProfile(data.staff);
        setAvailabilityDraft(buildAvailabilityDraft(data.staff));
      } catch (err) {
        setError(err.message);
      }
    };

    loadStaffProfile();
  }, [token, user?.role]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update profile');
      }

      const updatedData = await res.json();
      setProfileData(updatedData.user);
      setSuccess('Profile updated successfully');
      setEditMode(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteAccountSuccess = () => {
    setSuccess('Account deleted successfully. Redirecting to login...');
    setTimeout(() => {
      logout();
      navigate('/login');
    }, 2000);
  };

  const handleAvailabilityChange = (day, edge, value) => {
    setAvailabilityDraft((current) => ({
      ...current,
      workingHours: {
        ...current.workingHours,
        [day]: {
          ...current.workingHours[day],
          [edge]: value,
        },
      },
    }));
  };

  const saveAvailability = async () => {
    if (!staffProfile?._id) {
      return;
    }

    setAvailabilitySaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetchWithAuth(`/api/staff/${staffProfile._id}/availability`, token, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workingHours: availabilityDraft.workingHours,
          daysOff: availabilityDraft.daysOff.split(',').map((value) => value.trim()).filter(Boolean),
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to save availability');
      }
      const data = await response.json();
      setStaffProfile((current) => ({ ...current, workingHours: data.workingHours, daysOff: data.daysOff }));
      setAvailabilityDraft(buildAvailabilityDraft({ workingHours: data.workingHours, daysOff: data.daysOff }));
      setSuccess('Working hours updated successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setAvailabilitySaving(false);
    }
  };

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return <div className="profile-container"><p>Loading profile...</p></div>;
  }

  if (!profileData) {
    return <div className="profile-container"><p>Unable to load profile data</p></div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="profile-grid">
        {/* Main Profile Section */}
        <div className="profile-section">
          <div className="section-header">
            <h2>Profile Information</h2>
            {!editMode && (
              <button className="btn small" onClick={() => setEditMode(true)}>
                Edit
              </button>
            )}
          </div>

          {editMode ? (
            <form onSubmit={handleSaveProfile} className="profile-form">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input type="email" value={profileData.email} disabled />
                <small>Email changes are not available in this version</small>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn primary">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => {
                    setEditMode(false);
                    setFormData({
                      name: profileData.name || '',
                      phone: profileData.phone || '',
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-view">
              <div className="profile-field">
                <label>Name</label>
                <p>{profileData.name}</p>
              </div>
              <div className="profile-field">
                <label>Email</label>
                <p>{profileData.email}</p>
              </div>
              <div className="profile-field">
                <label>Phone</label>
                <p>{profileData.phone || 'Not provided'}</p>
              </div>
              <div className="profile-field">
                <label>Account Created</label>
                <p>{new Date(profileData.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Permissions Section */}
        <div className="profile-section">
          <PermissionsDisplay userId={user.id} token={token} />
        </div>

    {user?.role === 'staff' && (
      <div className="profile-section">
        <div className="section-header">
          <h2>Working Days and Hours</h2>
        </div>
        <p>Set the days and hours customers can use when booking appointments with you.</p>
        <div className="form-group">
          <label>Days off</label>
          <input value={availabilityDraft.daysOff} onChange={(event) => setAvailabilityDraft((current) => ({ ...current, daysOff: event.target.value }))} placeholder="2026-08-12, 2026-08-19" />
        </div>
        {dayNames.map((day) => (
          <div key={day} className="form-group">
            <label>{day}</label>
            <div className="form-actions">
              <input type="time" value={availabilityDraft.workingHours[day].start} onChange={(event) => handleAvailabilityChange(day, 'start', event.target.value)} />
              <input type="time" value={availabilityDraft.workingHours[day].end} onChange={(event) => handleAvailabilityChange(day, 'end', event.target.value)} />
            </div>
          </div>
        ))}
        <div className="form-actions">
          <button type="button" className="btn primary" disabled={availabilitySaving} onClick={saveAvailability}>{availabilitySaving ? 'Saving...' : 'Save working hours'}</button>
        </div>
      </div>
    )}

        {/* Security Section */}
        <div className="profile-section">
          <ChangePassword userId={user.id} token={token} />
        </div>

        {/* Logout + Delete Account stacked in one column */}
        <div className="profile-column-stack">
          <div className="profile-section logout-zone">
            <div className="section-header">
              <h2>Session</h2>
            </div>
            <div className="logout-section">
            <p className="logout-description">Sign out of your account on this device.</p>
            <button
              className="btn"
              onClick={() => { logout(); navigate('/login'); }}
            >
              Log Out
            </button>
            </div>
          </div>

          <div className="profile-section danger-zone">
            <DeleteAccount userId={user.id} token={token} onSuccess={handleDeleteAccountSuccess} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
