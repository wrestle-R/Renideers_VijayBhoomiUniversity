
<div align="center">

# Renideers — VijayBhoomi University

[![Platform](https://img.shields.io/badge/Trek%20Platform-Online-6c5ce7?style=for-the-badge&logo=github&logoColor=white)](https://github.com/wrestle-R/Renideers_VijayBhoomiUniversity)
[![Project](https://img.shields.io/badge/University-2025-4ecdc4?style=for-the-badge&logo=university&logoColor=white)]()

</div>

---

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

- Trek & experiment creation, scheduling and management
- Participant-facing experiment runner with precise timing
- Secure user authentication via Firebase
- Media uploads (images/audio) with Cloudinary integration
- Admin dashboard for analytics, participants and content

## Quick Start

### Prerequisites

- Node.js v18+ and npm
- MongoDB (local or Atlas)
- Firebase project (Auth / service account)
- Optional: Cloudinary for media uploads

### Backend

1. Install dependencies:

```bash
cd backend
npm install
```

2. Create a `.env` file in `backend/` with the following variables (example):

```env
PORT=8000
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

3. Start the backend server (development):

```bash
npm run dev
```

Entry point: `backend/server.js`

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

## Project Structure (notable files)

- `backend/server.js` — Express app, middleware and route mounting
- `backend/controllers/` — controllers for treks, users, participants
- `backend/models/` — Mongoose models (Trek, User, Participant, etc.)
- `backend/routes/` — grouped API routes
- `frontend/src/` — React pages and UI components
- `app/` — Expo project (screens, navigation, assets)

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

This project contributors (from git history):

- Russel Daniel Paul (`wrestle-R`) — russeldanielpaul@gmail.com
- Hike-12 (`Hike-12`) — 160257872+Hike-12@users.noreply.github.com
- Gavin Soares (`gavin soares`) — gavinsoares200510@gmail.com
- Shravyacs05 (`shravyacs05`) — 160271791+shravyacs05@users.noreply.github.com

If you'd like a different display name or to add more people, update this file or open a PR.

## Next Steps (suggested)

- Add `backend/.env.example` and `frontend/.env.example` with placeholders (safe to commit)
- Add API documentation (OpenAPI / Swagger) under `backend/docs`
- Add CI (GitHub Actions) to run lint/tests on PRs

## Support

Open an issue or contact the maintainers via GitHub for support.

---

Built with ♥ by the project contributors.

