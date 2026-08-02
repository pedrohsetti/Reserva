import { useState } from 'react';
import { fetchWithAuth } from '../utils/api';

const ServiceForm = ({ token, onCreated }) => {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!name) return setError('Name is required');
    try {
      const res = await fetchWithAuth('/api/services', token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, durationMinutes: Number(duration) || 0 }),
      });
      if (!res.ok) {
        const err = await res.text().catch(() => null);
        throw new Error(err || 'Failed to create service');
      }
      const data = await res.json();
      setName('');
      setDuration('');
      if (onCreated) onCreated(data.service || data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={onSubmit} className="form">
      <div className="form-control">
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Haircut" />
      </div>
      <div className="form-control">
        <label>Duration (mins)</label>
        <input type="number" min="0" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="45" />
      </div>
      {error && <div className="error">{error}</div>}
      <button className="btn" type="submit">Create</button>
    </form>
  );
};

export default ServiceForm;
