# Turkish translations — review notes

125 codes translated. 19 flagged low/medium-confidence for human review.

Each was produced by a translator agent then checked by an adversarial bilingual reviewer. Legal terminology (YUKK, giriş yasağı, özel meşruhatlı vize…) looked accurate in spot checks, but please review the flagged ones before/after running the data migration.

## Ç115 — medium
**TR title:** Tahliye

**Note:** Meaning is preserved and terminology (tahliye, sınır dışı, G/N kodları, 2 yıl) is correct. Minor semantic note: source how_to_remove says 'in case of acquittal all restrictions are lifted' but for someone who already served a prison sentence (as this code describes) a later acquittal is legally atypical; this reflects an inconsistency already present in the Arabic source, not a translation error, so nothing was added or removed. Flagging as medium so a human can confirm the source's intent.

## Ç138 — medium
**TR title:** INAD

**Note:** Meaning preserved and fluent. Minor note: Arabic 'المسافرين المعاندين' literally 'obstinate/refused travelers'; 'INAD Yolcu' (inadmissible passenger) is the correct established term, so acceptable. Description says 'Genel Müdürlük' (matching Arabic 'المديرية العامة'), but how_to_remove expands to 'Göç İdaresi Genel Müdürlüğü' — this matches the parallel Ç129 pattern and is the intended agency, so kept. Flagged medium for human check of the agency-name consistency.

## Ç151 — medium
**TR title:** İnsan Kaçakçılığı

**Note:** Body correctly distinguishes göçmen kaçakçılığı (smuggling) from insan ticareti (trafficking), matching the Arabic. Article 54/1-d preserved. Title 'İnsan Kaçakçılığı' (human smuggling) faithfully renders the Arabic title 'تهريب بشر', though the body also covers trafficking; kept as-is since it mirrors the source title. No changes.

## Ç179 — low
**TR title:** Sağlık Vizesi

**Note:** Translation faithfully renders the Arabic, but the SOURCE itself is internally inconsistent: the title 'تأشيرة طبية' (Medical Visa / Sağlık Vizesi) does not match the description, which is about violating the temporary-protection regime (mostly Syrians). This is a source-data mismatch, not a translation error. A human should verify whether the title for Ç179 is correct.

## G34 — low
**TR title:** Sahtecilik

**Note:** Description translated faithfully (terror-org membership, 54/1-b, one of the most severe G codes). BUT the Arabic source itself is internally inconsistent: title = تزوير (forgery / 'Sahtecilik') while the description is about terrorist organizations. Mismatch is in the source, preserved as-is; human should confirm whether title or description is the intended offense for G34.

## G48 — low
**TR title:** Fuhuş

**Note:** Description translated faithfully (unlicensed weapons/explosives possession or smuggling, 54/1-b). BUT source is internally inconsistent: title = دعارة (prostitution / 'Fuhuş') while description is about weapons/explosives. Mismatch is in the Arabic source; human should confirm intended offense for G48.

## G55 — low
**TR title:** Mali yolsuzluk

**Note:** Description translated faithfully (convicted/suspected of sexual crimes; 'hükmen sabit' correctly renders المدان). BUT source is internally inconsistent: title = فساد مالي (financial corruption / 'Mali yolsuzluk') while description is about sexual crimes. Mismatch is in the Arabic source; human should confirm intended offense for G55. No article cited in Arabic, correctly none added.

## G58 — medium
**TR title:** Adam öldürme

**Note:** CORRECTED: removed fabricated qualifier 'Kasten' (intentional/premeditated). Arabic جريمة قتل is generic murder/killing with NO intent specified; 'Kasten adam öldürme' (TCK 81) would narrow it to intentional homicide, which the source does not state. Now reads generic 'Adam öldürme'. Title and description align. Article 54/1-b preserved.

## G64 — low
**TR title:** Tehdit

**Note:** Description translated faithfully (convicted/suspected of theft). BUT source is internally inconsistent: title = تهديد (threat / 'Tehdit') while description is about theft (سرقة/'Hırsızlık'). Mismatch is in the Arabic source; human should confirm intended offense for G64. No article in Arabic, correctly none added.

## G65 — low
**TR title:** Hırsızlık

**Note:** Description translated faithfully (convicted/suspected of fraud/swindling; احتيال أو نصب both = fraud, rendered as dolandırıcılık/sahtekârlık — acceptable). BUT source is internally inconsistent: title = سرقة (theft / 'Hırsızlık') while description is about fraud. Mismatch is in the Arabic source; human should confirm intended offense for G65.

## G66 — low
**TR title:** Yağma

**Note:** Description translated faithfully; 'Resmi belgede sahtecilik' is the correct TCK term for تزوير وثائق رسمية (forgery of official documents). BUT source is internally inconsistent: title = نهب (looting/plunder / 'Yağma') while description is about document forgery. Mismatch is in the Arabic source; human should confirm intended offense for G66.

## G78 — low
**TR title:** Bulaşıcı hastalıklar

**Note:** SOURCE MISMATCH: Arabic title is 'أمراض معدية' (infectious diseases) but the Arabic description is about espionage/intelligence activities against Turkey. The translation faithfully copies this internal inconsistency from the source. Title 'Bulaşıcı hastalıklar' and description do NOT match each other — this is a defect in the ORIGINAL Arabic data, not a translation error. Translation itself is accurate; flagging for human review of source data.

## G82 — low
**TR title:** İstihbarat kodu

**Note:** SOURCE MISMATCH: Arabic title 'كود استخباراتي' (intelligence code) but description is about Interpol-wanted persons / transnational crimes. Translation is faithful to the Arabic. Title/description mismatch originates in source data, not translation. 'المطلوبين دولياً' = 'uluslararası düzeyde aranan' correct; 'عابرة للحدود' = 'sınır aşan' correct.

## G89 — low
**TR title:** Terörist savaşçı

**Note:** SOURCE MISMATCH: Arabic title 'مقاتل إرهابي' (terrorist fighter) but description is about deportation (Sınır Dışı Etme Kararı) decisions under Art. 54 YUKK. Translation is faithful to Arabic and correctly uses the actual Turkish legal term 'Sınır Dışı Etme Kararı' and 'YUKK 54. madde'. Article number 54 is present in the source, not fabricated. Title/description mismatch is a source-data defect for human review.

## K113 — low
**TR title:** Para kaçakçılığı

**Note:** SOURCE MISMATCH: Arabic title 'تهريب أموال' (money smuggling) but description is about a security code monitoring border entry/exit movements. Translation is faithful to the Arabic. Minor: 'مراجعة الجهات الأمنية المختصة' in how_to_remove literally means 'review by / consulting the competent security authorities'; 'başvuru yapılması' (making an application) is an acceptable rendering but slightly narrows the sense — 'Yetkili güvenlik birimlerine başvurulması/danışılması' is fine. Title/description mismatch is a source defect for human review.

## N119 — low
**TR title:** Çıkış yasağı

**Note:** SOURCE MISMATCH: Arabic title 'منع خروج' (exit ban) but description is about administrative fines for working without a work permit. Translation is faithful to the Arabic. 'إذن عمل ساري المفعول' = 'geçerli bir çalışma izni' correct; 'أصحاب العمل الذين شغّلوهم' = 'onları çalıştıran işverenler' correct. Title/description mismatch is a source defect for human review.

## N135 — low
**TR title:** Uluslararası koruma kanununun ihlali

**Note:** SOURCE MISMATCH: Arabic title 'انتهاك قانون الحماية الدولية' (violation of international protection law) but description is about illegal entry/exit fines under Art. 102/a YUKK. Translation is faithful to the Arabic, and title correctly rendered as 'Uluslararası koruma kanununun ihlali'. Article reference 102/a present in source, not fabricated. Title/description mismatch is a source defect for human review.

## N170 — medium
**TR title:** Kabahatler Kanunu Cezası

**Note:** Meaning preserved accurately, including the important note about the code having no effect if entered while abroad. Note: source title is "قانون المخالفات" (law of violations); rendered as "Kabahatler Kanunu" which is the standard Turkish equivalent term — a reasonable mapping, though the source uses YUKK in the body, so the exact statute referenced is slightly ambiguous.

## N171 — medium
**TR title:** Ödenmemiş Ceza

**Note:** Article 57/A, alternative measures (periodic signature, residence at specified address), and codes V-144/V-160 all preserved accurately. Note: source title "عدم دفع غرامة" literally means "non-payment of fine"; proposed "Ödenmemiş Ceza" (unpaid penalty) is a faithful rendering. Terminology correct.

## N48 — low
**TR title:** Fuhuş (İzin)

**Note:** Translation faithfully mirrors the Arabic, BUT the SOURCE itself is internally inconsistent: title is 'دعارة/Fuhuş' (prostitution) while the description says 'جرائم الأسلحة' (silah/weapons) and G-48 = ruhsatsız silah. Turkish correctly preserved the source's own contradiction — human must decide which is authoritative in the source data.

## N64 — low
**TR title:** Tehdit (İzin)

**Note:** Translation faithfully mirrors the Arabic, BUT the SOURCE is internally inconsistent: title 'تهديد/Tehdit' (threat) vs description 'جريمة سرقة' (hırsızlık/theft) and G-64 = hırsızlık. Turkish correctly preserved the source contradiction. Human must resolve which the source intends.

## N65 — low
**TR title:** Hırsızlık (İzin)

**Note:** Translation faithful, but SOURCE inconsistent: title 'سرقة/Hırsızlık' (theft) vs description 'احتيال أو نصب' (dolandırıcılık/fraud) and G-65 = dolandırıcılık. 'nasb' correctly rendered as sahtekârlık/dolandırıcılık. Contradiction is in the source; human review needed.

## N66 — low
**TR title:** Yağma (İzin)

**Note:** Translation faithful, but SOURCE inconsistent: title 'نهب/Yağma' (plunder) vs description 'تزوير وثائق' (belge sahteciliği/document forgery) and G-66 = sahtecilik. Turkish correctly rendered 'tazwir wathaiq' as belge sahteciliği. Source contradiction; human review needed.

## N67 — low
**TR title:** Dolandırıcılık (İzin)

**Note:** Translation faithful, but SOURCE inconsistent: title 'احتيال/Dolandırıcılık' (fraud) vs description 'جرائم جنائية أخرى' (diğer adli suçlar/other criminal offenses). 'jinai' rendered as 'adli' — acceptable, though 'cezai suçlar' would be more precise for criminal offenses; kept 'adli' as no meaning is lost. Title/description mismatch is in the source; human review needed.

## N78 — low
**TR title:** Hastalıklar (İzin)

**Note:** Translation faithful, but SOURCE inconsistent: title 'أمراض/Hastalıklar' (diseases) vs description 'تجسس أو استخباراتية' (casusluk/espionage) and G-78 = casusluk. Turkish preserved the source's contradiction accurately. Human must resolve. Note severity here is 'medium' unlike the others.

## N99 — medium
**TR title:** İnterpol

**Note:** Meaning accurate; G-99 link and MİT preserved. Removed the Arabic transliteration '(istîzan)' from description as it adds nothing in Turkish and 'ön izin' already conveys 'الاستيذان' (prior authorization). Title 'İnterpol' matches source despite the note that the trigger is MİT/security body rather than Interpol itself — kept as-is per source title.

## V148 — medium
**TR title:** Barınma merkezleri

**Note:** Meaning preserved; 'قهرمان مرعش' correctly transliterated as 'Kahramanmaraş'. The source itself is oddly written in second person ('بياناتك'/'verilerinizde') addressing an individual, an unusual register for a generic code reference, but the translation faithfully mirrors the source, so no change made.

## V164 — medium
**TR title:** Güvenlik Endişesi

**Note:** Meaning preserved and figures (1 yıl, 5-10 yıl) match source exactly; not fabricated. Note: source title is "قلق أمني" (security concern), correctly translated as "Güvenlik Endişesi", but the description actually describes an executed deportation (Sınır Dışı Edildi) — this title/content mismatch exists in the SOURCE itself, not a translation error. Flagging for human awareness.

## V205 — medium
**TR title:** Engel Konulması Talebi

**Note:** Meaning preserved. Arabic 'بطلب من ولاية حامله' literally 'at the request of the holder's province/vilayet' rendered as 'kişinin bulunduğu ilin talebiyle' — reasonable. 'الهجرة العامة' = Göç İdaresi Genel Müdürlüğü, acceptable. Note: 'how_to_remove' in Arabic ('مرتبط بالعراقيين فقط' = only related to Iraqis) is not really a removal method but an informational note; translation faithfully keeps it. Source itself is loosely worded.

## V70 — medium
**TR title:** Muvazaalı evlilik

**Note:** CORRECTED: removed the redundant parenthetical '(Muvazaalı Evlilik)' since the Turkish term is already the title/phrase itself — the Arabic parenthetical was giving the Turkish equivalent, which is now the main text. Article citation: Arabic says 'المادة 54/1-ط من YUKK'; the Arabic letter 'ط' was rendered as Turkish 'ı'. YUKK Art. 54/1 subparagraphs are lettered in Turkish (a, b, c...), and the mapping of Arabic 'ط' to a specific Turkish subparagraph letter is uncertain — flagging as medium/low confidence on the exact article letter so a human can verify 54/1-(letter). Rest is accurate.

