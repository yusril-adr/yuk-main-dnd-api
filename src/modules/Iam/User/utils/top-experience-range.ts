const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseUtcDate(value: string): Date | null {
  const match = DATE_PATTERN.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function isBlankDate(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

function formatUtcDate(date: Date): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}-${month}-${day}`;
}

function monthStart(date: Date): string {
  return formatUtcDate(
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)),
  );
}

function monthEnd(date: Date): string {
  return formatUtcDate(
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)),
  );
}

export function resolveTopExperienceDates(
  startDate: unknown,
  endDate: unknown,
  now: Date = new Date(),
): { startDate: string; endDate: string } {
  const startBlank = isBlankDate(startDate);
  const endBlank = isBlankDate(endDate);

  if (!startBlank && !endBlank) {
    return { startDate: String(startDate), endDate: String(endDate) };
  }

  if (startBlank && endBlank) {
    return { startDate: monthStart(now), endDate: monthEnd(now) };
  }

  if (startBlank) {
    const end = typeof endDate === 'string' ? parseUtcDate(endDate) : null;
    return {
      startDate: end ? monthStart(end) : monthStart(now),
      endDate: String(endDate),
    };
  }

  const start = typeof startDate === 'string' ? parseUtcDate(startDate) : null;
  return {
    startDate: String(startDate),
    endDate: start ? monthEnd(start) : monthEnd(now),
  };
}
