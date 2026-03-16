/**
 * 🗺️ Lazy-loaded Map Components
 * ==============================
 * Leaflet is 104KB+ — only load when map is actually needed.
 * Use these instead of importing LeafletMap/InteractiveMap/LocationPicker directly.
 */

'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const MapLoading = () => (
  <div className="flex items-center justify-center h-[300px] bg-slate-100 dark:bg-slate-800 rounded-xl">
    <Loader2 className="animate-spin text-emerald-500" size={28} />
    <span className="mr-3 text-sm text-slate-500">جاري تحميل الخريطة...</span>
  </div>
);

export const LazyLeafletMap = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: MapLoading,
});

export const LazyInteractiveMap = dynamic(() => import('@/components/map/InteractiveMap'), {
  ssr: false,
  loading: MapLoading,
});

export const LazyLocationPicker = dynamic(() => import('@/components/map/LocationPicker'), {
  ssr: false,
  loading: MapLoading,
});
