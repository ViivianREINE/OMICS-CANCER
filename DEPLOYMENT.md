Deployment Guide — GeneScope AI

Overview
- This document explains how to build, test, and deploy the project using Docker Compose or CI/CD.

Prerequisites
- Docker, Docker Compose installed on build/deploy hosts.
- Node 18+ and Python 3.10+ for local builds.

Local Build & Test (Compose)
1. Build images locally (no cache):

```bash
cd /path/to/repo
docker compose build --no-cache
```

2. Start services:

```bash
docker compose up -d
docker compose logs -f
```

3. Visit frontend at `http://localhost:3000` and backend at `http://localhost:8000`.

Notes: The frontend Dockerfile uses `node:20-slim` to avoid LightningCSS native binary errors with musl-based images.

Push Images to a Registry
1. Tag images and push (example Docker Hub):

```bash
docker tag pbl-backend:latest <registry_user>/genescope-backend:latest
docker push <registry_user>/genescope-backend:latest

docker tag pbl-frontend:latest <registry_user>/genescope-frontend:latest
docker push <registry_user>/genescope-frontend:latest
```

CI/CD
- A GitHub Actions workflow is provided at `.github/workflows/ci-cd.yml` which builds and pushes images and can deploy via SSH. Configure these repository secrets:
  - `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`
  - `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `SSH_PORT` (optional)

Remote Deploy (example)
1. Copy `docker-compose.yml` and `.env.production` to the remote host (or store env vars in the host's environment).
2. On the remote host:

```bash
docker compose pull
docker compose up -d --remove-orphans
```

Troubleshooting
- If frontend build fails with LightningCSS missing binary on Alpine, switch to Debian-based Node image (done in `frontend/Dockerfile`).
- If ports are in use, stop conflicting services or change ports in `docker-compose.yml`.
- Ensure SQLite DB files are persisted (compose defines `backend_data` volume).

Helper scripts
- `scripts/build_and_push.sh` — build images and push to registry (edit variables inside).
- `scripts/deploy_remote.sh` — SSH to host and run `docker compose pull && docker compose up -d`.

Security
- Never commit `.env.production` or any secret values. Use `.env.production.example` as a template.

Contact
- For further assistance, tell me which target host (Docker host, GCP Cloud Run, Kubernetes) you prefer and I can produce provider-specific manifests.
