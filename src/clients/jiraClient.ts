import { config, JIRA_SEARCH_FIELDS, MAX_JIRA_RESULTS } from "../config";
import type { JiraIssue, JiraSearchResponse } from "../types";
import { sendJsonRequest } from "../utils/http";

function createBasicAuthHeader(email: string, apiToken: string): string {
  return `Basic ${Buffer.from(`${email}:${apiToken}`).toString("base64")}`;
}

function validateJiraConfig(): boolean {
  if (config.jiraBaseUrl && config.jiraEmail && config.jiraApiToken) {
    return true;
  }

  console.error("Missing Jira configuration. Set JIRA_BASE_URL, JIRA_EMAIL and JIRA_API_TOKEN.");
  return false;
}

export async function fetchJiraIssues(): Promise<JiraIssue[]> {
  if (!validateJiraConfig()) {
    return [];
  }

  const { data } = await sendJsonRequest<JiraSearchResponse>({
    url: `${config.jiraBaseUrl}/rest/api/3/search/jql`,
    method: "POST",
    headers: {
      Authorization: createBasicAuthHeader(config.jiraEmail, config.jiraApiToken)
    },
    body: {
      jql: config.jiraJql,
      maxResults: MAX_JIRA_RESULTS,
      fields: [...JIRA_SEARCH_FIELDS]
    },
    errorContext: "Jira request"
  });

  return data.issues ?? [];
}
