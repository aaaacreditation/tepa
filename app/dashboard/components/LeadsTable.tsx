"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  CHANNEL_COLOR,
  CHANNEL_SHORT,
  type Channel,
} from "@/lib/channels";
import {
  composeReason,
  DESTINATION_LABEL,
  type Destination,
  DISQUALIFY_REASONS,
  LEAD_STATUSES,
  MAX_REASON_LENGTH,
  NOT_QUALIFIED,
  STAGE_COLORS,
  STATUS_LABEL,
  isLeadStatus,
  type LeadStatus,
} from "@/lib/lead-status";
import { removeLead, setLeadNotes, setLeadReason, setLeadStatus } from "../lead-actions";

/* Mirrors the TEPA enquiry form field for field: full name, organization,
   work email, phone, country, website, and the programs textarea. Keep the
   two in step when the form changes. */
export type TableLead = {
  id: number;
  fullName: string;
  organization: string;
  email: string;
  phone: string;
  countryName: string;
  website: string;
  message: string;
  status: LeadStatus;
  /* Set only while the status is not qualified. */
  disqualifiedReason: string;
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
  /* The ad platform this lead is attributed to; see lib/channels.ts. */
  channel: Channel;
  uploads: TableUpload[];
};

export type TableEvent = { id: number; label: string };

/* One offline conversion upload to an ad platform for a single pipeline
   stage. A stage has one row per platform. */
export type TableUpload = {
  id: number;
  stage: LeadStatus;
  destination: Destination;
  status: "pending" | "sending" | "sent" | "failed" | "skipped";
  attempts: number;
  lastError: string;
  valueLabel: string;
  sentLabel: string;
};

const UPLOAD_LABEL: Record<TableUpload["status"], string> = {
  sent: "Sent",
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

const COLUMNS = 7;

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
    const c: Record<string, number> = { all: leads.length };
    for (const status of LEAD_STATUSES) c[status] = 0;
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
        lead.phone,
        lead.countryName,
        lead.website,
        lead.message,
        lead.disqualifiedReason,
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
          placeholder="Search name, organization, email, phone, country, website, programs"
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
              <th>Channel</th>
              <th>Received</th>
              <th>Stage</th>
              <th aria-label="Details" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={COLUMNS} className="py-10 text-center text-sm text-ink-500">
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

function ChannelBadge({ channel }: { channel: Channel }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-navy-50 px-2 py-0.5 text-xs font-medium text-ink-700">
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: CHANNEL_COLOR[channel] }}
      />
      {CHANNEL_SHORT[channel]}
    </span>
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
  /* Not qualified is chosen in the select but only committed once a reason has
     been given, so the pick is held here in the meantime. */
  const [askingReason, setAskingReason] = useState<"new" | "edit" | null>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const disqualified = lead.status === NOT_QUALIFIED;

  function changeStatus(value: string) {
    if (!isLeadStatus(value)) return;
    if (value === lead.status) {
      setAskingReason(null);
      return;
    }
    if (value === NOT_QUALIFIED) {
      setAskingReason("new");
      return;
    }
    setAskingReason(null);
    startTransition(async () => {
      await setLeadStatus(lead.id, value);
    });
  }

  function submitReason(reason: string) {
    startTransition(async () => {
      if (askingReason === "edit") await setLeadReason(lead.id, reason);
      else await setLeadStatus(lead.id, NOT_QUALIFIED, reason);
      setAskingReason(null);
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

  /* While a reason is being written the select shows the pick it is about to
     commit; cancelling puts it back, because the value is controlled. */
  const shownStatus: LeadStatus = askingReason === "new" ? NOT_QUALIFIED : lead.status;

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
          {lead.phone && <p className="text-xs text-ink-500">{lead.phone}</p>}
        </td>
        {/* Wraps rather than forcing the row wider: "United Arab Emirates" on
            two lines costs less than a horizontal scrollbar over the stage
            control. The campaign belongs to the same story but lives in the
            detail panel, where there is room to read it. */}
        <td className="text-ink-700">{lead.countryName || "—"}</td>
        <td>
          <ChannelBadge channel={lead.channel} />
        </td>
        <td className="whitespace-nowrap text-ink-700" title={lead.createdFull}>
          {lead.createdLabel}
        </td>
        <td onClick={(e) => e.stopPropagation()}>
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: STAGE_COLORS[shownStatus] }}
            />
            <select
              value={shownStatus}
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
          {disqualified && lead.disqualifiedReason && (
            <p
              className="mt-1 max-w-[10rem] truncate text-[0.6875rem] text-ink-500"
              title={lead.disqualifiedReason}
            >
              {lead.disqualifiedReason}
            </p>
          )}
        </td>
        <td className="text-ink-500">
          <span aria-hidden="true" className="inline-block text-xs">
            {open ? "▲" : "▼"}
          </span>
        </td>
      </tr>

      {askingReason && (
        <tr>
          <td colSpan={COLUMNS} className="!border-b-navy-500/12 bg-navy-50/60 !py-4">
            <ReasonForm
              leadId={lead.id}
              mode={askingReason}
              currentReason={lead.disqualifiedReason}
              busy={isPending}
              onSubmit={submitReason}
              onCancel={() => setAskingReason(null)}
            />
          </td>
        </tr>
      )}

      {open && (
        <tr>
          <td colSpan={COLUMNS} className="!border-b-navy-500/12 bg-navy-50/50 !py-5">
            <div className="grid gap-6 px-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <div className="space-y-5">
                <div>
                  <p className="dash-eyebrow text-navy-500">Programs for accreditation</p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                    {lead.message || "Left blank on the form."}
                  </p>
                </div>
                {disqualified && (
                  <div>
                    <p className="dash-eyebrow text-navy-500">Not qualified because</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-700">
                      {lead.disqualifiedReason || "No reason recorded."}
                    </p>
                    <button
                      type="button"
                      onClick={() => setAskingReason("edit")}
                      disabled={isPending}
                      className="dash-btn dash-btn-quiet mt-2 !px-4 !py-1.5 text-xs disabled:opacity-60"
                    >
                      Change reason
                    </button>
                  </div>
                )}
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
                      <dt className="w-24 shrink-0 text-ink-500">Phone</dt>
                      <dd>
                        {lead.phone ? (
                          <a
                            href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}
                            className="font-medium text-navy-500 hover:underline"
                          >
                            {lead.phone}
                          </a>
                        ) : (
                          /* Only leads captured before the phone field became
                             required can be missing one. */
                          <span className="text-ink-500">—</span>
                        )}
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
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 text-ink-500">Website</dt>
                      <dd>
                        {websiteHref ? (
                          <a
                            href={websiteHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-navy-500 hover:underline"
                          >
                            {lead.website}
                          </a>
                        ) : (
                          <span className="text-ink-500">—</span>
                        )}
                      </dd>
                    </div>
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
                      <dt className="w-24 shrink-0 text-ink-500">Channel</dt>
                      <dd className="text-ink-700">
                        <ChannelBadge channel={lead.channel} />
                      </dd>
                    </div>
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
                  <p className="dash-eyebrow text-navy-500">Ad platform conversions</p>
                  {lead.uploads.length === 0 ? (
                    <p className="mt-1.5 text-xs text-ink-500">
                      Nothing queued. Stages only report to a platform that is configured
                      for them.
                    </p>
                  ) : (
                    <ul className="mt-1.5 space-y-1.5 text-xs">
                      {lead.uploads.map((upload) => (
                        <li key={upload.id} className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-ink-700">
                            {STATUS_LABEL[upload.stage]}
                          </span>
                          <span className="text-ink-500">
                            {DESTINATION_LABEL[upload.destination]}
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

/* The reason a lead was rejected, asked for at the moment of rejecting it.
   A preset keeps the common answers countable; the detail box carries the
   specifics, and is the whole reason when the preset is "Other". */
function ReasonForm({
  leadId,
  mode,
  currentReason,
  busy,
  onSubmit,
  onCancel,
}: {
  leadId: number;
  mode: "new" | "edit";
  currentReason: string;
  busy: boolean;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}) {
  const [preset, setPreset] = useState("");
  const [detail, setDetail] = useState("");

  const needsDetail = preset === "Other";
  const reason = composeReason(preset, detail);
  const ready = Boolean(preset) && (!needsDetail || detail.trim().length > 0);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready || busy) return;
    onSubmit(reason);
  }

  return (
    <form onSubmit={submit} className="px-1">
      <p className="text-sm font-semibold text-ink-900">
        {mode === "edit" ? "Change the reason" : "Why is this lead not qualified?"}
      </p>
      <p className="mt-0.5 text-xs text-ink-500">
        {mode === "edit"
          ? `Currently: ${currentReason || "no reason recorded"}.`
          : "Required. This is what tells you later which ads are buying the wrong leads."}
      </p>

      <div className="mt-3 flex flex-wrap items-start gap-2">
        <label className="sr-only" htmlFor={`reason-preset-${leadId}`}>
          Reason
        </label>
        <select
          id={`reason-preset-${leadId}`}
          value={preset}
          onChange={(e) => setPreset(e.target.value)}
          required
          autoFocus
          className="dash-field max-w-[16rem] !py-2 text-sm"
        >
          <option value="">Select a reason…</option>
          {DISQUALIFY_REASONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor={`reason-detail-${leadId}`}>
          Detail
        </label>
        <input
          id={`reason-detail-${leadId}`}
          type="text"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          maxLength={MAX_REASON_LENGTH}
          placeholder={needsDetail ? "Say what happened (required)" : "Add detail (optional)"}
          className="dash-field max-w-sm !py-2 text-sm"
        />

        <button
          type="submit"
          disabled={!ready || busy}
          className="dash-btn dash-btn-navy !px-4 !py-2 text-xs disabled:opacity-50"
        >
          {mode === "edit" ? "Save reason" : "Mark not qualified"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="dash-btn dash-btn-quiet !px-4 !py-2 text-xs disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
