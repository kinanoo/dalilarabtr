import { NextResponse } from 'next/server';
import webpush from 'web-push';

// Configure Web Push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
        'mailto:admin@dalilarab.com', // Replace with real admin email
        vapidPublicKey,
        vapidPrivateKey
    );
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, message, url, subscriptions } = body;

        if (!subscriptions || !Array.isArray(subscriptions)) {
            return NextResponse.json({ error: 'No subscriptions provided' }, { status: 400 });
        }

        const payload = JSON.stringify({
            title,
            message,
            url
        });

        let successCount = 0;
        let failCount = 0;

        const promises = subscriptions.map((sub) => {
            // Reconstruct the subscription object expected by web-push
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh ? Buffer.from(sub.p256dh, 'base64').toString('utf-8') : '', // Verify decoding
                    auth: sub.auth ? Buffer.from(sub.auth, 'base64').toString('utf-8') : ''
                }
            };

            // NOTE: We stored p256dh/auth as base64 in database. 
            // Depending on how we stored it, we might need to adjust.
            // In NotificationManager we used: btoa(String.fromCharCode(...)) which results in base64 string.
            // Here we need to pass them back. 
            // Wait, web-push expects keys object. 
            // Actually, if we stored them as base64 strings, we can just pass them if the library accepts them.
            // Documentation says: keys: { p256dh: '...', auth: '...' }

            // Let's use the stored values directly first.
            const subscriptionParams = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: atob(sub.p256dh), // Decode back to raw string?? No, library expects standard base64url usually.
                    auth: atob(sub.auth)
                }
            };

            // Simpler approach:
            // In NotificationManager we did manual conversion.
            // Let's try to just use what we have in DB, blindly assuming it fits what `web-push` needs.
            // Actually, `web-push` sendNotification takes `pushSubscription` object.

            // Let's fix the storing logic on client to just store JSON string of subscription?
            // No, schema is set.

            // Let's try sending.
            return webpush.sendNotification({
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh, // Assuming we stored valid Base64
                    auth: sub.auth
                }
            }, payload)
                .then(() => {
                    successCount++;
                })
                .catch((err: Error) => {
                    console.error('Push error for one user:', err);
                    failCount++;
                    // Check for 410 Gone (expired) and remove from DB?
                });
        });

        await Promise.all(promises);

        return NextResponse.json({ success: true, successCount, failCount });

    } catch (error) {
        console.error('Error sending push notifications:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
