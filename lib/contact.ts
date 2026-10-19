export type ContactDetails = {
  phone?: string;
  socialProfile?: string;
};

export function validateContactDetails(
  input: Record<string, unknown>,
): { contact: ContactDetails } | { error: string } {
  const optional = (key: string, limit: number) => {
    const value = input[key];
    if (value === undefined) return "";
    if (
      typeof value !== "string" ||
      value.length > limit ||
      /[\u0000-\u001f\u007f]/.test(value)
    )
      return null;
    return value.trim();
  };
  const phone = optional("phone", 50);
  const socialProfile = optional("socialProfile", 500);
  if (
    phone === null ||
    (phone &&
      (!/^\+?[\d\s().-]+(?:(?:ext\.?|x|#)\s*\d{1,8})?$/i.test(phone) ||
        phone.replace(/\D/g, "").length < 5))
  )
    return { error: "Please enter a valid phone number, or leave it blank." };
  if (socialProfile === null)
    return {
      error: "Please enter a social profile link or handle up to 500 characters, or leave it blank.",
    };
  return { contact: { phone, socialProfile } };
}
