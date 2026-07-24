"use server";

import { refresh } from "next/cache";
import { getSession } from "@/lib/auth";
import {
  deleteLead,
  isLeadStatus,
  saveLeadNotes,
  updateLeadStatus,
} from "@/lib/leads";

async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

function validId(id: unknown): number {
  if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid lead id");
  }
  return id;
}

export async function setLeadStatus(id: number, status: string): Promise<void> {
  const session = await requireSession();
  if (!isLeadStatus(status)) throw new Error("Invalid status");
  await updateLeadStatus(validId(id), status, session.name || session.email);
  refresh();
}

export async function setLeadNotes(id: number, notes: string): Promise<void> {
  await requireSession();
  await saveLeadNotes(validId(id), String(notes).slice(0, 4000));
  refresh();
}

export async function removeLead(id: number): Promise<void> {
  await requireSession();
  await deleteLead(validId(id));
  refresh();
}
