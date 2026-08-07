import type { Metadata } from 'next'
import { LegalPageLayout } from '@/components/legal/LegalPageLayout'
import { LegalSection } from '@/components/legal/LegalSection'

export const metadata: Metadata = {
  title: 'Cookie Policy | FirstHomeBuyers',
  description: 'Learn about how FirstHomeBuyers uses cookies and tracking technologies to improve your experience.',
}

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout title="Cookie Policy" lastUpdated="August 2026">

      <LegalSection title="1. What Are Cookies?">
        <p>
          Cookies are small text files that are placed on your computer, smartphone, or other device when you visit our website.
          They are widely used to make websites work more efficiently, provide a better user experience, and supply analytical
          information to the website owners.
        </p>
        <p>
          This policy explains how FirstHomeBuyers ("we", "us", or "our") uses cookies and similar tracking technologies on our platform.
        </p>
      </LegalSection>

      <LegalSection title="2. Types of Cookies We Use">
        <p>
          We use several different types of cookies to run our Platform effectively:
        </p>
        <ul className="list-disc pl-6 space-y-4 mt-2">
          <li>
            <strong>Essential / Strictly Necessary Cookies:</strong> These cookies are crucial for the basic functionality of the website.
            They allow you to navigate our platform and use its features, such as saving your progress in our grant calculators.
            Without these cookies, certain services cannot be provided.
          </li>
          <li>
            <strong>Analytics & Performance Cookies:</strong> These cookies collect information about how visitors use our website,
            such as which pages are visited most often, and if they get error messages from web pages. These cookies don't collect
            information that identifies a visitor. All information these cookies collect is aggregated and therefore anonymous.
          </li>
          <li>
            <strong>Functional Cookies:</strong> These cookies allow the website to remember choices you make (such as your current region
            or your theme preferences) and provide enhanced, more personal features.
          </li>
          <li>
            <strong>Targeting / Advertising Cookies:</strong> We may use these cookies to deliver content and advertisements more
            relevant to you and your interests. They may be placed by us or by third-party advertising networks with our permission.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Third-Party Cookies">
        <p>
          In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the Platform
          and deliver advertisements. These third-party services include, but are not limited to, Google Analytics.
        </p>
        <p>
          These third parties may use cookies alone or in conjunction with web beacons or other tracking technologies to collect
          information about you when you use our website. We do not control these third parties' tracking technologies or how they may be used.
        </p>
      </LegalSection>

      <LegalSection title="4. Managing and Disabling Cookies">
        <p>
          You have the right to decide whether to accept or reject cookies. Most web browsers automatically accept cookies,
          but you can usually modify your browser setting to decline cookies if you prefer.
        </p>
        <p>
          If you choose to decline cookies, you may not be able to fully experience the interactive features of the FirstHomeBuyers
          services or other websites you visit. For example, your progress in the grant calculator may not be saved across sessions.
        </p>
        <p>
          To find out more about cookies, including how to see what cookies have been set and how to manage and delete them,
          visit <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-foreground font-medium underline hover:text-primary-hover transition-colors">allaboutcookies.org</a>.
        </p>
      </LegalSection>

      <LegalSection title="5. Updates to This Policy">
        <p>
          We may update this Cookie Policy from time to time to reflect, for example, changes to the cookies we use or for other
          operational, legal, or regulatory reasons. Please revisit this Cookie Policy regularly to stay informed about our use
          of cookies and related technologies.
        </p>
      </LegalSection>

      {/* <LegalSection title="6. Contact Us">
        <p>
          If you have any questions about our use of cookies or other technologies, please email us at:
        </p>
        <p className="mt-2 text-foreground font-medium">
          Email: <a href="mailto:hello@firstnest.com.au" className="hover:underline text-primary-hover transition-colors">hello@firstnest.com.au</a>
        </p>
      </LegalSection> */}

    </LegalPageLayout>
  )
}
