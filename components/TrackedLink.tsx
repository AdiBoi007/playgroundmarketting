"use client";
import Link from "next/link";
import type { ComponentProps } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics";
export function TrackedLink({
  event,
  ...props
}: ComponentProps<typeof Link> & { event?: AnalyticsEvent }) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        if (event) track(event);
        props.onClick?.(e);
      }}
    />
  );
}
