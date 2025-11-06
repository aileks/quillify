import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/server/auth";
import { LoginForm } from "@/components/auth/login-form";

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

async function LoginContent({ searchParams }: LoginPageProps) {
  const session = await auth();
  const resolvedParams = await searchParams;
  const callbackUrl = resolvedParams.callbackUrl || "/";

  // If user is already logged in, redirect to callback URL
  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <LoginForm callbackUrl={callbackUrl} />
    </div>
  );
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}
