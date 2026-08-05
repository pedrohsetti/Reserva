import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  discoverBusinesses,
  discoverEvents,
  discoverServices,
  getMyCustomer,
  joinBusiness,
  registerForEvent,
} from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ServiceBooking from './ServiceBooking';

const Discover = () => {
  const { token, user, login } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [services, setServices] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [busyEventId, setBusyEventId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBusinesses = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await discoverBusinesses(token);
        const items = data.businesses || [];
        setBusinesses(items);
        if (items.length > 0) {
          const preferredBusiness = user?.businessId
            ? items.find((business) => String(business._id) === String(user.businessId))
            : null;
          setSelectedBusinessId(preferredBusiness?._id || items[0]._id);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadBusinesses();
    }
  }, [token, user?.businessId]);

  useEffect(() => {
    const loadDetails = async () => {
      if (!selectedBusinessId) {
        setServices([]);
        setEvents([]);
        return;
      }

      setDetailsLoading(true);
      setError(null);
      setSelectedServiceId('');
      try {
        const [serviceData, eventData] = await Promise.all([
          discoverServices(token, selectedBusinessId),
          discoverEvents(token, selectedBusinessId),
        ]);
        setServices(serviceData.services || []);
        setEvents(eventData.events || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setDetailsLoading(false);
      }
    };

    if (token) {
      loadDetails();
    }
  }, [selectedBusinessId, token]);

  useEffect(() => {
    const loadCustomerProfile = async () => {
      if (!token || user?.role !== 'customer' || !user?.businessId) {
        setCustomerId('');
        return;
      }

      try {
        const data = await getMyCustomer(token);
        setCustomerId(data?.customer?._id || '');
      } catch {
        setCustomerId('');
      }
    };

    loadCustomerProfile();
  }, [token, user?.role, user?.businessId]);

  const selectedBusiness = businesses.find((business) => business._id === selectedBusinessId) || null;

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredBusinesses = useMemo(() => {
    if (!normalizedSearch) {
      return businesses;
    }

    return businesses.filter((business) => {
      const haystack = [business.name, business.description, business.address, business.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [businesses, normalizedSearch]);

  const filteredServices = useMemo(() => {
    if (!normalizedSearch) {
      return services;
    }

    return services.filter((service) => {
      const haystack = [service.name, service.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [services, normalizedSearch]);

  const filteredEvents = useMemo(() => {
    if (!normalizedSearch) {
      return events;
    }

    return events.filter((event) => {
      const haystack = [event.title, event.description, event.location, event.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [events, normalizedSearch]);

  const selectedService = filteredServices.find((service) => service._id === selectedServiceId) || null;

  const isRegisteredForEvent = (event) => {
    return (event.registeredUsers || []).some(
      (entry) => String(entry.customerId?._id || entry.customerId) === String(user?.id) && entry.status === 'registered'
    );
  };

  const ensureBusinessContext = async (businessId) => {
    if (!businessId) {
      throw new Error('Select a business first.');
    }

    if (user?.role !== 'customer') {
      throw new Error('Only customer accounts can book appointments or enroll in events.');
    }

    if (user?.businessId && String(user.businessId) !== String(businessId)) {
      throw new Error('This account is already linked to another business.');
    }

    if (user?.businessId) {
      return token;
    }

    const result = await joinBusiness(businessId, token);
    if (result?.token) {
      login(result.token);
      setSuccessMessage(`Joined ${result?.business?.name || 'business'} successfully.`);
      setError(null);
      return result.token;
    }

    return token;
  };

  const handleJoin = async () => {
    if (!selectedBusinessId) {
      return;
    }

    setJoining(true);
    setError(null);
    setSuccessMessage('');
    try {
      const result = await joinBusiness(selectedBusinessId, token);
      if (result?.token) {
        login(result.token);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  };

  const handleSelectService = async (serviceId) => {
    setError(null);
    setSuccessMessage('');
    try {
      const activeToken = await ensureBusinessContext(selectedBusinessId);
      if (!customerId) {
        const customerData = await getMyCustomer(activeToken);
        setCustomerId(customerData?.customer?._id || '');
      }
      setSelectedServiceId((current) => (current === serviceId ? '' : serviceId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEnroll = async (eventId) => {
    setBusyEventId(eventId);
    setError(null);
    setSuccessMessage('');
    try {
      const activeToken = await ensureBusinessContext(selectedBusinessId);
      const result = await registerForEvent(eventId, activeToken);
      setEvents((current) => current.map((event) => (event._id === eventId ? result.event : event)));
      setSuccessMessage('Enrollment successful.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyEventId(null);
    }
  };

  const handleBooked = () => {
    setSuccessMessage('Appointment booked successfully.');
    setSelectedServiceId('');
  };

  return (
    <div className="card dashboard-card">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Explore</p>
          <h2>Discover Businesses</h2>
          <p>Search businesses, pick a service to book, or enroll in an event.</p>
        </div>
        {selectedBusiness && (
          <button className="btn small" type="button" onClick={handleJoin} disabled={joining}>
            {joining ? 'Joining...' : `Join ${selectedBusiness.name}`}
          </button>
        )}
      </div>

      <div className="form-control" style={{ maxWidth: 560 }}>
        <label htmlFor="discover-search">Search</label>
        <input
          id="discover-search"
          type="search"
          placeholder="Search by business, service, event, category, or location"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      {loading && <p>Loading businesses...</p>}
      {error && <div className="error">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {!loading && businesses.length === 0 && <p>No active businesses are available right now.</p>}

      {!loading && filteredBusinesses.length === 0 && businesses.length > 0 && (
        <p>No businesses matched your search. Try a different keyword.</p>
      )}

      {!loading && filteredBusinesses.length > 0 && (
        <>
          <div className="dashboard-grid">
            {filteredBusinesses.map((business) => (
              <button
                key={business._id}
                type="button"
                className={`dashboard-stat-card${business._id === selectedBusinessId ? ' highlight' : ''}`}
                onClick={() => setSelectedBusinessId(business._id)}
                style={{ textAlign: 'left' }}
              >
                <div className="stat-content">
                  <h3>{business.name}</h3>
                  <p>{business.description || 'No description yet.'}</p>
                  <small>{business.address || business.email || 'Contact details coming soon.'}</small>
                </div>
              </button>
            ))}
          </div>

          <div className="dashboard-section">
            <h3>{selectedBusiness?.name || 'Business'} Overview</h3>
            {detailsLoading && <p>Loading services and events...</p>}
            {!detailsLoading && (
              <div className="dashboard-grid">
                <div className="dashboard-stat-card">
                  <div className="stat-content">
                    <h3>Services</h3>
                    {filteredServices.length === 0 ? (
                      <p>No active services yet.</p>
                    ) : (
                      <div className="quick-grid">
                        {filteredServices.map((service) => {
                          const isSelected = service._id === selectedServiceId;
                          return (
                            <div key={service._id} className="quick-card">
                              <strong>{service.name}</strong>
                              <span>{service.description || 'No description provided.'}</span>
                              <span>{service.durationMinutes} min - ${Number(service.price || 0).toFixed(2)}</span>
                              <button
                                className="btn small"
                                type="button"
                                onClick={() => handleSelectService(service._id)}
                              >
                                {isSelected ? 'Hide booking' : 'Book appointment'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="dashboard-stat-card">
                  <div className="stat-content">
                    <h3>Events</h3>
                    {filteredEvents.length === 0 ? (
                      <p>No scheduled events yet.</p>
                    ) : (
                      <div className="quick-grid">
                        {filteredEvents.map((event) => {
                          const registered = isRegisteredForEvent(event);
                          return (
                            <div key={event._id} className="quick-card">
                              <strong>{event.title}</strong>
                              <span>{new Date(event.startDate).toLocaleDateString()} - {event.startTime} to {event.endTime}</span>
                              <span>{event.location || 'Location to be confirmed'}</span>
                              <span>{event.description || 'No description provided.'}</span>
                              <button
                                className="btn small"
                                type="button"
                                disabled={registered || busyEventId === event._id}
                                onClick={() => handleEnroll(event._id)}
                              >
                                {busyEventId === event._id ? 'Enrolling...' : registered ? 'Enrolled' : 'Enroll'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!detailsLoading && selectedService && customerId && (
              <ServiceBooking
                service={selectedService}
                token={token}
                customerId={customerId}
                onBooked={handleBooked}
              />
            )}

            {!detailsLoading && selectedService && !customerId && (
              <p>Select a customer-enabled account in this business before booking.</p>
            )}

            {user?.businessId && (
              <p className="inline-link-row">
                <span>Need full management views?</span>
                <Link to="/services">Services</Link>
                <Link to="/events">Events</Link>
                <Link to="/appointments">Appointments</Link>
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Discover;