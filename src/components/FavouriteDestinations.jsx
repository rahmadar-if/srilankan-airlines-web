import React from 'react';
import { Plane, ChevronLeft, ChevronRight } from 'lucide-react';

export default function FavouriteDestinations() {
  const items = [
    { from: 'FRA', to: 'CMB', price: 'EUR 745*', img: '/images/MB-go-en_uk--20260804143439741.jpg' },
    { from: 'MLE', to: 'CMB', price: 'USD 349*', img: '/images/MB-go-en_uk--20260521145258814.jpg' },
    { from: 'MAA', to: 'CMB', price: 'INR 21,006*', img: '/images/MB-go-en_uk--20260617094242579.jpg' }
  ];

  return (
    <section className="container mb-5" id="destinations" style={{ maxWidth: '1200px', margin: '0 auto 50px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
        <div>
          <h2 className="sl-section-title">Favourite Destinations</h2>
          <div className="sl-section-sub">Explore top destinations chosen by other travelers</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={18} /></button>
          <button style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={18} /></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {items.map((item, idx) => (
          <div key={idx} className="fav-dest-card" style={{ backgroundImage: `url('${item.img}')` }}>
            <div className="fav-dest-overlay"></div>
            <div className="fav-dest-content">
              <span style={{ background: 'rgba(15, 23, 42, 0.75)', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>Round Trip</span>
            </div>
            <div className="fav-dest-content">
              <div className="fav-route">
                <span>{item.from}</span>
                <Plane size={20} />
                <span>{item.to}</span>
              </div>
              <div className="fav-price-val" style={{ marginTop: '4px' }}>{item.price}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
