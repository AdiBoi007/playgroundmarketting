import { useId, useState } from "react";
import type { ContactMethod } from "@/lib/signup-contact";

const methods = [
  { value: "linkedin", title: "LinkedIn", detail: "Share your profile" },
  { value: "phone", title: "Phone", detail: "Use your number" },
  { value: "email", title: "Email", detail: "Use email" },
] as const;

export function ContactChoice({ disabled, backgroundProfile = false }: { disabled?: boolean; backgroundProfile?: boolean }) {
  const id = useId();
  const [method, setMethod] = useState<ContactMethod>("linkedin");
  return (
    <div className="signup-contact" role="group" aria-labelledby={`${id}-title`}>
      <p className="signup-section-label" id={`${id}-title`}>How can we reach you?</p>
      <div className="contact-choices" role="radiogroup" aria-label="Preferred contact method">
        {methods.map((option) => (
          <label className="contact-choice" key={option.value}>
            <input
              type="radio"
              name="contactMethod"
              value={option.value}
              checked={method === option.value}
              onChange={() => setMethod(option.value)}
              disabled={disabled}
            />
            <span className="contact-choice-title">{option.title}</span>{" "}
            <span className="contact-choice-detail" aria-hidden="true">{option.detail}</span>
          </label>
        ))}
      </div>
      <div hidden={method !== "phone"}>
        <label className="waitlist-field" htmlFor={`${id}-phone`}>Phone number</label>
        <input className="signup-input" id={`${id}-phone`} name="phone" type="tel" autoComplete="tel"
          placeholder="+61 412 345 678" maxLength={50} required={method === "phone"}
          disabled={disabled || method !== "phone"} aria-describedby={`${id}-phone-note`} />
        <p className="signup-field-note" id={`${id}-phone-note`}>Include your country code, for example +61.</p>
      </div>
      <div hidden={method !== "email"}>
        <label className="waitlist-field" htmlFor={`${id}-email`}>Email</label>
        <input className="signup-input" id={`${id}-email`} name="email" type="email" autoComplete="email"
          placeholder="you@example.com" maxLength={254} required={method === "email"}
          disabled={disabled || method !== "email"} />
      </div>
      <div hidden={!backgroundProfile && method !== "linkedin"} className="signup-profile">
        <label className="waitlist-field" htmlFor={`${id}-profile`}>
          {method === "linkedin" ? "LinkedIn profile" : "LinkedIn profile (optional)"}
        </label>
        <input className="signup-input" id={`${id}-profile`} name="socialProfile" type="text"
          autoCapitalize="none" autoCorrect="off" spellCheck={false}
          placeholder="linkedin.com/in/you" maxLength={500} required={method === "linkedin"}
          disabled={disabled || (!backgroundProfile && method !== "linkedin")} aria-describedby={`${id}-profile-note`} />
        <p className="signup-field-note" id={`${id}-profile-note`}>
          {method === "linkedin" ? "Paste your profile link. Another social profile works too." : `Help us match tests to your experience. We’ll contact you by ${method}.`}
        </p>
      </div>
    </div>
  );
}
