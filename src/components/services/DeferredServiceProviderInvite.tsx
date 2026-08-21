'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const ServiceProviderInvite = dynamic(() => import('./ServiceProviderInvite'), { ssr: false });

/** Do not download the provider invitation modal until the visitor explores results. */
export default function DeferredServiceProviderInvite() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;
    const onScroll = () => {
      if (window.scrollY < 280) return;
      setReady(true);
      window.removeEventListener('scroll', onScroll);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [ready]);

  return ready ? <ServiceProviderInvite /> : null;
}
