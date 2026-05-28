export const DEFAULT_JIRA_JQL =
  "project = Onboarding AND issuetype = Incident AND status NOT IN (Discarded, Closed) ORDER BY priority ASC";
export const JIRA_SEARCH_FIELDS = ["summary", "status", "priority"] as const;
export const MAX_JIRA_RESULTS = 20;
export const PRAGUE_TIME_ZONE = "Europe/Prague";
export const CACHE_RESET_HOUR = 17;
export const CACHE_REFILL_HOUR = 9;
export const CACHE_REFILL_MINUTE = 0;
export const CACHE_STATE_FILE_PATH = process.env.CACHE_STATE_FILE_PATH ?? "state/incident-cache.json";

export const config = {
  teamsWebhookUrl: process.env.TEAMS_WEBHOOK_URL ?? "",
  jiraBaseUrl: process.env.JIRA_BASE_URL ?? "",
  jiraEmail: process.env.JIRA_EMAIL ?? "",
  jiraApiToken: process.env.JIRA_API_TOKEN ?? "",
  jiraJql: process.env.JIRA_JQL ?? DEFAULT_JIRA_JQL
};
