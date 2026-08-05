import { useState } from 'react';
import { deleteAccount } from '../utils/api';

const DeleteAccount = ({ userId, token, onSuccess }) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleDelete = async (e) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Password is required');
      return;
    }

    if (!confirmed) {
      setError('You must confirm account deletion');
      return;
    }

    try {
      setLoading(true);
      await deleteAccount(userId, { password }, token);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="delete-account-component danger-zone">
      <div className="section-header">
        <h2 className="danger-title">Delete Account</h2>
      </div>

      {!isConfirmOpen ? (
        <div className="danger-content">
          <p>
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button
            className="btn danger"
            onClick={() => {
              setIsConfirmOpen(true);
              setPassword('');
              setConfirmed(false);
              setError(null);
            }}
          >
            Delete My Account
          </button>
        </div>
      ) : (
        <form onSubmit={handleDelete} className="delete-form">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="warning-box">
            <p>
              <strong>Warning:</strong> This will permanently delete your account and all associated data.
            </p>
            <p>To proceed, enter your password and confirm the deletion.</p>
          </div>

          <div className="form-group">
            <label htmlFor="deletePassword">Enter your password to confirm</label>
            <input
              id="deletePassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group checkbox">
            <label htmlFor="confirmDeletion">
              <input
                id="confirmDeletion"
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                disabled={loading}
              />
              I understand that this action is permanent and cannot be reversed
            </label>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn danger"
              disabled={loading || !password || !confirmed}
            >
              {loading ? 'Deleting...' : 'Yes, Delete My Account'}
            </button>
            <button
              type="button"
              className="btn secondary"
              onClick={() => {
                setIsConfirmOpen(false);
                setPassword('');
                setConfirmed(false);
                setError(null);
              }}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default DeleteAccount;
