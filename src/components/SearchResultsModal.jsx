import React from 'react';
import { X, Plane } from 'lucide-react';
import { track } from '../lib/creatio';

export default function SearchResultsModal({ isOpen, onClose, origin, destination, cabinClass }) {
  if (!isOpen) return null;

  const flights = [
    { no: 'UL 302', aircraft: 'Airbus A330-300', dep: '07:30', arr: '13:45', price: '$ 420.00' },
    { no: 'UL 308', aircraft: 'Airbus A321neo', dep: '14:15', arr: '20:30', price: '$ 465.00' },
    { no: 'UL 504', aircraft: 'Airbus A330-200', dep: '21:00', arr: '03:15 +1', price: '$ 510.00' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '880px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
              Available Flights ({origin.code} → {destination.code})
            </h3>
            <span style={{ fontSize: '0.85rem', opacity: 0.85 }}>SriLankan Airlines • {cabinClass} Class</span>
          </div>
          <button style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }} onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        <div className="modal-body" style={{ background: '#f8fafc', padding: '24px' }}>
          {flights.map((flight, idx) => (
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
                  onClick={() => {
                    track('FlightSelect', {
                      flightNo: flight.no,
                      aircraft: flight.aircraft,
                      origin: origin.code,
                      destination: destination.code,
                      price: flight.price,
                    });
                    alert(`Flight Confirmed!\n\nFlight: ${flight.no}\nRoute: ${origin.city} -> ${destination.city}\nPrice: ${flight.price}`);
                  }}
                >
                  Select Flight
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
