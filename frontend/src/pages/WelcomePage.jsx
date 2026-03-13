import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import './WelcomePage.css';

function WelcomePage() {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ username: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (tab === 'register' && form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = tab === 'login' ? '/api/auth/login/' : '/api/auth/register/';
      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, password: form.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || data.error || 'Something went wrong.');
        return;
      }

      localStorage.setItem('token', data.access);
      localStorage.setItem('username', form.username);

      if (tab === 'register' || !data.onboarded) {
        navigate('/onboarding');
      } else {
        navigate('/recommendations');
      }
    } catch {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="welcome-page">
      <div className="welcome-bg-grid" />

      <div className="welcome-card">
        <div className="welcome-logo">
          <Logo size="md" />
        </div>

        <p className="welcome-tagline">Your personal movie recommendation engine.</p>

        <div className="tab-row">
          <button
            className={`tab-btn ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(''); }}
          >
            Log In
          </button>
          <button
            className={`tab-btn ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(''); }}
          >
            Create Account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
              autoComplete="off"
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          {tab === 'register' && (
            <div className="input-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirm"
                value={form.confirm}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
            </div>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Loading...' : tab === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <p className="switch-text">
          {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <span onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError(''); }}>
            {tab === 'login' ? 'Create one' : 'Log in'}
          </span>
        </p>
      </div>
    </div>
  );
}

export default WelcomePage;
