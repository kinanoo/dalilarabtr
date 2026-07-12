'use client';

import { useEffect } from 'react';

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
  useEffect(() => {
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

    document.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true });
    return () => document.removeEventListener('pointerdown', onPointerDown, { capture: true });
  }, []);

  return null;
}
