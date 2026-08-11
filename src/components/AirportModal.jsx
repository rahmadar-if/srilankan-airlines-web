import React, { useState } from 'react';
import { AIRPORTS } from '../data/airports';
import { X, Search, Plane } from 'lucide-react';

export default function AirportModal({ isOpen, onClose, onSelect, targetField }) {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filteredAirports = AIRPORTS.filter(a =>
    a.code.toLowerCase().includes(query.toLowerCase()) ||
    a.city.toLowerCase().includes(query.toLowerCase()) ||
    a.name.toLowerCase().includes(query.toLowerCase()) ||
    a.country.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <Plane size={20} /> Select {targetField === 'origin' ? 'Departure' : 'Arrival'} Airport
          </div>
          <button style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }} onClick={onClose}>
            <X size={22} />
          </button>
        </div>
        <div style={{ padding: '16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 14px' }}>
            <Search size={18} color="#64748b" style={{ marginRight: '10px' }} />
            <input
              type="text"
              placeholder="Search by city, airport name or 3-letter code (e.g. CMB, SIN)..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem' }}
            />
          </div>
        </div>
        <div className="modal-body p-0">
          {filteredAirports.map(airport => (
            <div
              key={airport.code}
              style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onClick={() => { onSelect(airport); onClose(); }}
            >
              <div>
                <strong style={{ color: '#0f3375', fontSize: '1rem', display: 'block' }}>{airport.city} ({airport.code})</strong>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{airport.name}, {airport.country}</span>
              </div>
              <span style={{ background: '#e0f2fe', color: '#0088dd', fontWeight: 'bold', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem' }}>{airport.code}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
