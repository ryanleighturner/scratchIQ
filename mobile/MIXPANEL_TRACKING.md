# Mixpanel Analytics Tracking

This document outlines all the Mixpanel events tracked in the ScratchIQ app.

## Setup Instructions

1. Go to your Mixpanel dashboard
2. Click on your project name in the top left
3. Navigate to **Settings** → **Project Settings**
4. Copy your **Project Token**
5. Add it to the Vibecode app using the **ENV tab** with the key:
   ```
   EXPO_PUBLIC_MIXPANEL_TOKEN
   ```

## Events Being Tracked

### App Lifecycle Events

#### `App Opened`
- **When**: Every time the app is launched
- **Properties**:
  - `platform`: iOS or Android
  - `deviceModel`: Device model name
  - `deviceBrand`: Device brand
  - `osVersion`: Operating system version

### Onboarding Events

#### `Onboarding Completed`
- **When**: User completes the onboarding tutorial
- **Properties**:
  - `selectedState`: The state the user selected during onboarding

#### `State Selected`
- **When**: User selects or changes their state
- **Properties**:
  - `selectedState`: The state code (e.g., "NC", "CA")

### Scanning Events

#### `Scan Started`
- **When**: User initiates a scan (camera or gallery)
- **Properties**:
  - `method`: "camera" or "gallery"
  - `state`: Current selected state
  - `scansRemaining`: Number of scans left after this scan

#### `Scan Completed`
- **When**: Scan analysis successfully completes
- **Properties**:
  - `ticketsIdentified`: Number of ticket names identified
  - `matchedGames`: Number of games matched in database
  - `durationMs`: Total scan duration in milliseconds
  - `state`: Current selected state

#### `Scan Failed`
- **When**: Scan fails at any stage
- **Properties**:
  - `method`: "camera" or "gallery" (if applicable)
  - `error`: Error message
  - `state`: Current selected state (if applicable)

### Ticket Browsing Events

#### `Ticket Viewed`
- **When**: User opens a ticket detail screen
- **Properties**:
  - `gameId`: ID of the game being viewed

#### `Tickets Sorted`
- **When**: User changes the sort order in the browse tickets screen
- **Properties**:
  - `sortBy`: Sort method ("value_score", "ev", "hot", "break_even_odds", "win_back_ratio")
  - `state`: Current selected state

### Referral System Events

#### `Referral Shared`
- **When**: User shares the app with friends or posts on social media
- **Properties**:
  - `method`: "native_share" or "social_media_post"
  - `scansEarned`: Number of scans earned (10)

#### `Referral Link Copied`
- **When**: User copies their referral link
- **Properties**:
  - `scansEarned`: Number of scans earned (5)

## User Properties

The following user properties are automatically set:

- `userId`: Unique user ID
- `selectedState`: Current selected state
- `platform`: iOS or Android
- `deviceModel`: Device model
- `deviceBrand`: Device brand
- `osVersion`: OS version

## Super Properties

Super properties are sent with **every event**:

- `platform`: iOS or Android
- `deviceModel`: Device model name
- `deviceBrand`: Device brand
- `osVersion`: Operating system version

## Viewing Your Data

1. Log in to your Mixpanel dashboard
2. Navigate to **Events** to see all tracked events
3. Use **Insights** to create custom reports and funnels
4. Check **Users** to see individual user behavior

## Common Insights to Build

### Scan Conversion Funnel
1. App Opened
2. Scan Started
3. Scan Completed
4. Ticket Viewed

### Referral Effectiveness
- Track `Referral Shared` events by method
- Monitor scans earned vs scans used
- Measure viral coefficient

### Feature Adoption
- Track which sort methods are most popular
- Monitor scan success rate (Scan Started → Scan Completed)
- Measure time between scans

### User Engagement
- Daily/Weekly/Monthly Active Users
- Retention cohorts
- Scan frequency distribution

## Privacy Considerations

- No personally identifiable information (PII) is sent to Mixpanel
- User IDs are randomly generated strings
- Device information is limited to model and OS version
- No location data is collected beyond the state selection
