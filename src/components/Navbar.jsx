import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Globe, ChevronDown, User, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="sl-navbar">
      <div className="sl-nav-container">
        {/* Brand Logo */}
        <Link className="sl-navbar-brand" to="/">
          <img
            src="/images/logo-with-oneword.png"
            alt="SriLankan Airlines"
            className="sl-logo"
            onError={(e) => (e.target.src = '/images/logo_ul.png')}
          />
        </Link>

        {/* Desktop Navigation Links */}
        <ul className="sl-nav-links d-desktop-flex">
          <li className="sl-nav-item"><a href="#book">Plan & Book</a></li>
          <li className="sl-nav-item"><a href="#destinations">Travel Information</a></li>
          <li className="sl-nav-item"><a href="#services">Experience</a></li>
          <li className="sl-nav-item"><a href="#offers">FlySmiLes</a></li>
        </ul>

        {/* Action Icons & Mobile Hamburger */}
        <div className="sl-nav-actions">
          <a href="#" className="sl-nav-icon" title="Search"><Search size={18} /></a>
          <a href="#help" className="sl-nav-item sl-hide-mobile" style={{ textDecoration: 'none', fontWeight: 'bold', color: '#0f3375' }}>Help</a>
          <div className="sl-lang-select sl-hide-mobile">
            <Globe size={16} /> EN <ChevronDown size={14} />
          </div>
          <Link to="/register" className="sl-nav-item sl-hide-mobile" style={{ textDecoration: 'none', fontWeight: 'bold', color: '#0f3375' }}>Register</Link>
          <Link to="/login" className="sl-nav-icon sl-hide-mobile" title="Sign In"><User size={18} /></Link>

          {/* Mobile Hamburger Button */}
          <button
            className="sl-mobile-toggle"
            onClick={toggleMobileMenu}
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="sl-mobile-menu">
          <ul className="sl-mobile-links">
            <li><a href="#book" onClick={() => setIsMobileMenuOpen(false)}>Plan & Book</a></li>
            <li><a href="#destinations" onClick={() => setIsMobileMenuOpen(false)}>Travel Information</a></li>
            <li><a href="#services" onClick={() => setIsMobileMenuOpen(false)}>Experience</a></li>
            <li><a href="#offers" onClick={() => setIsMobileMenuOpen(false)}>FlySmiLes</a></li>
            <li><a href="#explore" onClick={() => setIsMobileMenuOpen(false)}>Explore Sri Lanka</a></li>
          </ul>

          <div className="sl-mobile-footer">
            <a href="#help" className="sl-mobile-action-btn" onClick={() => setIsMobileMenuOpen(false)}>Help & Support</a>
            <div className="sl-mobile-row">
              <div className="sl-lang-select" style={{ color: '#ffffff' }}>
                <Globe size={16} /> Language: EN
              </div>
              <Link to="/register" className="sl-mobile-login-link" onClick={() => setIsMobileMenuOpen(false)}>
                Register
              </Link>
              <Link to="/login" className="sl-mobile-login-link" onClick={() => setIsMobileMenuOpen(false)}>
                <User size={16} /> Sign In
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

