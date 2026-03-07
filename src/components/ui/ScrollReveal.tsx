'use client';

import { useScrollReveal } from '@/lib/hooks/useScrollReveal';
import { ReactNode } from 'react';

export default function ScrollReveal({ children, className = '' }: { children: ReactNode; className?: string }) {
    const ref = useScrollReveal<HTMLDivElement>();
    return <div ref={ref} className={className}>{children}</div>;
}
