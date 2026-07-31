import { config } from 'dotenv';
config({ path: '.env' });
config({ path: '.env.local' });
import { getAdminClient } from '../src/lib/supabase/server';

async function fixHtb() {
  const admin = getAdminClient();
  await admin.from('government_schemes').update({
    income_cap_couple: '$165,000',
    income_cap_single: '$103,000',
  }).eq('scheme_id', 'fed-help-to-buy');
  console.log('HTB income caps fixed.');
}
fixHtb();
