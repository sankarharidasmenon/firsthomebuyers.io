import { config } from 'dotenv';
config({ path: '.env' });
config({ path: '.env.local' });

import { getAdminClient } from '../src/lib/supabase/server';
import { toEligibilityAnswers } from '../src/lib/questionnaire/logic';
import type { Answers } from '../src/lib/questionnaire/types';
import fs from 'fs';

// We need to redefine evaluateScheme since we can't easily import the client component's internal function without browser polyfills.
function parseMoney(v: unknown): number | null {
  if (!v) return null
  const n = Number(String(v).replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

function evaluateScheme(s: any, a: any) {
  const rules: any[] = []
  let bucket = 'yes'
  const ra = a.rawAnswers || {}

  const fail = (text: string) => { rules.push({ met: false, text }); bucket = 'no' }
  const pass = (text: string) => { rules.push({ met: true, text }) }
  const check = (text: string) => { rules.push({ met: false, isCheck: true, text }); if (bucket === 'yes') bucket = 'check' }

  if (s.applicable_states) {
    const states = String(s.applicable_states).toUpperCase()
    const federal = /ALL STATES|ALL TERRITORIES|NATION|AUSTRALIA[- ]WIDE/.test(states)
    const stateMatch = federal || states.includes(a.state.toUpperCase())
    if (stateMatch) pass(`Applicable to ${federal ? 'all states (Federal)' : a.state}`)
    else fail(`Scheme is for ${s.applicable_states}, not ${a.state}`)
  }
  if (bucket === 'no') return { bucket, ruleResults: rules }

  if (s.eligible_property_types && a.propertyType) {
    const pt = a.propertyType.toLowerCase()
    const st = String(s.eligible_property_types).toLowerCase()
    if (!st.includes('property')) {
      let ptMatch = false
      if (pt === 'house' && (st.includes('house') || st.includes('home') || st.includes('dwelling'))) ptMatch = true
      if (pt === 'townhouse' && (st.includes('townhouse') || st.includes('home'))) ptMatch = true
      if (pt === 'apartment' && (st.includes('apartment') || st.includes('unit'))) ptMatch = true
      if (pt === 'offplan' && st.includes('off-the-plan')) ptMatch = true
      if (st.includes('new home') && ra.propertyType !== 'New' && ra.propertyType !== 'Off-the-Plan') ptMatch = false
      if (ptMatch || st === '') pass(`Property type (${ra.propertyType}) is eligible`)
      else fail(`Property type (${ra.propertyType}) does not match: ${s.eligible_property_types}`)
    } else pass(`Property type (${ra.propertyType}) is eligible`)
  } else pass(`Property type requirement satisfied`)

  if (s.scheme_id === 'fed-regional-first-home-buyer-guarantee') fail(`Property is not located in an eligible regional area (Metro assumed for now)`)
  else pass(`Property location requirement satisfied`)

  const priceCap = parseMoney(s.property_price_cap)
  if (priceCap !== null && a.propertyPrice > 0) {
    if (a.propertyPrice <= priceCap) pass(`Purchase price ($${a.propertyPrice.toLocaleString()}) within $${priceCap.toLocaleString()} limit`)
    else fail(`Purchase price ($${a.propertyPrice.toLocaleString()}) exceeds $${priceCap.toLocaleString()} limit`)
  } else if (priceCap !== null) check(`Purchase price not provided, cap is $${priceCap.toLocaleString()}`)
  else pass(`No property price cap applied`)

  if (ra.is18 === 'Yes') {
    if (ra.buyingWith === 'Jointly' && ra.coDob) pass(`All applicants are 18+ years old`)
    else pass(`Applicant is 18+ years old`)
  } else if (ra.is18 === 'No') fail(`Applicant must be 18 or older`)
  else check(`Applicant age not provided`)

  if (ra.citizenship) {
    const RESIDENT_OK = ['Australian Citizen', 'Permanent Resident', 'NZ Special Category Visa (SCV) holder']
    if (RESIDENT_OK.includes(ra.citizenship)) pass(`Citizenship / Residency requirement satisfied`)
    else check(`Residency status (${ra.citizenship}) may not be eligible`)
  } else check(`Citizenship / Residency not provided`)

  const requiresFHB = /yes/i.test(s.first_home_buyer_required || '') || /first[\s-]?home/i.test(s.scheme_name || '')
  if (requiresFHB) {
    if (a.firstHomeBuyer) pass(`First-home buyer requirement satisfied`)
    else fail(`Applicant or partner has previously owned property`)
  } else pass(`First-home buyer requirement satisfied`)

  if (ra.priorBenefit === 'Yes') fail(`Applicant has previously received a first-home grant or concession`)
  else if (ra.priorBenefit === 'No') pass(`No previous grants or schemes received`)

  if (ra.ppr === 'Yes') pass(`Owner-occupier requirement satisfied`)
  else if (ra.ppr === 'No') fail(`Property must be Principal Place of Residence`)
  else check(`Owner-occupier intent not provided`)

  if (ra.ppr === 'Yes') {
    if (ra.moveIn === 'Yes') pass(`Will move in within required timeframe`)
    else if (ra.moveIn === 'No') check(`Move-in timeframe may not meet government requirements`)
    else check(`Move-in timeframe not provided`)
  } else pass(`Move-in requirement skipped (Not PPR)`)

  const incomeCap = parseMoney(a.hasPartner ? s.income_cap_couple : s.income_cap_single)
  if (incomeCap !== null) {
    if (a.income > 0) {
      if (a.income <= incomeCap) pass(`Combined income ($${a.income.toLocaleString()}) within $${incomeCap.toLocaleString()} threshold`)
      else fail(`Combined income ($${a.income.toLocaleString()}) exceeds $${incomeCap.toLocaleString()} threshold`)
    } else check(`Income not provided, threshold is $${incomeCap.toLocaleString()}`)
  } else pass(`No income threshold applies`)

  if (s.minimum_deposit) {
    if (a.deposit !== null) {
      const depositPct = a.propertyPrice > 0 ? (a.deposit / a.propertyPrice) * 100 : 0
      const requiredPct = parseFloat(s.minimum_deposit.replace('%', ''))
      if (depositPct >= requiredPct) pass(`Deposit requirement (${s.minimum_deposit}) verified`)
      else fail(`Deposit is less than the required ${s.minimum_deposit}`)
    } else check(`Deposit requirement (${s.minimum_deposit}) could not be verified`)
  }

  if (s.single_parent_required === 'Yes') {
    if (a.hasPartner) fail(`Applicant is not a single parent (applying with partner)`)
    else check(`Single parent status could not be fully verified`)
  }

  return { bucket, ruleResults: rules }
}

const JORDAN_PRIYA: Answers = {
  name: 'Jordan',
  state: 'VIC',
  propertyType: 'New',
  nswNeverOccupied: '',
  price: 580000,
  suburb: 'Melbourne',
  postcode: '3000',
  ppr: 'Yes',
  moveIn: 'Yes',
  is18: 'Yes',
  buyingWith: 'Jointly',
  citizenship: 'Australian Citizen',
  coCitizenship: 'Australian Citizen',
  coDob: '1995-01-01',
  entity: 'Individual',
  everOwned: 'No',
  hasPartner: 'Yes',
  partnerOwned: 'No',
  priorBenefit: 'No',
  vicLivedInPrior: '',
  vicAdf: 'No',
  vicFamilyViolence: 'No',
  income: 75000,
  coIncome: 65000,
  deposit: null, // Note: Not collecting deposit to trigger Check Required for HTB/FHG
}

async function run() {
  const admin = getAdminClient();
  const { data: schemes, error } = await admin.from('government_schemes').select('*');
  
  if (error) {
    console.error('Error fetching schemes:', error);
    process.exit(1);
  }

  const active = schemes?.filter(s => !s.status || !/closed|ended|expired|merged|superseded|inactive/i.test(String(s.status))) || []
  
  const eligAnswers = toEligibilityAnswers(JORDAN_PRIYA);

  const targetIds = [
    'vic-first-home-owner-grant',
    'vic-first-home-buyer-duty-exemption',
    'fed-first-home-guarantee',
    'fed-help-to-buy',
    'fed-first-home-super-saver-scheme',
    'fed-first-home-super-saver',
    'fed-family-home-guarantee',
    'fed-regional-first-home-buyer-guarantee'
  ];

  console.log('| Scheme | Status | Reason |');
  console.log('|--------|--------|--------|');
  
  for (const s of schemes || []) {
    if (targetIds.includes(s.scheme_id)) {
      const res = evaluateScheme(s, eligAnswers);
      const statusStr = res.bucket === 'yes' ? 'Eligible' : (res.bucket === 'check' ? 'Check Required' : 'Ineligible');
      
      const firstFail = res.ruleResults.find((r: any) => !r.met && !r.isCheck)?.text;
      const firstCheck = res.ruleResults.find((r: any) => r.isCheck)?.text;
      
      let reason = 'Meets all mandatory criteria';
      if (statusStr === 'Ineligible') reason = firstFail || 'Failed mandatory criteria';
      if (statusStr === 'Check Required') reason = firstCheck || 'Manual verification required';

      console.log(`| ${s.scheme_name} | ${statusStr} | ${reason} |`);
    }
  }

}

run().catch(console.error);
