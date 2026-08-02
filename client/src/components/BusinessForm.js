import { useState } from 'react';
import { fetchWithAuth } from '../utils/api';

const BusinessForm = ({ token, onCreated }) => {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('active');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!name) return setError('Name is required');
    try {
      const res = await fetchWithAuth('/api/businesses', token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, status, email, phone, address, description }),
      });
      if (!res.ok) {
        const err = await res.text().catch(() => null);
        throw new Error(err || 'Failed to create business');
      }
      const data = await res.json();
      setName('');
      setStatus('active');
      setEmail('');
      setPhone('');
      setAddress('');
      setDescription('');
      // API returns { business: { ... } }
      if (onCreated) onCreated(data.business || data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={onSubmit} className="form">
      <div className="form-control">
        <label>Name *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nordic Spark" />
      </div>
      <div className="form-control">
        <label>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
          <option value="archived">archived</option>
        </select>
      </div>
      <div className="form-control">
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@example.com" />
      </div>
      <div className="form-control">
        <label>Phone</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="040 123 4567" />
      </div>
      <div className="form-control">
        <label>Address</label>
        <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Oulu, Finland" />
      </div>
      <div className="form-control">
        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details for the business" />
      </div>
      {error && <div className="error">{error}</div>}
      <button className="btn" type="submit">Create</button>
    </form>
  );
};

export default BusinessForm;
