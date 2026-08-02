import { useEffect, useState } from 'react';
import { fetchWithAuth } from '../utils/api';

const Appointments = ({ token }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ customerId: '', staffId: '', serviceId: '', date: '', time: '' });
  const [refs, setRefs] = useState({ customers: [], staff: [], services: [] });

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const [aRes, cRes, sRes, stRes] = await Promise.all([
          fetchWithAuth('/api/appointments', token),
          fetchWithAuth('/api/customers', token),
          fetchWithAuth('/api/services', token),
          fetchWithAuth('/api/staff', token),
        ]);
        if (!aRes.ok) throw new Error('Failed to load appointments');
        const a = await aRes.json();
        const c = cRes.ok ? await cRes.json() : { customers: [] };
        const sv = sRes.ok ? await sRes.json() : { services: [] };
        const st = stRes.ok ? await stRes.json() : { staff: [] };
        setItems(a.appointments || a.items || []);
        setRefs({ customers: c.customers || [], services: sv.services || [], staff: st.staff || [] });
      } catch (e) { setError(e.message); }
      setLoading(false);
    };
    load();
  }, [token]);

  const submit = async (e) => {
    e.preventDefault(); setError(null);
    try {
      const selectedService = refs.services.find((service) => service._id === form.serviceId);
      const durationMinutes = Number(selectedService?.durationMinutes || 0);
      const startAt = form.date && form.time ? new Date(`${form.date}T${form.time}:00`).toISOString() : '';
      const endAt = startAt ? new Date(new Date(startAt).getTime() + durationMinutes * 60000).toISOString() : '';
      if (!startAt || !endAt || !form.customerId || !form.staffId || !form.serviceId) {
        throw new Error('Select customer, staff, service, date, and time before creating the appointment');
      }
      const res = await fetchWithAuth('/api/appointments', token, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: form.customerId,
          staffId: form.staffId,
          serviceId: form.serviceId,
          startAt,
          endAt,
        })
      });
      if (!res.ok) {
        const txt = await res.text().catch(()=>''); throw new Error(txt || 'Failed to create appointment');
      }
      const data = await res.json();
      setItems((cur)=>[...(cur||[]), data.appointment || data]);
      setForm({ customerId: '', staffId: '', serviceId: '', date: '', time: '' });
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="card">
      <h2>Appointments</h2>
      {loading && <p>Loading...</p>}
      {error && <div className="error">{error}</div>}
      {!loading && !error && (
        <ul>{items.map(a => <li key={a._id || a.id}>{a.date} {a.time} - {a.status}</li>)}</ul>
      )}

      <h3>Create appointment</h3>
      <form onSubmit={submit} className="simple-form">
        <div className="form-control"><label>Customer</label>
          <select value={form.customerId} onChange={(e)=>setForm({...form, customerId:e.target.value})}>
            <option value="">Choose</option>
            {refs.customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-control"><label>Staff</label>
          <select value={form.staffId} onChange={(e)=>setForm({...form, staffId:e.target.value})}>
            <option value="">Choose</option>
            {refs.staff.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
        <div className="form-control"><label>Service</label>
          <select value={form.serviceId} onChange={(e)=>setForm({...form, serviceId:e.target.value})}>
            <option value="">Choose</option>
            {refs.services.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
        <div className="form-control"><label>Date</label><input type="date" value={form.date} onChange={(e)=>setForm({...form, date:e.target.value})} /></div>
        <div className="form-control"><label>Time</label><input type="time" value={form.time} onChange={(e)=>setForm({...form, time:e.target.value})} /></div>
        <button className="btn" type="submit">Create</button>
      </form>
    </div>
  );
};

export default Appointments;
