'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { urlBase64ToUint8Array } from '@/lib/utils/vapid';

export default function NotificationManager() {
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);

            // Register Service Worker
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        }
    }, []);

    const subscribeToPush = async () => {
        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                const registration = await navigator.serviceWorker.ready;

                // Get VAPID Key
                const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                if (!vapidPublicKey) {
                    console.error('VAPID Public Key not found');
                    return;
                }

                const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

                // Subscribe
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidKey
                });

                if (!supabase) return;

                // Save to Supabase
                const { error } = await supabase
                    .from('push_subscriptions')
                    .insert({
                        endpoint: subscription.endpoint,
                        p256dh: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('p256dh')!)))),
                        auth: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('auth')!)))),
                        user_id: (await supabase.auth.getUser()).data.user?.id
                    });

                if (error) {
                    if (error.code === '23505') { // Unique violation
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
        } catch (error) {
            console.error('Error requesting permission:', error);
            toast.error('حدث خطأ أثناء تفعيل الإشعارات');
        }
    };

    // Don't render anything if not supported or already granted/denied (unless we want a settings button)
    // For now, let's show a floating button ONLY if permission is 'default' (not asked yet)
    if (!isSupported || permission !== 'default') return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-700 delay-1000">
            <button
                onClick={subscribeToPush}
                className="group flex items-center gap-3 bg-slate-900/90 dark:bg-slate-100/90 text-white dark:text-slate-900 px-4 py-3 rounded-full shadow-2xl hover:scale-105 transition-all backdrop-blur-md border border-white/10"
            >
                <div className="relative">
                    <Bell size={20} className="text-emerald-400 dark:text-emerald-600 animate-pulse" />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold leading-tight">تفعيل التنبيهات</p>
                    <p className="text-[10px] opacity-80">لتبقى على اطلاع بآخر التحديثات</p>
                </div>
            </button>
        </div>
    );
}
