import { listSchemes, Scheme } from '../schemes/repository';
import { EligibilityContext } from './types';

/**
 * Advanced Hybrid Retrieval for Schemes
 * In the future, this can be upgraded to pgvector embeddings.
 * For now, we use an intelligent in-memory text & rule-based filter over the fast `listSchemes` cache.
 */
export async function searchRelevantSchemes(query: string, context?: EligibilityContext): Promise<Scheme[]> {
  const allSchemes = await listSchemes();
  
  const q = query.toLowerCase();
  
  // 1. Keyword extraction (basic intent)
  const isAskingAboutDeposit = q.includes('deposit') || q.includes('save') || q.includes('downpayment');
  const isAskingAboutStampDuty = q.includes('stamp duty') || q.includes('tax') || q.includes('concession');
  const isAskingAboutGrants = q.includes('grant') || q.includes('cash') || q.includes('fhog');
  const isAskingAboutGuarantee = q.includes('guarantee') || q.includes('fhbg') || q.includes('fhglc');
  const isAskingAboutSuper = q.includes('super') || q.includes('fhss');
  
  // Extract state if mentioned in query, else fallback to context
  const states = ['nsw', 'vic', 'qld', 'wa', 'sa', 'tas', 'act', 'nt'];
  const queryState = states.find(s => q.includes(s));
  const effectiveState = (queryState || context?.state || '').toUpperCase();

  // 2. Score and rank schemes
  const scoredSchemes = allSchemes.map(scheme => {
    let score = 0;
    const name = (scheme.scheme_name || '').toLowerCase();
    const desc = (scheme.short_description || '').toLowerCase();
    const tags = (scheme.eligibility_tag || '').toLowerCase();
    const stateApplicability = (scheme.applicable_states || '').toUpperCase();
    
    // a. Semantic / Keyword Matching
    if (name.includes(q) || desc.includes(q)) score += 10;
    
    // Boost based on intent
    if (isAskingAboutDeposit && (tags.includes('deposit') || name.includes('guarantee') || name.includes('equity'))) score += 5;
    if (isAskingAboutStampDuty && (name.includes('duty') || name.includes('concession'))) score += 5;
    if (isAskingAboutGrants && (name.includes('grant') || tags.includes('grant'))) score += 5;
    if (isAskingAboutGuarantee && name.includes('guarantee')) score += 5;
    if (isAskingAboutSuper && (name.includes('super') || name.includes('fhss'))) score += 5;
    
    // Basic word overlap
    const words = q.split(/\s+/).filter(w => w.length > 3);
    for (const w of words) {
      if (name.includes(w)) score += 2;
      if (desc.includes(w)) score += 1;
    }

    // b. State Filtering / Boosting
    // If scheme is federal ('ALL' or covers all), or matches the state, it's valid.
    // If it strictly belongs to another state, heavily penalize or filter out.
    if (effectiveState) {
      if (stateApplicability.includes(effectiveState) || stateApplicability.includes('ALL') || stateApplicability.includes('FEDERAL')) {
        score += 3; // relevant to state
      } else {
        score -= 20; // wrong state
      }
    }

    // c. Eligibility Context Boosting
    if (context?.eligibleSchemes?.includes(scheme.id)) {
      score += 5; // They are eligible for this, so it's highly relevant to them!
    } else if (context?.ineligibleSchemes?.includes(scheme.id)) {
      score -= 2; // Not eligible, lower priority unless specifically asked for
    }

    // d. Active status boost
    if (!scheme.status || /active|open/i.test(String(scheme.status))) {
      score += 2;
    }

    return { scheme, score };
  });

  // 3. Sort by score descending and take top 5
  return scoredSchemes
    .filter(s => s.score > 0) // Must have some relevance
    .sort((a, b) => b.score - a.score)
    .map(s => s.scheme)
    .slice(0, 5);
}
