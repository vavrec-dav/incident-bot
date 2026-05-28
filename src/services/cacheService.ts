import {
  CACHE_REFILL_HOUR,
  CACHE_REFILL_MINUTE,
  CACHE_RESET_HOUR,
  PRAGUE_TIME_ZONE
} from "../config";
import type { JiraIssue, JobResult } from "../types";
import { formatInitialCacheMessage, formatNewIssuesMessage } from "./messageFormatter";

const issueCache = new Map<string, JiraIssue>();
let isCacheInitialized = false;
let lastCacheResetDate: string | null = null;

function getPragueDateParts(date: Date): { dateKey: string; hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: PRAGUE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const getPartValue = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    dateKey: `${getPartValue("year")}-${getPartValue("month")}-${getPartValue("day")}`,
    hour: Number(getPartValue("hour")),
    minute: Number(getPartValue("minute"))
  };
}

function clearIssueCache(): void {
  issueCache.clear();
  isCacheInitialized = false;
}

export function resetCacheIfNeeded(date: Date): boolean {
  const { dateKey, hour, minute } = getPragueDateParts(date);

  if (lastCacheResetDate === dateKey) {
    return false;
  }

  if (hour > CACHE_RESET_HOUR || (hour === CACHE_RESET_HOUR && minute >= 0)) {
    clearIssueCache();
    lastCacheResetDate = dateKey;
    console.log(`Issue cache cleared for ${dateKey} at 17:00 Prague time.`);
    return true;
  }

  return false;
}

export function shouldPauseCachePopulation(date: Date): boolean {
  const { hour, minute } = getPragueDateParts(date);
  const minutesSinceMidnight = hour * 60 + minute;
  const refillStartMinutes = CACHE_REFILL_HOUR * 60 + CACHE_REFILL_MINUTE;
  const resetMinutes = CACHE_RESET_HOUR * 60;

  return minutesSinceMidnight < refillStartMinutes || minutesSinceMidnight >= resetMinutes;
}

function cacheIssues(issues: JiraIssue[]): void {
  for (const issue of issues) {
    issueCache.set(issue.key, issue);
  }
}

function getNewIssues(issues: JiraIssue[]): JiraIssue[] {
  return issues.filter((issue) => !issueCache.has(issue.key));
}

export function prepareJobResult(issues: JiraIssue[]): JobResult {
  if (!isCacheInitialized) {
    cacheIssues(issues);
    isCacheInitialized = true;

    return {
      shouldSendMessage: true,
      message: formatInitialCacheMessage(issues),
      newIssues: issues
    };
  }

  const newIssues = getNewIssues(issues);
  cacheIssues(newIssues);

  if (newIssues.length === 0) {
    return {
      shouldSendMessage: false,
      newIssues: []
    };
  }

  return {
    shouldSendMessage: true,
    message: formatNewIssuesMessage(newIssues),
    newIssues
  };
}
