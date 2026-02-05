# Manual Scheduler Update Required

## ⚠️ Important: Scheduler Update Needed

The workflow file has been updated to set the scheduler to run twice daily, but the **existing scheduler in Google Cloud needs to be manually updated** because the workflow only updates it if the function URL changes.

## Step-by-Step: Update Scheduler to Twice Daily

### Step 1: Open Cloud Scheduler
1. Go to: https://console.cloud.google.com/cloudscheduler?project=gen-lang-client-0999441419
2. Find the job named: **`daily-news-aggregation`**
3. Click on it to open the details

### Step 2: Edit the Scheduler
1. Click the **"EDIT"** button (top right)
2. You'll see the scheduler configuration form

### Step 3: Update Frequency
1. Find the **"Frequency"** field
2. **Current value:** `0 2 * * *` (runs once daily at 2 AM UTC)
3. **Change to:** `0 2,14 * * *` (runs twice daily at 2 AM and 2 PM UTC)
4. This means: "At minute 0 of hours 2 and 14, every day"

### Step 4: Update Description (Optional)
1. Find the **"Description"** field
2. **Current:** "Daily news aggregation for Morning Pulse"
3. **Change to:** "Twice daily news aggregation for Morning Pulse (2 AM and 2 PM UTC)"

### Step 5: Save Changes
1. Scroll down and click **"UPDATE"** or **"SAVE"** button
2. Wait for confirmation that the scheduler has been updated

### Step 6: Verify Update
1. Go back to the scheduler list
2. Verify the **Frequency** column shows: `0 2,14 * * *`
3. Verify the **State** is still "Enabled"

## Expected Result

After updating, the scheduler will:
- ✅ Run at **2:00 AM UTC** every day
- ✅ Run at **2:00 PM UTC** every day
- ✅ Show frequency as: `0 2,14 * * *`

## Next Scheduled Runs

After updating, you can check the "Next run" time in the scheduler details. It should show the next execution time based on the new schedule.

## Troubleshooting

### If "UPDATE" button is grayed out:
- Make sure you have proper IAM permissions
- Try refreshing the page

### If update fails:
- Check that the function URL is still valid
- Verify the function is deployed and active

### To verify it's working:
1. Wait for the next scheduled run (2 AM or 2 PM UTC)
2. Check the execution history in the scheduler
3. Verify news appears in Firestore after the run

---

**Note:** Future deployments will automatically update the scheduler to this frequency, but this one-time manual update is required to fix the current configuration.
