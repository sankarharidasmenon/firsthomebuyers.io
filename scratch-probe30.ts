import { config } from 'dotenv';
config({ path: '.env' }); config({ path: '.env.local' });
import { getAdminClient } from './src/lib/supabase/server';
import { buildEligibilityResult, type ApiScheme, type EligibilityAnswers } from './src/lib/schemes/eligibilityClient';
import { summariseEligibility } from './src/lib/schemes/summary';
import { firstHomeDuty, supportsDuty, formatDuty } from './src/lib/schemes/stampDuty';

const L: Record<string, string> = {
  'wa-first-home-owner-grant': 'FHOG', 'wa-first-home-owner-rate-of-duty': 'FHOR', 'wa-off-the-plan-duty-concession': 'OTP',
  'tas-first-home-owner-grant': 'FHOG', 'tas-myhome-shared-equity': 'MyHome',
  'nt-homegrown-territory-grant': 'HTG', 'nt-house-and-land-package-exemption': 'HLPE',
  'fed-first-home-guarantee': 'FHBG', 'fed-family-home-guarantee': 'FHG', 'fed-help-to-buy': 'HTB', 'fed-first-home-super-saver': 'FHSS',
};

type P = {
  id: string; st: string; price: number; cat: any; rawPt: string; pt?: any; inc: number; dep: number | null;
  joint?: boolean; coInc?: number; coCit?: string; cit?: string; owned?: string; ent?: string; ppr?: string; region?: any;
};

const A = (p: P): EligibilityAnswers => ({
  state: p.st, firstHomeBuyer: (p.owned ?? 'No') === 'No', income: p.inc + (p.coInc ?? 0),
  hasPartner: !!p.joint, propertyPrice: p.price, deposit: p.dep,
  propertyType: p.pt ?? (p.rawPt === 'Off-the-Plan' ? 'offplan' : 'house'), propertyCategory: p.cat,
  propertyRegion: p.region,
  rawAnswers: {
    state: p.st, price: p.price, propertyType: p.rawPt, entity: p.ent ?? 'Individual',
    buyingWith: p.joint ? 'Jointly' : 'Individually',
    coCitizenship: p.joint ? (p.coCit ?? 'Australian Citizen') : '',
    coDob: p.joint ? '1993-04-11' : '', hasPartner: p.joint ? 'Yes' : 'No', partnerOwned: p.joint ? 'No' : '',
    is18: 'Yes', citizenship: p.cit ?? 'Australian Citizen', everOwned: p.owned ?? 'No', priorBenefit: 'No',
    ppr: p.ppr ?? 'Yes', moveIn: (p.ppr ?? 'Yes') === 'Yes' ? 'Yes' : '', income: p.inc,
    coIncome: p.joint ? p.coInc : undefined,
  },
});

const PROBES: P[] = [
  // ── WA ──
  { id: 'WA-HP-01', st: 'WA', price: 560000, cat: 'new', rawPt: 'New', inc: 92000, dep: 56000, region: 'capital' },
  { id: 'WA-HP-02', st: 'WA', price: 650000, cat: 'land', rawPt: 'Land + Build', inc: 88000, dep: 70000, joint: true, coInc: 72000, coCit: 'Permanent Resident', region: 'capital' },
  { id: 'WA-BD-01', st: 'WA', price: 600000, cat: 'established', rawPt: 'Established (Existing)', inc: 95000, dep: 60000, region: 'capital' },
  { id: 'WA-BD-02', st: 'WA', price: 600001, cat: 'established', rawPt: 'Established (Existing)', inc: 95000, dep: 60000, region: 'capital' },
  { id: 'WA-CR-01', st: 'WA', price: 700000, cat: 'offplan', rawPt: 'Off-the-Plan', inc: 97000, dep: 70000 },
  { id: 'WA-CR-02', st: 'WA', price: 590000, cat: 'new', rawPt: 'New', inc: 89000, dep: null, region: 'capital' },
  { id: 'WA-CR-03', st: 'WA', price: 575000, cat: 'new', rawPt: 'New', inc: 93000, dep: 58000, cit: 'Other', region: 'capital' },
  { id: 'WA-NG-01', st: 'WA', price: 640000, cat: 'established', rawPt: 'Established (Existing)', inc: 110000, dep: 90000, owned: 'Yes', region: 'capital' },
  { id: 'WA-NG-02', st: 'WA', price: 620000, cat: 'new', rawPt: 'New', inc: 120000, dep: 95000, ent: 'Company', region: 'capital' },
  { id: 'WA-NG-03', st: 'WA', price: 610000, cat: 'new', rawPt: 'New', inc: 125000, dep: 130000, ppr: 'No', region: 'capital' },
  // ── TAS ──
  { id: 'TAS-HP-01', st: 'TAS', price: 550000, cat: 'new', rawPt: 'New', inc: 88000, dep: 55000, region: 'capital' },
  { id: 'TAS-HP-02', st: 'TAS', price: 620000, cat: 'land', rawPt: 'Land + Build', inc: 60000, dep: 62000, joint: true, coInc: 55000, region: 'capital' },
  { id: 'TAS-BD-01', st: 'TAS', price: 520000, cat: 'new', rawPt: 'New', inc: 102785, dep: 52000, region: 'capital' },
  { id: 'TAS-BD-02', st: 'TAS', price: 520000, cat: 'new', rawPt: 'New', inc: 102786, dep: 52000, region: 'capital' },
  { id: 'TAS-CR-01', st: 'TAS', price: 600000, cat: 'established', rawPt: 'Established (Existing)', inc: 95000, dep: 60000 },
  { id: 'TAS-CR-02', st: 'TAS', price: 540000, cat: 'new', rawPt: 'New', inc: 86000, dep: null, region: 'capital' },
  { id: 'TAS-CR-03', st: 'TAS', price: 530000, cat: 'new', rawPt: 'New', inc: 90000, dep: 53000, cit: 'Other', region: 'capital' },
  { id: 'TAS-NG-01', st: 'TAS', price: 560000, cat: 'established', rawPt: 'Established (Existing)', inc: 105000, dep: 80000, owned: 'Yes', region: 'capital' },
  { id: 'TAS-NG-02', st: 'TAS', price: 575000, cat: 'new', rawPt: 'New', inc: 115000, dep: 90000, ent: 'Trust', region: 'capital' },
  { id: 'TAS-NG-03', st: 'TAS', price: 565000, cat: 'new', rawPt: 'New', inc: 120000, dep: 120000, ppr: 'No', region: 'capital' },
  // ── NT ──
  { id: 'NT-HP-01', st: 'NT', price: 580000, cat: 'land', rawPt: 'Land + Build', inc: 92000, dep: 58000, region: 'capital' },
  { id: 'NT-HP-02', st: 'NT', price: 700000, cat: 'new', rawPt: 'New', inc: 98000, dep: 70000, joint: true, coInc: 60000, region: 'capital' },
  { id: 'NT-BD-01', st: 'NT', price: 525000, cat: 'land', rawPt: 'Land + Build', inc: 90000, dep: 53000, region: 'capital' },
  { id: 'NT-BD-02', st: 'NT', price: 525001, cat: 'land', rawPt: 'Land + Build', inc: 90000, dep: 53000, region: 'capital' },
  { id: 'NT-CR-01', st: 'NT', price: 650000, cat: 'new', rawPt: 'New', inc: 95000, dep: 65000 },
  { id: 'NT-CR-02', st: 'NT', price: 560000, cat: 'land', rawPt: 'Land + Build', inc: 88000, dep: null, region: 'capital' },
  { id: 'NT-CR-03', st: 'NT', price: 545000, cat: 'new', rawPt: 'New', inc: 91000, dep: 55000, cit: 'Other', region: 'capital' },
  { id: 'NT-NG-01', st: 'NT', price: 590000, cat: 'established', rawPt: 'Established (Existing)', inc: 99000, dep: 60000, region: 'capital' },
  { id: 'NT-NG-02', st: 'NT', price: 600000, cat: 'new', rawPt: 'New', inc: 112000, dep: 90000, owned: 'Yes', region: 'capital' },
  { id: 'NT-NG-03', st: 'NT', price: 605000, cat: 'new', rawPt: 'New', inc: 130000, dep: 95000, ent: 'Company', region: 'capital' },
];

async function main() {
  const admin = getAdminClient();
  const { data } = await admin.from('government_schemes').select('*');
  const schemes = data as unknown as ApiScheme[];
  for (const p of PROBES) {
    const r = buildEligibilityResult(schemes, A(p));
    const s = summariseEligibility(r.items, { state: p.st, price: p.price });
    const eligible = r.items.filter((i) => L[i.eg.grant.id] && i.bucket === 'yes').map((i) => L[i.eg.grant.id]);
    const check = r.items.filter((i) => L[i.eg.grant.id] && i.bucket === 'check').map((i) => L[i.eg.grant.id] + ' (Check Required)');
    const d = supportsDuty(p.st) ? firstHomeDuty(p.st as any, p.price) : null;
    const dutyStr = s.duty && s.duty.saving !== null ? '$' + formatDuty(s.duty.saving) : (d ? 'no duty scheme' : 'n/a');
    const all = [...eligible, ...check];
    console.log(
      p.id.padEnd(9) +
      ' cash $' + s.cash.total.toLocaleString('en-AU').padStart(7) +
      '  duty ' + dutyStr.padStart(14) +
      '  [' + (all.length ? all.join(', ') : 'None') + ']'
    );
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
