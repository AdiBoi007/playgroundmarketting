import type { Metadata } from "next";
import Link from "next/link";
import { Arrow, Avatar, Mark } from "@/components/ui/Primitives";
import { PrintReport } from "@/components/PrintReport";
import { participants } from "@/lib/demo";
import "../report.css";

export const metadata: Metadata = {
  title: "Sample report — a clearer next move",
  description:
    "An example Playground report for an AI invoicing tool: what five example testers did, where they paused, and what to try next.",
  alternates: { canonical: "/sample-report" },
};

const people = participants.map((person, index) => ({
  ...person,
  index,
  finished: person.status === "Complete" || person.status === "Finished",
}));
const observations = [
  {
    id: "send-question",
    number: "01",
    label: "Daniel Ross · 02:05",
    title: "He wanted to check it first.",
    detail:
      "Daniel paused for 28 seconds when asked to allow automatic sending. There was no visible option to review the invoice first.",
    quote: "Will this send before I review it?",
    change: "change-review",
    changeLabel: "Why change 1 comes first",
  },
  {
    id: "access-question",
    number: "02",
    label: "Across the five example sessions",
    title: "The access request needed an explanation.",
    detail:
      "Three of the five example testers opened privacy information before granting access. That is a reason to make the explanation easier to find, then check whether it answers their questions.",
    quote: null,
    change: "change-access",
    changeLabel: "Why we suggest change 2",
  },
  {
    id: "draft-exit",
    number: "03",
    label: "Daniel Ross · 03:17",
    title: "He left the invoice in draft.",
    detail:
      "Daniel stopped before sending his first invoice. Two other example testers also stopped before finishing the task. The examples do not tell us that all three stopped for the same reason.",
    quote: "I’d rather do this manually for now.",
    change: "change-review",
    changeLabel: "A review step is worth testing",
  },
];

function SectionHeading({
  number,
  label,
  title,
  description,
}: {
  number: string;
  label: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="sample-report-section-heading">
      <div className="sample-report-kicker">
        <span>{number}</span>
        {label}
      </div>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

function InvoiceConcept({ review }: { review: boolean }) {
  return (
    <div className={`sample-report-invoice ${review ? "invoice-review" : ""}`}>
      <div className="sample-report-invoice-top">
        <Mark />
        <span>Invoice draft</span>
        <span>0042</span>
      </div>
      <div className="sample-report-invoice-body">
        <span className="sample-report-invoice-label">FOR ACME STUDIO</span>
        <strong className="sample-report-invoice-amount">$480.00</strong>
        <div className="sample-report-invoice-line">
          <span>Design work</span>
          <span>$480.00</span>
        </div>
        {review ? (
          <>
            <div className="sample-report-review-note">
              <span aria-hidden="true">✓</span>
              <div>
                <strong>Ready when you are.</strong>
                <p>Check the details. You decide when it sends.</p>
              </div>
            </div>
            <div className="sample-report-concept-actions" aria-hidden="true">
              <span>Edit details</span>
              <span>
                Send invoice <Arrow />
              </span>
            </div>
            <p className="sample-report-invoice-footnote">
              Nothing sends until you choose Send invoice.
            </p>
          </>
        ) : (
          <>
            <div className="sample-report-auto-note">
              <div>
                <strong>Automatic sending</strong>
                <p>Allow the tool to send your invoices.</p>
              </div>
              <span className="sample-report-toggle" aria-hidden="true">
                <i />
              </span>
            </div>
            <div className="sample-report-concept-action" aria-hidden="true">
              Allow &amp; continue <Arrow />
            </div>
            <p className="sample-report-invoice-footnote">
              The person cannot see a review step here.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function SampleReport() {
  return (
    <main id="main" className="sample-report-page">
      <div className="container sample-report-shell">
        <div className="sample-report-toolbar print-hide">
          <Link href="/" className="sample-report-back">
            ← Back to Playground
          </Link>
          <PrintReport />
        </div>
        <article
          className="sample-report-document"
          aria-label="Example product test report"
        >
          <div className="sample-report-masthead">
            <span>
              <Mark />
              PLAYGROUND / THE NEXT MOVE
            </span>
            <span className="sample-report-example">EXAMPLE REPORT</span>
          </div>
          <header className="sample-report-cover">
            <div className="sample-report-cover-copy">
              <p className="sample-report-kicker">
                AI INVOICING TOOL / FIRST INVOICE
              </p>
              <h1>
                <span>The product made sense.</span>{" "}
                <span>The send button didn’t.</span>
              </h1>
              <p className="sample-report-cover-description">
                Five example testers. One first invoice. A clearer idea of what
                to change before putting this product in more people’s hands.
              </p>
            </div>
            <aside
              className="sample-report-decision"
              aria-label="Recommended next move"
            >
              <span className="sample-report-kicker">THE NEXT MOVE</span>
              <h2>Fix this before launch</h2>
              <div className="sample-report-decision-rule" />
              <p>Let people check an invoice before it sends.</p>
              <a href="#changes">
                See the changes <Arrow />
              </a>
            </aside>
          </header>
          <div className="sample-report-disclosure">
            <span aria-hidden="true">↳</span>
            <p>
              This is an example of a Playground report. The people, quotes and
              observations are invented to show the format.
            </p>
          </div>
          <nav
            className="sample-report-nav print-hide"
            aria-label="Report sections"
          >
            {[
              ["summary", "01", "Summary"],
              ["evidence", "02", "Evidence"],
              ["people", "03", "People"],
              ["changes", "04", "Changes"],
              ["next-test", "05", "Next test"],
            ].map(([id, number, label]) => (
              <a href={`#${id}`} key={id}>
                <span aria-hidden="true">{number}</span>
                {label}
              </a>
            ))}
          </nav>

          <section
            id="summary"
            className="sample-report-section sample-report-summary"
            data-reveal
          >
            <SectionHeading
              number="01"
              label="THE SHORT VERSION"
              title="Two finished. Three stopped."
            />
            <div className="sample-report-brief">
              <div>
                <span>THE PRODUCT</span>
                <p>An AI invoicing tool for freelancers.</p>
              </div>
              <div>
                <span>THE TASK</span>
                <p>Create an account and send a first invoice.</p>
              </div>
              <div>
                <span>THE PEOPLE</span>
                <p>Five freelancers who manage their own invoicing.</p>
              </div>
            </div>
            <div className="sample-report-outcome">
              <div className="sample-report-outcome-count">
                <strong>
                  2 <span>of 5</span>
                </strong>
                <p>finished the task</p>
                <div className="sample-report-count-bars" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((index) => (
                    <span
                      key={index}
                      className={index < 2 ? "is-finished" : ""}
                    />
                  ))}
                </div>
                <span className="sample-report-count-note">
                  The other 3 stopped before sending.
                </span>
              </div>
              <div
                className="sample-report-outcome-people"
                aria-label="Five example tester outcomes"
              >
                {people.map((person) => (
                  <div
                    className={`sample-report-person-tile ${person.finished ? "is-finished" : ""}`}
                    key={person.name}
                  >
                    <Avatar index={person.index} />
                    <strong>{person.name.split(" ")[0]}</strong>
                    <span>
                      <i aria-hidden="true">{person.finished ? "✓" : "—"}</i>
                      {person.finished ? "Finished" : "Stopped"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="sample-report-lesson">
              <span className="sample-report-kicker">WHAT THIS POINTS TO</span>
              <p>
                The tool offered a useful job. The next version needs to make it
                clear that the person stays in control of sending.
              </p>
              <a href="#send-question">
                Read the observation behind this <Arrow />
              </a>
            </div>
          </section>

          <section id="evidence" className="sample-report-section" data-reveal>
            <SectionHeading
              number="02"
              label="WHAT WE SAW"
              title="A question before the click."
              description="Each suggested change should lead back to something a person did or said. Here are the example observations behind this report."
            />
            <div className="sample-report-evidence-grid">
              {observations.map((item) => (
                <article
                  id={item.id}
                  className="sample-report-observation"
                  key={item.id}
                >
                  <div className="sample-report-observation-top">
                    <span>{item.number}</span>
                    <p>{item.label}</p>
                  </div>
                  <h3>{item.title}</h3>
                  {item.quote && <blockquote>“{item.quote}”</blockquote>}
                  <p className="sample-report-observation-detail">
                    {item.detail}
                  </p>
                  <a href={`#${item.change}`}>
                    {item.changeLabel}
                    <Arrow />
                  </a>
                </article>
              ))}
            </div>
          </section>

          <section id="people" className="sample-report-section" data-reveal>
            <SectionHeading
              number="03"
              label="WHO TRIED IT"
              title="The people behind the numbers."
              description="For this example, the right people were freelancers who already handle invoices. Their work is close to the job this product is meant to do."
            />
            <div className="sample-report-people-list">
              {people.map((person) => (
                <div className="sample-report-person-row" key={person.name}>
                  <Avatar index={person.index} />
                  <div className="sample-report-person-name">
                    <strong>{person.name}</strong>
                    <span>{person.role}</span>
                  </div>
                  <p>{person.note}</p>
                  <span
                    className={`sample-report-person-result ${person.finished ? "is-finished" : ""}`}
                  >
                    <i aria-hidden="true">{person.finished ? "✓" : "—"}</i>
                    {person.finished ? "Finished" : "Stopped"}
                  </span>
                </div>
              ))}
            </div>
            <p className="sample-report-people-note">
              Finished means the person sent a first invoice. Stopped means they
              left before sending it.
            </p>
          </section>

          <section
            id="changes"
            className="sample-report-section sample-report-changes"
            data-reveal
          >
            <SectionHeading
              number="04"
              label="WHAT TO CHANGE"
              title="Let people check before they send."
              description="Make these two changes, then put the next version in front of people. They are suggestions to test, not promises that the product will work."
            />
            <article id="change-review" className="sample-report-change">
              <span className="sample-report-change-number">1</span>
              <div>
                <p className="sample-report-kicker">CHANGE THIS FIRST</p>
                <h3>Let people check an invoice before it sends.</h3>
                <p>
                  Show the draft. Let the person check the client, amount and
                  message, edit anything they need to, then choose Send invoice.
                  Keep automatic sending a separate choice.
                </p>
                <div className="sample-report-change-basis">
                  <span>WHY THIS CHANGE</span>
                  <p>
                    Daniel asked whether it would send before he could review
                    it, then left the invoice in draft.{" "}
                    <a href="#send-question">See observation 01 ↗</a>{" "}
                    <a href="#draft-exit">See observation 03 ↗</a>
                  </p>
                </div>
              </div>
            </article>
            <div className="sample-report-concept">
              <div className="sample-report-concept-heading">
                <h4>
                  A small change in the screen. A big change in who decides.
                </h4>
                <p>
                  Two example screens. The proposed change has not been tested
                  yet.
                </p>
              </div>
              <div className="sample-report-concept-grid">
                <div>
                  <span className="sample-report-concept-label">
                    BEFORE / ASK FOR CONTROL
                  </span>
                  <InvoiceConcept review={false} />
                </div>
                <div>
                  <span className="sample-report-concept-label concept-label-after">
                    AFTER / LEAVE CONTROL WITH THE PERSON
                  </span>
                  <InvoiceConcept review />
                </div>
              </div>
            </div>
            <article
              id="change-access"
              className="sample-report-change sample-report-change-second"
            >
              <span className="sample-report-change-number">2</span>
              <div>
                <p className="sample-report-kicker">CHANGE THIS NEXT</p>
                <h3>Explain access where you ask for it.</h3>
                <p>
                  Beside the access request, say what the tool can read, what it
                  can do, and which actions need approval. Give people a clear
                  way to learn more before they decide.
                </p>
                <div className="sample-report-change-basis">
                  <span>WHY THIS CHANGE</span>
                  <p>
                    Three of the five example testers opened privacy information
                    before granting access. Check whether an explanation beside
                    the request answers their questions.{" "}
                    <a href="#access-question">See observation 02 ↗</a>
                  </p>
                </div>
              </div>
            </article>
          </section>

          <section
            id="next-test"
            className="sample-report-section sample-report-next"
            data-reveal
          >
            <SectionHeading
              number="05"
              label="THE NEXT TEST"
              title="Does a review step help people send?"
              description="Give the revised version to freelancers who handle their own invoices. Ask them to send a first invoice without a walkthrough."
            />
            <div className="sample-report-next-checks">
              {[
                ["Find it", "Do they find the draft and check its details?"],
                [
                  "Understand it",
                  "Can they say what access they are allowing?",
                ],
                ["Choose it", "Do they choose to send, or do they stop again?"],
              ].map(([title, detail], index) => (
                <div key={title}>
                  <span>0{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{detail}</p>
                </div>
              ))}
            </div>
            <p className="sample-report-next-meaning">
              If people still hesitate, ask what they are unsure about and
              revise that step. Another small test can show whether the change
              helped these people; it cannot predict the whole market.
            </p>
            <div className="sample-report-test-choice">
              <Mark />
              <div>
                <strong>The question comes before the method.</strong>
                <p>
                  For a first-use question like this, choose relevant people. AI
                  can help explore wording and options; a field expert can check
                  the invoicing rules. Choose each for the question they can
                  answer.
                </p>
              </div>
            </div>
            <Link
              className="button sample-report-own-test print-hide"
              href="/run-a-test?focus=Check%20before%20sending"
            >
              Plan your own test <Arrow />
            </Link>
          </section>
          <aside className="sample-report-limits">
            <h2>Keep the limits in view.</h2>
            <p>
              This is a made-up example, not a completed customer study. Five
              people can help find a problem worth checking. They cannot prove
              what the whole market wants or predict what future users will do.
              These example observations support a next test, not a launch
              guarantee.
            </p>
          </aside>
          <footer className="sample-report-document-footer">
            <span>
              <Mark />
              PLAYGROUND
            </span>
            <span>EXAMPLE REPORT / AI INVOICING TOOL</span>
          </footer>
        </article>
      </div>
    </main>
  );
}
