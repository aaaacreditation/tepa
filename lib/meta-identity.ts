/* Identity fields the Meta pixel and the Conversions API match on, normalised
   the way Meta normalises them before hashing. Shared by the browser, which
   hands the raw values to the pixel and lets it hash, and the server, which
   hashes them itself in lib/meta-capi.ts, so both halves of an event describe
   the same person. No "server-only" import here for that reason. */

export type MetaIdentity = {
  email?: string;
  phone?: string;
  fullName?: string;
  /* ISO 3166-1 alpha-2, as the form's country select supplies it. */
  country?: string;
};

/* em: trimmed, lowercase. Nothing else. Meta does not fold gmail dots the way
   Google does, so doing it here would produce a digest Meta never computes. */
export function normalizeMetaEmail(email: string | undefined | null): string {
  const value = (email ?? "").trim().toLowerCase();
  return value.includes("@") ? value : "";
}

/* ph: digits only, country code first, no leading zeros. A number typed
   without its country code cannot be completed reliably — the form asks for
   one but does not enforce it — and a wrong guess hashes to nobody, so the
   value is only kept when the visitor clearly included it: a + or 00 prefix,
   or more digits than a national number alone could explain. */
export function normalizeMetaPhone(phone: string | undefined | null): string {
  const raw = (phone ?? "").trim();
  if (!raw) return "";
  const explicit = raw.startsWith("+") || raw.startsWith("00");
  const digits = raw.replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length < 8 || digits.length > 15) return "";
  if (!explicit && digits.length < 11) return "";
  return digits;
}

/* Built at runtime because the compile target predates Unicode property
   escapes; every browser and Node this runs on has had them since 2018. */
const NOT_A_LETTER = new RegExp("[^\\p{L}]", "gu");

/* fn / ln: the forms ask for one "Full name" field. The first word is taken as
   the given name and the rest as the family name — right for most visitors
   here, and a cheap kind of wrong for the others, since Meta weights names
   well below email and phone. Lowercase, letters only, any script. */
export function splitMetaName(fullName: string | undefined | null): {
  fn: string;
  ln: string;
} {
  const words = (fullName ?? "")
    .trim()
    .split(/\s+/)
    .map((word) => word.toLowerCase().replace(NOT_A_LETTER, ""))
    .filter(Boolean);
  if (words.length === 0) return { fn: "", ln: "" };
  return { fn: words[0], ln: words.slice(1).join("") };
}

/* country: lowercase ISO 3166-1 alpha-2. */
export function normalizeMetaCountry(country: string | undefined | null): string {
  const value = (country ?? "").trim().toLowerCase();
  return /^[a-z]{2}$/.test(value) ? value : "";
}

/* The browser mints the id for the enquiry's Lead event and posts it with the
   form, so the pixel call and the server call carry the same one and Meta
   counts them as one conversion. The route accepts it back only if it looks
   like something crypto.randomUUID() produced. */
export function cleanMetaEventId(value: unknown): string {
  return typeof value === "string" && /^[A-Za-z0-9-]{16,64}$/.test(value) ? value : "";
}
