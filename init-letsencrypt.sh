#!/usr/bin/env bash
# =============================================================================
# init-letsencrypt.sh — One-time SSL certificate bootstrap for minuto90.site
#
# Run this ONCE on first deploy before starting the full stack.
# After this, certbot auto-renews every 12h via the certbot container.
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
STAGING=0

# ── Parse flags ───────────────────────────────────────────────────────────────
for arg in "$@"; do
  case $arg in
    --staging) STAGING=1 ;;
  esac
done

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
mkdir -p "certbot/conf/live/$DOMAIN"
mkdir -p "certbot/www"

# ── Download recommended TLS params (only if not already present) ─────────────
TLS_PARAMS_URL="https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf"
DH_PARAMS_URL="https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem"

if [ ! -f "certbot/conf/options-ssl-nginx.conf" ]; then
  echo "→ Downloading recommended TLS parameters..."
  curl -sSf "$TLS_PARAMS_URL" -o certbot/conf/options-ssl-nginx.conf
  curl -sSf "$DH_PARAMS_URL"  -o certbot/conf/ssl-dhparams.pem
  echo "  Done."
fi

# ── Create a temporary self-signed cert so Nginx can start ────────────────────
echo "→ Creating temporary self-signed certificate..."
openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
  -keyout "certbot/conf/live/$DOMAIN/privkey.pem" \
  -out    "certbot/conf/live/$DOMAIN/fullchain.pem" \
  -subj   "/CN=localhost" 2>/dev/null
echo "  Done."

# ── Start only the Nginx container (backends not needed for cert issuance) ────
echo "→ Starting Nginx (HTTP only for ACME challenge)..."
docker compose -f "$COMPOSE_FILE" up -d worldcup-frontend
sleep 3

# ── Delete the dummy cert ─────────────────────────────────────────────────────
echo "→ Removing dummy certificate..."
rm -rf certbot/conf/live certbot/conf/renewal certbot/conf/archive

# ── Request the real certificate ─────────────────────────────────────────────
echo "→ Requesting Let's Encrypt certificate..."
STAGING_FLAG=""
[ "$STAGING" = "1" ] && STAGING_FLAG="--staging"

docker compose -f "$COMPOSE_FILE" run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  $STAGING_FLAG \
  --email "$EMAIL" \
  -d "$DOMAIN" -d "$EXTRA_DOMAINS" \
  --agree-tos \
  --no-eff-email \
  --force-renewal

# ── Reload Nginx with the real cert ──────────────────────────────────────────
echo "→ Reloading Nginx with the real certificate..."
docker compose -f "$COMPOSE_FILE" exec worldcup-frontend nginx -s reload

echo ""
echo "════════════════════════════════════════════"
echo "  Certificate obtained successfully!"
echo ""
echo "  Next step — start the full stack:"
echo "  docker compose -f docker-compose.prod.yml up -d --build"
echo "════════════════════════════════════════════"
