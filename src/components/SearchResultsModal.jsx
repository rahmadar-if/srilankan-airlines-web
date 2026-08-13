import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { pushToDataLayer } from '../lib/gtm';

const ADDONS = [
  { key: 'legroom', label: 'Extra legroom seat', price: 25 },
  { key: 'meal', label: 'Meal pre-order', price: 15 },
  { key: 'baggage', label: 'Extra baggage (10kg)', price: 40 },
];

export default function SearchResultsModal({ isOpen, onClose, origin, destination, cabinClass }) {
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [step, setStep] = useState('list'); // list | passenger | ancillary | payment | confirmed
  const [passenger, setPassenger] = useState({ firstName: '', lastName: '', passportNo: '' });
  const [addons, setAddons] = useState([]);

  if (!isOpen) return null;

  const flights = [
    { no: 'UL 302', aircraft: 'Airbus A330-300', dep: '07:30', arr: '13:45', price: '$ 420.00' },
    { no: 'UL 308', aircraft: 'Airbus A321neo', dep: '14:15', arr: '20:30', price: '$ 465.00' },
    { no: 'UL 504', aircraft: 'Airbus A330-200', dep: '21:00', arr: '03:15 +1', price: '$ 510.00' }
  ];

  function baseEventData() {
    return {
      flight_no: selectedFlight.no,
      origin: origin.code,
      destination: destination.code,
      price: selectedFlight.price,
    };
  }

  function handleClose() {
    // Reset so a fresh search opens back on the flight list — this
    // component instance is reused across searches, not remounted.
    setSelectedFlight(null);
    setStep('list');
    setPassenger({ firstName: '', lastName: '', passportNo: '' });
    setAddons([]);
    onClose();
  }

  function handleSelectFlight(flight) {
    // This is the Abandoned Booking Recovery entry point (see HANDOFF.md) —
    // NOT flight_search. Every stage transition below fires its own event
    // so an abandonment can be told apart by how far the visitor actually
    // got (UsrAbandonedStage: SELECT_FLIGHT / PAX_DETAILS / ANCILLARY /
    // PAYMENT), not just "they abandoned somewhere."
    setSelectedFlight(flight);
    pushToDataLayer('flight_select', {
      flight_no: flight.no,
      aircraft: flight.aircraft,
      origin: origin.code,
      destination: destination.code,
      price: flight.price,
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
    // Reaching the payment screen is its own distinct abandonment stage —
    // someone can pick add-ons then still never submit payment. Fired
    // separately from ancillary_selected, same click, on purpose.
    pushToDataLayer('payment_started', baseEventData());
    setStep('payment');
  }

  function handlePayNow(e) {
    e.preventDefault();
    // The resolution signal: a checkout_completed timestamped after this
    // booking attempt's flight_select is what Creatio-side automation
    // checks for to clear the abandoned-booking flag (see HANDOFF.md).
    pushToDataLayer('checkout_completed', baseEventData());
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
