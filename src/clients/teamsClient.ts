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

export async function sendTeamsMessage(message: string): Promise<void> {
  const { status, rawBody } = await sendJsonRequest<Record<string, never>>({
    url: config.teamsWebhookUrl,
    method: "POST",
    body: createTeamsPayload(message),
    errorContext: "Teams webhook request"
  });

  console.log(`Webhook response ${status}: ${rawBody || "<empty response>"}`);
}
