import { redirect } from "next/navigation";
import { SOURCES } from "@/lib/sources";

export default function DashboardIndex() {
  const first = Object.keys(SOURCES)[0];
  redirect(`/dashboard/${first}`);
}
