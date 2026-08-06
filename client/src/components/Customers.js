import { useEffect, useState } from 'react';
import CustomerForm from './CustomerForm';
import { fetchWithAuth } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Customers = ({ token }) => {
  const { user } = useAuth();
  const isDev = user?.role === 'dev';
  const [items, setItems] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        if (isDev) {
          const [usersRes, businessesRes] = await Promise.all([
            fetchWithAuth('/api/users', token),
            fetchWithAuth('/api/businesses', token),
          ]);
          if (!usersRes.ok) throw new Error('Failed to load users');
          if (!businessesRes.ok) throw new Error('Failed to load businesses');

          const usersData = await usersRes.json();
          const businessesData = await businessesRes.json();

          setItems(usersData.users || []);
          setBusinesses(businessesData.businesses || []);
        } else {
          const res = await fetchWithAuth('/api/customers', token);
          if (!res.ok) throw new Error('Failed to load customers');
          const data = await res.json();
          setItems(data.customers || data.items || []);
        }
      } catch (e) { setError(e.message); }
      setLoading(false);
    };
    load();
  }, [isDev, token]);

  const add = (c) => setItems((cur) => [...cur, c]);

  const businessNameById = businesses.reduce((acc, business) => {
    acc[String(business._id)] = business.name;
    return acc;
  }, {});

  const filteredItems = isDev
    ? items.filter((entry) => {
      if (selectedBusinessId === 'all') return true;
      if (selectedBusinessId === 'unassigned') return !entry.businessId;
      return String(entry.businessId || '') === selectedBusinessId;
    })
    : items;

  return (
    <div className="card">
      <h2>{isDev ? 'Users' : 'Customers'}</h2>

      {isDev && (
        <div className="form-control" style={{ maxWidth: '420px' }}>
          <label>Business filter</label>
          <select value={selectedBusinessId} onChange={(event) => setSelectedBusinessId(event.target.value)}>
            <option value="all">All businesses</option>
            <option value="unassigned">Unassigned users</option>
            {businesses.map((business) => (
              <option key={business._id} value={business._id}>{business.name}</option>
            ))}
          </select>
        </div>
      )}

      {loading && <p>Loading...</p>}
      {error && <div className="error">{error}</div>}
      {!loading && !error && (
        isDev ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Business</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((entry) => (
                    <tr key={entry._id || entry.id}>
                      <td>{entry.name || 'N/A'}</td>
                      <td>{entry.email || 'N/A'}</td>
                      <td>{entry.role || 'N/A'}</td>
                      <td>{entry.status || 'active'}</td>
                      <td>{entry.businessId ? (businessNameById[String(entry.businessId)] || String(entry.businessId)) : 'Unassigned'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <ul>{items.map((c) => <li key={c._id || c.id}>{c.name}</li>)}</ul>
        )
      )}

      {!isDev && (
        <>
          <h3>Create customer</h3>
          <CustomerForm token={token} onCreated={add} />
        </>
      )}
    </div>
  );
};

export default Customers;
