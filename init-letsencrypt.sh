#!/usr/bin/env bash
# =============================================================================
# init-letsencrypt.sh — One-time SSL certificate bootstrap for minuto90.site
#
# Uses Cloudflare DNS challenge — no port 80 required, works behind Cloudflare proxy.
#
# Prerequisites:
#   1. Create certbot/cloudflare.ini from certbot/cloudflare.ini.example
#   2. Set chmod 600 certbot/cloudflare.ini
#
# Usage:
#   chmod +x init-letsencrypt.sh
#   ./init-letsencrypt.sh [--staging]
#
# --staging: request a test cert (no rate limits). Use to verify setup first.
# =============================================================================

set -euo pipefail

DOMAIN="minuto90.site"
EXTRA_DOMAINS="www.minuto90.site"
EMAIL="${LETSENCRYPT_EMAIL:-}"
COMPOSE_FILE="docker-compose.prod.yml"
CF_CREDS="certbot/cloudflare.ini"
STAGING=0

# ── Parse flags ───────────────────────────────────────────────────────────────
for arg in "$@"; do
  case $arg in
    --staging) STAGING=1 ;;
  esac
done

# ── Require Cloudflare credentials file ──────────────────────────────────────
if [ ! -f "$CF_CREDS" ]; then
  echo "ERROR: $CF_CREDS not found." >&2
  echo "  Copy certbot/cloudflare.ini.example to certbot/cloudflare.ini" >&2
  echo "  and fill in your Cloudflare API token, then re-run." >&2
  exit 1
fi
chmod 600 "$CF_CREDS"

# ── Require email ─────────────────────────────────────────────────────────────
if [ -z "$EMAIL" ]; then
  echo "Enter the email for Let's Encrypt expiry notifications:"
  read -r EMAIL
fi

if [ -z "$EMAIL" ]; then
  echo "ERROR: email is required." >&2
  exit 1
fi

echo ""
echo "════════════════════════════════════════════"
echo "  minuto90.site — Let's Encrypt bootstrap"
echo "  Domain : $DOMAIN, $EXTRA_DOMAINS"
echo "  Email  : $EMAIL"
echo "  Staging: $STAGING"
echo "════════════════════════════════════════════"
echo ""

# ── Create dirs ───────────────────────────────────────────────────────────────
mkdir -p "certbot/conf"

# ── Download recommended TLS params (only if not already present) ─────────────
TLS_PARAMS_URL="https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf"
DH_PARAMS_URL="https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem"

if [ ! -f "certbot/conf/options-ssl-nginx.conf" ]; then
  echo "→ Downloading recommended TLS parameters..."
  curl -sSf "$TLS_PARAMS_URL" -o certbot/conf/options-ssl-nginx.conf
  curl -sSf "$DH_PARAMS_URL"  -o certbot/conf/ssl-dhparams.pem
  echo "  Done."
fi

# ── Request certificate via Cloudflare DNS challenge ─────────────────────────
# No port 80 needed — certbot adds a TXT record via Cloudflare API.
echo "→ Requesting Let's Encrypt certificate (DNS challenge)..."
STAGING_FLAG=""
[ "$STAGING" = "1" ] && STAGING_FLAG="--staging"

docker run --rm \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  -v "$(pwd)/$CF_CREDS:/etc/cloudflare.ini:ro" \
  certbot/dns-cloudflare certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/cloudflare.ini \
  --dns-cloudflare-propagation-seconds 20 \
  $STAGING_FLAG \
  --email "$EMAIL" \
  -d "$DOMAIN" -d "$EXTRA_DOMAINS" \
  --agree-tos \
  --no-eff-email \
  --force-renewal

echo ""
echo "════════════════════════════════════════════"
echo "  Certificate obtained successfully!"
echo ""
echo "  Next step — start the full stack:"
echo "  docker compose -f docker-compose.prod.yml up -d --build"
echo "════════════════════════════════════════════"

