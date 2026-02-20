/**
 * Pulse Tracker — Supabase Edge Function: ingest-health-data
 *
 * Called by Apple Shortcuts to POST HealthKit data.
 * Deploy with: supabase functions deploy ingest-health-data
 *
 * Expects JSON body (all fields optional except `date`):
 * {
 *   "date": "2025-02-19",           // required YYYY-MM-DD
 *   "hrv_ms": 65.2,                 // overnight HRV
 *   "rhr_bpm": 52,                  // resting heart rate
 *   "sleep_hours": 7.5,             // total sleep
 *   "sleep_quality": 4,             // 1-5 subjective
 *   "steps": 8500,                  // step count (stored in notes)
 *   "calories_burned": 2800,        // active calories
 *   "hr_samples": [                 // raw HR readings
 *     { "timestamp": "2025-02-19T06:00:00Z", "bpm": 58, "context": "resting" }
 *   ],
 *   "secret": "YOUR_SECRET_TOKEN"   // simple auth
 * }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SHARED_SECRET = Deno.env.get('INGEST_SECRET') ?? 'changeme';

Deno.serve(async (req: Request) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }

    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return json({ error: 'Invalid JSON' }, 400);
    }

    // Simple shared-secret auth
    if (body.secret !== SHARED_SECRET) {
        return json({ error: 'Unauthorized' }, 401);
    }

    const { date, hrv_ms, rhr_bpm, sleep_hours, sleep_quality, hr_samples } = body as {
        date: string;
        hrv_ms?: number;
        rhr_bpm?: number;
        sleep_hours?: number;
        sleep_quality?: number;
        hr_samples?: Array<{ timestamp: string; bpm: number; context?: string }>;
    };

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return json({ error: '`date` is required (YYYY-MM-DD)' }, 400);
    }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const results: Record<string, unknown> = {};

    // 1. Upsert daily summary fields
    const summaryPatch: Record<string, unknown> = { date, updated_at: new Date().toISOString() };
    if (hrv_ms !== undefined) summaryPatch.hrv_ms = hrv_ms;
    if (rhr_bpm !== undefined) summaryPatch.rhr_bpm = rhr_bpm;
    if (sleep_hours !== undefined) summaryPatch.sleep_hours = sleep_hours;
    if (sleep_quality !== undefined) summaryPatch.sleep_quality = sleep_quality;

    const { error: summaryErr } = await supabase
        .from('daily_summaries')
        .upsert(summaryPatch, { onConflict: 'date' });
    results.summary = summaryErr ? summaryErr.message : 'ok';

    // 2. Insert HRV reading if provided
    if (hrv_ms !== undefined) {
        const { error: hrvErr } = await supabase.from('hrv_readings').insert({
            date,
            timestamp: new Date().toISOString(),
            hrv_ms,
            type: 'sdnn',
        });
        results.hrv = hrvErr ? hrvErr.message : 'ok';
    }

    // 3. Insert HR samples if provided
    if (Array.isArray(hr_samples) && hr_samples.length > 0) {
        const rows = hr_samples.map((s) => ({
            date,
            timestamp: s.timestamp,
            bpm: s.bpm,
            context: s.context ?? 'active',
        }));
        const { error: hrErr } = await supabase.from('heart_rate_samples').insert(rows);
        results.hr_samples = hrErr ? hrErr.message : `inserted ${rows.length}`;
    }

    return json({ success: true, date, results }, 200);
});

function json(body: unknown, status: number) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
    });
}
