import { EligibilityContext } from './types';
import { Scheme } from '../schemes/repository';

/**
 * Formats the retrieved schemes and user profile into a dense markdown context for the AI.
 */
export function buildSystemContext(schemes: Scheme[], profile?: EligibilityContext): string {
  let contextStr = ``;

  if (profile && Object.keys(profile).length > 0) {
    contextStr += `### USER ELIGIBILITY PROFILE\n`;
    contextStr += `- State: ${profile.state || 'Unknown'}\n`;
    if (profile.income) contextStr += `- Income: $${profile.income.toLocaleString()}\n`;
    if (profile.targetPropertyPrice) contextStr += `- Target Property Price: $${profile.targetPropertyPrice.toLocaleString()}\n`;
    if (profile.deposit) contextStr += `- Deposit: $${profile.deposit.toLocaleString()}\n`;
    if (profile.isFirstHomeBuyer !== undefined) contextStr += `- First Home Buyer: ${profile.isFirstHomeBuyer ? 'Yes' : 'No'}\n`;
    if (profile.citizenship) contextStr += `- Citizenship: ${profile.citizenship}\n`;
    if (profile.relationshipStatus) contextStr += `- Relationship: ${profile.relationshipStatus}\n`;
    if (profile.dependents !== undefined) contextStr += `- Dependents: ${profile.dependents}\n`;
    contextStr += `\n`;
  }

  if (schemes.length > 0) {
    contextStr += `### RELEVANT GOVERNMENT SCHEMES\n`;
    schemes.forEach(s => {
      contextStr += `---
Scheme ID: ${s.id}
Name: ${s.scheme_name}
State: ${s.applicable_states || 'Federal/All'}
Description: ${s.detailed_description || s.short_description}
Benefits: ${s.benefit_value} ${s.value_unit || ''}
Income Cap: Single: ${s.income_cap_single}, Couple: ${s.income_cap_couple}
Property Price Cap: ${s.property_price_cap}
Rules: ${s.eligibility_tag}
URL: ${s.official_url}
`;
    });
    contextStr += `---\n`;
  } else {
    contextStr += `### RELEVANT GOVERNMENT SCHEMES\nNo specific schemes found matching the query.\n`;
  }

  return contextStr;
}
