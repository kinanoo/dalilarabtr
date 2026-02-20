'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// Fix Leaflet Default Icon Issue in Next.js
const defaultIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface ServiceLocation {
    id: string;
    name: string;
    profession: string;
    category: string;
    lat: number;
    lng: number;
    image?: string;
}

interface MapProps {
    services: ServiceLocation[];
    center?: [number, number];
    zoom?: number;
}

function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

export default function InteractiveMap({ services, center = [39.9334, 32.8597], zoom = 6 }: MapProps) {
    // Default Center: Turkey (Ankara)

    return (
        <div className="w-full h-full rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 relative z-0">
            <MapContainer
                center={center}
                zoom={zoom}
                scrollWheelZoom={true}
                className="w-full h-full"
                style={{ height: '100%', width: '100%', zIndex: 0 }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapController center={center} zoom={zoom} />

                {services.map((service) => (
                    <Marker
                        key={service.id}
                        position={[service.lat, service.lng]}
                        icon={defaultIcon}
                    >
                        <Popup className="font-cairo" minWidth={200}>
                            <div className="text-center">
                                {service.image && (
                                    <div className="w-16 h-16 mx-auto mb-2 rounded-lg overflow-hidden relative">
                                        <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <h3 className="font-bold text-slate-800 text-sm mb-1">{service.name}</h3>
                                <p className="text-emerald-600 text-xs font-bold mb-2">{service.profession}</p>
                                <Link
                                    href={`/services/${service.id}`}
                                    className="inline-flex items-center gap-1 bg-slate-900 text-white text-[10px] px-3 py-1.5 rounded-full hover:bg-emerald-600 transition-colors"
                                >
                                    التفاصيل <ArrowRight size={10} />
                                </Link>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
