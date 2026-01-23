# Staff Invitation Guide - How to Join Morning Pulse

## 📧 You've Been Invited!

If you received an invitation link like this:
```
https://kudzimusar.github.io/#join?token=1a3a8e50-34a6-4fe8-9efe-91c91ffef3ab
```

This means an administrator has invited you to join the Morning Pulse editorial team. Follow these steps to create your account.

---

## ✅ Step-by-Step Instructions

### **Step 1: Open the Invitation Link**

1. **Click the link** in your email or message
   - The link will open in your web browser
   - You'll see a "Welcome to Morning Pulse" page

2. **Wait for validation** (a few seconds)
   - The system checks if your invitation is valid
   - You'll see a loading spinner: "Validating invitation..."

### **Step 2: Review Your Invitation Details**

Once validated, you'll see:
- ✅ **Your name** (as provided by the admin)
- ✅ **Your email address**
- ✅ **Your assigned role(s)** (Editor, Writer, Admin, etc.)
- ✅ **Who invited you** (admin's name)

**Example:**
```
You've been invited as:
Jane Doe
jane@example.com
[Editor] [Writer]
Invited by: John Admin
```

### **Step 3: Create Your Password**

1. **Enter a password** in the "Create Password" field
   - Minimum 6 characters
   - Choose something secure you'll remember
   - Example: `MySecurePass123!`

2. **Confirm your password** in the "Confirm Password" field
   - Must match exactly
   - This prevents typos

3. **Click "Join the Team"** button

### **Step 4: Account Creation**

The system will:
- ✅ Create your Firebase account
- ✅ Set up your staff profile
- ✅ Assign your roles
- ✅ Mark the invitation as used

**You'll see:**
```
🎉 Welcome to the Team!
Your account has been created successfully.
Redirecting to dashboard...
```

### **Step 5: First Login**

After 2 seconds, you'll be redirected to the login page.

1. **Enter your email address** (the one from the invitation)
2. **Enter the password** you just created
3. **Click "Sign In"**

### **Step 6: Access Your Dashboard**

Once logged in, you'll see:
- 📊 **Dashboard Overview** - Priority tasks and metrics
- 📝 **Editorial Queue** - Articles to review (if you're an editor)
- ✍️ **Writer Dashboard** - Your submissions (if you're a writer)
- 👥 **Staff Management** - Team management (if you're an admin)

---

## 🎯 What Happens Behind the Scenes

When you accept the invitation:

1. **Account Created**: Your Firebase Authentication account is created
2. **Staff Profile**: A document is created at `/staff/{your-user-id}` with:
   - Your email and name
   - Your assigned roles
   - Account status: Active
   - Creation timestamp
3. **Invitation Marked**: The invitation token is marked as "used"
4. **Access Granted**: You can now log in and access the dashboard

---

## ⚠️ Troubleshooting

### **Problem: "Invalid Invitation" Error**

**Possible causes:**
- ❌ Invitation has expired (7 days from creation)
- ❌ Invitation was revoked by admin
- ❌ Invitation was already used
- ❌ Link was copied incorrectly

**Solution:**
- Contact the administrator for a new invitation
- Check that you copied the entire link

### **Problem: "Password too weak" Error**

**Solution:**
- Use at least 6 characters
- Include letters and numbers for better security
- Example: `MorningPulse2026!`

### **Problem: "Email already in use" Error**

**Solution:**
- This email already has an account
- Try logging in instead: https://kudzimusar.github.io/#admin
- Contact admin if you forgot your password

### **Problem: Link Doesn't Open**

**Solution:**
- Copy the entire link (including `#join?token=...`)
- Make sure there are no spaces or line breaks
- Try opening in a different browser
- Check your internet connection

### **Problem: Can't Log In After Creating Account**

**Solution:**
- Wait a few seconds (account creation takes 1-2 seconds)
- Make sure you're using the exact email from the invitation
- Try refreshing the page
- Clear browser cache and try again

---

## 🔒 Security Notes

- ✅ **Invitations expire after 7 days** - Use them promptly
- ✅ **Each invitation can only be used once** - Don't share your link
- ✅ **Your password is encrypted** - We can't see it
- ✅ **Your account is active immediately** - No email verification needed

---

## 📞 Need Help?

If you encounter any issues:

1. **Check this guide** first
2. **Contact the administrator** who invited you
3. **Check browser console** for error messages (F12 → Console)
4. **Try a different browser** (Chrome, Firefox, Safari)

---

## 🎉 After You Join

Once you're in, you can:

- **Editors**: Review and publish articles
- **Writers**: Submit articles for review
- **Admins**: Manage staff, settings, and content

**Welcome to the team!** 🌅

---

## Quick Reference

**Login URL:** https://kudzimusar.github.io/#admin

**Join URL Format:** https://kudzimusar.github.io/#join?token=YOUR-TOKEN-HERE

**Password Requirements:** Minimum 6 characters

**Invitation Validity:** 7 days from creation

---

**Last Updated:** January 2026
