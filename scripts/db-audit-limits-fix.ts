import { config } from 'dotenv';
config({ path: '.env' });
config({ path: '.env.local' });

import { getAdminClient } from '../src/lib/supabase/server';

const updates = [
  {
    match: (s: any) => s.scheme_id === 'vic-first-home-owner-grant',
    update: { 
      property_price_cap: '$750,000'
    }
  },
  {
    match: (s: any) => s.scheme_id === 'vic-first-home-buyer-duty-exemption',
    update: { 
      property_price_cap: '$750,000',
      full_exemption_threshold: '$600,000',
      partial_concession_range: '$600,001 - $750,000'
    }
  },
  {
    match: (s: any) => s.scheme_id === 'fed-help-to-buy',
    update: { 
      income_cap_couple: '$180,000',
      property_price_cap: '$850,000'
    }
  }
];

async function run() {
  const admin = getAdminClient();
  const { data: schemes, error } = await admin.from('government_schemes').select('*');
  
  if (error) {
    console.error('Error fetching schemes:', error);
    process.exit(1);
  }

  let updatedCount = 0;
  for (const s of schemes || []) {
    for (const u of updates) {
      if (u.match(s)) {
        console.log(`Updating limits for ${s.scheme_id}...`);
        const { error: updErr } = await admin
          .from('government_schemes')
          .update(u.update)
          .eq('id', s.id);
        
        if (updErr) {
          console.error(`Failed to update ${s.scheme_id}:`, updErr);
        } else {
          console.log(`Success: ${s.scheme_id} ->`, u.update);
          updatedCount++;
        }
      }
    }
  }
  
  console.log(`Done. Updated ${updatedCount} scheme limits.`);
}

run().catch(console.error);
