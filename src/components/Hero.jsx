import React from 'react';

export default function Hero() {
  return (
    <section class="hero-container" style={{ backgroundImage: "url('/images/MB-go-en_uk--20260804143439741.jpg')" }}>
      <div class="hero-overlay"></div>
      <div class="hero-text-box">
        <div style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.9, fontWeight: 700, marginBottom: '8px' }}>
          More reasons to fly • More reasons to stay
        </div>
        <h1>Arrive Visa-free to Sri Lanka</h1>
      </div>
    </section>
  );
}
