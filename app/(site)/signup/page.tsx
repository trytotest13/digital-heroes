import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listCharities } from "@/lib/charities";
import { SignupForm } from "@/components/user-forms";

export const metadata = { title: "Create account" };

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const charities = await listCharities();

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-20">
      <p className="kicker mb-3 text-center">Step 1 of 2</p>
      <h1 className="text-center font-display text-[30px] font-bold">Create your account</h1>
      <p className="mt-2 text-center text-[14px] text-muted">
        Pick your plan next — you&apos;ll be in this month&apos;s draw.
      </p>
      <div className="card mt-8 p-6 sm:p-8">
        <SignupForm charities={charities.map((c) => ({ id: c.id, name: c.name, tagline: c.tagline }))} />
        <p className="mt-5 text-center text-[13px] text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-pine hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
