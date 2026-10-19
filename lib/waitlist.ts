import type { ContactDetails } from "@/lib/contact";
import { validateSignupContact, type ContactMethod } from "@/lib/signup-contact";

export type WaitlistSignup = ContactDetails & {
  email: string;
  contactMethod?: ContactMethod;
  name: string;
  productUrl: string;
  consent: true;
  source: "waitlist" | "hero" | "footer";
};

export { isValidWaitlistEmail } from "@/lib/email";

export function validateWaitlist(
  input: Record<string, unknown>,
): { signup: WaitlistSignup } | { error: string } {
  if (input.consent !== true)
    return {
      error: "Please agree to receive early-access and launch updates.",
    };
  const optional = (key: string, limit: number) => {
    const value = input[key];
    if (value === undefined || value === "") return "";
    if (
      typeof value !== "string" ||
      value.length > limit ||
      /[\u0000-\u001f\u007f]/.test(value)
    )
      return null;
    return value.trim();
  };
  const name = optional("name", 100);
  const productUrl = optional("productUrl", 2048);
  if (name === null) return { error: "Please enter a valid name." };
  if (productUrl === null)
    return { error: "Please enter a valid product link." };
  if (productUrl) {
    try {
      const url = new URL(productUrl);
      if (
        !["https:", "http:"].includes(url.protocol) ||
        url.username ||
        url.password
      )
        return {
          error:
            "Use a full product link without a username or password in it.",
        };
    } catch {
      return {
        error: "Use a full product link, like https://example.com.",
      };
    }
  }
  const source = input.source === undefined ? "waitlist" : input.source;
  if (source !== "waitlist" && source !== "hero" && source !== "footer")
    return { error: "Please submit from the Playground waitlist." };
  const contact = validateSignupContact(input);
  if ("error" in contact) return contact;
  return {
    signup: { name, productUrl, ...contact.contact, consent: true, source },
  };
}
