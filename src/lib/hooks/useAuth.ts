'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Module-level shared auth state — single getUser() call + single onAuthStateChange
let sharedUser: any = undefined; // undefined=loading, null=no user
let initialized = false;
const subscribers = new Set<(user: any) => void>();

function initAuth() {
    if (initialized || !supabase) {
        if (!supabase) sharedUser = null;
        return;
    }
    initialized = true;

    supabase.auth.getUser().then(({ data }) => {
        sharedUser = data.user ?? null;
        subscribers.forEach(cb => cb(sharedUser));
    });

    supabase.auth.onAuthStateChange((_event, session) => {
        sharedUser = session?.user ?? null;
        subscribers.forEach(cb => cb(sharedUser));
    });
}

export function useAuth() {
    const [user, setUser] = useState<any>(sharedUser);

    useEffect(() => {
        initAuth();

        // If already loaded, sync immediately
        if (sharedUser !== undefined) {
            setUser(sharedUser);
        }

        // Subscribe to future changes
        const callback = (u: any) => setUser(u);
        subscribers.add(callback);
        return () => { subscribers.delete(callback); };
    }, []);

    return {
        user,
        userId: (user as any)?.id ?? null,
        loading: user === undefined,
    };
}
