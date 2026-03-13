import { useState, useRef, useEffect } from 'react';
import './AvatarMenu.css';

function AvatarMenu({ username, onLogout, onSettings }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div className="avatar-wrapper" ref={ref}>
      <button className="avatar-circle" onClick={() => setOpen((o) => !o)}>
        {initials}
      </button>

      {open && (
        <div className="avatar-dropdown">
          <div className="dropdown-header">
            <div className="dropdown-avatar">{initials}</div>
            <div className="dropdown-username">{username}</div>
          </div>
          <div className="dropdown-divider" />
          <button className="dropdown-item" onClick={() => { setOpen(false); onSettings(); }}>
            <span className="dropdown-icon">⚙</span> Settings
          </button>
          <button className="dropdown-item danger" onClick={() => { setOpen(false); onLogout(); }}>
            <span className="dropdown-icon">→</span> Log Out
          </button>
        </div>
      )}
    </div>
  );
}

export default AvatarMenu;
