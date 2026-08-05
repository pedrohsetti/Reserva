import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BusinessScopeSelector from './BusinessScopeSelector';
import { fetchEvents, fetchWithAuth, fetchWithBusiness, registerForEvent, unregisterFromEvent } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const emptyEventForm = {
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  location: '',
  capacity: 1,
  staffIds: [],
  price: 0,
  category: '',
  status: 'scheduled',
};

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

const Events = () => {
  const { token, user } = useAuth();
  const [events, setEvents] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [staff, setStaff] = useState([]);
  const [ownStaff, setOwnStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyEventId, setBusyEventId] = useState(null);
  const [eventForm, setEventForm] = useState(emptyEventForm);
  const [editingEventId, setEditingEventId] = useState(null);

  const isDev = user?.role === 'dev';
  const canManageEvents = ['dev', 'admin', 'owner', 'staff'].includes(user?.role);
  const canAssignStaff = ['dev', 'admin', 'owner'].includes(user?.role);
  const effectiveBusinessId = isDev ? selectedBusinessId : user?.businessId;

  useEffect(() => {
    const loadBusinesses = async () => {
      if (!isDev) {
        return;
      }

      try {
        const response = await fetchWithAuth('/api/businesses', token);
        if (!response.ok) {
          throw new Error('Failed to load businesses');
        }
        const data = await response.json();
        setBusinesses(data.businesses || []);
        if (!selectedBusinessId && data.businesses?.length) {
          setSelectedBusinessId(data.businesses[0]._id);
        }
      } catch (err) {
        setError(err.message);
      }
    };

    loadBusinesses();
  }, [isDev, selectedBusinessId, token]);

  useEffect(() => {
    const load = async () => {
    if (!effectiveBusinessId) {
      setEvents([]);
      setStaff([]);
      setOwnStaff(null);
      setLoading(false);
      return;
    }

      setLoading(true);
      setError(null);
      try {
    const data = isDev
      ? await fetchWithBusiness('/api/events', token, effectiveBusinessId).then((response) => response.json())
      : await fetchEvents(token);
    setEvents(data.events || []);
    if (canManageEvents) {
      const staffPath = canAssignStaff ? '/api/staff' : '/api/staff/me';
      const staffRes = await fetchWithBusiness(staffPath, token, effectiveBusinessId);
      if (staffRes.ok) {
        const staffData = await staffRes.json();
        if (canAssignStaff) {
          setStaff(staffData.staff || []);
        } else if (staffData.staff) {
          setOwnStaff(staffData.staff);
          setStaff([staffData.staff]);
        }
      }
    }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token && effectiveBusinessId) {
      load();
    } else {
      setLoading(false);
    }
    }, [canAssignStaff, canManageEvents, effectiveBusinessId, isDev, token]);

    const resetForm = () => {
      setEventForm(emptyEventForm);
      setEditingEventId(null);
    };

    const startEdit = (event) => {
      setEditingEventId(event._id);
      setEventForm({
        title: event.title || '',
        description: event.description || '',
        startDate: toDateInput(event.startDate),
        endDate: toDateInput(event.endDate),
        startTime: event.startTime || '',
        endTime: event.endTime || '',
        location: event.location || '',
        capacity: event.capacity || 1,
        staffIds: (event.staffIds || []).map((member) => String(member._id || member)),
        price: event.price || 0,
        category: event.category || '',
        status: event.status || 'scheduled',
      });
    };

    const submitEvent = async (event) => {
      event.preventDefault();
      setError(null);
      try {
        const path = editingEventId ? `/api/events/${editingEventId}` : '/api/events';
        const method = editingEventId ? 'PUT' : 'POST';
        const response = await fetchWithBusiness(path, token, effectiveBusinessId, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...eventForm,
            capacity: Number(eventForm.capacity) || 1,
            price: Number(eventForm.price) || 0,
          }),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to save event');
        }
        const data = await response.json();
        setEvents((current) => {
          if (editingEventId) {
            return current.map((item) => item._id === editingEventId ? data.event : item);
          }
          return [...current, data.event];
        });
        resetForm();
      } catch (err) {
        setError(err.message);
      }
    };

    const removeEvent = async (eventId) => {
      setBusyEventId(eventId);
      setError(null);
      try {
        const response = await fetchWithBusiness(`/api/events/${eventId}`, token, effectiveBusinessId, { method: 'DELETE' });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to delete event');
        }
        setEvents((current) => current.filter((item) => item._id !== eventId));
      } catch (err) {
        setError(err.message);
      } finally {
        setBusyEventId(null);
      }
    };

  const isRegistered = (event) => {
    return (event.registeredUsers || []).some(
      (entry) => String(entry.customerId?._id || entry.customerId) === String(user?.id) && entry.status === 'registered'
    );
  };

  const handleRegistration = async (eventId, registered) => {
    setBusyEventId(eventId);
    setError(null);
    try {
      const result = registered ? await unregisterFromEvent(eventId, token) : await registerForEvent(eventId, token);
      setEvents((current) => current.map((event) => (event._id === eventId ? result.event : event)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyEventId(null);
    }
  };

  if (!effectiveBusinessId && isDev) {
    return (
      <div className="card">
        <h2>Events</h2>
        <BusinessScopeSelector businesses={businesses} selectedBusinessId={selectedBusinessId} onChange={setSelectedBusinessId} />
      </div>
    );
  }

  if (!user?.businessId && !isDev) {
    return (
      <div className="card">
        <h2>Events</h2>
        <p>You need to join a business before you can access its events.</p>
        <p><Link to="/discover">Go to Discover</Link></p>
      </div>
    );
  }

  return (
    <div className="card dashboard-card">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Events</p>
          <h2>Business Events</h2>
          <p>{user?.role === 'customer' ? 'Review upcoming events and manage your registrations.' : 'Create and manage events for the current business scope.'}</p>
        </div>
      </div>
	  {isDev && <BusinessScopeSelector businesses={businesses} selectedBusinessId={selectedBusinessId} onChange={setSelectedBusinessId} title="Active business" description="Pick a business before managing its events." />}

      {loading && <p>Loading events...</p>}
      {error && <div className="error">{error}</div>}

      {!loading && !error && events.length === 0 && <p>No events are scheduled right now.</p>}

      {!loading && !error && events.length > 0 && (
        <div className="quick-grid">
          {events.map((event) => {
            const registered = isRegistered(event);
            const canManageRegistration = user?.role === 'customer';

            return (
              <div key={event._id} className="quick-card">
                <strong>{event.title}</strong>
						<span>{new Date(event.startDate).toLocaleDateString()} - {event.startTime} to {event.endTime}</span>
                <span>{event.location || 'Location to be confirmed'}</span>
                <span>{event.description || 'No description provided.'}</span>
				<span>{event.staffIds?.length || 0} staff assigned</span>
                {canManageRegistration && (
                  <button
                    className="btn small"
                    type="button"
                    disabled={busyEventId === event._id}
                    onClick={() => handleRegistration(event._id, registered)}
                  >
                    {busyEventId === event._id ? 'Saving...' : registered ? 'Unregister' : 'Register'}
                  </button>
                )}
        {canManageEvents && (
          <div className="page-heading">
            <button className="btn small" type="button" onClick={() => startEdit(event)}>Edit</button>
            <button className="btn small" type="button" disabled={busyEventId === event._id} onClick={() => removeEvent(event._id)}>{busyEventId === event._id ? 'Deleting...' : 'Delete'}</button>
          </div>
        )}
              </div>
            );
          })}
        </div>
      )}

    {canManageEvents && (
      <>
        <h3>{editingEventId ? 'Edit event' : 'Create event'}</h3>
        <form onSubmit={submitEvent} className="form">
          <div className="form-control"><label>Title</label><input value={eventForm.title} onChange={(event) => setEventForm((current) => ({ ...current, title: event.target.value }))} /></div>
          <div className="form-control"><label>Description</label><textarea value={eventForm.description} onChange={(event) => setEventForm((current) => ({ ...current, description: event.target.value }))} /></div>
          <div className="form-control"><label>Start date</label><input type="date" value={eventForm.startDate} onChange={(event) => setEventForm((current) => ({ ...current, startDate: event.target.value }))} /></div>
          <div className="form-control"><label>End date</label><input type="date" value={eventForm.endDate} onChange={(event) => setEventForm((current) => ({ ...current, endDate: event.target.value }))} /></div>
          <div className="form-control"><label>Start time</label><input type="time" value={eventForm.startTime} onChange={(event) => setEventForm((current) => ({ ...current, startTime: event.target.value }))} /></div>
          <div className="form-control"><label>End time</label><input type="time" value={eventForm.endTime} onChange={(event) => setEventForm((current) => ({ ...current, endTime: event.target.value }))} /></div>
          <div className="form-control"><label>Location</label><input value={eventForm.location} onChange={(event) => setEventForm((current) => ({ ...current, location: event.target.value }))} /></div>
          <div className="form-control"><label>Capacity</label><input type="number" min="1" value={eventForm.capacity} onChange={(event) => setEventForm((current) => ({ ...current, capacity: event.target.value }))} /></div>
          <div className="form-control"><label>Price</label><input type="number" min="0" step="0.01" value={eventForm.price} onChange={(event) => setEventForm((current) => ({ ...current, price: event.target.value }))} /></div>
          <div className="form-control"><label>Category</label><input value={eventForm.category} onChange={(event) => setEventForm((current) => ({ ...current, category: event.target.value }))} /></div>
          <div className="form-control"><label>Status</label><select value={eventForm.status} onChange={(event) => setEventForm((current) => ({ ...current, status: event.target.value }))}><option value="scheduled">scheduled</option><option value="completed">completed</option><option value="cancelled">cancelled</option></select></div>
          {canAssignStaff ? (
            <div className="form-control"><label>Assigned staff</label><select multiple value={eventForm.staffIds} onChange={(event) => setEventForm((current) => ({ ...current, staffIds: Array.from(event.target.selectedOptions, (option) => option.value) }))}>{staff.map((member) => <option key={member._id} value={member._id}>{member.name}</option>)}</select></div>
          ) : (
            <p>{ownStaff ? `This event will be assigned to ${ownStaff.name}.` : 'This event will be assigned to your staff profile.'}</p>
          )}
          <div className="page-heading">
            <button className="btn" type="submit">{editingEventId ? 'Save event' : 'Create event'}</button>
            {editingEventId && <button className="btn small" type="button" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </>
    )}
    </div>
  );
};

export default Events;