import { useState } from 'react';
import { submitLead, track } from '../lib/creatio';
import { pushToDataLayer } from '../lib/gtm';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [wantsOffers, setWantsOffers] = useState(true);
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      // Goes through our own /api/creatio-lead proxy, which calls Creatio's
      // CaptureService.Lead server-to-server (see src/lib/creatio.js).
      await submitLead({ email, pageUrl: window.location.pathname });

      // CaptureService.Lead already logs LeadCaptured; this is a distinct
      // event so a newsletter signup can be told apart from other lead sources.
      track('NewsletterSubscribed', { email, wantsOffers });

      // No email here on purpose — GA4/GTM event parameters aren't meant to
      // carry PII (Google's terms prohibit it outside a properly configured
      // Enhanced Conversions setup, which this demo doesn't have).
      pushToDataLayer('newsletter_subscribed', { wants_offers: wantsOffers });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message || 'Something went wrong.');
    }
  }

  if (status === 'success') {
    return (
      <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
        You're subscribed — a Contact for {email} was just created or updated in Creatio.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', marginBottom: '12px' }}>
        <label htmlFor="newsletter-email" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
          Email
        </label>
        <input
          id="newsletter-email"
          required
          type="email"
          className="sl-newsletter-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <button type="submit" className="sl-newsletter-btn" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Subscribing…' : 'Subscribe'}
        </button>
      </div>
      <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={wantsOffers}
          onChange={(e) => setWantsOffers(e.target.checked)}
        /> Yes, I would like to receive promotional emails.
      </label>
      {status === 'error' && (
        <p style={{ marginTop: '8px', fontSize: '0.8rem', color: '#f87171' }}>{errorMessage}</p>
      )}
    </form>
  );
}
