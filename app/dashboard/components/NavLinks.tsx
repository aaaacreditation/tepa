"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LandingPageSource } from "@/lib/sources";

export function NavLinks({ sources }: { sources: LandingPageSource[] }) {
  const pathname = usePathname();

  return (
    <ul className="space-y-1">
      {sources.map((source) => {
        const href = `/dashboard/${source.key}`;
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <li key={source.key}>
            <Link href={href} className="dash-nav-link" data-active={active}>
              <span
                aria-hidden="true"
                className="grid h-6 w-6 place-items-center rounded-md bg-white/10 text-[0.625rem] font-bold tracking-wide"
              >
                {source.label.slice(0, 2)}
              </span>
              {source.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
