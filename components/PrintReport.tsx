"use client";
export function PrintReport() {
  return (
    <button className="report-print print-hide" onClick={() => window.print()}>
      Save or print report <span aria-hidden="true">↗</span>
    </button>
  );
}
