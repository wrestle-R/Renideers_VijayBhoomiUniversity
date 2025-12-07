# 🚀 Quick Start Commands

## Run the App
```bash
cd app
npm start
```

## Test Authentication
1. Press `w` for web browser
2. You'll see the login/signup screen (auth required!)
3. Create an account or login
4. Check the console for user data logs
5. App redirects to home screen after successful auth
6. Click "Logout" button on home screen to test logout

## Console Output to Watch For

### On Login/Signup:
```
🔄 Syncing with backend... { uid: "...", email: "..." }
✅ Backend response: { _id: "...", fullName: "...", ... }
💾 User saved to AsyncStorage: { fullName: "...", ... }
✅ Logged in successfully!
```

### On App Load:
```
💾 User loaded from AsyncStorage: { fullName: "...", ... }
🔐 Auth state changed: user@example.com
👤 Current User Info: { fullName, email, firebase_id, mongo_uid, photoUrl }
```

### On Logout:
```
✅ Logged out
```

## Verify Backend Connection

Make sure backend is running:
```bash
cd backend
npm start
```

Backend should be at: `http://43.247.139.25:8000`

## Check User Data

Open console in your browser/simulator and you'll see:
- User object logged on every render
- All auth operations with emojis
- Full user details from MongoDB

## File Locations

- **Auth Screen**: `app/app/auth.tsx`
- **Auth Context**: `app/context/AuthContext.tsx`
- **Firebase Config**: `app/lib/firebase.ts`
- **Home Screen**: `app/app/(tabs)/index.tsx`
- **Theme**: `app/constants/theme.ts`
- **Environment**: `app/.env`

## Quick Debug

If something doesn't work:
1. Check console for error messages (with ❌ emoji)
2. Verify backend is running
3. Check `.env` file has correct credentials
4. Restart Metro bundler: `r` in terminal

## Auth Flow Summary

1. App starts → Checks AsyncStorage
2. No user → `/auth` screen
3. Login/Signup → Firebase + Backend sync
4. Save to AsyncStorage
5. Navigate to `/(tabs)`
6. Access all protected screens
7. Logout → Clear storage → Back to `/auth`

---

**Everything is set up and ready! Just run `npm start` and test it out! 🎉**
