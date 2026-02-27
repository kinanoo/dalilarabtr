-- ===================================================================
-- Allow authenticated admin users to insert notifications
-- Run once in: Supabase Dashboard → SQL Editor
-- ===================================================================

-- Allow admin users to insert notifications via the push API route
CREATE POLICY "Allow admin insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM public.member_profiles WHERE role = 'admin'
    )
);

-- Allow admin users to update notifications (for deactivating, etc.)
CREATE POLICY "Allow admin update notifications"
ON public.notifications
FOR UPDATE
USING (
    auth.uid() IN (
        SELECT id FROM public.member_profiles WHERE role = 'admin'
    )
);
