import cron from "node-cron";

import { fetchJiraIssues } from "./clients/jiraClient";
import { sendTeamsMessage } from "./clients/teamsClient";
import { CRON_EXPRESSION } from "./config";
import {
  prepareJobResult,
  resetCacheIfNeeded,
  shouldPauseCachePopulation,
} from "./services/cacheService";
import { formatDiagnosticMessage } from "./services/messageFormatter";
import type { JiraIssue, JobResult } from "./types";

type CliOptions = {
  runOnce: boolean;
  ignoreTimeWindow: boolean;
  forceDiagnosticMessage: boolean;
};

type RunJobOptions = {
  isManualRun?: boolean;
  ignoreTimeWindow?: boolean;
  forceDiagnosticMessage?: boolean;
};

function hasArg(flag: string): boolean {
  return process.argv.includes(flag);
}

function getCliOptions(): CliOptions {
  return {
    runOnce: hasArg("--run-once"),
    ignoreTimeWindow: hasArg("--ignore-window"),
    forceDiagnosticMessage: hasArg("--force-message"),
  };
}

function logFetchedIssues(issues: JiraIssue[]): void {
  const issueKeys = issues.map((issue) => issue.key).join(", ") || "<none>";
  console.log(`Fetched Jira issues: ${issueKeys}`);
}

function logNewIssues(issues: JiraIssue[]): void {
  const issueKeys = issues.map((issue) => issue.key).join(", ") || "<none>";
  console.log(`New Jira issues: ${issueKeys}`);
}

function getMessageToSend(
  issues: JiraIssue[],
  jobResult: JobResult,
  shouldForceDiagnosticMessage: boolean,
): string | undefined {
  if (jobResult.shouldSendMessage && jobResult.message) {
    return jobResult.message;
  }

  if (shouldForceDiagnosticMessage) {
    return formatDiagnosticMessage(issues);
  }

  return undefined;
}

function prependManualRunLabel(message: string, isManualRun: boolean): string {
  if (!isManualRun) {
    return message;
  }

  const normalizedMessage = message.replace(/^Ranní stav incidentů:\n\n/, "");
  return `Manuální spuštění:\n\n${normalizedMessage}`;
}

async function runJob({
  isManualRun = false,
  ignoreTimeWindow: skipTimeWindow = false,
  forceDiagnosticMessage: shouldForceDiagnosticMessage = false,
}: RunJobOptions = {}): Promise<void> {
  try {
    const now = new Date();

    resetCacheIfNeeded(now);

    if (!skipTimeWindow && shouldPauseCachePopulation(now)) {
      console.log(
        "Cache population is paused outside the 09:00-17:00 Prague window.",
      );
      return;
    }

    const issues = await fetchJiraIssues();
    logFetchedIssues(issues);

    const jobResult = prepareJobResult(issues);
    const message = getMessageToSend(
      issues,
      jobResult,
      shouldForceDiagnosticMessage,
    );

    if (!message) {
      console.log("No new Jira issues to send.");
      return;
    }

    const wasMessageSent = await sendTeamsMessage(
      prependManualRunLabel(message, isManualRun),
    );

    if (!wasMessageSent) {
      return;
    }

    if (jobResult.newIssues.length > 0) {
      logNewIssues(jobResult.newIssues);
    }

    console.log("Teams message sent.");
  } catch (error) {
    console.error("Failed to run cron job.", error);
  }
}

function scheduleCronJob(): void {
  cron.schedule(CRON_EXPRESSION, async () => {
    await runJob();
  });
}

async function startManualRun(options: CliOptions): Promise<void> {
  console.log("Manual run started.");

  await runJob({
    isManualRun: true,
    ignoreTimeWindow: options.ignoreTimeWindow,
    forceDiagnosticMessage: options.forceDiagnosticMessage,
  });
}

async function startScheduler(): Promise<void> {
  console.log("Cron job scheduler started.");
  await runJob();
  scheduleCronJob();
}

async function main(): Promise<void> {
  const options = getCliOptions();

  if (options.runOnce) {
    await startManualRun(options);
    return;
  }

  await startScheduler();
}

void main();
