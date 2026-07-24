import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="dash-login">
      <div className="w-full max-w-sm">
        <div className="dash-card overflow-hidden">
          <div className="border-b border-navy-500/10 px-8 pb-6 pt-8 text-center">
            <Image
              src="/tepa/aaa-logo.png"
              alt="American Accreditation Association"
              width={72}
              height={72}
              className="mx-auto h-14 w-auto"
              priority
            />
            <p className="dash-eyebrow mt-4 text-gold-600">AAA Lead Desk</p>
            <h1 className="dash-display mt-1.5 text-2xl text-navy-800">Sign in</h1>
          </div>
          <div className="px-8 py-7">
            <LoginForm />
          </div>
        </div>
        <p className="mt-5 text-center text-xs text-white/60">
          Internal tool for the campaign team. Access is by invitation.
        </p>
      </div>
    </div>
  );
}
