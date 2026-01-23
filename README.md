<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Morning Pulse - AI-Powered News Platform

**Morning Pulse** is a dual-product news platform combining an interactive AI news bot and a professional digital newspaper, both powered by Google's Gemini AI. The platform serves Zimbabwean readers with real-time news aggregation, interactive Q&A, and a comprehensive editorial workflow system.

---

## 🎯 Product Overview

Morning Pulse consists of two integrated products:

### 1. **Morning Pulse News Bot** 🤖
A WhatsApp-style interactive news assistant that delivers daily headlines, answers questions using AI, and engages users through real-time polls.

### 2. **Morning Pulse Newspaper** 📰
A professional digital newspaper website with a complete editorial workflow, stakeholder management, and modern newsroom capabilities.

---

## ✨ Current Features & Capabilities

### 🤖 News Bot Features (Fully Implemented)

#### Core Functionality
- ✅ **WhatsApp-Style Interface**: Familiar chat interface with message bubbles, timestamps, and read receipts
- ✅ **Daily News Feed**: Automatically displays today's top headlines across 7 categories:
  - Local (Zimbabwe)
  - Business (Zimbabwe)
  - African Focus
  - Global
  - Sports
  - Tech
  - General News
- ✅ **Expandable News Stories**: Tap headlines to view detailed summaries with sources
- ✅ **AI-Powered Q&A**: Ask questions about current events; answers use Google Search grounding for accuracy
- ✅ **Real-Time Polling**: Interactive daily polls with live vote tracking
- ✅ **Premium Subscription System**: 
  - Keyword alert management
  - Premium member status display
  - Subscription upgrade flow
- ✅ **User Preferences**: 
  - Premium status tracking
  - Customizable keyword alerts (premium feature)
- ✅ **Firebase Integration**: Real-time data synchronization with Firestore

#### Technical Implementation
- **Frontend**: React + TypeScript + Vite
- **AI Engine**: Google Gemini 1.5 Flash with Google Search grounding
- **Backend**: Firebase (Firestore, Authentication, Cloud Functions)
- **News Aggregation**: Automated daily news fetching via Cloud Functions
- **Authentication**: Anonymous guest mode + authenticated user support

---

### 📰 Newspaper Website Features (Fully Implemented)

#### Public-Facing Features
- ✅ **Modern Newspaper Design**: 
  - Serif typography for headlines (Georgia, Times New Roman)
  - Multi-column responsive layout
  - Category-based color coding
  - Print-friendly styles
- ✅ **Dual Mode Operation**:
  - **Mode A**: Real-time Firestore reading (dynamic)
  - **Mode B**: Pre-rendered static JSON files (faster, offline support)
- ✅ **News Categories**: 7 categories matching bot categories
- ✅ **Opinion Articles**: 
  - Public opinion feed
  - Guest opinion submission form
  - SEO-friendly slug URLs (`/opinion/{slug}`)
  - Author bylines and publication dates
- ✅ **Public Pages**:
  - Homepage with news grid
  - Opinion feed
  - Opinion submission
  - About page
  - Privacy policy
  - Editorial standards
  - Subscription page
  - Advertise page

#### Editorial Workflow System (Production-Ready)
- ✅ **5-Stage Editorial Pipeline**:
  1. **Draft**: Writer composes article
  2. **Pending Review**: Awaiting editor claim
  3. **In Review**: Editor actively editing
  4. **Published**: Live on website
  5. **Archived**: Removed from active site
- ✅ **Claim/Lock System**: Prevents multiple editors from editing the same story
- ✅ **Split-Pane Editor**: 
  - Left: Original journalist text (read-only reference)
  - Right: Editor's version (editable)
  - Visual difference tracking
- ✅ **Editor Feedback Loop**: Editors can return stories to writers with notes
- ✅ **Scheduled Publishing**: Auto-publish at specified times (30-second interval check)
- ✅ **Version History**: Full edit history with rollback capability
- ✅ **SEO Slug Management**: Auto-generated and validated unique URLs

#### Stakeholder Management (Complete Ecosystem)
- ✅ **Writers**:
  - Registration and approval workflow
  - Writer dashboard with draft management
  - Submission tracking (draft → pending → published)
  - Editor feedback viewing
  - Push notifications for workflow updates
- ✅ **Subscribers**:
  - Registration and login
  - Subscription management (renew, cancel)
  - Premium features tracking
  - WhatsApp number collection
  - Subscription dashboard
- ✅ **Advertisers**:
  - Company registration
  - Admin approval workflow
  - Ad submission with creative upload
  - Ad approval workflow
  - Ad management dashboard
  - Analytics (views, clicks)
- ✅ **Editors/Admins**:
  - Professional admin dashboard
  - Editorial queue management
  - Staff management system
  - Analytics dashboard
  - Image compliance tools
  - Settings configuration

#### Admin Dashboard Features
- ✅ **Priority Summary**: Quick overview of pending items
- ✅ **Editorial Queue**: Real-time article review and publishing
- ✅ **Published Content Management**: Search, filter, unpublish articles
- ✅ **Staff Management**: 
  - Invitation system with secure tokens
  - Role management (admin, editor, writer)
  - Suspend/activate accounts
  - Activity tracking (online/away/offline)
  - Audit logging for all actions
- ✅ **Analytics Dashboard**:
  - Top performing opinions by view count
  - Top contributors by published count & views
  - Workflow efficiency metrics (avg time to publish)
  - Status pipeline breakdown
  - Author performance rankings
- ✅ **Image Compliance**: Validation and replacement tools
- ✅ **Newsletter Generator**: Auto-generates responsive HTML email templates
- ✅ **Push Notifications**: Real-time browser notifications for writers

#### Technical Implementation
- **Frontend**: React + TypeScript + Vite
- **Backend**: Firebase (Firestore, Authentication, Storage, Cloud Functions)
- **Deployment**: GitHub Pages with automated CI/CD
- **Security**: Firestore security rules, role-based access control
- **Real-Time**: Firestore subscriptions with retry logic

---

## 🚧 What's Not Yet Built / In Progress

### Bot Enhancements (Future)
- ⏳ **WhatsApp Integration**: Direct WhatsApp Business API connection (currently web-based)
- ⏳ **Voice Messages**: Audio input/output support
- ⏳ **Multi-Language Support**: Shona, Ndebele translations
- ⏳ **Personalized News Feed**: ML-based content recommendations
- ⏳ **Newsletter Integration**: Email digest from bot conversations
- ⏳ **Social Sharing**: Share news stories directly from bot

### Website Enhancements (Future)
- ⏳ **Advanced Search**: Full-text search across all published content
- ⏳ **Comments System**: Public commenting on articles (backend ready, UI pending)
- ⏳ **Social Media Preview**: Auto-generate OG tags from slug URLs
- ⏳ **Multimedia Integration**: Video and audio clips alongside articles
- ⏳ **Fact-Check Stage**: Optional verification stage for investigative pieces
- ⏳ **Collaborative Comments**: Inline comments like Google Docs
- ⏳ **Mobile App**: React Native version of editorial dashboard
- ⏳ **Email Newsletter Integration**: Connect newsletter generator to Mailchimp/SendGrid

### Payment Integration (Pending)
- ⏳ **Stripe Integration**: Real payment processing for subscriptions (currently placeholder)
- ⏳ **Recurring Billing**: Automated subscription renewals
- ⏳ **Payment Webhooks**: Automated payment confirmation
- ⏳ **Multi-Currency Support**: ZWL, USD, and other currencies

### Analytics & Monetization (Future)
- ⏳ **Advanced Analytics**: 
  - User behavior tracking
  - Content performance metrics
  - Revenue tracking
  - Subscriber analytics
- ⏳ **Ad Serving System**: Automated ad placement and rotation
- ⏳ **Writer Payment Tracking**: Compensation management system

---

## 🏗️ Technical Architecture

### Technology Stack

**Frontend (Bot)**
- React 19.2.0
- TypeScript
- Vite 6.2.0
- Tailwind CSS
- React Markdown

**Frontend (Website)**
- React 19.2.0
- TypeScript
- Vite 6.2.0
- Custom CSS (newspaper styling)

**Backend**
- Firebase Firestore (NoSQL database)
- Firebase Authentication
- Firebase Storage (images)
- Firebase Cloud Functions (news aggregation, scheduled publishing)
- Google Gemini AI 1.5 Flash

**Deployment**
- GitHub Pages (website)
- Firebase Hosting (bot)
- GitHub Actions (CI/CD)

### Data Architecture

**Firestore Collections:**
```
/artifacts/morning-pulse-app/public/data/
  ├── news/{date}              # Daily aggregated news
  ├── opinions/{opinionId}      # Editorial articles
  │   └── versions/{versionId}  # Version history
  ├── polls/current_pulse_poll  # Daily poll
  ├── subscribers/{uid}         # Subscriber data
  ├── advertisers/{uid}         # Advertiser data
  └── ads/{adId}                # Advertisement creatives

/staff/{uid}                     # Staff members
/writers/{uid}                   # Writer profiles
/artifacts/{appId}/public/data/
  ├── invites/{token}           # Staff invitations
  └── audit_logs/{logId}        # Audit trail
```

### Security

- ✅ Firestore security rules enforce role-based access
- ✅ Admin-only writes for staff management
- ✅ Editor/Admin-only writes for publishing
- ✅ Public read access for published content
- ✅ Suspended user login blocking
- ✅ Comprehensive audit logging

---

## 📊 Production Readiness

### ✅ Completed (100%)
- Core bot functionality
- News aggregation system
- Editorial workflow (5-stage pipeline)
- Stakeholder management (writers, subscribers, advertisers)
- Admin dashboard with all tabs
- Staff management system
- Analytics dashboard
- Version history system
- SEO slug management
- Push notifications
- Newsletter generator
- Image compliance tools

### 🔄 In Progress
- Public slug routing (backend ready, frontend integration pending)
- Payment integration (Stripe/PayPal)

### ⏳ Planned
- WhatsApp Business API integration
- Advanced search functionality
- Comments system UI
- Mobile app development

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm
- Firebase account
- Google Gemini API key

### Bot Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Set `GEMINI_API_KEY` in `.env.local`
3. Run the app:
   ```bash
   npm run dev
   ```

### Website Setup
1. Navigate to website directory:
   ```bash
   cd website
   npm install
   ```
2. Set up Firebase config in `.env.local`:
   ```
   VITE_FIREBASE_CONFIG='{"apiKey":"...","projectId":"..."}'
   ```
3. Run development server:
   ```bash
   npm run dev
   ```

### Deployment
- **Website**: Automatically deployed to GitHub Pages via GitHub Actions
- **Bot**: Deploy to Firebase Hosting or AI Studio
- **Cloud Functions**: Deploy news aggregator function for daily updates

---

## 📈 Business Model

### Revenue Streams (Implemented)
1. **Subscriptions**: 
   - Micro-Pulse tier
   - Premium tier
   - Enterprise tier
   - (Payment processing pending integration)

2. **Advertising**:
   - Advertiser registration and approval
   - Ad submission and management
   - View/click tracking
   - (Ad serving automation pending)

### Target Markets
- **Primary**: Zimbabwe (Local news focus)
- **Secondary**: African diaspora
- **Tertiary**: Global readers interested in African news

---

## 🎯 Competitive Advantages

1. **AI-Powered Aggregation**: Daily automated news collection using Gemini AI
2. **Dual Product Strategy**: Both interactive bot and traditional newspaper
3. **Professional Editorial Workflow**: Enterprise-grade newsroom system
4. **Complete Stakeholder Ecosystem**: Writers, subscribers, advertisers all managed
5. **Real-Time Updates**: Live synchronization across all platforms
6. **SEO Optimized**: Slug-based URLs, metadata, E-E-A-T compliance

---

## 📞 Contact & Resources

- **AI Studio App**: https://ai.studio/apps/drive/18aI5Jk-XmfWQEUWop39tXAzgfqOVb-GF
- **Website**: https://kudzimusar.github.io/morning-pulse/
- **Documentation**: See `PLAN.md` for detailed development roadmap

---

## 📝 Documentation

- `PLAN.md` - Single source of truth for all development decisions
- `COMPLETE_ECOSYSTEM_IMPLEMENTATION.md` - Stakeholder system details
- `ADMIN_DASHBOARD_GUIDE.md` - Admin user guide
- `DEPLOYMENT_INSTRUCTIONS.md` - Deployment procedures

---

## 🏆 Status Summary

**Morning Pulse is production-ready** with a complete editorial workflow, stakeholder management, and dual-product offering. The platform rivals professional newsroom systems while maintaining the accessibility of a modern digital news platform.

**Core Features**: ✅ 100% Complete  
**Editorial System**: ✅ Production-Ready  
**Stakeholder Management**: ✅ Fully Implemented  
**Payment Integration**: ⏳ Pending (Stripe/PayPal)  
**WhatsApp Integration**: ⏳ Future Enhancement  

---

<div align="center">
<strong>Built with ❤️ for Zimbabwean readers</strong>
</div>
