import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Check, LogIn } from 'lucide-react';
import { pushToDataLayer, getIdentifiedEmail } from '../lib/gtm';
import { saveCheckoutState, clearCheckoutState } from '../lib/checkoutResume';

const ADDONS = [
  { key: 'legroom', label: 'Extra legroom seat', price: 25 },
  { key: 'meal', label: 'Meal pre-order', price: 15 },
  { key: 'baggage', label: 'Extra baggage (10kg)', price: 40 },
];

export default function SearchResultsModal({ isOpen, onClose, origin, destination, cabinClass, resumeState }) {
  // Lazy initializers: only ever run on this component instance's first
  // render, which is exactly when a resume (post-login redirect back here)
  // needs to apply. Later re-opens for a fresh search don't re-trigger these
  // even though `resumeState` stays a stale non-null prop — see BookingWidget.jsx.
  const [selectedFlight, setSelectedFlight] = useState(() => resumeState?.selectedFlight ?? null);
  // list | passenger | ancillary | auth-required | payment | confirmed
  const [step, setStep] = useState(() => (resumeState ? resumeState.resumeStep : 'list'));
  const [passenger, setPassenger] = useState(() => resumeState?.passenger ?? { firstName: '', lastName: '', passportNo: '' });
  const [addons, setAddons] = useState(() => resumeState?.addons ?? []);
  // Generated fresh per flight_select, carried through every later event for
  // THIS specific booking attempt. Without this, Creatio-side resolution
  // ("no checkout_completed after this flight_select") can't tell two
  // concurrent attempts apart — selecting Flight A (abandoned), then Flight
  // B (completed) would incorrectly mark A as resolved too, since any later
  // checkout_completed satisfies a plain timestamp check regardless of
  // which flight it was for. See HANDOFF.md.
  const [bookingAttemptId, setBookingAttemptId] = useState(() => resumeState?.bookingAttemptId ?? null);

  // Resuming straight into Payment (post-login) means payment_started never
  // got to fire before the auth gate interrupted the original flow — fire it
  // now that they've actually reached the payment form for real.
  useEffect(() => {
    if (resumeState && resumeState.resumeStep === 'payment') {
      pushToDataLayer('payment_started', {
        flight_no: resumeState.selectedFlight.no,
        origin: resumeState.origin.code,
        destination: resumeState.destination.code,
        price: resumeState.selectedFlight.price,
        booking_attempt_id: resumeState.bookingAttemptId,
      });
    }
    // Mount-only: resumeState reflects whatever was true at the moment this
    // component instance was created, not a value to react to later.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isOpen) return null;

  const flights = [
    { no: 'UL 302', aircraft: 'Airbus A330-300', dep: '07:30', arr: '13:45', price: '$ 420.00' },
    { no: 'UL 308', aircraft: 'Airbus A321neo', dep: '14:15', arr: '20:30', price: '$ 465.00' },
    { no: 'UL 504', aircraft: 'Airbus A330-200', dep: '21:00', arr: '03:15 +1', price: '$ 510.00' }
  ];

  function baseEventData(attemptId) {
    return {
      flight_no: selectedFlight.no,
      origin: origin.code,
      destination: destination.code,
      price: selectedFlight.price,
      departure_time: selectedFlight.dep,
      arrival_time: selectedFlight.arr,
      booking_attempt_id: attemptId || bookingAttemptId,
    };
  }

  function handleClose() {
    // Reset so a fresh search opens back on the flight list — this
    // component instance is reused across searches, not remounted.
    // Also drop any pending resume save — if they close instead of actually
    // going to /login or /register, a stale sessionStorage entry would
    // otherwise hijack an unrelated later visit to those pages.
    clearCheckoutState();
    setSelectedFlight(null);
    setStep('list');
    setPassenger({ firstName: '', lastName: '', passportNo: '' });
    setAddons([]);
    setBookingAttemptId(null);
    onClose();
  }

  function handleSelectFlight(flight) {
    // This is the Abandoned Booking Recovery entry point (see HANDOFF.md) —
    // NOT flight_search. Every stage transition below fires its own event
    // so an abandonment can be told apart by how far the visitor actually
    // got (UsrAbandonedStage: SELECT_FLIGHT / PAX_DETAILS / ANCILLARY /
    // PAYMENT), not just "they abandoned somewhere."
    // Local var, not state — state wouldn't be committed yet in time for the
    // pushToDataLayer call two lines below, since setState is async.
    const attemptId = crypto.randomUUID();
    setSelectedFlight(flight);
    setBookingAttemptId(attemptId);
    pushToDataLayer('flight_select', {
      flight_no: flight.no,
      aircraft: flight.aircraft,
      origin: origin.code,
      destination: destination.code,
      price: flight.price,
      departure_time: flight.dep,
      arrival_time: flight.arr,
      booking_attempt_id: attemptId,
    });
    setStep('passenger');
  }

  function handlePassengerContinue(e) {
    e.preventDefault();
    pushToDataLayer('pax_details_submitted', {
      ...baseEventData(),
      passenger_name: `${passenger.firstName} ${passenger.lastName}`.trim(),
    });
    setStep('ancillary');
  }

  function handleAncillaryContinue() {
    pushToDataLayer('ancillary_selected', {
      ...baseEventData(),
      addons: addons.join(','),
    });
    // Payment requires a known identity — there's otherwise no email to
    // send a recovery follow-up to at all, which defeats the point of this
    // whole feature. Gate here, not earlier: browsing/selecting/filling
    // passenger details can stay anonymous, same as most real booking sites.
    if (!getIdentifiedEmail()) {
      // /login and /register are separate routes — navigating there
      // unmounts this modal, so the in-progress selection is saved here and
      // picked back up by BookingWidget.jsx once they return (see
      // src/lib/checkoutResume.js).
      saveCheckoutState({
        origin, destination, cabinClass,
        selectedFlight, passenger, addons, bookingAttemptId,
        resumeStep: 'payment',
      });
      setStep('auth-required');
      return;
    }
    // Reaching the payment screen is its own distinct abandonment stage —
    // someone can pick add-ons then still never submit payment. Fired
    // separately from ancillary_selected, same click, on purpose. Carries
    // the same addons/total as checkout_completed (not just base fare) —
    // this is the highest-intent abandonment case (they got all the way to
    // the payment form), so the follow-up needs the real amount due,
    // ancillary included, not just the bare flight price.
    const baseFareAtPayment = parseFloat(selectedFlight.price.replace(/[^0-9.]/g, ''));
    pushToDataLayer('payment_started', {
      ...baseEventData(),
      addons: addons.join(','),
      addons_total: addonsTotal.toFixed(2),
      total_price: (baseFareAtPayment + addonsTotal).toFixed(2),
    });
    setStep('payment');
  }

  function handlePayNow(e) {
    e.preventDefault();
    const baseFare = parseFloat(selectedFlight.price.replace(/[^0-9.]/g, ''));
    // The resolution signal: a checkout_completed timestamped after this
    // booking attempt's flight_select is what Creatio-side automation
    // checks for to clear the abandoned-booking flag (see HANDOFF.md).
    // Includes what was actually purchased (addons, final total) — the
    // earlier version only sent the base flight price here, losing the
    // ancillary purchase entirely.
    pushToDataLayer('checkout_completed', {
      ...baseEventData(),
      addons: addons.join(','),
      addons_total: addonsTotal.toFixed(2),
      total_price: (baseFare + addonsTotal).toFixed(2),
    });
    setStep('confirmed');
  }

  function toggleAddon(key) {
    setAddons((prev) => (prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]));
  }

  const addonsTotal = addons.reduce((sum, key) => sum + (ADDONS.find((a) => a.key === key)?.price || 0), 0);

  const stepTitles = {
    list: `Available Flights (${origin.code} → ${destination.code})`,
    passenger: 'Passenger Details',
    ancillary: 'Add-ons & Extras',
    'auth-required': 'Sign In to Continue',
    payment: 'Payment',
    confirmed: 'Booking Confirmed',
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-card" style={{ maxWidth: '880px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>{stepTitles[step]}</h3>
            <span style={{ fontSize: '0.85rem', opacity: 0.85 }}>SriLankan Airlines • {cabinClass} Class</span>
          </div>
          <button style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }} onClick={handleClose}>
            <X size={22} />
          </button>
        </div>

        <div className="modal-body" style={{ background: '#f8fafc', padding: '24px' }}>
          {step === 'list' && flights.map((flight, idx) => (
            <div key={idx} style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '20px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span style={{ background: '#0f3375', color: '#ffffff', fontWeight: 'bold', fontSize: '0.75rem', padding: '4px 10px', borderRadius: '4px' }}>SriLankan Airlines</span>
                <div style={{ fontWeight: 800, color: '#1e293b', marginTop: '6px', fontSize: '1.05rem' }}>{flight.no}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{flight.aircraft}</div>
              </div>

              <div style={{ textAlign: 'center', flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f3375' }}>{flight.dep}</div>
                    <div style={{ fontWeight: 700 }}>{origin.code}</div>
                  </div>
                  <div style={{ flex: 1, padding: '0 16px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>4h 45m</div>
                    <div style={{ borderBottom: '2px dashed #0088dd', margin: '4px 0' }}></div>
                    <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 'bold' }}>Direct Non-stop</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f3375' }}>{flight.arr}</div>
                    <div style={{ fontWeight: 700 }}>{destination.code}</div>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Starting from</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0088dd', marginBottom: '8px' }}>{flight.price}</div>
                <button
                  style={{ background: '#0f3375', color: '#ffffff', border: 'none', fontWeight: 'bold', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer' }}
                  onClick={() => handleSelectFlight(flight)}
                >
                  Select Flight
                </button>
              </div>
            </div>
          ))}

          {step === 'passenger' && (
            <form onSubmit={handlePassengerContinue} style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f3375', display: 'block', marginBottom: '6px' }}>First name</label>
                  <input required className="sl-auth-input" value={passenger.firstName} onChange={e => setPassenger({ ...passenger, firstName: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f3375', display: 'block', marginBottom: '6px' }}>Last name</label>
                  <input required className="sl-auth-input" value={passenger.lastName} onChange={e => setPassenger({ ...passenger, lastName: e.target.value })} />
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f3375', display: 'block', marginBottom: '6px' }}>Passport number</label>
                <input required className="sl-auth-input" value={passenger.passportNo} onChange={e => setPassenger({ ...passenger, passportNo: e.target.value })} />
              </div>
              <button type="submit" style={{ width: '100%', background: '#0f3375', color: '#ffffff', border: 'none', fontWeight: 'bold', padding: '12px', borderRadius: '6px', cursor: 'pointer' }}>
                Continue
              </button>
            </form>
          )}

          {step === 'ancillary' && (
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '24px' }}>
              {ADDONS.map(addon => (
                <label key={addon.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="checkbox" checked={addons.includes(addon.key)} onChange={() => toggleAddon(addon.key)} />
                    {addon.label}
                  </span>
                  <span style={{ fontWeight: 700, color: '#0088dd' }}>+${addon.price.toFixed(2)}</span>
                </label>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', marginBottom: '16px', fontWeight: 800, color: '#1e293b' }}>
                <span>Add-ons total</span>
                <span>${addonsTotal.toFixed(2)}</span>
              </div>
              <button
                style={{ width: '100%', background: '#0f3375', color: '#ffffff', border: 'none', fontWeight: 'bold', padding: '12px', borderRadius: '6px', cursor: 'pointer' }}
                onClick={handleAncillaryContinue}
              >
                Continue to Payment
              </button>
            </div>
          )}

          {step === 'auth-required' && (
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <LogIn size={26} color="#0088dd" />
              </div>
              <h4 style={{ margin: '0 0 8px', color: '#1e293b' }}>Sign in to complete your booking</h4>
              <p style={{ color: '#64748b', marginBottom: '24px' }}>
                {selectedFlight.no} · {origin.city} → {destination.city} · {selectedFlight.price}
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Link to="/login" className="sl-btn-search" style={{ padding: '10px 24px', textDecoration: 'none', display: 'inline-block' }}>
                  Sign In
                </Link>
                <Link to="/register" style={{ padding: '10px 24px', textDecoration: 'none', display: 'inline-block', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f3375', fontWeight: 'bold' }}>
                  Create Account
                </Link>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <form onSubmit={handlePayNow} style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '24px' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f3375', display: 'block', marginBottom: '6px' }}>Card number</label>
                <input required maxLength={19} placeholder="4111 1111 1111 1111" className="sl-auth-input" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f3375', display: 'block', marginBottom: '6px' }}>Expiry</label>
                  <input required placeholder="MM/YY" className="sl-auth-input" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f3375', display: 'block', marginBottom: '6px' }}>CVV</label>
                  <input required maxLength={4} placeholder="123" className="sl-auth-input" />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: 800, color: '#1e293b', fontSize: '1.1rem' }}>
                <span>Total due</span>
                <span>${(parseFloat(selectedFlight.price.replace(/[^0-9.]/g, '')) + addonsTotal).toFixed(2)}</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '16px' }}>No real payment is taken — this form only demonstrates the checkout funnel.</p>
              <button type="submit" style={{ width: '100%', background: '#0f3375', color: '#ffffff', border: 'none', fontWeight: 'bold', padding: '12px', borderRadius: '6px', cursor: 'pointer' }}>
                Pay Now
              </button>
            </form>
          )}

          {step === 'confirmed' && (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Check size={28} color="#16a34a" />
              </div>
              <h4 style={{ margin: '0 0 8px', color: '#1e293b' }}>Booking Confirmed</h4>
              <p style={{ color: '#64748b', margin: 0 }}>
                {selectedFlight.no} · {origin.city} → {destination.city}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
