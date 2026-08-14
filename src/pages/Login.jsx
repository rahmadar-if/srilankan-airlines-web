import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { pushToDataLayer, setIdentifiedEmail } from '../lib/gtm';
import { getCheckoutState } from '../lib/checkoutResume';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // UI only — never read/validated, no auth backend
  const [status, setStatus] = useState('idle'); // idle | success

  function handleSubmit(e) {
    e.preventDefault();

    // No password check here — this demo has no auth backend. The point of
    // this event isn't authentication, it's re-identifying a returning
    // visitor to Creatio: CaptureService.Lead finds the existing Contact by
    // email and re-runs BackfillSession() for THIS browser's session id,
    // covering the case where their cookie was cleared/regenerated since
    // they last identified themselves. See HANDOFF.md's GTM setup section.
    pushToDataLayer('user_login', { email });
    // Local-only "identified" flag — see setIdentifiedEmail() in lib/gtm.js.
    setIdentifiedEmail(email);
    setStatus('success');
  }

  return (
    <div className="srilankan-app">
      <Navbar />
      <div className="sl-auth-page">
        <div className="sl-auth-card">
          {status === 'success' ? (
            <>
              <h2>You're signed in</h2>
              <p className="sl-auth-sub">Welcome back.</p>
              <Link to="/" className="sl-btn-search sl-auth-submit" style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none' }}>
                {getCheckoutState() ? 'Continue Your Booking' : 'Back to Home'}
              </Link>
            </>
          ) : (
            <>
              <h2>Sign in</h2>
              <p className="sl-auth-sub">Access your bookings and FlySmiLes account.</p>
              <form onSubmit={handleSubmit}>
                <div className="sl-auth-field">
                  <label htmlFor="login-email">Email</label>
                  <input
                    id="login-email"
                    required
                    type="email"
                    className="sl-auth-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="sl-auth-field">
                  <label htmlFor="login-password">Password</label>
                  <input
                    id="login-password"
                    required
                    type="password"
                    className="sl-auth-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="sl-btn-search sl-auth-submit">
                  Sign In
                </button>
              </form>
              <p className="sl-auth-switch">
                New here? <Link to="/register">Create an account</Link>
              </p>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
