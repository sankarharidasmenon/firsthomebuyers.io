/**
 * Applicant-level scheme predicates, derived from the master-data columns.
 *
 * These answer "does THIS scheme care about X?" so the engine can apply the
 * Flow_Logic gates per scheme instead of assuming every scheme behaves alike.
 * Everything here reads existing structured columns — no new master-data field
 * was introduced, so an Excel re-import cannot silently disable a rule.
 *
 * Source of truth for the gates:
 *   docs/FirstNest – Common Eligibility Questionnaire (NSW & Victoria).xlsx
 *   → "Flow_Logic" sheet, rows 7 (C08), 12 (N01) and 17 (C17).
 */

/** The subset of columns these predicates read. */
export interface ApplicantRuleScheme {
  scheme_name?: string | null;
  new_vs_established?: string | null;
  prior_ownership_rules?: string | null;
  other_conditions?: string | null;
  minimum_age?: string | null;
  citizenship_residency?: string | null;
  owner_occupier_required?: string | null;
  single_parent_required?: string | null;
  relationship_status?: string | null;
  first_home_buyer_required?: string | null;
}

const has = (v: unknown): boolean => String(v ?? '').trim().length > 0;
const isYes = (v: unknown): boolean => /^\s*yes/i.test(String(v ?? ''));

/**
 * C17 — Flow_Logic r17: "If Company or Trust → exclude all natural-person-only
 * grants/concessions."
 *
 * A scheme is natural-person-only when it imposes at least one requirement that
 * only a human being can satisfy — an age, a citizenship or residency status, an
 * obligation to live in the home, a family situation, or first-home-buyer
 * status. A company or trust cannot hold any of those, so such a scheme cannot
 * be claimed by one. Schemes that state it outright in `other_conditions`
 * (the NSW FHOG and FHBAS both do) are matched by the explicit test first.
 *
 * Deliberately NOT "every scheme": a future row with no personal requirement —
 * a developer or builder incentive, say — returns false and stays available.
 */
export function requiresNaturalPerson(s: ApplicantRuleScheme): boolean {
  const stated = String(s.other_conditions ?? '');
  if (/natural person|must be (an )?individual|individuals?\b[^.]*\bnot\b[^.]*\b(company|trust)|not a (company|trust)/i.test(stated)) {
    return true;
  }
  return (
    has(s.minimum_age) ||
    has(s.citizenship_residency) ||
    isYes(s.owner_occupier_required) ||
    isYes(s.single_parent_required) ||
    has(s.relationship_status) ||
    isYes(s.first_home_buyer_required)
  );
}

/**
 * C08 — Flow_Logic r7: "C07 = Yes AND C08 = Yes → Household FHB eligibility
 * affected; verify per state — NSW and VIC treat partner ownership differently."
 *
 * Because the two states differ, this is driven by the scheme's OWN wording:
 * true only when `prior_ownership_rules` extends the no-prior-ownership test to
 * a spouse or partner. The NSW FHOG ("No applicant, or their spouse or partner,
 * may have owned…") and FHBAS ("Neither you nor your spouse or partner…") both
 * do; the federal guarantees test the applicant alone and are unaffected.
 */
export type PartnerOwnershipRuleType = 'absolute' | 'time-qualified' | 'none'

export function partnerOwnershipRuleType(s: ApplicantRuleScheme): PartnerOwnershipRuleType {
  const prior = String(s.prior_ownership_rules ?? '')
  if (!/spouse|partner/i.test(prior)) return 'none'

  const timeQualified = /before 1 july|on or after 1 july|within the last|in the last|past \d+ years|within \d+ years|for \d+ continuous months|continuous months|lived for|lived in|owned and lived|past 10 years|10 years/i.test(prior)
  if (timeQualified) return 'time-qualified'

  const absolute = /(neither|must not|cannot|not eligible|no applicant|no one)/i.test(prior) && /(owned|co-owned|held an interest|have owned|own property)/i.test(prior)
  if (absolute) return 'absolute'

  return 'none'
}

export function partnerOwnershipDisqualifies(s: ApplicantRuleScheme): boolean {
  return partnerOwnershipRuleType(s) === 'absolute'
}

/**
 * C04 / C05 — the citizenship or residency test, read from the scheme's own
 * `citizenship_residency` column so each scheme applies its published rule.
 *
 * Two things vary between schemes and both are already stated in the data:
 *
 *   scope       Revenue NSW writes "At least one applicant/purchaser must be…"
 *               for the FHOG and FHBAS, so one qualifying buyer carries a joint
 *               application. Housing Australia states its requirement without
 *               that qualifier, so it binds every applicant.
 *   citizenOnly Help to Buy says "Australian citizen" with no mention of
 *               permanent residents; the 5% Deposit Scheme says "Australian
 *               citizen or permanent resident". A permanent resident therefore
 *               satisfies one and not the other.
 *
 * `stated: false` means the column is empty (e.g. the ATO's FHSS, which imposes
 * no residency test) — the caller then keeps its previous generic behaviour
 * rather than inventing a requirement.
 */
export interface CitizenshipRequirement {
  stated: boolean;
  scope: 'all' | 'any';
  citizenOnly: boolean;
}

export function citizenshipRequirement(s: ApplicantRuleScheme): CitizenshipRequirement {
  const text = String(s.citizenship_residency ?? '').trim();
  if (!text) return { stated: false, scope: 'all', citizenOnly: false };
  return {
    stated: true,
    scope: /at least one/i.test(text) ? 'any' : 'all',
    citizenOnly: /citizen/i.test(text) && !/permanent resident/i.test(text),
  };
}

/**
 * Whether one applicant's questionnaire answer satisfies that requirement.
 * `unknown` covers statuses outside the three recognised categories — the
 * engine turns those into "check", never into a rejection.
 *
 * A scheme that publishes NO citizenship or residency requirement
 * (`stated: false`) cannot be failed on one, so every status returns `ok`.
 * This is what the `stated` flag was documented to mean above — "the ATO's
 * FHSS, which imposes no residency test" — but the previous fallback tested the
 * status against `legacyAccepted` and returned `unknown` for anything outside
 * it, which invented a requirement the scheme does not have. The ATO's stated
 * FHSS eligibility is 18+, never having held a property interest in Australia,
 * and intending to occupy the home; citizenship and residency appear nowhere in
 * it, and the ATO confirms neither Australian citizenship nor Australian tax
 * residency is needed to use the scheme. (Being a foreign resident for tax
 * purposes can mean a higher tax rate on the released amount — a tax
 * consequence, not an eligibility bar.)
 *
 * `legacyAccepted` is retained in the signature so the caller is unchanged; it
 * is no longer consulted.
 */
export function citizenshipVerdict(
  requirement: CitizenshipRequirement,
  status: string,
  legacyAccepted: readonly string[],
): 'ok' | 'no' | 'unknown' {
  void legacyAccepted;
  if (!requirement.stated) return 'ok';
  if (status === 'Australian Citizen') return 'ok';
  // A permanent resident, and a NZ SCV holder (whom the NSW schemes treat as a
  // permanent resident), satisfy anything short of a citizens-only scheme.
  if (status === 'Permanent Resident' || /special category/i.test(status)) {
    return requirement.citizenOnly ? 'no' : 'ok';
  }
  return 'unknown';
}

/**
 * N01 — Flow_Logic r12: "If No → NSW FHOG excluded; other NSW concessions
 * (e.g. stamp duty) still assessed independently."
 *
 * N01 asks whether the home has never been occupied or sold as a residence —
 * i.e. whether it is genuinely new. Only schemes restricted to new homes depend
 * on the answer, which is exactly the exclusion the spec describes: the NSW FHOG
 * is new-homes-only, while the FHBAS covers new and established alike and is
 * therefore assessed independently, as required.
 */
export function requiresUnoccupiedNewHome(s: ApplicantRuleScheme): boolean {
  return /new\b[^.]*only/i.test(String(s.new_vs_established ?? ''));
}

/**
 * V02 — whether THIS scheme exempts active Defence Force members from its
 * residence requirement.
 *
 * Victoria: State Revenue Office Victoria, first home buyer duty exemption or
 * concession — "Active Australian Defence Force members are exempt from the
 * residence requirement", which does not extend to reservists or Australian
 * Public Service staff. The same exemption applies to the Victorian First Home
 * Owner Grant under the First Home Owner Grant and Home Buyer Schemes Act 2000.
 *
 * Read from the scheme's own `other_conditions`, so it can never be applied to a
 * scheme that does not publish the exemption. NSW records an equivalent
 * exemption, but the questionnaire only asks the ADF question of Victorian
 * applicants, so no NSW result can change.
 */
export function exemptsAdfFromResidence(s: ApplicantRuleScheme): boolean {
  const text = String(s.other_conditions ?? '');
  return /defence force[^.]*exempt[^.]*residence|exempt[^.]*residence[^.]*defence force/i.test(text);
}

/**
 * V03 — whether THIS scheme lets a victim-survivor of family violence requalify
 * for first home benefits despite prior ownership or a prior grant.
 *
 * Victoria: the Duties Act 2000 (Vic) and the First Home Owner Grant and Home
 * Buyer Schemes Act 2000 (Vic) were amended to provide this pathway. It is
 * assessed by the Commissioner of State Revenue rather than granted
 * automatically, so the engine treats it as needing verification.
 */
export function recognisesFamilyViolenceRequalification(s: ApplicantRuleScheme): boolean {
  return /family violence/i.test(String(s.other_conditions ?? ''));
}

export type PropertyCategory = 'new' | 'established' | 'offplan' | 'land';

/**
 * Categories a scheme confines itself to, or null when it does not confine
 * itself by category.
 *
 * Read from `new_vs_established`, the column that already records this. It
 * deliberately does NOT cover the new-homes-only case — the engine has handled
 * that since before Queensland was supported, and its wording and message stay
 * exactly as they were so NSW and VIC results cannot move.
 *
 * What it adds is the two restrictions Queensland introduced and no NSW or VIC
 * scheme uses:
 *
 *   established-only  QLD First Home Concession — "Established homes — brand-new
 *                     homes are covered by the first home (new home) concession"
 *   vacant-land-only  QLD First Home Vacant Land Concession — "Vacant land on
 *                     which you build your first home"
 *
 * Every NSW, VIC and federal row reads "Both new and established", "New homes
 * only …" or is blank, so none of them match and none of them change.
 */
export function restrictedPropertyCategories(s: ApplicantRuleScheme): PropertyCategory[] | null {
  const nve = String(s.new_vs_established ?? '').trim();
  if (!nve) return null;
  if (/new\b[^.]*only/i.test(nve)) return null; // handled by the existing new-homes-only gate
  if (/^established/i.test(nve)) return ['established'];
  if (/^vacant land/i.test(nve)) return ['land'];
  // Off-the-plan-only. Without this the Victorian off-the-plan concession matched
  // any dwelling type, because its eligible_property_types lists "Townhouse" and
  // the keyword test finds "house" inside that word.
  if (/^off-the-plan/i.test(nve)) return ['offplan'];
  return null;
}

/**
 * Whether the scheme's price cap excludes the cap value itself.
 *
 * Most caps are inclusive — Revenue NSW writes "must not exceed $600,000" and
 * the SRO writes "valued up to $750,000", so a purchase at exactly the cap
 * qualifies. The Queensland First Home Owner Grant is different: the QRO
 * requires the home to be "less than $750,000", so exactly $750,000 does not.
 *
 * Read from `property_price_cap` only. The wording lives in the same field as
 * the number so a data correction cannot separate them, and the historical
 * "partial concession below $500,000" text in other rows' price_cap_variations
 * cannot be mistaken for it.
 */
export function capIsExclusive(s: { property_price_cap?: string | null }): boolean {
  return /less than|under\s*\$|below\s*\$/i.test(String(s.property_price_cap ?? ''));
}

/**
 * Whether the scheme's higher income cap also applies to a SINGLE applicant who
 * has dependent children.
 *
 * Queensland's Boost to Buy allows $155,000 for a single applicant but $232,000
 * for two adults OR for a single applicant with one or more dependants. The
 * questionnaire never asks about dependent children, so for a single applicant
 * earning between the two caps the honest answer is "check", not "no".
 *
 * Read from `income_test_basis`, where Boost to Buy states the rule verbatim.
 */
export function incomeCapVariesWithDependants(s: { income_test_basis?: string | null }): boolean {
  return /single applicant with[^.]*depend|single[^.]*with[^.]*depend/i.test(String(s.income_test_basis ?? ''));
}
