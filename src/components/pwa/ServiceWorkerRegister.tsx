'use client';

import { useEffect } from 'react';
import logger from '@/lib/logger';

export default function ServiceWorkerRegister() {
    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

        // If a service worker was ALREADY controlling this page (an old, caching
        // SW from a previous deploy), and a NEW one then takes control, reload
        // once so the page runs cleanly under the fresh push-only SW with no
        // stale cache in front of it. First-time visitors (no prior controller)
        // are NOT reloaded.
        const hadController = !!navigator.serviceWorker.controller;
        let reloaded = false;
        const onControllerChange = () => {
            if (reloaded || !hadController) return;
            reloaded = true;
            window.location.reload();
        };
        navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

        navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
                // Pull the latest SW immediately so a redeploy is picked up at
                // once instead of waiting for the browser's periodic check.
                registration.update().catch(() => {});
            })
            .catch((error) => {
                logger.error('Service Worker registration failed:', error);
            });

        return () => {
            navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
        };
    }, []);

    return null;
}
