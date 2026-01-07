-- 1. اسمح برفع الملفات للمجلد "images"
create policy "Allow Public Uploads to Images"
on storage.objects for insert
to public
with check ( bucket_id = 'images' );

-- 2. اسمح بتعديل الملفات في المجلد "images"
create policy "Allow Public Updates to Images"
on storage.objects for update
to public
using ( bucket_id = 'images' );

-- 3. اسمح بقراءة الملفات (للتأكيد فقط)
create policy "Allow Public Read of Images"
on storage.objects for select
to public
using ( bucket_id = 'images' );
