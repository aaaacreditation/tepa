import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SOURCES } from "@/lib/sources";
import { logout } from "../auth-actions";
import { NavLinks } from "../components/NavLinks";

export default async function DashboardShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  if (!session) redirect("/dashboard/login");

  const sources = Object.values(SOURCES);

  return (
    <div className="dash-shell">
      <aside className="dash-aside">
        <div className="flex items-center gap-3 px-5 pb-5 pt-6">
          <Image
            src="/tepa/aaa-logo-light.png"
            alt=""
            width={40}
            height={40}
            className="h-9 w-auto"
          />
          <div>
            <p className="dash-display text-[1.05rem] leading-tight text-white">Lead Desk</p>
            <p className="text-[0.6875rem] text-white/55">American Accreditation Association</p>
          </div>
        </div>

        <nav className="flex-1 px-3 lg:mt-2">
          <p className="dash-eyebrow px-3 pb-2 text-gold-300/90">Landing pages</p>
          <NavLinks sources={sources} />
        </nav>

        <div className="border-t border-white/10 px-5 py-4">
          <p className="truncate text-sm font-medium text-white">{session.name}</p>
          <p className="truncate text-xs text-white/55">{session.email}</p>
          <form action={logout} className="mt-3">
            <button
              type="submit"
              className="w-full rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:border-white/35 hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 px-5 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  );
}
