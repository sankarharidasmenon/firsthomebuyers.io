export interface Grant {
  id: string
  name: string
  description: string
  value: number | string
  stateValues?: Record<string, number>
  eligibilityRules: string[]
  category: 'grant' | 'concession' | 'federal'
  officialUrl: string
}

export const GRANTS_DUMMY: Grant[] = [
  {
    id: 'fhog',
    name: 'First Home Owner Grant (FHOG)',
    description: 'One-off cash payment for first home buyers of new or substantially renovated homes.',
    value: 10000,
    stateValues: {
      NSW: 10000, VIC: 10000, QLD: 30000, SA: 15000,
      WA: 10000, TAS: 20000, ACT: 0, NT: 10000,
    },
    eligibilityRules: ['firstHomeBuyer', 'newOrSubstantiallyRenovated', 'ownerOccupier'],
    category: 'grant',
    officialUrl: 'https://www.revenue.nsw.gov.au/grants-schemes/first-home-buyer',
  },
  {
    id: 'stamp-duty-concession',
    name: 'Stamp Duty Concession',
    description: 'Reduced or waived stamp duty for eligible first home buyers.',
    value: 'calculated',
    eligibilityRules: ['firstHomeBuyer', 'withinThreshold'],
    category: 'concession',
    officialUrl: 'https://www.sro.vic.gov.au/first-home-buyer',
  },
  {
    id: 'fhss',
    name: 'First Home Super Saver (FHSS)',
    description: 'Withdraw voluntary super contributions (up to $50,000) to use as a home deposit.',
    value: 50000,
    eligibilityRules: ['firstHomeBuyer'],
    category: 'federal',
    officialUrl: 'https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/withdrawing-and-using-your-super/first-home-super-saver-scheme',
  },
  {
    id: 'fhbg',
    name: 'First Home Guarantee (FHBG)',
    description: 'Buy with just 5% deposit and no Lenders Mortgage Insurance — government guarantees the rest.',
    value: 'LMI waived',
    eligibilityRules: ['firstHomeBuyer', 'incomeUnderCap'],
    category: 'federal',
    officialUrl: 'https://www.nhfic.gov.au/what-we-do/support-to-buy',
  },
  {
    id: 'shared-equity',
    name: 'Help to Buy (Shared Equity)',
    description: 'Government co-buys up to 40% of your home — you own more over time.',
    value: 'Up to 40% co-contribution',
    eligibilityRules: ['firstHomeBuyer', 'incomeUnderCap'],
    category: 'federal',
    officialUrl: 'https://www.nhfic.gov.au',
  },
]

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

export const DUMMY_RESULTS = {
  borrowing: { min: 480000, max: 535000 },
  recommendedRange: { min: 545000, max: 600000 },
  grantsTotal: 22870,
  eligibleGrants: ['fhog', 'fhss', 'fhbg'],
}
