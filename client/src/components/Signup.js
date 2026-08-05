import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as apiRegister } from '../utils/api';
import AuthContext from '../context/AuthContext';

const Signup = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Name, email, and password are required.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await apiRegister({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      if (auth?.login) {
        auth.login(token);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h2>Create Account</h2>
      <p>Create an account to explore businesses, services, events, and bookings.</p>
      <form onSubmit={onSubmit}>
        <div className="form-control">
          <label>Name</label>
          <input name="name" value={form.name} onChange={onChange} />
        </div>
        <div className="form-control">
          <label>Email</label>
          <input name="email" type="email" value={form.email} onChange={onChange} />
        </div>
        <div className="form-control">
          <label>Password</label>
          <input name="password" type="password" value={form.password} onChange={onChange} />
        </div>
        <div className="form-control">
          <label>Confirm password</label>
          <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={onChange} />
        </div>
        {error && <div className="error">{error}</div>}
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p style={{ marginTop: '10px', fontSize: '13px' }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
};

export default Signup;