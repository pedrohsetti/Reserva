import { useEffect, useState } from 'react';
import BusinessForm from './BusinessForm';
import { fetchWithAuth } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Businesses = ({ token }) => {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [currentBusiness, setCurrentBusiness] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const isDev = user?.role === 'dev';

  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);
      setError(null);
      try {
    const path = isDev ? '/api/businesses' : '/api/businesses/me';
    const res = await fetchWithAuth(path, token);
    if (!res.ok) throw new Error('Failed to load businesses');
    const data = await res.json();
    if (isDev) {
      setBusinesses(data.businesses || []);
      setCurrentBusiness(null);
      setDraft(null);
    } else {
      setCurrentBusiness(data.business || null);
      setDraft(data.business || null);
      setBusinesses(data.business ? [data.business] : []);
    }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBusinesses();
  }, [isDev, token]);

  const addBusiness = (result) => {
    const business = result?.business || result;
    setBusinesses((items) => [...items, business]);
  };

  const handleChange = (field, value) => {
    setDraft((current) => ({ ...(current || {}), [field]: value }));
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!currentBusiness?._id) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/businesses/${currentBusiness._id}`, token, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft?.name || '',
          status: draft?.status || 'active',
          email: draft?.email || '',
          phone: draft?.phone || '',
          address: draft?.address || '',
          description: draft?.description || '',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update business');
      }
      const data = await res.json();
      setCurrentBusiness(data.business);
      setDraft(data.business);
      setBusinesses(data.business ? [data.business] : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

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

    {!isDev && currentBusiness && draft && (
      <>
        <h3>Manage current business</h3>
        <form onSubmit={handleUpdate} className="form">
          <div className="form-control">
            <label>Name</label>
            <input value={draft.name || ''} onChange={(event) => handleChange('name', event.target.value)} />
          </div>
          <div className="form-control">
            <label>Status</label>
            <select value={draft.status || 'active'} onChange={(event) => handleChange('status', event.target.value)}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="archived">archived</option>
            </select>
          </div>
          <div className="form-control">
            <label>Email</label>
            <input type="email" value={draft.email || ''} onChange={(event) => handleChange('email', event.target.value)} />
          </div>
          <div className="form-control">
            <label>Phone</label>
            <input value={draft.phone || ''} onChange={(event) => handleChange('phone', event.target.value)} />
          </div>
          <div className="form-control">
            <label>Address</label>
            <textarea value={draft.address || ''} onChange={(event) => handleChange('address', event.target.value)} />
          </div>
          <div className="form-control">
            <label>Description</label>
            <textarea value={draft.description || ''} onChange={(event) => handleChange('description', event.target.value)} />
          </div>
          <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save business'}</button>
        </form>
      </>
    )}

    {isDev && (
      <>
        <h3>Create business</h3>
        <BusinessForm token={token} onCreated={addBusiness} />
      </>
    )}
    </div>
  );
};

export default Businesses;
