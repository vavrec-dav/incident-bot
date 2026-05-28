# Jira Incident Cron Job

Node.js + TypeScript application that checks Jira incidents and sends notifications to a Microsoft Teams webhook. It is designed to run as a scheduled GitHub Actions workflow.

## What the application does

- after `09:00` Prague time, it fills a persisted cache with the incidents it finds
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
CACHE_STATE_FILE_PATH="state/incident-cache.json"
```

`JIRA_JQL` is optional. If you do not set it, the default query from [src/config.ts](src/config.ts) will be used.
`CACHE_STATE_FILE_PATH` is optional. If you do not set it, the workflow uses `state/incident-cache.json`.

## Running the project

Local one-off sync:

```bash
npm run sync
```

Build and run the compiled version:

```bash
npm run build
npm start
```

## GitHub Actions deployment

The repository includes a workflow at [.github/workflows/jira-incident-sync.yml](.github/workflows/jira-incident-sync.yml).

It runs:

- every 5 minutes from `09:00` to `16:55` on weekdays in the `Europe/Prague` timezone
- once at `17:00` on weekdays to clear the daily cache

To enable it:

1. Push the repository to GitHub.
2. In the repository, open `Settings` -> `Secrets and variables` -> `Actions`.
3. Add these repository secrets:
   - `TEAMS_WEBHOOK_URL`
   - `JIRA_BASE_URL`
   - `JIRA_EMAIL`
   - `JIRA_API_TOKEN`
   - optionally `JIRA_JQL`
4. Make sure GitHub Actions has permission to write repository contents, because the workflow commits the updated cache file back to the repository.
5. Enable the workflow and optionally trigger it once with `workflow_dispatch`.

The workflow persists state in [state/incident-cache.json](state/incident-cache.json) and commits changes back to the default branch after each run that changes the cache.

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
- [src/services/cacheService.ts](src/services/cacheService.ts) persisted cache logic and daily rules
- [src/services/messageFormatter.ts](src/services/messageFormatter.ts) message text formatting
- [src/utils/http.ts](src/utils/http.ts) HTTP helper
- [src/utils/fileState.ts](src/utils/fileState.ts) cache state file persistence
- [state/incident-cache.json](state/incident-cache.json) persisted cache state for GitHub Actions
- [.github/workflows/jira-incident-sync.yml](.github/workflows/jira-incident-sync.yml) scheduled workflow

## Notes

- the cache is persisted to a JSON file so it survives separate GitHub Actions runs
- the application uses the `Europe/Prague` timezone
- between `09:00` and `17:00` Prague time, the app performs sync and sends Teams messages only when the conditions are met
- outside the `09:00-17:00` window, it does not call Jira and does not send any Teams messages
- GitHub Actions scheduled workflows run at a minimum interval of 5 minutes
