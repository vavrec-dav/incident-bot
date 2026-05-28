import cron from "node-cron";

import { fetchJiraIssues } from "./clients/jiraClient";
import { sendTeamsMessage } from "./clients/teamsClient";
import { CRON_EXPRESSION } from "./config";
import { prepareJobResult, resetCacheIfNeeded, shouldPauseCachePopulation } from "./services/cacheService";
import type { JiraIssue } from "./types";

console.log("Cron job scheduler started.");

function logFetchedIssues(issues: JiraIssue[]): void {
  const issueKeys = issues.map((issue) => issue.key).join(", ") || "<none>";
  console.log(`Fetched Jira issues: ${issueKeys}`);
}

function logNewIssues(issues: JiraIssue[]): void {
  const issueKeys = issues.map((issue) => issue.key).join(", ") || "<none>";
  console.log(`New Jira issues: ${issueKeys}`);
}

async function runJob(): Promise<void> {
  try {
    const now = new Date();

    resetCacheIfNeeded(now);

    if (shouldPauseCachePopulation(now)) {
      console.log("Cache population is paused outside the 09:00-17:00 Prague window.");
      return;
    }

    const issues = await fetchJiraIssues();
    const jobResult = prepareJobResult(issues);

    logFetchedIssues(issues);

    if (!jobResult.shouldSendMessage || !jobResult.message) {
      return;
    }

    await sendTeamsMessage(jobResult.message);
    logNewIssues(jobResult.newIssues);
    console.log("Teams message sent.");
  } catch (error) {
    console.error("Failed to run cron job.", error);
  }
}

void runJob();

cron.schedule(CRON_EXPRESSION, async () => {
  await runJob();
});
