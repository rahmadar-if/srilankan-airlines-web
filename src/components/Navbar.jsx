import React from 'react';
import { Search, Globe, ChevronDown, User } from 'lucide-react';

export default function Navbar() {
  return (
    <nav class="sl-navbar">
      <div class="container d-flex justify-content-between align-items-center" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
        <a class="sl-navbar-brand" href="#" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/images/logo-with-oneword.png" alt="SriLankan Airlines" class="sl-logo" style={{ height: '42px' }} onError={(e) => e.target.src = '/images/logo_ul.png'} />
        </a>

        <ul class="sl-nav-links d-none d-lg-flex" style={{ display: 'flex', alignItems: 'center', gap: '28px', listStyle: 'none', margin: 0, padding: 0 }}>
          <li class="sl-nav-item"><a href="#book">Plan & Book</a></li>
          <li class="sl-nav-item"><a href="#destinations">Travel Information</a></li>
          <li class="sl-nav-item"><a href="#services">Experience</a></li>
          <li class="sl-nav-item"><a href="#offers">FlySmiLes</a></li>
        </ul>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <a href="#" class="sl-nav-icon" title="Search"><Search size={18} /></a>
          <a href="#help" class="sl-nav-item" style={{ textDecoration: 'none', fontWeight: 'bold', color: '#0f3375' }}>Help</a>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', color: '#0f3375', cursor: 'pointer' }}>
            <Globe size={16} /> EN <ChevronDown size={14} />
          </div>
          <a href="#login" class="sl-nav-icon" title="User Account"><User size={18} /></a>
        </div>
      </div>
    </nav>
  );
}
