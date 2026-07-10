/**
 * Sample onboarding answers used as a fallback when the visitor has no saved
 * session (empty localStorage). This is USER profile data — not government
 * scheme data. All government scheme data now comes from Supabase via the APIs.
 */
export const DUMMY_USER = {
  firstName: 'Sarah',
  state: 'VIC',
  annualIncome: 85000,
  partnerIncome: 0,
  monthlyExpenses: 3200,
  depositAmount: 65000,
  targetPropertyPrice: 650000,
  propertyType: 'house' as const,
  firstHomeBuyer: true,
  employmentType: 'fulltime' as const,
  creditCardLimit: 5000,
  hecsDebt: true,
  otherLoanRepayments: 0,
}
