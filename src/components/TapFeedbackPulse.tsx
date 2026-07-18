'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isPrivateModelSharePath } from '@/lib/models/routes';

const INTERACTIVE_SELECTOR = [
  'a[href]',
  'button',
  'summary',
  '[role="button"]',
  '[role="link"]',
  'input[type="button"]',
  'input[type="submit"]',
  'input[type="reset"]',
  'label[for]',
].join(',');

function isDisabled(element: Element): boolean {
  return Boolean(
    element.closest(
      '[disabled], [aria-disabled="true"], [data-click-feedback="off"]',
    ),
  );
}

export default function TapFeedbackPulse() {
  const pathname = usePathname();

  useEffect(() => {
    if (isPrivateModelSharePath(pathname)) return;

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');

    function onPointerDown(event: PointerEvent) {
      if (event.button !== 0 || prefersReducedMotion?.matches) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const interactive = target.closest(INTERACTIVE_SELECTOR);
      if (!interactive || isDisabled(interactive)) return;

      const pulse = document.createElement('span');
      pulse.className = 'tap-feedback-pulse';
      pulse.style.left = `${event.clientX}px`;
      pulse.style.top = `${event.clientY}px`;
      document.body.appendChild(pulse);

      window.setTimeout(() => pulse.remove(), 620);
    }

    // The ripple only matters once the user taps (always post-load), so attach
    // at browser idle instead of during the post-hydration effect flush — keeps
    // this off the critical main-thread window on weak devices.
    const w = window as unknown as {
      requestIdleCallback?: (c: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (i: number) => void;
    };
    const attach = () => document.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true });
    const idleId = w.requestIdleCallback
      ? w.requestIdleCallback(attach, { timeout: 2000 })
      : window.setTimeout(attach, 200);
    return () => {
      if (w.cancelIdleCallback) w.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
      document.removeEventListener('pointerdown', onPointerDown, { capture: true });
    };
  }, [pathname]);

  return null;
}
