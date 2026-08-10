import { hasAnalyticsConsent } from '@/lib/consent';
import { sanitizeSearchQuery } from '@/lib/analyticsPrivacy';

// ============================================
// 📊 Google Analytics Helper Functions
// ============================================

declare global {
    interface Window {
        gtag?: (
            command: string,
            targetId: string,
            config?: Record<string, any>
        ) => void;
    }
}

// ============================================
// 🎯 Track Custom Events
// ============================================

export const trackEvent = (
    action: string,
    category: string,
    label?: string,
    value?: number
) => {
    if (typeof window !== 'undefined' && hasAnalyticsConsent() && window.gtag) {
        window.gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value,
        });
    }
};

function trackFirstPartyEvent(eventName: string, meta: Record<string, unknown> = {}) {
    if (typeof window === 'undefined') return;
    try {
        const body = JSON.stringify({
            event_name: eventName,
            page_path: window.location.pathname,
            analytics_consent: hasAnalyticsConsent(),
            meta,
        });
        const sent = navigator.sendBeacon?.('/api/track', new Blob([body], { type: 'application/json' })) ?? false;
        if (!sent) {
            fetch('/api/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
                keepalive: true,
            }).catch(() => {});
        }
    } catch {
        /* analytics must never affect the visitor's task */
    }
}

// ============================================
// 📱 WhatsApp Events
// ============================================

export const trackWhatsAppClick = (source: string) => {
    trackEvent('whatsapp_click', 'engagement', source);
};

export const trackWhatsAppMessageSent = (messageType: string) => {
    trackEvent('whatsapp_message_sent', 'conversion', messageType);
};

// ============================================
// 🛠️ Tool Usage Events
// ============================================

// Fires TWO signals when a visitor actually opens a tool:
//   1. a GA event (immediate, for the GA funnel), and
//   2. a row into analytics_events via /api/track (event_name='tool_use',
//      meta.tool=<id>) — our own DB, so the owner can rank tools by real usage
//      (aggregate: count where event_name='tool_use' group by meta->>'tool').
// This is a distinct, higher-intent signal than a raw page view. Fire-and-forget:
// never let a tracking failure affect the tool itself.
export const trackToolUse = (toolId: string) => {
    // Google Analytics remains consent-gated through trackEvent.
    trackEvent('tool_use', 'tools', toolId);
    trackFirstPartyEvent('tool_use', { tool: toolId });
};

// ============================================
// 💼 Service Events
// ============================================

export const trackServiceView = (serviceName: string) => {
    trackEvent('service_view', 'engagement', serviceName);
};

export const trackServiceContact = (serviceName: string) => {
    trackEvent('service_contact', 'conversion', serviceName);
};

// ============================================
// ⭐ Review Events
// ============================================

export const trackReviewSubmitted = (serviceId: string, rating: number) => {
    trackEvent('review_submitted', 'engagement', serviceId, rating);
};

export const trackReviewHelpful = (reviewId: string) => {
    trackEvent('review_helpful_click', 'engagement', reviewId);
};

// ============================================
// 🔍 Search Events
// ============================================

export const trackSearch = (query: string, resultCount: number) => {
    const safeQuery = sanitizeSearchQuery(query);
    if (!safeQuery) return;
    trackEvent('search', 'engagement', safeQuery, resultCount);
    trackFirstPartyEvent('search', {
        query: safeQuery,
        result_count: Math.max(0, Math.min(100, Math.round(resultCount))),
        outcome: resultCount > 0 ? 'results' : 'zero',
    });
};

export const trackSearchResultClick = (
    query: string,
    result: { id: string; type: string; url: string },
    rank: number,
    action: 'open' | 'map' | 'submit' = 'open',
) => {
    const safeQuery = sanitizeSearchQuery(query);
    if (!safeQuery) return;
    trackEvent('search_result_click', 'engagement', `${safeQuery} -> ${result.type}`);
    trackFirstPartyEvent('search_result_click', {
        query: safeQuery,
        result_id: result.id,
        result_type: result.type,
        result_url: result.url,
        rank: Math.max(1, Math.min(100, Math.round(rank))),
        action,
    });
};

export const trackPwaEvent = (
    action: 'shown' | 'dismissed' | 'accepted' | 'declined' | 'installed',
    platform: 'android' | 'ios' | 'other',
) => {
    trackEvent(`pwa_${action}`, 'pwa', platform);
    trackFirstPartyEvent(`pwa_${action}`, { platform });
};

// ============================================
// 📄 Content Events
// ============================================

export const trackArticleView = (articleId: string, articleTitle: string) => {
    trackEvent('article_view', 'engagement', `${articleId}: ${articleTitle}`);
};

export const trackArticleShare = (articleId: string, platform: string) => {
    trackEvent('article_share', 'engagement', `${articleId} via ${platform}`);
};

// ============================================
// 🔖 Bookmark Events
// ============================================

export const trackBookmarkAdded = (pageId: string) => {
    trackEvent('bookmark_added', 'engagement', pageId);
};

export const trackBookmarkRemoved = (pageId: string) => {
    trackEvent('bookmark_removed', 'engagement', pageId);
};

// ============================================
// 🔔 Notification Events
// ============================================

export const trackNotificationClick = (notificationId: string, notificationType: string) => {
    trackEvent('notification_click', 'engagement', `${notificationType}: ${notificationId}`);
};

export const trackNotificationDismiss = () => {
    trackEvent('notification_dismiss', 'engagement');
};

// ============================================
// 🎯 Conversion Events (المهمة!)
// ============================================

export const trackConversion = (conversionType: string, value?: number) => {
    if (hasAnalyticsConsent() && window.gtag) {
        window.gtag('event', 'conversion', {
            send_to: conversionType,
            value: value,
        });
    }
};

// ============================================
// 👤 User Properties
// ============================================

export const setUserProperty = (propertyName: string, value: string) => {
    if (hasAnalyticsConsent() && window.gtag) {
        window.gtag('set', 'user_properties', {
            [propertyName]: value,
        });
    }
};

// ============================================
// 🌐 Page View (Manual)
// ============================================

export const trackPageView = (url: string) => {
    if (hasAnalyticsConsent() && window.gtag) {
        window.gtag('event', 'page_view', {
            page_path: url,
        });
    }
};
