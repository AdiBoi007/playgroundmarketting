import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/Primitives";
export function PageIntro({
  eyebrow,
  title,
  children,
  className = "",
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`page-intro container ${className}`}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1>{title}</h1>
      {children && <div className="page-intro-copy">{children}</div>}
    </div>
  );
}
