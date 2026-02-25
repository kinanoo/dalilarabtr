'use client';

import { useEffect } from 'react';

export default function FontLoader() {
    useEffect(() => {
        import('@fontsource/cairo/600.css');
        import('@fontsource/cairo/700.css');
    }, []);
    return null;
}
