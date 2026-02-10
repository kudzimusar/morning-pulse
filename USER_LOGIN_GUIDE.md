# 🔐 Morning Pulse - User Login Guide

## Overview

Morning Pulse has **different login pages for different user types** because each type has different permissions, dashboards, and data structures. This guide explains which URL to use for each user type.

---

## 🎯 Login URLs by User Type

### 1. **Admin / Staff Login** 👑
**URL**: https://kudzimusar.github.io/morning-pulse/#admin

**Who uses this:**
- Super Admins
- Bureau Chiefs
- Admins
- Editors
- Staff Writers (with staff roles)

**What you can do:**
- Manage staff members
- Approve/reject content
- Manage writers and advertisers
- View analytics
- Full editorial control

**Example credentials:**
```
Email: admin@morningpulse.com
Password: [your admin password]
```

---

### 2. **Advertiser Login** 📢
**URL**: https://kudzimusar.github.io/morning-pulse/#advertiser/login

**Who uses this:**
- Advertisers
- Marketing teams
- Ad campaign managers

**What you can do:**
- Submit ad campaigns
- Upload ad creatives
- Track ad performance
- Manage billing

**Example credentials:**
```
Email: advertiser@company.com
Password: [your advertiser password]
```

**⚠️ IMPORTANT**: Advertisers CANNOT use the `#admin` URL. They must use `#advertiser/login`.

---

### 3. **Writer Login** ✍️
**URL**: https://kudzimusar.github.io/morning-pulse/#writer/login

**Who uses this:**
- Freelance writers
- Contributing journalists
- Pitch writers (non-staff)

**What you can do:**
- Submit story pitches
- Write and submit articles
- View payment statements
- Track article status

**Example credentials:**
```
Email: writer@email.com
Password: [your writer password]
```

**Note**: Staff writers with editorial roles should use `#admin` instead.

---

### 4. **Subscriber Login** 💎
**URL**: https://kudzimusar.github.io/morning-pulse/#subscriber/login

**Who uses this:**
- Premium subscribers
- Paying readers

**What you can do:**
- Access premium content
- Read exclusive articles
- Manage subscription
- Update payment info

**Example credentials:**
```
Email: subscriber@email.com
Password: [your subscriber password]
```

---

## 🔍 How to Know Which Login to Use

### Quick Decision Tree:

```
Are you managing the platform or approving content?
├─ YES → Use #admin (Admin/Staff Login)
└─ NO ↓

Are you running ad campaigns?
├─ YES → Use #advertiser/login (Advertiser Login)
└─ NO ↓

Are you submitting articles for payment?
├─ YES → Use #writer/login (Writer Login)
└─ NO ↓

Are you a paying subscriber?
├─ YES → Use #subscriber/login (Subscriber Login)
└─ NO → You're a public reader (no login needed)
```

---

## ❌ Common Mistakes

### Mistake 1: Advertiser using `#admin`
```
❌ WRONG: https://kudzimusar.github.io/morning-pulse/#admin
   Error: "Access Denied: This account does not have staff privileges"

✅ CORRECT: https://kudzimusar.github.io/morning-pulse/#advertiser/login
```

### Mistake 2: Writer using `#admin`
```
❌ WRONG: https://kudzimusar.github.io/morning-pulse/#admin
   Error: "Access Denied: This account does not have staff privileges"

✅ CORRECT: https://kudzimusar.github.io/morning-pulse/#writer/login
```

### Mistake 3: Using wrong email
```
❌ WRONG: Trying to login as advertiser with staff email
   Error: "Advertiser account not found"

✅ CORRECT: Use the email you registered with for that specific role
```

---

## 🆕 Registration URLs

If you don't have an account yet:

| User Type | Registration URL |
|-----------|-----------------|
| **Admin/Staff** | Invite-only (contact existing admin) |
| **Advertiser** | `#advertiser/register` |
| **Writer** | `#writer/register` |
| **Subscriber** | `#subscriber/register` |

---

## 🔐 Account Types Explained

### Why Different Login Pages?

Each user type has:
- **Different data structures** (advertisers have campaigns, writers have pitches, etc.)
- **Different permissions** (advertisers can't approve content, writers can't manage ads)
- **Different dashboards** (each role sees different features)
- **Different workflows** (advertiser approval vs writer payment tracking)

### Can One Person Have Multiple Accounts?

**Yes!** You can have different accounts for different roles:
- Admin account: `admin@company.com` → Use `#admin`
- Advertiser account: `marketing@company.com` → Use `#advertiser/login`

Just use the appropriate login page for each role.

---

## 🐛 Troubleshooting

### "Access Denied: This account does not have staff privileges"

**Problem**: You're trying to use `#admin` but you're not a staff member.

**Solution**: 
1. Check your account type (advertiser, writer, or subscriber)
2. Use the correct login URL from the table above
3. If you should be staff, contact an admin to add staff roles

### "Advertiser account not found"

**Problem**: You're on `#advertiser/login` but using wrong email or haven't registered.

**Solution**:
1. Verify you're using the email you registered with
2. If not registered, go to `#advertiser/register`
3. If registered but pending approval, wait for admin approval

### "Your account is pending approval"

**Problem**: Your advertiser/writer account hasn't been approved yet.

**Solution**:
1. Wait for admin to approve your account
2. You'll receive an email when approved
3. Then you can login normally

---

## 📞 Support

### For Login Issues:
1. **Verify you're using the correct URL** for your user type
2. **Check your email** - use the one you registered with
3. **Hard refresh** the page (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
4. **Clear browser cache** if issues persist

### Contact Admin:
If you're still having issues:
- Email: admin@morningpulse.com
- Include: Your email, user type, and error message

---

## 📋 Quick Reference Card

Print or bookmark this:

```
┌─────────────────────────────────────────────────┐
│         MORNING PULSE LOGIN URLS                │
├─────────────────────────────────────────────────┤
│ Admin/Staff:    #admin                          │
│ Advertiser:     #advertiser/login               │
│ Writer:         #writer/login                   │
│ Subscriber:     #subscriber/login               │
└─────────────────────────────────────────────────┘
```

**Remember**: Use the URL that matches your account type!
