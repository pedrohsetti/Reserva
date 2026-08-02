import { useState } from 'react';
import { fetchWithAuth } from '../utils/api';

const CustomerForm = ({ token, onCreated }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault(); setError(null);
    try {
      const res = await fetchWithAuth('/api/customers', token, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone })
      });
      if (!res.ok) {
        const txt = await res.text().catch(()=>'');
        throw new Error(txt || 'Failed to create customer');
      }
      const data = await res.json();
      if (onCreated) onCreated(data.customer || data);
      setName(''); setEmail(''); setPhone('');
    } catch (e) { setError(e.message); }
  };

  return (
    <form onSubmit={submit} className="simple-form">
      <div className="form-control"><label>Name</label><input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Jane Doe" /></div>
      <div className="form-control"><label>Email</label><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="jane@example.com" /></div>
      <div className="form-control"><label>Phone</label><input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="040 123 4567" /></div>
      {error && <div className="error">{error}</div>}
      <button className="btn" type="submit">Create</button>
    </form>
  );
};

export default CustomerForm;
