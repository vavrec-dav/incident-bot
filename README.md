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

Manual test run without cron and without the `09:00-17:00` window:

```bash
npm run trigger
```

This command still calls Jira and sends the result to Teams, but it does not start the scheduler. If Jira returns no new incidents, it still sends a diagnostic Teams message so the full integration can be verified.

Build and production run:

```bash
npm run build
npm start
```

Built manual trigger:

```bash
node dist/index.js --run-once --ignore-window --force-message
```

Manual trigger inside a running Docker container:

```bash
docker exec <container_name> /nodejs/bin/node /app/dist/index.js --run-once --ignore-window --force-message
```

## Docker

Build image:

```bash
docker build -t jira-incident-cron .
```

Run container:

```bash
docker run --rm \
  -e TEAMS_WEBHOOK_URL="https://..." \
  -e JIRA_BASE_URL="https://your-company.atlassian.net" \
  -e JIRA_EMAIL="your.email@company.com" \
  -e JIRA_API_TOKEN="..." \
  -e JIRA_JQL="project = Onboarding AND issuetype = Incident AND status NOT IN (Discarded, Closed) ORDER BY priority ASC" \
  jira-incident-cron
```

Image uses a multi-stage build and a minimal distroless runtime image. It contains only compiled output and production dependencies.

## CI/CD

Repository now includes GitHub Actions workflow at [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml).

Behavior:

- on `pull_request` to `main`, workflow runs `npm ci`, `npm run build` and `docker build`
- on `push` to `main`, workflow also pushes Docker image to `ghcr.io/<owner>/<repo>`
- after image push, workflow connects to the DigitalOcean droplet over SSH, pulls the new image and restarts the container

### Required GitHub Secrets

Create these repository secrets before enabling deploy:

- `DROPLET_HOST` - public IP or hostname of the droplet
- `DROPLET_PORT` - SSH port, usually `22`
- `DROPLET_USER` - SSH user with permission to run Docker
- `DROPLET_SSH_KEY` - private SSH key for the deploy user, including the full key block with `BEGIN`/`END`
- `DROPLET_APP_DIR` - directory on the server where `.env` will be stored, for example `/opt/jira-incident-cron`
- `DROPLET_CONTAINER_NAME` - Docker container name, for example `jira-incident-cron`
- `GHCR_USERNAME` - GitHub username or machine user used for `docker login ghcr.io`
- `GHCR_TOKEN` - GitHub token with at least `read:packages` scope; this token is used on the droplet for `docker login ghcr.io`
- `TEAMS_WEBHOOK_URL`
- `JIRA_BASE_URL`
- `JIRA_EMAIL`
- `JIRA_API_TOKEN`
- `JIRA_JQL` - optional; if omitted or empty, the application default will be used

Recommended values:

- `DROPLET_PORT`: `22`
- `DROPLET_APP_DIR`: `/opt/jira-incident-cron`
- `DROPLET_CONTAINER_NAME`: `jira-incident-cron`
- `JIRA_BASE_URL`: for example `https://your-company.atlassian.net`

Notes:

- `GHCR_TOKEN` does not have to be the same as the GitHub Actions token. It is sent to the droplet and used there to pull the image from `ghcr.io`.
- `DROPLET_SSH_KEY` should contain the full private key text, for example from `~/.ssh/<deploy-key>`.

### Droplet prerequisites

- Docker must be installed on the droplet
- deploy user must be able to run `docker` without interactive sudo prompt
- if the image is private in GHCR, `GHCR_TOKEN` must have access to that package

The workflow writes runtime environment variables into `$DROPLET_APP_DIR/.env`, pulls the image tagged by commit SHA and restarts the container with `--restart unless-stopped`.

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
