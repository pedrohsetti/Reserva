import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import BusinessScopeSelector from './BusinessScopeSelector';
import { fetchWithAuth, fetchWithBusiness } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const statusOptions = ['booked', 'confirmed', 'completed', 'cancelled', 'no-show'];
const formatDateInput = (date) => date.toISOString().split('T')[0];

const Appointments = ({ token }) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ customerId: '', staffId: '', serviceId: '' });
  const [refs, setRefs] = useState({ customers: [], staff: [], services: [] });
  const [savingId, setSavingId] = useState(null);
  const [ownStaff, setOwnStaff] = useState(null);
  const [slotRangeStart, setSlotRangeStart] = useState(formatDateInput(new Date()));
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [selectedSlotKey, setSelectedSlotKey] = useState('');

  const isCustomer = user?.role === 'customer';
  const isDev = user?.role === 'dev';
  const canManageAppointments = ['dev', 'admin', 'owner', 'staff'].includes(user?.role);
  const canCreateAppointments = ['dev', 'admin', 'owner', 'staff'].includes(user?.role);
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
        setItems([]);
        setRefs({ customers: [], staff: [], services: [] });
        setLoading(false);
        return;
      }

      setLoading(true); setError(null);
      try {
    const shouldLoadManagementRefs = canCreateAppointments;
    const requests = shouldLoadManagementRefs
      ? [
      fetchWithBusiness('/api/appointments', token, effectiveBusinessId),
      fetchWithBusiness('/api/customers', token, effectiveBusinessId),
      fetchWithBusiness('/api/services', token, effectiveBusinessId),
      canAssignStaff ? fetchWithBusiness('/api/staff', token, effectiveBusinessId) : fetchWithBusiness('/api/staff/me', token, effectiveBusinessId),
      ]
      : [fetchWithBusiness('/api/appointments', token, effectiveBusinessId)];
        const [aRes, cRes, sRes, stRes] = await Promise.all(requests);
        if (!aRes.ok) throw new Error('Failed to load appointments');
        const a = await aRes.json();
        const c = cRes?.ok ? await cRes.json() : { customers: [] };
        const sv = sRes?.ok ? await sRes.json() : { services: [] };
        const st = stRes?.ok ? await stRes.json() : { staff: [] };
        setItems(a.appointments || a.items || []);
        if (canAssignStaff) {
          setRefs({ customers: c.customers || [], services: sv.services || [], staff: st.staff || [] });
          setOwnStaff(null);
        } else {
          setOwnStaff(st.staff || null);
          setRefs({ customers: c.customers || [], services: sv.services || [], staff: st.staff ? [st.staff] : [] });
          setForm((current) => ({ ...current, staffId: st.staff?._id || '' }));
        }
      } catch (e) { setError(e.message); }
      setLoading(false);
    };
    load();
  }, [canAssignStaff, canCreateAppointments, effectiveBusinessId, token, user?.role]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!canCreateAppointments || !form.serviceId || !effectiveBusinessId) {
        setAvailableSlots([]);
        setSelectedSlotKey('');
        return;
      }

      setSlotLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ startDate: slotRangeStart, daysToShow: '7' });
        const response = await fetchWithBusiness(`/api/services/${form.serviceId}/slots?${params.toString()}`, token, effectiveBusinessId);
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to load available slots');
        }
        const data = await response.json();
        setAvailableSlots(data.slots || []);
        setSelectedSlotKey('');
      } catch (err) {
        setError(err.message);
      } finally {
        setSlotLoading(false);
      }
    };

    loadSlots();
  }, [canCreateAppointments, effectiveBusinessId, form.serviceId, slotRangeStart, token]);

  const availableStaff = form.serviceId
		? refs.staff.filter((staff) => (refs.services.find((service) => service._id === form.serviceId)?.staffIds || []).some((member) => String(member._id || member) === String(staff._id)))
		: refs.staff;

  const filteredSlots = useMemo(() => {
    return availableSlots.filter((slot) => !form.staffId || String(slot.staffId) === String(form.staffId));
  }, [availableSlots, form.staffId]);

  const selectedSlot = filteredSlots.find((slot) => `${slot.staffId}:${slot.startAt}` === selectedSlotKey) || null;

  const submit = async (e) => {
    e.preventDefault(); setError(null);
    try {
      if (!selectedSlot || !form.customerId || !form.serviceId || (canAssignStaff && !form.staffId)) {
        throw new Error('Select customer, service, staff, and one available time slot before creating the appointment');
      }
      const res = await fetchWithBusiness('/api/appointments', token, effectiveBusinessId, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: form.customerId,
          staffId: selectedSlot.staffId,
          serviceId: form.serviceId,
          startAt: selectedSlot.startAt,
          endAt: selectedSlot.endAt,
        })
      });
      if (!res.ok) {
        const txt = await res.text().catch(()=>''); throw new Error(txt || 'Failed to create appointment');
      }
      const data = await res.json();
      setItems((cur)=>[...(cur||[]), data.appointment || data]);
      setForm({ customerId: '', staffId: ownStaff?._id || '', serviceId: '' });
      setAvailableSlots([]);
      setSelectedSlotKey('');
    } catch (e) { setError(e.message); }
  };

  const updateStatus = async (appointmentId, status) => {
    setSavingId(appointmentId);
    setError(null);
    try {
      const res = await fetchWithBusiness(`/api/appointments/${appointmentId}`, token, effectiveBusinessId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update appointment');
      }
      const data = await res.json();
      setItems((current) => current.map((item) => item._id === appointmentId ? data.appointment : item));
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const removeAppointment = async (appointmentId) => {
    setSavingId(appointmentId);
    setError(null);
    try {
      const res = await fetchWithBusiness(`/api/appointments/${appointmentId}`, token, effectiveBusinessId, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete appointment');
      }
      setItems((current) => current.filter((item) => item._id !== appointmentId));
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  if (!effectiveBusinessId && isDev) {
    return (
      <div className="card">
        <h2>Appointments</h2>
        <BusinessScopeSelector businesses={businesses} selectedBusinessId={selectedBusinessId} onChange={setSelectedBusinessId} />
      </div>
    );
  }

  if (!user?.businessId && !isDev) {
    return (
      <div className="card">
        <h2>Appointments</h2>
        <p>You need to join a business before you can manage bookings.</p>
        <p><Link to="/discover">Go to Discover</Link></p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>{isCustomer ? 'My Appointments' : 'Appointments'}</h2>
		{isDev && <BusinessScopeSelector businesses={businesses} selectedBusinessId={selectedBusinessId} onChange={setSelectedBusinessId} title="Active business" description="Choose a business before managing its appointments." />}
      {loading && <p>Loading...</p>}
      {error && <div className="error">{error}</div>}
      {!loading && !error && (
        <ul>
          {items.map((appointment) => (
            <li key={appointment._id || appointment.id}>
              {(appointment.startAt ? new Date(appointment.startAt).toLocaleString() : `${appointment.date} ${appointment.time}`)}
              {' '} - {appointment.serviceId?.name || 'Service'}
              {appointment.staffId?.name ? ` with ${appointment.staffId.name}` : ''}
			  {' '} - {appointment.status}
			  {(canManageAppointments || user?.role === 'staff') && (
				<div className="page-heading">
					<select value={appointment.status} disabled={savingId === appointment._id} onChange={(event) => updateStatus(appointment._id, event.target.value)}>
						{statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
					</select>
          {canManageAppointments && <button className="btn small" type="button" disabled={savingId === appointment._id} onClick={() => removeAppointment(appointment._id)}>{savingId === appointment._id ? 'Working...' : 'Delete'}</button>}
				</div>
			  )}
            </li>
          ))}
        </ul>
      )}

      {isCustomer ? (
        <p>New bookings start from <Link to="/services">Services</Link> once you choose what to book.</p>
	  ) : canCreateAppointments ? (
        <>
          <h3>Create appointment</h3>
          <form onSubmit={submit} className="simple-form">
            <div className="form-control"><label>Customer</label>
              <select value={form.customerId} onChange={(e)=>setForm({...form, customerId:e.target.value})}>
                <option value="">Choose</option>
                {refs.customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-control"><label>Staff</label>
              <select value={form.staffId} onChange={(e)=>{ setForm({...form, staffId:e.target.value}); setSelectedSlotKey(''); }} disabled={!canAssignStaff}>
                <option value="">Choose</option>
				{availableStaff.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-control"><label>Service</label>
              <select value={form.serviceId} onChange={(e)=>setForm({...form, serviceId:e.target.value, staffId: canAssignStaff ? '' : ownStaff?._id || ''})}>
                <option value="">Choose</option>
                {refs.services.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-control"><label>Slot search start</label><input type="date" value={slotRangeStart} onChange={(e)=>setSlotRangeStart(e.target.value)} /></div>
            <div className="form-control"><label>Available slots</label>
              <select value={selectedSlotKey} onChange={(event) => setSelectedSlotKey(event.target.value)} disabled={slotLoading || filteredSlots.length === 0}>
                <option value="">{slotLoading ? 'Loading...' : 'Choose a slot'}</option>
                {filteredSlots.map((slot) => <option key={`${slot.staffId}-${slot.startAt}`} value={`${slot.staffId}:${slot.startAt}`}>{`${new Date(slot.startAt).toLocaleString()}${canAssignStaff ? ` - ${slot.staffName}` : ''}`}</option>)}
              </select>
            </div>
            {selectedSlot && <p>Selected slot: {new Date(selectedSlot.startAt).toLocaleString()} with {selectedSlot.staffName}</p>}
            <button className="btn" type="submit">Create</button>
          </form>
        </>
	  ) : (
		<p>Use this page to track your appointments and update their status.</p>
      )}
    </div>
  );
};

export default Appointments;
