import { useEffect, useState } from 'react';
import CustomerForm from './CustomerForm';
import { fetchWithAuth } from '../utils/api';

const Customers = ({ token }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const res = await fetchWithAuth('/api/customers', token);
        if (!res.ok) throw new Error('Failed to load customers');
        const data = await res.json();
        setItems(data.customers || data.items || []);
      } catch (e) { setError(e.message); }
      setLoading(false);
    };
    load();
  }, [token]);

  const add = (c) => setItems((cur) => [...cur, c]);

  return (
    <div className="card">
      <h2>Customers</h2>
      {loading && <p>Loading...</p>}
      {error && <div className="error">{error}</div>}
      {!loading && !error && (
        <ul>{items.map((c) => <li key={c._id || c.id}>{c.name}</li>)}</ul>
      )}
      <h3>Create customer</h3>
      <CustomerForm token={token} onCreated={add} />
    </div>
  );
};

export default Customers;
