import { SignupForm } from "@/components/SignupForm";

export function WaitlistForm({ available }: { available: boolean }) {
  return <SignupForm available={available} />;
}
