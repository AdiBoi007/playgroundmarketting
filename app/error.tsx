"use client";
import { Eyebrow } from "@/components/ui/Primitives";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="error-page container">
      <Eyebrow>SOMETHING WENT WRONG</Eyebrow>
      <h1>We couldn’t load this page.</h1>
      <p>Try loading the page again.</p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
