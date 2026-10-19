import { validateContactDetails } from "@/lib/contact";
import { isValidWaitlistEmail } from "@/lib/email";

export type ContactMethod = "phone" | "linkedin" | "email";
export type SignupContact = {
  phone: string;
  socialProfile: string;
  email: string;
  contactMethod: ContactMethod;
};

function isSocialContact(value: string) {
  const profile = value.replace(/^LinkedIn:\s*/i, "");
  if (/^(?:[a-z][a-z0-9 .-]{0,30}:\s*)?@[a-z0-9_.-]{1,80}$/i.test(profile)) return true;
  try {
    const url = new URL(/^https?:\/\//i.test(profile) ? profile : `https://${profile}`);
    return ["http:", "https:"].includes(url.protocol) && url.hostname.includes(".") &&
      !url.username && !url.password && !/\s/.test(profile) &&
      !/^(?:javascript|data|file|vbscript):/i.test(profile);
  } catch {
    return false;
  }
}

export function validateSignupContact(
  input: Record<string, unknown>,
): { contact: SignupContact } | { error: string } {
  const validated = validateContactDetails(input);
  if ("error" in validated) return validated;
  const phone = validated.contact.phone || "";
  const socialProfile = validated.contact.socialProfile || "";
  if (socialProfile && !isSocialContact(socialProfile))
    return { error: "Add a LinkedIn or social profile link, or a handle with its platform name." };
  const rawEmail = input.email === undefined ? "" : input.email;
  if (typeof rawEmail !== "string" || rawEmail.length > 254 || /[\u0000-\u001f\u007f]/.test(rawEmail))
    return { error: "Please enter a valid email address." };
  const email = rawEmail.trim().toLowerCase();
  if (email && !isValidWaitlistEmail(email))
    return { error: "Please enter a valid email address." };
  const contactMethod = input.contactMethod ?? (phone ? "phone" : socialProfile ? "linkedin" : "email");
  if (contactMethod !== "phone" && contactMethod !== "linkedin" && contactMethod !== "email")
    return { error: "Choose how we can reach you." };
  if (!(contactMethod === "phone" ? phone : contactMethod === "linkedin" ? socialProfile : email))
    return { error: contactMethod === "linkedin" ? "Add your LinkedIn profile link." : contactMethod === "phone" ? "Add your phone number, including the country code." : "Add your email address." };
  return { contact: { phone, socialProfile, email, contactMethod } };
}
