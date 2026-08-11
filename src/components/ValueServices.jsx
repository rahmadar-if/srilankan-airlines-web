import React from 'react';

export default function ValueServices() {
  const services = [
    { title: 'Pre-Order Meals', sub: 'Delicious authentic Sri Lankan & International meals', img: '/images/pre-order_meals.avif' },
    { title: 'Travel Insurance', sub: 'Fly worry-free with comprehensive global coverage', img: '/images/travel_insurance.avif' },
    { title: 'Advance Seat Selection', sub: 'Secure your preferred window or extra legroom seat', img: '/images/advance_seat_reservation.avif' }
  ];

  return (
    <section className="container mb-5" id="services" style={{ maxWidth: '1200px', margin: '0 auto 50px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
        <div>
          <h2 className="sl-section-title">Value Added Services</h2>
          <div className="sl-section-sub">Enhance your inflight experience with pre-booked meals, extra baggage & seat selection</div>
        </div>
        <a href="#" style={{ border: '1px solid #0f3375', color: '#0f3375', fontWeight: 'bold', padding: '8px 24px', borderRadius: '6px', textDecoration: 'none', marginBottom: '24px' }}>View All</a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {services.map((item, idx) => (
          <div key={idx} className="value-card">
            <img src={item.img} alt={item.title} onError={e => e.target.src = '/images/MB-go-en_uk--20231110085852621.jpg'} />
            <div className="value-card-overlay">
              <h4 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.2rem' }}>{item.title}</h4>
              <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>{item.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
