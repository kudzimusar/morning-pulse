# Mobile Header Redesign - Testing Guide

## Overview
This guide provides comprehensive testing instructions for the newly redesigned mobile header with two-row structure, navigation tabs, and breaking news ticker.

---

## Pre-Testing Checklist

### Environment Setup
- [ ] Clear browser cache and localStorage
- [ ] Test on actual mobile devices (iOS and Android)
- [ ] Test on tablet devices (iPad, Android tablets)
- [ ] Test in browser DevTools mobile emulation
- [ ] Test in PWA/WebView mode (if applicable)

### Test Devices
- [ ] iPhone SE (320px width) - Smallest smartphone
- [ ] iPhone 12/13/14 (390px width) - Standard smartphone
- [ ] iPhone 14 Pro Max (428px width) - Large smartphone
- [ ] iPad Mini (768px width) - Small tablet
- [ ] iPad Pro (1024px width) - Large tablet
- [ ] Android phones (various sizes)
- [ ] Android tablets (various sizes)

---

## 1. Visual Testing

### 1.1 Row 1: Top Bar (Dark Blue #000033)

**Test Cases:**
- [ ] Background color is `#000033` (dark blue)
- [ ] Text and icons are white
- [ ] Height is exactly 56px (excluding safe area)
- [ ] Safe area inset applied correctly (iPhone notch)
- [ ] Logo "Morning Pulse" is centered horizontally
- [ ] Logo uses Playfair Display font
- [ ] Logo font size is 1.25rem on mobile, 1.375rem on tablet

**Left Side Elements:**
- [ ] Menu icon (hamburger) is visible and clickable
- [ ] Menu icon is 22px size
- [ ] Notifications icon (bell) is visible and clickable
- [ ] Notifications icon is 22px size
- [ ] Notification badge appears when count > 0
- [ ] Notification badge is red (#dc2626) with white text
- [ ] Icons have 44px minimum touch target

**Right Side Elements:**
- [ ] "Sign In" button visible when not authenticated
- [ ] "Sign In" button has white text, transparent background, white border
- [ ] User icon visible when authenticated
- [ ] User icon is 22px size
- [ ] All buttons have proper touch targets (44px minimum)

**Tablet (481px - 768px):**
- [ ] Padding increases to 20px on sides
- [ ] Logo font size increases to 1.375rem
- [ ] All elements remain properly aligned

---

### 1.2 Row 2: Navigation Tabs (White Background)

**Test Cases:**
- [ ] Background is white (#ffffff)
- [ ] Height is exactly 48px
- [ ] Border bottom is 1px solid #e0e0e0
- [ ] Three tabs visible: "Latest", "For You", "Ask The Pulse AI"
- [ ] Tabs are horizontally scrollable if needed
- [ ] Scrollbar is hidden (but scrolling works)

**Tab States:**
- [ ] Inactive tabs: gray text (#666666), font-weight 500
- [ ] Active tab: dark blue text (#000033), font-weight 600
- [ ] Active tab has 2px blue underline (#000033)
- [ ] Tab transitions are smooth (0.2s)
- [ ] Active tab indicator updates correctly on click

**Tab Content:**
- [ ] "Latest" tab navigates to #news
- [ ] "For You" tab navigates to #foryou
- [ ] "Ask The Pulse AI" tab navigates to #askai
- [ ] Tab text doesn't wrap (white-space: nowrap)
- [ ] Tabs have 20px horizontal padding on mobile, 24px on tablet

**Tablet (481px - 768px):**
- [ ] Tab font size increases to 1rem
- [ ] Tab padding increases to 24px
- [ ] More tabs can be added if needed (horizontal scroll)

---

### 1.3 Breaking News Ticker (Red #dc2626)

**Test Cases:**
- [ ] Ticker only appears when `topHeadlines.length > 0`
- [ ] Background color is red (#dc2626)
- [ ] Height is exactly 40px
- [ ] "BREAKING:" label is white, bold, uppercase
- [ ] "BREAKING:" label has 12px horizontal padding
- [ ] Headlines scroll continuously from right to left
- [ ] Animation is smooth (60s linear infinite)
- [ ] Headlines are duplicated for seamless loop
- [ ] Headline text is white, 0.8125rem size
- [ ] Headlines separated by gray dots (•)
- [ ] Ticker doesn't interfere with header sticky positioning

**Animation:**
- [ ] Scrolling animation starts immediately
- [ ] Animation loops seamlessly (no jump)
- [ ] Animation pauses on hover (if implemented)
- [ ] Animation works on all browsers (Chrome, Safari, Firefox)

---

## 2. Functional Testing

### 2.1 Menu Button

**Test Cases:**
- [ ] Clicking menu button opens MobileMenuDrawer
- [ ] Menu drawer slides in from right
- [ ] Backdrop appears (dark overlay)
- [ ] Clicking backdrop closes drawer
- [ ] Menu button has proper touch feedback

---

### 2.2 Notifications Button

**Test Cases:**
- [ ] Clicking notifications button opens MobileNotifications panel
- [ ] Notification panel slides in from right
- [ ] Backdrop appears (dark overlay)
- [ ] Clicking backdrop closes panel
- [ ] Notification badge shows correct count
- [ ] Badge appears when count > 0
- [ ] Badge disappears when count = 0
- [ ] Unread notifications are highlighted
- [ ] Clicking notification navigates to correct link

---

### 2.3 Logo Click

**Test Cases:**
- [ ] Clicking logo navigates to #news
- [ ] Current page updates to 'news'
- [ ] Active tab updates to 'latest'
- [ ] Page scrolls to top

---

### 2.4 Sign In Button

**Test Cases:**
- [ ] Button visible when user is not authenticated
- [ ] Clicking button navigates to #join (sign up page)
- [ ] Button has proper touch feedback
- [ ] Button text is readable (white on dark blue)

**When Authenticated:**
- [ ] Sign In button replaced with User icon
- [ ] Clicking User icon navigates to #profile
- [ ] User icon is visible and clickable

---

### 2.5 Navigation Tabs

**Test Cases:**
- [ ] Clicking "Latest" tab:
  - [ ] Navigates to #news
  - [ ] Updates currentPage to 'news'
  - [ ] Shows NewsGrid component
  - [ ] Tab becomes active (blue underline)
  - [ ] Other tabs become inactive

- [ ] Clicking "For You" tab:
  - [ ] Navigates to #foryou
  - [ ] Updates currentPage to 'foryou'
  - [ ] Shows ForYouFeed component
  - [ ] Tab becomes active
  - [ ] Other tabs become inactive

- [ ] Clicking "Ask The Pulse AI" tab:
  - [ ] Navigates to #askai
  - [ ] Updates currentPage to 'askai'
  - [ ] Shows AskPulseAI component
  - [ ] Tab becomes active
  - [ ] Other tabs become inactive

**Tab State Persistence:**
- [ ] Active tab persists on page refresh (if hash matches)
- [ ] Active tab updates when navigating via hash
- [ ] Active tab updates when navigating via other methods

---

## 3. Responsive Testing

### 3.1 Smartphone (max-width: 480px)

**Test Cases:**
- [ ] Header fits within viewport width
- [ ] No horizontal scrolling
- [ ] All elements are visible
- [ ] Touch targets are at least 44px
- [ ] Text is readable (not too small)
- [ ] Logo doesn't overlap with icons
- [ ] Tabs scroll horizontally if needed

**Specific Devices:**
- [ ] iPhone SE (320px): All elements fit, tabs scroll
- [ ] iPhone 12/13 (390px): Comfortable spacing
- [ ] iPhone 14 Pro Max (428px): Optimal layout

---

### 3.2 Tablet (481px - 768px)

**Test Cases:**
- [ ] Header padding increases (20px)
- [ ] Logo font size increases (1.375rem)
- [ ] Tab font size increases (1rem)
- [ ] Tab padding increases (24px)
- [ ] More space for additional tabs if needed
- [ ] Layout remains clean and organized

**Specific Devices:**
- [ ] iPad Mini (768px): Comfortable spacing
- [ ] Android tablets (various): Consistent layout

---

### 3.3 Desktop (769px+)

**Test Cases:**
- [ ] Mobile header is hidden (display: none)
- [ ] Desktop header is visible
- [ ] No conflicts between mobile and desktop headers
- [ ] Layout switches correctly at breakpoint

---

## 4. Integration Testing

### 4.1 App.tsx Integration

**Test Cases:**
- [ ] MobileHeader receives correct props:
  - [ ] topHeadlines (array of strings)
  - [ ] activeTab ('latest' | 'foryou' | 'askai')
  - [ ] isAuthenticated (boolean)
  - [ ] userRole (array or null)
  - [ ] notificationCount (number)

- [ ] Tab changes update App.tsx state:
  - [ ] setMobileActiveTab called
  - [ ] setCurrentPage called
  - [ ] window.location.hash updated

- [ ] Hash changes update tab state:
  - [ ] #news → activeTab = 'latest'
  - [ ] #foryou → activeTab = 'foryou'
  - [ ] #askai → activeTab = 'askai'

---

### 4.2 Component Integration

**ForYouFeed Component:**
- [ ] Renders when currentPage === 'foryou'
- [ ] Receives newsData and userCountry props
- [ ] Shows personalized articles
- [ ] Shows empty state if no preferences
- [ ] Loading state works correctly

**AskPulseAI Component:**
- [ ] Renders when currentPage === 'askai'
- [ ] Form submission works
- [ ] Loading state shows during API call
- [ ] Error handling works
- [ ] Response displays correctly

**MobileNotifications Component:**
- [ ] Opens when notifications button clicked
- [ ] Closes when backdrop clicked
- [ ] Shows notification list
- [ ] Shows empty state when no notifications
- [ ] Notification clicks navigate correctly

---

## 5. Performance Testing

### 5.1 Animation Performance

**Test Cases:**
- [ ] Ticker animation is smooth (60fps)
- [ ] No jank or stuttering
- [ ] Animation doesn't cause layout shifts
- [ ] Animation pauses when tab is not visible (if implemented)

---

### 5.2 Rendering Performance

**Test Cases:**
- [ ] Header renders quickly (< 100ms)
- [ ] No layout shift on load
- [ ] Smooth transitions between tabs
- [ ] No memory leaks from event listeners

---

## 6. Accessibility Testing

### 6.1 Screen Readers

**Test Cases:**
- [ ] All buttons have aria-label attributes
- [ ] Menu button: "Menu"
- [ ] Notifications button: "Notifications"
- [ ] Logo button: "Morning Pulse Home"
- [ ] Sign In button: "Sign In"
- [ ] Tabs have proper role="tab" attributes
- [ ] Active tab has aria-selected="true"

---

### 6.2 Keyboard Navigation

**Test Cases:**
- [ ] Tab key navigates through all interactive elements
- [ ] Enter/Space activates buttons
- [ ] Focus indicators are visible
- [ ] Focus order is logical (left to right, top to bottom)

---

### 6.3 Color Contrast

**Test Cases:**
- [ ] White text on dark blue (#000033) meets WCAG AA (4.5:1)
- [ ] Gray text on white meets WCAG AA
- [ ] Red ticker text on red background has sufficient contrast
- [ ] All interactive elements have visible focus states

---

## 7. Browser Compatibility

### 7.1 Modern Browsers

**Test Cases:**
- [ ] Chrome (latest)
- [ ] Safari (latest iOS and macOS)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Samsung Internet (Android)

**Specific Features:**
- [ ] CSS Grid works correctly
- [ ] Flexbox works correctly
- [ ] CSS animations work correctly
- [ ] Safe area insets work (iOS)
- [ ] Touch events work correctly

---

## 8. Edge Cases

### 8.1 Empty States

**Test Cases:**
- [ ] Header works when topHeadlines is empty (no ticker)
- [ ] Header works when newsData is empty
- [ ] Tabs work when no content available
- [ ] Notifications panel shows empty state correctly

---

### 8.2 Long Content

**Test Cases:**
- [ ] Long headlines in ticker scroll correctly
- [ ] Long tab names don't break layout
- [ ] Many notifications don't break panel
- [ ] Logo text doesn't overflow

---

### 8.3 Rapid Interactions

**Test Cases:**
- [ ] Rapid tab clicking doesn't cause issues
- [ ] Rapid menu open/close works correctly
- [ ] Multiple notifications don't cause lag
- [ ] Ticker animation doesn't stutter

---

## 9. PWA/WebView Testing

### 9.1 Standalone Mode

**Test Cases:**
- [ ] Header works in standalone PWA mode
- [ ] Safe area insets work correctly
- [ ] No browser chrome conflicts
- [ ] Full screen mode works

---

### 9.2 WebView (Google Play)

**Test Cases:**
- [ ] Header works in WebView
- [ ] Touch events work correctly
- [ ] Back button behavior is correct
- [ ] No zoom issues
- [ ] Text selection disabled on UI chrome (if implemented)

---

## 10. Regression Testing

### 10.1 Existing Features

**Test Cases:**
- [ ] Bottom navigation still works
- [ ] MobileMenuDrawer still works
- [ ] MobileSearch still works
- [ ] NewsGrid still works
- [ ] OpinionPage still works
- [ ] All existing routes still work

---

## 11. Test Results Template

### Device: [Device Name]
### Browser: [Browser Name]
### Viewport: [Width x Height]

#### Row 1: Top Bar
- [ ] Background color correct
- [ ] Logo centered
- [ ] Icons visible and clickable
- [ ] Sign In button works
- [ ] Safe area insets applied

#### Row 2: Navigation Tabs
- [ ] Tabs visible
- [ ] Active tab highlighted
- [ ] Tab navigation works
- [ ] Horizontal scroll works (if needed)

#### Breaking News Ticker
- [ ] Ticker appears when headlines exist
- [ ] Animation smooth
- [ ] Text readable

#### Functionality
- [ ] Menu opens/closes
- [ ] Notifications open/close
- [ ] Logo navigation works
- [ ] Tab switching works
- [ ] All routes accessible

#### Issues Found:
1. [Issue description]
2. [Issue description]

---

## 12. Known Issues & Limitations

### Current Limitations:
1. **Notification Count**: Currently hardcoded to 0. Needs backend integration.
2. **Ask The Pulse AI**: Currently shows placeholder response. Needs AI service integration.
3. **For You Feed**: Uses localStorage preferences. May need backend personalization.
4. **Ticker Animation**: May pause on some browsers when tab is not visible.

### Future Enhancements:
1. Add pull-to-refresh gesture
2. Add swipe gestures for tab navigation
3. Add haptic feedback on button clicks
4. Add notification sound/vibration
5. Add offline support for header

---

## 13. Quick Test Checklist

### Essential Tests (Must Pass):
- [ ] Header renders on mobile devices
- [ ] All three tabs are visible and clickable
- [ ] Active tab highlights correctly
- [ ] Breaking news ticker appears when headlines exist
- [ ] Menu button opens drawer
- [ ] Logo navigates to home
- [ ] Sign In button works
- [ ] Header is sticky (stays at top on scroll)
- [ ] No horizontal scrolling on header
- [ ] Safe area insets work on iPhone

### Nice-to-Have Tests:
- [ ] Smooth animations
- [ ] Notification badge appears
- [ ] Tablet enhancements work
- [ ] All accessibility features work
- [ ] Performance is optimal

---

## 14. Reporting Issues

When reporting issues, include:
1. **Device**: Model and OS version
2. **Browser**: Name and version
3. **Viewport**: Width x Height
4. **Steps to Reproduce**: Detailed steps
5. **Expected Behavior**: What should happen
6. **Actual Behavior**: What actually happens
7. **Screenshots**: If applicable
8. **Console Errors**: Any JavaScript errors

---

## 15. Sign-Off Criteria

Before marking as complete:
- [ ] All essential tests pass
- [ ] No critical bugs found
- [ ] Performance is acceptable
- [ ] Accessibility requirements met
- [ ] Cross-browser compatibility confirmed
- [ ] Mobile device testing completed
- [ ] Tablet testing completed
- [ ] Integration with existing features confirmed

---

**End of Testing Guide**
