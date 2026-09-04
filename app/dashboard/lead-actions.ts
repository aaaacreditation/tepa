"use server";

import { refresh } from "next/cache";
import { after } from "next/server";
import { getSession } from "@/lib/auth";
import { drainConversions, enqueueStageAndBackfill } from "@/lib/conversions";
import {
  MAX_REASON_LENGTH,
  NOT_QUALIFIED,
} from "@/lib/lead-status";
import {
  deleteLead,
  isLeadStatus,
  saveDisqualifiedReason,
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

/* A server action is reachable by POST on its own, so the reason is required
   here and not only by the form that collects it. Marking a lead not qualified
   without one would leave the pipeline exactly as uninformative as the MQL
   rubber stamp this status exists to relieve. */
function validReason(reason: unknown): string {
  const text = typeof reason === "string" ? reason.trim().slice(0, MAX_REASON_LENGTH) : "";
  if (!text) throw new Error("A reason is required to mark a lead not qualified");
  return text;
}

export async function setLeadStatus(
  id: number,
  status: string,
  reason?: string,
): Promise<void> {
  const session = await requireSession();
  if (!isLeadStatus(status)) throw new Error("Invalid status");

  const leadId = validId(id);
  const text = status === NOT_QUALIFIED ? validReason(reason) : "";
  const changed = await updateLeadStatus(leadId, status, session.name || session.email, text);

  /* Report the new stage to Google Ads. Only a real transition queues anything,
     so re-picking the status a lead already has stays a no-op, and the outbox
     dedupes a demote and re-promote back to the same stage. Not qualified
     queues nothing at all; see enqueueStageAndBackfill. */
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

/* Rewording the reason on a lead that is already not qualified. */
export async function setLeadReason(id: number, reason: string): Promise<void> {
  await requireSession();
  await saveDisqualifiedReason(validId(id), validReason(reason));
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
