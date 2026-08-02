import { useEffect, useState } from 'react';
import BusinessForm from './BusinessForm';
import { fetchWithAuth } from '../utils/api';

const Businesses = ({ token }) => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchWithAuth('/api/businesses', token);
        if (!res.ok) throw new Error('Failed to load businesses');
        const data = await res.json();
        // API returns { businesses: [...] }
        setBusinesses(data.businesses || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBusinesses();
  }, [token]);

  const addBusiness = (b) => setBusinesses((s) => [...s, b]);

  return (
    <div className="card">
      <h2>Businesses</h2>
      {loading && <p>Loading...</p>}
      {error && <div className="error">{error}</div>}
      {!loading && !error && (
        <ul>
          {businesses.map((b) => (
            <li key={b._id || b.id}>{b.name || b.title || 'Unnamed'}</li>
          ))}
        </ul>
      )}

      <h3>Create business</h3>
      <BusinessForm token={token} onCreated={addBusiness} />
    </div>
  );
};

export default Businesses;
