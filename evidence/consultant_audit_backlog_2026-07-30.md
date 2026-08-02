# قائمة متابعة تدقيق «دليل المواقف» — الحالة الختامية 2026-07-30

التدقيق مُغلق: 254 ملاحظة فُنّدت كلها عبر أربع طبقات تحقق (عدا واحدة).
الملفان المنفَّذان: `2026-07-30_consultant_audit_full.sql` + `2026-07-30_consultant_audit_final.sql`.

## يحتاج قرار المالك (لا نص بديل آمن بدون قرار بشري)

- `syrian-fix-address` / `title` [medium|UNVERIFIABLE]
  - الادعاء: إزالة كود V-160 (تجميد العنوان)
  - المشكلة: No official source - goc.gov.tr, icisleri.gov.tr, mevzuat.gov.tr - publishes a restriction code named 'V-160' or defines it as an address freeze. Every source that describes it is a law-firm or consultancy marketing page
- `housing-eviction` / `cost` [medium|UNVERIFIABLE]
  - الادعاء: الدفاع عن حقوقك: رسوم المحكمة ~2,000-4,000 ليرة + أتعاب محامٍ 10,000-25,000 ليرة. المحكمة قد تحكم للمالك بمصاريف المحاماة إذا خسرت.
  - المشكلة: Four specific lira figures with no source, on a row last updated 2025-12; Turkish court fees are reset every January by a Harçlar Kanunu Genel Tebliği and the attorney fee the court awards against a losing party is not f
- `housing-rent-increase` / `cost` [medium|FALSE]
  - الادعاء: شكوى Tüketici Hakem Heyeti: مجانية. دعوى المحكمة: رسوم ~1,500-3,000 ليرة + أتعاب محامٍ (اختياري).
  - المشكلة: The first sentence prices a route that does not exist for rent disputes (see the finding on steps[3]: 6502 m.66 limits the heyet to consumer transactions). The court-fee range is an unsourced 2025 figure on a row last up
- `housing-tahliye-undertaking` / `cost` [medium|UNVERIFIABLE]
  - الادعاء: الاعتراض في İcra: رسوم بسيطة. الدعوى في المحكمة: 2,000-4,000 ليرة + محامٍ.
  - المشكلة: Unsourced lira figures on a row last touched 2025-12. Turkish maktu court fees were re-set for 1/1/2026 by the 98 Seri No'lu Harçlar Kanunu Genel Tebliği (RG 31/12/2025, 33124 5. Mükerrer), so any 2025-vintage range is p

## أسقطها التفنيد — الصفوف الأصلية صحيحة، لا تغيير

- `protection-status-2026` / `cost`: تكاليف الإقامة السياحية تبدأ من 3,000+ ليرة سنوياً.
- `daily-bank-open` / `steps[0]`: استخرج رقماً ضريبياً (Vergi Numarası) إن لم يكن لديك — مجاني من أي دائرة ضرائب.
- `family-child-vaccination` / `tip`: التطعيمات مجانية لجميع الأطفال في تركيا بغض النظر عن الجنسية أو وضع الإقامة.
- `family-pregnancy-birth` / `tip`: حتى لو لم يكن لديك تأمين صحي، لا يحق لأي مشفى حكومي رفض الحامل عند الولادة.
- `syrian-return-code` / `title`: إزالة كود V-87 / كود العودة
- `tourist-new` / `cost`: السوريون والفلسطينيون والطلاب معفيون من الرسوم (يدفعون البطاقة فقط)
- `tourist-new` / `cost`: بطاقة الإقامة (Kart Bedeli): 964 ل.ت • الشهر الأول (Harç): حد أقصى 3,359.90 ل.ت • كل شهر إضافي: 2,23
- `tourist-new` / `cost`: الشهر الأول (Harç): حد أقصى 3,359.90 ل.ت • كل شهر إضافي: 2,232.30 ل.ت
- `tourist-health-insurance` / `steps[0]`: حاملو الإقامة أكثر من سنة: يمكنهم التسجيل في التأمين الحكومي GSS

## بلا حكم (سقطت من عهدة المفنّدين — تُراجع يدوياً عند الرغبة)

- `worker-meal-card` / `tip` [medium]: لا تفترض أنه حق تلقائي للجميع. هو “ميزة” شائعة لكنها تعتمد على العقد.