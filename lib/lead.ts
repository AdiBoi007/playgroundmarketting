import { validateContactDetails, type ContactDetails } from "@/lib/contact";
import { isValidWaitlistEmail } from "@/lib/waitlist";

export type Lead = ContactDetails & {
  name: string;
  email: string;
  productUrl: string;
  targetUser: string;
  testGoal: string;
};
export function validateLead(
  input: Record<string, unknown>,
): { lead: Lead } | { error: string } {
  const fields = [
    "name",
    "email",
    "productUrl",
    "targetUser",
    "testGoal",
  ] as const;
  const limits = {
    name: 100,
    email: 254,
    productUrl: 2048,
    targetUser: 1000,
    testGoal: 2000,
  };
  const values = {} as Lead;
  for (const field of fields) {
    const raw = input[field];
    if (
      typeof raw !== "string" ||
      !raw.trim() ||
      raw.length > limits[field] ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(raw)
    )
      return { error: "Please complete all five fields with valid details." };
    values[field] = raw.trim();
  }
  if (
    /[\u0000-\u001f\u007f]/.test(input.email as string) ||
    !isValidWaitlistEmail(values.email)
  )
    return { error: "Please enter a valid email address." };
  values.email = values.email.toLowerCase();
  try {
    const url = new URL(values.productUrl);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      !url.hostname ||
      url.username ||
      url.password
    )
      return {
        error:
          "Please enter a full product link, like https://example.com.",
      };
  } catch {
    return {
      error:
        "Please enter a full product link, like https://example.com.",
    };
  }
  const contact = validateContactDetails(input);
  if ("error" in contact) return contact;
  return { lead: { ...values, ...contact.contact } };
}
