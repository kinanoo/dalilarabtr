-- ============================================================================
-- تهيئة سجل ملفات SQL المطبَّقة (2026-08-12) — آخر ملف يُشغَّل يدوياً
--
-- بعد هذا الملف، أي ملف SQL جديد يُدمج في main يُطبَّق تلقائياً عبر
-- .github/workflows/apply-sql.yml، ويُسجَّل هنا كي لا يتكرّر.
--
-- ما يفعله: ينشئ جدول public.sql_migrations ويسجّل فيه الملفات الـ171
-- التي شُغّلت يدوياً قبل اليوم — تسجيلاً فقط، **دون تنفيذها من جديد**.
--
-- الملفات الثلاثة التي كانت معلّقة شُغّلت يدوياً ونجحت، فهي مسجَّلة هنا
-- ببصمة "ran-manually" كي لا يعيد الـworkflow تشغيلها:
--   * 2026-08-04_data_retention_policy.sql
--   * 2026-08-04_citizenship-news-headline-fix.sql
--   * 2026-08-12_btk-foreign-lines-deadline-extension.sql
--
-- ويفعّل RLS على الجدول ضمن الإنشاء نفسه، فلا حاجة لملف أمان منفصل.
--
-- ملاحظة: البصمات مأخوذة من محتوى الملفات وقت إعداد هذا الملف. تعديل ملف
-- مطبَّق لاحقاً يُنتج تحذيراً في الـworkflow ولا يُعاد تطبيقه — التعديل يحتاج
-- ملفاً جديداً بتاريخ جديد.
--
-- يسجّل نفسه أيضاً ببصمة رمزية "bootstrap"، فلا يعيد الـworkflow تشغيله.
-- سيظهر تحذير بتغيّر بصمته في أول تشغيل — متوقَّع ولا أثر له.
--
-- شغّله مرّة واحدة في Supabase <- SQL Editor. آمن لإعادة التشغيل.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sql_migrations (
  filename   text PRIMARY KEY,
  checksum   text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.sql_migrations IS
  'سجل ملفات sql/ المطبَّقة. يُدار آلياً من .github/workflows/apply-sql.yml';

-- RLS فوراً مع الإنشاء لا في ملف لاحق: أي جدول في مخطط public يُعرَض عبر
-- PostgREST، فالمفتاح العام (anon) يقرأ أسماء ملفات الترحيل وبصماتها — بنية
-- داخلية بلا مقابل، ولا واجهة في الموقع تقرأ هذا الجدول. تفعيل بلا سياسات =
-- لا قراءة ولا كتابة عبر الـAPI العام، و«دور الخدمة» الذي يستخدمه الـworkflow
-- يتجاوز RLS بتصميمه. وهذا يمنع أيضاً ظهور تنبيه Supabase عند التشغيل.
ALTER TABLE public.sql_migrations ENABLE ROW LEVEL SECURITY;

INSERT INTO public.sql_migrations (filename, checksum) VALUES
  ($f$2026-08-04_citizenship-news-headline-fix.sql$f$, $c$ran-manually$c$),
  ($f$2026-08-04_data_retention_policy.sql$f$, $c$ran-manually$c$),
  ($f$2026-08-12_btk-foreign-lines-deadline-extension.sql$f$, $c$ran-manually$c$),
  ($f$2026-08-12_migration_ledger_bootstrap.sql$f$, $c$bootstrap$c$),
  ($f$2026-06-06_newsletter_subscribers.sql$f$, $c$39086f146257ecf2$c$),
  ($f$2026-06-06_questions.sql$f$, $c$8c920bf4b8c97d4d$c$),
  ($f$2026-06-06_zones_reopened.sql$f$, $c$ce4be68a3c64d4e5$c$),
  ($f$2026-06-07_zone_reports.sql$f$, $c$c27ce813a37a1b4f$c$),
  ($f$2026-06-09_analytics_honesty.sql$f$, $c$c2c0b465168b6fa3$c$),
  ($f$2026-06-09_news_ticker_content.sql$f$, $c$5e007f71f658c211$c$),
  ($f$2026-06-17_notifications_rls_hardening.sql$f$, $c$546b559e25995e83$c$),
  ($f$2026-06-22_rls_close_open_write_policies.sql$f$, $c$719a2b725fa752fb$c$),
  ($f$2026-06-29_service_slugs.sql$f$, $c$1b255adf1d4e9eda$c$),
  ($f$2026-07-02_security_codes_turkish.sql$f$, $c$2151e72d5c17f122$c$),
  ($f$2026-07-02_security_codes_turkish_data.sql$f$, $c$f977cee5b775a886$c$),
  ($f$2026-07-05_new_articles_seed.sql$f$, $c$5c81186f3ba9a54d$c$),
  ($f$2026-07-05_research_articles_seed.sql$f$, $c$bcc976f59cd38f52$c$),
  ($f$2026-07-05_updates_seed.sql$f$, $c$249f653dd3bbd539$c$),
  ($f$2026-07-06_monetization_featured.sql$f$, $c$4b92e3993de5db9b$c$),
  ($f$2026-07-06_ticker_toggle.sql$f$, $c$1d9ca7346c42131f$c$),
  ($f$2026-07-07_gap_articles_seed.sql$f$, $c$c09df5b2f9fca548$c$),
  ($f$2026-07-08_backdrop_config.sql$f$, $c$69487b135b7633c8$c$),
  ($f$2026-07-08_dashboard_stats_perf.sql$f$, $c$8dc593d42ba5d2f1$c$),
  ($f$2026-07-08_gap_articles_v2_seed.sql$f$, $c$27f8db5148e09960$c$),
  ($f$2026-07-08_news_work-permit-exemption.sql$f$, $c$65a9f637e0a29b40$c$),
  ($f$2026-07-08_qa_seed.sql$f$, $c$cbb1c98fc778d5d0$c$),
  ($f$2026-07-09_alert_kimlik-residence-rumor.sql$f$, $c$cc6621f27cd82a38$c$),
  ($f$2026-07-09_article_rent-rights.sql$f$, $c$2ae8fba727d7c3c5$c$),
  ($f$2026-07-09_article_residence-rejection.sql$f$, $c$fad3bdb8506be38f$c$),
  ($f$2026-07-09_city_adana.sql$f$, $c$97ca79434dcc41d9$c$),
  ($f$2026-07-09_city_hatay.sql$f$, $c$369c38d8cf4a3c20$c$),
  ($f$2026-07-09_city_mersin.sql$f$, $c$4a0ff10340c92566$c$),
  ($f$2026-07-09_codes_align_n_family.sql$f$, $c$4d195e95d5aa0901$c$),
  ($f$2026-07-09_codes_corrections.sql$f$, $c$ca67d29fffe6a379$c$),
  ($f$2026-07-09_codes_remove_fabricated.sql$f$, $c$5ce89bcd5d1afd0b$c$),
  ($f$2026-07-09_codes_turkish_realign.sql$f$, $c$4700a5c9cef67e05$c$),
  ($f$2026-07-09_damascus-visit-news-pack.sql$f$, $c$72e98f8c88d3b28e$c$),
  ($f$2026-07-09_enrich_citizenship.sql$f$, $c$f3ec8cf80f98a5b1$c$),
  ($f$2026-07-09_enrich_consulate.sql$f$, $c$ff615469cf77bfb5$c$),
  ($f$2026-07-09_news_page_v2.sql$f$, $c$014f05bb53c394ed$c$),
  ($f$2026-07-09_visa_article_enrich.sql$f$, $c$b446b14d0e168b9c$c$),
  ($f$2026-07-10_enrich_cluster2.sql$f$, $c$319f222d312a7dda$c$),
  ($f$2026-07-10_enrich_residence_cluster.sql$f$, $c$9320f02d852e0e4d$c$),
  ($f$2026-07-10_notify_article_link_fix.sql$f$, $c$62f4bad4d5c720d0$c$),
  ($f$2026-07-11_cost-of-living-pillar.sql$f$, $c$3d291ee2a4a32902$c$),
  ($f$2026-07-11_property-buying-pillar.sql$f$, $c$97892fcea702eb90$c$),
  ($f$2026-07-12_home-subscriptions-pillar.sql$f$, $c$2e8e92d53a815df7$c$),
  ($f$2026-07-12_model_main_links.sql$f$, $c$7108ab885bd83893$c$),
  ($f$2026-07-12_model_pin_options.sql$f$, $c$59d10b0786d2bc5f$c$),
  ($f$2026-07-12_private_models.sql$f$, $c$c7026a1c4bc984f7$c$),
  ($f$2026-07-12_professions-pillar.sql$f$, $c$1e5bdd63e4d772a2$c$),
  ($f$2026-07-12_worker-rights-pillar.sql$f$, $c$fe93b03975e9df5f$c$),
  ($f$2026-07-13_models_gallery_password.sql$f$, $c$ad4bf9df7e419f9f$c$),
  ($f$2026-07-13_public_models_gallery.sql$f$, $c$f855ef97f5ba3e8c$c$),
  ($f$2026-07-14_edevlet_seo_enrich.sql$f$, $c$291105e4ff0c1457$c$),
  ($f$2026-07-15_attestation-guide-article.sql$f$, $c$d6baddf972001c1e$c$),
  ($f$2026-07-15_foreign-plate-driving-news.sql$f$, $c$f4614120a820bbb7$c$),
  ($f$2026-07-15_top50_seo_enrich.sql$f$, $c$83cc83ff8724c0b1$c$),
  ($f$2026-07-15_weekly-news-pack.sql$f$, $c$2aee05a3c0129ff8$c$),
  ($f$2026-07-18_hat-guncelleme-news.sql$f$, $c$23551cd10b6daae2$c$),
  ($f$2026-07-18_visa-middlemen-warning.sql$f$, $c$037014b8ee030401$c$),
  ($f$2026-07-18_visitor_insights.sql$f$, $c$65c5bf768b441505$c$),
  ($f$2026-07-19_visitor_insights_v2.sql$f$, $c$9c90bfe72dbda79c$c$),
  ($f$2026-07-24_syria-turkey-cultural-centers-news.sql$f$, $c$9840ddb1ad8095d4$c$),
  ($f$2026-07-24_turkish-open-education-exams-syria-news.sql$f$, $c$3c5c8606c57afe09$c$),
  ($f$2026-07-25_border_crossings_correction.sql$f$, $c$233313b3c170dd06$c$),
  ($f$2026-07-25_citizenship_pillar_title.sql$f$, $c$7f61bd1c22acbe60$c$),
  ($f$2026-07-25_dedupe_wave1.sql$f$, $c$2b6d7015b2271508$c$),
  ($f$2026-07-25_dedupe_wave1_fix.sql$f$, $c$7668b7174f2fce27$c$),
  ($f$2026-07-25_edevlet_sample.sql$f$, $c$0b8a61724a085df3$c$),
  ($f$2026-07-25_family-residence-renewal.sql$f$, $c$9e65442dae169ad1$c$),
  ($f$2026-07-25_kimlik-data-update-consolidate.sql$f$, $c$1f7c3dc525d04da1$c$),
  ($f$2026-07-25_revive_remaining_two.sql$f$, $c$fc82db20d4dc76aa$c$),
  ($f$2026-07-25_revive_switched_off_articles.sql$f$, $c$1a80d9739196d188$c$),
  ($f$2026-07-25_top_demand_wave1.sql$f$, $c$f3afe57075796e13$c$),
  ($f$2026-07-26_kimlik_keystone_rebuild.sql$f$, $c$1713983f5778619f$c$),
  ($f$2026-07-26_stop_false_new_article_notifications.sql$f$, $c$e712c29c545846b8$c$),
  ($f$2026-07-26_visa_followup_links.sql$f$, $c$fbf002af748c4e2a$c$),
  ($f$2026-07-26_visa_last_two_sentences.sql$f$, $c$ad49ed679718393f$c$),
  ($f$2026-07-26_visa_price_and_nationality.sql$f$, $c$2045ce6cddc717c5$c$),
  ($f$2026-07-26_voluntary_return_the_real_question.sql$f$, $c$52d0a288c772c423$c$),
  ($f$2026-07-26_wave1_precision_pass.sql$f$, $c$bfb15ebb1431e963$c$),
  ($f$2026-07-26_yol_izni_muafiyeti_health_warning.sql$f$, $c$57e518b5b9263554$c$),
  ($f$2026-07-28_consultant_scenarios_fix.sql$f$, $c$8dfe1a26edac4128$c$),
  ($f$2026-07-28_kimlik_false_fee_urgent.sql$f$, $c$8dabcc53f1ef1051$c$),
  ($f$2026-07-28_no_kimlik_renewal.sql$f$, $c$74b37722952a3f16$c$),
  ($f$2026-07-28_rights_cluster_wave1.sql$f$, $c$28832a7c941f03c9$c$),
  ($f$2026-07-28_seo_snippets_126.sql$f$, $c$c1917850c9cca8ca$c$),
  ($f$2026-07-28_seo_snippets_126_v2.sql$f$, $c$67c69ae7565f40c0$c$),
  ($f$2026-07-28_seo_snippets_tail8.sql$f$, $c$e95f0e101ba39fc5$c$),
  ($f$2026-07-28_structured_cards_fix.sql$f$, $c$76cd1b7cc2e76a08$c$),
  ($f$2026-07-28_warning_field_fix.sql$f$, $c$4befb27b6b797cb3$c$),
  ($f$2026-07-30_consultant_audit_final.sql$f$, $c$56f39cb8b2c16a85$c$),
  ($f$2026-07-30_consultant_audit_full.sql$f$, $c$7a9cc157c262bd56$c$),
  ($f$2026-07-30_syrian_cars_turkey_factcheck.sql$f$, $c$625b1b6584053399$c$),
  ($f$2026-07-31_sgk-family-dependents-pack.sql$f$, $c$03f419a52bb43bc5$c$),
  ($f$2026-08-01_edevlet-emoney-account-service-article.sql$f$, $c$82b66dda238ff566$c$),
  ($f$2026-08-01_tcmb-edevlet-emoney-account-query-news.sql$f$, $c$048349a170a862bf$c$),
  ($f$2026-08-01_work-permit-8-years-exemption-news.sql$f$, $c$4c80663f3f79b32b$c$),
  ($f$2026-08-02_lost_docs_revival.sql$f$, $c$284aaf91949002a4$c$),
  ($f$2026-08-02_voluntary-return-brochure-news.sql$f$, $c$11278c4e45822c5f$c$),
  ($f$2026-08-04_analytics_durable_rollups.sql$f$, $c$59db7ca896dd74fa$c$),
  ($f$2026-08-04_category_normalization.sql$f$, $c$f19fa9802c9019a4$c$),
  ($f$2026-08-04_citizenship-fraud-operation-news.sql$f$, $c$725162740681e332$c$),
  ($f$2026-08-04_consultant_code_only_scenarios.sql$f$, $c$aea260348ac51817$c$),
  ($f$2026-08-04_contact_switch.sql$f$, $c$f337bb85741093cc$c$),
  ($f$2026-08-04_kizilay_suy_fix.sql$f$, $c$e68ae6a6bab56b8a$c$),
  ($f$2026-08-04_merge_lost_kimlik.sql$f$, $c$7f983a24e3aaa8b5$c$),
  ($f$2026-08-05_merge_consulate_cluster.sql$f$, $c$4a213e3e6cec7a1c$c$),
  ($f$2026-08-05_merge_duplicate_clusters.sql$f$, $c$376bded33abaf0cd$c$),
  ($f$2026-08-05_merge_work_permit_cluster.sql$f$, $c$3bf24e3bb0ec3d32$c$),
  ($f$2026-08-05_purge_ghost_rows.sql$f$, $c$a2b4aa059b638c4c$c$),
  ($f$2026-08-05_retire_edevlet_template_pages.sql$f$, $c$f9ca1c018f7054f3$c$),
  ($f$2026-08-05_seo_titles_backfill.sql$f$, $c$1ea0483a67ad6a27$c$),
  ($f$2026-08-05_view_counter_switch.sql$f$, $c$15e1b1304eb41337$c$),
  ($f$2026-08-06_backfill_sources.sql$f$, $c$2f23832f3c88bbfd$c$),
  ($f$2026-08-06_codes_block_border_page.sql$f$, $c$7ba9d35f91f98307$c$),
  ($f$2026-08-06_consulate_appointment_channel.sql$f$, $c$b6c89cb72d784997$c$),
  ($f$2026-08-06_family_reunion_visa_syria.sql$f$, $c$6881cd81993a8248$c$),
  ($f$2026-08-06_fix_app_plate_grace_period.sql$f$, $c$8ef5f01066e33723$c$),
  ($f$2026-08-06_fix_overstay_deadlines.sql$f$, $c$23df944da8f63958$c$),
  ($f$2026-08-06_health_cost_truth.sql$f$, $c$437ed64c1f95b382$c$),
  ($f$2026-08-06_istanbul_noter_route.sql$f$, $c$58f0cbcafee03366$c$),
  ($f$2026-08-06_marriage_eligibility_certificate.sql$f$, $c$33855e1f4d7d1c0d$c$),
  ($f$2026-08-06_medical_tourism_sourcing.sql$f$, $c$ca21a669542e849f$c$),
  ($f$2026-08-06_merge_address_cluster.sql$f$, $c$4f70fe53180d2790$c$),
  ($f$2026-08-06_merge_citizenship_cluster.sql$f$, $c$7a1a0333aa22adcc$c$),
  ($f$2026-08-06_merge_education_cluster.sql$f$, $c$6ce48ef6b5673ff4$c$),
  ($f$2026-08-06_merge_health_cluster.sql$f$, $c$52b7e633f0b59dec$c$),
  ($f$2026-08-06_merge_phoneline_cluster.sql$f$, $c$9e5e3c051aaec604$c$),
  ($f$2026-08-06_merge_return_cluster.sql$f$, $c$f502eca5a4400bc2$c$),
  ($f$2026-08-06_merge_traffic_cluster.sql$f$, $c$5c096b81d47d7ff7$c$),
  ($f$2026-08-06_merge_visa_cluster.sql$f$, $c$56ca483e9df40281$c$),
  ($f$2026-08-06_news_beyazit_field_report.sql$f$, $c$1afa3d35f5883ec6$c$),
  ($f$2026-08-06_news_beyazit_reframe.sql$f$, $c$51e618556397da66$c$),
  ($f$2026-08-06_news_yok_syria_university.sql$f$, $c$bc3efc85928966dc$c$),
  ($f$2026-08-06_urfa_2022_list_reframe.sql$f$, $c$dbd182e5dd38cb78$c$),
  ($f$2026-08-06_v160_meaning_and_fee.sql$f$, $c$5b06fd94c97bbd82$c$),
  ($f$2026-08-06_v87_what_it_blocks.sql$f$, $c$81533dc2f18afeff$c$),
  ($f$2026-08-06_work_visa_eight_years.sql$f$, $c$33d2c61977b2e5bc$c$),
  ($f$2026-08-07_birth_cluster.sql$f$, $c$25caac14ddf431d7$c$),
  ($f$2026-08-07_consumer_cluster.sql$f$, $c$afbef51ab0375248$c$),
  ($f$2026-08-07_crpartners_wave.sql$f$, $c$7bba9a221d18dd83$c$),
  ($f$2026-08-07_education_cluster.sql$f$, $c$3da6116e01f58927$c$),
  ($f$2026-08-07_education_wave2.sql$f$, $c$8a48e1703ddabde8$c$),
  ($f$2026-08-07_entry_ban_cluster.sql$f$, $c$5447df3b96c5a931$c$),
  ($f$2026-08-07_family_reunion_sponsor_docs.sql$f$, $c$4f0aaef79a731412$c$),
  ($f$2026-08-07_finance_cluster.sql$f$, $c$b572b680d2b7f6e3$c$),
  ($f$2026-08-07_health_phones_cluster.sql$f$, $c$25acc2b3217b9b0a$c$),
  ($f$2026-08-07_hgs_cluster.sql$f$, $c$cbf0280dcbb441ff$c$),
  ($f$2026-08-07_housing_cluster.sql$f$, $c$3205ca319ead8e1b$c$),
  ($f$2026-08-07_istanbul_meeting_outputs.sql$f$, $c$fcb548ec4294aefd$c$),
  ($f$2026-08-07_istanbul_zones_news.sql$f$, $c$99465cc0215d28f2$c$),
  ($f$2026-08-07_kizilay_consolidation.sql$f$, $c$25507c5f0605a0ed$c$),
  ($f$2026-08-07_marriage_cluster.sql$f$, $c$9da201af91468b03$c$),
  ($f$2026-08-07_medical_tourism_cluster.sql$f$, $c$924ae4d330bc806c$c$),
  ($f$2026-08-07_muzekart_truth.sql$f$, $c$73f7ae64b012857f$c$),
  ($f$2026-08-07_notary_edevlet_cluster.sql$f$, $c$0a9cb49e80b2a766$c$),
  ($f$2026-08-07_property_cluster.sql$f$, $c$57e38a1adcf9a607$c$),
  ($f$2026-08-07_residence_cluster.sql$f$, $c$5d17873abe2215ec$c$),
  ($f$2026-08-07_retire_stubs_draft.sql$f$, $c$05dd20f3d8ad2c7a$c$),
  ($f$2026-08-07_singles_finale.sql$f$, $c$a7fa99ed3462e547$c$),
  ($f$2026-08-07_student_residence.sql$f$, $c$9aff0fad4d072b49$c$),
  ($f$2026-08-07_transport_cluster.sql$f$, $c$8405723caf58cdb9$c$),
  ($f$2026-08-07_work_cluster.sql$f$, $c$f3af4adb8228fd44$c$),
  ($f$2026-08-08_content-gap-wave1.sql$f$, $c$f73efcf854824e11$c$),
  ($f$2026-08-08_graduate_residence_news.sql$f$, $c$43ad591933023ba7$c$),
  ($f$2026-08-08_kimlik_update_pillar.sql$f$, $c$3645c39b4f407fb8$c$),
  ($f$2026-08-12_drop_new_labels.sql$f$, $c$145422c10f112ce6$c$),
  ($f$2026-08-12_metadata_completeness.sql$f$, $c$bdcaf002602602af$c$),
  ($f$alter_ai_provider_add_priority.sql$f$, $c$7f1c2ea16dfb660f$c$),
  ($f$create_ai_provider_keys.sql$f$, $c$fd483fde8cd55e18$c$),
  ($f$supabase_notifications_schema.sql$f$, $c$146a11ce1559337f$c$),
  ($f$supabase_reviews_schema.sql$f$, $c$7ae7518b965a7504$c$),
  ($f$supabase_schema.sql$f$, $c$9a650fbf3a630884$c$)
ON CONFLICT (filename) DO NOTHING;

-- ─── تحقّق نهائي ───
DO $check$
DECLARE
  n_rows    integer;
  n_pending integer;
BEGIN
  SELECT COUNT(*) INTO n_rows FROM public.sql_migrations;

  SELECT COUNT(*) INTO n_pending
  FROM (VALUES
    ('2026-08-04_data_retention_policy.sql'),
    ('2026-08-04_citizenship-news-headline-fix.sql'),
    ('2026-08-12_btk-foreign-lines-deadline-extension.sql')
  ) AS p(f)
  WHERE EXISTS (SELECT 1 FROM public.sql_migrations m WHERE m.filename = p.f);

  IF n_rows < 171 THEN
    RAISE EXCEPTION 'FAILED: المتوقّع 171 صفاً على الأقل، الموجود %', n_rows;
  END IF;
  -- الثلاثة شُغّلت يدوياً ونجحت، فيجب أن تكون مسجَّلة كي لا يعيد الـworkflow
  -- تشغيلها. (كانت في نسخة سابقة مستثناة عمداً ليطبّقها الـworkflow.)
  IF n_pending <> 3 THEN
    RAISE EXCEPTION 'FAILED: المتوقّع تسجيل الملفات الثلاثة المشغَّلة يدوياً، المسجَّل %', n_pending;
  END IF;

  IF NOT (SELECT c.relrowsecurity FROM pg_class c
          JOIN pg_namespace ns ON ns.oid = c.relnamespace
          WHERE ns.nspname = 'public' AND c.relname = 'sql_migrations') THEN
    RAISE EXCEPTION 'FAILED: RLS لم يُفعَّل على sql_migrations';
  END IF;
  RAISE NOTICE 'OK: سُجّل % ملفاً، وRLS مفعّل. لا شيء متبقٍّ للتشغيل اليدوي.', n_rows;
  RAISE NOTICE 'الخطوة التالية: أضف السرّ SUPABASE_DB_URL في إعدادات المستودع على GitHub.';
END
$check$;

-- ─── مراجعة ───
SELECT COUNT(*) AS عدد_الملفات_المسجلة FROM public.sql_migrations;
