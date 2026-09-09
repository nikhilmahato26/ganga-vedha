import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalContact,
  LegalDefinitions,
  LegalList,
  LegalPage,
  LegalSection,
} from "@/components/site/legal";
import { getSiteSettings } from "@/lib/content";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Return and Refund Policy",
  description:
    "How cancellations and refunds work on Ganga Vedha bookings — the notice periods, what is refundable, what is not, and how long a refund takes to reach you.",
  alternates: { canonical: "/refund-policy" },
};

/**
 * Kept as a date string rather than a `Date` so it renders identically on the
 * server and the client — a policy page must not shift with a timezone.
 * Update this by hand whenever the wording below changes.
 */
const UPDATED = "9 September 2026";

export default async function RefundPolicyPage() {
  const settings = await getSiteSettings();
  const brand = settings.brandName;

  return (
    <LegalPage
      title="Return and Refund Policy"
      intro={`Thank you for booking with ${brand}. If for any reason you are not able to travel, or you are not satisfied with a booking you have made with us, this page sets out exactly how cancellations and refunds work.`}
      updated={UPDATED}
      sections={[
        { id: "interpretation", label: "Interpretation" },
        { id: "definitions", label: "Definitions" },
        { id: "cancellation", label: "Your cancellation rights" },
        { id: "refund-schedule", label: "Refund schedule" },
        { id: "conditions", label: "Conditions for a refund" },
        { id: "non-refundable", label: "What cannot be refunded" },
        { id: "closures", label: "Cancellations by us" },
        { id: "how-to-cancel", label: "How to cancel" },
        { id: "gift-bookings", label: "Gift bookings" },
        { id: "contact-us", label: "Contact us" },
      ]}
    >
      <LegalSection id="interpretation" title="Interpretation">
        <p>
          The words of which the initial letter is capitalised have meanings defined
          under the following conditions. The following definitions shall have the same
          meaning regardless of whether they appear in singular or in plural.
        </p>
      </LegalSection>

      <LegalSection id="definitions" title="Definitions">
        <p>For the purposes of this Return and Refund Policy:</p>
        <LegalDefinitions
          items={[
            {
              term: "Company",
              body: (
                <>
                  (referred to as either &ldquo;the Company&rdquo;, &ldquo;We&rdquo;,
                  &ldquo;Us&rdquo; or &ldquo;Our&rdquo; in this Agreement) refers to{" "}
                  {brand}, {settings.address}.
                </>
              ),
            },
            {
              term: "Services",
              body: "means the river rafting trips, bungee jumps and other adventure activities, hotel and camp stays, holiday packages, and car and bike rentals offered for booking through the Service.",
            },
            {
              term: "Booking",
              body: "means a confirmed reservation of a Service made by You with Us for a stated date, group size and price.",
            },
            {
              term: "Order",
              body: "means a request by You to book a Service from Us.",
            },
            {
              term: "Service",
              body: "refers to the Website.",
            },
            {
              term: "Website",
              body: (
                <>
                  refers to {brand}, accessible from{" "}
                  <a
                    href="https://www.gangaveda.in/"
                    className="text-jade-700 no-underline hover:underline"
                  >
                    https://www.gangaveda.in/
                  </a>
                  .
                </>
              ),
            },
            {
              term: "You",
              body: "means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.",
            },
          ]}
        />
      </LegalSection>

      <LegalSection id="cancellation" title="Your Booking Cancellation Rights">
        <p>
          You are entitled to cancel Your Booking without giving any reason for doing so.
          Because the Services We sell are dated — a raft leaves the put-in point at a
          fixed time, a room is held for a fixed night — the amount refunded depends on
          how much notice You give Us before the activity or check-in date.
        </p>
        <p>
          In order to exercise Your right of cancellation, You must inform Us of Your
          decision by means of a clear statement. You can inform us of Your decision by
          visiting{" "}
          <Link href="/contact" className="text-jade-700 no-underline hover:underline">
            our contact page
          </Link>
          , by WhatsApp, or by email, quoting the name, date and booking reference.
        </p>
      </LegalSection>

      <LegalSection id="refund-schedule" title="Refund Schedule">
        <p>
          Unless the terms stated on a specific package page say otherwise, the following
          applies to the amount You have paid Us:
        </p>
        <LegalList
          items={[
            <>
              <strong className="font-semibold text-ink">
                7 days or more before the activity or check-in date
              </strong>{" "}
              — full refund of the amount paid.
            </>,
            <>
              <strong className="font-semibold text-ink">3 to 6 days before</strong> — 50%
              of the amount paid is refunded; the balance is retained against slots,
              rooms and guides already committed on Your behalf.
            </>,
            <>
              <strong className="font-semibold text-ink">
                Less than 48 hours before, or no-show
              </strong>{" "}
              — no refund. You may ask us to move the booking to another date instead,
              subject to availability.
            </>,
          ]}
        />
        <p>
          We will reimburse You no later than 14 days from the day on which We accept Your
          cancellation. We will use the same means of payment as You used for the Booking,
          and You will not incur any fees for such reimbursement. Bank and payment-gateway
          settlement times are outside our control and may add a few working days.
        </p>
      </LegalSection>

      <LegalSection id="conditions" title="Conditions for a Refund">
        <p>In order for a Booking to be eligible for a refund, please make sure that:</p>
        <LegalList
          items={[
            "The cancellation is made within the notice period set out above.",
            "The cancellation reaches Us in writing — WhatsApp, email or the contact form — and not only by a verbal message at the site.",
            "The booking reference and the name the booking was made under are quoted.",
            "The refund is claimed to the same account or payment method the booking was paid from.",
          ]}
        />
        <p>
          We reserve the right to refuse a refund on any booking that does not meet the
          above conditions, in our sole discretion.
        </p>
        <p>
          Only regular-priced Bookings may be refunded. Bookings made at a promotional or
          discounted rate, and any advance paid against a peak-season or festival date,
          may be non-refundable where the offer says so on the page You booked from. This
          exclusion may not apply to You if it is not permitted by applicable law.
        </p>
      </LegalSection>

      <LegalSection id="non-refundable" title="What Cannot Be Refunded">
        <p>The following are not refundable:</p>
        <LegalList
          items={[
            "Services already used, in part or in full — including a rafting stretch started and not finished, or a jump abandoned on the platform after the weigh-in and briefing.",
            "A booking cancelled because You did not meet a stated age, weight, health or documentation requirement. These limits are printed on every activity page before You book, and the crew cannot waive them.",
            "A booking where You or a member of Your group is refused participation for being under the influence of alcohol or any intoxicant, or for refusing the safety briefing or safety equipment.",
            "Third-party charges We pass through unchanged — permit fees, forest entry fees, and non-refundable hotel or transport bookings made to Your specification.",
            "Bespoke itineraries built to Your specification and confirmed with suppliers on Your behalf, to the extent those suppliers do not refund Us.",
            "Any amount stated as a non-refundable booking or reservation fee at the time You booked.",
          ]}
        />
      </LegalSection>

      <LegalSection id="closures" title="Cancellations and Closures by Us">
        <p>
          Rafting, bungee and other river and mountain activities depend on water level,
          weather, and district administration orders. If We cancel a confirmed activity —
          because of high water, rain, an official closure, or any safety reason — You may
          choose either a full refund of the amount paid for the cancelled activity, or a
          rescheduled date at no extra cost. Nothing is retained in that case.
        </p>
        <p>
          Where an activity is cut short after it has begun for a safety reason outside our
          control, a partial refund or a credit may be offered at our discretion, in
          proportion to what could not be delivered.
        </p>
        <p>
          We are not liable for costs You incur outside Your booking with Us — travel to
          Rishikesh, other accommodation, or missed connections — arising from a
          cancellation of this kind. We recommend travel insurance.
        </p>
      </LegalSection>

      <LegalSection id="how-to-cancel" title="How to Cancel a Booking">
        <p>
          Send Us a clear written statement that You wish to cancel, with the booking
          reference, the lead guest&rsquo;s name, and the activity or check-in date. You
          can reach Us:
        </p>
        <LegalList
          items={[
            <>
              By visiting this page on our website:{" "}
              <Link
                href="/contact"
                className="text-jade-700 no-underline hover:underline"
              >
                gangaveda.in/contact
              </Link>
            </>,
            settings.email ? (
              <>
                By email:{" "}
                <a
                  href={`mailto:${settings.email}`}
                  className="text-jade-700 no-underline hover:underline"
                >
                  {settings.email}
                </a>
              </>
            ) : (
              "By email, using the address on our contact page"
            ),
            settings.whatsappNumber ? (
              <>By WhatsApp: +91 {settings.whatsappNumber}</>
            ) : (
              "By WhatsApp, using the number on our contact page"
            ),
          ]}
        />
        <p>
          We will confirm receipt of Your cancellation in writing. Treat a cancellation as
          made only once You have that confirmation from Us.
        </p>
      </LegalSection>

      <LegalSection id="gift-bookings" title="Gift Bookings">
        <p>
          If a Booking was paid for as a gift and issued in Your name, any refund due is
          made as a credit against a future booking with Us, valid for twelve months.
        </p>
        <p>
          If the booking was not marked as a gift, or the person who paid booked it in
          their own name to pass on to You later, We will send the refund to the person
          who paid.
        </p>
      </LegalSection>

      <LegalSection id="contact-us" title="Contact Us">
        <p>
          If You have any questions about our Returns and Refunds Policy, please contact
          us:
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
