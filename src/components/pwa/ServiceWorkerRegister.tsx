'use client';

import { useEffect } from 'react';

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
                    console.error('Service Worker registration failed:', error);
                });
        }
    }, []);

    return null;
}
