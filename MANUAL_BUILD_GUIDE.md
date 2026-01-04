# How to Manually Trigger a Fresh Build on GitHub

## Step-by-Step Instructions

### Step 1: Go to GitHub Actions
1. Open your browser and go to: `https://github.com/kudzimusar/morning-pulse`
2. Click on the **"Actions"** tab at the top of the page (next to "Code", "Issues", etc.)

### Step 2: Find Your Workflow
1. In the left sidebar, you should see **"Deploy Website to GitHub Pages"**
2. Click on it

### Step 3: Trigger a Fresh Build
1. Look for a button that says **"Run workflow"** on the right side (or at the top)
2. Click **"Run workflow"**
3. A dropdown will appear
4. Make sure **"main"** branch is selected
5. Click the green **"Run workflow"** button

### Step 4: Watch the Build
1. You'll see a new workflow run appear at the top of the list
2. Click on it to see the build progress
3. The build will take a few minutes
4. If it succeeds, you'll see a green checkmark ✅
5. If it fails, you'll see a red X ❌

### Step 5: Check the Logs (if it fails)
1. Click on the failed build
2. Click on **"deploy"** job
3. Click on **"Build Website"** step
4. Scroll down to see the error messages

---

## Alternative: Clear Cache and Rebuild

If the build still fails, the cache might be the issue. The workflow has been updated to clear caches automatically, but you can also:

1. Go to **Settings** → **Actions** → **Caches**
2. Delete any caches related to the build
3. Then trigger a fresh build using Step 3 above

---

## What to Look For

When the build runs, check:
- **Which commit is being used**: Look for "Checkout Repository" step - it should show commit `632f043` or later
- **Build errors**: If you see `***` characters in the error, the cache is stale
- **Success**: If the build completes with a green checkmark, your site is deployed!
