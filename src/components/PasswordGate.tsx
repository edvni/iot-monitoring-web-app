// src/PasswordGate.tsx
import { useEffect, useState } from 'react';
import { hashPassword, secureAuth } from '../utils/auth';
import '../styles/PasswordGate.css';

const PasswordGate = ({ children }: { children: React.ReactNode }) => {
  const [inputPassword, setInputPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [lastAttempt, setLastAttempt] = useState(0); // Track last attempt time
  const [attemptCount, setAttemptCount] = useState(0); // Track number of attempts
  const [error, setError] = useState(''); // Track error message

  useEffect(() => {
    secureAuth.isAuthenticated().then(auth => {
      setIsAuthenticated(auth);
      setIsMounted(true);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Rate limiting
    const now = Date.now();
    if (now - lastAttempt < 3000) { // 3 seconds cooldown
      alert('Too many attempts. Please wait.');
      return;
    }
    setLastAttempt(now);

    // Increase attempt count
    setAttemptCount(prev => prev + 1);
    if (attemptCount >= 5) {
      alert('Too many failed attempts. Refresh the page to try again.');
      return;
    }

    try {
      // hash comparison
      const hashedInput = await hashPassword(inputPassword);
      if (hashedInput === import.meta.env.VITE_APP_PASSWORD_HASH) {
        await secureAuth.setAuthenticated(); // Set authenticated state
        setIsAuthenticated(true);
        setAttemptCount(0); // Reset attempt count on success
      } else {
        alert('Incorrect password');
      }
    } catch (err) {
      console.error('Hashing error:', err);
      setError('Authentication error. Please try again.');
    }
  };

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className="password-wrapper">
        <div className={`password-gate ${isMounted ? 'fade-in' : ''}`}>
            <form onSubmit={handleSubmit} className="password-form">
                <h2 className="password-title">Protected Access</h2>
                <input
                    type="password"
                    placeholder="Enter password"
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    className="password-input"
                />
                <button type="submit" className="password-button">Unlock</button>
            </form>
        </div>
    </div>
  );
};

export default PasswordGate;
