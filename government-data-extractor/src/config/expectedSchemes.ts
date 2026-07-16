/**
 * Registry of EXPECTED First Home Buyer schemes per authority.
 *
 * This is the deterministic "source of truth" the discovery engine checks its
 * findings against — no AI involved. On each run the verification report compares
 * what was discovered with this registry and flags:
 *   - an expected scheme that was NOT found (may have moved/renamed/retired)
 *   - a discovered scheme that is NOT in the registry (a genuinely new scheme)
 *
 * Keeping this list current is the one lightweight manual touch-point; the
 * crawler does the finding, the registry keeps the Excel provably complete.
 */
export const EXPECTED_SCHEMES: Record<string, string[]> = {
  // Three separate guarantees consolidated into the 5% Deposit Scheme (Oct 2025).
  // Help to Buy launched December 2025.
  'housing-australia': [
    'Australian Government 5% Deposit Scheme',
    'Help to Buy',
  ],
  ato: ['First Home Super Saver Scheme'],
  'revenue-nsw': ['First Home Owner Grant', 'First Home Buyers Assistance Scheme'],
  'sro-vic': ['First Home Owner Grant', 'First Home Buyer Duty Exemption or Concession'],
  qro: ['First Home Owner Grant', 'First Home Transfer Duty Concession'],
  'wa-treasury': ['First Home Owner Grant', 'First Home Owner Rate of Duty'],
  'revenue-sa': ['First Home Owner Grant'],
  'sro-tas': ['First Home Owner Grant'],
  'act-revenue': ['Home Buyer Concession Scheme'],
  'nt-treasury': ['HomeGrown Territory Grant'],
};

export function expectedFor(authorityId: string): string[] {
  return EXPECTED_SCHEMES[authorityId] ?? [];
}
