import { useEffect, useState } from 'react';
import StaffForm from './StaffForm';
import { fetchWithAuth } from '../utils/api';

const Staff = ({ token }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchWithAuth('/api/staff', token);
        if (!res.ok) throw new Error('Failed to load staff');
        const data = await res.json();
        setItems(data.staff || data.items || []);
      } catch (e) { setError(e.message); }
      setLoading(false);
    };
    load();
  }, [token]);

  const add = (s) => setItems((cur) => [...cur, s]);

  return (
    <div className="card">
      <h2>Staff</h2>
      {loading && <p>Loading...</p>}
      {error && <div className="error">{error}</div>}
      {!loading && !error && (
        <ul>
          {items.map((s) => <li key={s._id || s.id}>{s.name}</li>)}
        </ul>
      )}

      <h3>Create staff</h3>
      <StaffForm token={token} onCreated={add} />
    </div>
  );
};

export default Staff;
