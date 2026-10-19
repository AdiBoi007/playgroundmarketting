# Playground: stronger sales copy

The implemented positioning below reflects the latest product direction.
Earlier copy suggestions are retained for reference; their “Current” excerpts
describe the site before this positioning pass.

## Implemented

- **Homepage hero:** centered the headline, supporting copy and actions; removed
  the invoicing report card. The hero now explains the offer before showing an
  example elsewhere on the site.
- **Value statement:** “Find your pilot users. Test before you launch.” The
  offer is relevant pilot-user recruitment plus product testing, from an idea
  to an existing product’s next feature.
- **Actions:** “Find my pilot users” links to the waitlist. “See how it works” links
  to the testing process.
- **Interactive product journey:** Idea → Prototype → MVP → Launch → New
  features. Each selection explains who Playground finds, what is tested and
  what the founder learns. The diagram stays horizontal on mobile, supports
  keyboard navigation and offers readable content without JavaScript.
- **Conversion path:** Idea-stage enquiries use the waitlist without a product
  link. Later stages prefill a relevant question in the existing product brief.
- **Supporting pages:** The waitlist, How it works, For startups and closing
  calls to action explain finding pilot users, testing assumptions and making
  the next product decision. Scope, price and timing are agreed upfront.
- **Tester headline:** “Real people from the world’s leading companies.” The
  section is labelled “The pilot user community.” The
  logos describe tester backgrounds, using the company list supplied by the
  owner.

## Earlier copy opportunities (reference)

### 1. Homepage: put the cost of guessing next to the assumption wall

**Location:** `components/home/Narrative.tsx`, `Assumptions`.

**Current:** “Every launch is a bet. Some bets deserve a little evidence.”

**Suggested:** “Find the assumptions worth fixing before you spend another
sprint building on them.”

Keep the existing headline and six notes. The notes make the problem tangible;
the new supporting sentence connects it to the founder’s time and budget.

### 2. Homepage: make the output feel worth buying

**Location:** `components/home/Narrative.tsx`, `EnterPlayground`.

**Current third step:** “Get findings and next steps.”

**Suggested title:** “Know what to fix next.”

**Suggested body:** “See where people got stuck, why it matters, and the changes
worth testing first. Give your team a clear starting point for the next sprint.”

Keep “Bring the question. Leave with a next move.” It already connects a problem
to an outcome. Give the final step a concrete payoff instead of repeating the
process language.

### 3. Homepage: lead the testing-method cards with a stronger buyer question

**Location:** `components/home/Narrative.tsx`, `Matching`.

**Current:** “Different questions. Different testers.”

**Suggested headline:** “Who should put your product to the test?”

**Suggested introduction:** “People who could use it. Experts who understand the
job. AI to explore the what-ifs. We build the test around the decision you need
to make.”

The company logos establish recognisability. These cards should explain why a
particular person’s experience matters for the product being tested.

### 4. Homepage: connect each use case to a moment when someone will buy

**Location:** `components/home/Narrative.tsx`, `UseCaseSection`, and
`components/home/UseCases.tsx`.

**Current headline:** “New idea? New feature? Test the next bet.”

**Suggested headline:** “Before you build it, price it, or ship it.”

**Suggested supporting copy:** “Check demand before another build. Find the
friction before a release. Test the price before you take it to market.”

**Current link:** “Ask this about your product.”

**Suggested link:** “Plan a test for this question.”

Keep the link to the brief form with the selected question filled in. It turns
the examples into a direct route to enquiry.

### 5. Shared closing section: give the final action a concrete reason

**Location:** `components/home/Narrative.tsx`, `FinalCTA`; shared by the homepage,
How it works and For startups pages.

**Current:** “The next version starts with an answer.”

**Suggested headline:** “Make your next product bet with evidence.”

**Suggested supporting copy:** “Bring the question holding up your next move.
Find out what’s worth changing before your next sprint.”

**Primary action:** “Get early access” → `/waitlist`.

**Secondary action:** “Have a product ready? Send your brief” → `/run-a-test`.

This is a useful place to improve persuasion across several pages at once.

### 6. Waitlist: implemented as a contact-first conversation

**Location:** `app/waitlist/page.tsx`, `components/SignupForm.tsx` and
`components/ContactChoice.tsx`.

The waitlist has since been redesigned around “Less guessing. Better building.”
The form now defaults to LinkedIn, with phone as the second choice and email third, and asks only for the selected contact method. Name and product details are
optional. The signup confirms contact about early access through the chosen
channel. A separate `/become-a-tester` page collects tester applications rather
than mixing them with customer enquiries. Tester recruitment now leads with
“Get paid to test” across the header, footer, community marquee and application
page. It explains that the task, session length and payment are shared before
the applicant accepts a test, without inventing rates or earnings claims.

### 7. Test brief: sell the decision the visitor needs to make

**Location:** `app/run-a-test/page.tsx`.

**Current headline:** “What are you building?”

**Suggested headline:** “What’s your next big product question?”

**Suggested introduction:** “Tell us what you’re building and what you need to
find out. We’ll review your brief and work out the right test with you.”

**Suggested reassurance beside the form:** “Scope, price and timing agreed
before any paid work starts.”

The current form already asks for a product, target user and test goal. Keep
those fields and the optional contact details; the copy should make it clear
what the visitor gets by sharing them.

### 8. For startups: put the commercial stakes in the opening paragraph

**Location:** `app/startups/page.tsx`.

Keep “Before another weekend of building.” It speaks directly to the audience.

**Suggested supporting copy:** “Find out whether people want the idea, can use
the product, and understand the value before you commit to another sprint.”

**Suggested action:** “Send your product brief.”

### 9. Sample report removed

The sample report page and its navigation links have been removed. Old URLs
redirect to `/how-it-works`. Calls to action now lead to the process, waitlist or
product brief instead.

### 10. About: add the people and the method

**Location:** `app/about/page.tsx`.

The current page has a clear point of view, but little first-hand evidence of
who is delivering the service. Add actual founder/researcher names, relevant
experience and a short explanation of how testers are matched to a question.

**Suggested transition into the method:** “Every useful test starts with a
decision. Here’s how we work back from yours.”

## Proof that would sell harder than more adjectives

The next useful additions are a real finding-to-change example, a tester
profile explaining relevant experience, and a customer quote tied to an actual
product decision. Publish names and quotes with permission. Add real pricing
and turnaround ranges once they are agreed operationally. These make stronger
sales promises possible without inventing volume, outcomes or scarcity.

## Suggested order

1. Assumption-wall copy, final CTA and the test-brief introduction.
2. Waitlist positioning and use-case links.
3. Method-card and startup copy.
4. Real case studies, delivery details and team profiles as evidence becomes
   available.

These are copy hypotheses. Existing analytics hooks can measure hero and final
CTA clicks and completed forms after an analytics receiver is connected; no
provider is connected by default. Use completed enquiries and signups to judge
the changes, alongside clicks.
