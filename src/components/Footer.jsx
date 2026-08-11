import React from 'react';

export default function Footer() {
  return (
    <footer className="sl-footer">
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px' }}>
          <div>
            <h5>About Us</h5>
            <ul>
              <li><a href="#">About SriLankan Airlines</a></li>
              <li><a href="#">Tenders and Contracts</a></li>
              <li><a href="#">Corporate Governance</a></li>
              <li><a href="#">Environment & Sustainability</a></li>
              <li><a href="#">Media Center</a></li>
              <li><a href="#">Careers</a></li>
            </ul>
          </div>
          <div>
            <h5>Useful Information</h5>
            <ul>
              <li><a href="#">Travel Requirements</a></li>
              <li><a href="#">Baggage Information</a></li>
              <li><a href="#">Visa Requirements</a></li>
              <li><a href="#">Special Assistance</a></li>
              <li><a href="#">FAQs</a></li>
            </ul>
          </div>
          <div>
            <h5>Terms & Conditions</h5>
            <ul>
              <li><a href="#">Conditions of Carriage</a></li>
              <li><a href="#">Conditions of Contract</a></li>
              <li><a href="#">General Passenger Agency</a></li>
              <li><a href="#">Limitation of Liability</a></li>
            </ul>
          </div>
          <div>
            <h5>Services</h5>
            <ul>
              <li><a href="#">Cargo</a></li>
              <li><a href="#">Catering</a></li>
              <li><a href="#">Ground Handling</a></li>
              <li><a href="#">SriLankan Holidays</a></li>
              <li><a href="#">Aviation Training</a></li>
            </ul>
          </div>
          <div>
            <h5>Subscribe to Our Newsletter</h5>
            <div className="sl-newsletter-form">
              <input type="email" className="sl-newsletter-input" placeholder="Email" />
              <button className="sl-newsletter-btn">Subscribe</button>
            </div>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="checkbox" defaultChecked /> Yes, I would like to receive promotional emails.
            </label>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '40px', paddingTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
          Copyright © 2026 SriLankan Airlines Ltd. All rights reserved. | Official Reference: <a href="https://www.srilankan.com" target="_blank" style={{ color: '#ffffff' }}>www.srilankan.com</a>
        </div>
      </div>
    </footer>
  );
}
