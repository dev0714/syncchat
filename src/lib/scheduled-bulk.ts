import { addDays, addMonths, addWeeks } from "date-fns";

export type ScheduledBulkScheduleType = "one_time" | "recurring";
export type ScheduledBulkFrequency = "daily" | "weekly" | "monthly";

export interface ScheduledBulkRecurrence {
  frequency: ScheduledBulkFrequency;
  interval: number;
  daysOfWeek?: number[];
}

export interface ScheduledBulkRecipientSnapshot {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  tags?: string[];
}

export interface ScheduledBulkTemplateSnapshot {
  name: string;
  content: string;
  variables: string[];
}

const JOHANNESBURG_OFFSET_HOURS = 2;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function extractTemplateVariables(content: string): string[] {
  return Array.from(new Set(Array.from(content.matchAll(/\{\{(\w+)\}\}/g)).map((match) => match[1])));
}

export function fillTemplate(
  template: string,
  contact: ScheduledBulkRecipientSnapshot,
  defaults: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    if (key === "name") return contact.name ?? defaults[key] ?? "";
    if (key === "phone") return contact.phone ?? defaults[key] ?? "";
    if (key === "email") return contact.email ?? defaults[key] ?? "";
    return defaults[key] ?? `{{${key}}}`;
  });
}

export function parseJohannesburgDateTime(localDateTime: string): Date {
  if (!localDateTime || !localDateTime.includes("T")) {
    throw new Error("Invalid date/time value.");
  }

  return new Date(`${localDateTime}:00+02:00`);
}

export function toJohannesburgLocalInput(date: Date): string {
  const shifted = new Date(date.getTime() + JOHANNESBURG_OFFSET_HOURS * 60 * 60 * 1000);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  const hours = String(shifted.getUTCHours()).padStart(2, "0");
  const minutes = String(shifted.getUTCMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function weeksBetween(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / (7 * MS_PER_DAY));
}

export function calculateNextRunAt(base: Date, recurrence: ScheduledBulkRecurrence): Date {
  const interval = Math.max(1, recurrence.interval || 1);

  if (recurrence.frequency === "daily") {
    return addDays(base, interval);
  }

  if (recurrence.frequency === "monthly") {
    return addMonths(base, interval);
  }

  if (!recurrence.daysOfWeek || recurrence.daysOfWeek.length === 0) {
    return addWeeks(base, interval);
  }

  const allowedDays = new Set(recurrence.daysOfWeek);
  let candidate = addDays(base, 1);

  for (let i = 0; i < 370; i += 1) {
    const weekDifference = weeksBetween(base, candidate);
    if (allowedDays.has(candidate.getUTCDay()) && weekDifference % interval === 0) {
      return candidate;
    }
    candidate = addDays(candidate, 1);
  }

  return addWeeks(base, interval);
}
