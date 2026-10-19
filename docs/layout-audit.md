# Signup layout audit — 19 October 2026

The reported screenshots showed unstyled signup navigation, contact choices
running together, and both native list numbers and manually written numbers.

## Reproduction and fix

The signup stylesheet was imported only by `/waitlist` and `/become-a-tester`.
Blocking that route-only CSS reproduced the screenshot layout: the navigation
became a block of inline links, contact cards became inline radio labels, and
the ordered list showed duplicate numbers. Fresh direct loads worked in both
Chromium and WebKit; the original reason that the browser missed the asset
was not established.

`app/layout.tsx` now imports the shared signup stylesheet with the site-wide
styles. The two page-level imports were removed. The controls therefore have
their styles before a visitor navigates to either signup page. A regression
test starts on the homepage, blocks additional CSS requests, and verifies that
both signup pages still render correctly.

Navigation titles now have explicit markup and whitespace. Contact labels have
whitespace between their title and description even without CSS. Step numbers
come from a CSS counter instead of duplicate numbers in the ordered-list markup.

## Verification

- All 171 Playwright checks passed, including six new Chromium/WebKit layout
  checks covering direct entry, client navigation, back navigation, reload,
  mobile and desktop, and missing route stylesheets.
- The layout checks inspect computed styles and actual bounding boxes: separate
  cards, vertical title/description spacing, and no horizontal page overflow.
- All ten public pages were also visited in WebKit at 375px and 1440px. They
  returned 200, loaded their assets, had no page exceptions and stayed within
  the viewport. Screenshots were inspected, including full signup pages.
- Existing checks cover accessibility, 200% text, reduced motion, keyboard
  navigation, form validation, retry behavior and CV attachment delivery.
- Lint, TypeScript and the production build passed. Email delivery tests use
  mocked transports; this audit sent no live messages.
- The six new layout checks also passed against the built production server,
  including the missing-route-stylesheet scenario in Chromium and WebKit.

The local development server was restarted on port 3000 with the fixed styles.
No deployment was made.
