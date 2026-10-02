Deployment Guide
================

This repository contains a Next.js frontend and a FastAPI backend. The following files were added to enable containerized deployment:

- `backend/Dockerfile`
- `frontend/Dockerfile`
- `docker-compose.yml`
- `.github/workflows/deploy.yml` (CI template — requires secrets)

Quick local deployment (Docker required)
--------------------------------------

1. Build and start services with Docker Compose:

```bash
docker compose build
docker compose up -d
```

2. The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:8000`.

Persistence:
- The SQLite database used by the backend is stored in the `backend/data` folder and is mounted into a Docker volume called `backend_data` defined in `docker-compose.yml`.

CI/CD (GitHub Container Registry + optional SSH deploy)
-----------------------------------------------------

1. The workflow `.github/workflows/deploy.yml` builds and pushes images to GitHub Container Registry (GHCR). No secrets are required to push to GHCR for the repository owner using the default `GITHUB_TOKEN`.
2. To automatically deploy to a remote server, enable & configure the `deploy` job and set the secrets `DEPLOY_HOST`, `DEPLOY_USER`, and `DEPLOY_KEY`.

Notes and recommendations for 5-day uptime
-----------------------------------------
- Use a cloud provider (DigitalOcean, AWS, Linode) with a small VM and Docker installed. Place the `docker-compose.yml` at `/opt/omics/` and configure a systemd service or Docker restart policies (already `unless-stopped`) to ensure containers restart on reboot.
- Optionally use a process manager / monitor (UptimeRobot, Healthchecks.io) to poll `http://your-server:8000/health` every minute and alert if it fails.
- For high availability or production, consider migrating the SQLite DB to a managed Postgres and host the backend on Render or Cloud Run.

If you want, I can:
- Create a deployment branch and push these files to the linked GitHub repo (requires write access or a PAT).
- Configure and enable the GitHub Actions deploy job with your server SSH key (you must add secrets).
- Build and run the containers here locally (requires Docker on this machine).
