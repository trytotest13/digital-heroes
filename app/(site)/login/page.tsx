export const dynamic = "force-dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/user-forms";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/dashboard");

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-20">
      <p className="kicker mb-3 text-center">Welcome back</p>
      <h1 className="text-center font-display text-[30px] font-bold">Sign in</h1>
      <div className="card mt-8 p-6 sm:p-8">
        <LoginForm />
        <p className="mt-5 text-center text-[13px] text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-pine hover:underline">Create one</Link>
        </p>
      </div>

      <div className="card mt-6 bg-white/60 p-4 text-[12px] leading-relaxed text-muted">
        <p className="kicker mb-1.5">Test accounts</p>
        <p><span className="font-semibold text-body">Player:</span> player@digitalheroes.test · Player#2026</p>
        <p><span className="font-semibold text-body">Admin:</span> admin@digitalheroes.test · Admin#2026</p>
      </div>
    </div>
  );
}
