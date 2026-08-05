import { useState } from 'react';
import { fetchWithBusiness } from '../utils/api';

const ServiceForm = ({ token, onCreated, staffOptions = [], businessId = null, allowStaffSelection = true }) => {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [staffIds, setStaffIds] = useState([]);
  const [error, setError] = useState(null);

	const handleStaffChange = (event) => {
		setStaffIds(Array.from(event.target.selectedOptions, (option) => option.value));
	};

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!name) return setError('Name is required');
    try {
    const res = await fetchWithBusiness('/api/services', token, businessId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			name,
			description,
			durationMinutes: Number(duration) || 0,
			price: Number(price) || 0,
      staffIds: allowStaffSelection ? staffIds : undefined,
		}),
      });
      if (!res.ok) {
        const err = await res.text().catch(() => null);
        throw new Error(err || 'Failed to create service');
      }
      const data = await res.json();
      setName('');
      setDuration('');
		setDescription('');
		setPrice('');
		setStaffIds([]);
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
		<label>Description</label>
		<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description for customers" />
	  </div>
      <div className="form-control">
        <label>Duration (mins)</label>
        <input type="number" min="0" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="45" />
      </div>
		<div className="form-control">
			<label>Price</label>
			<input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="49.90" />
		</div>
    {allowStaffSelection ? (
      <div className="form-control">
        <label>Assigned staff</label>
        <select multiple value={staffIds} onChange={handleStaffChange}>
          {staffOptions.map((staff) => <option key={staff._id} value={staff._id}>{staff.name}</option>)}
        </select>
      </div>
    ) : (
      <p>This service will be assigned to your staff profile automatically.</p>
    )}
      {error && <div className="error">{error}</div>}
      <button className="btn" type="submit">Create</button>
    </form>
  );
};

export default ServiceForm;
