import type { Metadata } from 'next'
import { LegalPageLayout } from '@/components/legal/LegalPageLayout'
import { LegalSection } from '@/components/legal/LegalSection'

export const metadata: Metadata = {
  title: 'Disclaimer | FirstHomeBuyers',
  description: 'Important legal disclaimers regarding the financial and property information provided on FirstHomeBuyers.',
}

export default function DisclaimerPage() {
  return (
    <LegalPageLayout title="Disclaimer" lastUpdated="August 2026">

      <LegalSection title="1. General Information Only">
        <p>
          The information, calculators, and tools provided on the FirstHomeBuyers website ("the Platform") are for educational
          and general informational purposes only. They do not constitute financial, legal, taxation, or professional advice.
        </p>
        <p>
          Before making any financial or property purchasing decisions, you should obtain independent professional advice tailored
          to your specific personal objectives, financial situation, and needs from a licensed financial adviser, mortgage broker,
          or legal practitioner.
        </p>
      </LegalSection>

      <LegalSection title="2. Financial Advice Disclaimer">
        <p>
          FirstHomeBuyers is not a bank, lender, or licensed financial adviser. We do not provide credit assistance or recommend
          specific financial products.
        </p>
        <p>
          Any borrowing capacities, estimated repayments, or financial metrics calculated on our Platform are indicative estimates
          based on the limited data you provide and generalized assumptions. Actual lending criteria, interest rates, and loan
          terms vary significantly between lenders and are subject to change. A successful calculation on our Platform does not
          guarantee that a lender will approve a loan application.
        </p>
      </LegalSection>

      <LegalSection title="3. Government Schemes and Grants">
        <p>
          FirstHomeBuyers aggregates information regarding Australian federal and state government grants, schemes, and concessions
          (e.g., First Home Owner Grant, First Home Guarantee, stamp duty concessions).
        </p>
        <p>
          While we make every effort to ensure our information is accurate and up to date, government policies, eligibility
          criteria, property price caps, and funding availability can change rapidly and without notice.
        </p>
        <p>
          We make no warranties or representations regarding your actual eligibility for any grant or scheme. Final assessment
          of eligibility is always determined by the relevant State Revenue Office (SRO), federal government body, or participating lender.
        </p>
      </LegalSection>

      <LegalSection title="4. Property Information Accuracy">
        <p>
          Any property market data, median prices, or suburb profiles provided on the Platform are derived from third-party sources
          and historical data. The real estate market is subject to fluctuation, and past performance is not a reliable indicator
          of future property values.
        </p>
        <p>
          We do not guarantee the accuracy, completeness, or reliability of any property market data displayed on our Platform.
        </p>
      </LegalSection>

      <LegalSection title="5. Third-Party Links">
        <p>
          Our Platform includes links to external third-party websites, including official government portals and potential service
          providers. We do not endorse, guarantee, or assume responsibility for the accuracy or reliability of any information
          offered by third-party websites linked through our Platform.
        </p>
      </LegalSection>

      <LegalSection title="6. Limitation of Liability">
        <p>
          To the maximum extent permitted by Australian law, FirstHomeBuyers disclaims all liability for any loss, damage, cost,
          or expense (whether direct or indirect) incurred by you as a result of your use of the Platform, your reliance on any
          information contained on or accessed through the Platform, or any error, omission, or misrepresentation in that information.
        </p>
      </LegalSection>

      {/* <LegalSection title="7. Contact">
        <p>
          If you have any questions regarding this Disclaimer, please contact us at:
        </p>
        <p className="mt-2 text-foreground font-medium">
          Email: <a href="mailto:hello@firstnest.com.au" className="hover:underline text-primary-hover transition-colors">hello@firstnest.com.au</a>
        </p>
      </LegalSection> */}

    </LegalPageLayout>
  )
}
