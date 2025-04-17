#!/bin/bash

# Exit on error
set -e

# Default values
DRY_RUN=false
HELP=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help|-h)
            HELP=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Show help if requested
if [ "$HELP" = true ]; then
    echo "Usage: ./update-tokens.sh [options]"
    echo ""
    echo "Options:"
    echo "  --dry-run    Preview changes without making them"
    echo "  --help, -h   Show this help message"
    echo ""
    echo "This script will:"
    echo "1. Create a new branch with today's date"
    echo "2. Check for changes in design-tokens.json"
    echo "3. Commit and push changes"
    echo "4. Create a PR (if GitHub CLI is installed)"
    exit 0
fi

# Get current date for branch name
BRANCH_NAME="update-tokens-$(date +%Y-%m-%d)"

# Check if branch already exists
if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
    echo "Branch $BRANCH_NAME already exists. Please handle any existing changes first."
    exit 1
fi

# Create and switch to new branch
if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would create new branch: $BRANCH_NAME"
else
    echo "Creating new branch: $BRANCH_NAME"
    git checkout -b "$BRANCH_NAME"
fi

# Check if design-tokens.json exists
if [ ! -f "design-tokens.json" ]; then
    echo "Error: design-tokens.json not found"
    exit 1
fi

# Stage the file
if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would stage design-tokens.json"
else
    git add design-tokens.json
fi

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "No changes detected in design-tokens.json"
    exit 0
fi

# Commit changes
if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would commit changes with message: Update design tokens $(date +%Y-%m-%d)"
else
    echo "Committing changes..."
    git commit -m "Update design tokens $(date +%Y-%m-%d)"
fi

# Push branch
if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would push branch to remote"
else
    echo "Pushing branch to remote..."
    git push origin "$BRANCH_NAME"
fi

# Create PR using GitHub CLI if available
if command -v gh &> /dev/null; then
    if [ "$DRY_RUN" = true ]; then
        echo "[DRY RUN] Would create PR with:"
        echo "  Title: Update Design Tokens $(date +%Y-%m-%d)"
        echo "  Base: main"
        echo "  Head: $BRANCH_NAME"
        echo "  Labels: design-tokens,automated"
    else
        echo "Creating pull request..."
        gh pr create \
            --title "Update Design Tokens $(date +%Y-%m-%d)" \
            --body "Automated update of design tokens for $(date +%Y-%m-%d)" \
            --base main \
            --head "$BRANCH_NAME" \
            --label "design-tokens,automated"
    fi
else
    echo "GitHub CLI not found. Please create PR manually:"
    echo "https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]//;s/\.git$//')/compare/main...$BRANCH_NAME"
fi

if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Process would be complete! 🎉"
else
    echo "Process complete! 🎉"
fi 