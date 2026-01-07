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
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value,
        });
    }
};

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

export const trackSearch = (query: string) => {
    trackEvent('search', 'engagement', query);
};

export const trackSearchResultClick = (query: string, resultTitle: string) => {
    trackEvent('search_result_click', 'engagement', `${query} -> ${resultTitle}`);
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
    if (typeof window !== 'undefined' && window.gtag) {
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
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('set', 'user_properties', {
            [propertyName]: value,
        });
    }
};

// ============================================
// 🌐 Page View (Manual)
// ============================================

export const trackPageView = (url: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'page_view', {
            page_path: url,
        });
    }
};
