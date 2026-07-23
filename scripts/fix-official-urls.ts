/**
 * Fix official_url for the Jordan & Priya reference-scenario schemes.
 *
 * Every URL below was verified against the official government site (HTTP 200,
 * scheme-specific page — not a department homepage). See PR/commit notes.
 *
 * Run: npx tsx scripts/fix-official-urls.ts
 */
import { config } from 'dotenv';
config({ path: '.env' });
config({ path: '.env.local' });

import { getAdminClient } from '../src/lib/supabase/server';

// scheme_id → verified official scheme-specific URL.
const URL_UPDATES: Record<string, string> = {
  // First Home Owner Grant (VIC) — SRO Victoria (200)
  'vic-first-home-owner-grant':
    'https://www.sro.vic.gov.au/buying-property/first-home-owner-grant',

  // First Home Buyer Duty Exemption / Concession (VIC) — SRO Victoria (200)
  'vic-first-home-buyer-duty-exemption':
    'https://www.sro.vic.gov.au/buying-property/land-transfer-stamp-duty/concessions-exemptions-and-waivers/first-home-buyers/first-home-buyer-duty-exemption-or-concession',

  // First Home Guarantee — renamed 1 Oct 2025 to "Australian Government 5%
  // Deposit Scheme"; current scheme-specific page on firsthomebuyers.gov.au (200).
  'fed-first-home-guarantee':
    'https://firsthomebuyers.gov.au/australian-government-5-percent-deposit-scheme',

  // Help to Buy — current scheme-specific page on firsthomebuyers.gov.au (200).
  // (Old housingaustralia.gov.au/support-buy-home/help-buy now 404s.)
  'fed-help-to-buy':
    'https://firsthomebuyers.gov.au/australian-government-help-buy-scheme',

  // First Home Super Saver Scheme — ATO canonical page under early-access-to-super (200).
  'fed-first-home-super-saver':
    'https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/withdrawing-and-using-your-super/early-access-to-super/first-home-super-saver-scheme',
};

async function run() {
  const admin = getAdminClient();

  let updated = 0;
  for (const [schemeId, url] of Object.entries(URL_UPDATES)) {
    const { data, error } = await admin
      .from('government_schemes')
      .update({ official_url: url })
      .eq('scheme_id', schemeId)
      .select('scheme_id,official_url');

    if (error) {
      console.error(`FAILED ${schemeId}:`, error.message);
      continue;
    }
    if (!data || data.length === 0) {
      console.error(`NO ROW matched scheme_id="${schemeId}"`);
      continue;
    }
    console.log(`OK  ${schemeId} -> ${data[0].official_url}`);
    updated += data.length;
  }

  console.log(`\nDone. Updated ${updated} row(s).`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
