import React, { useState, useEffect } from 'react';
import { Plane, ArrowLeftRight, Calendar, Users, Info, ExternalLink } from 'lucide-react';
import { AIRPORTS } from '../data/airports';
import AirportModal from './AirportModal';
import SearchResultsModal from './SearchResultsModal';
import { pushToDataLayer } from '../lib/gtm';
import { getCheckoutState, clearCheckoutState } from '../lib/checkoutResume';

export default function BookingWidget() {
  // Read once, synchronously, via lazy initializer — NOT in a useEffect.
  // SearchResultsModal is mounted unconditionally below (isOpen just
  // controls whether it renders null), so it sees whatever `resumeState` is
  // on ITS OWN first render. If this were set later via an effect, the
  // modal's lazy useState initializers (which key off this same prop) would
  // already have locked in their defaults by the time the effect fired —
  // effects run after the first render completes, lazy initializers don't
  // re-run on a later prop change. Computing it here, synchronously, during
  // BookingWidget's own first render is what makes both components' first
  // renders see the correct value together.
  const [resumeState] = useState(() => getCheckoutState());

  const [activeTab, setActiveTab] = useState('book');
  const [tripType, setTripType] = useState('round-trip');
  const [origin, setOrigin] = useState(() => resumeState?.origin ?? AIRPORTS[0]); // CMB
  const [destination, setDestination] = useState(() => resumeState?.destination ?? AIRPORTS[1]); // SIN
  const [departDate, setDepartDate] = useState('2026-08-18');
  const [returnDate, setReturnDate] = useState('2026-08-25');
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState(() => resumeState?.cabinClass ?? 'Economy');

  const [isAirportModalOpen, setIsAirportModalOpen] = useState(false);
  const [targetField, setTargetField] = useState('origin');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(() => !!resumeState);

  // One-shot: sessionStorage's job was to survive the /login or /register
  // route change; once read above, it'd be stale/wrong if left around for
  // a later, unrelated search-modal open.
  useEffect(() => {
    if (resumeState) clearCheckoutState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openModalFor = (field) => {
    setTargetField(field);
    setIsAirportModalOpen(true);
  };

  const swapAirports = (e) => {
    e.stopPropagation();
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const searchFlights = () => {
    // Creatio delivery for this event now happens purely via a GTM Custom
    // HTML tag (triggered on the flight_search dataLayer event below), not
    // from React directly — see HANDOFF.md.
    pushToDataLayer('flight_search', {
      origin: origin.code,
      destination: destination.code,
      depart_date: departDate,
      return_date: returnDate,
      trip_type: tripType,
      passengers,
      cabin_class: cabinClass,
    });
    setIsSearchModalOpen(true);
  };

  return (
    <div className="sl-booking-wrapper" id="book">
      <div className="sl-booking-card">
        {/* Top Tab Bar */}
        <div className="sl-tab-bar">
          <button className={`sl-tab-btn ${activeTab === 'book' ? 'active' : ''}`} onClick={() => setActiveTab('book')}>
            <Plane size={16} /> Book a Trip
          </button>
          <button className={`sl-tab-btn ${activeTab === 'manage' ? 'active' : ''}`} onClick={() => alert('Manage Booking:\nEnter PNR and Last Name to view itinerary.')}>
            Manage Booking
          </button>
          <button className={`sl-tab-btn ${activeTab === 'checkin' ? 'active' : ''}`} onClick={() => alert('Web Check-In:\nCheck-in opens 48 hours before flight departure.')}>
            Check-in
          </button>
          <button className={`sl-tab-btn ${activeTab === 'hotel' ? 'active' : ''}`} onClick={() => alert('Flight + Hotel Packages:\nDiscover exclusive SriLankan Holidays deals.')}>
            + Hotel
          </button>
        </div>

        {/* Booking Body */}
        <div className="sl-booking-body">
          {/* Sub-options Bar */}
          <div className="sl-options-bar">
            <div className="sl-checkboxes">
              <label><input type="checkbox" /> Redeem <Info size={14} className="sl-info-icon" /></label>
              <label><input type="checkbox" /> Voucher Redeem <Info size={14} className="sl-info-icon" /></label>
              <label><input type="checkbox" defaultChecked /> Flexible Dates</label>
            </div>

            <div className="sl-alert-banner">
              <span className="sl-alert-tag">Alert</span>
              <span>Entry Requirements for Passengers Traveling to Sri Lanka</span>
            </div>
          </div>

          {/* Form Main Grid Row */}
          <div className="sl-form-grid">
            {/* 1. Trip Type Column */}
            <div className="sl-triptype-col">
              <div className={`sl-triptype-btn ${tripType === 'round-trip' ? 'active' : ''}`} onClick={() => setTripType('round-trip')}>
                <ArrowLeftRight size={14} /> Round Trip
              </div>
              <div className={`sl-triptype-btn ${tripType === 'one-way' ? 'active' : ''}`} onClick={() => setTripType('one-way')}>
                One Way
              </div>
              <a href="#" className="sl-triptype-link" onClick={() => alert('Multi-city Booking:\nSelect up to 4 flight segments.')}>
                Multi City <ExternalLink size={12} />
              </a>
            </div>

            {/* 2. Combined Origin & Destination Box */}
            <div className="sl-orig-dest-box">
              <div className="sl-orig-part" onClick={() => openModalFor('origin')}>
                <div className="sl-box-label"><Plane size={12} /> From</div>
                <div className="sl-box-value">{origin.city} ({origin.code})</div>
              </div>

              <div className="sl-swap-circle" onClick={swapAirports} title="Swap Origin & Destination">
                <ArrowLeftRight size={14} />
              </div>

              <div className="sl-dest-part" style={{ textAlign: 'right' }} onClick={() => openModalFor('destination')}>
                <div className="sl-box-label" style={{ justifyContent: 'flex-end' }}>To <Plane size={12} /></div>
                <div className="sl-box-value">{destination.city} ({destination.code})</div>
              </div>
            </div>

            {/* 3. Departure Date Box */}
            <div className="sl-box">
              <div className="sl-box-label"><Calendar size={12} /> Departure Date</div>
              <input type="date" className="sl-date-input" value={departDate} onChange={e => setDepartDate(e.target.value)} />
            </div>

            {/* 4. Return Date Box */}
            <div className="sl-box" style={{ opacity: tripType === 'one-way' ? 0.35 : 1, pointerEvents: tripType === 'one-way' ? 'none' : 'auto' }}>
              <div className="sl-box-label"><Calendar size={12} /> Return Date</div>
              <input type="date" className="sl-date-input" value={returnDate} onChange={e => setReturnDate(e.target.value)} />
            </div>

            {/* 5. Passengers & Class Box */}
            <div className="sl-box" style={{ cursor: 'default' }}>
              <div className="sl-pax-top">
                <div>
                  <div className="sl-box-label"><Users size={12} /> Passengers</div>
                  <div className="sl-box-value">{passengers} Passenger{passengers > 1 ? 's' : ''}</div>
                </div>
                <button type="button" className="sl-pax-add-btn" onClick={() => setPassengers(passengers + 1)} title="Add Passenger">+</button>
              </div>
              <div className="sl-class-tabs">
                <button type="button" className={`sl-class-btn ${cabinClass === 'Economy' ? 'active' : ''}`} onClick={() => setCabinClass('Economy')}>
                  Economy class
                </button>
                <button type="button" className={`sl-class-btn ${cabinClass === 'Business' ? 'active' : ''}`} onClick={() => setCabinClass('Business')}>
                  Business class
                </button>
              </div>
            </div>

            {/* 6. Search Flights Button */}
            <div>
              <button type="button" className="sl-btn-search" onClick={searchFlights}>
                Search Flights <Plane size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <AirportModal
        isOpen={isAirportModalOpen}
        onClose={() => setIsAirportModalOpen(false)}
        onSelect={airport => targetField === 'origin' ? setOrigin(airport) : setDestination(airport)}
        targetField={targetField}
      />

      <SearchResultsModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        origin={origin}
        destination={destination}
        cabinClass={cabinClass}
        resumeState={resumeState}
      />
    </div>
  );
}
