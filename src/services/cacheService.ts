import {
  CACHE_REFILL_HOUR,
  CACHE_REFILL_MINUTE,
  CACHE_RESET_HOUR,
  PRAGUE_TIME_ZONE
} from "../config";
import type { CacheState, JiraIssue, JobResult } from "../types";
import { formatInitialCacheMessage, formatNewIssuesMessage } from "./messageFormatter";

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

function clearIssueCache(state: CacheState): void {
  state.issues = [];
  state.isInitialized = false;
}

export function resetCacheIfNeeded(state: CacheState, date: Date): boolean {
  const { dateKey, hour, minute } = getPragueDateParts(date);

  if (state.lastResetDate === dateKey) {
    return false;
  }

  if (hour > CACHE_RESET_HOUR || (hour === CACHE_RESET_HOUR && minute >= 0)) {
    clearIssueCache(state);
    state.lastResetDate = dateKey;
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

function cacheIssues(state: CacheState, issues: JiraIssue[]): void {
  const issueCache = new Map(state.issues.map((issue) => [issue.key, issue]));

  for (const issue of issues) {
    issueCache.set(issue.key, issue);
  }

  state.issues = [...issueCache.values()];
}

function getNewIssues(state: CacheState, issues: JiraIssue[]): JiraIssue[] {
  const issueKeys = new Set(state.issues.map((issue) => issue.key));
  return issues.filter((issue) => !issueKeys.has(issue.key));
}

export function prepareJobResult(state: CacheState, issues: JiraIssue[]): JobResult {
  if (!state.isInitialized) {
    cacheIssues(state, issues);
    state.isInitialized = true;

    return {
      shouldSendMessage: true,
      message: formatInitialCacheMessage(issues),
      newIssues: issues
    };
  }

  const newIssues = getNewIssues(state, issues);
  cacheIssues(state, newIssues);

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
