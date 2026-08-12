import { useState } from 'react';
import { pushToDataLayer } from '../lib/gtm';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [wantsOffers, setWantsOffers] = useState(true);
  const [status, setStatus] = useState('idle'); // idle | success

  function handleSubmit(e) {
    e.preventDefault();

    // Creatio delivery now happens purely via a GTM Custom HTML tag
    // (triggered on this same event), not from React directly — see
    // HANDOFF.md. Email IS included here on purpose, unlike flight_search/
    // flight_select: it's only ever read by our own Creatio-forwarding tag,
    // never mapped into the GA4 Event tag's parameters — GA4 itself must
    // never receive it (Google's terms prohibit raw PII in event params).
    pushToDataLayer('newsletter_subscribed', { email, wants_offers: wantsOffers });
    setStatus('success');
  }

  if (status === 'success') {
    return (
      <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
        You're subscribed — thanks!
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
        <button type="submit" className="sl-newsletter-btn">
          Subscribe
        </button>
      </div>
      <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={wantsOffers}
          onChange={(e) => setWantsOffers(e.target.checked)}
        /> Yes, I would like to receive promotional emails.
      </label>
    </form>
  );
}
