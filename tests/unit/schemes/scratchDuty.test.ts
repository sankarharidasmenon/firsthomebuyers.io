import { describe, it, expect } from 'vitest'
import { firstHomeDuty, standardDuty } from '@/lib/schemes/stampDuty'

describe('Scenario Check', () => {
  it('VIC Land+Build: 450k land, 749k total', () => {
    const outcome = firstHomeDuty({ state: 'VIC', propertyPrice: 749000, propertyCategory: 'land', landPrice: 450000 })
    console.log('VIC Land+Build Outcome:', JSON.stringify(outcome, null, 2))
    console.log('Standard Duty on 450k:', standardDuty('VIC', 450000))
    console.log('Standard Duty on 749k:', standardDuty('VIC', 749000))
  })
})
