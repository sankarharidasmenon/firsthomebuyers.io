import { config } from 'dotenv';
config({ path: '.env' });
config({ path: '.env.local' });

import { getAdminClient } from '../src/lib/supabase/server';

const updates = [
  {
    match: (s: any) => s.scheme_id === 'vic-first-home-owner-grant',
    update: { 
      official_url: 'https://www.sro.vic.gov.au/first-home-owner' 
    }
  },
  {
    match: (s: any) => s.scheme_id === 'vic-first-home-buyer-duty-exemption',
    update: { 
      official_url: 'https://www.sro.vic.gov.au/first-home-owner/first-home-buyer-duty-exemption-concession-or-reduction' 
    }
  },
  {
    match: (s: any) => s.scheme_id === 'fed-first-home-guarantee',
    update: { 
      official_url: 'https://www.housingaustralia.gov.au/support-buy-home/first-home-guarantee' 
    }
  },
  {
    match: (s: any) => s.scheme_id === 'fed-family-home-guarantee',
    update: { 
      official_url: 'https://www.housingaustralia.gov.au/support-buy-home/family-home-guarantee' 
    }
  },
  {
    match: (s: any) => s.scheme_id === 'fed-regional-first-home-buyer-guarantee',
    update: { 
      official_url: 'https://www.housingaustralia.gov.au/support-buy-home/regional-first-home-buyer-guarantee' 
    }
  },
  {
    match: (s: any) => s.scheme_id === 'fed-help-to-buy',
    update: { 
      official_url: 'https://www.housingaustralia.gov.au/support-buy-home/help-buy',
      minimum_deposit: '2%'
    }
  },
  {
    match: (s: any) => s.scheme_id === 'fed-first-home-super-saver-scheme',
    update: { 
      official_url: 'https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/withdrawing-and-using-your-super/first-home-super-saver-scheme' 
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
        console.log(`Updating ${s.scheme_id}...`);
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
  
  console.log(`Done. Updated ${updatedCount} schemes.`);
}

run().catch(console.error);
