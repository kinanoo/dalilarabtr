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

    // Lazy import keeps supabase-js out of the first-load JS: useAuth is in
    // the Navbar (= every page), so a static import here was site-wide weight.
    getSupabase().then((supabase) => {
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
