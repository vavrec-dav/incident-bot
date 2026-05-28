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
    return "Ranni stav incidentu:\n\nAktualne jsem nenasel zadne tasky.";
  }

  const issueLines = issues.map(formatIssueLine);
  return `Ranni stav incidentu:\n\n${joinIssueBlocks(issueLines)}`;
}

export function formatNewIssuesMessage(issues: JiraIssue[]): string {
  const issueLines = issues.map(formatIssueLine);
  return `Nove incidenty:\n\n${joinIssueBlocks(issueLines)}`;
}

export function formatDiagnosticMessage(issues: JiraIssue[]): string {
  if (issues.length === 0) {
    return "Test Jira -> Teams probehl uspesne.\n\nJira dotaz se provedl, ale nevratil zadne incidenty.";
  }

  const issueLines = issues.map(formatIssueLine);
  return `Test Jira -> Teams probehl uspesne.\n\nJira vratila ${issues.length} incidentu:\n\n${joinIssueBlocks(issueLines)}`;
}
