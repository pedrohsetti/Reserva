import { useEffect, useState } from 'react';
import ServiceForm from './ServiceForm';
import { fetchWithAuth } from '../utils/api';

const Services = ({ token }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchWithAuth('/api/services', token);
        if (!res.ok) throw new Error('Failed to load services');
        const data = await res.json();
        setServices(data.services || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [token]);

  const addService = (s) => setServices((prev) => [...prev, s]);

  return (
    <div className="card">
      <h2>Services</h2>
      {loading && <p>Loading...</p>}
      {error && <div className="error">{error}</div>}
      {!loading && !error && (
        <ul>
          {services.map((s) => (
            <li key={s._id || s.id}>{s.name || 'Unnamed'}</li>
          ))}
        </ul>
      )}

      <h3>Create service</h3>
      <ServiceForm token={token} onCreated={addService} />
    </div>
  );
};

export default Services;
