'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';
import { Loader2 } from 'lucide-react';

const defaultIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface LocationPickerProps {
    value?: { lat: number; lng: number };
    onChange: (lat: number, lng: number) => void;
}

function LocationMarker({ position, setPosition }: { position: { lat: number, lng: number } | null, setPosition: (pos: { lat: number, lng: number }) => void }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });

    return position === null ? null : (
        <Marker position={position} icon={defaultIcon}></Marker>
    );
}

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
    const [position, setPosition] = useState<{ lat: number; lng: number } | null>(value || null);

    useEffect(() => {
        if (value) setPosition(value);
    }, [value]);

    const handleSetPosition = (pos: { lat: number; lng: number }) => {
        setPosition(pos);
        onChange(pos.lat, pos.lng);
    };

    const [mapId] = useState(() => Math.random().toString(36).substring(2, 9));

    return (
        <div className="w-full h-[300px] rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 relative z-0">
            <MapContainer
                key={mapId}
                center={value ? [value.lat, value.lng] : [39.9334, 32.8597]}
                zoom={value ? 13 : 5}
                className="w-full h-full"
                style={{ height: '100%', width: '100%', zIndex: 0 }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={position} setPosition={handleSetPosition} />
            </MapContainer>

            {/* Instruction Overlay */}
            <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 px-3 py-1 text-xs font-bold rounded-full shadow-lg z-[400] pointer-events-none">
                اضغط على الخريطة لتحديد موقعك
            </div>
        </div>
    );
}
