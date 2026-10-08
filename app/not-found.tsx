import Link from "next/link";
import { Arrow, Eyebrow } from "@/components/ui/Primitives";
export default function NotFound() {
  return (
    <main id="main" className="not-found container">
      <Eyebrow>PAGE NOT FOUND</Eyebrow>
      <h1>
        We couldn’t find
        <br />
        this page.
      </h1>
      <p>Head back to Playground to find what you need.</p>
      <Link className="button" href="/">
        Back to Playground <Arrow />
      </Link>
    </main>
  );
}
