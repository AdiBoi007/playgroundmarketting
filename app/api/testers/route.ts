import { createSignupHandler } from "@/lib/signup-handler";
import { sendTesterNotification } from "@/lib/gmail";
import { validateTester } from "@/lib/tester";
import { MAX_RESUME_BASE64_LENGTH } from "@/lib/resume";

export const runtime = "nodejs";
export const maxDuration = 30;
export const POST = createSignupHandler({
  validate: validateTester,
  send: sendTesterNotification,
  maxBodyBytes: MAX_RESUME_BASE64_LENGTH + 16_384,
  unavailableMessage: "Tester applications are temporarily unavailable. Please check back soon.",
  failureMessage: "Your tester application could not be confirmed. Please try again shortly.",
});
