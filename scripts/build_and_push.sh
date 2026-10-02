#!/usr/bin/env bash
set -euo pipefail

# Edit these variables or pass via env
REGISTRY=${REGISTRY:-docker.io}
USERNAME=${USERNAME:-yourusername}
BACKEND_IMAGE=${BACKEND_IMAGE:-$USERNAME/genescope-backend:latest}
FRONTEND_IMAGE=${FRONTEND_IMAGE:-$USERNAME/genescope-frontend:latest}

# Build images
docker build -t pbl-backend:latest backend
docker build -t pbl-frontend:latest frontend

# Tag for registry
docker tag pbl-backend:latest ${BACKEND_IMAGE}
docker tag pbl-frontend:latest ${FRONTEND_IMAGE}

# Push
docker push ${BACKEND_IMAGE}
docker push ${FRONTEND_IMAGE}

echo "Pushed images: ${BACKEND_IMAGE} ${FRONTEND_IMAGE}"
