import { config } from "../config";
import type { JiraIssue } from "../types";

function formatPriorityLabel(priorityName: string): string {
  switch (priorityName) {
    case "Kritická":
      return "🔴 Kritická";
    case "High":
      return "🟠 High";
    case "Medium":
      return "🟡 Medium";
    case "Low":
      return "🟢 Low";
    case "Unprioritized":
      return "⚪ Unprioritized";
    default:
      return `⚪ ${priorityName}`;
  }
}

function formatIssueSummary(issue: JiraIssue): string {
  return issue.fields.summary;
}

function formatIssueMetadata(issue: JiraIssue): string {
  const priorityName = issue.fields.priority?.name ?? "No priority";
  return `[${issue.fields.status.name}] [${formatPriorityLabel(priorityName)}]`;
}

function createIssueUrl(issueKey: string): string {
  return `${config.jiraBaseUrl}/browse/${issueKey}`;
}

function formatIssueLine(issue: JiraIssue): string {
  return `- [${issue.key}](${createIssueUrl(issue.key)}) ${formatIssueMetadata(issue)}: ${formatIssueSummary(issue)}`;
}

function joinIssueBlocks(issueLines: string[]): string {
  return issueLines.join("\n\n");
}

export function formatInitialCacheMessage(issues: JiraIssue[]): string {
  if (issues.length === 0) {
    return "Ranní stav incidentů:\n\nAktuálně jsem nenašel žádné tasky.";
  }

  const issueLines = issues.map(formatIssueLine);
  return `Ranní stav incidentů:\n\n${joinIssueBlocks(issueLines)}`;
}

export function formatNewIssuesMessage(issues: JiraIssue[]): string {
  const issueLines = issues.map(formatIssueLine);
  return `Nové incidenty:\n\n${joinIssueBlocks(issueLines)}`;
}

export function formatDiagnosticMessage(issues: JiraIssue[]): string {
  if (issues.length === 0) {
    return "Test Jira -> Teams proběhl úspěšně.\n\nJira dotaz se provedl, ale nevrátil žádné incidenty.";
  }

  const issueLines = issues.map(formatIssueLine);
  return `Test Jira -> Teams proběhl úspěšně.\n\nJira vrátila ${issues.length} incidentů:\n\n${joinIssueBlocks(issueLines)}`;
}
