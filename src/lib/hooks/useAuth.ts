'use client';

import { useEffect, useState } from 'react';
import type { AuthUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

// Module-level shared auth state — single getUser() call + single onAuthStateChange
let sharedUser: AuthUser | null | undefined = undefined; // undefined=loading, null=no user
let initialized = false;
const subscribers = new Set<(user: AuthUser | null) => void>();

function initAuth() {
    if (initialized || !supabase) {
        if (!supabase) sharedUser = null;
        return;
    }
    initialized = true;

    supabase.auth.getUser().then(({ data }) => {
        sharedUser = data.user ?? null;
        subscribers.forEach(cb => cb(sharedUser!));
    });

    supabase.auth.onAuthStateChange((_event, session) => {
        sharedUser = session?.user ?? null;
        subscribers.forEach(cb => cb(sharedUser!));
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
