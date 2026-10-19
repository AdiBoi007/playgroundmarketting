import Link from "next/link";
import { Mark, Arrow } from "@/components/ui/Primitives";
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-top">
        <div>
          <Link href="/" className="wordmark">
            <Mark />
            playground<span className="wordmark-period">.</span>
          </Link>
          <p>
            Find your pilot customers.
            <br />Test before your next move.
          </p>
        </div>
        <div className="footer-links">
          <Link href="/#product-journey">Product</Link>
          <Link href="/about">Why Playground</Link>
          <Link href="/waitlist">Join the waitlist</Link>
          <Link href="/become-a-tester">Get paid to test</Link>
          <Link href="/run-a-test">
            Share your product <Arrow />
          </Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Playground</span>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
