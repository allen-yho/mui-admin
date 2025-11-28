#!/bin/bash

# deploy.sh - Frontend Deployment Script

# --- Colors ---
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# --- Functions ---
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
  exit 1
}

run_command() {
  echo -e "${YELLOW}Running: $1${NC}"
  eval "$1"
  if [ $? -ne 0 ]; then
    log_error "Command failed: $1"
  fi
}

# --- Main Script ---
log_info "Starting frontend deployment process..."

# 1. Check if VITE_API_URL is set
if [ -z "$VITE_API_URL" ]; then
  log_warn "VITE_API_URL environment variable is not set."
  log_warn "Using default: http://localhost:8787"
  log_warn "For production, set VITE_API_URL to your backend API URL"
  log_warn "Example: export VITE_API_URL=https://your-api.workers.dev"
fi

# 2. Type Check
log_info "Running TypeScript type check..."
run_command "npm run type-check"
log_info "TypeScript type check passed."

# 3. Build
log_info "Building production bundle..."
run_command "npm run build"
log_info "Build completed successfully!"

# 4. Output directory
log_info "Build output is in the 'dist' directory"
log_info "You can now deploy the 'dist' directory to your hosting service:"
log_info "  - Vercel: vercel deploy dist"
log_info "  - Cloudflare Pages: wrangler pages deploy dist"
log_info "  - Netlify: netlify deploy --dir=dist"
log_info "  - Or upload 'dist' folder to any static hosting service"

log_info "Deployment process finished."

