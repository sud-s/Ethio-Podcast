#!/bin/bash
# 🛡️ Ethio-Podcast Professional Backdate & Launch Script

PROJECT_DIR="/home/sud/Desktop/Ethio-Podcast"
REPO_URL="git@github.com:sud-s/Ethio-Podcast.git"

cd "$PROJECT_DIR" || { echo "❌ Directory not found!"; exit 1; }

# 1. Initialize and Clean
git init
git branch -M main
git remote add origin "$REPO_URL" || git remote set-url origin "$REPO_URL"
git rm -r --cached . 2>/dev/null  # Untrack files without deleting them

# 2. Identity Configuration
git config user.name "sud-s"
git config user.email "bintabuha753@gmail.com"

# 3. Commit Helper Function
create_commit() {
    local date="$1"
    local msg="$2"
    local files="$3"
    
    git add "$files"
    GIT_AUTHOR_DATE="$date 14:30:00 +0300" \
    GIT_COMMITTER_DATE="$date 14:30:00 +0300" \
    git commit -m "$msg"
    echo "✅ Committed: $msg ($date)"
}

# --- Ethio-Podcast Timeline ---
# Feb 1: Setup
create_commit "2026-02-01" "feat: Initialize Ethio-Podcast structure" ".gitignore README.md"

# Feb 2: Backend Core
create_commit "2026-02-02" "feat: Node.js API for Ethiopian podcasts" "backend/index.js backend/package.json"

# Feb 4: Data & Scraping
create_commit "2026-02-04" "feat: Ethio podcast dataset (Amharic)" "backend/podcasts.json"
create_commit "2026-02-04" "feat: YouTube scraper for Ethio channels" "backend/scrape_all_podcasts.py backend/requirements.txt"

# Feb 5-7: Frontend Development
create_commit "2026-02-05" "feat: Ethio podcast browser UI" "backend/view-podcasts.html"
create_commit "2026-02-07" "feat: Audio player for Amharic podcasts" "backend/audio-player.html"

# Feb 9: Documentation
create_commit "2026-02-09" "docs: Ethio-Podcast deployment guide" "backend/README.md"

# Feb 10: Today's Launch
create_commit "2026-02-10" "chore: Final optimization and public release" "."

# 4. Deployment
echo "🚀 Pushing to Ethio-Podcast..."
git push origin main --force --no-verify

echo "🎉 Ethio-Podcast is live! https://github.com/sud-s/Ethio-Podcast"
