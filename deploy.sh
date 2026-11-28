#!/bin/bash
set -e  # stop on the first failure (e.g. a failed migration)
echo "🚀 Starting deployment..."

# Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Apply database migrations (never `db push --accept-data-loss` on production:
# it can drop columns and data). See docs/ACCOUNTS_ROLLOUT.md for the one-time baseline step.
echo "🗄️ Applying database migrations..."
npx prisma migrate deploy

# Build the project
echo "🏗️ Building the project..."
npm run build

# Reload the PM2 process
echo "🔄 Reloading PM2 process..."
# Try to reload by name, or if not found, use the current directory context
pm2 reload 0 --update-env || pm2 start dist/index.js --name ride-with-the-warriors-server

echo "✅ Deployment complete!"
