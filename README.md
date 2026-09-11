# burgerTime

I'll gladly pay you Tuesday for a hamburger today

## Local development (Google sign-in)

1. **Environment** — Copy `.env.example` to `.env.local` (or use `.env`) with your Firebase web app config. `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` must be `YOUR_PROJECT_ID.firebaseapp.com`, not `localhost`. Restart `yarn dev` after changing env vars.

2. **Firebase Console** — [Authentication → Settings → Authorized domains](https://console.firebase.google.com/): ensure **`localhost`** is listed (it usually is by default).

3. **Google Cloud OAuth** — [APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials) → your **Web client** (auto-created for Firebase): under **Authorized JavaScript origins**, add:
   - `http://localhost:3000`
   - If Next uses another port (e.g. `3001`), add that origin too.

4. **Use the same host as OAuth** — Open `http://localhost:3000` (not `127.0.0.1` unless you also add it in Google OAuth).

5. **Sign-in method** — Firebase → Authentication → Sign-in method → **Google** enabled.

6. **Popups** — Local sign-in uses a Google popup on Chrome/Firefox. If it closes immediately, allow popups for localhost and check OAuth origins (step 3). Safari uses full-page redirect.

If sign-in still fails, check the browser console for `auth/...` codes; the Login button also shows a short hint for common errors.
