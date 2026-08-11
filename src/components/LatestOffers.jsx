import React from 'react';

export default function LatestOffers() {
  const offers = [
    { title: '0% installment plans on srilankan.com', desc: 'Convert your total payment into easy 0% monthly installments.', img: '/images/MB-go-en_uk--20231110085852621.jpg' },
    { title: 'Student Special', desc: 'Enjoy extra baggage allowance and discounted fares for overseas students.', img: '/images/MB-go-en_uk--20260521145258814.jpg' },
    { title: '0% installment plans on srilankan.com', desc: 'Convert your total payment into easy 0% monthly installments.', img: '/images/MB-go-en_uk--20260617094242579.jpg' }
  ];

  return (
    <section className="container mb-5" id="offers" style={{ maxWidth: '1200px', margin: '0 auto 50px' }}>
      <div className="sl-section-header">
        <div>
          <h2 className="sl-section-title">SriLankan Airlines Latest Offers</h2>
          <div className="sl-section-sub">Exclusive discounts and promotional fares for your next getaway</div>
        </div>
        <a href="#" style={{ border: '1px solid #0f3375', color: '#0f3375', fontWeight: 'bold', padding: '8px 24px', borderRadius: '6px', textDecoration: 'none', marginBottom: '16px', display: 'inline-block' }}>View All</a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {offers.map((item, idx) => (
          <div key={idx} className="offer-card">
            <img src={item.img} alt={item.title} />
            <div style={{ padding: '18px' }}>
              <h5 style={{ fontWeight: 'bold', color: '#0f3375', margin: '0 0 8px 0', fontSize: '1.05rem' }}>{item.title}</h5>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>{item.desc}</p>
              <button style={{ border: '1px solid #0f3375', color: '#0f3375', background: 'transparent', fontWeight: 'bold', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>Configure</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
