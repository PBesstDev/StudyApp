import { useState } from 'react';
import { login, register, logout, isLoggedIn } from '../utils/api';

export default function Auth({ onAuthChange }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [status, setStatus] = useState('');
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());

  // Logic for form submission for login or registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    try {
      if (mode === 'login') {
        await login(username, password);
        setStatus('Logged in');
      } else {
        await register(username, password);
        setStatus('Registered — now log in');
        setMode('login');
      }
      setLoggedIn(isLoggedIn());
      onAuthChange?.(isLoggedIn());
    } catch (err) {
      setStatus(err.message);
    }
  };

  // Logic for handling logout
  const handleLogout = () => {
    logout();
    setLoggedIn(false);
    setStatus('Logged out');
    onAuthChange?.(false);
  };

  if (loggedIn) {
    return (
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>Logged in</span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
      <input
        value={username}
        onChange={e => setUsername(e.target.value)}
        placeholder="username"
        required
        style={{ width: 100 }}
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="password"
        required
        style={{ width: 100 }}
      />
      <button type="submit">{mode === 'login' ? 'Login' : 'Register'}</button>
      <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'Register' : 'Login'}
      </button>
      {status && <span style={{ fontSize: '0.85em' }}>{status}</span>}
    </form>
  );
}
