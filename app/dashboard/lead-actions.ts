"use server";

import { refresh } from "next/cache";
import { after } from "next/server";
import { getSession } from "@/lib/auth";
import { drainConversions, enqueueStageAndBackfill } from "@/lib/conversions";
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

  const leadId = validId(id);
  const changed = await updateLeadStatus(leadId, status, session.name || session.email);

  /* Report the new stage to Google Ads. Only a real transition queues anything,
     so re-picking the status a lead already has stays a no-op, and the outbox
     dedupes a demote and re-promote back to the same stage. */
  if (changed) {
    const queued = await enqueueStageAndBackfill(leadId, status);
    if (queued > 0) {
      /* Drained after the response: moving a lead should feel instant, and an
         upload failure belongs in the outbox where it can be retried, not in
         the face of whoever was updating the pipeline. */
      after(async () => {
        try {
          await drainConversions(10);
        } catch (error) {
          console.error("[lead-actions] conversion drain failed", error);
        }
      });
    }
  }

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
