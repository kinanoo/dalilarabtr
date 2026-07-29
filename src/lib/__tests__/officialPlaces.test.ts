/**
 * Guards the invariants the «أين يقع؟» directory depends on. These are cheap
 * checks against a hand-maintained table, and each one has a failure mode that
 * would ship silently:
 *   • a duplicate slug → two places, one URL, one of them unreachable
 *   • an empty mapQuery → a Maps link that opens nothing (the whole feature)
 *   • an unknown city/group → a place that renders but is absent from the hub
 *   • a missing search entry → the place exists but nobody can find it
 */

import {
    OFFICIAL_PLACES, MISSION_PLACES, OFFICE_PLACES, OFFICE_KINDS, PLACE_CITIES,
    PLACE_GROUPS, placeBySlug, officePlace, placeMapUrl, placeDirectionsUrl,
    placeNameSearchUrl, hasStoredAddress, buildPlacesSearchEntries,
} from '@/lib/officialPlaces';
import { normalizeArabic } from '@/lib/arabicSearch';

describe('officialPlaces table', () => {
    it('has no duplicate slugs', () => {
        const seen = new Map<string, string>();
        const dupes: string[] = [];
        for (const p of OFFICIAL_PLACES) {
            if (seen.has(p.slug)) dupes.push(`${p.slug} (${seen.get(p.slug)} / ${p.ar})`);
            seen.set(p.slug, p.ar);
        }
        expect(dupes).toEqual([]);
    });

    it('uses URL-safe slugs', () => {
        const bad = OFFICIAL_PLACES.filter((p) => !/^[a-z0-9-]+$/.test(p.slug)).map((p) => p.slug);
        expect(bad).toEqual([]);
    });

    it('gives every place a non-empty map query and Arabic title', () => {
        const bad = OFFICIAL_PLACES
            .filter((p) => !p.mapQuery.trim() || !p.ar.trim() || !p.tr.trim() || !p.what.trim())
            .map((p) => p.slug);
        expect(bad).toEqual([]);
    });

    it('points every place at a known city and group', () => {
        const citySlugs = new Set(PLACE_CITIES.map((c) => c.slug));
        const groupIds = new Set(PLACE_GROUPS.map((g) => g.id));
        const bad = OFFICIAL_PLACES
            .filter((p) => !citySlugs.has(p.citySlug) || !groupIds.has(p.groupId))
            .map((p) => p.slug);
        expect(bad).toEqual([]);
    });

    it('resolves every slug through placeBySlug', () => {
        const missing = OFFICIAL_PLACES.filter((p) => placeBySlug(p.slug)?.slug !== p.slug);
        expect(missing).toEqual([]);
    });

    it('splits cleanly into missions and offices', () => {
        expect(MISSION_PLACES.length + OFFICE_PLACES.length).toBe(OFFICIAL_PLACES.length);
        expect(MISSION_PLACES.every((p) => p.kind === 'single' && p.region && p.missionType)).toBe(true);
        expect(OFFICE_PLACES.every((p) => p.kind === 'nearby' && Boolean(p.officeKindId))).toBe(true);
    });

    it('builds an office page for every (kind, allowed city) pair', () => {
        for (const kind of OFFICE_KINDS) {
            const cities = kind.cities ?? PLACE_CITIES.map((c) => c.slug);
            for (const citySlug of cities) {
                expect(officePlace(kind.id, citySlug)).toBeDefined();
            }
        }
    });

    it('never claims an office exists in a city its kind excludes', () => {
        const restricted = OFFICE_KINDS.filter((k) => k.cities);
        expect(restricted.length).toBeGreaterThan(0); // guard the guard
        for (const kind of restricted) {
            const excluded = PLACE_CITIES.filter((c) => !kind.cities!.includes(c.slug));
            for (const city of excluded) {
                expect(officePlace(kind.id, city.slug)).toBeUndefined();
            }
        }
    });
});

describe('stored addresses', () => {
    const withContact = OFFICIAL_PLACES.filter((p) => p.contact);

    it('stores addresses only on specific missions, never on class-of-office pages', () => {
        // "the Nüfus offices in İstanbul" is dozens of branches — a single
        // stored address there would be actively wrong.
        expect(withContact.length).toBeGreaterThan(0);
        expect(withContact.every((p) => p.kind === 'single')).toBe(true);
        expect(OFFICE_PLACES.every((p) => !p.contact)).toBe(true);
    });

    it('stamps every stored address with an ISO date and a source', () => {
        const bad = withContact
            .filter((p) => !/^\d{4}-\d{2}-\d{2}$/.test(p.contact!.verifiedOn) || !p.contact!.source.trim())
            .map((p) => p.slug);
        expect(bad).toEqual([]);
    });

    it('never stores a placeholder or suspiciously short address', () => {
        const bad = withContact
            .filter((p) => {
                const a = p.contact!.address;
                return a.trim().length < 15 || /tbd|todo|\?\?|unknown/i.test(a);
            })
            .map((p) => p.slug);
        expect(bad).toEqual([]);
    });

    it('names the city in the address it stores', () => {
        // Catches a copy-paste that files an İstanbul address under Gaziantep.
        const bad = withContact
            .filter((p) => !p.contact!.address.toLowerCase().includes(p.cityTr.toLowerCase()))
            .map((p) => `${p.slug}: ${p.contact!.address}`);
        expect(bad).toEqual([]);
    });

    // Every embassy and consulate now carries a verified address. Keeping the
    // allowlist empty (rather than asserting a count) means adding a mission
    // without one fails here and forces a conscious decision: verify it, or add
    // it to this list with a reason.
    const MISSIONS_WITHOUT_VERIFIED_ADDRESS: string[] = [];

    it('has a verified address for every embassy and consulate', () => {
        const missing = MISSION_PLACES
            .filter((p) => !p.contact)
            .map((p) => p.slug)
            .filter((slug) => !MISSIONS_WITHOUT_VERIFIED_ADDRESS.includes(slug));
        expect(missing).toEqual([]);
    });

    it('holds the addresses the customer request named', () => {
        const syriaIst = placeBySlug('syria-consulate-istanbul')!;
        expect(syriaIst.contact?.address).toContain('Teşvikiye');
        expect(syriaIst.contact?.phone).toBeTruthy();

        const syriaGaz = placeBySlug('syria-consulate-gaziantep')!;
        expect(syriaGaz.contact?.address).toContain('Gaziantep');

        expect(placeBySlug('egypt-consulate-istanbul')!.contact?.address).toContain('Bebek');
        expect(placeBySlug('saudi-consulate-istanbul')!.contact?.address).toContain('Levent');
    });
});

describe('honorary consulates', () => {
    const honorary = MISSION_PLACES.filter((p) => p.missionType === 'honorary');

    it('flags the honorary posts and says so in the label and the copy', () => {
        expect(honorary.map((p) => p.slug).sort()).toEqual([
            'bahrain-consulate-istanbul',
            'jordan-consulate-istanbul',
            'somalia-consulate-istanbul',
            'yemen-consulate-istanbul',
        ]);
        for (const p of honorary) {
            expect(p.ar).toContain('الفخرية');
            expect(p.tr).toContain('Fahri Konsolosluğu');
            // The warning that stops a wasted trip must be in the page copy.
            expect(p.what).toContain('لا تُصدر جوازات');
        }
    });

    it('keeps full consulates unflagged', () => {
        const syria = placeBySlug('syria-consulate-istanbul')!;
        expect(syria.missionType).toBe('consulate');
        expect(syria.ar).not.toContain('الفخرية');
    });
});

describe('posts that are not full consulates-general', () => {
    it('uses the real Turkish title instead of assuming Başkonsolosluk', () => {
        // Germany's Antalya post is a plain Konsolosluk with no visa section;
        // Italy's İzmir post is a Konsolosluk too. Calling either a
        // Başkonsolosluk would send visa applicants to the wrong city.
        const gerAntalya = placeBySlug('germany-consulate-antalya')!;
        expect(gerAntalya.tr).toBe('Almanya Konsolosluğu');
        expect(gerAntalya.mapQuery).toBe('Almanya Konsolosluğu Antalya');
        expect(gerAntalya.contact?.note).toContain('لا يوجد قسم تأشيرات');

        expect(placeBySlug('italy-consulate-izmir')!.tr).toBe('İtalya Konsolosluğu');
    });

    it('still defaults to Başkonsolosluk when no override is given', () => {
        expect(placeBySlug('germany-consulate-istanbul')!.tr).toBe('Almanya Başkonsolosluğu');
    });
});

describe('map links', () => {
    it('targets the stored address when there is one', () => {
        const syria = placeBySlug('syria-consulate-istanbul')!;
        expect(hasStoredAddress(syria)).toBe(true);
        const target = `${syria.tr}, ${syria.contact!.address}`;
        expect(placeMapUrl(syria)).toBe(
            'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(target)
        );
        expect(placeDirectionsUrl(syria)).toBe(
            'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(target)
        );
    });

    it('falls back to the official name when there is no stored address', () => {
        const goc = placeBySlug('goc-istanbul')!;
        expect(hasStoredAddress(goc)).toBe(false);
        expect(placeMapUrl(goc)).toBe(
            'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(goc.mapQuery)
        );
    });

    it('always offers a live name-only search — the "it moved" escape hatch', () => {
        // Must exist for EVERY place, and must ignore the stored address:
        // that is the whole point of the second option.
        for (const p of OFFICIAL_PLACES) {
            const url = placeNameSearchUrl(p);
            expect(url).toBe(
                'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.mapQuery)
            );
            if (p.contact) expect(url).not.toContain(encodeURIComponent(p.contact.address));
        }
    });

    it('never leaks a raw space or Turkish character into the URL', () => {
        for (const p of OFFICIAL_PLACES) {
            const url = placeMapUrl(p);
            expect(url.startsWith('https://www.google.com/maps/search/?api=1&query=')).toBe(true);
            expect(url).not.toMatch(/[\s]/);
        }
    });
});

describe('search entries', () => {
    const entries = buildPlacesSearchEntries();

    it('produces one entry per place, each with a map link', () => {
        expect(entries).toHaveLength(OFFICIAL_PLACES.length);
        expect(entries.every((e) => e.mapUrl.includes('google.com/maps'))).toBe(true);
        expect(entries.every((e) => e.url.startsWith('/places/'))).toBe(true);
    });

    it('shows the stored address as the result description', () => {
        const syria = entries.find((e) => e.id === 'place-syria-consulate-istanbul')!;
        expect(syria.desc).toBe(placeBySlug('syria-consulate-istanbul')!.contact!.address);
    });

    it('makes the street and district searchable', () => {
        // «قنصلية مجكا» / «konsolosluk Teşvikiye» — people search by landmark.
        const syria = entries.find((e) => e.id === 'place-syria-consulate-istanbul')!;
        expect(normalizeArabic(syria.keywords)).toContain('teşvikiye'.toLowerCase());
    });

    // These are the exact phrasings the feature was asked for. They are the
    // real acceptance criteria: type the sentence, land on the right place.
    const CASES: Array<[string, string]> = [
        ['القنصلية السورية في اسطنبول', 'place-syria-consulate-istanbul'],
        ['القنصلية السورية في عينتاب', 'place-syria-consulate-gaziantep'],
        ['القنصلية المصرية في اسطنبول', 'place-egypt-consulate-istanbul'],
        ['القنصلية السعودية في اسطنبول', 'place-saudi-consulate-istanbul'],
        ['سفارة العراق في انقرة', 'place-iraq-embassy-ankara'],
        ['ادارة الهجرة في اسطنبول', 'place-goc-istanbul'],
        ['دائرة النفوس في بورصة', 'place-nufus-bursa'],
    ];

    it.each(CASES)('ranks «%s» first', (query, expectedId) => {
        const needle = normalizeArabic(query);
        const tokens = needle.split(' ').filter((t) => t.length >= 2);

        const scored = entries
            .map((e) => {
                const title = normalizeArabic(e.title);
                const hay = normalizeArabic(e.keywords);
                let score = 0;
                let matched = 0;
                for (const t of tokens) {
                    if (title.includes(t)) { score += 12; matched++; }
                    else if (hay.includes(t)) { score += 4; matched++; }
                }
                return { id: e.id, score, matched, all: matched === tokens.length };
            })
            .filter((s) => s.all)
            .sort((a, b) => b.score - a.score);

        expect(scored[0]?.id).toBe(expectedId);
    });
});
