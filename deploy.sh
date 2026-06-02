#!/bin/bash
echo "🚀 Starting deployment..."

# Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Sync database schema
echo "🗄️ Syncing database schema..."
npx prisma db push --accept-data-loss

# Build the project
echo "🏗️ Building the project..."
npm run build

# Reload the PM2 process
echo "🔄 Reloading PM2 process..."
# Try to reload by name, or if not found, use the current directory context
pm2 reload 0 --update-env || pm2 start dist/index.js --name ride-with-the-warriors-server

echo "✅ Deployment complete!"
