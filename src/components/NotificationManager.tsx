'use client';

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { urlBase64ToUint8Array } from '@/lib/utils/vapid';

const DISMISS_KEY = 'daleel.push_prompt_dismissed';

export default function NotificationManager() {
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);

            // Register Service Worker
            navigator.serviceWorker.register('/sw.js')
                .then(() => {
                    // SW registered successfully
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        }
    }, []);

    // Show prompt after a short delay, respecting dismiss
    useEffect(() => {
        if (!isSupported || permission !== 'default') return;

        const dismissed = localStorage.getItem(DISMISS_KEY);
        if (dismissed) {
            // If dismissed more than 7 days ago, show again
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
                const registration = await navigator.serviceWorker.ready;

                const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                if (!vapidPublicKey) {
                    console.error('VAPID Public Key not found');
                    return;
                }

                const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidKey
                });

                if (!supabase) return;

                const { error } = await supabase
                    .from('push_subscriptions')
                    .insert({
                        endpoint: subscription.endpoint,
                        p256dh: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('p256dh')!)))),
                        auth: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('auth')!)))),
                        user_id: (await supabase.auth.getUser()).data.user?.id
                    });

                if (error) {
                    if (error.code === '23505') {
                        toast.success('تم تفعيل الإشعارات بنجاح!');
                    } else {
                        console.error('Error saving subscription:', error);
                        toast.error('حدث خطأ أثناء حفظ الاشتراك');
                    }
                } else {
                    toast.success('تم تفعيل الإشعارات بنجاح!', {
                        description: 'ستصلك آخر التحديثات والأخبار المهمة فوراً.'
                    });
                }
            }

            setIsVisible(false);
        } catch (error) {
            console.error('Error requesting permission:', error);
            toast.error('حدث خطأ أثناء تفعيل الإشعارات');
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
    };

    if (!isSupported || permission !== 'default' || !isVisible) return null;

    return (
        <div className="fixed bottom-20 sm:bottom-4 right-4 z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-700">
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
