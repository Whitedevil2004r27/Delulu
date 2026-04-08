import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// In-memory variable. Note: On Vercel, this may reset if the specific serverless instance spins down, but persists perfectly while warm and during local dev.
let lastBurst = 0;

export function GET() {
    return NextResponse.json({ time: lastBurst });
}

export function POST() {
    lastBurst = Date.now();
    return NextResponse.json({ success: true, time: lastBurst });
}
