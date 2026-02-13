# How to Redeploy Cloud Functions (Step-by-Step)

You have two ways to redeploy your functions. Use **Option A** if you want to deploy from your computer. Use **Option B** if your code is on GitHub and you prefer using the website.

---

## Option A: Deploy from your computer (Firebase CLI)

### Step 1: Open a terminal

- **On Mac**: Press `Cmd + Space`, type **Terminal**, press Enter.
- Or in Cursor: menu **Terminal → New Terminal**.

### Step 2: Go to your project folder

In the terminal, run:

```bash
cd "/Users/shadreckmusarurwa/Project AI/morning-pulse"
```

Press Enter.

### Step 3: Install Firebase CLI (only if you haven’t before)

Check if Firebase is installed:

```bash
firebase --version
```

- If you see a version number (e.g. `13.0.0`), skip to Step 4.
- If you see “command not found”, install it:

```bash
npm install -g firebase-tools
```

### Step 4: Log in to Firebase (only if you haven’t before)

```bash
firebase login
```

A browser window will open. Sign in with the **same Google account** you use for your Firebase project. When it says “Success”, you can close that tab and go back to the terminal.

### Step 5: Deploy only the functions

From the same project folder, run:

```bash
firebase deploy --only functions
```

- The first time it may ask: “Which project do you want to use?” Choose your Morning Pulse project.
- Wait until you see something like “Deploy complete!” and a list of function URLs.

That’s it. Your updated functions (including the news aggregator and webhook) are now live.

---

## Option B: Deploy using GitHub

Your repo has a workflow that deploys functions when something in the `functions/` folder changes.

### Step 1: Push your changes to GitHub

1. In Cursor (or your git app), **commit** the changes to `functions/newsAggregator.js` and `functions/webhook.js`.
2. **Push** to the `main` branch (e.g. `git push origin main`).

### Step 2: Let the workflow run (automatic)

- The workflow **Deploy Cloud Functions** runs automatically when you push changes under `functions/`.
- Go to your repo on GitHub → **Actions** tab.
- You should see a run for “Deploy Cloud Functions”. Wait until it shows a green checkmark (success).

### Step 3: Or run the workflow by hand

1. On GitHub, open your **morning-pulse** repository.
2. Click the **Actions** tab.
3. In the left sidebar, click **Deploy Cloud Functions**.
4. Click the **Run workflow** button (top right).
5. Click the green **Run workflow** again in the dropdown.
6. Wait until the run finishes with a green checkmark.

---

## After deploying: get fresh news

1. **Trigger the news aggregator**  
   - Either wait for its scheduled run (e.g. daily), or  
   - In Firebase Console: **Functions** → find the news aggregator function → **Testing** / “Run” if available, or trigger the Cloud Scheduler job that calls it.

2. **Update the website**  
   - Run your “Deploy Website” workflow (or `npm run build` in `website/` and deploy), so the site picks up the new `news-YYYY-MM-DD.json` and shows current news.

---

## Quick reference

| Goal                     | What to do                                      |
|--------------------------|-------------------------------------------------|
| Deploy from computer     | `firebase deploy --only functions` in project folder |
| Deploy via GitHub        | Push `functions/` to `main` or run “Deploy Cloud Functions” in Actions |
| Check if deploy worked   | Firebase Console → **Functions** → see latest “Last deployed” |

If any step fails, copy the exact error message and we can fix it step by step.
