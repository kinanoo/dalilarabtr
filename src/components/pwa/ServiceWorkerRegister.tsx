'use client';

import { useEffect } from 'react';
import logger from '@/lib/logger';

export default function ServiceWorkerRegister() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            // Register the service worker
            navigator.serviceWorker
                .register('/sw.js')
                .then(() => {
                    // SW registered successfully
                })
                .catch((error) => {
                    logger.error('Service Worker registration failed:', error);
                });
        }
    }, []);

    return null;
}
