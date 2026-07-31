import { config } from 'dotenv';
config({ path: '.env' });
config({ path: '.env.local' });

import { getAdminClient } from '../src/lib/supabase/server';

async function run() {
  const admin = getAdminClient();
  const { data: schemes, error } = await admin.from('government_schemes').select('*');
  
  if (error) {
    console.error('Error fetching schemes:', error);
    process.exit(1);
  }

  console.log(`Found ${schemes?.length} total schemes in DB.`);
  
  const relevantSchemes = [
    'First Home Owner Grant (FHOG)',
    'First Home Owner Grant',
    'First Home Buyer Duty Exemption',
    'First Home Guarantee',
    'Help to Buy',
    'First Home Super Saver Scheme',
    'Family Home Guarantee',
    'Regional First Home Buyer Guarantee'
  ];

  const targetSchemes = schemes?.filter(s => 
    relevantSchemes.some(r => (s.scheme_name || '').includes(r) || (s.scheme_id || '').includes(r))
  ) || [];

  console.log(`Found ${targetSchemes.length} relevant schemes for Jordan & Priya scenario:`);
  targetSchemes.forEach(s => {
    console.log(`- ${s.scheme_name} (ID: ${s.scheme_id})`);
    console.log(`  State: ${s.applicable_states}`);
    console.log(`  URL: ${s.official_url}`);
    console.log(`  Price Cap: ${s.property_price_cap}`);
    console.log(`  Deposit: ${s.minimum_deposit}`);
    console.log('---');
  });
}

run().catch(console.error);
