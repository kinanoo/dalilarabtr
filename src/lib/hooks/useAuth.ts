'use client';

import { useEffect, useState } from 'react';
import type { AuthUser } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabaseLazy';

// Module-level shared auth state — single getUser() call + single onAuthStateChange
let sharedUser: AuthUser | null | undefined = undefined; // undefined=loading, null=no user
let initialized = false;
const subscribers = new Set<(user: AuthUser | null) => void>();

function initAuth() {
    if (initialized) return;
    initialized = true;

    const connect = () => getSupabase().then((supabase) => {
        if (!supabase) {
            sharedUser = null;
            subscribers.forEach(cb => cb(null));
            return;
        }

        supabase.auth.getSession().then(({ data }) => {
            sharedUser = data.session?.user ?? null;
            subscribers.forEach(cb => cb(sharedUser!));
        });

        supabase.auth.onAuthStateChange((_event, session) => {
            sharedUser = session?.user ?? null;
            subscribers.forEach(cb => cb(sharedUser!));
        });
    });

    // A returning signed-in member should see their account immediately.
    // Anonymous visitors do not need the 60KB+ Supabase SDK during LCP, so
    // attach the auth listener only after the page has settled.
    let hasStoredSession = false;
    try {
        hasStoredSession = Object.keys(localStorage).some((key) =>
            /^sb-.+-auth-token$/.test(key),
        );
    } catch {
        // Storage may be disabled; the delayed connection remains safe.
    }

    if (hasStoredSession) {
        void connect();
        return;
    }

    window.setTimeout(() => void connect(), 8000);
}

export function useAuth() {
    const [user, setUser] = useState<AuthUser | null | undefined>(sharedUser);

    useEffect(() => {
        initAuth();

        // If already loaded, sync immediately
        if (sharedUser !== undefined) {
            setUser(sharedUser);
        }

        // Subscribe to future changes
        const callback = (u: AuthUser | null) => setUser(u);
        subscribers.add(callback);
        return () => { subscribers.delete(callback); };
    }, []);

    return {
        user,
        userId: user?.id ?? null,
        loading: user === undefined,
    };
}
