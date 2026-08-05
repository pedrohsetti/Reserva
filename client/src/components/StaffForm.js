import { useState } from 'react';
import { fetchWithBusiness } from '../utils/api';

const StaffForm = ({ token, onCreated, services = [], businessId = null }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceIds, setServiceIds] = useState([]);
  const [error, setError] = useState(null);

	const handleServiceChange = (event) => {
		const values = Array.from(event.target.selectedOptions, (option) => option.value);
		setServiceIds(values);
	};

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
		const res = await fetchWithBusiness('/api/staff', token, businessId, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ name, email, phone, serviceIds })
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || 'Failed to create staff');
      }
      const data = await res.json();
      if (onCreated) onCreated(data.staff || data);
		setName(''); setEmail(''); setPhone(''); setServiceIds([]);
    } catch (e) { setError(e.message); }
  };

  return (
    <form onSubmit={submit} className="simple-form">
      <div className="form-control"><label>Name</label><input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Alex Staff" /></div>
      <div className="form-control"><label>Email</label><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="alex@company.com" /></div>
		<div className="form-control"><label>Phone</label><input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="040 123 4567" /></div>
		<div className="form-control">
			<label>Assigned services</label>
			<select multiple value={serviceIds} onChange={handleServiceChange}>
				{services.map((service) => <option key={service._id} value={service._id}>{service.name}</option>)}
			</select>
		</div>
      {error && <div className="error">{error}</div>}
      <button className="btn" type="submit">Create</button>
    </form>
  );
};

export default StaffForm;
