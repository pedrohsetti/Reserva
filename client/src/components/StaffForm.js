import { useState } from 'react';
import { fetchWithAuth } from '../utils/api';

const StaffForm = ({ token, onCreated }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetchWithAuth('/api/staff', token, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || 'Failed to create staff');
      }
      const data = await res.json();
      if (onCreated) onCreated(data.staff || data);
      setName(''); setEmail('');
    } catch (e) { setError(e.message); }
  };

  return (
    <form onSubmit={submit} className="simple-form">
      <div className="form-control"><label>Name</label><input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Alex Staff" /></div>
      <div className="form-control"><label>Email</label><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="alex@company.com" /></div>
      {error && <div className="error">{error}</div>}
      <button className="btn" type="submit">Create</button>
    </form>
  );
};

export default StaffForm;
