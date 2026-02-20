-- Add geospatial columns to service_providers
alter table public.service_providers 
add column if not exists lat double precision,
add column if not exists lng double precision;

-- Create an index for faster geospatial queries (optional but good for future)
create index if not exists service_providers_geo_idx on public.service_providers (lat, lng);
