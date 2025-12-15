# Apple App Store Submission Checklist - ScratchIQ

## Pre-Submission Status

### ✅ READY
- [x] **App Configuration** - app.json properly configured
- [x] **Bundle Identifier** - `com.scratchiq.app` set for iOS
- [x] **Version Numbers** - Version 1.0.0, Build 1
- [x] **Permissions** - Camera, Photo Library, Notifications with descriptions
- [x] **Legal Screens** - Privacy Policy, Terms of Service, Disclaimer implemented
- [x] **Age Disclaimer** - 18+ disclaimer shown during onboarding
- [x] **Encryption Declaration** - Set to false (no exempt encryption)
- [x] **Social Media Schemes** - TikTok and Instagram URL schemes configured
- [x] **App Store Metadata** - APP_STORE_METADATA.md created and updated

### ⚠️ NEEDS ATTENTION

#### 1. App Icons
**Status:** Mostly complete, needs final setup
- [x] 1024x1024 - App Store (scratchiq_1024.png)
- [x] 180x180 - iPhone Super Retina (scratchiq_180.png)
- [x] 167x167 - iPad Pro (scratchiq_167.png)
- [x] 152x152 - iPad (scratchiq_152.png)
- [x] 120x120 - iPhone Spotlight (scratchiq_120.png)
- [ ] 87x87 - iPhone Settings (scratchiq_87.png) - **MISSING**

**Action Required:**
1. Download or create the 87x87 icon
2. Rename icons to remove timestamps:
   ```bash
   mv scratchiq_1024-*.png scratchiq_1024.png
   mv scratchiq_180-*.png scratchiq_180.png
   mv scratchiq_167-*.png scratchiq_167.png
   mv scratchiq_152-*.png scratchiq_152.png
   mv scratchiq_120-*.png scratchiq_120.png
   ```
3. Update app.json to reference the correct icon

#### 2. Notification Icon
**Status:** Referenced but missing
- [ ] notification-icon.png NOT FOUND

**Options:**
- **Option A:** Create a simple 48x48px PNG notification icon
- **Option B:** Remove notification icon config from app.json (will use app icon by default)

**Recommended:** Option B - Remove these lines from app.json:
```json
{
  "icon": "./assets/notification-icon.png",
  "color": "#6366f1"
}
```

#### 3. App Store Screenshots
**Status:** NOT CREATED
- [ ] Minimum 2 screenshots required
- [ ] Required size: 1290 x 2796 pixels (iPhone 6.7" - iPhone 15 Pro Max)

**Recommended Screenshots:**
1. Home screen showing Hot Tickets
2. Camera scanning feature
3. Browse tickets with filters
4. Game detail with prize breakdown
5. Scan results with recommendations
6. Profile with referral system

**How to Create:**
- Take screenshots on iPhone 15 Pro Max simulator or device
- Use design tools to add text overlays highlighting features
- Export at exact size: 1290 x 2796 pixels

#### 4. URLs (Need Verification)
- [ ] https://www.scratchiq.com - **Verify live**
- [ ] https://www.scratchiq.com/support - **Verify live**
- [ ] https://www.scratchiq.com/privacy - **Verify live**

**If URLs not live:**
- Update APP_STORE_METADATA.md with working URLs
- Or create simple landing pages at these URLs

---

## App Store Connect Setup

### Step 1: Create App Listing
1. Log in to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+" → "New App"
3. Select iOS platform
4. App Name: **ScratchIQ - Smart Lottery Odds**
5. Primary Language: English (U.S.)
6. Bundle ID: Select `com.scratchiq.app`
7. SKU: `scratchiq-ios-001` (or your preferred identifier)

### Step 2: App Information
- **Name:** ScratchIQ - Smart Lottery Odds
- **Subtitle:** Find the Best Scratch-Offs (30 chars max)
- **Category:**
  - Primary: Finance
  - Secondary: Entertainment
- **Privacy Policy URL:** https://www.scratchiq.com/privacy
- **Support URL:** https://www.scratchiq.com/support

### Step 3: Pricing and Availability
- **Price:** Free
- **Availability:** All territories (or specific states if needed)

### Step 4: Age Rating
- **Age Rating:** 17+
- **Gambling & Contests:** Simulated Gambling - Frequent/Intense
- **Reason:** App provides lottery ticket analysis and odds information

### Step 5: App Description
Copy from `APP_STORE_METADATA.md` sections:
- Description (4000 chars max)
- Keywords: `lottery,scratch off,lotto,odds,tickets,gambling,prizes,ev,win,scratch,games,powerball`
- Promotional Text (170 chars, updateable without review)

### Step 6: Screenshots
Upload 2-10 screenshots (1290 x 2796 pixels for 6.7" display)

### Step 7: App Review Information
**Contact Information:**
- First Name: [Your Name]
- Last Name: [Your Name]
- Phone: [Your Phone]
- Email: [Your Email]

**Demo Account:** Not required

**Notes for Reviewer:** (Copy from APP_STORE_METADATA.md)
```
ScratchIQ is an informational app that analyzes publicly available lottery data.

IMPORTANT TESTING NOTES:
1. On first launch, select any US state (e.g., "North Carolina")
2. Grant camera permission when prompted
3. For testing scanning: Point camera at ANY text or display, then tap capture
4. The AI will attempt to identify lottery ticket names from the image
5. You can also test with the "Browse" tab to see all tickets without scanning

FREE SCAN SYSTEM:
- App includes 25 free scans to start
- Use promo code "winning!" in Profile > Redeem Code for 50 additional scans
- This allows full testing of all features

NO PURCHASES OR GAMBLING:
- App does NOT sell lottery tickets
- App does NOT facilitate gambling transactions
- App provides odds analysis and information only
- Users must be 18+ (enforced via disclaimer)

DATA SOURCE:
- All lottery data from official state lottery websites
- Real Time Odds calculations use public prize data
- No user-generated content or social features

PERMISSIONS USED:
- Camera: To scan lottery ticket displays
- Photo Library: To analyze existing photos
- Notifications: Optional alerts for favorite tickets (can be disabled)
```

---

## Build and Upload

### Option 1: EAS Build (Recommended for Expo)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### Option 2: Xcode
```bash
# Generate native iOS project
npx expo prebuild --platform ios

# Open in Xcode
open ios/ScratchIQ.xcworkspace

# Build and archive
# Product → Archive → Distribute App → Upload to App Store
```

---

## Pre-Launch Testing Checklist

Test on physical iOS device:

- [ ] App launches successfully
- [ ] Onboarding shows all 6 screens (4 features + state selection + disclaimer)
- [ ] Age 18+ disclaimer is clear and prominent
- [ ] State selection works (test 2-3 states)
- [ ] Camera permission requested with proper description
- [ ] Photo library permission works
- [ ] Notification permission optional and can be declined
- [ ] Camera scanning identifies text (test with any text/image)
- [ ] Browse tickets loads for selected state
- [ ] All 5 sort options work (Value Score, RTO, Hot Tickets, Break-Even, Win-Back)
- [ ] Filter by price works ($1, $2, $5, $10, $20, $30, $50)
- [ ] Search function works
- [ ] Favorite/unfavorite tickets works
- [ ] Game detail screen shows all information
- [ ] Hot ticket badges (🔥) appear correctly on top 5% RTO nationally
- [ ] Links to lottery websites work
- [ ] Referral sharing works (test one share method)
- [ ] Promo code "winning!" redeems 50 scans
- [ ] Scan counter increments/decrements correctly
- [ ] Pull to refresh works on all screens
- [ ] Privacy Policy screen loads and is readable
- [ ] Terms of Service screen loads and is readable
- [ ] Disclaimer screen loads and is readable
- [ ] App works offline with cached data
- [ ] No crashes or freezes during normal use
- [ ] TikTok and Instagram deep links work (if possible to test)

---

## Common Rejection Reasons & How to Avoid

### 1. Gambling Content
**Why it might be rejected:** App facilitates gambling
**How we comply:**
- No ticket sales or purchases
- No gambling transactions
- Information only
- Clear disclaimers throughout
- Age rating 17+
- 1-800-GAMBLER helpline included

### 2. Missing Legal Documents
**How we comply:**
- Privacy Policy: ✅ Implemented in app
- Terms of Service: ✅ Implemented in app
- Disclaimer: ✅ Shown during onboarding

### 3. Permissions Without Clear Purpose
**How we comply:**
- Camera: Clear description about scanning ticket displays
- Photo Library: Clear description about analyzing existing photos
- Notifications: Clearly optional, can be disabled

### 4. Misleading Screenshots or Descriptions
**How we comply:**
- Use actual app screenshots
- No fake data or mockups
- Accurate description of features
- No guarantees of winning

### 5. Incomplete Metadata
**How we comply:**
- All required fields in APP_STORE_METADATA.md
- Keywords relevant to app function
- Age rating matches content
- Support URL provided

---

## Post-Submission

### Expected Timeline
- **Initial Review:** 24-48 hours for status change
- **Full Review:** 1-3 days typically
- **Status Updates:** Check App Store Connect daily

### If Approved
- [ ] App goes live automatically (or on scheduled date)
- [ ] Test download from App Store
- [ ] Monitor crash reports in App Store Connect
- [ ] Respond to user reviews

### If Rejected
- [ ] Read rejection reason carefully
- [ ] Address all issues mentioned
- [ ] Update app if needed
- [ ] Resubmit with explanation in "Resolution Center"

---

## Quick Reference

**Bundle ID:** `com.scratchiq.app`
**Version:** 1.0.0
**Build:** 1
**Age Rating:** 17+ (Simulated Gambling)
**Category:** Finance, Entertainment
**Price:** Free
**Promo Code:** "winning!" (50 scans)
**Test States:** North Carolina, California, Texas

---

## Helpful Links

- [App Store Connect](https://appstoreconnect.apple.com)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Expo Documentation](https://docs.expo.dev)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)

---

*Last Updated: November 17, 2025*
