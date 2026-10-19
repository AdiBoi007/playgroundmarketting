"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Arrow, Mark } from "@/components/ui/Primitives";
import { track } from "@/lib/analytics";
import styles from "./SiteHeader.module.css";
const links = [
  { href: "/#product-journey", label: "Product" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/sample-report", label: "Sample report" },
  { href: "/become-a-tester", label: "Get paid to test" },
];
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);
  return (
    <header className="site-header">
      <div className="nav-wrap">
        <Link
          className="wordmark"
          href="/"
          aria-label="Playground home"
          onClick={() => setOpen(false)}
        >
          <Mark />
          playground<span className="wordmark-period">.</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              href={link.href}
              key={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          className="button button-small nav-cta"
          href="/waitlist"
          aria-label="Join the waitlist"
          onClick={() => {
            track("nav_waitlist_click");
            setOpen(false);
          }}
        >
          <span className={styles.desktopLabel}>Join the waitlist</span>
          <span className={styles.mobileLabel}>Waitlist</span>
          <Arrow />
        </Link>
        <button
          ref={button}
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen(!open)}
        >
          <span className={open ? "menu-open" : ""} />
          <span className={open ? "menu-open" : ""} />
        </button>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          className="mobile-nav"
          aria-label="Mobile navigation"
        >
          {[
            ...links,
            { href: "/startups", label: "For startups" },
            { href: "/about", label: "Our approach" },
            { href: "/run-a-test", label: "Share your product" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
            >
              {link.label}
              <Arrow />
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
