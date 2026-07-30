'use client';

import { type MouseEvent, type ReactNode } from 'react';
import { buildWhatsAppHref, openWhatsAppDirect } from '@/lib/whatsapp';

interface DirectWhatsAppLinkProps {
  phone: string;
  text?: string;
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
  onClick?: () => void;
}

export default function DirectWhatsAppLink({
  phone,
  text,
  className,
  ariaLabel,
  children,
  onClick,
}: DirectWhatsAppLinkProps) {
  const href = buildWhatsAppHref(phone, text) || '#';

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.();
    if (openWhatsAppDirect(phone, text)) {
      event.preventDefault();
    }
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}

