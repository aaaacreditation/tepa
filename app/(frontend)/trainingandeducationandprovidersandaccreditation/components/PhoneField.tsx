"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { countries, dialCodes, flagEmoji } from "@/lib/countries";

/* Country code, then the number.

   Most of the unreachable leads on /tepa typed a local number with no country
   code, which an assessor calling from the US cannot dial. Asking for "+ country
   code and number" in a placeholder did not fix it, so the code stops being
   something to remember and becomes something to pick: the field cannot hold a
   number without one.

   The list opens in place rather than floating over the card. The form card
   clips to its rounded corners with overflow:hidden, so an absolutely
   positioned menu would be cut off; pushing the fields down costs a little
   movement and works everywhere, including on a phone. */

export type PhoneValue = { region: string; number: string };

const OPTIONS = countries
  .map(([code, name]) => ({ code, name, dial: dialCodes[code] ?? "" }))
  .filter((option) => option.dial !== "");

/* Digits only, so "(050) 123-4567" and "050 123 4567" are the same number. */
export function phoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/* Italy keeps the leading zero of a landline inside the international number —
   +39 06 … is correct — and the Vatican dials on Italy's plan. Everywhere else
   in this list the leading zero is a trunk prefix used only for domestic
   dialling, and keeping it produces a number that will not connect. People
   type their number the way they dial it at home, so this is the common case,
   not an edge one. */
const KEEPS_TRUNK_ZERO = new Set(["IT", "VA"]);

function withoutTrunkZero(region: string, digits: string): string {
  return KEEPS_TRUNK_ZERO.has(region) ? digits : digits.replace(/^0+/, "");
}

/* Every dial code in the list. International codes are designed so that none
   is the start of another, so the first match is the only match; sorting the
   longest first just keeps that true if the table ever grows an exception. */
const DIALS_LONGEST_FIRST = [...new Set(Object.values(dialCodes))]
  .filter(Boolean)
  .sort((a, b) => b.length - a.length);

/* Plenty of people type their number the international way out of habit,
   "+91 98765 43210" or "00971 50 …", even with the code already picked beside
   it. Read a leading + or 00 as the whole international number. Without this
   the picked code was added again in front of the typed one and sales got
   +91 919876543210, a number that cannot be dialled. */
function typedInternational(number: string): string | null {
  const trimmed = number.trim();
  if (trimmed.startsWith("+")) return phoneDigits(trimmed);
  if (trimmed.startsWith("00")) return phoneDigits(trimmed).slice(2);
  return null;
}

/* The dial code and the national part of what was entered. When the typed
   international code differs from the picker, the typed one wins: it is what
   the person would dial, and the picker may only hold the browser's guess. */
function resolvePhone(value: PhoneValue): { dial: string; national: string } {
  const intl = typedInternational(value.number);
  if (intl === null) {
    return {
      dial: dialCodes[value.region] ?? "",
      national: withoutTrunkZero(value.region, phoneDigits(value.number)),
    };
  }
  const picked = dialCodes[value.region];
  if (picked && intl.startsWith(picked)) {
    return { dial: picked, national: withoutTrunkZero(value.region, intl.slice(picked.length)) };
  }
  const dial = DIALS_LONGEST_FIRST.find((code) => intl.startsWith(code));
  if (!dial) return { dial: "", national: intl };
  return { dial, national: intl.slice(dial.length).replace(/^0+/, "") };
}

export function nationalDigits(value: PhoneValue): string {
  return resolvePhone(value).national;
}

/* The same 8-to-15 digit rule the field has always applied, now counted over
   the assembled number rather than over whatever was typed. Picking from the
   list guarantees a country code; it says nothing about whether the rest of
   the number is complete, which is what this still catches. */
export function validPhone(value: PhoneValue): boolean {
  const { dial, national } = resolvePhone(value);
  if (!dial || national.length === 0) return false;
  const total = dial.length + national.length;
  return total >= 8 && total <= 15;
}

/* Spaced for a human reading the dashboard. Both ad platforms strip the
   space before hashing, so the same string serves for matching. */
export function formatPhone(value: PhoneValue): string {
  const { dial, national } = resolvePhone(value);
  return dial ? `+${dial} ${national}` : "";
}

/* The browser's own region is a better first guess than none, and it is only a
   guess — the picker is one tap away either side of it. */
export function guessRegion(): string {
  try {
    const locales = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const tag of locales) {
      const region = new Intl.Locale(tag).maximize().region;
      if (region && dialCodes[region]) return region;
    }
  } catch {
    /* Intl.Locale is missing or the tag is malformed; fall through. */
  }
  return "";
}

type PhoneFieldProps = {
  id: string;
  value: PhoneValue;
  onChange: (value: PhoneValue) => void;
  error?: string;
  label?: string;
};

export function PhoneField({
  id,
  value,
  onChange,
  error,
  label = "Phone, with country code",
}: PhoneFieldProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = OPTIONS.find((option) => option.code === value.region) ?? null;

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return OPTIONS;
    /* Searching "+971", "971" and "united arab" all have to land. */
    const digits = term.replace(/\D/g, "");
    return OPTIONS.filter(
      (option) =>
        option.name.toLowerCase().includes(term) ||
        option.code.toLowerCase() === term ||
        (digits !== "" && option.dial.startsWith(digits)),
    );
  }, [search]);

  /* Derived rather than stored, so filtering the list down can never leave
     the cursor pointing past the end of it. */
  const activeIndex = matches.length === 0 ? -1 : Math.min(cursor, matches.length - 1);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  /* Reopening starts on the country already chosen, not at Afghanistan.
     Search is cleared first, so the list is the full one and its indexes and
     OPTIONS' line up. */
  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setSearch("");
    setCursor(Math.max(0, OPTIONS.findIndex((option) => option.code === value.region)));
    setOpen(true);
  }

  function choose(code: string) {
    onChange({ ...value, region: code });
    setOpen(false);
    setSearch("");
  }

  function onSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor(Math.min(activeIndex + 1, matches.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor(Math.max(activeIndex - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = matches[activeIndex];
      if (option) choose(option.code);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  const errorId = `${id}-error`;

  return (
    <div className="form-field bk-field bk-phone" ref={rootRef}>
      <label htmlFor={id}>
        {label}
        <span className="bk-req" aria-hidden="true">
          *
        </span>
      </label>

      <div className="bk-phone-row" data-invalid={Boolean(error)}>
        <button
          type="button"
          className="bk-phone-code"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-label={
            selected
              ? `Country code: ${selected.name}, plus ${selected.dial}. Change it.`
              : "Choose a country code"
          }
          onClick={toggle}
        >
          <span className="bk-phone-flag" aria-hidden="true">
            {selected ? flagEmoji(selected.code) : "🌐"}
          </span>
          <span className="bk-phone-dial">{selected ? `+${selected.dial}` : "Code"}</span>
          <span className="bk-phone-caret" aria-hidden="true" />
        </button>

        <input
          id={id}
          name="phoneNumber"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="Phone number"
          value={value.number}
          onChange={(event) => onChange({ ...value, number: event.target.value })}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
      </div>

      {open && (
        <div className="bk-phone-menu">
          <input
            ref={searchRef}
            type="text"
            className="bk-phone-search"
            placeholder="Search country or code"
            aria-label="Search for a country or dialling code"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCursor(0);
            }}
            onKeyDown={onSearchKeyDown}
          />

          {matches.length === 0 ? (
            <p className="bk-phone-empty">No country matches that.</p>
          ) : (
            <ul id={listId} ref={listRef} className="bk-phone-list" role="listbox" tabIndex={-1}>
              {matches.map((option, index) => (
                <li key={option.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.code === value.region}
                    data-cursor={index === activeIndex}
                    onPointerEnter={() => setCursor(index)}
                    onClick={() => choose(option.code)}
                  >
                    <span aria-hidden="true">{flagEmoji(option.code)}</span>
                    <span className="bk-phone-name">{option.name}</span>
                    <span className="bk-phone-plus">+{option.dial}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error ? (
        <p id={errorId} className="form-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
