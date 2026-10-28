#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
command -v gh >/dev/null || { echo "Install GitHub CLI and run gh auth login first." >&2; exit 1; }
for repo in checkout-service api-gateway user-management product-catalog inventory-service payment-service notification-service storefront; do
  if [ -d "$root/$repo" ]; then
    echo "Keeping existing checkout: $root/$repo"
  else
    gh repo clone "Harbour-Commerce-Demo/$repo" "$root/$repo"
  fi
done
echo "Ready. Run docker compose up --build -d --wait from platform-infra."
