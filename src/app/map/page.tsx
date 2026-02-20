'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, MapPin, Search } from 'lucide-react';
import Link from 'next/link';

// Dynamically import Map to avoid SSR issues
const InteractiveMap = dynamic(() => import('@/components/map/InteractiveMap'), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl"><Loader2 className="animate-spin text-emerald-600" size={32} /></div>
});

const CITIES = [
    { name: 'إسطنبول', lat: 41.0082, lng: 28.9784 },
    { name: 'أنقرة', lat: 39.9334, lng: 32.8597 },
    { name: 'إزمير', lat: 38.4237, lng: 27.1428 },
    { name: 'بورصة', lat: 40.1885, lng: 29.0610 },
    { name: 'أنطاليا', lat: 36.8969, lng: 30.7133 },
    { name: 'غازي عنتاب', lat: 37.0662, lng: 37.3833 },
    { name: 'مرسين', lat: 36.8121, lng: 34.6415 },
];

export default function MapPage() {
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [center, setCenter] = useState<[number, number]>([39.9334, 32.8597]); // Default Turkey center
    const [zoom, setZoom] = useState(6);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        setLoading(true);
        // Fetch approved services WITH coordinates
        // Note: lat/lng columns must exist. If they don't, this query will fail silently or return partial data.
        if (!supabase) {
            console.error('Supabase client not initialized');
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('service_providers')
            .select('id, name, profession, category, lat, lng, image')
            .eq('status', 'approved')
            .not('lat', 'is', null) // Only those with coordinates
            .not('lng', 'is', null);

        if (error) {
            console.error('Error fetching services for map:', error);
        } else {
            setServices(data || []);
        }
        setLoading(false);
    };

    const handleCityChange = (lat: number, lng: number) => {
        setCenter([lat, lng]);
        setZoom(10);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo" dir="rtl">
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 h-16 flex items-center px-4 justify-between">
                <div className="flex items-center gap-2">
                    <Link href="/" className="font-black text-xl text-slate-900 dark:text-white flex items-center gap-2">
                        <MapPin className="text-emerald-500" />
                        خريطة الخدمات
                    </Link>
                </div>
                <Link href="/services" className="text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors">
                    عرض كقائمة
                </Link>
            </header>

            <div className="flex flex-col-reverse lg:flex-row h-[calc(100vh-64px)] relative">

                {/* Sidebar Filters */}
                <div className="w-full h-[40vh] lg:h-full lg:w-80 bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 p-4 overflow-y-auto shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.08)] lg:shadow-xl relative">
                    <h2 className="font-bold text-slate-800 dark:text-white mb-4">اختر المدينة</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 mb-6">
                        <button
                            onClick={() => { setCenter([39.9334, 32.8597]); setZoom(6); }}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-700 dark:text-slate-300 py-2 px-4 rounded-lg text-sm font-bold transition-all text-right"
                        >
                            📍 كل تركيا
                        </button>
                        {CITIES.map(city => (
                            <button
                                key={city.name}
                                onClick={() => handleCityChange(city.lat, city.lng)}
                                className="bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-700 dark:text-slate-300 py-2 px-4 rounded-lg text-sm font-bold transition-all text-right"
                            >
                                {city.name}
                            </button>
                        ))}
                    </div>

                    <h2 className="font-bold text-slate-800 dark:text-white mb-4 border-t border-slate-100 dark:border-slate-800 pt-4">إحصائيات</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">عدد الخدمات النشطة</span>
                            <span className="font-bold text-emerald-600">{services.length}</span>
                        </div>
                    </div>
                </div>

                {/* Map Area */}
                <div className="flex-1 w-full h-[60vh] lg:h-full relative bg-slate-200 dark:bg-slate-800">
                    <InteractiveMap services={services} center={center} zoom={zoom} />

                    {/* Floating Search Bar (Visual Only for now) */}
                    <div className="absolute top-4 right-4 left-4 lg:left-auto lg:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] z-[1000] p-2 flex items-center gap-2 border border-slate-200 dark:border-slate-800">
                        <Search className="text-slate-400 ml-2" size={20} />
                        <input
                            type="text"
                            placeholder="ابحث عن طبيب، مطعم..."
                            className="w-full bg-transparent outline-none text-sm font-bold text-slate-700 dark:text-slate-200"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
