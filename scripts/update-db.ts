import { config } from 'dotenv';
config({ path: '.env' });
config({ path: '.env.local' });
import { getAdminClient } from '../src/lib/supabase/server';

async function updateDB() {
  const admin = getAdminClient();

  // Help to Buy
  await admin.from('government_schemes').update({
    benefit_value: 'Up to 40% equity contribution',
    income_cap_couple: '$120,000',
    income_cap_single: '$90,000',
    property_price_cap: '$950,000',
    minimum_deposit: '2%',
    official_url: 'https://www.housingaustralia.gov.au/support-buy-home/help-buy'
  }).eq('scheme_id', 'fed-help-to-buy');

  // Family Home Guarantee
  await admin.from('government_schemes').update({
    minimum_deposit: '2%',
    income_cap_single: '$125,000',
    single_parent_required: 'Yes',
    official_url: 'https://www.housingaustralia.gov.au/support-buy-home/family-home-guarantee'
  }).eq('scheme_id', 'fed-family-home-guarantee');

  // First Home Guarantee
  await admin.from('government_schemes').update({
    minimum_deposit: '5%',
    income_cap_single: '$125,000',
    income_cap_couple: '$200,000',
    official_url: 'https://www.housingaustralia.gov.au/support-buy-home/first-home-guarantee'
  }).eq('scheme_id', 'fed-first-home-guarantee');

  // Regional First Home Buyer Guarantee
  await admin.from('government_schemes').update({
    minimum_deposit: '5%',
    income_cap_single: '$125,000',
    income_cap_couple: '$200,000',
    official_url: 'https://www.housingaustralia.gov.au/support-buy-home/regional-first-home-buyer-guarantee'
  }).eq('scheme_id', 'fed-regional-first-home-buyer-guarantee');

  // First Home Super Saver Scheme
  await admin.from('government_schemes').update({
    official_url: 'https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/withdrawing-and-using-your-super/first-home-super-saver-scheme'
  }).ilike('scheme_id', '%super-saver%');

  // VIC First Home Owner Grant
  await admin.from('government_schemes').update({
    benefit_value: '$10,000',
    property_price_cap: '$750,000',
    official_url: 'https://www.sro.vic.gov.au/first-home-owner'
  }).eq('scheme_id', 'vic-first-home-owner-grant');

  // VIC Duty Exemption
  await admin.from('government_schemes').update({
    property_price_cap: '$750,000',
    official_url: 'https://www.sro.vic.gov.au/first-home-owner/first-home-buyer-duty-exemption-concession-or-reduction'
  }).eq('scheme_id', 'vic-first-home-buyer-duty-exemption');

  console.log('Database updated successfully.');
}

updateDB();
