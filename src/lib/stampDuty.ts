export interface StampDutyResult {
  standardDuty: number
  concessionDuty: number
  saving: number
  isEligible: boolean
  isPartialConcession: boolean
  threshold: number
  upperThreshold: number | null
  message: string
}

interface StateConfig {
  threshold: number
  upperThreshold: number | null
  calculate: (price: number) => number
  concessionCalc: (price: number) => number
}

const STATE_CONFIGS: Record<string, StateConfig> = {
  NSW: {
    threshold: 650000,
    upperThreshold: 800000,
    calculate: (price: number) => {
      if (price <= 14000) return price * 0.0125
      if (price <= 32000) return 175 + (price - 14000) * 0.015
      if (price <= 85000) return 445 + (price - 32000) * 0.0175
      if (price <= 319000) return 1372 + (price - 85000) * 0.035
      if (price <= 1064000) return 9547 + (price - 319000) * 0.045
      return 43132 + (price - 1064000) * 0.055
    },
    concessionCalc: (price: number) => {
      if (price <= 650000) return 0
      if (price >= 800000) return -1 // full duty
      // Linear interpolation: $0 at $650k → full duty at $800k
      const fullDuty = STATE_CONFIGS.NSW.calculate(price)
      const proportion = (price - 650000) / 150000
      return fullDuty * proportion
    },
  },
  VIC: {
    threshold: 600000,
    upperThreshold: 750000,
    calculate: (price: number) => {
      if (price <= 25000) return price * 0.014
      if (price <= 130000) return 350 + (price - 25000) * 0.024
      if (price <= 960000) return 2870 + (price - 130000) * 0.06
      return 52670 + (price - 960000) * 0.055
    },
    concessionCalc: (price: number) => {
      if (price <= 600000) {
        // 50% concession for FHB on established homes
        return STATE_CONFIGS.VIC.calculate(price) * 0.5
      }
      if (price >= 750000) return -1
      const fullDuty = STATE_CONFIGS.VIC.calculate(price)
      const proportion = (price - 600000) / 150000
      return fullDuty * (0.5 + proportion * 0.5)
    },
  },
  QLD: {
    threshold: 500000,
    upperThreshold: 550000,
    calculate: (price: number) => {
      if (price <= 5000) return 0
      if (price <= 75000) return (price - 5000) * 0.015
      if (price <= 540000) return 1050 + (price - 75000) * 0.035
      if (price <= 1000000) return 17325 + (price - 540000) * 0.045
      return 38025 + (price - 1000000) * 0.0575
    },
    concessionCalc: (price: number) => {
      if (price <= 500000) return 0
      if (price >= 550000) return -1
      const fullDuty = STATE_CONFIGS.QLD.calculate(price)
      const proportion = (price - 500000) / 50000
      return fullDuty * proportion
    },
  },
  SA: {
    threshold: 650000,
    upperThreshold: null,
    calculate: (price: number) => {
      if (price <= 12000) return price * 0.01
      if (price <= 30000) return 120 + (price - 12000) * 0.02
      if (price <= 50000) return 480 + (price - 30000) * 0.03
      if (price <= 100000) return 1080 + (price - 50000) * 0.035
      if (price <= 200000) return 2830 + (price - 100000) * 0.04
      if (price <= 250000) return 6830 + (price - 200000) * 0.0425
      if (price <= 300000) return 8955 + (price - 250000) * 0.05
      if (price <= 500000) return 11455 + (price - 300000) * 0.055
      return 22455 + (price - 500000) * 0.055
    },
    concessionCalc: (price: number) => {
      if (price <= 650000) return 0
      return -1
    },
  },
  WA: {
    threshold: 430000,
    upperThreshold: null,
    calculate: (price: number) => {
      if (price <= 120000) return price * 0.019
      if (price <= 150000) return 2280 + (price - 120000) * 0.0285
      if (price <= 360000) return 3135 + (price - 150000) * 0.038
      if (price <= 725000) return 11115 + (price - 360000) * 0.0475
      return 28453 + (price - 725000) * 0.0515
    },
    concessionCalc: (price: number) => {
      if (price <= 430000) return 0
      return -1
    },
  },
  TAS: {
    threshold: 500000,
    upperThreshold: null,
    calculate: (price: number) => {
      if (price <= 3000) return 50
      if (price <= 25000) return 50 + (price - 3000) * 0.0175
      if (price <= 75000) return 435 + (price - 25000) * 0.025
      if (price <= 200000) return 1685 + (price - 75000) * 0.035
      if (price <= 375000) return 6060 + (price - 200000) * 0.04
      if (price <= 725000) return 13060 + (price - 375000) * 0.0425
      return 27935 + (price - 725000) * 0.045
    },
    concessionCalc: (price: number) => {
      if (price <= 500000) return STATE_CONFIGS.TAS.calculate(price) * 0.5
      return -1
    },
  },
  ACT: {
    threshold: 500000,
    upperThreshold: 750000,
    calculate: (price: number) => {
      if (price <= 200000) return price * 0.006
      if (price <= 300000) return 1200 + (price - 200000) * 0.023
      if (price <= 500000) return 3500 + (price - 300000) * 0.028
      if (price <= 750000) return 9100 + (price - 500000) * 0.038
      if (price <= 1000000) return 18600 + (price - 750000) * 0.049
      if (price <= 1455000) return 30850 + (price - 1000000) * 0.057
      return 56785 + (price - 1455000) * 0.07
    },
    concessionCalc: (price: number) => {
      // ACT has a land tax concession scheme (different)
      if (price <= 500000) return STATE_CONFIGS.ACT.calculate(price) * 0.5
      return -1
    },
  },
  NT: {
    threshold: 500000,
    upperThreshold: null,
    calculate: (price: number) => {
      const v = price / 1000
      if (price <= 525000) return (0.06571441 * v * v + 15 * v - 1) * 1
      return (price - 525000) * 0.0495 + 23929
    },
    concessionCalc: (price: number) => {
      if (price <= 500000) return 0
      return -1
    },
  },
}

export function calculateStampDuty(
  price: number,
  state: string,
  isFirstHomeBuyer: boolean
): StampDutyResult {
  const config = STATE_CONFIGS[state] ?? STATE_CONFIGS.VIC
  const standardDuty = Math.round(config.calculate(price))

  if (!isFirstHomeBuyer) {
    return {
      standardDuty,
      concessionDuty: standardDuty,
      saving: 0,
      isEligible: false,
      isPartialConcession: false,
      threshold: config.threshold,
      upperThreshold: config.upperThreshold,
      message: 'Standard stamp duty applies.',
    }
  }

  const concessionResult = config.concessionCalc(price)

  if (concessionResult === -1) {
    return {
      standardDuty,
      concessionDuty: standardDuty,
      saving: 0,
      isEligible: false,
      isPartialConcession: false,
      threshold: config.threshold,
      upperThreshold: config.upperThreshold,
      message: `Your property price exceeds the ${state} concession threshold of $${config.threshold.toLocaleString()}.`,
    }
  }

  const concessionDuty = Math.round(concessionResult)
  const saving = standardDuty - concessionDuty
  const isPartialConcession = config.upperThreshold !== null &&
    price > config.threshold && price <= config.upperThreshold

  return {
    standardDuty,
    concessionDuty,
    saving,
    isEligible: true,
    isPartialConcession,
    threshold: config.threshold,
    upperThreshold: config.upperThreshold,
    message: isPartialConcession
      ? `Partial concession applies — property price is between $${config.threshold.toLocaleString()} and $${config.upperThreshold?.toLocaleString()}.`
      : `Full first home buyer concession applies in ${state}.`,
  }
}
