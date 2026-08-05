import { useState, useContext } from 'react';
import { login as apiLogin } from '../utils/api';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const token = await apiLogin({ email, password });
      if (auth && auth.login) auth.login(token);
      if (onLogin) onLogin(token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="card">
      <h2>Login</h2>
      <p>Log in to manage your business or explore businesses, services, events, and bookings.</p>
      <form onSubmit={onSubmit}>
        <div className="form-control">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-control">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <div className="error">{error}</div>}
        <button className="btn" type="submit">Login</button>
      </form>
      <p style={{ marginTop: '10px', fontSize: '13px' }}>
        Need an account? <Link to="/signup">Create one</Link>
      </p>
    </div>
  );
};

export default Login;
