import { redirect } from "next/navigation";
import { OwnerSignIn } from "@/components/sales/owner-view";
import { getSession } from "@/lib/auth/server";

export const metadata = { title: "Sign in" };

export default async function OwnerSignInPage({ searchParams }: PageProps<"/owner/sign-in">) {
  if (await getSession()) redirect("/owner");
  const { email, error } = await searchParams;
  return <OwnerSignIn email={typeof email === "string" ? email : ""} expired={typeof error === "string"} />;
}
