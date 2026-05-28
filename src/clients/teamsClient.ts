import { config } from "../config";
import type { TeamsMessagePayload } from "../types";
import { sendJsonRequest } from "../utils/http";

function createTeamsPayload(message: string): TeamsMessagePayload {
  return {
    title: "Jira cron notification",
    text: message,
    message
  };
}

function validateTeamsConfig(): boolean {
  if (config.teamsWebhookUrl) {
    return true;
  }

  console.error("Missing Teams configuration. Set TEAMS_WEBHOOK_URL.");
  return false;
}

export async function sendTeamsMessage(message: string): Promise<boolean> {
  if (!validateTeamsConfig()) {
    return false;
  }

  const { status, rawBody } = await sendJsonRequest<Record<string, never>>({
    url: config.teamsWebhookUrl,
    method: "POST",
    body: createTeamsPayload(message),
    errorContext: "Teams webhook request"
  });

  console.log(`Webhook response ${status}: ${rawBody || "<empty response>"}`);
  return true;
}
