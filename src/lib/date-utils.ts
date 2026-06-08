/**
 * Date utility helpers scoped to a given IANA timezone.
 * Keeps all timezone-aware logic in one place so it can be tested independently.
 */

const KL_TIMEZONE = 'Asia/Kuala_Lumpur'

/**
 * Returns the current UTC Date object. Centralised so tests can mock it.
 */
export function now(): Date {
  return new Date()
}

/**
 * Checks whether the current moment falls within the ordering window defined
 * by a WeeklyMenu's startDate and orderCutoffDate.
 *
 * Rules:
 *  - startDate is day-only (stored as midnight UTC by Payload).
 *    We treat it as "window opens at the start of that day in KL time"
 *    by re-interpreting the date parts in Asia/Kuala_Lumpur.
 *  - orderCutoffDate is stored with a time component and is compared as-is.
 *
 * @param startDateIso   ISO string from WeeklyMenu.startDate
 * @param cutoffDateIso  ISO string from WeeklyMenu.orderCutoffDate
 */
export function isWithinOrderingWindow(startDateIso: string, cutoffDateIso: string): boolean {
  const current = now()

  // Re-interpret startDate as midnight KL time on that calendar date.
  // Payload stores date-only fields as noon UTC to avoid DST drift; we extract
  // the YYYY-MM-DD parts as they appear in KL and treat 00:00 KL as the open.
  const startMidnightKL = toStartOfDayInTimezone(startDateIso, KL_TIMEZONE)
  const cutoff = new Date(cutoffDateIso)

  return current >= startMidnightKL && current <= cutoff
}

/**
 * Returns true if the given ISO date string is strictly in the past (already passed).
 */
export function isPast(isoDate: string): boolean {
  return new Date(isoDate) < now()
}

/**
 * Returns true if the given ISO date string is in the future (not yet reached).
 */
export function isFuture(isoDate: string): boolean {
  return new Date(isoDate) > now()
}

/**
 * Given an ISO date string, returns a Date representing midnight (00:00:00)
 * at the start of that calendar day in the given timezone.
 *
 * This handles the case where Payload stores day-only dates as UTC noon,
 * which can shift the visible date when interpreted naively.
 */
export function toStartOfDayInTimezone(isoDate: string, timeZone: string): Date {
  // Extract the YYYY-MM-DD as seen in the target timezone
  const inZone = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(isoDate)) // returns "YYYY-MM-DD"

  // Build a new Date representing 00:00:00 in that timezone using the
  // timezone offset at that moment. The cleanest portable way is to use
  // Intl to find the UTC offset and subtract it.
  const [year, month, day] = inZone.split('-').map(Number)

  // Construct a reference date in that timezone at midnight by iterating
  // over the UTC epoch until the local time matches — the pragmatic approach
  // that avoids external libraries.
  const candidate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))

  // Determine the UTC offset at that candidate moment for the timezone
  const offsetMs = getUtcOffsetMs(candidate, timeZone)

  return new Date(candidate.getTime() - offsetMs)
}

/**
 * Returns the UTC offset in milliseconds for a given timezone at a given moment.
 * Positive values mean the timezone is ahead of UTC (e.g. KL is UTC+8 = +480 min).
 */
function getUtcOffsetMs(date: Date, timeZone: string): number {
  // Format the date in UTC and in the target timezone, then compute the delta
  const utcParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const tzParts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const toObj = (parts: Intl.DateTimeFormatPart[]) =>
    Object.fromEntries(parts.map((p) => [p.type, p.value]))

  const utc = toObj(utcParts)
  const tz = toObj(tzParts)

  const utcMs = Date.UTC(
    Number(utc.year), Number(utc.month) - 1, Number(utc.day),
    Number(utc.hour), Number(utc.minute), Number(utc.second),
  )
  const tzMs = Date.UTC(
    Number(tz.year), Number(tz.month) - 1, Number(tz.day),
    Number(tz.hour), Number(tz.minute), Number(tz.second),
  )

  return tzMs - utcMs
}

/**
 * Returns the current date formatted as YYYY-MM-DD in the given timezone.
 * Useful for display and logging.
 */
export function todayInTimezone(timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now())
}
