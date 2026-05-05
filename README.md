# Fridge Memory

A mobile-first household food memory app for tracking what is in the fridge, freezer, pantry, and other storage. The MVP focuses on fast repeat entry, optional expiry tracking, desired stock reminders, grocery list handoff, household sharing, and barcode-linked household reuse.

## Tech Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Firebase Auth
- Cloud Firestore
- Optional Open Food Facts lookup for barcode autofill
- Vercel-ready static deployment

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Fill in `.env.local` with your Firebase web app values.

4. Start development:

   ```bash
   npm run dev
   ```

5. Build for production:

   ```bash
   npm run build
   ```

## Environment Variables

The app reads Firebase config from Vite environment variables:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Firebase Setup

Enable these Firebase services:

- Authentication
- Email/password sign-in
- Google sign-in if you want the Google button enabled
- Cloud Firestore

Firestore rules live in `firestore.rules`.

Deploy rules with:

```bash
firebase deploy --only firestore:rules
```

MVP rule assumptions:

- Users can read and update their own `users/{uid}` document.
- Household members can read/write scoped household inventory, library, grocery, and barcode index data.
- Household owners manage household settings and member records.
- `barcodeCache`, `normalizedProducts`, and raw Open Food Facts responses are client-writable for MVP speed; long term these writes should move behind Cloud Functions.

## Main Features

- Firebase sign-in and user document creation
- First household onboarding
- Multiple household creation and switching
- Invite-link household join flow
- Mobile dashboard with expired, expiring, Buy Soon, grocery, and inventory summaries
- Inventory search and filters by location and expiry status
- Expired item actions: consumed, discarded, extend expiry, keep for now
- Low-friction Add flow with recent/favorite templates before manual entry
- Optional expiry presets with visible "No expiry"
- Percentage and count quantity modes
- Save and Add Another flow
- Household item library with remembered defaults, favorites, desired stock rules, and barcode links
- First-time bulk setup for existing stock
- Desired-stock Buy Soon calculation
- Grocery list with manual add, Buy Soon import, check/uncheck, and delete
- Barcode lookup priority: household barcode index, household templates, barcode cache, optional Open Food Facts, then manual fallback

## Routes

- `/login`
- `/onboarding`
- `/dashboard`
- `/inventory`
- `/add`
- `/bulk-setup`
- `/buy-soon`
- `/grocery`
- `/library`
- `/households`
- `/households/:householdId/settings`
- `/invite/:inviteCode`
- `/item/:itemId`

## Data Model Summary

Core collections:

- `users/{userId}`
- `households/{householdId}`
- `households/{householdId}/members/{userId}`
- `households/{householdId}/inventoryItems/{itemId}`
- `households/{householdId}/householdItemLibrary/{templateId}`
- `households/{householdId}/groceryListItems/{groceryItemId}`
- `households/{householdId}/barcodeProductIndex/{barcode}`
- `barcodeCache/{barcode}`
- `rawOpenFoodFactsResponses/{responseId}`
- `normalizedProducts/{normalizedProductId}`

Future-ready only, with no MVP UI:

- `publicItemLibrary/{publicItemId}`
- `pendingPublicSubmissions/{submissionId}`
- `adminUsers/{userId}`

## Vercel Deployment Notes

1. Build command: `npm run build`
2. Output directory: `dist`
3. Add the same `VITE_FIREBASE_*` variables in Vercel project settings.
4. Deploy Firestore rules separately with the Firebase CLI.

## Known Limitations

- No receipt OCR, photo recognition, voice input, nutrition tracking, price tracking, meal planning, push notifications, or reminder emails.
- Barcode camera scanning uses browser `BarcodeDetector` when available; manual barcode entry is always available.
- Open Food Facts is best-effort only and is not the source of truth.
- Client-side Firestore writes for shared barcode cache and normalized products are acceptable for MVP testing but should move to server validation before larger public launch.
- Full data-access verification requires a real Firebase project and deployed rules.

## Future Phases

- Cloud Functions for invite, barcode cache, and Open Food Facts validation
- More robust barcode scanner fallback library for browsers without `BarcodeDetector`
- Optional convert grocery item to inventory after purchase
- Public item library and admin approval workflow
- Test suite covering services, rules, and critical UI flows
