# Playground

A Next.js / TypeScript marketing website for Playground, an early-access service with paid tests underway. The site explains how Playground helps choose what to test, how to test it, and who should take part: people, AI or relevant experts. Supplied artwork, a six-note assumption wall, interactive crossroads and question picker, and a clearly fictional sample report explain the service.

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

- `/` — the assumption wall, interactive crossroads and question picker, product story and native FAQs
- `/how-it-works` — three steps: share a question, choose a test, use the findings
- `/startups` — decision-specific test scenarios
- `/sample-report` — fictional example findings, evidence links and native printing / PDF saving
- `/about` — research approach and evidence limitations
- `/run-a-test` — test brief and waitlist consent, optional focus query, local brief download
- `/privacy`, `/terms` — notices covering this marketing website
- `/api/lead` — validated, rate-limited Gmail delivery of test briefs and waitlist entries
- `/waitlist` — waitlist signup form
- `/api/waitlist` — validated, rate-limited Gmail notifications to the owner
- `/robots.txt`, `/sitemap.xml` — search discovery

## Request delivery

Submitting `/run-a-test` also joins the Playground waitlist. The required consent checkbox explains early-access and launch updates; `/api/lead` requires `consent: true`. A single notification to the privately configured owner inbox includes all five brief fields (`name`, `email`, `productUrl`, `targetUser`, `testGoal`), source `run-a-test`, consent, submission time, and reference. It uses the same Gmail configuration as `/waitlist`; no separate request receiver is required.

The request form confirms registration only when the server returns both `delivered: true` and `waitlisted: true` after Gmail accepts the notification. A brief remains an enquiry; submission does not book a test or guarantee admission, pricing, or a delivery date. No automatic email is sent to the applicant.

The route validates the full brief and consent, rejects foreign browser origins, credential-bearing product URLs, oversized bodies, and honeypot submissions, and does not fetch a supplied product URL. Repeated unchanged submissions reuse the `Idempotency-Key`; edited briefs get a new reference. Retry suppression and rate limits are local to the running server instance and do not provide durable global deduplication.

If Gmail delivery is unavailable or fails, the form retains the entered brief and reports the error. Saving a `.txt` copy stays on the user's device; it sends no email and creates no waitlist or booking entry. No account, payment, AI test, or participant recruitment is simulated as a real backend action.

## Shared Gmail delivery

Both forms send notifications to the privately configured owner inbox through Gmail SMTP or the Gmail API. `/waitlist` collects an email address with optional name and product URL; `/run-a-test` includes the full brief and also joins the waitlist with explicit consent. Delivered notifications in the owner inbox hold the signup and brief records; there is no separate database or booking queue. Success is shown only after the configured Gmail transport confirms acceptance, which does not guarantee inbox placement or that the owner has read it. Neither form sends an automatic email to applicants.

For the simpler SMTP setup, enable **2-Step Verification** on the sender's Google account, open [Google App Passwords](https://myaccount.google.com/apppasswords), and create a dedicated **Playground** App Password. Add only `GMAIL_APP_PASSWORD` as a **Sensitive** Vercel **Production** variable if `GMAIL_SENDER_EMAIL` and `WAITLIST_NOTIFY_EMAIL` are already configured, then redeploy. For local use, put those three variables in ignored `.env.local`. App Passwords may be unavailable under some account security or organization settings. [Google's App Password requirements](https://support.google.com/accounts/answer/185833?hl=en).

A nonblank `GMAIL_APP_PASSWORD` selects SMTP. Grouping spaces are removed; the remaining password must contain 16 ASCII letters or digits. Ordinary Google passwords and OAuth client secrets are not valid App Passwords. No Google Cloud OAuth setup or refresh token is needed for SMTP.

For the optional Gmail API alternative, leave `GMAIL_APP_PASSWORD` blank, enable Gmail API, configure a Web OAuth client with redirect URI `http://localhost:8739/oauth/callback`, and set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GMAIL_SENDER_EMAIL`, and `WAITLIST_NOTIFY_EMAIL` privately in `.env.local` and Vercel Production. Run:

```sh
npm run gmail:connect
```

Open the provided Google consent URL on the same computer. The helper verifies the sender using `openid email`, captures `GOOGLE_REFRESH_TOKEN` without manual copying, saves it privately in ignored `.env.local`, updates the sensitive Vercel production token, and deploys. It requests `gmail.send` and basic email identity only; it does not read the mailbox or send a test email.

Follow [the shared Gmail setup guide](docs/gmail-waitlist.md) for SMTP setup, optional OAuth prerequisites, Testing-mode expiry, production publishing, and renewal. After deployment, submit a clearly labeled test signup or brief yourself and check the owner inbox. Do not paste credentials or tokens into chat, commit them, or prefix them with `NEXT_PUBLIC_`. Without a configured sender, recipient, and valid credential for the selected method, both forms report unavailable delivery rather than successful registration.

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

The 135 Playwright checks cover seven viewport widths, the six-note assumption wall, crossroads choice explanations and keyboard controls, route and fragment-link integrity, WCAG A/AA automated accessibility, keyboard navigation and question selection, native FAQs, report links and printing, JavaScript-free content, reduced-motion visibility, 200% text enlargement, unavailable intake, downloads, confirmed-delivery UI, idempotent retries, and API validation. Waitlist and test-request checks cover complete five-field brief notifications over mocked SMTP and Gmail OAuth, explicit consent, both delivery and waitlist confirmation flags, retained inputs on failure, consent-free local downloads, concurrent retry suppression, changed-brief conflicts, and rate limiting. SMTP checks cover App Password selection, encrypted transport settings, notification content and recipient, final acceptance, rejected or malformed confirmations, generic failures, and timeout cleanup. No live emails are sent during these checks. Install the test browser if needed with `npx playwright install chromium`.

The 12 connector checks cover consent parameters, callback validation, sender verification, private token storage, Vercel publishing order, output redaction, approval timeout, and listener cleanup. They use mocked Google and Vercel operations; they do not authorize an account, publish real credentials, deploy, or send email.

For an already running local server, use `PLAYWRIGHT_BASE_URL=http://localhost:3000 npm test`. Browser form submissions are intercepted; direct transport checks use mocked Google and SMTP operations. Do not point this suite at the live marketing site.

Production dependencies have no reported vulnerabilities in `npm audit --omit=dev`. The current ESLint dependency tree includes an upstream, development-only `braces` advisory without a compatible registry fix. It is not shipped as application code.

## Assets and content

Fonts are self-hosted Manrope and IBM Plex Mono, with their OFL licences in `public/fonts/`. The logo, coastal landscape, and city illustration in `public/brand/` were supplied by the owner. The supplied logo is used as a luminance mask, with compact image derivatives for the mark and browser icons. Its source artwork is preserved. The landscape uses responsive Next.js image optimization. Participant illustrations and the interactive crossroads landscape are original vectors. All example participant profiles, quotes, observations and outcomes are explicitly made up. No customer logos, testimonials, or claimed customer results are invented.

The legal routes describe this implementation, not commercial product-test agreements. Configure your actual intake destination and review the notices against the final operating service before making changes to data handling.
