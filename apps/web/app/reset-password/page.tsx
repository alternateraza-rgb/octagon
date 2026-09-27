import { AuthCard } from "@/components/auth/auth-card";
import { ResetForm } from "@/components/auth/reset-form";

export const metadata = { title: "Choose a new password" };

// Better Auth sends people here as /reset-password?token=… (or ?error=INVALID_TOKEN).
export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token, error } = await searchParams;
  return (
    <AuthCard title="Choose a new password" subtitle="You'll use it to log in from now on. Other devices will be signed out.">
      <ResetForm token={typeof token === "string" ? token : null} invalid={typeof error === "string"} />
    </AuthCard>
  );
}
