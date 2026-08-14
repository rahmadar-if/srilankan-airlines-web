import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { pushToDataLayer, setIdentifiedEmail } from '../lib/gtm';
import { getCheckoutState } from '../lib/checkoutResume';

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | success

  function handleSubmit(e) {
    e.preventDefault();

    // Creatio delivery (Contact upsert + backfill of this session's prior
    // anonymous activity) happens purely via a GTM Custom HTML tag reading
    // this event, not from React — see HANDOFF.md's GTM setup section.
    // Email/name ARE included here on purpose: only the Creatio-forwarding
    // tag reads them, they must never be mapped into the GA4 Event tag's
    // parameters (Google's terms prohibit raw PII in GA4 event params).
    pushToDataLayer('user_register', {
      email,
      first_name: firstName,
      last_name: lastName,
    });
    // Local-only "identified" flag — lets SearchResultsModal's Payment step
    // gate work immediately, without depending on the GTM tag round trip.
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
              <h2>You're registered</h2>
              <p className="sl-auth-sub">
                Welcome, {firstName || 'traveller'} — your account is ready.
              </p>
              <Link to="/" className="sl-btn-search sl-auth-submit" style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none' }}>
                {getCheckoutState() ? 'Continue Your Booking' : 'Back to Home'}
              </Link>
            </>
          ) : (
            <>
              <h2>Create your account</h2>
              <p className="sl-auth-sub">Register for faster booking and exclusive offers.</p>
              <form onSubmit={handleSubmit}>
                <div className="sl-auth-row">
                  <div className="sl-auth-field">
                    <label htmlFor="reg-first-name">First name</label>
                    <input
                      id="reg-first-name"
                      required
                      className="sl-auth-input"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="sl-auth-field">
                    <label htmlFor="reg-last-name">Last name</label>
                    <input
                      id="reg-last-name"
                      required
                      className="sl-auth-input"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="sl-auth-field">
                  <label htmlFor="reg-email">Email</label>
                  <input
                    id="reg-email"
                    required
                    type="email"
                    className="sl-auth-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button type="submit" className="sl-btn-search sl-auth-submit">
                  Register
                </button>
              </form>
              <p className="sl-auth-switch">
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
