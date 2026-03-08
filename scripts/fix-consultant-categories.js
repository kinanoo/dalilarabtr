/**
 * Fix consultant_scenarios categories in the database.
 *
 * Problem: 90 out of 93 scenarios have category='general', subcategory='general'
 * which causes ALL scenarios to appear on EVERY page of the consultant.
 *
 * This script assigns the correct primary category/subcategory to each scenario.
 */
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.pulled', override: true });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Correct category/subcategory mapping for all scenarios
const CORRECT_CATEGORIES = {
  // ===== SYRIAN =====
  // syrian / docs
  'syrian-lost-id': { category: 'syrian', subcategory: 'docs' },
  'syrian-move-kimlik': { category: 'syrian', subcategory: 'docs' },
  'syrian-fix-address': { category: 'syrian', subcategory: 'docs' },
  'syrian-update-data': { category: 'syrian', subcategory: 'docs' },

  // syrian / travel
  'syrian-travel-medical': { category: 'syrian', subcategory: 'travel' },
  'syrian-travel-visit': { category: 'syrian', subcategory: 'travel' },
  'syrian-leaving-turkey': { category: 'syrian', subcategory: 'travel' },
  'syrian-syria-visit-risk': { category: 'syrian', subcategory: 'travel' },
  'syria-visit-official': { category: 'syrian', subcategory: 'travel' },
  'syrian-prohibited-check': { category: 'syrian', subcategory: 'travel' },

  // syrian / status
  'syrian-citizenship': { category: 'syrian', subcategory: 'status' },
  'syrian-return-code': { category: 'syrian', subcategory: 'status' },
  'protection-status-2026': { category: 'syrian', subcategory: 'status' },
  'syria-mass-return-2025': { category: 'syrian', subcategory: 'status' },

  // syrian / civil
  'syrian-marriage': { category: 'syrian', subcategory: 'civil' },
  'syrian-marriage-not-registered': { category: 'syrian', subcategory: 'civil' },
  'syrian-newborn': { category: 'syrian', subcategory: 'civil' },

  // syrian / education
  'syrian-denklik': { category: 'syrian', subcategory: 'education' },
  'syrian-child-school-no-kimlik': { category: 'syrian', subcategory: 'education' },

  // syrian / bank
  'syrian-bank-kimlik-yellow': { category: 'syrian', subcategory: 'bank' },

  // syrian / property
  'syrian-property-ownership': { category: 'syrian', subcategory: 'property' },

  // ===== TOURIST =====
  'tourist-new': { category: 'tourist', subcategory: 'res' },
  'tourist-extension': { category: 'tourist', subcategory: 'res' },
  'tourist-convert-kimlik': { category: 'tourist', subcategory: 'res' },
  'tourist-reject': { category: 'tourist', subcategory: 'prob' },
  'tourist-overstay': { category: 'tourist', subcategory: 'prob' },
  'tourist-bank-open': { category: 'tourist', subcategory: 'life' },

  // ===== INVESTOR =====
  'investor-citizen': { category: 'investor', subcategory: 'cit' },
  'investor-residence': { category: 'investor', subcategory: 'res' },

  // ===== STUDENT =====
  'student-residence': { category: 'student', subcategory: 'res' },
  'student-denklik': { category: 'student', subcategory: 'study' },
  'student-yos': { category: 'student', subcategory: 'study' },
  'student-tomer': { category: 'student', subcategory: 'study' },
  'student-highschool-denklik': { category: 'student', subcategory: 'study' },
  'student-transcript': { category: 'student', subcategory: 'study' },
  'student-open-highschool': { category: 'student', subcategory: 'study' },
  'student-mavi-diploma': { category: 'student', subcategory: 'study' },

  // ===== WORKER =====
  'work-permit-employee': { category: 'worker', subcategory: 'permit' },
  'work-permit-company': { category: 'worker', subcategory: 'permit' },
  'work-permit-cost': { category: 'worker', subcategory: 'permit' },
  'work-sgk': { category: 'worker', subcategory: 'permit' },
  'worker-bagkur': { category: 'worker', subcategory: 'permit' },
  'worker-meal-card': { category: 'worker', subcategory: 'permit' },
  'worker-uber-illegal': { category: 'worker', subcategory: 'permit' },

  // worker / company
  'company-setup': { category: 'worker', subcategory: 'company' },
  'company-monthly-obligations': { category: 'worker', subcategory: 'company' },
  'company-closure': { category: 'worker', subcategory: 'company' },

  // ===== DAILY SERVICES =====
  // daily / gov
  'daily-edevlet': { category: 'daily', subcategory: 'gov' },
  'daily-enabiz': { category: 'daily', subcategory: 'gov' },
  'daily-kades': { category: 'daily', subcategory: 'gov' },
  'daily-address': { category: 'daily', subcategory: 'gov' },
  'daily-nvi-appointment': { category: 'daily', subcategory: 'gov' },
  'daily-goc-appointment': { category: 'daily', subcategory: 'gov' },
  'daily-mobile-lines-check': { category: 'daily', subcategory: 'gov' },
  'daily-citizenship-status': { category: 'daily', subcategory: 'gov' },
  'daily-cimer': { category: 'daily', subcategory: 'gov' },
  'daily-uyap': { category: 'daily', subcategory: 'gov' },
  'daily-tax-number': { category: 'daily', subcategory: 'gov' },
  'daily-uets': { category: 'daily', subcategory: 'gov' },
  'phone-imei': { category: 'daily', subcategory: 'gov' },

  // daily / health
  'daily-mhrs-booking': { category: 'daily', subcategory: 'health' },
  'daily-family-doctor': { category: 'daily', subcategory: 'health' },
  'daily-family-doctor-change': { category: 'daily', subcategory: 'health' },

  // daily / fin
  'daily-bank-open': { category: 'daily', subcategory: 'fin' },
  'daily-notary': { category: 'daily', subcategory: 'fin' },
  'bank-block': { category: 'daily', subcategory: 'fin' },
  'daily-fast': { category: 'daily', subcategory: 'fin' },
  'daily-paypal': { category: 'daily', subcategory: 'fin' },
  'daily-crypto': { category: 'daily', subcategory: 'fin' },
  'daily-credit-score': { category: 'daily', subcategory: 'fin' },
  'daily-booking-block': { category: 'daily', subcategory: 'fin' },

  // daily / prob
  'consumer-complaint': { category: 'daily', subcategory: 'prob' },
  'daily-lost-driving-license': { category: 'daily', subcategory: 'prob' },
  'housing-kombi-responsibility': { category: 'daily', subcategory: 'prob' },
  'housing-deposit': { category: 'daily', subcategory: 'prob' },
  'housing-rent-payment-legal': { category: 'daily', subcategory: 'prob' },
  'housing-aidat': { category: 'daily', subcategory: 'prob' },
  'housing-tahliye-undertaking': { category: 'daily', subcategory: 'prob' },
  'housing-depozito-limit': { category: 'daily', subcategory: 'prob' },
  'housing-airbnb-law': { category: 'daily', subcategory: 'prob' },
  'housing-rent-increase': { category: 'daily', subcategory: 'prob' },
  'housing-eviction': { category: 'daily', subcategory: 'prob' },
  'legal-divorce': { category: 'daily', subcategory: 'prob' },
  'car-mtv': { category: 'daily', subcategory: 'prob' },
  'car-foreign-vehicle-duration': { category: 'daily', subcategory: 'prob' },
  'car-drive-with-foreign-license': { category: 'daily', subcategory: 'prob' },
  'car-hgs-payment': { category: 'daily', subcategory: 'prob' },
  'travel-cash-limit': { category: 'daily', subcategory: 'prob' },
  'travel-exit-tax': { category: 'daily', subcategory: 'prob' },
  'travel-pets': { category: 'daily', subcategory: 'prob' },
  'travel-gold': { category: 'daily', subcategory: 'prob' },

  // daily / debt
  'debt-check': { category: 'daily', subcategory: 'debt' },

  // ===== EMERGENCY =====
  'legal-deport': { category: 'emergency', subcategory: 'deport' },
};

async function main() {
  console.log('Fixing consultant scenario categories...\n');

  let updated = 0;
  let errors = 0;
  let skipped = 0;

  for (const [id, cats] of Object.entries(CORRECT_CATEGORIES)) {
    const { error } = await supabase
      .from('consultant_scenarios')
      .update({ category: cats.category, subcategory: cats.subcategory })
      .eq('id', id);

    if (error) {
      console.log(`  ERROR: ${id} — ${error.message}`);
      errors++;
    } else {
      console.log(`  OK: ${id} → ${cats.category}/${cats.subcategory}`);
      updated++;
    }
  }

  console.log(`\nDone: ${updated} updated, ${errors} errors, ${skipped} skipped`);

  // Verify
  console.log('\n--- Verification ---');
  const { data } = await supabase.from('consultant_scenarios').select('id, category, subcategory');
  const generalCount = data.filter(s => s.category === 'general').length;
  const nullCount = data.filter(s => !s.category).length;
  console.log(`Total: ${data.length}, Still general: ${generalCount}, Null category: ${nullCount}`);

  if (generalCount > 0) {
    console.log('\nStill general:');
    data.filter(s => s.category === 'general').forEach(s => {
      console.log(`  - ${s.id}`);
    });
  }
}

main().catch(console.error);
