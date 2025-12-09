
<div align="center">

# Trekky — VijayBhoomi University

[![Platform](https://img.shields.io/badge/Trek%20Platform-Online-6c5ce7?style=for-the-badge&logo=github&logoColor=white)](https://github.com/wrestle-R/Renideers_VijayBhoomiUniversity)
[![Project](https://img.shields.io/badge/University-2025-4ecdc4?style=for-the-badge&logo=university&logoColor=white)]()

</div>


## Technology Stack

<div align="center">

![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-Managed-1db954?style=for-the-badge&logo=expo&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-4.x-646cff?style=for-the-badge&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

</div>

## Overview

This repository contains a web & mobile platform for managing treks and online experiments used by VijayBhoomi University. The project is split into three main parts:

```
Renideers_VijayBhoomiUniversity/
├── app/        # Expo React Native app (participant-facing & mobile UI)
├── backend/    # Node.js + Express API, experiment/trek models and controllers
└── frontend/   # React + Vite admin dashboard / experiment builder UI
```

### Key Features


## Quick Start

### Prerequisites


### Backend

1. Install dependencies:

```bash
cd backend
npm install
```

2. Create a `.env` file in `backend/` with the following variables (example). These are taken from the repository's current `backend/.env` — use these exact names when you create your `.env`:

```env
# Required (based on current backend/.env)
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority
PORT=8000
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
FRONTEND_ORIGIN=http://localhost:5173

# Optional / service credentials (if used in your setup)
# CLOUDINARY_CLOUD_NAME=your_cloud_name
# CLOUDINARY_API_KEY=your_cloudinary_api_key
# CLOUDINARY_API_SECRET=your_cloudinary_api_secret
# FIREBASE_PROJECT_ID=your_firebase_project_id
# FIREBASE_CLIENT_EMAIL=your_firebase_client_email
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

3. Start the backend server (development):

```bash
npm run dev
```

Entry point: `backend/server.js`

### Frontend environment

The frontend uses Vite env variables (prefixed with `VITE_`). Create `frontend/.env` with the following keys (the repository's `frontend/.env` contains these names):

```env
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
```

Keep the `VITE_` prefix — Vite will expose these to the client at build time.

### Frontend (Admin / Dashboard)

1. Install & run:

```bash
cd frontend
npm install
npm run dev
```

2. Open `http://localhost:5173` (default Vite port) to view the admin UI.

### Mobile App (Expo)

1. Install & start:

```bash
cd app
npm install
npm run start
```

2. Use Expo Go or a simulator to open the app.

Environment (Expo)

The Expo app reads public environment values from `process.env` keys referenced in `app/app.config.js` (these are usually provided as `EXPO_PUBLIC_` prefixed variables). Create a `.env` (or set EAS/App config) with the following keys if you run the app locally:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
EXPO_PUBLIC_API_URL=http://localhost:8000
```

Note: `EXPO_PUBLIC_` prefixed variables are exposed to the client and are safe to use for public Firebase config values; keep any server-side secrets out of these variables. For production builds consider using EAS secrets or CI environment variables.

## Project Structure (notable files)


## API Examples

Common endpoints (inspect `backend/routes/` for complete list):

```
POST /api/user/register
POST /api/user/login
GET  /api/experiments/public
POST /api/participants
POST /api/voice-responses
```

## Contributors & Team

This project contributors:

- Russel Daniel Paul (`wrestle-R`) — russeldanielpaul@gmail.com
- Hike-12 (`Hike-12`) — 160257872+Hike-12@users.noreply.github.com
- Gavin Soares (`gavin soares`) — gavinsoares200510@gmail.com
- Shravyacs05 (`shravyacs05`) — 160271791+shravyacs05@users.noreply.github.com


Built with ♥ by Team Renideers.

