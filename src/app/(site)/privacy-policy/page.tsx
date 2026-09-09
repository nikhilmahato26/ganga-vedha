import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalContact,
  LegalList,
  LegalPage,
  LegalSection,
} from "@/components/site/legal";
import { getSiteSettings } from "@/lib/content";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What personal information Ganga Vedha collects when you enquire or book, why we collect it, who we share it with, and how to have it removed.",
  alternates: { canonical: "/privacy-policy" },
};

/** See the note in the refund policy — a fixed string, updated by hand. */
const UPDATED = "9 September 2026";

export default async function PrivacyPolicyPage() {
  const settings = await getSiteSettings();
  const brand = settings.brandName;

  return (
    <LegalPage
      title="Privacy Policy"
      intro={`${brand} is committed to preserving your privacy and safeguarding any information you submit to us. This page describes what we collect, why we collect it, and what we will and will not do with it.`}
      updated={UPDATED}
      sections={[
        { id: "collecting", label: "Collecting personal information" },
        { id: "what-we-collect", label: "What we collect" },
        { id: "how-we-use", label: "How we use it" },
        { id: "third-parties", label: "Disclosure to third parties" },
        { id: "cookies", label: "Use of cookies" },
        { id: "retention", label: "Retention and security" },
        { id: "your-rights", label: "Your rights" },
        { id: "children", label: "Children" },
        { id: "changes", label: "Changes to this policy" },
        { id: "contact-us", label: "Contact us" },
      ]}
    >
      <LegalSection id="collecting" title="On Collecting Personal Information">
        <p>
          {brand} recognises and values the privacy of the individuals with whom we do
          business. In order to run an adventure and travel operation — to hold a raft
          slot, a jump slot or a room in your name — the collection of some personal
          information is necessary. Our goal is to balance that necessity against your
          right to prevent the misuse of your personal information.
        </p>
        <p>
          In certain circumstances {brand} may request personal information from you, such
          as your name, email address, telephone number, travel dates or group size. Your
          response to these requests is strictly voluntary. In general you can browse this
          website without giving us any personal information at all; only the enquiry,
          booking and contact forms ask for it, and those pages will not work without it.
        </p>
      </LegalSection>

      <LegalSection id="what-we-collect" title="What We Collect">
        <p>
          &ldquo;Personal information&rdquo; is any data that identifies you. On this
          website that is limited to:
        </p>
        <LegalList
          items={[
            "Information you type into an enquiry, booking or contact form — your name, phone number, email address, and the message, dates and group details you choose to include.",
            "The activity, stay, package or rental the enquiry was made from, so we know what you are asking about.",
            "Details required by law or by an activity operator at the time of the activity — such as age, weight, and a government photo ID at the site — collected in person, not through this website.",
            "Anonymous, aggregated usage information: how many people visited, which pages were viewed, and roughly how long was spent on them. This is not tied to your identity and is used only to improve the site.",
          ]}
        />
        <p>
          We do not collect or store your card, UPI or bank details on this website. Where
          a payment is taken, it is handled by the payment provider or in person.
        </p>
      </LegalSection>

      <LegalSection id="how-we-use" title="How We Use Personal Information">
        <p>
          As a general practice no personal information is collected about a visitor to
          this website apart from the information the visitor submits themselves. We use
          that information for the purpose for which you shared it with us — to answer
          your enquiry, to confirm and run your booking, and to reach you if a river
          closure, weather call or schedule change affects your trip.
        </p>
        <p>
          We may also use it to tell you about services and offers that are relevant to
          the trip you asked about. If you would rather not hear from us in that way, say
          so in any message and we will stop.
        </p>
        <p>
          We wish to assert that any personal information you share with us through this
          website is treated as confidential and is never sold to any third party.
        </p>
      </LegalSection>

      <LegalSection id="third-parties" title="Disclosure to Third Parties">
        <p>
          {brand} does not share your information with any third party except the partners
          needed to deliver the booking you made — the hotel or camp you are staying at,
          the bungee or activity operator running your slot, and the transport or rental
          provider. They receive only what they need: usually a name, a phone number, a
          date and a group size.
        </p>
        <p>
          We may also disclose information where we are required to do so by law, by a
          court, or by a competent authority, or where it is necessary to protect the
          safety of a guest or of our staff.
        </p>
        <p>
          If you receive unwanted marketing material from one of our partners, please tell
          them you wish to be removed from their contact list, and tell us as well.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="Use of Cookies">
        <p>
          Some pages on this site use cookies — small files the site places on your device
          for identification purposes. We use them to keep the site working correctly
          across pages and, where you have logged in to the administrator area, to keep
          that session signed in. Cookies cannot read data off your device.
        </p>
        <p>
          Your web browser may allow you to be notified when you are receiving a cookie,
          giving you the choice to accept it or not. If you do not accept cookies, some
          pages may not fully function and you may not be able to use every part of this
          site.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="Retention and Security">
        <p>
          Enquiry and booking records are kept for as long as we need them to run the
          trip, to answer a later question about it, and to meet our tax and legal
          obligations. After that they are deleted.
        </p>
        <p>
          Access to those records is restricted to the people at {brand} who need them to
          do their work, and the administrator area of this website is password
          protected. No transmission over the internet can be guaranteed completely
          secure, but we take reasonable steps to protect what you send us.
        </p>
      </LegalSection>

      <LegalSection id="your-rights" title="Your Rights">
        <p>You may, at any time, ask us to:</p>
        <LegalList
          items={[
            "Tell you what personal information about you we hold.",
            "Correct anything that is wrong or out of date.",
            "Delete your information, where we are not required to keep it.",
            "Stop sending you offers and updates.",
          ]}
        />
        <p>
          Write to us using the details below, or through{" "}
          <Link href="/contact" className="text-jade-700 no-underline hover:underline">
            our contact page
          </Link>
          . We will respond within a reasonable period.
        </p>
      </LegalSection>

      <LegalSection id="children" title="Children">
        <p>
          This website is not directed at children, and we do not knowingly collect
          personal information from a child through it. Bookings for minors are made by a
          parent or guardian, who provides the details and gives consent at the time of
          the activity. Minimum age limits are stated on every activity page.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="Changes to This Policy">
        <p>
          {brand} reserves the right to change, modify or update this statement at any
          time, including in response to changes in privacy legislation. The date at the
          top of this page shows when it was last revised. Please check back from time to
          time.
        </p>
        <p>
          {brand} works hard to ensure that your experience with us — on the website and
          on the river — is a good one. We welcome your questions and suggestions about
          this policy.
        </p>
      </LegalSection>

      <LegalSection id="contact-us" title="Contact Us">
        <p>
          If you have any questions about this privacy statement, the practices of this
          website, or your dealings with this website, you can contact us:
        </p>
        <LegalContact
          brandName={brand}
          address={settings.address}
          phone={settings.phone}
          email={settings.email}
        />
      </LegalSection>
    </LegalPage>
  );
}
