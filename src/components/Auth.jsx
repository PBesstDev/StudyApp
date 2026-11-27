import { useState } from 'react';
import { login, register, logout, isLoggedIn } from '../utils/api';

export default function Auth({ onAuthChange }) {
  // Create scoped constants for the login form fields and authentication state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [status, setStatus] = useState('');
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());

  // Submit the login or registration form and update the authentication state
  const handleSubmit = async (e) => {
    // Prevent the default form submission and clear the previous status
    e.preventDefault();
    setStatus('');
    try {
      // Use the selected mode to log in or register a new account
      if (mode === 'login') {
        await login(username, password);
        setStatus('Logged in');
      } else {
        await register(username, password);
        setStatus('Registered — now log in');
        setMode('login');
      }
      // Refresh the logged-in state and notify the parent component
      setLoggedIn(isLoggedIn());
      onAuthChange?.(isLoggedIn());
    } catch (err) {
      // Report any login or registration error
      setStatus(err.message);
    }
  };

  // Log out the current user and reset the authentication state
  const handleLogout = () => {
    logout();
    setLoggedIn(false);
    setStatus('Logged out');
    onAuthChange?.(false);
  };

  // Return the logged-in view when the user is authenticated
  if (loggedIn) {
    return (
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>Logged in</span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  // Return the actual JSX component for the login and registration form
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
