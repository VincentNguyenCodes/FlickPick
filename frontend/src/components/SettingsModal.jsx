import { useState } from 'react';
import './SettingsModal.css';

function SettingsModal({ username, onClose, onDeleted }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/api/auth/delete-account/', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete account.');
      localStorage.clear();
      onDeleted();
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-box" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-section">
          <div className="settings-label">Account</div>
          <div className="settings-row">
            <span className="settings-key">Username</span>
            <span className="settings-val">{username}</span>
          </div>
        </div>

        <div className="settings-divider" />

        <div className="settings-section">
          <div className="settings-label danger-label">Danger Zone</div>
          <p className="settings-warning">
            Deleting your account is permanent. All your ratings, watch history, and personalized model will be removed from our database and cannot be recovered.
          </p>

          {!confirming ? (
            <button className="delete-btn" onClick={() => setConfirming(true)}>
              Delete My Account
            </button>
          ) : (
            <div className="confirm-box">
              <p className="confirm-text">Are you sure? This cannot be undone.</p>
              {error && <p className="settings-error">{error}</p>}
              <div className="confirm-actions">
                <button className="cancel-btn" onClick={() => setConfirming(false)} disabled={loading}>
                  Cancel
                </button>
                <button className="confirm-delete-btn" onClick={handleDelete} disabled={loading}>
                  {loading ? 'Deleting...' : 'Yes, Delete Everything'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
