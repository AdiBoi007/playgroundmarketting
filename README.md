# Playground

A Next.js / TypeScript marketing website for Playground, an early-access service with paid tests underway. The main offer is finding relevant pilot users and testing ideas, prototypes, MVPs, launches and new features with them. An interactive horizontal product journey explains the audience, test and decision at each stage. Supplied artwork, a six-note assumption wall, interactive crossroads and question picker, and a clearly fictional sample report explain the service. AI and field experts support questions that need them.

## Run locally

Use Node.js 22, matching the version configured for Vercel.

```sh
npm install
npm run dev
```

Open http://localhost:3000. For a production server, run `npm run build` followed by `npm start`.

## Deploy on Vercel

This checkout is linked to the `playground-marketing` Vercel project. Run `vercel deploy --prod` to publish updates. `vercel.json` selects the Next.js framework, and the package pins Node.js 22. Canonical URLs use Vercel's stable production domain unless `NEXT_PUBLIC_SITE_URL` overrides it.

## Routes

- `/` — pilot-user offer, interactive product-stage timeline, assumption wall, crossroads, question picker and native FAQs
- `/how-it-works` — three steps: define the audience and question, recruit pilot users and test, use the findings
- `/startups` — decision-specific test scenarios
- `/sample-report` — fictional example findings, evidence links and native printing / PDF saving
- `/about` — research approach and evidence limitations
- `/run-a-test` — test brief and waitlist consent, optional focus query, local brief download
- `/privacy`, `/terms` — notices covering this marketing website
- `/api/lead` — validated, rate-limited Gmail delivery of test briefs and waitlist entries
- `/waitlist` — LinkedIn-first waitlist signup with phone and email alternatives
- `/api/waitlist` — validated, rate-limited Gmail notifications to the owner
- `/become-a-tester` — paid tester application with background, preferred contact and optional CV
- `/api/testers` — validated tester notifications with separate opportunity consent
- `/robots.txt`, `/sitemap.xml` — search discovery

## Request delivery

The product timeline supports pointer selection and Arrow keys, Home and End, with linked tab panels and reduced-motion support. Idea-stage enquiries go to `/waitlist` without requiring a product link; later stages open `/run-a-test` with the selected question prefilled. All stage summaries remain readable without JavaScript. The diagram describes the process and does not display simulated progress, customer counts or validation scores. Recruitment and testing happen outside this marketing website after scope, price and timing are agreed.

The shared signup stylesheet is imported by the root layout so the waitlist and tester controls are styled before navigation. Keep it with the site-wide imports rather than moving it back to individual pages. See [the signup layout audit](docs/layout-audit.md) for the reproduced failure and regression coverage.

Submitting `/run-a-test` also joins the Playground waitlist. The required consent checkbox explains early-access and launch updates; `/api/lead` requires `consent: true`. A single notification to the privately configured owner inbox includes all five brief fields (`name`, `email`, `productUrl`, `targetUser`, `testGoal`), source `run-a-test`, consent, submission time, and reference. It uses the same Gmail configuration as `/waitlist`; no separate request receiver is required.

The request form confirms registration only when the server returns both `delivered: true` and `waitlisted: true` after Gmail accepts the notification. A brief remains an enquiry; submission does not book a test or guarantee admission, pricing, or a delivery date. No automatic email is sent to the applicant.

The route validates the full brief and consent, rejects foreign browser origins, credential-bearing product URLs, oversized bodies, and honeypot submissions, and does not fetch a supplied product URL. Repeated unchanged submissions reuse the `Idempotency-Key`; edited briefs get a new reference. Retry suppression and rate limits are local to the running server instance and do not provide durable global deduplication.

If Gmail delivery is unavailable or fails, the form retains the entered brief and reports the error. Saving a `.txt` copy stays on the user's device; it sends no email and creates no waitlist or booking entry. No account, payment, AI test, or participant recruitment is simulated as a real backend action.

## Shared Gmail delivery

All three forms notify the privately configured owner inbox through Gmail SMTP or the Gmail API. `/waitlist` and `/become-a-tester` offer LinkedIn first (selected by default), phone second and email third. One chosen contact method is required; email is required only when email is selected. Another social profile can be supplied in the LinkedIn field. The waitlist accepts optional name and product URL. Tester applications require name and role and accept optional company, an always-visible LinkedIn/social profile, testing interests and a PDF/DOCX résumé up to 2 MB, with separate consent to contact about testing opportunities. They do not also join the customer waitlist.

The chosen method and contact details are validated and included in the notification. Optional tester résumés are checked for size, extension, content signature and MIME type, then delivered as a MIME attachment over the existing Gmail SMTP or OAuth transport. Files stay on the applicant’s device until submission; no public file URL or separate storage service is created. LinkedIn/social background details can accompany a phone or email contact preference. A `Reply-To` header is included only when an email address exists; phone-only and profile-only applications still notify the owner through the fixed Gmail sender. Follow-up happens manually through the chosen channel; this website does not send SMS, LinkedIn messages or automatic confirmations. `/run-a-test` retains its full brief and explicit waitlist consent, with email plus optional phone/social details.

Delivered notifications in the owner inbox hold signup, application and brief records; there is no separate database or booking queue. Success is shown only after the configured Gmail transport confirms acceptance, which does not guarantee inbox placement or that the owner has read it. Details remain in the form if delivery fails. None of the forms sends an automatic message to applicants.

For the simpler SMTP setup, enable **2-Step Verification** on the sender's Google account, open [Google App Passwords](https://myaccount.google.com/apppasswords), and create a dedicated **Playground** App Password. Add only `GMAIL_APP_PASSWORD` as a **Sensitive** Vercel **Production** variable if `GMAIL_SENDER_EMAIL` and `WAITLIST_NOTIFY_EMAIL` are already configured, then redeploy. For local use, put those three variables in ignored `.env.local`. App Passwords may be unavailable under some account security or organization settings. [Google's App Password requirements](https://support.google.com/accounts/answer/185833?hl=en).

A nonblank `GMAIL_APP_PASSWORD` selects SMTP. Grouping spaces are removed; the remaining password must contain 16 ASCII letters or digits. Ordinary Google passwords and OAuth client secrets are not valid App Passwords. No Google Cloud OAuth setup or refresh token is needed for SMTP.

For the optional Gmail API alternative, leave `GMAIL_APP_PASSWORD` blank, enable Gmail API, configure a Web OAuth client with redirect URI `http://localhost:8739/oauth/callback`, and set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GMAIL_SENDER_EMAIL`, and `WAITLIST_NOTIFY_EMAIL` privately in `.env.local` and Vercel Production. Run:

```sh
npm run gmail:connect
```

Open the provided Google consent URL on the same computer. The helper verifies the sender using `openid email`, captures `GOOGLE_REFRESH_TOKEN` without manual copying, saves it privately in ignored `.env.local`, updates the sensitive Vercel production token, and deploys. It requests `gmail.send` and basic email identity only; it does not read the mailbox or send a test email.

Follow [the shared Gmail setup guide](docs/gmail-waitlist.md) for SMTP setup, optional OAuth prerequisites, Testing-mode expiry, production publishing, and renewal. After deployment, submit a clearly labeled test signup or brief yourself and check the owner inbox. Do not paste credentials or tokens into chat, commit them, or prefix them with `NEXT_PUBLIC_`. Without a configured sender, recipient, and valid credential for the selected method, all forms report unavailable delivery rather than successful registration.

Rate limits and any retry suppression live within a running server instance. They do not provide global deduplication or exactly-once delivery across restarts, scaling, or uncertain network outcomes. If those guarantees become necessary, add a persistent store and delivery queue.

## Analytics

`lib/analytics.ts` dispatches `playground:analytics` custom events and optionally calls `window.playgroundAnalytics(event, properties)`. Connect a provider there or listen for the event. Analytics failures never interrupt a visitor action. Form values and personal data are never included in analytics payloads. No analytics provider is connected by default.

## Validation

```sh
npm run lint
npm run typecheck
npm test
node --test scripts/connect-gmail.test.mjs
npm run build
```

The Playwright checks cover seven viewport widths, the six-note assumption wall, crossroads choice explanations and keyboard controls, route and fragment-link integrity, WCAG A/AA automated accessibility, keyboard navigation and question selection, native FAQs, report links and printing, the centered hero, the tester-company marquee and its pointer/keyboard pause control, JavaScript-free content, reduced-motion visibility, 200% text enlargement, unavailable intake, downloads, confirmed-delivery UI, idempotent retries, and API validation. Waitlist and test-request checks cover complete five-field brief notifications over mocked SMTP and Gmail OAuth, phone-only, email-only and default LinkedIn signups from form through API to notification, separate tester applications and consent, malformed contact input, explicit consent, both delivery and waitlist confirmation flags, retained inputs on failure, consent-free local downloads, concurrent retry suppression, changed-brief conflicts, and rate limiting. Signup layout checks run in Chromium and WebKit, covering real element spacing, direct entry, client navigation, history, reload and missing route stylesheets. SMTP checks cover App Password selection, encrypted transport settings, notification content and recipient, final acceptance, rejected or malformed confirmations, generic failures, and timeout cleanup. No live emails are sent during these checks. Install the test browsers if needed with `npx playwright install chromium webkit`.

The 12 connector checks cover consent parameters, callback validation, sender verification, private token storage, Vercel publishing order, output redaction, approval timeout, and listener cleanup. They use mocked Google and Vercel operations; they do not authorize an account, publish real credentials, deploy, or send email.

For an already running local server, use `PLAYWRIGHT_BASE_URL=http://localhost:3000 npm test`. Browser form submissions are intercepted; direct transport checks use mocked Google and SMTP operations. Do not point this suite at the live marketing site.

Production dependencies have no reported vulnerabilities in `npm audit --omit=dev`. The current ESLint dependency tree includes an upstream, development-only `braces` advisory without a compatible registry fix. It is not shipped as application code.

## Assets and content

Fonts are self-hosted Manrope and IBM Plex Mono, with their OFL licences in `public/fonts/`. The logo, coastal landscape, and city illustration in `public/brand/` were supplied by the owner. The supplied logo is used as a luminance mask, with compact image derivatives for the mark and browser icons. Its source artwork is preserved. The landscape uses responsive Next.js image optimization. Participant illustrations and the interactive crossroads landscape are original vectors. All example participant profiles, quotes, observations and outcomes are explicitly made up. The tester-company marquee uses the eleven company names supplied by the owner, with locally hosted logos and [asset provenance](public/brand/testers/SOURCES.md). It identifies tester backgrounds without describing the companies as customers or endorsers. The marquee loops with CSS, supports a native pause toggle without JavaScript, and shows a static grid for reduced motion and printing. No testimonials or claimed customer results are invented.

The legal routes describe this implementation, not commercial product-test agreements. Configure your actual intake destination and review the notices against the final operating service before making changes to data handling.
