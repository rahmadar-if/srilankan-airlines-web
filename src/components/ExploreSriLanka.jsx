import React from 'react';

export default function ExploreSriLanka() {
  const places = [
    { title: 'Demodara Nine Arch', sub: 'Ella Hill Country', img: '/images/Adventure-Ella.avif' },
    { title: 'Sigiriya Rock Fortress', sub: 'UNESCO Heritage', img: '/images/Heritage-Sigiriya.avif' },
    { title: 'Cascading Waterfalls', sub: 'Central Highlands', img: '/images/Nature-waterfall.avif' },
    { title: 'Adventure Safari', sub: 'Yala Wildlife Park', img: '/images/Adventure-Safari.avif' }
  ];

  return (
    <section className="container mb-5" id="explore" style={{ maxWidth: '1200px', margin: '0 auto 50px' }}>
      <h2 className="sl-section-title">Explore Sri Lanka</h2>
      <div className="sl-section-sub">Uncover pristine beaches, ancient kingdoms, lush tea hills & wild safari parks</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        {places.map((item, idx) => (
          <div key={idx} className="fav-dest-card" style={{ backgroundImage: `url('${item.img}')`, height: '240px' }}>
            <div className="fav-dest-overlay"></div>
            <div className="fav-dest-content" style={{ marginTop: 'auto' }}>
              <h4 style={{ fontWeight: 'bold', margin: 0, color: '#ffffff' }}>{item.title}</h4>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)' }}>{item.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
