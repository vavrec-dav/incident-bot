# Jira Incident Cron Job

Node.js + TypeScript application that checks Jira incidents every minute and sends notifications to a Microsoft Teams webhook.

## What the application does

- after `09:00` Prague time, it fills an in-memory cache with the incidents it finds
- on the first daily cache fill, it sends a morning incident overview
- during the day, it sends only newly discovered incidents that are not yet in cache
- if no new incident appears, it sends nothing
- at `17:00` Prague time, it clears the cache

## Requirements

- Node.js `18+`
- npm

## Installation

```bash
npm install
```

## Configuration

The application reads its configuration from environment variables:

```bash
TEAMS_WEBHOOK_URL="https://..."
JIRA_BASE_URL="https://your-company.atlassian.net"
JIRA_EMAIL="your.email@company.com"
JIRA_API_TOKEN="..."
JIRA_JQL="project = Onboarding AND issuetype = Incident AND status NOT IN (Discarded, Closed) ORDER BY priority ASC"
```

`JIRA_JQL` is optional. If you do not set it, the default query from [src/config.ts](src/config.ts) will be used.

## Running the project

Development run:

```bash
npm run dev
```

Build and production run:

```bash
npm run build
npm start
```

## Message format

Morning incident overview:

```text
Morning incident overview:

- [ON-917](https://expensa.atlassian.net/browse/ON-917) [Work in progress] [🟢 Low]: Fidoo platform - adding Oberbank account
```

New incidents:

```text
New incidents:

- [ON-920](https://expensa.atlassian.net/browse/ON-920) [To do] [🔴 Kritická]: Onboarding outage for Oberbank
```

## Project structure

- [src/index.ts](src/index.ts) cron job orchestration
- [src/config.ts](src/config.ts) configuration and constants
- [src/clients/jiraClient.ts](src/clients/jiraClient.ts) Jira API client
- [src/clients/teamsClient.ts](src/clients/teamsClient.ts) Teams webhook client
- [src/services/cacheService.ts](src/services/cacheService.ts) in-memory cache and daily rules
- [src/services/messageFormatter.ts](src/services/messageFormatter.ts) message text formatting
- [src/utils/http.ts](src/utils/http.ts) HTTP helper

## Notes

- the cache is in-memory only, so it is rebuilt after every process restart
- the application uses the `Europe/Prague` timezone
- between `09:00` and `17:00` Prague time, the app performs sync and sends Teams messages only when the conditions are met
- outside the `09:00-17:00` window, it does not call Jira and does not send any Teams messages
