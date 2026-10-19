import Link from "next/link";

export function SignupPaths({ active }: { active: "waitlist" | "tester" }) {
  return (
    <nav className="signup-paths container" aria-label="Choose your Playground path">
      <Link href="/waitlist" aria-current={active === "waitlist" ? "page" : undefined}>
        <span>FOR YOUR PRODUCT</span>{" "}<strong>Get early access</strong>
      </Link>
      <Link href="/become-a-tester" aria-current={active === "tester" ? "page" : undefined}>
        <span>FOR TESTERS</span>{" "}<strong>Get paid to test</strong>
      </Link>
    </nav>
  );
}
