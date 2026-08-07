import type { Metadata } from 'next'
import { LegalPageLayout } from '@/components/legal/LegalPageLayout'
import { LegalSection } from '@/components/legal/LegalSection'

export const metadata: Metadata = {
  title: 'Privacy Policy | FirstHomeBuyers',
  description: 'Learn how FirstHomeBuyers collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="August 2026">

      <LegalSection title="1. Introduction">
        <p>
          FirstHomeBuyers ("we", "us", or "our") respects your privacy and is committed to protecting your personal information.
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website
          and use our services.
        </p>
        <p>
          We adhere to the Australian Privacy Principles (APPs) contained in the Privacy Act 1988 (Cth) (Privacy Act), which
          govern the way in which we collect, use, disclose, store, secure, and dispose of your Personal Information.
        </p>
      </LegalSection>

      <LegalSection title="2. Information We Collect">
        <p>
          We only collect personal information that is reasonably necessary for us to provide you with our services. The types
          of information we may collect include:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li><strong>Personal Details:</strong> Such as your first name, email address, and phone number (if you choose to provide them).</li>
          <li><strong>Financial & Property Data:</strong> Information you input into our calculators, such as estimated property purchase price, deposit amount, state of residence, and citizenship status, to determine grant eligibility.</li>
          <li><strong>Usage Data:</strong> Information automatically collected when you visit our site, including your IP address, browser type, operating system, and interaction with our platform.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. How We Use Your Information">
        <p>
          We use the information we collect for various purposes, including to:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>Provide, operate, and maintain our platform and calculators;</li>
          <li>Assess your potential eligibility for Australian first home buyer grants and schemes;</li>
          <li>Improve, personalize, and expand our website features;</li>
          <li>Understand and analyze how you use our website;</li>
          <li>Communicate with you, either directly or through our partners, including for customer service and updates;</li>
          <li>Prevent fraud and ensure the security of our platform.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Cookies and Tracking Technologies">
        <p>
          We use cookies and similar tracking technologies to track activity on our platform and hold certain information.
          Cookies are files with a small amount of data which may include an anonymous unique identifier.
        </p>
        <p>
          You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. For more detailed
          information on how we use cookies, please refer to our <a href="/cookies" className="text-foreground font-medium underline hover:text-primary-hover transition-colors">Cookie Policy</a>.
        </p>
      </LegalSection>

      <LegalSection title="5. Disclosure of Personal Information">
        <p>
          We will not sell, rent, or lease your personal information to third parties. We may disclose your personal information
          in the following circumstances:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li><strong>Service Providers:</strong> We may share your data with third-party vendors, service providers, or contractors who perform services on our behalf (e.g., hosting, analytics).</li>
          <li><strong>Legal Obligations:</strong> We may disclose your information where required to do so by law or subpoena or if we believe that such action is necessary to comply with the law.</li>
          <li><strong>Business Transfers:</strong> If we are involved in a merger, acquisition, or asset sale, your personal information may be transferred.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Data Security and Storage">
        <p>
          The security of your personal information is important to us. We implement a variety of security measures to maintain
          the safety of your personal information when you enter, submit, or access your data.
        </p>
        <p>
          However, please remember that no method of transmission over the Internet, or method of electronic storage, is 100%
          secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee
          its absolute security.
        </p>
      </LegalSection>

      <LegalSection title="7. Your Rights (Access & Correction)">
        <p>
          Under the Privacy Act, you have the right to access the Personal Information we hold about you and to update and/or
          correct it, subject to certain exceptions. If you wish to access your Personal Information, please contact us in writing.
        </p>
        <p>
          FirstHomeBuyers will not charge any fee for your access request but may charge an administrative fee for providing a
          copy of your Personal Information. In order to protect your Personal Information, we may require identification from
          you before releasing the requested information.
        </p>
      </LegalSection>

      <LegalSection title="8. Changes to This Privacy Policy">
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy
          on this page and updating the "Last Updated" date at the top of this Privacy Policy.
        </p>
        <p>
          You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective
          when they are posted on this page.
        </p>
      </LegalSection>

      {/* <LegalSection title="9. Privacy Complaints and Contact">
        <p>
          If you have any queries or complaints about our Privacy Policy, or if you believe we have breached the Australian 
          Privacy Principles, please contact us at:
        </p>
        <p className="mt-2 text-foreground font-medium">
          Email: <a href="mailto:hello@firstnest.com.au" className="hover:underline text-primary-hover transition-colors">hello@firstnest.com.au</a>
        </p>
      </LegalSection> */}

    </LegalPageLayout>
  )
}
