# Deployment Instructions

## GitHub Token Permission Issue

Your GitHub Personal Access Token needs the `workflow` scope to update workflow files. You have two options:

### Option 1: Update Token Permissions (Recommended)
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Edit your token and add the `workflow` scope
3. Then push the changes again

### Option 2: Manual Workflow File Addition
Add the workflow file manually through GitHub UI:

1. Go to your repository on GitHub
2. Click "Add file" → "Create new file"
3. Path: `.github/workflows/deploy_website.yml`
4. Copy the content from the file below
5. Commit the file

## Workflow File Content

Copy this content to `.github/workflows/deploy_website.yml`:

```yaml
name: Deploy Website to GitHub Pages

on:
  push:
    branches:
      - main
    paths:
      - 'website/**'
      - 'scripts/**'
      - '.github/workflows/deploy_website.yml'
  workflow_dispatch: # Allows manual trigger
  schedule:
    # Run daily at 2 AM UTC (adjust timezone as needed)
    - cron: '0 2 * * *'

permissions:
  contents: read
  pages: write
  id-token: write

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  APP_ID: morning-pulse-app

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      # Authenticate to Google Cloud for Firestore access
      - name: Authenticate Google Cloud
        uses: 'google-github-actions/auth@v2'
        with:
          credentials_json: '${{ secrets.GCP_SA_KEY }}'

      - name: Setup gcloud SDK
        uses: google-github-actions/setup-gcloud@v2
        with:
          project_id: ${{ env.PROJECT_ID }}

      # Install website dependencies
      - name: Install Website Dependencies
        run: |
          cd website
          npm install

      # Install script dependencies (for static generation)
      - name: Install Script Dependencies
        run: |
          cd functions
          npm install

      # Generate static news data from Firestore (Mode B)
      - name: Generate Static News Data
        env:
          FIREBASE_ADMIN_CONFIG: ${{ secrets.GCP_SA_KEY }}
          APP_ID: ${{ env.APP_ID }}
        run: |
          node scripts/generateStaticSite.js
        continue-on-error: true # Continue even if static generation fails

      # Build website
      - name: Build Website
        run: |
          cd website
          npm run build

      # Setup Pages
      - name: Setup Pages
        uses: actions/configure-pages@v4

      # Upload artifact
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './website/dist'

      # Deploy to GitHub Pages
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## Next Steps After Adding Workflow

1. **Wait for GitHub Actions to deploy the functions**
   - The `gcp_deploy.yml` workflow will automatically deploy both `webhook` and `newsAggregator` functions
   - Cloud Scheduler will be automatically configured during deployment

2. **Verify deployment**
   - Check GitHub Actions tab to see deployment status
   - Once deployed, the Cloud Scheduler will be set up automatically

3. **Configure Firebase for real-time mode** (next step)
   - See WEBSITE_SETUP.md for Firebase configuration

## Current Status

✅ Code committed (except workflow files due to token permissions)
⏳ Waiting for workflow files to be added manually or token permissions updated
⏳ Functions will deploy automatically once workflow is in place
⏳ Cloud Scheduler will be set up automatically during deployment

