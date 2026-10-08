import type { ReactNode } from "react";

export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={diagonal ? "M5 19 19 5M5 5h14v14" : "M4 12h16m-6-6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function Mark({ className = "" }: { className?: string }) {
  return <span className={`brand-mark ${className}`} aria-hidden="true" />;
}
export function Eyebrow({
  children,
  number,
  light = false,
}: {
  children: ReactNode;
  number?: string;
  light?: boolean;
}) {
  return (
    <div className={`eyebrow ${light ? "eyebrow-light" : ""}`}>
      {number && <span className="section-number">{number}</span>}
      {children}
    </div>
  );
}
export function DemoLabel({
  children = "EXAMPLE",
}: {
  children?: ReactNode;
}) {
  return <span className="demo-label">{children}</span>;
}
export function WindowBar({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="window-bar">
      <span className="window-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>{title}</span>
      {children || <span aria-hidden="true">↗</span>}
    </div>
  );
}
export function Avatar({ index, size = "" }: { index: number; size?: string }) {
  const colors = ["#FFC591", "#C2D1F5", "#BDD6B6", "#E9B5A3", "#DCD6A2"];
  return (
    <span
      className={`avatar ${size}`}
      style={{ background: colors[index % 5] }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" fill="none">
        <path
          d="M10 64c1-17 10-25 22-25s21 8 22 25"
          fill={
            ["#194A67", "#1B5247", "#DC6C45", "#347491", "#5B6953"][index % 5]
          }
        />
        <ellipse
          cx="32"
          cy="28"
          rx="13"
          ry="15"
          fill={
            ["#D99465", "#B27B5C", "#DEA985", "#BC8061", "#E5B894"][index % 5]
          }
        />
        <path
          d={
            index % 2
              ? "M18 29V19c0-17 29-16 29 1v9l-5-11-18 2-6 9Z"
              : "M18 28c-6-17 10-29 22-21 10 2 11 12 7 23l-6-13-20 5-3 6Z"
          }
          fill="#18383B"
        />
        <path
          d="M27 29h1m8 0h1"
          stroke="#18383B"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M29 36q3 2 6 0"
          stroke="#864D36"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
