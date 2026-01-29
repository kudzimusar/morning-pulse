# Newsletter Function Testing Guide

## 🎯 Overview

This guide will help you test all newsletter-related Cloud Functions after deployment to ensure they're working correctly with the CORS fixes.

## ⏱️ Prerequisites

1. **Wait for Deployment** (5-10 minutes)
   - Go to GitHub Actions: https://github.com/kudzimusar/morning-pulse/actions
   - Wait for "Deploy WhatsApp Bot to Google Cloud Functions" workflow to complete
   - Verify all 5 functions deployed successfully (green checkmarks)

2. **Get Function URLs** (from GitHub Actions logs or Google Cloud Console)
   - `sendNewsletter`: https://us-central1-morning-pulse-app.cloudfunctions.net/sendNewsletter
   - `manageSubscription`: https://us-central1-morning-pulse-app.cloudfunctions.net/manageSubscription
   - `sendScheduledNewsletter`: https://us-central1-morning-pulse-app.cloudfunctions.net/sendScheduledNewsletter

---

## 📋 Testing Checklist

### ✅ Test 1: CORS Preflight (OPTIONS Request)

**Purpose**: Verify CORS headers are properly set for preflight requests.

**Test Method**: Browser Console

1. Open your website: https://kudzimusar.github.io/morning-pulse/
2. Open Browser DevTools (F12 or Cmd+Option+I)
3. Go to **Console** tab
4. Run this command:

```javascript
fetch('https://us-central1-morning-pulse-app.cloudfunctions.net/sendNewsletter', {
  method: 'OPTIONS',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(r => {
  console.log('✅ CORS Preflight Status:', r.status);
  console.log('✅ CORS Headers:', {
    'Access-Control-Allow-Origin': r.headers.get('Access-Control-Allow-Origin'),
    'Access-Control-Allow-Methods': r.headers.get('Access-Control-Allow-Methods'),
    'Access-Control-Allow-Headers': r.headers.get('Access-Control-Allow-Headers')
  });
})
.catch(e => console.error('❌ CORS Error:', e));
```

**Expected Result**:
- Status: `204` (No Content)
- Headers include:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: GET, POST, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type, Authorization`

**If Failed**: Check function logs in Google Cloud Console

---

### ✅ Test 2: Subscribe to Newsletter

**Purpose**: Test the `manageSubscription` function with `subscribe` action.

**Test Method**: Website UI or Browser Console

#### Option A: Website UI
1. Go to your newsletter subscription form on the website
2. Enter a test email (e.g., `test@example.com`)
3. Click "Subscribe"
4. Check browser console for errors

#### Option B: Browser Console
```javascript
fetch('https://us-central1-morning-pulse-app.cloudfunctions.net/manageSubscription', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'subscribe',
    email: 'test@example.com',
    name: 'Test User',
    interests: ['Tech', 'Business']
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Subscribe Response:', data);
  if (data.success) {
    console.log('✅ Successfully subscribed!');
  } else {
    console.error('❌ Subscription failed:', data.error);
  }
})
.catch(e => console.error('❌ Request Error:', e));
```

**Expected Result**:
```json
{
  "success": true,
  "message": "Successfully subscribed to newsletter",
  "subscriber": {
    "email": "test@example.com",
    "name": "Test User",
    "interests": ["Tech", "Business"]
  }
}
```

**Verify in Firestore**:
1. Go to Firebase Console: https://console.firebase.google.com
2. Navigate to Firestore Database
3. Check path: `artifacts/morning-pulse-app/public/data/subscribers/test@example.com`
4. Verify fields:
   - `status: 'active'`
   - `emailNewsletter: true`
   - `subscribedAt` timestamp exists
   - `interests` array matches

---

### ✅ Test 3: Send Test Newsletter

**Purpose**: Test the `sendNewsletter` function to send an email to subscribers.

**Test Method**: Admin Dashboard or Browser Console

#### Option A: Admin Dashboard
1. Log in to your admin dashboard
2. Navigate to Newsletter section
3. Create a test newsletter:
   - Subject: "Test Newsletter - CORS Fix Verification"
   - HTML: `<h1>Test Newsletter</h1><p>This is a test to verify CORS fixes are working.</p>`
4. Click "Send Newsletter"
5. Check browser console for errors

#### Option B: Browser Console
```javascript
fetch('https://us-central1-morning-pulse-app.cloudfunctions.net/sendNewsletter', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    newsletter: {
      subject: 'Test Newsletter - CORS Fix Verification',
      html: '<h1>Test Newsletter</h1><p>This is a test to verify CORS fixes are working.</p>'
    }
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Send Newsletter Response:', data);
  if (data.success) {
    console.log(`✅ Newsletter sent to ${data.stats.successfulSends} subscribers`);
    console.log('📊 Stats:', data.stats);
  } else {
    console.error('❌ Newsletter send failed:', data.error);
  }
})
.catch(e => console.error('❌ Request Error:', e));
```

**Expected Result**:
```json
{
  "success": true,
  "message": "Newsletter sent successfully to X subscribers",
  "stats": {
    "totalSubscribers": 1,
    "targetedSubscribers": 1,
    "successfulSends": 1,
    "failedSends": 0
  }
}
```

**Verify**:
1. Check your test email inbox (test@example.com)
2. Email should arrive within 1-2 minutes
3. Check Firestore analytics: `artifacts/morning-pulse-app/analytics/newsletters/sends`
4. Verify send log was created with correct stats

---

### ✅ Test 4: Update Subscription Preferences

**Purpose**: Test updating subscriber interests.

**Test Method**: Browser Console

```javascript
fetch('https://us-central1-morning-pulse-app.cloudfunctions.net/manageSubscription', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'update',
    email: 'test@example.com',
    name: 'Updated Test User',
    interests: ['Sports', 'Global']
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Update Response:', data);
  if (data.success) {
    console.log('✅ Preferences updated successfully!');
  }
})
.catch(e => console.error('❌ Request Error:', e));
```

**Expected Result**:
```json
{
  "success": true,
  "message": "Subscription preferences updated",
  "subscriber": {
    "email": "test@example.com",
    "name": "Updated Test User",
    "interests": ["Sports", "Global"]
  }
}
```

**Verify in Firestore**: Check that `interests` array was updated

---

### ✅ Test 5: Unsubscribe

**Purpose**: Test unsubscribing from newsletter.

**Test Method**: Browser Console

```javascript
fetch('https://us-central1-morning-pulse-app.cloudfunctions.net/manageSubscription', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'unsubscribe',
    email: 'test@example.com'
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Unsubscribe Response:', data);
  if (data.success) {
    console.log('✅ Successfully unsubscribed!');
  }
})
.catch(e => console.error('❌ Request Error:', e));
```

**Expected Result**:
```json
{
  "success": true,
  "message": "Successfully unsubscribed from newsletter"
}
```

**Verify in Firestore**: 
- `status: 'inactive'`
- `emailNewsletter: false`
- `unsubscribedAt` timestamp exists

---

### ✅ Test 6: Send Scheduled Newsletter

**Purpose**: Test the `sendScheduledNewsletter` function (weekly/daily digest).

**Test Method**: Browser Console or Cloud Scheduler

#### Option A: Manual Trigger (Browser Console)
```javascript
fetch('https://us-central1-morning-pulse-app.cloudfunctions.net/sendScheduledNewsletter', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    newsletterType: 'weekly' // or 'daily'
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Scheduled Newsletter Response:', data);
  if (data.success) {
    console.log(`✅ Scheduled newsletter sent to ${data.stats.successfulSends} subscribers`);
    console.log(`📰 Articles included: ${data.stats.articlesCount}`);
  }
})
.catch(e => console.error('❌ Request Error:', e));
```

**Expected Result**:
```json
{
  "success": true,
  "message": "Scheduled weekly newsletter sent to X subscribers",
  "stats": {
    "articlesCount": 5,
    "subscribersCount": 1,
    "successfulSends": 1,
    "failedSends": 0
  }
}
```

**Note**: This function requires published articles in Firestore. If no articles exist, you'll get:
```json
{
  "success": true,
  "message": "No new articles for newsletter period",
  "articlesCount": 0
}
```

---

## 🔍 Troubleshooting

### Issue: CORS Error Still Appearing

**Symptoms**: 
- Browser console shows: `Access to fetch... has been blocked by CORS policy`
- OPTIONS request returns 404 or no CORS headers

**Solutions**:
1. **Wait for deployment**: Functions may still be deploying (check GitHub Actions)
2. **Check function logs**: Google Cloud Console → Cloud Functions → Logs
3. **Verify function code**: Ensure `setCorsHeaders()` is called before any response
4. **Clear browser cache**: Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### Issue: Function Returns 500 Error

**Symptoms**: 
- Response: `{"success": false, "error": "..."}`
- Status code: 500

**Solutions**:
1. **Check function logs**: Google Cloud Console → Cloud Functions → Logs
2. **Verify environment variables**: Ensure all secrets are set in GitHub Actions
3. **Check Firestore permissions**: Verify Firestore rules allow the operations
4. **Check Brevo API key**: Ensure `MORNING_PULSE_BREVO` secret is set

### Issue: Email Not Received

**Symptoms**: 
- Function returns success but no email arrives

**Solutions**:
1. **Check spam folder**: Email might be filtered
2. **Verify Brevo configuration**: Check Brevo dashboard for sent emails
3. **Check function logs**: Look for email sending errors
4. **Verify email address**: Ensure test email is valid and accessible
5. **Check Brevo API limits**: Verify you haven't exceeded sending limits

### Issue: Firestore Permission Errors

**Symptoms**: 
- Error: `Missing or insufficient permissions`

**Solutions**:
1. **Check Firestore rules**: Verify rules allow public read/create for subscribers
2. **Verify Firebase Admin config**: Ensure `FIREBASE_ADMIN_CONFIG` secret is correct
3. **Check function logs**: Look for Firebase initialization errors

---

## 📊 Success Criteria

All tests pass when:

- ✅ OPTIONS preflight returns 204 with CORS headers
- ✅ Subscribe creates subscriber document in Firestore
- ✅ Send Newsletter returns success and email is received
- ✅ Update preferences modifies subscriber document
- ✅ Unsubscribe sets status to 'inactive'
- ✅ Scheduled Newsletter sends with articles (if articles exist)
- ✅ No CORS errors in browser console
- ✅ Analytics logged in Firestore

---

## 🚀 Next Steps After Testing

Once all tests pass:

1. **Monitor Analytics**: Check Firestore analytics collection for send statistics
2. **Set Up Cloud Scheduler**: Configure automated weekly/daily newsletters
3. **Test with Real Subscribers**: Add real email addresses and test
4. **Monitor Function Logs**: Keep an eye on Google Cloud Console logs for errors
5. **Set Up Alerts**: Configure alerts for function failures

---

## 📝 Notes

- All functions now use manual CORS handling (no `cors` package)
- CORS headers are set before any response
- OPTIONS requests are handled explicitly
- Functions work with Google Cloud Functions (not Firebase Functions)
- All environment variables must be set in GitHub Actions secrets

---

**Last Updated**: After CORS fixes implementation
**Functions Tested**: sendNewsletter, manageSubscription, sendScheduledNewsletter
