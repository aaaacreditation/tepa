"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  LEAD_STATUSES,
  STAGE_COLORS,
  STATUS_LABEL,
  isLeadStatus,
  type LeadStatus,
} from "@/lib/lead-status";
import { removeLead, setLeadNotes, setLeadStatus } from "../lead-actions";

/* Mirrors the TEPA enquiry form field for field: full name, organization,
   work email, country, website, and the programs textarea. Keep the two in
   step when the form changes. */
export type TableLead = {
  id: number;
  fullName: string;
  organization: string;
  email: string;
  countryName: string;
  website: string;
  message: string;
  status: LeadStatus;
  notes: string;
  isDemo: boolean;
  createdLabel: string;
  createdFull: string;
  statusChangedFull: string;
  /* Whichever ad click identifier the visitor arrived with, if any. */
  clickId: string;
  campaign: string;
  utmSource: string;
  utmMedium: string;
  uploads: TableUpload[];
};

export type TableEvent = { id: number; label: string };

/* One offline conversion upload to Google Ads for a single pipeline stage. */
export type TableUpload = {
  id: number;
  stage: LeadStatus;
  status: "pending" | "sending" | "sent" | "failed" | "skipped";
  attempts: number;
  lastError: string;
  valueLabel: string;
  sentLabel: string;
};

const UPLOAD_LABEL: Record<TableUpload["status"], string> = {
  sent: "Sent to Google Ads",
  sending: "Sending",
  pending: "Queued",
  failed: "Failed",
  skipped: "Not sent",
};

/* State colors, not brand colors. Green and red are held to the same green the
   notes control already uses, gold carries "waiting" so it reads as part of the
   accreditation palette, and an unsent stage falls back to the quiet navy wash
   rather than shouting. */
const UPLOAD_TONE: Record<TableUpload["status"], string> = {
  sent: "bg-[#e8f5ee] text-[#1e7f4f]",
  sending: "bg-gold-100 text-gold-600",
  pending: "bg-gold-100 text-gold-600",
  failed: "bg-[#fdecec] text-[#a32020]",
  skipped: "bg-navy-50 text-ink-500",
};

export function LeadsTable({
  leads,
  events,
}: {
  leads: TableLead[];
  events: Record<number, TableEvent[]>;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LeadStatus>("all");
  const [openId, setOpenId] = useState<number | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: leads.length, lead: 0, mql: 0, sql: 0, customer: 0 };
    for (const lead of leads) c[lead.status] += 1;
    return c;
  }, [leads]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return leads.filter((lead) => {
      if (statusFilter !== "all" && lead.status !== statusFilter) return false;
      if (!needle) return true;
      return [
        lead.fullName,
        lead.organization,
        lead.email,
        lead.countryName,
        lead.website,
        lead.message,
      ].some((field) => field.toLowerCase().includes(needle));
    });
  }, [leads, query, statusFilter]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border-b border-navy-500/10 px-5 py-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, organization, email, country, website, programs"
          aria-label="Search leads"
          className="dash-field max-w-xs !py-2 text-sm"
        />
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by stage">
          <button
            type="button"
            className="dash-chip"
            data-active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
          >
            All <span className="opacity-60">{counts.all}</span>
          </button>
          {LEAD_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              className="dash-chip"
              data-active={statusFilter === status}
              onClick={() => setStatusFilter(status)}
            >
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full"
                style={{ background: STAGE_COLORS[status] }}
              />
              {STATUS_LABEL[status]} <span className="opacity-60">{counts[status]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Lead</th>
              <th>Contact</th>
              <th>Country</th>
              <th>Received</th>
              <th>Stage</th>
              <th aria-label="Details" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-ink-500">
                  {leads.length === 0
                    ? "No leads in this range yet. New form enquiries land here the moment they arrive."
                    : "No leads match this search."}
                </td>
              </tr>
            )}
            {filtered.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                events={events[lead.id] ?? []}
                open={openId === lead.id}
                onToggle={() => setOpenId(openId === lead.id ? null : lead.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <p className="px-5 py-3 text-xs text-ink-500">
        Showing {filtered.length.toLocaleString("en-US")} of {leads.length.toLocaleString("en-US")}{" "}
        leads in this range.
      </p>
    </div>
  );
}

function LeadRow({
  lead,
  events,
  open,
  onToggle,
}: {
  lead: TableLead;
  events: TableEvent[];
  open: boolean;
  onToggle: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function changeStatus(value: string) {
    if (!isLeadStatus(value) || value === lead.status) return;
    startTransition(async () => {
      await setLeadStatus(lead.id, value);
    });
  }

  function saveNotes() {
    const value = notesRef.current?.value ?? "";
    startTransition(async () => {
      await setLeadNotes(lead.id, value);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
    });
  }

  function onDelete() {
    if (!confirming) {
      setConfirming(true);
      confirmTimer.current = setTimeout(() => setConfirming(false), 4000);
      return;
    }
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    startTransition(async () => {
      await removeLead(lead.id);
    });
  }

  const websiteHref = lead.website
    ? lead.website.startsWith("http")
      ? lead.website
      : `https://${lead.website}`
    : null;

  return (
    <>
      <tr
        className="dash-row"
        data-open={open}
        onClick={onToggle}
        aria-expanded={open}
        style={isPending ? { opacity: 0.55 } : undefined}
      >
        <td>
          <p className="font-semibold text-ink-900">
            {lead.fullName}
            {lead.isDemo && (
              <span className="ml-2 rounded bg-gold-100 px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-gold-600">
                demo
              </span>
            )}
          </p>
          <p className="text-xs text-ink-500">{lead.organization}</p>
          {websiteHref && (
            <a
              href={websiteHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-medium text-navy-500 hover:underline"
            >
              {lead.website}
            </a>
          )}
        </td>
        <td>
          <p className="text-ink-700">{lead.email}</p>
        </td>
        <td className="whitespace-nowrap text-ink-700">{lead.countryName || "—"}</td>
        <td className="whitespace-nowrap text-ink-700" title={lead.createdFull}>
          {lead.createdLabel}
        </td>
        <td onClick={(e) => e.stopPropagation()}>
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: STAGE_COLORS[lead.status] }}
            />
            <select
              key={lead.status}
              defaultValue={lead.status}
              disabled={isPending}
              onChange={(e) => changeStatus(e.target.value)}
              className="dash-status"
              aria-label={`Stage for ${lead.fullName}`}
            >
              {LEAD_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          </span>
        </td>
        <td className="text-ink-500">
          <span aria-hidden="true" className="inline-block text-xs">
            {open ? "▲" : "▼"}
          </span>
        </td>
      </tr>

      {open && (
        <tr>
          <td colSpan={6} className="!border-b-navy-500/12 bg-navy-50/50 !py-5">
            <div className="grid gap-6 px-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <div className="space-y-5">
                <div>
                  <p className="dash-eyebrow text-navy-500">Programs for accreditation</p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                    {lead.message || "Left blank on the form."}
                  </p>
                </div>
                <div>
                  <label className="dash-eyebrow text-navy-500" htmlFor={`notes-${lead.id}`}>
                    Notes
                  </label>
                  <textarea
                    id={`notes-${lead.id}`}
                    ref={notesRef}
                    defaultValue={lead.notes}
                    rows={3}
                    placeholder="Calls, context, next steps"
                    className="dash-field mt-1.5 resize-y text-sm"
                  />
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={saveNotes}
                      disabled={isPending}
                      className="dash-btn dash-btn-navy !px-4 !py-1.5 text-xs disabled:opacity-60"
                    >
                      Save notes
                    </button>
                    {notesSaved && <span className="text-xs font-medium text-[#1e7f4f]">Saved</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="dash-eyebrow text-navy-500">Details</p>
                  <dl className="mt-2 space-y-1.5 text-[0.8125rem]">
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 text-ink-500">Email</dt>
                      <dd>
                        <a href={`mailto:${lead.email}`} className="font-medium text-navy-500 hover:underline">
                          {lead.email}
                        </a>
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 text-ink-500">Organization</dt>
                      <dd className="text-ink-700">{lead.organization}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 text-ink-500">Country</dt>
                      <dd className="text-ink-700">{lead.countryName || "—"}</dd>
                    </div>
                    {websiteHref && (
                      <div className="flex gap-2">
                        <dt className="w-24 shrink-0 text-ink-500">Website</dt>
                        <dd>
                          <a
                            href={websiteHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-navy-500 hover:underline"
                          >
                            {lead.website}
                          </a>
                        </dd>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 text-ink-500">Received</dt>
                      <dd className="text-ink-700">{lead.createdFull}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 text-ink-500">Stage since</dt>
                      <dd className="text-ink-700">{lead.statusChangedFull}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <p className="dash-eyebrow text-navy-500">Ad attribution</p>
                  <dl className="mt-2 space-y-1.5 text-[0.8125rem]">
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 text-ink-500">Click ID</dt>
                      <dd className="min-w-0 break-all text-ink-700">
                        {lead.clickId ? (
                          <code className="text-[0.75rem]">{lead.clickId}</code>
                        ) : (
                          /* No click id means Google can only match this lead
                             through the hashed email, which is weaker. */
                          <span className="text-ink-500">None — not from a tracked ad click</span>
                        )}
                      </dd>
                    </div>
                    {lead.campaign && (
                      <div className="flex gap-2">
                        <dt className="w-24 shrink-0 text-ink-500">Campaign</dt>
                        <dd className="text-ink-700">{lead.campaign}</dd>
                      </div>
                    )}
                    {(lead.utmSource || lead.utmMedium) && (
                      <div className="flex gap-2">
                        <dt className="w-24 shrink-0 text-ink-500">Source</dt>
                        <dd className="text-ink-700">
                          {[lead.utmSource, lead.utmMedium].filter(Boolean).join(" / ")}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div>
                  <p className="dash-eyebrow text-navy-500">Google Ads conversions</p>
                  {lead.uploads.length === 0 ? (
                    <p className="mt-1.5 text-xs text-ink-500">
                      Nothing queued. Stages only report when a conversion action is configured
                      for them.
                    </p>
                  ) : (
                    <ul className="mt-1.5 space-y-1.5 text-xs">
                      {lead.uploads.map((upload) => (
                        <li key={upload.id} className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-ink-700">
                            {STATUS_LABEL[upload.stage]}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 font-medium ${UPLOAD_TONE[upload.status]}`}
                          >
                            {UPLOAD_LABEL[upload.status]}
                          </span>
                          <span className="text-ink-500">{upload.valueLabel}</span>
                          {upload.sentLabel && (
                            <span className="text-ink-500">{upload.sentLabel}</span>
                          )}
                          {/* The reason a conversion never landed is the whole
                              point of showing this, so it is not truncated. */}
                          {upload.status !== "sent" && upload.lastError && (
                            <span className="w-full break-words text-ink-500">
                              {upload.lastError}
                              {upload.attempts > 1 && ` (${upload.attempts} attempts)`}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <p className="dash-eyebrow text-navy-500">History</p>
                  {events.length === 0 ? (
                    <p className="mt-1.5 text-xs text-ink-500">No stage changes yet.</p>
                  ) : (
                    <ul className="mt-1.5 space-y-1 text-xs text-ink-700">
                      {events.map((event) => (
                        <li key={event.id}>{event.label}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onDelete}
                  disabled={isPending}
                  className="dash-btn dash-btn-quiet !px-4 !py-1.5 text-xs disabled:opacity-60"
                  style={confirming ? { borderColor: "#b3392e", color: "#b3392e" } : undefined}
                >
                  {confirming ? "Click again to delete permanently" : "Delete lead"}
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
