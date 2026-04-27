# Echo Client Side

Client application for the **Echo** platform, built with **Expo + React Native + TypeScript**, with support for **Android**, **iOS**, and **Web**. The project includes authentication flows, project discovery, donation tracking, transparency views, and wallet integration for **Sepolia** transactions.

## Overview

The app is designed around three main user profiles:

- **Donors**: sign up, sign in, browse verified projects, track impact, and review donation history.
- **NGOs**: register institutional accounts, present projects and goals, publish updates, and expose transparent progress.
- **Administrators**: approve and verify suppliers, handle community guidelines.

The application also integrates with:

- the **Echo backend API**
- **MetaMask / Web3 wallets**
- **local session persistence**
- a **responsive UI for mobile and web**

## Tech Stack

- **Expo**
- **React Native**
- **React 19**
- **TypeScript**
- **React Navigation**
- **NativeWind + Tailwind CSS**
- **Expo Secure Store**
- **MetaMask SDK**

## Requirements

Before running the project, make sure you have:

- **Node.js** 18 or newer
- **npm** 9 or newer
- **Expo CLI** through `npx expo`

For mobile development, it is also helpful to have:

- **Expo Go** on a physical device
- Android Studio or Xcode for local emulators

## Installation

```bash
npm install
```

## Environment Variables

The application reads the backend base URL from the Expo public environment:

```env
EXPO_PUBLIC_API_URL=http://localhost:5087
```

If the variable is not provided, the app falls back to:

```text
http://localhost:5087
```

## Running the Project

Start the development server:

```bash
npm run start
```

Run on Android:

```bash
npm run android
```

Run on iOS:

```bash
npm run ios
```

Run on the web:

```bash
npm run web
```

## Main Features

- User registration and authentication
- Role selection for donor and NGO flows
- Access token persistence
- Home page with projects and impact metrics
- Project details and goal visualization
- Project update and blog post navigation
- Donation history
- Donation audit timeline
- User profile management
- Wallet integration for Sepolia-based donations

## Application Flows

Main routes are defined in [`App.tsx`](./App.tsx) and [`navigation/types.ts`](./navigation/types.ts).

Core navigation flow:

1. `Signup`
2. `RoleDetails`
3. `SignupCompleted`
4. `Signin`
5. `AppHome`
6. `ProjectDetails`
7. `DonationDetails`
8. `DonationHistory`
9. `DonationTimeline`
10. `Profile`

## Project Structure

```text
.
├── assets/                    # Images, icons, and branding assets
├── components/                # Reusable UI components
│   ├── common/
│   ├── form/
│   ├── home/
│   ├── layout/
│   ├── project-details/
│   └── signup/
├── navigation/                # Navigation types and route contracts
├── pages/                     # Screen-level components
├── services/                  # API, auth, and wallet integrations
├── stores/                    # Lightweight global state
├── types/                     # Domain and API typings
├── App.tsx                    # Main app entry and navigation setup
├── app.json                   # Expo configuration
├── global.css                 # Tailwind / NativeWind base directives
└── package.json
```

## Architecture

### UI Layer

Screen components live under [`pages/`](./pages) and are composed from smaller reusable pieces under [`components/`](./components).

### Navigation

The app uses **React Navigation** with a native stack navigator. Route params and screen contracts are centralized in [`navigation/types.ts`](./navigation/types.ts).

### User State

Authenticated user state is stored in memory in [`stores/userStore.ts`](./stores/userStore.ts), using `useSyncExternalStore`.

### Session Persistence

The access token is stored in:

- **Web**: `localStorage`
- **Mobile**: `expo-secure-store`

Implementation lives in [`services/authStorage.ts`](./services/authStorage.ts).

### API Integration

All backend communication is centralized in [`services/ApiService.ts`](./services/ApiService.ts), which encapsulates:

- authentication handling
- URL construction
- request headers
- payload serialization
- API error normalization

The app-level client instance is defined in [`services/apiClient.ts`](./services/apiClient.ts).

### Wallet Integration

Wallet donation logic is split by platform:

- [`services/donationWallet.web.ts`](./services/donationWallet.web.ts)
- [`services/donationWallet.native.ts`](./services/donationWallet.native.ts)

The donation flow includes wallet connection, address validation, and transaction submission to the **Sepolia** network.

## Visual System

The project uses:

- `NativeWind`
- `Tailwind CSS`
- `global.css` with base directives

Most styling is implemented through utility classes directly in components and screens.

## Available Scripts

```json
{
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web"
}
```

## Recommended Development Practices

- Add new HTTP calls through `ApiService`
- Keep navigation contracts in `navigation/types.ts`
- Reuse shared UI through `components/common` and `components/layout`
- Avoid spreading business logic across screen files
- Preserve consistency between web and mobile flows

## Notes

- The project runs with **Expo New Architecture** enabled.
- Most authenticated flows depend on the Echo backend being available.
- Wallet-related features require a compatible MetaMask / Web3 environment.

## Recommended Next Steps

- Add automated tests
- Define linting and formatting standards
- Document deployment workflows
- Add an `.env.example`
- Include screenshots or usage examples

## License

No license has been defined for this repository yet.
