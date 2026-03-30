import { getI18nT } from './i18n';

export function formatTime(date: Date, use24Hour: boolean, locale: string = 'en-US'): string {
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: !use24Hour,
  });
}

export function formatDuration(ms: number): string {
  if (ms <= 0) {
    const t = getI18nT();
    return t('format.anyMomentNow');
  }
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatETA(date: Date, use24Hour: boolean, locale: string = 'en-US'): string {
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !use24Hour,
  });
}

export function formatDate(date: Date, locale: string = 'en-US'): string {
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function parseInputTime(val: string): number | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.getTime();
}
