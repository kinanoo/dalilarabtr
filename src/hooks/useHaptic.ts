import { useCallback } from 'react';

type VibrationPattern = number | number[];

/**
 * Custom hook للـ Haptic Feedback
 * يوفر vibration feedback للتفاعلات
 */
export function useHaptic() {
    const vibrate = useCallback((pattern: VibrationPattern = 10) => {
        if ('vibrate' in navigator) {
            try {
                navigator.vibrate(pattern);
            } catch (error) {
                console.warn('Vibration not supported or failed:', error);
            }
        }
    }, []);

    const hapticClick = useCallback(() => {
        vibrate(10); // Short tap
    }, [vibrate]);

    const hapticSuccess = useCallback(() => {
        vibrate([50, 50, 50]); // Three short bursts
    }, [vibrate]);

    const hapticError = useCallback(() => {
        vibrate([100, 50, 100]); // Two longer bursts
    }, [vibrate]);

    const hapticNotification = useCallback(() => {
        vibrate([30, 100, 30]); // Notification pattern
    }, [vibrate]);

    const hapticLongPress = useCallback(() => {
        vibrate(50); // Medium vibration
    }, [vibrate]);

    return {
        vibrate,
        hapticClick,
        hapticSuccess,
        hapticError,
        hapticNotification,
        hapticLongPress,
    };
}
