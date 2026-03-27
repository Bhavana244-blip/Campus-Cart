# CampusCart 🛒

A complete, mobile-first peer-to-peer reselling marketplace app exclusively for students of SRM Institute of Science and Technology, Kattankulathur (SRM KTR). 

Built with **React Native (Expo)**, **TypeScript**, and **Supabase**.

## 🚀 Features

- **Exclusive Access**: Only accessible via `@srmist.edu.in` email verification.
- **Real-time Chat**: Buyer-seller communication using Supabase Realtime.
- **Smart Search & Filters**: Debounced search and category filtering.
- **Post Listings**: Upload up to 5 images, compressed automatically.
- **Push Notifications**: Receive alerts for messages and buyers' interest.
- **Wishlist**: Save items for later.
- **Secure**: Row-Level Security (RLS) ensures data privacy.

## 🛠 Tech Stack

- **Frontend**: React Native, Expo SDK 51+, Expo Router
- **Backend & DB**: Supabase (PostgreSQL, Realtime, Storage, Auth)
- **State Management**: Zustand
- **Forms & Validation**: React Hook Form, Zod
- **Styling**: React Native StyleSheet, Lucide Icons

---

## 🚦 Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Expo Go app on your phone (or iOS Simulator / Android Emulator)

### 2. Install Dependencies

Navigate to the project and install all dependencies:
```bash
npm install
npx expo install @react-native-async-storage/async-storage expo-image-picker expo-image-manipulator expo-notifications expo-secure-store expo-font lucide-react-native react-hook-form zod @hookform/resolvers/zod zustand @supabase/supabase-js date-fns
```

### 3. Setup Supabase Database

1. Create a new project on [Supabase](https://supabase.com/).
2. Run the SQL schema from `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor to create all tables, policies, and triggers.
3. Enable **Email Auth** in Authentication -> Providers.
4. Create a storage bucket called `listing-images` and make it **Public**.

### 4. Setup Environment Variables

Create a `.env` file in the root directory and add your Supabase credentials:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
EXPO_PUBLIC_APP_SCHEME=campuscart
```

### 5. Deploy Edge Functions (Optional but Recommended)

For email domain validation and push notifications:
```bash
supabase login
supabase link --project-ref your_project_ref
supabase functions deploy validate-srm-email
supabase functions deploy update-conversation
supabase functions deploy send-push-notification
```

### 6. Run the App

Start the Expo development server:
```bash
npm run dev
```

Scan the QR code with the Expo Go app on your phone to launch CampusCart!

---

### 🎨 Design & Assets

- The app uses a modern aesthetic optimized for students.
- Fonts: `Sora` (400, 600, 700)
- Brand Colors: Navy Blue (`#1A3C6E`), Accents (`#FACC15`, `#38BDF8`)

### 🛡 Security

- Row Level Security (RLS) is strictly enforced on all tables.
- Users can only edit or delete their own listings, messages, and wishlists.
- `validate-srm-email` trigger enforces the `@srmist.edu.in` domain at signup.
