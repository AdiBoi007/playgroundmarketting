import { useId } from "react";

export function ContactFields({ disabled = false }: { disabled?: boolean }) {
  const id = useId();
  return (
    <div className="contact-fields" role="group" aria-labelledby={`${id}-title`}>
      <p className="contact-fields-title" id={`${id}-title`}>
        Another way to reach you
      </p>
      <p className="contact-fields-intro">
        Optional. Share a number or social profile for follow-up. Launch updates
        will go to your email.
      </p>
      <div className="contact-field">
        <label htmlFor={`${id}-phone`}>Phone number (optional)</label>
        <input
          id={`${id}-phone`}
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+61 412 345 678"
          maxLength={50}
          disabled={disabled}
          aria-describedby={`${id}-phone-hint`}
        />
        <span className="contact-field-hint" id={`${id}-phone-hint`}>
          Include your country code if you can.
        </span>
      </div>
      <div className="contact-field">
        <label htmlFor={`${id}-social`}>LinkedIn or social profile (optional)</label>
        <input
          id={`${id}-social`}
          name="socialProfile"
          type="text"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Profile link or @handle"
          maxLength={500}
          disabled={disabled}
          aria-describedby={`${id}-social-hint`}
        />
        <span className="contact-field-hint" id={`${id}-social-hint`}>
          LinkedIn, Instagram, X, or any other platform. Add a link, or a handle
          with the platform name.
        </span>
      </div>
    </div>
  );
}
