import { config } from 'dotenv';
config({ path: '.env' });
config({ path: '.env.local' });
import { getAdminClient } from '../src/lib/supabase/server';

async function dump() {
  const admin = getAdminClient();
  const { data, error } = await admin.from('government_schemes').select('*');
  if (error) {
    console.error(error);
    return;
  }
  const targetIds = [
    'vic-first-home-owner-grant',
    'vic-first-home-buyer-duty-exemption',
    'fed-first-home-guarantee',
    'fed-help-to-buy',
    'fed-first-home-super-saver-scheme',
    'fed-family-home-guarantee',
    'fed-regional-first-home-buyer-guarantee'
  ];
  for (const s of data || []) {
    if (targetIds.includes(s.scheme_id)) {
      console.log('---');
      console.log('ID:', s.scheme_id);
      console.log('Name:', s.scheme_name);
      console.log('Benefit:', s.benefit_value);
      console.log('Price Cap:', s.property_price_cap);
      console.log('Income Cap Couple:', s.income_cap_couple);
      console.log('Min Deposit:', s.minimum_deposit);
      console.log('Official URL:', s.official_url);
    }
  }
}
dump();
