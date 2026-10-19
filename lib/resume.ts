export const MAX_RESUME_BYTES = 2 * 1024 * 1024;
export const MAX_RESUME_BASE64_LENGTH = 4 * Math.ceil(MAX_RESUME_BYTES / 3);
export const RESUME_ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export type ResumeAttachment = {
  name: string;
  contentType: string;
  base64: string;
};

export function resumeFileError(name: string, size: number): string | undefined {
  if (!/\.(pdf|docx)$/i.test(name)) return "Please attach your résumé as a PDF or DOCX file.";
  if (!size || size > MAX_RESUME_BYTES) return "Please choose a résumé up to 2 MB. Empty files cannot be attached.";
}

export function validateResume(input: unknown): { resume?: ResumeAttachment } | { error: string } {
  if (input === undefined) return {};
  if (!input || typeof input !== "object" || Array.isArray(input))
    return { error: "Please choose your résumé file again." };
  const file = input as Record<string, unknown>;
  if (typeof file.name !== "string" || !file.name.trim() || file.name.length > 150 || /[\u0000-\u001f\u007f/\\]/.test(file.name))
    return { error: "Please use a résumé filename under 150 characters without special control characters." };
  if (typeof file.base64 !== "string" || !file.base64 || file.base64.length > MAX_RESUME_BASE64_LENGTH ||
    file.base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(file.base64))
    return { error: "Please attach a valid PDF or DOCX résumé up to 2 MB." };
  let bytes: string;
  try { bytes = atob(file.base64); }
  catch { return { error: "Please choose your résumé file again." }; }
  const sizeError = resumeFileError(file.name, bytes.length);
  if (sizeError) return { error: sizeError };
  const pdf = /\.pdf$/i.test(file.name);
  const contentType = pdf ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (typeof file.contentType !== "string" ||
    (file.contentType && file.contentType !== "application/octet-stream" && file.contentType !== contentType) ||
    (pdf ? !bytes.startsWith("%PDF-") : !bytes.startsWith("PK\u0003\u0004") || !bytes.includes("[Content_Types].xml") || !bytes.includes("word/document.xml")))
    return { error: "This file doesn’t match its PDF or DOCX format. Please choose your résumé again." };
  return { resume: { name: file.name.trim(), contentType, base64: file.base64 } };
}
