/**
 * Unified Date and Time formatting utility (China Standard Time / Asia/Shanghai, UTC+8)
 */

export function getCSTDate(dateInput: Date | string | number = new Date()): Date {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  return isNaN(date.getTime()) ? new Date() : date;
}

/**
 * Formats date to 'YYYY-MM-DD HH:mm:ss' or 'YYYY-MM-DD HH:mm' in Asia/Shanghai timezone.
 */
export function formatCSTDateTime(
  dateInput: Date | string | number = new Date(),
  includeSeconds: boolean = false
): string {
  const date = getCSTDate(dateInput);

  try {
    const formatter = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const get = (type: string) => parts.find((p) => p.type === type)?.value || '';

    const y = get('year');
    const m = get('month');
    const d = get('day');
    const h = get('hour');
    const min = get('minute');
    const s = get('second');

    if (includeSeconds && s) {
      return `${y}-${m}-${d} ${h}:${min}:${s}`;
    }
    return `${y}-${m}-${d} ${h}:${min}`;
  } catch {
    // Fallback in case Intl fails
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    const s = pad(date.getSeconds());
    return includeSeconds ? `${y}-${m}-${d} ${h}:${min}:${s}` : `${y}-${m}-${d} ${h}:${min}`;
  }
}

/**
 * Formats timeline log timestamp for display.
 * If the recorded time only has 'HH:mm' (legacy record),
 * combines with the item's creation date so it always shows the full date & time (e.g. '2026-09-08 14:28').
 */
export function formatTimelineDisplay(timeStr?: string, parentCreatedAt?: string): string {
  if (!timeStr) return '';

  const trimmed = timeStr.trim();

  // If already contains full date (e.g. '2025-09-07 14:28' or '2026-09-08T14:28:00')
  if (trimmed.includes('-') || trimmed.includes('/')) {
    if (trimmed.includes('T')) {
      return formatCSTDateTime(trimmed, false);
    }
    return trimmed;
  }

  // If it is only 'HH:mm' or 'HH:mm:ss' (legacy format)
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    if (parentCreatedAt) {
      const datePart = parentCreatedAt.trim().split(' ')[0] || parentCreatedAt.trim().split('T')[0];
      if (datePart && (datePart.includes('-') || datePart.includes('/'))) {
        return `${datePart} ${trimmed.slice(0, 5)}`;
      }
    }
    return trimmed;
  }

  return trimmed;
}
