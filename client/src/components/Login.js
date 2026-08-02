import { useState, useContext } from 'react';
import { login as apiLogin } from '../utils/api';
import { useNavigate } from 'react-router-dom';
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
      <form onSubmit={onSubmit}>
        <div className="form-control">
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-control">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <div className="error">{error}</div>}
        <button className="btn" type="submit">Login</button>
      </form>
      <p style={{ marginTop: '10px', fontSize: '13px' }}>
        Use a backend user or the `dev` account for admin-like access.
      </p>
    </div>
  );
};

export default Login;
