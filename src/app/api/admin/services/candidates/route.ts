import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createHash } from 'node:crypto';
import { requireAdmin } from '@/lib/api/adminAuth';
import {
    categoryForName,
    categorySlugForName,
} from '@/lib/serviceCategories';
import {
    canonicalCity,
    citySlugForName,
} from '@/lib/turkishCities';
import {
    normalizeTurkishPhone,
    providerFingerprint,
} from '@/lib/serviceDirectory';
import logger from '@/lib/logger';

export const runtime = 'nodejs';

const SOURCE_TYPES = new Set([
    'official_website',
    'official_registry',
    'social_profile',
    'maps_discovery',
    'provider_submission',
    'other',
]);

type CandidateSource = {
    type: string;
    url: string;
    checked_at?: string;
    note?: string;
};

const text = (value: unknown, max: number): string =>
    typeof value === 'string' ? value.trim().slice(0, max) : '';

const safeUrl = (value: unknown): string => {
    const raw = text(value, 1200);
    if (!raw) return '';
    try {
        const parsed = new URL(raw);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
            ? parsed.toString()
            : '';
    } catch {
        return '';
    }
};

const normalizeSources = (value: unknown): CandidateSource[] => {
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    const sources: CandidateSource[] = [];
    for (const item of value) {
        if (!item || typeof item !== 'object') continue;
        const row = item as Record<string, unknown>;
        const url = safeUrl(row.url);
        const type = text(row.type, 40);
        if (!url || !SOURCE_TYPES.has(type) || seen.has(url)) continue;
        seen.add(url);
        sources.push({
            type,
            url,
            checked_at: text(row.checked_at, 40) || new Date().toISOString(),
            note: text(row.note, 500) || undefined,
        });
    }
    return sources.slice(0, 10);
};

const normalizeCandidate = (value: unknown) => {
    if (!value || typeof value !== 'object') return null;
    const row = value as Record<string, unknown>;
    const name = text(row.name, 160);
    const profession = text(row.profession, 160);
    const rawCategory = text(row.category, 80);
    const city = canonicalCity(text(row.city, 80));
    const phoneDigits = normalizeTurkishPhone(text(row.phone, 50));
    const rawWhatsapp = text(row.whatsapp, 50);
    const whatsappDigits = normalizeTurkishPhone(rawWhatsapp);
    const description = text(row.description, 1500);
    const sources = normalizeSources(row.sources);

    if (
        !name ||
        !profession ||
        !city ||
        !description ||
        phoneDigits.length < 10 ||
        phoneDigits.length > 12 ||
        (rawWhatsapp && (whatsappDigits.length < 10 || whatsappDigits.length > 12)) ||
        sources.length === 0
    ) {
        return null;
    }

    const category = categoryForName(rawCategory)?.name || rawCategory || 'خدمات عامة';
    const phone = `+${phoneDigits}`;
    const website = safeUrl(row.website);
    const googleMapsUrl = safeUrl(row.google_maps_url);
    const officialSource = sources.some((source) =>
        ['official_website', 'official_registry', 'provider_submission'].includes(source.type),
    );
    const independentSources = new Set(sources.map((source) => {
        try {
            return new URL(source.url).hostname.replace(/^www\./, '');
        } catch {
            return source.url;
        }
    })).size;

    let confidence = 35;
    if (officialSource) confidence += 30;
    if (sources.some((source) => source.type === 'maps_discovery')) confidence += 10;
    if (independentSources >= 2) confidence += 10;
    if (text(row.district, 100) || text(row.address_details, 500)) confidence += 5;
    if (website) confidence += 5;
    if (Array.isArray(row.languages) && row.languages.length > 0) confidence += 5;
    confidence = Math.min(100, confidence);

    const candidateData = {
        name,
        profession,
        category,
        city,
        district: text(row.district, 100) || null,
        phone,
        whatsapp: rawWhatsapp ? `+${whatsappDigits}` : null,
        description,
        bio: text(row.bio, 1500) || null,
        address_details: text(row.address_details, 500) || null,
        website: website || null,
        email: text(row.email, 200) || null,
        google_maps_url: googleMapsUrl || null,
        languages: Array.isArray(row.languages)
            ? row.languages.map((language) => text(language, 40)).filter(Boolean).slice(0, 8)
            : [],
        image: safeUrl(row.image) || null,
    };

    return {
        fingerprint: providerFingerprint({ name, city, phone }),
        candidateData,
        sources,
        confidence,
        status: officialSource && confidence >= 70 ? 'ready' : 'needs_review',
    };
};

const tableMissing = (error: { code?: string; message?: string } | null): boolean =>
    error?.code === '42P01' ||
    Boolean(error?.message?.includes('service_provider_candidates'));

const slugPart = (value: unknown): string =>
    text(value, 180)
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('tr-TR')
        .replaceAll('ı', 'i')
        .replaceAll('ş', 's')
        .replaceAll('ğ', 'g')
        .replaceAll('ç', 'c')
        .replaceAll('ö', 'o')
        .replaceAll('ü', 'u')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 54);

const slugForCandidate = (data: Record<string, unknown>): string => {
    const fingerprint = providerFingerprint({
        name: text(data.name, 160),
        city: text(data.city, 80),
        phone: text(data.phone, 50),
    });
    const base =
        slugPart(data.name) ||
        categorySlugForName(text(data.category, 80)) ||
        'service';
    const city = citySlugForName(text(data.city, 80)) || 'turkey';
    const suffix = createHash('sha1').update(fingerprint).digest('hex').slice(0, 8);
    return `${base}-${city}-${suffix}`;
};

export async function GET() {
    const gate = await requireAdmin();
    if (!gate.ok) return gate.res;

    const { data, count, error } = await gate.svc
        .from('service_provider_candidates')
        .select('id, batch_id, fingerprint, candidate_data, sources, status, confidence, duplicate_provider_id, review_notes, created_at, updated_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(100);

    if (error && tableMissing(error)) {
        return NextResponse.json({ setupRequired: true, rows: [], total: 0 });
    }
    if (error) {
        logger.error('service candidates GET:', error);
        return NextResponse.json({ error: 'تعذّر تحميل قائمة البحث' }, { status: 500 });
    }

    return NextResponse.json({ rows: data || [], total: count || 0 });
}

export async function POST(request: Request) {
    const gate = await requireAdmin();
    if (!gate.ok) return gate.res;

    try {
        const body = await request.json().catch(() => ({}));
        const action = text(body.action, 30);

        if (action === 'stage') {
            const input = Array.isArray(body.candidates) ? body.candidates.slice(0, 100) : [];
            const candidates = input.map(normalizeCandidate).filter(Boolean) as NonNullable<ReturnType<typeof normalizeCandidate>>[];
            if (candidates.length === 0) {
                return NextResponse.json({ error: 'لا توجد سجلات صالحة للاستيراد' }, { status: 400 });
            }

            const { data: batch, error: batchError } = await gate.svc
                .from('service_import_batches')
                .insert({
                    label: text(body.label, 160) || `دفعة ${new Date().toISOString().slice(0, 10)}`,
                    cities: Array.from(new Set(candidates.map((candidate) => candidate.candidateData.city))),
                    categories: Array.from(new Set(candidates.map((candidate) => candidate.candidateData.category))),
                    status: 'reviewing',
                    stats: { received: input.length, valid: candidates.length },
                })
                .select('id')
                .single();
            if (batchError) {
                if (tableMissing(batchError)) {
                    return NextResponse.json({ error: 'migration_required' }, { status: 409 });
                }
                throw batchError;
            }

            const rows = candidates.map((candidate) => ({
                batch_id: batch.id,
                fingerprint: candidate.fingerprint,
                candidate_data: candidate.candidateData,
                sources: candidate.sources,
                status: candidate.status,
                confidence: candidate.confidence,
                updated_at: new Date().toISOString(),
            }));

            const { data, error } = await gate.svc
                .from('service_provider_candidates')
                .upsert(rows, { onConflict: 'fingerprint' })
                .select('id, status, confidence');
            if (error) throw error;

            return NextResponse.json({
                ok: true,
                batchId: batch.id,
                staged: data?.length || 0,
                ready: data?.filter((row) => row.status === 'ready').length || 0,
            });
        }

        if (action === 'set_status') {
            const id = text(body.id, 80);
            const status = text(body.status, 30);
            if (!id || !['ready', 'needs_review', 'rejected'].includes(status)) {
                return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
            }
            const { error } = await gate.svc
                .from('service_provider_candidates')
                .update({
                    status,
                    review_notes: text(body.notes, 1000) || null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id);
            if (error) throw error;
            return NextResponse.json({ ok: true });
        }

        if (action === 'publish') {
            const ids = Array.isArray(body.ids)
                ? body.ids.map((id: unknown) => text(id, 80)).filter(Boolean).slice(0, 50)
                : [];
            if (ids.length === 0) {
                return NextResponse.json({ error: 'لم تحدد سجلات للنشر' }, { status: 400 });
            }

            const { data: candidates, error: candidatesError } = await gate.svc
                .from('service_provider_candidates')
                .select('id, candidate_data, sources, status')
                .in('id', ids)
                .eq('status', 'ready');
            if (candidatesError) throw candidatesError;

            const { data: existing } = await gate.svc
                .from('service_providers')
                .select('id, name, city, phone')
                .limit(3000);
            const phones = new Map(
                (existing || []).map((provider) => [
                    normalizeTurkishPhone(provider.phone),
                    provider.id,
                ]),
            );
            const nameCityKeys = new Map(
                (existing || []).map((provider) => [
                    providerFingerprint({
                        name: provider.name,
                        city: provider.city,
                    }),
                    provider.id,
                ]),
            );

            const published: string[] = [];
            const duplicates: string[] = [];
            const failures: Array<{ id: string; error: string }> = [];

            for (const candidate of candidates || []) {
                const data = candidate.candidate_data as Record<string, unknown>;
                const phone = normalizeTurkishPhone(String(data.phone || ''));
                const nameCityKey = providerFingerprint({
                    name: text(data.name, 160),
                    city: text(data.city, 80),
                });
                const duplicateId = phones.get(phone) || nameCityKeys.get(nameCityKey);
                if (duplicateId) {
                    duplicates.push(candidate.id);
                    await gate.svc
                        .from('service_provider_candidates')
                        .update({
                            status: 'needs_review',
                            duplicate_provider_id: duplicateId,
                            review_notes: 'رقم التواصل موجود في الدليل',
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', candidate.id);
                    continue;
                }

                const payload = {
                    ...data,
                    slug: slugForCandidate(data),
                    status: 'approved',
                    active: true,
                    verification_level: 'source_checked',
                    is_verified: true,
                    last_verified_at: new Date().toISOString(),
                };
                const { data: provider, error: providerError } = await gate.svc
                    .from('service_providers')
                    .insert(payload)
                    .select('id')
                    .single();
                if (providerError || !provider) {
                    failures.push({
                        id: candidate.id,
                        error: providerError?.message || 'insert_failed',
                    });
                    continue;
                }

                const sourceRows = normalizeSources(candidate.sources).map((source) => ({
                    provider_id: provider.id,
                    source_type: source.type,
                    source_url: source.url,
                    checked_at: source.checked_at,
                    notes: source.note || null,
                }));
                if (sourceRows.length > 0) {
                    const { error: sourceError } = await gate.svc
                        .from('service_provider_sources')
                        .insert(sourceRows);
                    if (sourceError) {
                        logger.error('provider sources insert:', sourceError);
                        await gate.svc
                            .from('service_providers')
                            .delete()
                            .eq('id', provider.id);
                        failures.push({
                            id: candidate.id,
                            error: 'source_insert_failed',
                        });
                        continue;
                    }
                }

                phones.set(phone, provider.id);
                nameCityKeys.set(nameCityKey, provider.id);
                published.push(provider.id);
                const { error: candidateUpdateError } = await gate.svc
                    .from('service_provider_candidates')
                    .update({
                        status: 'imported',
                        duplicate_provider_id: provider.id,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', candidate.id);
                if (candidateUpdateError) {
                    logger.warn('candidate imported status update:', candidateUpdateError);
                }
            }

            if (published.length > 0) {
                revalidatePath('/services');
                revalidatePath('/sitemap-services.xml');
            }

            return NextResponse.json({
                ok: failures.length === 0,
                published: published.length,
                duplicates: duplicates.length,
                failures,
            });
        }

        return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
    } catch (error) {
        logger.error('service candidates POST:', error);
        return NextResponse.json({ error: 'تعذّر تنفيذ عملية البحث' }, { status: 500 });
    }
}
