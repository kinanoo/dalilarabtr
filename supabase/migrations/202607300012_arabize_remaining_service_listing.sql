-- Keep public directory labels in Arabic.

UPDATE public.service_providers
SET
  name = 'مي العبد الغني',
  profession = 'مدرّسة لغة إنكليزية',
  category = 'تعليم',
  updated_at = now()
WHERE id = '71c4201a-4135-4f73-9a9c-f8292246ad5e'
  AND status = 'approved';
