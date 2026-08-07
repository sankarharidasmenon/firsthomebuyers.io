import type { Metadata } from 'next'
import { LegalPageLayout } from '@/components/legal/LegalPageLayout'
import { LegalSection } from '@/components/legal/LegalSection'

export const metadata: Metadata = {
  title: 'Terms & Conditions | FirstHomeBuyers',
  description: 'Terms and conditions for using FirstHomeBuyers, Australia\'s smartest first home buyer tool.',
}

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms & Conditions" lastUpdated="August 2026">

      <LegalSection title="1. Acceptance of Terms">
        <p>
          By accessing or using the FirstHomeBuyers website ("the Platform"), you agree to be bound by these Terms and Conditions ("Terms").
          If you do not agree with any part of these Terms, you must not use our services.
        </p>
        <p>
          These Terms apply to all visitors, users, and others who access or use the Platform. We reserve the right to modify these Terms
          at any time, and such modifications shall be effective immediately upon posting.
        </p>
      </LegalSection>

      <LegalSection title="2. Website Usage & Purpose">
        <p>
          FirstHomeBuyers provides tools and information to assist Australian first home buyers in understanding potential
          government grants, schemes, and borrowing capacity.
        </p>
        <p>
          You agree to use the Platform only for lawful purposes and in a way that does not infringe the rights of, restrict,
          or inhibit anyone else's use and enjoyment of the Platform. You must not use the Platform to transmit any unsolicited
          commercial communications or engage in data scraping, mining, or extraction without our prior written consent.
        </p>
      </LegalSection>

      <LegalSection title="3. Property Information & Tools">
        <p>
          All information, calculators, and tools provided on FirstHomeBuyers (including grant calculators and borrowing power estimates)
          are intended as general guides only. They do not take into account your personal financial situation, objectives, or needs.
        </p>
        <p>
          While we strive to keep our information regarding Australian federal and state government grants accurate and up to date,
          policies frequently change. We do not guarantee the accuracy, completeness, or timeliness of any information provided.
          You should always verify grant eligibility and values directly with the relevant State Revenue Office (SRO) or federal authority.
        </p>
      </LegalSection>

      <LegalSection title="4. Third-Party Services & Links">
        <p>
          Our Platform may contain links to third-party websites or services that are not owned or controlled by FirstHomeBuyers.
          This includes official government websites (such as firsthomebuyers.gov.au or state revenue offices) and potential partner services.
        </p>
        <p>
          FirstHomeBuyers has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any
          third-party websites or services. You acknowledge and agree that FirstHomeBuyers shall not be responsible or liable,
          directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with your use of such content or services.
        </p>
      </LegalSection>

      <LegalSection title="5. Intellectual Property">
        <p>
          The Platform and its original content, features, and functionality are and will remain the exclusive property of
          FirstHomeBuyers and its licensors. The Platform is protected by copyright, trademark, and other laws of Australia
          and foreign countries.
        </p>
        <p>
          Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of FirstHomeBuyers.
        </p>
      </LegalSection>

      <LegalSection title="6. Limitation of Liability">
        <p>
          To the maximum extent permitted by applicable law, in no event shall FirstHomeBuyers, nor its directors, employees,
          partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages.
        </p>
        <p>
          This includes, without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>Your access to or use of or inability to access or use the Platform;</li>
          <li>Any conduct or content of any third party on the Platform;</li>
          <li>Any reliance on the accuracy of grant calculators or borrowing estimates;</li>
          <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Indemnity">
        <p>
          You agree to defend, indemnify, and hold harmless FirstHomeBuyers and its licensee and licensors, and their employees,
          contractors, agents, officers, and directors, from and against any and all claims, damages, obligations, losses, liabilities,
          costs or debt, and expenses (including but not limited to attorney's fees), resulting from or arising out of your use and
          access of the Platform, or a breach of these Terms.
        </p>
      </LegalSection>

      <LegalSection title="8. Governing Law">
        <p>
          These Terms shall be governed and construed in accordance with the laws of New South Wales, Australia, without regard to its
          conflict of law provisions.
        </p>
        <p>
          Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision
          of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
        </p>
      </LegalSection>

      {/* <LegalSection title="9. Contact Information">
        <p>
          If you have any questions about these Terms, please contact us at:
        </p>
        <p className="mt-2 text-foreground font-medium">
          Email: <a href="mailto:hello@firstnest.com.au" className="hover:underline text-primary-hover transition-colors">hello@firstnest.com.au</a>
        </p>
      </LegalSection> */}

    </LegalPageLayout>
  )
}
