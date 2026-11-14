/**
 * How the date below the dial is written. Examples are for Saturday,
 * 14 November 2026.
 */
export type DateFormat =
  | "none"
  | "day-short"
  | "day-long"
  | "date-us"
  | "date-short"
  | "date-intl"
  | "day-date"
  | "locale";

/** Every date format, in display order, for building pickers. */
export const DATE_FORMATS: readonly {
  id: DateFormat;
  label: string;
  example: string;
}[] = [
  { id: "none", label: "None", example: "" },
  { id: "day-short", label: "Day short", example: "Sat" },
  { id: "day-long", label: "Day full", example: "Saturday" },
  { id: "date-us", label: "Date US", example: "11/14/2026" },
  { id: "date-short", label: "Date short", example: "Nov-14-2026" },
  { id: "date-intl", label: "Date intl", example: "14-Nov-2026" },
  { id: "day-date", label: "Day + date", example: "Sat · Nov 14" },
  { id: "locale", label: "Visitor's locale", example: "Sat, Nov 14" },
];

/**
 * Formats `now` as seen in `timezone` (local zone if none or invalid), so a
 * Tokyo clock shows Tokyo's date. "locale" follows the visitor's language.
 */
export function formatClockDate(
  format: DateFormat,
  now: Date = new Date(),
  timezone?: string | null,
): string {
  if (format === "none") return "";

  const part = (
    options: Intl.DateTimeFormatOptions,
    locale: string | undefined = "en-US",
  ) => {
    if (timezone) {
      try {
        return new Intl.DateTimeFormat(locale, {
          ...options,
          timeZone: timezone,
        }).format(now);
      } catch {
        // Invalid zone: fall through to local time
      }
    }
    return new Intl.DateTimeFormat(locale, options).format(now);
  };
  const pad = (s: string) => s.padStart(2, "0");
  const day = part({ day: "numeric" });
  const mon = part({ month: "short" });
  const year = part({ year: "numeric" });

  switch (format) {
    case "day-short":
      return part({ weekday: "short" });
    case "day-long":
      return part({ weekday: "long" });
    case "date-us":
      return part({ year: "numeric", month: "numeric", day: "numeric" });
    case "date-short":
      return `${mon}-${pad(day)}-${year}`;
    case "date-intl":
      return `${pad(day)}-${mon}-${year}`;
    case "day-date":
      return `${part({ weekday: "short" })} · ${mon} ${day}`;
    case "locale":
      return part(
        { weekday: "short", month: "short", day: "numeric" },
        undefined,
      );
    default:
      return "";
  }
}
