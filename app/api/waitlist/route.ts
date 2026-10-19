import { createSignupHandler } from "@/lib/signup-handler";
import { sendWaitlistNotification } from "@/lib/gmail";
import { validateWaitlist } from "@/lib/waitlist";

export const runtime = "nodejs";
export const maxDuration = 30;
export const POST = createSignupHandler({
  validate: validateWaitlist,
  send: sendWaitlistNotification,
  unavailableMessage: "Waitlist signups aren’t open yet. Please check back soon.",
  failureMessage: "Your signup could not be confirmed. Please try again shortly.",
});
