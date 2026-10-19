import { validateSignupContact, type SignupContact } from "@/lib/signup-contact";
import { validateResume, type ResumeAttachment } from "@/lib/resume";

export type TesterSignup = SignupContact & {
  name: string;
  role: string;
  company: string;
  expertise: string;
  resume?: ResumeAttachment;
  consent: true;
  source: "become-tester";
};

export function validateTester(input: Record<string, unknown>): { signup: TesterSignup } | { error: string } {
  const contact = validateSignupContact(input);
  if ("error" in contact) return contact;
  if (input.consent !== true)
    return { error: "Please agree to be contacted about tester opportunities." };
  if (input.source !== undefined && input.source !== "become-tester")
    return { error: "Please apply through the tester signup page." };
  const fields = {} as Pick<TesterSignup, "name" | "role" | "company" | "expertise">;
  for (const [key, limit] of [["name", 100], ["role", 150], ["company", 150], ["expertise", 1000]] as const) {
    const value = input[key] ?? "";
    if (typeof value !== "string" || value.length > limit || (key === "expertise" ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/ : /[\u0000-\u001f\u007f]/).test(value))
      return { error: `Please enter valid ${key === "expertise" ? "testing interests" : key} details.` };
    fields[key] = value.trim();
  }
  if (!fields.name || !fields.role)
    return { error: "Please add your name and what you do so we can match you to relevant tests." };
  const attachment = validateResume(input.resume);
  if ("error" in attachment) return attachment;
  return { signup: { ...fields, ...contact.contact, ...attachment, consent: true, source: "become-tester" } };
}
