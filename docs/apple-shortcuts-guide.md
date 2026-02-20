# Apple Shortcuts Setup Guide — Pulse Tracker

## Prerequisites
- Your Supabase Edge Function must be deployed (see [walkthrough.md](walkthrough.md))
- You need your **Edge Function URL** and **secret token**

---

## Shortcut 1: Morning Sync 🌅

This shortcut sends overnight health data to Pulse when you open the app each morning.

### Steps in the Shortcuts App

1. Open **Shortcuts** on your iPhone → tap **+** → name it **"Pulse Morning Sync"**

2. Add action: **Find Health Samples**
   - Type: `Heart Rate Variability`
   - Start Date: `Start of Today` minus `8 hours`
   - Sort by: `Date` → `Latest First` → Limit: `1`
   - Save to variable: `HRV`

3. Add action: **Find Health Samples**
   - Type: `Resting Heart Rate`
   - Start Date: `Start of Today` minus `8 hours`
   - Sort by: `Date` → `Latest First` → Limit: `1`
   - Save to variable: `RHR`

4. Add action: **Find Health Samples**
   - Type: `Sleep Analysis`
   - Start Date: `Start of Today` minus `24 hours`
   - Sort by: `Date` → `Latest First` → Limit: `1`
   - Save to variable: `Sleep`

5. Add action: **Get Contents of URL**
   - URL: `https://YOUR_PROJECT.supabase.co/functions/v1/ingest-health-data`
   - Method: **POST**
   - Headers: `Content-Type` = `application/json`
   - Request Body: **JSON**
     ```
     {
       "date": [Current Date, format: yyyy-MM-dd],
       "hrv_ms": [HRV variable → Value],
       "rhr_bpm": [RHR variable → Value],
       "sleep_hours": [Sleep variable → Duration in Hours],
       "secret": "your-secret-token"
     }
     ```

---

## Shortcut 2: Workout Sync 🏋️

Sends today's workout data to Pulse.

### Steps

1. **Shortcuts** → **+** → name **"Pulse Workout Sync"**

2. **Find Health Samples**
   - Type: `Workouts`
   - Start Date: `Start of Today`
   - Sort by: `End Date` → `Latest First` → Limit: `1`
   - Save to variable: `Workout`

3. **Find Health Samples**
   - Type: `Heart Rate`
   - Start Date: [Workout Start Date]
   - End Date: [Workout End Date]
   - Save to variable: `WorkoutHR`

4. **Get Contents of URL**
   - URL: `https://YOUR_PROJECT.supabase.co/functions/v1/ingest-health-data`
   - Method: **POST**
   - Body:
     ```
     {
       "date": [Current Date, format: yyyy-MM-dd],
       "hr_samples": [
         { "timestamp": [HR timestamp], "bpm": [HR value], "context": "workout" }
       ],
       "secret": "your-secret-token"
     }
     ```

---

## Automation: Auto-Sync on App Open

This makes everything happen automatically — zero taps required!

1. Open **Shortcuts** → go to **Automation** tab
2. Tap **+** → **Create Personal Automation**
3. Choose: **App** → select **Pulse** (your PWA from home screen)
4. Choose: **Is Opened**
5. Add action: **Run Shortcut** → select **"Pulse Morning Sync"**
6. (Optional) Add: **Run Shortcut** → **"Pulse Workout Sync"**
7. Turn OFF **"Ask Before Running"**
8. Tap **Done**

Now every time you open Pulse from your home screen, your health data syncs automatically! 🚀

---

## Testing

1. Open the Shortcuts app
2. Tap your **"Pulse Morning Sync"** shortcut to run it manually
3. Open Pulse in your browser → check if today's HRV, RHR, and sleep data appear
4. If you get an error, check:
   - Is the Edge Function URL correct?
   - Is the secret token matching?
   - Are Health permissions granted? (Settings → Shortcuts → Health)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Health access denied" | Settings → Privacy → Health → Shortcuts → enable all |
| "Network error" | Check your Supabase project is running + URL is correct |
| "Unauthorized" | Make sure `secret` in shortcuts matches `INGEST_SECRET` env var |
| No HRV data | Your watch must be worn overnight for HRV readings |
| No sleep data | Enable Sleep Tracking in the Watch app |
