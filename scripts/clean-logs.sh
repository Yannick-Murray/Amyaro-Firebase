#!/bin/bash

# 🔒 SECURITY: Remove sensitive logs for production build
# This script runs before production deployment

echo "🔒 Removing sensitive console logs for production..."

# Remove DEBUG logs
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/console\.log.*DEBUG.*;//g'

# Remove detailed error logs with sensitive data
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/console\.error.*DEBUG.*;//g'

# Remove drag & drop debug logs
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/console\.log.*🎬.*;//g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/console\.log.*📍.*;//g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/console\.log.*📝.*;//g'

# Remove auth success logs
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/console\.log.*Email verified successfully.*;//g'

echo "✅ Production log cleanup completed!"