'use client';

import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const icon = L.icon({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function LeafletMap() {
  const [mapId] = useState(() => Math.random().toString(36).substring(2, 9));
  // القنصلية السورية (Nişantaşı)
  const consulatePos: [number, number] = [41.0491, 28.9934];
  // إدارة الهجرة (Fatih)
  const migrationPos: [number, number] = [41.0122, 28.9760];

  return (
    <MapContainer key={mapId} center={consulatePos} zoom={12} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={consulatePos} icon={icon}>
        <Popup>
          <strong>القنصلية السورية</strong><br />
          العنوان: Nişantaşı, Şişli<br />
          (لتصديق الأوراق والجوازات)
        </Popup>
      </Marker>

      <Marker position={migrationPos} icon={icon}>
        <Popup>
          <strong>دائرة الهجرة (أمنيات الفاتح)</strong><br />
          العنوان: Fatih, İstanbul<br />
          (لمعاملات الإقامة وتحديث البيانات)
        </Popup>
      </Marker>
    </MapContainer>
  );
}