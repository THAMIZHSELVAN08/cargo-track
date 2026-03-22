import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Activity, Expand, Shrink, Truck } from 'lucide-react';

// Fix Leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Create colored truck SVG icon ──────────────────────────────────────
function makeTruckIcon(color = '#1A73E8') {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" width="52" height="52">
      <circle cx="26" cy="26" r="24" fill="white" stroke="${color}" stroke-width="3"/>
      <g transform="translate(9, 15)">
        <rect x="0" y="4" width="20" height="13" rx="2" fill="${color}"/>
        <path d="M20 7.5 L30 7.5 L32 13 L20 13 Z" fill="${color}"/>
        <circle cx="6"  cy="19.5" r="4" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="24" cy="19.5" r="4" fill="${color}" stroke="white" stroke-width="2"/>
        <rect x="1" y="5.5" width="18" height="6" rx="1" fill="white" opacity="0.2"/>
        <path d="M21 8.5 L28.5 8.5 L30 12 L21 12 Z" fill="white" opacity="0.4"/>
      </g>
    </svg>`;
  return new L.DivIcon({
    html: `<div style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));">${svg}</div>`,
    iconSize:    [52, 52],
    iconAnchor:  [26, 26],
    popupAnchor: [0, -28],
    className:   '',
  });
}

// Driver-specific colors (Google Maps palette)
const DRIVER_COLORS = {
  'C-8842': '#1A73E8',  // Google Blue  — Thamizh
  'C-109X': '#EA4335',  // Google Red   — Selvan
  'C-38Z9': '#0F9D58',  // Google Green — Visvanth
  'C-99A1': '#F9AB00',  // Google Yellow — Ram
  'C-44B2': '#9334E6',  // Purple       — Hamilton
};

function getColor(containerId) {
  for (const [key, color] of Object.entries(DRIVER_COLORS)) {
    if (containerId && containerId.startsWith(key)) return color;
  }
  return '#5F6368';
}

// ── Auto-fit bounds ─────────────────────────────────────────────────────
function FitBounds({ locations }) {
  const map = useMap();
  useEffect(() => {
    if (locations && locations.length > 0) {
      try {
        const bounds = L.latLngBounds(locations.map(l => [l.lat, l.lng]));
        map.fitBounds(bounds, { padding: [60, 60] });
      } catch (_) {}
    }
  }, [locations.length]);
  return null;
}

const STYLES = `
  .mp-root .leaflet-container {
    background: #e8eaed !important;
    border-radius: 18px;
  }

  /* Google Maps style popup */
  .mp-root .leaflet-popup-content-wrapper {
    background: #FFFFFF;
    border: none;
    border-radius: 12px !important;
    box-shadow: 0 4px 20px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.1) !important;
    padding: 0 !important;
    overflow: hidden;
  }
  .mp-root .leaflet-popup-content {
    margin: 0 !important;
    width: auto !important;
  }
  .mp-root .leaflet-popup-tip-container { display: none !important; }
  .mp-root .leaflet-popup-close-button {
    color: rgba(255,255,255,0.9) !important;
    font-size: 22px !important;
    right: 8px !important; top: 6px !important;
    z-index: 10;
  }

  /* Expand button — Google Maps style */
  .mp-expand-btn {
    position: absolute;
    top: 72px; right: 10px;
    z-index: 1000;
    background: #FFFFFF;
    border: none;
    border-radius: 2px;
    box-shadow: 0 1px 5px rgba(0,0,0,0.35);
    color: #5F6368;
    width: 40px; height: 40px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: background 0.15s;
  }
  .mp-expand-btn:hover {
    background: #F8F9FA;
    color: #1A73E8;
  }

  @keyframes mp-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  .mp-pulse { animation: mp-pulse 2s ease-in-out infinite; }
`;

export default function MapPanel() {
  const [locations, setLocations] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Fallback mock data with distinct driver names
  const INITIAL_MOCK = [
    { _id: 'd1', containerId: 'C-8842', driverName: 'Thamizh',  lat: 13.0827, lng: 80.2707, speed: 58, anomalyStatus: 'NORMAL',  dLat:  0.009, dLng: -0.005, route: 'Chennai → Delhi'     },
    { _id: 'd2', containerId: 'C-109X', driverName: 'Selvan',   lat: 19.0760, lng: 72.8777, speed: 72, anomalyStatus: 'ANOMALY', dLat:  0.005, dLng:  0.007, route: 'Mumbai → Kolkata',   anomalyDetails: 'Location outside expected route corridor' },
    { _id: 'd3', containerId: 'C-38Z9', driverName: 'Visvanth', lat: 28.7041, lng: 77.1025, speed: 61, anomalyStatus: 'NORMAL',  dLat: -0.007, dLng:  0.004, route: 'Delhi → Bangalore'   },
    { _id: 'd4', containerId: 'C-99A1', driverName: 'Ram',      lat: 22.5726, lng: 88.3639, speed: 84, anomalyStatus: 'NORMAL',  dLat: -0.004, dLng: -0.008, route: 'Kolkata → Mumbai'    },
    { _id: 'd5', containerId: 'C-44B2', driverName: 'Hamilton', lat: 12.9716, lng: 77.5946, speed:  0, anomalyStatus: 'NORMAL',  dLat:  0.005, dLng:  0.005, route: 'Bangalore → Chennai'  },
  ];

  const fetchLocations = async () => {
    try {
      const res = await api.get('/gps/all');
      if (res.data?.locations?.length > 0) {
        setLocations(res.data.locations);
      } else {
        simulateMovement();
      }
    } catch {
      simulateMovement();
    }
  };

  const simulateMovement = () => {
    setLocations(prev => {
      if (prev.length === 0) return INITIAL_MOCK;
      return prev.map(d => {
        const orig = INITIAL_MOCK.find(x => x._id === d._id) || d;
        return { ...d, lat: d.lat + (orig.dLat || 0), lng: d.lng + (orig.dLng || 0) };
      });
    });
  };

  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event('resize')), 400);
    return () => clearTimeout(t);
  }, [isExpanded]);

  return (
    <>
      <style>{STYLES}</style>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999 }}
          onClick={() => setIsExpanded(false)}
        />
      )}

      <motion.div
        layout
        className="mp-root"
        style={
          isExpanded
            ? { position: 'fixed', top: 16, left: 16, right: 16, bottom: 16, zIndex: 10000, borderRadius: 18, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }
            : { width: '100%', height: '100%', borderRadius: 18, overflow: 'hidden', position: 'relative' }
        }
      >
        {/* Google Maps-style header pill */}
        <div style={{
          position: 'absolute', top: 12, left: 12, zIndex: 1000,
          background: '#FFFFFF',
          borderRadius: 24,
          padding: '8px 14px',
          boxShadow: '0 1px 5px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Activity size={16} color="#1A73E8" className="mp-pulse" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#202124' }}>Live Fleet Tracker</span>
          <span style={{ background: '#E8F0FE', color: '#1A73E8', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>
            {locations.length} trucks
          </span>
        </div>

        {/* Expand / collapse button */}
        <button
          className="mp-expand-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Collapse Map' : 'Expand Map'}
        >
          {isExpanded ? <Shrink size={20} /> : <Expand size={20} />}
        </button>

        {/* ── Map ── */}
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          {/* ESRI World Street Map — closest freely available Google Maps look */}
          <TileLayer
            attribution='Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, DeLorme, NAVTEQ'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />

          {/* Auto-fit all truck markers into view */}
          {locations.length > 0 && <FitBounds locations={locations} />}

          {/* Truck markers */}
          {locations.map((loc) => {
            const baseColor = getColor(loc.containerId);
            const markerColor = loc.anomalyStatus === 'ANOMALY' ? '#EA4335' : baseColor;
            const icon = makeTruckIcon(markerColor);
            const name = loc.driverName || loc.containerId;
            const route = loc.route || '';

            return (
              <Marker key={loc._id} position={[loc.lat, loc.lng]} icon={icon}>
                <Popup maxWidth={300} closeButton>
                  <div style={{ fontFamily: '"Roboto","Google Sans",system-ui,sans-serif', borderRadius: 12, overflow: 'hidden', minWidth: 250 }}>

                    {/* Colored driver header */}
                    <div style={{
                      background: markerColor,
                      padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      position: 'relative',
                    }}>
                      <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Truck size={22} color="white" />
                      </div>
                      <div>
                        <div style={{ color: 'white', fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>{name}</div>
                        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 1 }}>{loc.containerId}</div>
                      </div>
                    </div>

                    {/* Route pill */}
                    {route && (
                      <div style={{ padding: '8px 14px', background: '#F1F3F4', borderBottom: '1px solid #E8EAED', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11 }}>📍</span>
                        <span style={{ fontSize: 12, color: '#3C4043', fontWeight: 500 }}>{route}</span>
                      </div>
                    )}

                    {/* Stats grid */}
                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#5F6368', fontSize: 13 }}>Speed</span>
                        <span style={{ fontWeight: 700, fontSize: 16, color: '#202124' }}>{loc.speed ?? 0} <span style={{ fontSize: 12, fontWeight: 400, color: '#5F6368' }}>km/h</span></span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#5F6368', fontSize: 13 }}>Status</span>
                        <span style={{
                          fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                          background: loc.anomalyStatus === 'ANOMALY' ? '#FCE8E6' : '#E6F4EA',
                          color:      loc.anomalyStatus === 'ANOMALY' ? '#C5221F' : '#137333',
                        }}>
                          {loc.anomalyStatus === 'ANOMALY' ? '⚠ ANOMALY' : '✓ NORMAL'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#5F6368', fontSize: 13 }}>Coordinates</span>
                        <span style={{ fontSize: 11, color: '#80868B', fontFamily: 'monospace' }}>
                          {loc.lat?.toFixed(4)}, {loc.lng?.toFixed(4)}
                        </span>
                      </div>

                      {loc.anomalyDetails && (
                        <div style={{
                          padding: '10px 12px',
                          background: '#FCE8E6',
                          border: '1px solid #F28B82',
                          borderRadius: 8,
                          fontSize: 12, color: '#C5221F', lineHeight: 1.5,
                        }}>
                          ⚠ {loc.anomalyDetails}
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </motion.div>
    </>
  );
}