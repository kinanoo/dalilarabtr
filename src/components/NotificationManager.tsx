'use client';

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { urlBase64ToUint8Array } from '@/lib/utils/vapid';
import logger from '@/lib/logger';
import { trackEvent } from '@/lib/analytics';

const DISMISS_KEY = 'daleel.push_prompt_dismissed';
// Bumped when the subscription must be re-bound (e.g. after the VAPID key that
// the stored subs were created with turned out to be dead). A browser whose
// SYNC value != the current public key gets migrated once, silently.
const SYNC_KEY = 'daleel.push_key_synced';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

// Byte-compare an existing subscription's applicationServerKey (ArrayBuffer)
// against the current one. A mismatch means the subscription was created with
// an OLD VAPID key and can never receive a push signed by the current key
// (the push service returns 403), so it must be torn down and recreated.
function keyMatches(existing: ArrayBuffer | null | undefined, current: Uint8Array): boolean {
    if (!existing) return false;
    const a = new Uint8Array(existing);
    if (a.length !== current.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== current[i]) return false;
    return true;
}

function encodeKey(sub: PushSubscription, name: 'p256dh' | 'auth'): string {
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(sub.getKey(name)!))));
}

async function persistSubscription(sub: PushSubscription): Promise<void> {
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    // Plain insert (no onConflict — the table's unique constraints aren't in a
    // tracked migration, so don't assume one on `endpoint`). A fresh subscribe
    // always yields a NEW endpoint, so this is an INSERT in practice; a repeat
    // of the same endpoint returns 23505, which we treat as "already saved".
    const { error } = await supabase
        .from('push_subscriptions')
        .insert({
            endpoint: sub.endpoint,
            p256dh: encodeKey(sub, 'p256dh'),
            auth: encodeKey(sub, 'auth'),
            user_id: user?.id ?? null,
        });
    if (error && error.code !== '23505') {
        logger.error('Error saving push subscription:', error);
        throw error;
    }
}

// Guarantee a push subscription bound to the CURRENT VAPID key exists, then
// persist it. If the browser holds a subscription from a different (old) key,
// unsubscribe it first — otherwise pushManager.subscribe() throws
// "A subscription with a different applicationServerKey already exists" and the
// user is stuck on a dead subscription forever.
async function ensureFreshSubscription(): Promise<boolean> {
    if (!VAPID_PUBLIC_KEY) {
        logger.error('VAPID public key missing — cannot subscribe to push');
        return false;
    }
    const registration = await navigator.serviceWorker.ready;
    const appServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

    let existing = await registration.pushManager.getSubscription();
    if (existing && !keyMatches(existing.options?.applicationServerKey, appServerKey)) {
        try { await existing.unsubscribe(); } catch { /* fall through and re-subscribe */ }
        existing = null;
    }

    const sub = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey,
    });

    await persistSubscription(sub);
    return true;
}

export default function NotificationManager() {
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
        setIsSupported(true);
        setPermission(Notification.permission);

        const start = async () => {
            try {
                await navigator.serviceWorker.register('/sw.js');
            } catch (error) {
                logger.error('Service Worker registration failed:', error);
                return;
            }
            // Self-heal: users who already granted permission (including via
            // browser settings, which never runs the button handler) get a
            // current-key subscription ensured automatically — once per browser
            // per key. This is what migrates everyone off the dead pre-migration
            // VAPID key without asking them to click anything.
            if (Notification.permission === 'granted' && localStorage.getItem(SYNC_KEY) !== VAPID_PUBLIC_KEY) {
                try {
                    if (await ensureFreshSubscription()) {
                        localStorage.setItem(SYNC_KEY, VAPID_PUBLIC_KEY);
                    }
                } catch (error) {
                    logger.error('push self-heal failed:', error);
                }
            }
        };

        // Defer to avoid blocking initial render.
        if ('requestIdleCallback' in window) {
            (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => { void start(); });
        } else {
            setTimeout(() => { void start(); }, 2000);
        }
    }, []);

    // Show the opt-in prompt (new visitors only), respecting a 7-day dismiss.
    useEffect(() => {
        if (!isSupported || permission !== 'default') return;

        const dismissed = localStorage.getItem(DISMISS_KEY);
        if (dismissed) {
            const dismissedAt = parseInt(dismissed, 10);
            if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
        }

        const timer = setTimeout(() => setIsVisible(true), 3000);
        return () => clearTimeout(timer);
    }, [isSupported, permission]);

    const subscribeToPush = async () => {
        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                const ok = await ensureFreshSubscription();
                if (ok) {
                    localStorage.setItem(SYNC_KEY, VAPID_PUBLIC_KEY);
                    trackEvent('subscribe_push', 'conversion', 'prompt');
                    toast.success('تم تفعيل الإشعارات بنجاح!', {
                        description: 'ستصلك آخر التحديثات والأخبار المهمة فوراً.',
                    });
                } else {
                    toast.error('تعذّر تفعيل الإشعارات');
                }
            }

            setIsVisible(false);
        } catch (error) {
            logger.error('Error enabling notifications:', error);
            toast.error('حدث خطأ أثناء تفعيل الإشعارات');
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
    };

    if (!isSupported || permission !== 'default' || !isVisible) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-700">
            <div className="flex items-center gap-2 bg-slate-900/90 dark:bg-slate-100/90 text-white dark:text-slate-900 pl-2 pr-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md border border-white/10">
                <button
                    onClick={handleDismiss}
                    className="p-1 rounded-full hover:bg-white/10 dark:hover:bg-black/10 transition-colors"
                    aria-label="إغلاق"
                >
                    <X size={14} className="opacity-60" />
                </button>

                <button
                    onClick={subscribeToPush}
                    className="flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                    <div className="relative">
                        <Bell size={18} className="text-emerald-400 dark:text-emerald-600" />
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold leading-tight">تفعيل التنبيهات</p>
                        <p className="text-[10px] opacity-70">ابقَ على اطلاع بآخر الأخبار</p>
                    </div>
                </button>
            </div>
        </div>
    );
}
