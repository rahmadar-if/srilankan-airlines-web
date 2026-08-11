import React, { useState, useEffect } from 'react';
import { ShieldCheck, Info, X, Check } from 'lucide-react';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [capturedData, setCapturedData] = useState(null);

  useEffect(() => {
    // Check if consent has already been given
    const consent = getCookie('sl_cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }

    // Set initial tracking cookies if none exist (for demonstration & testing)
    if (!getCookie('sl_visitor_id')) {
      const visitorId = 'sl_vid_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      setCookie('sl_visitor_id', visitorId, 365);
      setCookie('sl_session_start', new Date().toISOString(), 1);
      setCookie('sl_preferred_lang', 'en-US', 30);
    }
  }, []);

  // Helper to read cookies
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  // Helper to set cookies
  function setCookie(name, value, days) {
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = `; expires=${date.toUTCString()}`;
    }
    document.cookie = `${name}=${value || ''}${expires}; path=/; SameSite=Lax`;
  }

  // Function to collect all client & cookie data
  const collectVisitorData = (consentType = 'Accepted All') => {
    // Set consent cookie
    setCookie('sl_cookie_consent', consentType, 365);
    setCookie('sl_consent_timestamp', new Date().toISOString(), 365);

    // Extract all client cookies
    const allCookies = document.cookie || 'No cookies found';

    // Build comprehensive data payload
    const visitorInfo = {
      consentStatus: consentType,
      capturedAt: new Date().toLocaleString(),
      clientCookies: allCookies,
      parsedCookies: parseCookies(allCookies),
      deviceDetails: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        colorDepth: `${window.screen.colorDepth}-bit`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        deviceMemory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'N/A',
        hardwareConcurrency: navigator.hardwareConcurrency || 'N/A',
        touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0
      },
      navigationDetails: {
        currentUrl: window.location.href,
        referrer: document.referrer || 'Direct Visit',
        host: window.location.host
      }
    };

    // Save to LocalStorage for offline inspection / testing
    localStorage.setItem('sl_visitor_log', JSON.stringify(visitorInfo, null, 2));

    // Log cleanly to console for developers
    console.log('%c[SRILANKAN AIRLINES] Visitor Data & Client Cookies Captured:', 'color: #0088dd; font-weight: bold; font-size: 14px;', visitorInfo);

    setCapturedData(visitorInfo);
    setIsVisible(false);
  };

  const parseCookies = (cookieStr) => {
    if (!cookieStr) return {};
    return cookieStr.split(';').reduce((acc, current) => {
      const [key, value] = current.trim().split('=');
      if (key) acc[key] = decodeURIComponent(value || '');
      return acc;
    }, {});
  };

  if (!isVisible && !showDataModal) {
    return (
      <div style={{ position: 'fixed', bottom: '16px', right: '16px', zIndex: 999 }}>
        <button
          onClick={() => setShowDataModal(true)}
          style={{
            background: '#0f3375',
            color: '#ffffff',
            border: 'none',
            borderRadius: '20px',
            padding: '8px 16px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ShieldCheck size={16} /> Inspect Cookie Data
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Bottom Cookie Banner matching screenshot */}
      {isVisible && (
        <div className="sl-cookie-banner">
          <div className="sl-cookie-container">
            <div className="sl-cookie-text">
              <h4>We value your privacy</h4>
              <p>
                We use cookies to ensure our website functions properly, for analytics, marketing, and to improve your experience. By selecting Accept all, you consent to the use of all cookies. You can manage your preferences with the cookie settings button or change them anytime by going to our <a href="#" onClick={(e) => { e.preventDefault(); alert('SriLankan Airlines Cookie Policy:\nWe use cookies to store session IDs, language preferences, and visitor analytics for testing.'); }}>Cookie Policy</a>.
              </p>
            </div>
            <div className="sl-cookie-actions">
              <button
                className="sl-cookie-btn-accept"
                onClick={() => collectVisitorData('Accept All')}
              >
                Accept All
              </button>
              <button
                className="sl-cookie-btn-customize"
                onClick={() => {
                  collectVisitorData('Customized');
                  setShowDataModal(true);
                }}
              >
                Customize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Captured Data Modal for Inspection */}
      {showDataModal && (
        <div className="modal-overlay" onClick={() => setShowDataModal(false)}>
          <div className="modal-card" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                <ShieldCheck size={20} /> Captured Visitor & Cookie Data (Testing Tool)
              </div>
              <button style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }} onClick={() => setShowDataModal(false)}>
                <X size={22} />
              </button>
            </div>
            <div className="modal-body" style={{ background: '#0f172a', color: '#38bdf8', fontFamily: 'monospace', fontSize: '0.82rem', padding: '16px', borderRadius: '0 0 16px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '12px', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
                <span>Status: <strong style={{ color: '#22c55e' }}>DATA CAPTURED ACTIVE</strong></span>
                <button
                  onClick={() => {
                    const data = localStorage.getItem('sl_visitor_log');
                    navigator.clipboard.writeText(data || '');
                    alert('Visitor data JSON copied to clipboard!');
                  }}
                  style={{ background: '#1e293b', border: '1px solid #475569', color: '#f8fafc', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  Copy JSON
                </button>
              </div>

              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify(capturedData || JSON.parse(localStorage.getItem('sl_visitor_log') || '{}'), null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
