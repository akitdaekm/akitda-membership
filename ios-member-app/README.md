# AKITDA Ernakulam Member — iOS App (SwiftUI)

Native iOS (iOS 16+) companion app for AKITDA Ernakulam members, matching the Android member app and connecting directly to `https://akitdaekm.com`.

## Features
- **OTP Sign In** (Mobile, Email, or Membership ID) with iOS Keychain token persistence.
- **Join Now / Registration** (New & Existing/Renewal, all 31 Ernakulam units, GST certificate PDF/Image upload, partner photos).
- **Home Tab:** Direct **Membership Certificate PDF** download & QuickLook preview/share (Digital ID disabled), UTR payment submission for approved members, and Membership Details (without the Approvals row).
- **Payments Tab:** Payment history and direct **Official Receipt PDF** download & QuickLook preview/share.
- **Profile Tab:**
  - Profile photo display & OTP-verified photo upload/change.
  - Company & Address details with **OTP-verified editing**.
  - **GST Certificate preview** & update (OTP-verified for existing members).
  - **Partners / Proprietor** list with photos & OTP-verified photo upload/update.
  - Direct **Support Email** (`support@akitdaekm.com`) for reporting certificate or app issues.

## Building & Publishing on macOS
1. Copy or clone the repository on a Mac with **Xcode 15+** installed.
2. Open `ios-member-app/AKITDAMember.xcodeproj` in Xcode.
3. Select the **AKITDAMember** target → **Signing & Capabilities**:
   - Choose your **Apple Developer Team**.
   - Update Bundle Identifier if needed (default: `com.akitda.member`).
4. Select an iOS Simulator or connected iPhone and press **Run (`Cmd + R`)** to test.
5. For TestFlight / App Store: **Product → Archive**, then distribute via **Xcode Organizer**.
