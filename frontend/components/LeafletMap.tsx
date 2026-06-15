'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default marker icons in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to dynamically update map center
function MapUpdater({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom());
  }, [center, map]);
  return null;
}

export default function LeafletMap({ 
  center, 
  radius, 
  customers, 
  selectedCustomer, 
  setSelectedCustomer 
}: any) {
  return (
    <MapContainer 
      center={[center.lat, center.lng]} 
      zoom={11} 
      style={{ width: '100%', height: '100%', borderRadius: '24px', zIndex: 0 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      
      <MapUpdater center={center} />
      
      {/* Search Radius Circle */}
      <Circle 
        center={[center.lat, center.lng]} 
        radius={radius * 1000} 
        pathOptions={{ fillColor: '#000000', color: '#000000', fillOpacity: 0.05, weight: 1.5 }}
      />
      
      {/* Center Marker */}
      <Marker position={[center.lat, center.lng]} />
      
      {/* Customer Markers */}
      {customers.map((c: any, i: number) => (
        <Marker 
          key={i} 
          position={[c.latitude, c.longitude]}
          eventHandlers={{
            click: () => setSelectedCustomer(c),
          }}
        >
          <Popup>
            <div className="text-neutral-900 min-w-[200px]">
              <h3 className="font-semibold text-base mb-1">{c.customer_name}</h3>
              <p className="text-xs text-neutral-500 mb-2">{c.mobile_number}</p>
              <div className="space-y-1 text-xs border-t border-neutral-100 pt-2">
                <p><span className="text-neutral-500 mr-1">Model:</span> <span className="font-medium">{c.bike_model}</span></p>
                <p><span className="text-neutral-500 mr-1">Dealer:</span> <span className="font-medium">{c.dealer_name}</span></p>
                <p><span className="text-neutral-500 mr-1">Distance:</span> <span className="font-medium">{c.distance?.toFixed(2)} KM</span></p>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
