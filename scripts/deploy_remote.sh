#!/usr/bin/env bash
set -euo pipefail

HOST=${1:-your.remote.host}
USER=${2:-deploy}
SSH_KEY=${SSH_KEY:-$HOME/.ssh/id_rsa}
REMOTE_DIR=${REMOTE_DIR:-~/genescope_deploy}

ssh -i "$SSH_KEY" "$USER@$HOST" bash -lc "mkdir -p $REMOTE_DIR && cd $REMOTE_DIR && docker compose pull || true && docker compose up -d --remove-orphans"
