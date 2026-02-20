# Apple Shortcuts Setup Guide — Pulse Tracker

## Prerequisites
- Supabase Edge Function is deployed at:
  `https://xcsoupiwitsbpfciqnto.functions.supabase.co/ingest-health-data`
- Your secret token: `pulse-sync-2026`

---

## Quick Setup (Simplest Version)

### 1. Create a New Shortcut
Open **Shortcuts** → tap **+** → name it **"Pulse Sync"**

### 2. Add "Get Contents of URL" Action
- **URL:** `https://xcsoupiwitsbpfciqnto.functions.supabase.co/ingest-health-data`
- **Method:** POST
- **Headers:** Content-Type → `application/json`
- **Request Body:** JSON

### 3. Add These JSON Fields
| Type | Key | Value |
|------|-----|-------|
| Text | `secret` | `pulse-sync-2026` |
| Text | `rhr_bpm` | Your resting HR (e.g., `55`) |
| Text | `sleep_hours` | Hours slept (e.g., `7.5`) |

> **Note:** The `date` field is **optional** — the server auto-defaults to today's date.

### 4. Save & Test
Tap the ▶ Play button. You should see a JSON response:
```json
{ "success": true, "date": "2026-02-20", "results": { "summary": "ok" } }
```

---

## Automate It (Daily at 7am)

1. Go to **Shortcuts → Automation → +**
2. Select **Time of Day** → set to **7:00 AM** → **Daily**
3. Toggle **Run Immediately** (turn off "Notify When Run")
4. Tap **Run Shortcut** → pick your "Pulse Sync" shortcut
5. **Done** — data syncs every morning automatically

---

## Coospo H9Z Setup

When your chest strap arrives:

1. **Pair via Bluetooth:** iPhone Settings → Bluetooth → find "CooSpo H9Z" → Pair
2. **Verify in Health:** Open Apple Health → Browse → Heart → you should see data from the Coospo
3. **During workouts:** The chest strap sends HR data to Apple Health automatically while paired
4. **Shortcut pulls from Health:** You can upgrade the Shortcut later to query HealthKit for workout HR data

The Coospo pairs with your iPhone just like any Bluetooth accessory. Once paired, all heart rate data flows to Apple Health automatically — no extra app needed.

---

## Available API Fields

The Edge Function accepts any combination of these fields:

| Field | Type | Description |
|-------|------|-------------|
| `secret` | string | **Required.** Auth token |
| `date` | string | Optional. YYYY-MM-DD (defaults to today) |
| `hrv_ms` | number | Heart rate variability in ms |
| `rhr_bpm` | number | Resting heart rate |
| `sleep_hours` | number | Hours of sleep |
| `sleep_quality` | number | 1-5 subjective rating |
| `hr_samples` | array | `[{ timestamp, bpm, context }]` |
