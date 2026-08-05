import { useEffect, useState } from 'react';
import StaffForm from './StaffForm';
import BusinessScopeSelector from './BusinessScopeSelector';
import { fetchWithAuth, fetchWithBusiness } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const createDraft = (staff) => ({
  name: staff.name || '',
  email: staff.email || '',
  phone: staff.phone || '',
  status: staff.status || 'active',
  serviceIds: (staff.serviceIds || []).map((service) => String(service._id || service)),
  workingHours: dayNames.reduce((hours, day) => {
    hours[day] = {
      start: staff.workingHours?.[day]?.start || '',
      end: staff.workingHours?.[day]?.end || '',
    };
    return hours;
  }, {}),
  daysOff: (staff.daysOff || []).map((date) => new Date(date).toISOString().slice(0, 10)).join(', '),
});

const Staff = ({ token }) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [services, setServices] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const isDev = user?.role === 'dev';
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
      setItems([]);
      setServices([]);
      setDrafts({});
      setLoading(false);
      return;
    }

      setLoading(true);
      setError(null);
      try {
    const [staffRes, servicesRes] = await Promise.all([
      fetchWithBusiness('/api/staff', token, effectiveBusinessId),
      fetchWithBusiness('/api/services', token, effectiveBusinessId),
    ]);
    if (!staffRes.ok) throw new Error('Failed to load staff');
    if (!servicesRes.ok) throw new Error('Failed to load services');
    const data = await staffRes.json();
    const serviceData = await servicesRes.json();
    const nextItems = data.staff || data.items || [];
    setItems(nextItems);
    setServices(serviceData.services || []);
    setDrafts(nextItems.reduce((accumulator, staff) => {
      accumulator[staff._id] = createDraft(staff);
      return accumulator;
    }, {}));
      } catch (e) { setError(e.message); }
      setLoading(false);
    };
    load();
  }, [effectiveBusinessId, token]);

  const add = (staff) => {
    setItems((current) => [...current, staff]);
    setDrafts((current) => ({ ...current, [staff._id]: createDraft(staff) }));
  };

  const updateDraft = (staffId, field, value) => {
    setDrafts((current) => ({
      ...current,
      [staffId]: { ...current[staffId], [field]: value },
    }));
  };

  const updateHours = (staffId, day, edge, value) => {
    setDrafts((current) => ({
      ...current,
      [staffId]: {
        ...current[staffId],
        workingHours: {
          ...current[staffId].workingHours,
          [day]: {
            ...current[staffId].workingHours[day],
            [edge]: value,
          },
        },
      },
    }));
  };

  const saveStaff = async (staffId) => {
    const draft = drafts[staffId];
    setSavingId(staffId);
    setError(null);
    try {
      const detailRes = await fetchWithBusiness(`/api/staff/${staffId}`, token, effectiveBusinessId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft.name,
          email: draft.email,
          phone: draft.phone,
          status: draft.status,
          serviceIds: draft.serviceIds,
        }),
      });
      if (!detailRes.ok) {
        const err = await detailRes.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update staff');
      }

      const availabilityRes = await fetchWithBusiness(`/api/staff/${staffId}/availability`, token, effectiveBusinessId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workingHours: draft.workingHours,
          daysOff: draft.daysOff
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean),
        }),
      });
      if (!availabilityRes.ok) {
        const err = await availabilityRes.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update availability');
      }

      const refreshedStaffRes = await fetchWithBusiness(`/api/staff/${staffId}`, token, effectiveBusinessId);
      const refreshedStaff = await refreshedStaffRes.json();
      setItems((current) => current.map((item) => item._id === staffId ? refreshedStaff.staff : item));
      setDrafts((current) => ({ ...current, [staffId]: createDraft(refreshedStaff.staff) }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const removeStaff = async (staffId) => {
    setSavingId(staffId);
    setError(null);
    try {
      const res = await fetchWithBusiness(`/api/staff/${staffId}`, token, effectiveBusinessId, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete staff');
      }
      setItems((current) => current.filter((item) => item._id !== staffId));
      setDrafts((current) => {
        const next = { ...current };
        delete next[staffId];
        return next;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="card">
      <h2>Staff</h2>
		{isDev && !effectiveBusinessId && <BusinessScopeSelector businesses={businesses} selectedBusinessId={selectedBusinessId} onChange={setSelectedBusinessId} title="Active business" description="Choose a business to manage its staff and availability." />}
		{isDev && !effectiveBusinessId && <p>Select a business to continue.</p>}
		{!(isDev && !effectiveBusinessId) && (
			<>
		{isDev && <BusinessScopeSelector businesses={businesses} selectedBusinessId={selectedBusinessId} onChange={setSelectedBusinessId} title="Active business" description="Choose a business to manage its staff and availability." />}
      {loading && <p>Loading...</p>}
      {error && <div className="error">{error}</div>}
      {!loading && !error && (
    <div className="quick-grid">
      {items.map((staff) => {
        const draft = drafts[staff._id];
        const assignedServices = services.filter((service) => draft?.serviceIds?.includes(String(service._id)));

        return (
          <div key={staff._id || staff.id} className="quick-card">
            <div className="form-control"><label>Name</label><input value={draft?.name || ''} onChange={(event) => updateDraft(staff._id, 'name', event.target.value)} /></div>
            <div className="form-control"><label>Email</label><input type="email" value={draft?.email || ''} onChange={(event) => updateDraft(staff._id, 'email', event.target.value)} /></div>
            <div className="form-control"><label>Phone</label><input value={draft?.phone || ''} onChange={(event) => updateDraft(staff._id, 'phone', event.target.value)} /></div>
            <div className="form-control">
              <label>Status</label>
              <select value={draft?.status || 'active'} onChange={(event) => updateDraft(staff._id, 'status', event.target.value)}>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </div>
            <div className="form-control">
              <label>Services</label>
              <select
                multiple
                value={draft?.serviceIds || []}
                onChange={(event) => updateDraft(staff._id, 'serviceIds', Array.from(event.target.selectedOptions, (option) => option.value))}
              >
                {services.map((service) => <option key={service._id} value={service._id}>{service.name}</option>)}
              </select>
            </div>
            <p>{assignedServices.length > 0 ? assignedServices.map((service) => service.name).join(', ') : 'No services assigned yet.'}</p>
            <div className="form-control">
              <label>Days off</label>
              <input value={draft?.daysOff || ''} onChange={(event) => updateDraft(staff._id, 'daysOff', event.target.value)} placeholder="2026-08-12, 2026-08-19" />
            </div>
            <div>
              <h4>Working hours</h4>
              {dayNames.map((day) => (
                <div key={day} className="form-control">
                  <label>{day}</label>
                  <div className="page-heading">
                    <input type="time" value={draft?.workingHours?.[day]?.start || ''} onChange={(event) => updateHours(staff._id, day, 'start', event.target.value)} />
                    <input type="time" value={draft?.workingHours?.[day]?.end || ''} onChange={(event) => updateHours(staff._id, day, 'end', event.target.value)} />
                  </div>
                </div>
              ))}
            </div>
            <div className="page-heading">
              <button className="btn" type="button" disabled={savingId === staff._id} onClick={() => saveStaff(staff._id)}>{savingId === staff._id ? 'Saving...' : 'Save staff'}</button>
              <button className="btn small" type="button" disabled={savingId === staff._id} onClick={() => removeStaff(staff._id)}>Delete</button>
            </div>
          </div>
        );
      })}
    </div>
      )}

      <h3>Create staff</h3>
		<StaffForm token={token} onCreated={add} services={services} businessId={effectiveBusinessId} />
			</>
		)}
    </div>
  );
};

export default Staff;
