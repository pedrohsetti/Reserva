import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import ServiceForm from './ServiceForm';
import ServiceBooking from './ServiceBooking';
import BusinessScopeSelector from './BusinessScopeSelector';
import { fetchWithAuth, fetchWithBusiness, getMyCustomer } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const buildServiceDraft = (service) => ({
  name: service.name || '',
  description: service.description || '',
  durationMinutes: service.durationMinutes || 0,
  price: service.price || 0,
  status: service.status || 'active',
  staffIds: (service.staffIds || []).map((member) => String(member._id || member)),
});

const Services = ({ token }) => {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [customerRecord, setCustomerRecord] = useState(null);
  const [staff, setStaff] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [customerLoading, setCustomerLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [bookingMessage, setBookingMessage] = useState('');
  const [savingId, setSavingId] = useState(null);

  const isCustomer = user?.role === 'customer';
  const isDev = user?.role === 'dev';
  const isStaff = user?.role === 'staff';
  const canManageServices = ['dev', 'admin', 'owner', 'staff'].includes(user?.role);
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
    const loadServices = async () => {
      if (!effectiveBusinessId) {
        setServices([]);
        setStaff([]);
        setDrafts({});
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const requests = [fetchWithBusiness('/api/services', token, effectiveBusinessId)];
        if (canAssignStaff) {
          requests.push(fetchWithBusiness('/api/staff', token, effectiveBusinessId));
        } else if (isStaff) {
          requests.push(fetchWithBusiness('/api/staff/me', token, effectiveBusinessId));
        }

        const [servicesResponse, staffResponse] = await Promise.all(requests);
        if (!servicesResponse.ok) {
          throw new Error('Failed to load services');
        }

        const data = await servicesResponse.json();
        const nextServices = data.services || [];
        setServices(nextServices);
        setDrafts(nextServices.reduce((accumulator, service) => {
          accumulator[service._id] = buildServiceDraft(service);
          return accumulator;
        }, {}));

        if (staffResponse?.ok) {
          const staffData = await staffResponse.json();
          setStaff(Array.isArray(staffData.staff) ? staffData.staff : staffData.staff ? [staffData.staff] : []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, [canAssignStaff, effectiveBusinessId, isStaff, token]);

  useEffect(() => {
    const loadCustomerRecord = async () => {
      if (!isCustomer || !user?.businessId) {
        setCustomerRecord(null);
        return;
      }

      setCustomerLoading(true);
      try {
        const data = await getMyCustomer(token);
        setCustomerRecord(data.customer || null);
      } catch (err) {
        setError(err.message);
      } finally {
        setCustomerLoading(false);
      }
    };

    loadCustomerRecord();
  }, [isCustomer, token, user?.businessId]);

  const addService = (service) => {
    setServices((current) => [...current, service]);
    setDrafts((current) => ({ ...current, [service._id]: buildServiceDraft(service) }));
  };

  const updateDraft = (serviceId, field, value) => {
    setDrafts((current) => ({
      ...current,
      [serviceId]: { ...current[serviceId], [field]: value },
    }));
  };

  const saveService = async (serviceId) => {
    setSavingId(serviceId);
    setError(null);
    try {
      const draft = drafts[serviceId];
      const payload = canAssignStaff ? draft : {
        name: draft.name,
        description: draft.description,
        durationMinutes: draft.durationMinutes,
        price: draft.price,
        status: draft.status,
      };

      const response = await fetchWithBusiness(`/api/services/${serviceId}`, token, effectiveBusinessId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update service');
      }

      const data = await response.json();
      setServices((current) => current.map((item) => item._id === serviceId ? data.service : item));
      setDrafts((current) => ({ ...current, [serviceId]: buildServiceDraft(data.service) }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const removeService = async (serviceId) => {
    setSavingId(serviceId);
    setError(null);
    try {
      const response = await fetchWithBusiness(`/api/services/${serviceId}`, token, effectiveBusinessId, { method: 'DELETE' });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete service');
      }
      setServices((current) => current.filter((service) => service._id !== serviceId));
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const handleBooked = (appointment) => {
    setBookingMessage(`Booking confirmed for ${new Date(appointment.startAt).toLocaleString()}.`);
    setSelectedServiceId(null);
  };

  const serviceStaffMap = useMemo(() => {
    return staff.reduce((map, member) => {
      map[String(member._id)] = member.name;
      return map;
    }, {});
  }, [staff]);

  if (!effectiveBusinessId && isDev) {
    return (
      <div className="card">
        <h2>Services</h2>
        <BusinessScopeSelector businesses={businesses} selectedBusinessId={selectedBusinessId} onChange={setSelectedBusinessId} />
      </div>
    );
  }

  if (!user?.businessId && !isDev) {
    return (
      <div className="card">
        <h2>Services</h2>
        <p>Join a business first to access its services.</p>
        <p><Link to="/discover">Go to Discover</Link></p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="page-heading">
        <div>
          <h2>Services</h2>
          <p>{isCustomer ? 'Choose a service, review the next available times, and confirm your booking.' : 'Create and manage services for the current business scope.'}</p>
        </div>
        {isCustomer && <Link className="btn small" to="/appointments">View my appointments</Link>}
      </div>
      {isDev && <BusinessScopeSelector businesses={businesses} selectedBusinessId={selectedBusinessId} onChange={setSelectedBusinessId} title="Active business" description="Pick a business before managing its services." />}
      {loading && <p>Loading...</p>}
      {error && <div className="error">{error}</div>}
      {bookingMessage && <div className="success-message">{bookingMessage}</div>}
      {isCustomer && customerLoading && <p>Loading your customer profile...</p>}
      {isCustomer && !customerLoading && !customerRecord && !error && <p>Your customer record is not ready yet for bookings. Contact the business team if this continues.</p>}

      {!loading && !error && isCustomer && (
        <div className="service-grid">
          {services.map((service) => (
            <div key={service._id || service.id} className="service-card">
              <div className="service-card-header">
                <div>
                  <h3>{service.name || 'Unnamed'}</h3>
                  <p>{service.description || 'Service details will appear here.'}</p>
                </div>
                <button className="btn small" type="button" disabled={!customerRecord} onClick={() => setSelectedServiceId((current) => current === service._id ? null : service._id)}>
                  {selectedServiceId === service._id ? 'Hide booking' : 'Book'}
                </button>
              </div>
              <div className="service-meta">
                <span>{service.durationMinutes} min</span>
                <span>${Number(service.price || 0).toFixed(2)}</span>
                <span>{service.staffIds?.length || 0} staff assigned</span>
              </div>
              {selectedServiceId === service._id && customerRecord && <ServiceBooking service={service} token={token} customerId={customerRecord._id} onBooked={handleBooked} />}
            </div>
          ))}
        </div>
      )}

      {!loading && !error && !isCustomer && (
        <div className="quick-grid">
          {services.map((service) => {
            const draft = drafts[service._id] || buildServiceDraft(service);
            const assignedNames = (service.staffIds || [])
              .map((member) => typeof member === 'object' ? member.name : serviceStaffMap[String(member)])
              .filter(Boolean)
              .join(', ');

            return (
              <div key={service._id || service.id} className="quick-card">
                <strong>{service.name || 'Unnamed'}</strong>
                <span>{service.description || 'No description provided.'}</span>
                <span>{service.durationMinutes} min · ${Number(service.price || 0).toFixed(2)}</span>
                <span>{assignedNames || (isStaff ? 'Assigned to you' : 'No staff assigned')}</span>
                <div className="form-control"><label>Name</label><input value={draft.name || ''} onChange={(event) => updateDraft(service._id, 'name', event.target.value)} /></div>
                <div className="form-control"><label>Description</label><textarea value={draft.description || ''} onChange={(event) => updateDraft(service._id, 'description', event.target.value)} /></div>
                <div className="form-control"><label>Duration</label><input type="number" min="0" value={draft.durationMinutes || 0} onChange={(event) => updateDraft(service._id, 'durationMinutes', Number(event.target.value))} /></div>
                <div className="form-control"><label>Price</label><input type="number" min="0" step="0.01" value={draft.price || 0} onChange={(event) => updateDraft(service._id, 'price', Number(event.target.value))} /></div>
                <div className="form-control">
                  <label>Status</label>
                  <select value={draft.status || 'active'} onChange={(event) => updateDraft(service._id, 'status', event.target.value)}>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </div>
                {canAssignStaff && (
                  <div className="form-control">
                    <label>Assigned staff</label>
                    <select multiple value={draft.staffIds || []} onChange={(event) => updateDraft(service._id, 'staffIds', Array.from(event.target.selectedOptions, (option) => option.value))}>
                      {staff.map((member) => <option key={member._id} value={member._id}>{member.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="page-heading">
                  <button className="btn" type="button" disabled={savingId === service._id} onClick={() => saveService(service._id)}>{savingId === service._id ? 'Saving...' : 'Save service'}</button>
                  <button className="btn small" type="button" disabled={savingId === service._id} onClick={() => removeService(service._id)}>{savingId === service._id ? 'Working...' : 'Delete'}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {canManageServices ? (
        <>
          <h3>Create service</h3>
          <ServiceForm token={token} onCreated={addService} staffOptions={staff} businessId={effectiveBusinessId} allowStaffSelection={canAssignStaff} />
        </>
      ) : (
        <p>Services available in your business are listed above.</p>
      )}
    </div>
  );
};

export default Services;
